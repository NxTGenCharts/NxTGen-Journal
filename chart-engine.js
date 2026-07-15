/* ============================================================
   BACKTEST LAB — CHART ENGINE
   Canvas-based candlestick renderer with pan/zoom/crosshair.
   Coordinate system: all chart objects (candles, drawings) are
   stored in DATA SPACE as {time, price}. The viewport converts
   data space -> screen space every frame, so pan/zoom never
   touches the underlying data or any drawing object.

   This is intentionally decoupled from any specific data source
   or drawing-tool implementation (see drawing-tools.js) so the
   renderer here can later be swapped for the real TradingView
   Charting Library without rewriting the tools/replay/order layers
   built on top of it.
   ============================================================ */

class ChartEngine {
  constructor(container, opts = {}) {
    this.container = container;
    this.opts = Object.assign({
      candleWidth: 8,
      candleGap: 3,
      priceAxisWidth: 78,
      timeAxisHeight: 28,
      bg: '#080b12',
      grid: 'rgba(255,255,255,0.045)',
      textColor: 'rgba(148,163,184,0.75)',
      upColor: '#34d399',
      downColor: '#f87171',
      wickUp: '#34d399',
      wickDown: '#f87171',
      crosshair: 'rgba(148,163,184,0.55)',
    }, opts);

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'bl-chart-canvas';
    this.ctx = this.canvas.getContext('2d');
    container.appendChild(this.canvas);

    this.dpr = window.devicePixelRatio || 1;

    // data: array of {t (ms epoch), o,h,l,c,v}. Sorted ascending by t.
    this.data = [];
    // visible window, in candle-index space
    this.offset = 0;        // index of leftmost visible candle (can be fractional for smooth pan)
    this.candleW = this.opts.candleWidth + this.opts.candleGap;
    this.priceTop = 1; this.priceBottom = 0; // auto price scale unless locked
    this.autoScale = true;
    this.logScale = false;

    this.crosshairX = null;
    this.crosshairY = null;
    this.onCrosshair = null; // callback(candle, x, y)

    // pluggable layers: anything with render(ctx) / onMouseDown(e) / onMouseMove(e,rect)
    // / onMouseUp(e) / onClick(e) / onDblClick(e). Mouse-down/click/dblclick handlers
    // return true to "consume" the event (stops chart pan and further layers).
    this.layers = [];

    // replay: candles beyond this index are hidden (null = show all)
    this.replayCursor = null;

    this._bindEvents();
    this._resizeObserver = new ResizeObserver(() => this.resize());
    this._resizeObserver.observe(container);
    this.resize();
  }

  // ---------- data ----------
  setData(candles) {
    this.data = candles;
    this.offset = Math.max(0, this.visibleCount() ? this.data.length - this.visibleCount() : 0);
    this.replayCursor = null;
    this.render();
  }

  visibleCandles() {
    const end = this.replayCursor != null ? Math.min(this.replayCursor, this.data.length) : this.data.length;
    return this.data.slice(0, end);
  }

  visibleCount() {
    const w = this.canvas.clientWidth - this.opts.priceAxisWidth;
    return Math.max(1, Math.floor(w / this.candleW));
  }

  // ---------- viewport ----------
  resize() {
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = Math.max(1, rect.width * this.dpr);
    this.canvas.height = Math.max(1, rect.height * this.dpr);
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.render();
  }

  indexToX(i) {
    return (i - this.offset) * this.candleW + this.candleW / 2;
  }
  xToIndex(x) {
    return Math.round(this.offset + x / this.candleW - 0.5);
  }
  priceToY(p) {
    const h = this.canvas.clientHeight - this.opts.timeAxisHeight;
    if (this.logScale) {
      const lo = Math.log(Math.max(this.priceBottom, 1e-9)), hi = Math.log(Math.max(this.priceTop, 1e-9));
      return h - ((Math.log(Math.max(p, 1e-9)) - lo) / (hi - lo)) * h;
    }
    const range = this.priceTop - this.priceBottom || 1;
    return h - ((p - this.priceBottom) / range) * h;
  }
  yToPrice(y) {
    const h = this.canvas.clientHeight - this.opts.timeAxisHeight;
    const range = this.priceTop - this.priceBottom || 1;
    if (this.logScale) {
      const lo = Math.log(Math.max(this.priceBottom, 1e-9)), hi = Math.log(Math.max(this.priceTop, 1e-9));
      return Math.exp(lo + (1 - y / h) * (hi - lo));
    }
    return this.priceBottom + (1 - y / h) * range;
  }
  timeToIndex(t) {
    // nearest candle index for a given timestamp (used by drawing tools)
    if (!this.data.length) return 0;
    let lo = 0, hi = this.data.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.data[mid].t < t) lo = mid + 1; else hi = mid;
    }
    return lo;
  }

  _autoFitPrice() {
    if (!this.autoScale) return;
    const vis = this.visibleCandles();
    const startIdx = Math.max(0, Math.floor(this.offset));
    const endIdx = Math.min(vis.length, Math.ceil(this.offset + this.visibleCount()) + 1);
    let lo = Infinity, hi = -Infinity;
    for (let i = startIdx; i < endIdx; i++) {
      const c = vis[i]; if (!c) continue;
      if (c.l < lo) lo = c.l;
      if (c.h > hi) hi = c.h;
    }
    if (!isFinite(lo) || !isFinite(hi)) { lo = 0; hi = 1; }
    const pad = (hi - lo) * 0.12 || hi * 0.01 || 1;
    this.priceTop = hi + pad;
    this.priceBottom = lo - pad;
  }

  panByPixels(dx) { this.offset -= dx / this.candleW; this.clampOffset(); this.render(); }
  clampOffset() {
    const vc = this.visibleCount();
    this.offset = Math.max(-vc * 0.3, Math.min(this.offset, Math.max(0, this.data.length - vc * 0.7)));
  }
  zoom(factor, aroundX) {
    const idx = this.xToIndex(aroundX ?? (this.canvas.clientWidth - this.opts.priceAxisWidth) / 2);
    this.candleW = Math.max(2, Math.min(60, this.candleW * factor));
    this.offset = idx - (aroundX ?? 0) / this.candleW;
    this.clampOffset();
    this.render();
  }

  // ---------- layers ----------
  addLayer(layer) { this.layers.push(layer); return layer; }

  // ---------- events ----------
  _bindEvents() {
    let dragging = false, lastX = 0, lastY = 0;
    this.canvas.addEventListener('mousedown', (e) => {
      for (const l of this.layers) if (l.onMouseDown && l.onMouseDown(e)) return;
      dragging = true; lastX = e.clientX; lastY = e.clientY;
    });
    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.crosshairX = e.clientX - rect.left;
      this.crosshairY = e.clientY - rect.top;
      for (const l of this.layers) if (l.onMouseMove) l.onMouseMove(e, rect);
      if (dragging) {
        this.panByPixels(e.clientX - lastX);
        lastX = e.clientX; lastY = e.clientY;
      } else {
        this.render();
      }
      if (this.onCrosshair && this.crosshairX < this.canvas.clientWidth - this.opts.priceAxisWidth) {
        const idx = this.xToIndex(this.crosshairX);
        const vis = this.visibleCandles();
        this.onCrosshair(vis[idx] || null, this.crosshairX, this.crosshairY, this.yToPrice(this.crosshairY));
      }
    });
    window.addEventListener('mouseup', (e) => { dragging = false; for (const l of this.layers) if (l.onMouseUp) l.onMouseUp(e); });
    this.canvas.addEventListener('mouseleave', () => { this.crosshairX = null; this.crosshairY = null; this.render(); });
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      this.zoom(e.deltaY < 0 ? 1.08 : 0.92, e.clientX - rect.left);
    }, { passive: false });
    this.canvas.addEventListener('click', (e) => { for (const l of this.layers) if (l.onClick && l.onClick(e)) return; });
    this.canvas.addEventListener('dblclick', (e) => { for (const l of this.layers) if (l.onDblClick && l.onDblClick(e)) return; });
  }

  // ---------- rendering ----------
  render() {
    const ctx = this.ctx, dpr = this.dpr;
    const W = this.canvas.clientWidth, H = this.canvas.clientHeight;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = this.opts.bg;
    ctx.fillRect(0, 0, W, H);

    this._autoFitPrice();
    const plotW = W - this.opts.priceAxisWidth;
    const plotH = H - this.opts.timeAxisHeight;

    this._drawGrid(ctx, plotW, plotH);
    this._drawCandles(ctx, plotH);
    for (const l of this.layers) if (l.render) l.render(ctx);
    this._drawAxes(ctx, plotW, plotH, W, H);
    this._drawCrosshair(ctx, plotW, plotH);
  }

  _drawGrid(ctx, plotW, plotH) {
    ctx.strokeStyle = this.opts.grid; ctx.lineWidth = 1;
    for (let i = 0; i <= 6; i++) {
      const y = (plotH / 6) * i + 0.5;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(plotW, y); ctx.stroke();
    }
    for (let i = 0; i <= 8; i++) {
      const x = (plotW / 8) * i + 0.5;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, plotH); ctx.stroke();
    }
  }

  _drawCandles(ctx, plotH) {
    const vis = this.visibleCandles();
    const startIdx = Math.max(0, Math.floor(this.offset) - 1);
    const endIdx = Math.min(vis.length, Math.ceil(this.offset + this.visibleCount()) + 2);
    const bw = Math.max(1, this.opts.candleWidth * (this.candleW / (this.opts.candleWidth + this.opts.candleGap)));

    for (let i = startIdx; i < endIdx; i++) {
      const c = vis[i]; if (!c) continue;
      const x = this.indexToX(i);
      const up = c.c >= c.o;
      ctx.strokeStyle = up ? this.opts.wickUp : this.opts.wickDown;
      ctx.fillStyle = up ? this.opts.upColor : this.opts.downColor;
      ctx.lineWidth = 1;
      const yH = this.priceToY(c.h), yL = this.priceToY(c.l);
      ctx.beginPath(); ctx.moveTo(x, yH); ctx.lineTo(x, yL); ctx.stroke();
      const yO = this.priceToY(c.o), yC = this.priceToY(c.c);
      const top = Math.min(yO, yC), h = Math.max(1, Math.abs(yC - yO));
      ctx.fillRect(x - bw / 2, top, bw, h);
    }
  }

  _drawAxes(ctx, plotW, plotH, W, H) {
    ctx.fillStyle = 'rgba(8,11,18,0.0)';
    ctx.strokeStyle = this.opts.grid;
    ctx.beginPath(); ctx.moveTo(plotW + 0.5, 0); ctx.lineTo(plotW + 0.5, plotH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, plotH + 0.5); ctx.lineTo(W, plotH + 0.5); ctx.stroke();

    ctx.fillStyle = this.opts.textColor;
    ctx.font = '11px -apple-system, "Plus Jakarta Sans", sans-serif';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 6; i++) {
      const y = (plotH / 6) * i;
      const p = this.yToPrice(y);
      ctx.fillText(this._fmtPrice(p), plotW + 8, y === 0 ? 8 : y);
    }

    const vis = this.visibleCandles();
    ctx.textBaseline = 'top';
    const step = Math.max(1, Math.round(60 / this.candleW));
    for (let i = Math.max(0, Math.floor(this.offset)); i < vis.length; i += step) {
      const x = this.indexToX(i);
      if (x < 0 || x > plotW) continue;
      const c = vis[i]; if (!c) continue;
      const d = new Date(c.t);
      const label = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
      ctx.fillText(label, x - 14, plotH + 8);
    }
  }

  _drawCrosshair(ctx, plotW, plotH) {
    if (this.crosshairX == null || this.crosshairX > plotW) return;
    ctx.strokeStyle = this.opts.crosshair;
    ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(this.crosshairX + 0.5, 0); ctx.lineTo(this.crosshairX + 0.5, plotH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, this.crosshairY + 0.5); ctx.lineTo(plotW, this.crosshairY + 0.5); ctx.stroke();
    ctx.setLineDash([]);

    const price = this.yToPrice(this.crosshairY);
    ctx.fillStyle = '#60a5fa';
    const label = this._fmtPrice(price);
    ctx.font = '11px monospace';
    const tw = ctx.measureText(label).width + 12;
    ctx.fillRect(plotW, this.crosshairY - 9, tw, 18);
    ctx.fillStyle = '#0a0e16';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, plotW + 6, this.crosshairY);
  }

  _fmtPrice(p) {
    if (p >= 1000) return p.toFixed(1);
    if (p >= 10) return p.toFixed(3);
    return p.toFixed(5);
  }

  // ---------- replay ----------
  setReplayCursor(idx) { this.replayCursor = idx; this.render(); }
}

/* ============================================================
   SYNTHETIC DATA GENERATOR
   Stand-in for a real historical-data feed. Deterministic per
   symbol so replay is reproducible. Replace fetchCandles() with
   a call to your Supabase-stored history / broker feed later —
   everything downstream (engine, tools, replay) is agnostic to
   where candles came from.
   ============================================================ */
function seededRandom(seed) {
  let s = seed % 2147483647; if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function generateCandles(symbol, timeframe, count = 500, basePrice = null) {
  const tfMs = { '1m': 60e3, '5m': 300e3, '15m': 900e3, '30m': 1800e3, '1H': 3600e3, '4H': 14400e3, '1D': 86400e3 };
  const step = tfMs[timeframe] || 3600e3;
  let seed = 0; for (const ch of symbol) seed += ch.charCodeAt(0);
  const rnd = seededRandom(seed * 7919 + count);
  let price = basePrice || (symbol.includes('JPY') ? 150 : symbol.includes('XAU') ? 2350 : symbol.includes('BTC') ? 62000 : 1.08);
  const vol = price > 1000 ? price * 0.0025 : price * 0.0009;
  const now = Date.now();
  const out = [];
  for (let i = 0; i < count; i++) {
    const t = now - (count - i) * step;
    const drift = (rnd() - 0.5) * vol;
    const o = price;
    const c = Math.max(price * 0.001, price + drift + (rnd() - 0.5) * vol * 0.6);
    const h = Math.max(o, c) + rnd() * vol * 0.5;
    const l = Math.min(o, c) - rnd() * vol * 0.5;
    out.push({ t, o, h, l, c, v: Math.round(rnd() * 1000) });
    price = c;
  }
  return out;
}

if (typeof module !== 'undefined') module.exports = { ChartEngine, generateCandles };
