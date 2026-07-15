/* ============================================================
   BACKTEST LAB — UI CHROME
   Left drawing toolbar, top symbol/timeframe bar, replay
   transport controls, and the object style/property panel.
   Pure DOM + vanilla JS, no framework, matches the existing
   glassmorphism theme via CSS custom properties already defined
   in styles.css (--bg2, --glass-2, --accent, --blue, etc.)
   ============================================================ */

const TOOL_DEFS = [
  { id: 'cursor', icon: 'M4 3l7 16 2-7 7-2z', label: 'Cursor' },
  { id: 'crosshair', icon: 'M12 3v6M12 15v6M3 12h6M15 12h6', label: 'Crosshair' },
  { id: 'trendline', icon: 'M4 20L20 4', label: 'Trend Line' },
  { id: 'ray', icon: 'M4 20L20 4M20 4l-4 1M20 4l-1 4', label: 'Ray' },
  { id: 'extline', icon: 'M2 20L22 4', label: 'Extended Line' },
  { id: 'hline', icon: 'M3 12h18', label: 'Horizontal Line' },
  { id: 'vline', icon: 'M12 3v18', label: 'Vertical Line' },
  { id: 'rect', icon: 'M4 5h16v14H4z', label: 'Rectangle' },
  { id: 'fib', icon: 'M3 6h18M3 10h18M3 14h18M3 18h18', label: 'Fib Retracement' },
  { id: 'fibext', icon: 'M3 6h18M3 12h18M3 18h18', label: 'Fib Extension' },
  { id: 'text', icon: 'M5 4h14M12 4v16', label: 'Text' },
  { id: 'position-long', icon: 'M4 18l6-8 4 4 6-9', label: 'Long Position' },
  { id: 'position-short', icon: 'M4 6l6 8 4-4 6 9', label: 'Short Position' },
  { id: 'measure', icon: 'M3 17l18-14M3 17h4M3 17v-4', label: 'Measure' },
];

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1H', '4H', '1D'];
const SYMBOLS = [
  { s: 'EURUSD', name: 'Euro / US Dollar' }, { s: 'GBPUSD', name: 'British Pound / US Dollar' },
  { s: 'USDJPY', name: 'US Dollar / Japanese Yen' }, { s: 'XAUUSD', name: 'Gold Spot' },
  { s: 'BTCUSD', name: 'Bitcoin / US Dollar' }, { s: 'ETHUSD', name: 'Ethereum / US Dollar' },
  { s: 'NAS100', name: 'Nasdaq 100' }, { s: 'US30', name: 'Dow Jones 30' }, { s: 'US500', name: 'S&P 500' },
  { s: 'GER40', name: 'DAX 40' }, { s: 'GBPJPY', name: 'British Pound / Japanese Yen' },
];

function svgIcon(d) { return `<svg viewBox="0 0 24 24" width="18" height="18"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`; }

class DrawToolbar {
  constructor(container, tools) {
    this.tools = tools;
    this.el = document.createElement('div');
    this.el.className = 'bl-toolbar';
    for (const t of TOOL_DEFS) {
      const btn = document.createElement('button');
      btn.className = 'bl-tool-btn'; btn.title = t.label; btn.dataset.tool = t.id;
      btn.innerHTML = svgIcon(t.icon);
      btn.onclick = () => { this.tools.setTool(t.id); this._setActive(t.id); };
      this.el.appendChild(btn);
    }
    this.el.appendChild(this._sep());
    this.magnetBtn = this._toggleBtn('M12 2a5 5 0 00-5 5v6a5 5 0 0010 0V7a5 5 0 00-5-5zM7 13v1a5 5 0 0010 0v-1', 'Magnet Mode',
      (on) => this.tools.toggleMagnet(on));
    this.el.appendChild(this.magnetBtn);
    const trash = document.createElement('button');
    trash.className = 'bl-tool-btn'; trash.title = 'Delete selected';
    trash.innerHTML = svgIcon('M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M18 7l-1 13a1 1 0 01-1 1H8a1 1 0 01-1-1L6 7');
    trash.onclick = () => { if (this.tools.selectedId) this.tools.deleteObject(this.tools.selectedId); };
    this.el.appendChild(trash);
    container.appendChild(this.el);
    this._setActive('cursor');
  }
  _sep() { const d = document.createElement('div'); d.className = 'bl-tool-sep'; return d; }
  _toggleBtn(path, title, onToggle) {
    const btn = document.createElement('button');
    btn.className = 'bl-tool-btn'; btn.title = title;
    btn.innerHTML = svgIcon(path);
    let on = false;
    btn.onclick = () => { on = !on; btn.classList.toggle('active', on); onToggle(on); };
    return btn;
  }
  _setActive(id) {
    this.el.querySelectorAll('.bl-tool-btn').forEach(b => b.classList.toggle('active', b.dataset.tool === id));
  }
}

class ReplayEngine {
  constructor(chart, container, opts = {}) {
    this.chart = chart;
    this.speed = 1;
    this.playing = false;
    this.cursor = chart.data.length;
    this.onTick = opts.onTick || (() => {});
    this._timer = null;

    this.el = document.createElement('div');
    this.el.className = 'bl-replay-bar';
    this.el.innerHTML = `
      <button class="bl-replay-btn" data-a="start" title="Jump to start">⏮</button>
      <button class="bl-replay-btn" data-a="prev" title="Previous candle">◀</button>
      <button class="bl-replay-btn bl-replay-play" data-a="play" title="Play/Pause">▶</button>
      <button class="bl-replay-btn" data-a="next" title="Next candle">▶|</button>
      <input type="range" class="bl-replay-slider" min="10" max="${chart.data.length}" value="${chart.data.length}">
      <select class="bl-replay-speed">
        <option value="4">0.25x</option><option value="2">0.5x</option>
        <option value="1" selected>1x</option><option value="0.5">2x</option><option value="0.25">4x</option>
      </select>
      <span class="bl-replay-clock">--:--</span>`;
    container.appendChild(this.el);

    this.slider = this.el.querySelector('.bl-replay-slider');
    this.playBtn = this.el.querySelector('.bl-replay-play');
    this.clock = this.el.querySelector('.bl-replay-clock');
    this.speedSel = this.el.querySelector('.bl-replay-speed');

    this.el.querySelector('[data-a=start]').onclick = () => this.seek(10);
    this.el.querySelector('[data-a=prev]').onclick = () => this.seek(this.cursor - 1);
    this.el.querySelector('[data-a=next]').onclick = () => this.seek(this.cursor + 1);
    this.playBtn.onclick = () => this.toggle();
    this.slider.oninput = () => this.seek(+this.slider.value, false);
    this.speedSel.onchange = () => { this.speed = +this.speedSel.value; if (this.playing) { this.pause(); this.play(); } };

    this.seek(this.cursor);
  }
  seek(idx, syncSlider = true) {
    this.cursor = Math.max(1, Math.min(this.chart.data.length, idx));
    this.chart.setReplayCursor(this.cursor);
    if (syncSlider) this.slider.value = this.cursor;
    const c = this.chart.data[this.cursor - 1];
    if (c) this.clock.textContent = new Date(c.t).toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    this.onTick(this.cursor);
  }
  play() {
    this.playing = true; this.playBtn.textContent = '⏸';
    this._timer = setInterval(() => {
      if (this.cursor >= this.chart.data.length) { this.pause(); return; }
      this.seek(this.cursor + 1);
    }, 400 * this.speed);
  }
  pause() { this.playing = false; this.playBtn.textContent = '▶'; clearInterval(this._timer); }
  toggle() { this.playing ? this.pause() : this.play(); }
}

class SymbolSearch {
  constructor(container, onSelect) {
    this.onSelect = onSelect;
    this.el = document.createElement('div');
    this.el.className = 'bl-symbol-search';
    this.el.innerHTML = `<button class="bl-symbol-btn">EURUSD <span class="bl-symbol-caret">▾</span></button>
      <div class="bl-symbol-dropdown" hidden>
        <input class="bl-symbol-input" placeholder="Search symbol...">
        <div class="bl-symbol-list"></div>
      </div>`;
    container.appendChild(this.el);
    this.btn = this.el.querySelector('.bl-symbol-btn');
    this.dropdown = this.el.querySelector('.bl-symbol-dropdown');
    this.input = this.el.querySelector('.bl-symbol-input');
    this.list = this.el.querySelector('.bl-symbol-list');

    this.btn.onclick = () => { this.dropdown.hidden = !this.dropdown.hidden; if (!this.dropdown.hidden) { this.input.value = ''; this._renderList(''); this.input.focus(); } };
    this.input.oninput = () => this._renderList(this.input.value);
    document.addEventListener('click', (e) => { if (!this.el.contains(e.target)) this.dropdown.hidden = true; });
    this._renderList('');
  }
  _renderList(q) {
    const ql = q.trim().toUpperCase();
    const matches = SYMBOLS.filter(x => x.s.includes(ql) || x.name.toUpperCase().includes(ql));
    this.list.innerHTML = matches.map(m => `<div class="bl-symbol-row" data-s="${m.s}"><b>${m.s}</b><span>${m.name}</span></div>`).join('') || '<div class="bl-symbol-empty">No matches</div>';
    this.list.querySelectorAll('.bl-symbol-row').forEach(row => {
      row.onclick = () => { const s = row.dataset.s; this.btn.firstChild.textContent = s + ' '; this.dropdown.hidden = true; this.onSelect(s); };
    });
  }
}

class TimeframeSelector {
  constructor(container, onSelect, initial = '1H') {
    this.el = document.createElement('div');
    this.el.className = 'bl-tf-selector';
    for (const tf of TIMEFRAMES) {
      const b = document.createElement('button');
      b.className = 'bl-tf-btn' + (tf === initial ? ' active' : '');
      b.textContent = tf;
      b.onclick = () => { this.el.querySelectorAll('.bl-tf-btn').forEach(x => x.classList.remove('active')); b.classList.add('active'); onSelect(tf); };
      this.el.appendChild(b);
    }
    container.appendChild(this.el);
  }
}

class PropertyPanel {
  constructor(container, tools) {
    this.tools = tools;
    this.el = document.createElement('div');
    this.el.className = 'bl-prop-panel'; this.el.hidden = true;
    container.appendChild(this.el);
    tools.onSelectionChange = (obj) => this._show(obj);
  }
  _show(obj) {
    if (!obj) { this.el.hidden = true; return; }
    this.el.hidden = false;
    const colors = ['#60a5fa', '#34d399', '#f87171', '#fbbf24', '#a78bfa', '#f1f5f9'];
    this.el.innerHTML = `
      <div class="bl-prop-row bl-prop-colors">${colors.map(c => `<button class="bl-prop-swatch${obj.style.color === c ? ' active' : ''}" style="background:${c}" data-c="${c}"></button>`).join('')}</div>
      <div class="bl-prop-row">
        <label>Width</label>
        <input type="range" min="1" max="6" value="${obj.style.width}" class="bl-prop-width">
      </div>
      <div class="bl-prop-row">
        <label>Opacity</label>
        <input type="range" min="10" max="100" value="${Math.round(obj.style.opacity * 100)}" class="bl-prop-opacity">
      </div>`;
    this.el.querySelectorAll('.bl-prop-swatch').forEach(sw => sw.onclick = () => { this.tools.updateStyle(obj.id, { color: sw.dataset.c }); this._show(obj); });
    this.el.querySelector('.bl-prop-width').oninput = (e) => this.tools.updateStyle(obj.id, { width: +e.target.value });
    this.el.querySelector('.bl-prop-opacity').oninput = (e) => this.tools.updateStyle(obj.id, { opacity: +e.target.value / 100 });
  }
}

if (typeof module !== 'undefined') module.exports = { DrawToolbar, ReplayEngine, SymbolSearch, TimeframeSelector, PropertyPanel, SYMBOLS, TIMEFRAMES };
