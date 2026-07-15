/* ============================================================
   BACKTEST LAB — DRAWING TOOLS LAYER
   Sits on top of ChartEngine via its render hook (_drawExtras)
   and input hooks (_toolMouseDown/Move/Up/Click). Every drawn
   object is stored in DATA SPACE as {t (time), p (price)} points
   so it stays correctly anchored through pan/zoom/replay.

   Supported tools: cursor, crosshair, trendline, ray, horizontal
   line, vertical line, rectangle, fib retracement, text,
   long/short position (RR box), measure.
   Each object supports: select, drag (move), drag endpoints
   (resize), delete, color/width/opacity edit, lock, hide.
   ============================================================ */

class DrawingToolsLayer {
  constructor(chart, opts = {}) {
    this.chart = chart;
    this.objects = [];      // {id,type,points:[{t,p}],style:{color,width,opacity},locked,hidden,label}
    this.tool = 'cursor';
    this.magnet = false;
    this.selectedId = null;
    this.draggingHandle = null; // {objId, pointIndex} or 'move'
    this._draft = null;         // in-progress object while drawing
    this._nextId = 1;
    this.defaultColor = '#60a5fa';
    this.onSelectionChange = opts.onSelectionChange || (() => {});
    this.onObjectsChange = opts.onObjectsChange || (() => {});

    this.render = (ctx) => this._render(ctx);
    this.onMouseDown = (e) => this._mouseDown(e);
    this.onMouseMove = (e, rect) => this._mouseMove(e, rect);
    this.onMouseUp = (e) => this._mouseUp(e);
    this.onDblClick = (e) => { this._dblClick(e); return false; };
    chart.addLayer(this);

    window.addEventListener('keydown', (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedId && !this._isTyping(e)) {
        this.deleteObject(this.selectedId);
      }
      if (e.key === 'Escape') { this._draft = null; this.setTool('cursor'); }
    });
  }

  _isTyping(e) { const t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable); }

  setTool(tool) { this.tool = tool; this._draft = null; this.selectObject(null); this.chart.render(); }
  toggleMagnet(v) { this.magnet = v; }

  // ---------- coordinate helpers ----------
  _screenToData(x, y) {
    const idx = this.chart.xToIndex(x);
    const vis = this.chart.visibleCandles();
    let t;
    if (vis.length) {
      const clamped = Math.max(0, Math.min(vis.length - 1, idx));
      const avgStep = vis.length > 1 ? (vis[vis.length - 1].t - vis[0].t) / (vis.length - 1) : 60000;
      t = vis[clamped] ? vis[clamped].t : vis[0].t + idx * avgStep;
    } else t = Date.now();
    let p = this.chart.yToPrice(y);
    if (this.magnet && vis.length) {
      const idxC = Math.max(0, Math.min(vis.length - 1, this.chart.xToIndex(x)));
      const c = vis[idxC];
      if (c) {
        const candidates = [c.o, c.h, c.l, c.c];
        p = candidates.reduce((a, b) => Math.abs(b - p) < Math.abs(a - p) ? b : a);
      }
    }
    return { t, p };
  }
  _dataToScreen(pt) {
    const idx = this.chart.timeToIndex(pt.t);
    return { x: this.chart.indexToX(idx), y: this.chart.priceToY(pt.p) };
  }

  // ---------- object CRUD ----------
  addObject(obj) {
    obj.id = this._nextId++;
    obj.style = Object.assign({ color: this.defaultColor, width: 2, opacity: 1 }, obj.style || {});
    obj.locked = false; obj.hidden = false;
    this.objects.push(obj);
    this.onObjectsChange(this.objects);
    return obj;
  }
  deleteObject(id) {
    this.objects = this.objects.filter(o => o.id !== id);
    if (this.selectedId === id) this.selectObject(null);
    this.onObjectsChange(this.objects);
    this.chart.render();
  }
  selectObject(id) { this.selectedId = id; this.onSelectionChange(this.objects.find(o => o.id === id) || null); this.chart.render(); }
  updateStyle(id, patch) {
    const o = this.objects.find(x => x.id === id); if (!o) return;
    Object.assign(o.style, patch); this.chart.render();
  }

  // ---------- input handling ----------
  _mouseDown(e) {
    const rect = this.chart.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    if (x > this.chart.canvas.clientWidth - this.chart.opts.priceAxisWidth) return false;

    if (this.tool === 'cursor') {
      const hit = this._hitTest(x, y);
      if (hit) {
        this.selectObject(hit.obj.id);
        this.draggingHandle = hit.handle != null ? { objId: hit.obj.id, pointIndex: hit.handle } : { objId: hit.obj.id, pointIndex: 'move', startData: this._screenToData(x, y), origPoints: JSON.parse(JSON.stringify(hit.obj.points)) };
        return true;
      }
      this.selectObject(null);
      return false;
    }

    // drawing tools
    const dp = this._screenToData(x, y);
    if (this.tool === 'text') {
      const label = prompt('Text:', '');
      if (label) this.addObject({ type: 'text', points: [dp], label });
      this.setTool('cursor');
      return true;
    }
    if (['trendline', 'ray', 'extline', 'fib', 'fibext', 'rect', 'measure', 'position-long', 'position-short'].includes(this.tool)) {
      this._draft = { type: this.tool, points: [dp, dp] };
      return true;
    }
    if (this.tool === 'hline') { this.addObject({ type: 'hline', points: [dp] }); this.setTool('cursor'); return true; }
    if (this.tool === 'vline') { this.addObject({ type: 'vline', points: [dp] }); this.setTool('cursor'); return true; }
    return false;
  }

  _mouseMove(e, rect) {
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    if (this._draft) {
      this._draft.points[1] = this._screenToData(x, y);
      this.chart.render();
      return;
    }
    if (this.draggingHandle) {
      const obj = this.objects.find(o => o.id === this.draggingHandle.objId);
      if (!obj || obj.locked) return;
      const dp = this._screenToData(x, y);
      if (this.draggingHandle.pointIndex === 'move') {
        const dt = dp.t - this.draggingHandle.startData.t;
        const dpr = dp.p - this.draggingHandle.startData.p;
        obj.points = this.draggingHandle.origPoints.map(pt => ({ t: pt.t + dt, p: pt.p + dpr }));
      } else {
        obj.points[this.draggingHandle.pointIndex] = dp;
      }
      this.chart.render();
    }
  }

  _mouseUp() {
    if (this._draft) {
      if (this._draft.type === 'position-long' || this._draft.type === 'position-short') {
        // add a third handle (stop-loss) at a default 1:2 RR distance so it's
        // immediately draggable — matches TradingView's long/short position tool.
        const [entry, target] = this._draft.points;
        const dist = Math.abs(target.p - entry.p);
        const slPrice = this._draft.type === 'position-long' ? entry.p - dist / 2 : entry.p + dist / 2;
        this._draft.points.push({ t: entry.t, p: slPrice });
        this.addObject(this._draft);
      } else if (['trendline', 'ray', 'extline', 'fib', 'fibext', 'rect', 'measure'].includes(this._draft.type)) {
        this.addObject(this._draft);
      }
      this._draft = null;
      this.setTool('cursor');
    }
    this.draggingHandle = null;
  }

  _dblClick(e) {
    const rect = this.chart.canvas.getBoundingClientRect();
    const hit = this._hitTest(e.clientX - rect.left, e.clientY - rect.top);
    if (hit && hit.obj.type === 'text') {
      const v = prompt('Edit text:', hit.obj.label || '');
      if (v != null) { hit.obj.label = v; this.chart.render(); }
    }
  }

  // ---------- hit testing ----------
  _hitTest(x, y) {
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const o = this.objects[i];
      if (o.hidden) continue;
      const pts = o.points.map(p => this._dataToScreen(p));
      const HANDLE_R = 7, LINE_TOL = 6;
      for (let hIdx = 0; hIdx < pts.length; hIdx++) {
        if (Math.hypot(pts[hIdx].x - x, pts[hIdx].y - y) < HANDLE_R) return { obj: o, handle: hIdx };
      }
      if (o.type === 'rect' || o.type === 'position-long' || o.type === 'position-short') {
        const [a, b] = pts;
        const minX = Math.min(a.x, b.x), maxX = Math.max(a.x, b.x);
        const minY = Math.min(a.y, b.y), maxY = Math.max(a.y, b.y);
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) return { obj: o, handle: null };
      } else if (o.type === 'hline') {
        if (Math.abs(pts[0].y - y) < LINE_TOL) return { obj: o, handle: null };
      } else if (o.type === 'vline') {
        if (Math.abs(pts[0].x - x) < LINE_TOL) return { obj: o, handle: null };
      } else if (pts.length >= 2) {
        if (this._distToSeg(x, y, pts[0], pts[1]) < LINE_TOL) return { obj: o, handle: null };
      } else if (o.type === 'text') {
        if (Math.hypot(pts[0].x - x, pts[0].y - y) < 20) return { obj: o, handle: null };
      }
    }
    return null;
  }
  _distToSeg(px, py, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const len2 = dx * dx + dy * dy || 1;
    let t = ((px - a.x) * dx + (py - a.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const cx = a.x + t * dx, cy = a.y + t * dy;
    return Math.hypot(px - cx, py - cy);
  }

  // ---------- rendering ----------
  _render(ctx) {
    const plotW = this.chart.canvas.clientWidth - this.chart.opts.priceAxisWidth;
    const plotH = this.chart.canvas.clientHeight - this.chart.opts.timeAxisHeight;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, plotW, plotH); ctx.clip();
    const list = this._draft ? [...this.objects, this._draft] : this.objects;
    for (const o of list) {
      if (o.hidden) continue;
      this._renderObject(ctx, o, plotW, plotH);
    }
    ctx.restore();
  }

  _renderObject(ctx, o, plotW, plotH) {
    const pts = o.points.map(p => this._dataToScreen(p));
    const isSel = o.id === this.selectedId;
    ctx.strokeStyle = o.style?.color || this.defaultColor;
    ctx.fillStyle = o.style?.color || this.defaultColor;
    ctx.globalAlpha = o.style?.opacity ?? 1;
    ctx.lineWidth = o.style?.width || 2;

    switch (o.type) {
      case 'trendline':
        this._line(ctx, pts[0], pts[1]); break;
      case 'ray': {
        const dir = { x: pts[1].x - pts[0].x, y: pts[1].y - pts[0].y };
        const len = Math.hypot(dir.x, dir.y) || 1;
        const ext = { x: pts[0].x + dir.x / len * 3000, y: pts[0].y + dir.y / len * 3000 };
        this._line(ctx, pts[0], ext); break;
      }
      case 'extline': {
        const dir = { x: pts[1].x - pts[0].x, y: pts[1].y - pts[0].y };
        const len = Math.hypot(dir.x, dir.y) || 1;
        const a = { x: pts[0].x - dir.x / len * 3000, y: pts[0].y - dir.y / len * 3000 };
        const b = { x: pts[0].x + dir.x / len * 3000, y: pts[0].y + dir.y / len * 3000 };
        this._line(ctx, a, b); break;
      }
      case 'hline':
        this._line(ctx, { x: 0, y: pts[0].y }, { x: plotW, y: pts[0].y });
        this._priceTag(ctx, plotW, pts[0].y, o.points[0].p); break;
      case 'vline':
        this._line(ctx, { x: pts[0].x, y: 0 }, { x: pts[0].x, y: plotH }); break;
      case 'rect': {
        const x = Math.min(pts[0].x, pts[1].x), y = Math.min(pts[0].y, pts[1].y);
        const w = Math.abs(pts[1].x - pts[0].x), h = Math.abs(pts[1].y - pts[0].y);
        ctx.globalAlpha = (o.style?.opacity ?? 1) * 0.15; ctx.fillRect(x, y, w, h);
        ctx.globalAlpha = o.style?.opacity ?? 1; ctx.strokeRect(x, y, w, h);
        break;
      }
      case 'fib': case 'fibext': {
        const levels = o.type === 'fib'
          ? [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]
          : [0, 0.618, 1, 1.618, 2.618];
        const y0 = pts[0].y, y1 = pts[1].y;
        const minX = Math.min(pts[0].x, pts[1].x), maxX = Math.max(pts[0].x, pts[1].x);
        for (const lv of levels) {
          const y = y0 + (y1 - y0) * lv;
          ctx.globalAlpha = (o.style?.opacity ?? 1) * 0.8;
          this._line(ctx, { x: minX, y }, { x: maxX, y });
          ctx.font = '10px monospace'; ctx.fillText(lv.toFixed(3), maxX + 4, y + 3);
        }
        break;
      }
      case 'text':
        ctx.font = '13px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(o.label || '', pts[0].x + 6, pts[0].y);
        break;
      case 'position-long': case 'position-short': {
        const entryY = pts[0].y, targetY = pts[1].y, slY = pts[2] ? pts[2].y : null;
        const x0 = Math.min(pts[0].x, pts[1].x), x1 = Math.max(pts[0].x, pts[1].x) + 70;
        ctx.globalAlpha = 0.18; ctx.fillStyle = '#34d399';
        ctx.fillRect(x0, Math.min(entryY, targetY), x1 - x0, Math.abs(entryY - targetY));
        if (slY != null) {
          ctx.globalAlpha = 0.18; ctx.fillStyle = '#f87171';
          ctx.fillRect(x0, Math.min(entryY, slY), x1 - x0, Math.abs(entryY - slY));
        }
        ctx.globalAlpha = 1; ctx.strokeStyle = '#e2e8f0';
        this._line(ctx, { x: x0, y: entryY }, { x: x1, y: entryY });
        ctx.fillStyle = '#e2e8f0'; ctx.font = '10px monospace';
        const rewardDist = Math.abs(o.points[1].p - o.points[0].p);
        const riskDist = o.points[2] ? Math.abs(o.points[0].p - o.points[2].p) : 0;
        const rr = riskDist > 0 ? (rewardDist / riskDist).toFixed(2) : '—';
        ctx.fillText(`Entry ${o.points[0].p.toFixed(5)}`, x1 - 150, entryY - 16);
        ctx.fillText(`Target ${o.points[1].p.toFixed(5)}`, x1 - 150, entryY - 4);
        if (o.points[2]) ctx.fillText(`SL ${o.points[2].p.toFixed(5)}   RR 1:${rr}`, x1 - 150, entryY + 8);
        break;
      }
      case 'measure': {
        this._line(ctx, pts[0], pts[1]);
        const dp = o.points[1].p - o.points[0].p;
        const pct = (dp / o.points[0].p) * 100;
        const bars = Math.abs(this.chart.timeToIndex(o.points[1].t) - this.chart.timeToIndex(o.points[0].t));
        ctx.fillStyle = '#e2e8f0'; ctx.font = '11px monospace';
        ctx.fillText(`${dp >= 0 ? '+' : ''}${dp.toFixed(5)} (${pct.toFixed(2)}%)  ${bars} bars`, (pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2 - 8);
        break;
      }
    }

    ctx.globalAlpha = 1;
    if (isSel) {
      ctx.fillStyle = '#60a5fa';
      for (const p of pts) { ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill(); }
    }
  }

  _line(ctx, a, b) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
  _priceTag(ctx, plotW, y, price) {
    ctx.font = '10px monospace';
    const label = price.toFixed(5);
    const w = ctx.measureText(label).width + 8;
    ctx.fillRect(plotW - w - 2, y - 8, w, 16);
  }
}

if (typeof module !== 'undefined') module.exports = { DrawingToolsLayer };
