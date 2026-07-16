// ══ NxTGen Journal — backtesting-lab.js (original app.js lines 10165-12694) ══

// ── TRADE ENTRY MODAL (Trade Simulator, Section 4/5) ────
function _openTradeEntryModal(sessionId, tradeId, prefill) {
  const session = _btGetSessionById(sessionId); if (!session) return;
  const isNew = !tradeId;
  const t = isNew ? {
    direction: (prefill && prefill.direction) || 'buy',
    entry_price: (prefill && prefill.entry_price) || '',
    exit_price: '', stop_price: '',
    rr: '', pnl: '',
    entry_time: (prefill && prefill.entry_time) || '', exit_time: '', data: {},
  } : _btTrades.find(x => x.id === tradeId);
  if (!t) return;
  const d = t.data || {};

  const existing = document.getElementById('bt-trade-edit-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'bt-trade-edit-overlay';
  overlay.className = 'acc-manager-overlay';
  overlay.style.zIndex = '1100';
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  const screenshotSlots = ['before', 'entry', 'exit', 'marked'].map(key => {
    const url = d.screenshots?.[key];
    return `<div class="bt-screenshot-slot${url ? ' filled' : ''}" id="bt-shot-${key}" style="${url ? `background-image:url('${url}')` : ''}" onclick="document.getElementById('bt-shot-input-${key}').click()">
      <span>${key[0].toUpperCase() + key.slice(1)}</span>
      <input type="file" accept="image/*" id="bt-shot-input-${key}" style="display:none" onchange="_btHandleScreenshotPick(this,'${key}')">
    </div>`;
  }).join('');

  overlay.innerHTML = `
  <div class="acc-manager-modal" style="max-width:640px;max-height:90vh">
    <div class="acc-manager-header">
      <span>${isNew ? '＋ Log Simulated Trade' : 'Edit Trade'}</span>
      <button onclick="document.getElementById('bt-trade-edit-overlay').remove()" class="acc-mgr-close"><svg class="icn" aria-hidden="true"><use href="#ic-close"></use></svg></button>
    </div>
    <div class="acc-manager-body" style="display:flex;flex-direction:column;gap:12px;padding:16px;overflow-y:auto">

      <div style="display:flex;gap:8px">
        <button type="button" id="bt-dir-buy" class="wl-week-btn${t.direction !== 'sell' ? ' restore' : ''}" onclick="_btSetDirection('buy')" style="flex:1">Buy / Long</button>
        <button type="button" id="bt-dir-sell" class="wl-week-btn${t.direction === 'sell' ? ' danger' : ''}" onclick="_btSetDirection('sell')" style="flex:1">Sell / Short</button>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
        <div><label class="bl-lbl">Entry Price</label><input type="number" step="any" id="bt-t-entry" class="acc-mgr-input" style="width:100%;box-sizing:border-box" value="${t.entry_price ?? ''}" oninput="_btAutoCalc()"></div>
        <div><label class="bl-lbl">Stop Price</label><input type="number" step="any" id="bt-t-stop" class="acc-mgr-input" style="width:100%;box-sizing:border-box" value="${t.stop_price ?? ''}" oninput="_btAutoCalc()"></div>
        <div><label class="bl-lbl">Exit Price</label><input type="number" step="any" id="bt-t-exit" class="acc-mgr-input" style="width:100%;box-sizing:border-box" value="${t.exit_price ?? ''}" oninput="_btAutoCalc()"></div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div><label class="bl-lbl">RR <span class="bl-lbl-sub">(auto, editable)</span></label><input type="number" step="any" id="bt-t-rr" class="acc-mgr-input" style="width:100%;box-sizing:border-box" value="${t.rr ?? ''}"></div>
        <div><label class="bl-lbl">P/L $ <span class="bl-lbl-sub">(auto, editable)</span></label><input type="number" step="any" id="bt-t-pnl" class="acc-mgr-input" style="width:100%;box-sizing:border-box" value="${t.pnl ?? ''}"></div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div><label class="bl-lbl">Entry Time</label><input type="datetime-local" id="bt-t-entrytime" class="acc-mgr-input" style="width:100%;box-sizing:border-box" value="${t.entry_time ? t.entry_time.slice(0, 16) : ''}"></div>
        <div><label class="bl-lbl">Exit Time</label><input type="datetime-local" id="bt-t-exittime" class="acc-mgr-input" style="width:100%;box-sizing:border-box" value="${t.exit_time ? t.exit_time.slice(0, 16) : ''}"></div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div><label class="bl-lbl">MFE <span class="bl-lbl-sub">(R units)</span></label><input type="number" step="any" id="bt-t-mfe" class="acc-mgr-input" style="width:100%;box-sizing:border-box" value="${d.mfe ?? ''}"></div>
        <div><label class="bl-lbl">MAE <span class="bl-lbl-sub">(R units)</span></label><input type="number" step="any" id="bt-t-mae" class="acc-mgr-input" style="width:100%;box-sizing:border-box" value="${d.mae ?? ''}"></div>
      </div>

      <div><label class="bl-lbl">Reason for Entry</label><textarea id="bt-t-reasonentry" class="acc-mgr-input" style="width:100%;box-sizing:border-box;min-height:50px;resize:vertical">${d.reasonEntry || ''}</textarea></div>
      <div><label class="bl-lbl">Reason for Exit</label><textarea id="bt-t-reasonexit" class="acc-mgr-input" style="width:100%;box-sizing:border-box;min-height:50px;resize:vertical">${d.reasonExit || ''}</textarea></div>
      <div><label class="bl-lbl">Mistakes <span class="bl-lbl-sub">(one per line)</span></label><textarea id="bt-t-mistakes" class="acc-mgr-input" style="width:100%;box-sizing:border-box;min-height:50px;resize:vertical">${(d.mistakes || []).join('\n')}</textarea></div>
      <div><label class="bl-lbl">Psychology</label><textarea id="bt-t-psych" class="acc-mgr-input" style="width:100%;box-sizing:border-box;min-height:50px;resize:vertical">${d.psychology || ''}</textarea></div>

      <div class="bt-rating-row">
        <div><label class="bl-lbl">Confidence <span class="bl-lbl-sub">1-10</span></label><input type="number" min="1" max="10" id="bt-t-conf" class="acc-mgr-input" style="width:100%;box-sizing:border-box" value="${d.confidenceLevel ?? ''}"></div>
        <div><label class="bl-lbl">Execution <span class="bl-lbl-sub">1-10</span></label><input type="number" min="1" max="10" id="bt-t-exec" class="acc-mgr-input" style="width:100%;box-sizing:border-box" value="${d.executionRating ?? ''}"></div>
        <div><label class="bl-lbl">Discipline <span class="bl-lbl-sub">1-10</span></label><input type="number" min="1" max="10" id="bt-t-disc" class="acc-mgr-input" style="width:100%;box-sizing:border-box" value="${d.disciplineRating ?? ''}"></div>
      </div>

      <div><label class="bl-lbl">Screenshots</label><div class="bt-screenshot-row" id="bt-shot-row">${screenshotSlots}</div></div>
      <div><label class="bl-lbl">Notes</label><textarea id="bt-t-notes" class="acc-mgr-input" style="width:100%;box-sizing:border-box;min-height:50px;resize:vertical">${d.notes || ''}</textarea></div>

      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px">
        ${!isNew ? `<button onclick="_btDeleteTradeConfirm('${sessionId}','${t.id}')" class="acc-mgr-btn del" style="padding:6px 14px;margin-right:auto"><svg class="icn" aria-hidden="true"><use href="#ic-trash"></use></svg> Delete</button>` : ''}
        <button onclick="document.getElementById('bt-trade-edit-overlay').remove()" class="acc-mgr-btn" style="padding:6px 14px">Cancel</button>
        <button onclick="_btSaveTradeModal('${sessionId}', '${isNew ? '' : t.id}')" class="acc-mgr-add-btn" style="padding:6px 18px">Save Trade</button>
      </div>
    </div>
  </div>`;

  document.body.appendChild(overlay);
  overlay._btDirection = t.direction || 'buy';
  overlay._btScreenshots = { ...(d.screenshots || {}) };
  requestAnimationFrame(() => overlay.classList.add('open'));
}

function _btSetDirection(dir) {
  const overlay = document.getElementById('bt-trade-edit-overlay');
  if (overlay) overlay._btDirection = dir;
  document.getElementById('bt-dir-buy')?.classList.toggle('restore', dir === 'buy');
  document.getElementById('bt-dir-sell')?.classList.toggle('danger', dir === 'sell');
  _btAutoCalc();
}

/* Suggest RR from entry/stop/exit — trader can still override manually. */
function _btAutoCalc() {
  const overlay = document.getElementById('bt-trade-edit-overlay'); if (!overlay) return;
  const dir = overlay._btDirection || 'buy';
  const entry = parseFloat(document.getElementById('bt-t-entry')?.value);
  const stop = parseFloat(document.getElementById('bt-t-stop')?.value);
  const exit = parseFloat(document.getElementById('bt-t-exit')?.value);
  if (isNaN(entry) || isNaN(stop) || isNaN(exit)) return;

  const risk = dir === 'buy' ? entry - stop : stop - entry;
  const reward = dir === 'buy' ? exit - entry : entry - exit;
  if (risk <= 0) return;
  const rr = reward / risk;
  const rrField = document.getElementById('bt-t-rr');
  if (rrField) rrField.value = Math.round(rr * 100) / 100;
}

async function _btHandleScreenshotPick(input, key) {
  const file = input.files?.[0]; if (!file) return;
  const slot = document.getElementById('bt-shot-' + key);
  if (slot) { slot.querySelector('span').textContent = 'Uploading…'; }
  const url = await _btUploadScreenshot(file);
  if (!url) { showToast('Screenshot upload failed', 'danger'); return; }
  const overlay = document.getElementById('bt-trade-edit-overlay');
  if (overlay) { overlay._btScreenshots = overlay._btScreenshots || {}; overlay._btScreenshots[key] = url; }
  if (slot) { slot.style.backgroundImage = `url('${url}')`; slot.classList.add('filled'); }
}

async function _btSaveTradeModal(sessionId, tradeId) {
  const session = _btGetSessionById(sessionId); if (!session) return;
  const overlay = document.getElementById('bt-trade-edit-overlay');
  const direction = overlay?._btDirection || 'buy';

  const entryTimeRaw = document.getElementById('bt-t-entrytime')?.value;
  const exitTimeRaw = document.getElementById('bt-t-exittime')?.value;
  const mistakesRaw = document.getElementById('bt-t-mistakes')?.value || '';

  const trade = {
    id: tradeId || null,
    session_id: sessionId,
    strategy_id: session.strategyId || null,
    direction,
    entry_price: parseFloat(document.getElementById('bt-t-entry')?.value) || null,
    stop_price: parseFloat(document.getElementById('bt-t-stop')?.value) || null,
    exit_price: parseFloat(document.getElementById('bt-t-exit')?.value) || null,
    rr: parseFloat(document.getElementById('bt-t-rr')?.value) || 0,
    pnl: parseFloat(document.getElementById('bt-t-pnl')?.value) || 0,
    entry_time: entryTimeRaw ? new Date(entryTimeRaw).toISOString() : null,
    exit_time: exitTimeRaw ? new Date(exitTimeRaw).toISOString() : null,
    data: {
      mfe: document.getElementById('bt-t-mfe')?.value || '',
      mae: document.getElementById('bt-t-mae')?.value || '',
      reasonEntry: document.getElementById('bt-t-reasonentry')?.value.trim() || '',
      reasonExit: document.getElementById('bt-t-reasonexit')?.value.trim() || '',
      mistakes: mistakesRaw.split('\n').map(x => x.trim()).filter(Boolean),
      psychology: document.getElementById('bt-t-psych')?.value.trim() || '',
      confidenceLevel: document.getElementById('bt-t-conf')?.value || '',
      executionRating: document.getElementById('bt-t-exec')?.value || '',
      disciplineRating: document.getElementById('bt-t-disc')?.value || '',
      notes: document.getElementById('bt-t-notes')?.value.trim() || '',
      screenshots: overlay?._btScreenshots || {},
    },
  };

  const savedId = await _btSaveTrade(trade);
  if (!savedId) return;

  document.getElementById('bt-trade-edit-overlay')?.remove();
  _btRenderSessionDetail(sessionId);
  _btRenderSessionGrid();
  buildBacktestingLab(); // refresh strategy stats since they roll up from trades
  _blRenderGalleryControls(); _blRenderGallery(); _blRenderComparisonTable();
  showToast(tradeId ? 'Trade updated ✓' : 'Trade logged ✓', 'restore');
}

function _btDeleteTradeConfirm(sessionId, tradeId) {
  openGlassModal({
    icon: '<svg class="icn" aria-hidden="true"><use href="#ic-trash"></use></svg>',
    title: 'Delete Trade?',
    body: 'This simulated trade will be permanently removed from the session.',
    confirmLabel: 'Delete Trade',
    confirmClass: 'glass-btn-danger',
    onConfirm: async () => {
      await _btDeleteTrade(tradeId);
      document.getElementById('bt-trade-edit-overlay')?.remove();
      _btRenderSessionDetail(sessionId);
      _btRenderSessionGrid();
      buildBacktestingLab();
      _blRenderGalleryControls(); _blRenderGallery(); _blRenderComparisonTable();
      showToast('Trade deleted', 'danger');
    }
  });
}

// ═══════════════════════════════════════════════════
// BACKTESTING LAB — Phase 3: Chart Replay
//
// Candles come from Twelve Data via a Supabase Edge Function
// (market-data-proxy) so the API key stays server-side and
// CORS is a non-issue — same pattern as ai-coach. The Edge
// Function also caches responses in market_data_cache to stay
// well within Twelve Data's free-tier 800 calls/day limit.
//
// Replay position + drawings persist per-session inside
// session.replayState (part of the same journal_backtest_lab
// JSONB row) so leaving and reopening a session resumes where
// you left off.
//
// Scope note: drawing tools below cover trendline/arrow/measure
// (line), horizontal/vertical lines, rectangle-based tools
// (rect — reused for FVG, Order Block, Session/Killzone Box,
// Premium-Discount Zone, all just differently colored
// rectangles), Fibonacci retracement, and text annotations.
// None of these are auto-detected — ICT concept recognition
// (auto FVG/OB/liquidity detection) is a future analytics-phase
// feature, not a replay-drawing feature.
// ═══════════════════════════════════════════════════
let _repState = null;

// ── Data sources ─────────────────────────────────────────
// Each source is fetched through the same market-data-proxy
// Edge Function; the function branches on `source` server-side
// so API keys/secrets for each vendor stay off the client.
// Interval option *values* are already in the format each
// vendor's API expects — no client-side remapping needed.
const REP_SOURCES = [
  {
    id: 'twelvedata', label: 'Twelve Data',
    intervals: ['1min', '5min', '15min', '30min', '1h', '4h', '1day', '1week'],
    defaultInterval: '1h',
    symbolPlaceholder: 'EUR/USD',
    mapPair(pair) {
      if (!pair) return 'EUR/USD';
      const p = pair.trim().toUpperCase().replace(/\s+/g, '');
      if (p.includes('/')) return p;
      if (/^[A-Z]{6}$/.test(p)) return p.slice(0, 3) + '/' + p.slice(3);
      return p;
    },
  },
  {
    id: 'dukascopy', label: 'Dukascopy',
    intervals: ['m1', 'm5', 'm15', 'm30', 'h1', 'h4', 'd1'],
    defaultInterval: 'h1',
    symbolPlaceholder: 'eurusd',
    mapPair(pair) {
      if (!pair) return 'eurusd';
      return pair.trim().toLowerCase().replace(/[\/\s]/g, '');
    },
  },
  {
    id: 'oanda', label: 'OANDA',
    intervals: ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D', 'W'],
    defaultInterval: 'H1',
    symbolPlaceholder: 'EUR_USD',
    mapPair(pair) {
      if (!pair) return 'EUR_USD';
      const p = pair.trim().toUpperCase().replace(/\s+/g, '');
      if (p.includes('_')) return p;
      if (/^[A-Z]{6}$/.test(p)) return p.slice(0, 3) + '_' + p.slice(3);
      return p;
    },
  },
];
function _repGetSource(id) { return REP_SOURCES.find(s => s.id === id) || REP_SOURCES[0]; }

// Maps our existing REP_TOOLS ids to the real TradingView LineTool*
// identifiers used by chart.selectLineTool(). These are the
// library's documented built-in tool names — verify the exact
// strings against your installed library version's docs (Drawings
// API reference) if any tool doesn't arm correctly; naming has
// shifted slightly across major versions.
const TV_LINE_TOOL_MAP = {
  select: 'cursor',
  trendline: 'LineToolTrendLine',
  ray: 'LineToolRay',
  arrow: 'LineToolArrow',
  hline: 'LineToolHorzLine',
  vline: 'LineToolVertLine',
  measure: 'LineToolCircle', // TODO: swap for the measure tool's exact id once confirmed for your version
  rect: 'LineToolRectangle',
  circle: 'LineToolCircle',
  brush: 'LineToolBrush',
  text: 'LineToolText',
  fib: 'LineToolFibRetracement',
  fibext: 'LineToolFibExtension',
  killzone: 'LineToolRectangle',
  orderblock: 'LineToolRectangle',
  fvg: 'LineToolRectangle',
  liquidity: 'LineToolHorzLine',
  premiumdiscount: 'LineToolRectangle',
};

// TradingView's built-in study names + default inputs for the
// indicators your popover already lists — real studies now render
// natively on the chart instead of the old hand-rolled line series.
const REP_TV_STUDY_MAP = {
  ema9: { name: 'Moving Average Exponential', inputs: { length: 9 } },
  ema21: { name: 'Moving Average Exponential', inputs: { length: 21 } },
  ema50: { name: 'Moving Average Exponential', inputs: { length: 50 } },
  sma50: { name: 'Moving Average', inputs: { length: 50 } },
  sma200: { name: 'Moving Average', inputs: { length: 200 } },
  vwap: { name: 'Volume Weighted Average Price', inputs: {} },
  bb: { name: 'Bollinger Bands', inputs: { length: 20, mult: 2 } },
  rsi: { name: 'Relative Strength Index', inputs: { length: 14 } },
  macd: { name: 'MACD', inputs: { fastLength: 12, slowLength: 26, signalLength: 9 } },
  stoch: { name: 'Stochastic', inputs: { k: 14, d: 3, smooth: 3 } },
  atr: { name: 'Average True Range', inputs: { length: 14 } },
};

// Drawing tools shown in the left toolbar, top to bottom.
// `group` clusters related tools for the toolbar dividers.
// `icon` refers to an id in the icon sprite (index.html <defs>)
// or one of the inline REP_TOOL_ICONS below for chart-specific glyphs.
const REP_TOOLS = [
  { id: 'select',            label: 'Selection Tool (V)', kind: 'select',  group: 'nav' },
  { id: 'trendline',         label: 'Trend Line',        kind: 'line',   color: '#fbbf24', group: 'lines' },
  { id: 'ray',               label: 'Ray',                kind: 'ray',    color: '#fbbf24', group: 'lines' },
  { id: 'arrow',              label: 'Arrow',              kind: 'line',   color: '#fbbf24', arrow: true, group: 'lines' },
  { id: 'hline',              label: 'Horizontal Line',    kind: 'hline',  color: '#a78bfa', group: 'lines' },
  { id: 'vline',              label: 'Vertical Line',      kind: 'vline',  color: '#a78bfa', group: 'lines' },
  { id: 'measure',            label: 'Measure',            kind: 'line',   color: '#60a5fa', measure: true, group: 'lines' },
  { id: 'rect',               label: 'Rectangle',          kind: 'rect',   color: 'rgba(96,165,250,.16)', stroke: '#60a5fa', group: 'shapes' },
  { id: 'circle',             label: 'Circle',             kind: 'circle', color: 'rgba(96,165,250,.16)', stroke: '#60a5fa', group: 'shapes' },
  { id: 'brush',              label: 'Brush',              kind: 'brush',  color: '#f472b6', group: 'shapes' },
  { id: 'text',               label: 'Text',               kind: 'text',   color: '#e2e8f0', group: 'shapes' },
  { id: 'fib',                label: 'Fib Retracement',    kind: 'fib',    color: '#2dd4bf', group: 'fib' },
  { id: 'fibext',             label: 'Fib Extension',      kind: 'fib',    color: '#fb923c', extension: true, group: 'fib' },
  { id: 'killzone',           label: 'Session Box',        kind: 'rect',   color: 'rgba(52,211,153,.10)', stroke: '#34d399', drawLabel: 'Session', group: 'ict' },
  { id: 'orderblock',         label: 'Order Block',        kind: 'rect',   color: 'rgba(251,191,36,.14)', stroke: '#fbbf24', drawLabel: 'OB', group: 'ict' },
  { id: 'fvg',                label: 'Fair Value Gap',     kind: 'rect',   color: 'rgba(167,139,250,.16)', stroke: '#a78bfa', drawLabel: 'FVG', group: 'ict' },
  { id: 'liquidity',          label: 'Liquidity Zone',     kind: 'hline',  color: '#f87171', dashed: true, group: 'ict' },
  { id: 'premiumdiscount',    label: 'Premium / Discount', kind: 'rect',   color: 'rgba(45,212,191,.10)', stroke: '#2dd4bf', drawLabel: 'PD', group: 'ict' },
];

function _repUid() { return 'rd_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8); }

// ── Symbol / interval mapping ───────────────────────────
// Kept as thin wrappers around REP_SOURCES so any old call
// sites (or saved replayState from before multi-source
// support) keep working against Twelve Data by default.
function _repMapPairToSymbol(pair) { return _repGetSource('twelvedata').mapPair(pair); }
function _repMapIntervalToTD(tf) {
  const map = { M1: '1min', M5: '5min', M15: '15min', M30: '30min', H1: '1h', H4: '4h', D1: '1day', W1: '1week' };
  const key = (tf || '').trim().toUpperCase();
  return map[key] || '1h';
}
// Same idea, but for whichever source is currently active.
function _repMapIntervalForSource(tf, sourceId) {
  const src = _repGetSource(sourceId);
  const legacy = _repMapIntervalToTD(tf); // normalize e.g. "H1" -> "1h" first
  const bySourceMap = {
    twelvedata: { '1min': '1min', '5min': '5min', '15min': '15min', '30min': '30min', '1h': '1h', '4h': '4h', '1day': '1day', '1week': '1week' },
    dukascopy:  { '1min': 'm1', '5min': 'm5', '15min': 'm15', '30min': 'm30', '1h': 'h1', '4h': 'h4', '1day': 'd1', '1week': 'd1' },
    oanda:      { '1min': 'M1', '5min': 'M5', '15min': 'M15', '30min': 'M30', '1h': 'H1', '4h': 'H4', '1day': 'D', '1week': 'W' },
  };
  return (bySourceMap[src.id] && bySourceMap[src.id][legacy]) || src.defaultInterval;
}

// ── Fetch candles via Edge Function proxy ───────────────
// The Edge Function (market-data-proxy) branches on `source`
// server-side and keeps each vendor's key/token as a Supabase
// secret — see /supabase/functions/market-data-proxy for the
// Dukascopy + OANDA branches added alongside the existing
// Twelve Data one.
// Returns the full response object, not just candles, because the
// server may auto-fallback to a different source (e.g. OANDA -> Dukascopy
// if OANDA_API_KEY isn't set) — callers need `source`/`symbol`/`interval`
// back to keep the UI in sync with what actually loaded.
async function _repFetchCandles(symbol, interval, outputsize = 500, source = 'twelvedata') {
  const { data: { session } } = await sb.auth.getSession();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/market-data-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || SUPABASE_ANON}`,
    },
    body: JSON.stringify({ symbol, interval, outputsize, source }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Server error ${response.status}: ${errText}`);
  }
  return await response.json();
}

// ── Inline icon glyphs for the drawing toolbar (kept local to this
// module so we don't have to touch the shared sprite in index.html) ──
const REP_ICON_PATHS = {
  select:   '<path d="M5 3l5.6 15.4 2-6.6 6.6-2z"/>',
  trendline:'<path d="M4 19L19 4"/><circle cx="4" cy="19" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="4" r="1.6" fill="currentColor" stroke="none"/>',
  ray:      '<path d="M4 19L20 3"/><circle cx="4" cy="19" r="1.6" fill="currentColor" stroke="none"/>',
  arrow:    '<path d="M4 19L18 5"/><path d="M9 5h9v9"/>',
  hline:    '<path d="M3 12h18"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/>',
  vline:    '<path d="M12 3v18"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/>',
  measure:  '<path d="M4 17L17 4"/><path d="M4 17l2.2-2.2M7 14l2.2-2.2M10 11l2.2-2.2M13 8l2.2-2.2"/>',
  rect:     '<rect x="4" y="6" width="16" height="12" rx="1.5"/>',
  circle:   '<circle cx="12" cy="12" r="8"/>',
  brush:    '<path d="M4 20c0-4 2-5 4-5s2 3 4 3 1-4 4-6 4 1 4-3"/>',
  text:     '<path d="M5 6h14M12 6v13"/>',
  fib:      '<path d="M3 6h18M3 10.5h18M3 15h18M3 19.5h18" stroke-dasharray="0"/><path d="M3 6h5M3 19.5h5" stroke-width="2.6"/>',
  fibext:   '<path d="M3 5h18M3 10h18M3 15h18M3 20h18"/><path d="M16 5l3-2 3 2" stroke-width="1.3"/>',
  session:  '<rect x="5" y="4" width="14" height="16" rx="1.5"/><path d="M5 9h14M5 15h14"/>',
  orderblock:'<rect x="4" y="9" width="16" height="6" rx="1"/><path d="M4 5h16M4 19h16" opacity=".5"/>',
  fvg:      '<path d="M4 8h16M4 16h16"/><rect x="4" y="8" width="16" height="8" fill="currentColor" opacity=".18" stroke="none"/>',
  liquidity:'<path d="M3 8h18M3 16h18" stroke-dasharray="3 3"/>',
  premiumdiscount:'<path d="M4 4h16v16H4z"/><path d="M4 12h16"/>',
  magnet:   '<path d="M7 4v8a5 5 0 0010 0V4"/><path d="M7 4H4v4h3M17 4h3v4h-3"/>',
  undo:     '<path d="M7 8H3V4"/><path d="M3 8a9 9 0 1 1 2 10"/>',
  redo:     '<path d="M17 8h4V4"/><path d="M21 8a9 9 0 1 0-2 10"/>',
  save:     '<path d="M5 4.5h11l3.5 3.5v11.5a1.5 1.5 0 01-1.5 1.5H6a1.5 1.5 0 01-1.5-1.5v-13A1.5 1.5 0 016 4.5z"/><path d="M8 4.5v5h7v-5M8 21v-6.5h8V21"/>',
  load:     '<path d="M3.5 6.5A1.5 1.5 0 015 5h4l2 2h8a1.5 1.5 0 011.5 1.5v9A1.5 1.5 0 0119 19H5a1.5 1.5 0 01-1.5-1.5v-11z"/>',
  fullscreen:'<path d="M4 9V5a1 1 0 011-1h4M20 9V5a1 1 0 00-1-1h-4M4 15v4a1 1 0 001 1h4M20 15v4a1 1 0 01-1 1h-4"/>',
  indicators:'<path d="M4 19h16M4 19V9M9 19V5M14 19v-8M19 19v-4"/>',
  reset:    '<path d="M4.5 12a7.5 7.5 0 0112.7-5.4M19.5 12a7.5 7.5 0 01-12.7 5.4M17 4.5v3.3h-3.3M7 19.5v-3.3h3.3"/>',
  chevrondown:'<path d="M6 9l6 6 6-6"/>',
  loop:     '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/>',
  weekend:  '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
};
function _repIcon(name, cls) {
  const body = REP_ICON_PATHS[name] || '';
  return `<svg class="${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

// ── History (undo/redo) — shallow snapshots of the drawings array ──
function _repPushHistory() {
  if (!_repState) return;
  _repState.history.undo.push(JSON.stringify(_repState.drawings));
  if (_repState.history.undo.length > 50) _repState.history.undo.shift();
  _repState.history.redo = [];
}
function _repUndo() {
  if (!_repState || !_repState.history.undo.length) return;
  _repState.history.redo.push(JSON.stringify(_repState.drawings));
  _repState.drawings = JSON.parse(_repState.history.undo.pop());
  _repState.selectedId = null;
  _repSaveState(); _repDrawOverlay();
}
function _repRedo() {
  if (!_repState || !_repState.history.redo.length) return;
  _repState.history.undo.push(JSON.stringify(_repState.drawings));
  _repState.drawings = JSON.parse(_repState.history.redo.pop());
  _repState.selectedId = null;
  _repSaveState(); _repDrawOverlay();
}

// ── Open / close the fullscreen replay workstation ──────
async function _repOpen(sessionId) {
  const session = _btGetSessionById(sessionId); if (!session) return;
  const saved = session.replayState || {};
  const source = _repGetSource(saved.source || 'twelvedata').id;
  const symbol = saved.symbol || _repGetSource(source).mapPair(session.pair);
  const interval = saved.interval || _repMapIntervalForSource(session.timeframe, source);

  _repState = {
    sessionId, symbol, interval, source,
    candles: [], index: 0,
    candlesPerView: saved.candlesPerView || 100,
    drawings: saved.drawings ? JSON.parse(JSON.stringify(saved.drawings)) : [],
    activeTool: null, drawDraft: null, selectedId: null, hoverId: null,
    magnet: saved.magnet !== undefined ? saved.magnet : true,
    loop: saved.loop || false,
    skipWeekends: saved.skipWeekends !== undefined ? saved.skipWeekends : true,
    playing: false, speed: saved.speed || 1,
    indicators: saved.indicators || { ema9: false, ema21: false, sma50: false, vwap: false },
    theme: Object.assign({ upColor: '#34d399', downColor: '#f87171', grid: true, volume: true, watermark: true }, saved.theme || {}),
    history: { undo: [], redo: [] },
    indicatorSeries: {},
    _savedIndex: typeof saved.index === 'number' ? saved.index : null,
    _panning: false, _dragging: null, _lastMouse: null,
  };

  _repRenderShell();
  await _repLoadCandles();
}

function _repClose() {
  _repPause();
  _repSaveState();
  document.removeEventListener('keydown', _repKeyHandler);
  try { _repState?.chart?.remove(); } catch (e) {}
  document.getElementById('rep-fullscreen-overlay')?.remove();
  _repState = null;
}

async function _repSaveState() {
  if (!_repState) return;
  const session = _btGetSessionById(_repState.sessionId); if (!session) return;
  session.replayState = {
    symbol: _repState.symbol, interval: _repState.interval, source: _repState.source,
    index: _repState.index, candlesPerView: _repState.candlesPerView,
    drawings: _repState.drawings, magnet: _repState.magnet, loop: _repState.loop,
    skipWeekends: _repState.skipWeekends, speed: _repState.speed, indicators: _repState.indicators, theme: _repState.theme,
  };
  await _blSave();
}

// ── DOM shell — FXReplay-inspired workstation layout ────
function _repRenderShell() {
  document.getElementById('rep-fullscreen-overlay')?.remove();
  const session = _btGetSessionById(_repState.sessionId);
  const overlay = document.createElement('div');
  overlay.id = 'rep-fullscreen-overlay';
  overlay.className = 'rep-fullscreen-overlay';

  const groups = {};
  REP_TOOLS.forEach(t => { (groups[t.group] = groups[t.group] || []).push(t); });
  const groupOrder = ['nav', 'lines', 'shapes', 'fib', 'ict'];
  const toolButtons = groupOrder.map((g, gi) => {
    const btns = (groups[g] || []).map(t => `
      <button class="rep-tool-btn" data-tool="${t.id}" onclick="_repSetTool('${t.id}')">
        ${_repIcon(t.id, 'icn')}<span class="rep-tooltip">${t.label}</span>
      </button>`).join('');
    return btns + (gi < groupOrder.length - 1 ? '<div class="rep-tool-sep"></div>' : '');
  }).join('');

  overlay.innerHTML = `
    <div class="rep-topbar">
      <div class="rep-topbar-group">
        <div class="rep-topbar-title"><span class="rep-live-dot"></span><span class="rep-title-text">${session?.name || 'Chart Replay'}</span></div>
        <div class="rep-topbar-divider"></div>
        <select id="rep-source-select" class="rep-select" onchange="_repSourceChanged()" title="Data source">
          ${REP_SOURCES.map(s => `<option value="${s.id}"${s.id === _repState.source ? ' selected' : ''}>${s.label}</option>`).join('')}
        </select>
        <button class="rep-icon-btn" id="rep-symbol-trigger" style="width:auto;padding:0 10px;font-family:var(--font-mono);font-weight:600;gap:6px" onclick="_repOpenSymbolSearch()" title="Search symbol (/)">
          <span>${_repState.symbol}</span>
          <svg class="icn" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        </button>
        <select id="rep-interval-select" class="rep-select" onchange="_repChangeSymbolInterval()" title="Timeframe">
          ${_repGetSource(_repState.source).intervals.map(iv => `<option value="${iv}"${iv === _repState.interval ? ' selected' : ''}>${iv}</option>`).join('')}
        </select>
        <button class="rep-icon-btn" onclick="_repChangeSymbolInterval()" title="Load"><svg class="icn" aria-hidden="true"><use href="#ic-refresh"></use></svg></button>
      </div>
      <div class="rep-topbar-group">
        <button class="rep-icon-btn" onclick="_repUndo()" title="Undo (Ctrl+Z)">${_repIcon('undo', 'icn')}</button>
        <button class="rep-icon-btn" onclick="_repRedo()" title="Redo (Ctrl+Y)">${_repIcon('redo', 'icn')}</button>
        <div class="rep-topbar-divider"></div>
        <button class="rep-icon-btn" id="rep-indicators-btn" onclick="_repToggleIndicatorsPopover()" title="Indicators">${_repIcon('indicators', 'icn')}</button>
        <button class="rep-icon-btn" onclick="_repSaveLayout()" title="Save Layout">${_repIcon('save', 'icn')}</button>
        <button class="rep-icon-btn" onclick="_repToggleLayoutsPopover()" title="Load Layout">${_repIcon('load', 'icn')}</button>
        <button class="rep-icon-btn" onclick="_repClearDrawings()" title="Clear all drawings"><svg class="icn" aria-hidden="true"><use href="#ic-trash"></use></svg></button>
        <button class="rep-icon-btn" id="rep-settings-btn" onclick="_repToggleSettingsPopover()" title="Chart settings & theme"><svg class="icn" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.2a1.7 1.7 0 013.4 0 1.7 1.7 0 002.5 1.5 1.7 1.7 0 012.4 2.4A1.7 1.7 0 0020.1 10a1.7 1.7 0 010 3.4 1.7 1.7 0 00-1.5 2.5 1.7 1.7 0 01-2.4 2.4A1.7 1.7 0 0013.7 20a1.7 1.7 0 01-3.4 0 1.7 1.7 0 00-2.5-1.5 1.7 1.7 0 01-2.4-2.4A1.7 1.7 0 003.9 13.4a1.7 1.7 0 010-3.4 1.7 1.7 0 001.5-2.5 1.7 1.7 0 012.4-2.4A1.7 1.7 0 0010.3 3.2z"/><circle cx="12" cy="12" r="3.2"/></svg></button>
        <div class="rep-topbar-divider"></div>
        <button class="rep-icon-btn" onclick="_repToggleFullscreen()" title="Fullscreen">${_repIcon('fullscreen', 'icn')}</button>
        <button class="rep-close-btn" onclick="_repClose()" title="Close"><svg class="icn" aria-hidden="true"><use href="#ic-close"></use></svg></button>
      </div>
    </div>

    <div class="rep-workspace">
      <div class="rep-left-toolbar">${toolButtons}
        <div class="rep-tool-sep"></div>
        <button class="rep-tool-btn ${_repState.magnet ? 'on' : ''}" id="rep-magnet-btn" onclick="_repToggleMagnet()">${_repIcon('magnet', 'icn')}<span class="rep-tooltip">Magnet / Snap to OHLC</span></button>
      </div>
      <div class="rep-chart-area">
        <div class="rep-chart-wrap" id="rep-chart-wrap"></div>
        <canvas class="rep-overlay-canvas" id="rep-overlay"></canvas>
        <div class="rep-symbol-badge">${_repState.symbol} · ${_repState.interval}</div>
        <div class="rep-ohlc-badge" id="rep-ohlc-badge" style="display:none"></div>
        <div class="rep-loading" id="rep-status-msg"><div class="rep-spinner"></div>Loading candles…</div>

        <div class="rep-popover" id="rep-indicators-popover" style="width:250px;max-height:70vh;overflow-y:auto">
          ${_repIndicatorPopoverHtml()}
        </div>
        <div class="rep-popover" id="rep-layouts-popover">
          <div class="rep-popover-title">Saved Layouts</div>
          <div id="rep-layouts-list" style="display:flex;flex-direction:column;gap:2px"></div>
        </div>
        <div class="rep-popover" id="rep-settings-popover" style="width:230px">
          <div class="rep-popover-title">Chart Theme</div>
          <div style="display:flex;gap:8px;padding:4px 6px 8px">
            <label style="flex:1;display:flex;flex-direction:column;gap:4px;font-size:11px;color:var(--text2)">Bull candle
              <input type="color" id="rep-theme-up" value="${_repState.theme.upColor}" oninput="_repSetTheme('upColor', this.value)" style="width:100%;height:28px;border:1px solid var(--glass-border);border-radius:6px;background:none;cursor:pointer">
            </label>
            <label style="flex:1;display:flex;flex-direction:column;gap:4px;font-size:11px;color:var(--text2)">Bear candle
              <input type="color" id="rep-theme-down" value="${_repState.theme.downColor}" oninput="_repSetTheme('downColor', this.value)" style="width:100%;height:28px;border:1px solid var(--glass-border);border-radius:6px;background:none;cursor:pointer">
            </label>
          </div>
          <div class="rep-popover-row ${_repState.theme.grid ? 'on' : ''}" data-theme-toggle="grid" onclick="_repToggleThemeFlag('grid')"><span>Grid lines</span><span class="rep-popover-check"><svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6" fill="none" stroke="currentColor" stroke-width="3"/></svg></span></div>
          <div class="rep-popover-row ${_repState.theme.volume ? 'on' : ''}" data-theme-toggle="volume" onclick="_repToggleThemeFlag('volume')"><span>Volume panel</span><span class="rep-popover-check"><svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6" fill="none" stroke="currentColor" stroke-width="3"/></svg></span></div>
          <div class="rep-popover-row ${_repState.theme.watermark ? 'on' : ''}" data-theme-toggle="watermark" onclick="_repToggleThemeFlag('watermark')"><span>Symbol watermark</span><span class="rep-popover-check"><svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6" fill="none" stroke="currentColor" stroke-width="3"/></svg></span></div>
          <div class="rep-popover-sep" style="height:1px;background:var(--glass-border);margin:6px 2px"></div>
          <div class="rep-popover-row" onclick="_repResetTheme()"><span>Reset to default</span></div>
        </div>
        <div class="rep-ctx-menu" id="rep-ctx-menu"></div>

        <div class="rep-symbol-search-backdrop" id="rep-symbol-search-backdrop" onclick="if(event.target===this)_repCloseSymbolSearch()">
          <div class="rep-symbol-search" id="rep-symbol-search" role="dialog" aria-label="Symbol search">
            <div class="rep-symsearch-input-row">
              <svg class="icn" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
              <input type="text" id="rep-symsearch-input" placeholder="Search symbol (EURUSD, XAUUSD, BTC…)" autocomplete="off" oninput="_repSymbolSearchInput(this.value)" onkeydown="_repSymbolSearchKeydown(event)">
              <button class="rep-icon-btn" onclick="_repCloseSymbolSearch()" title="Close (Esc)"><svg class="icn" aria-hidden="true"><use href="#ic-close"></use></svg></button>
            </div>
            <div class="rep-symsearch-tabs" id="rep-symsearch-tabs"></div>
            <div class="rep-symsearch-results" id="rep-symsearch-results"></div>
          </div>
        </div>


        <div class="rep-replay-pill" id="rep-replay-pill">
          <span class="rep-drag-handle"><span></span><span></span><span></span><span></span><span></span><span></span></span>
          <button class="rep-step-btn" onclick="_repReset()" title="Reset (Home)">${_repIcon('reset', 'icn')}</button>
          <button class="rep-step-btn" onclick="_repStep(-1)" title="Step back (←)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 5L8 12l8 7"/></svg></button>
          <button class="rep-play-btn" id="rep-play-btn" onclick="_repTogglePlay()" title="Play / Pause (Space)"><svg id="rep-play-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5l12 7-12 7z"/></svg></button>
          <button class="rep-step-btn" onclick="_repStep(1)" title="Step forward (→)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5l8 7-8 7"/></svg></button>
          <select id="rep-speed-select" class="rep-select" style="height:26px;padding:2px 6px" onchange="_repSetSpeed(this.value)">
            <option value="0.5">0.5x</option><option value="1" selected>1x</option>
            <option value="2">2x</option><option value="5">5x</option><option value="10">10x</option><option value="25">25x</option>
          </select>
          <div class="rep-progress-track" id="rep-progress-track">
            <div class="rep-progress-fill" id="rep-progress-fill"></div>
            <input type="range" id="rep-progress-slider" min="0" max="100" value="0" oninput="_repScrubProgress(this.value)">
          </div>
          <span class="rep-candle-counter" id="rep-candle-counter">0 / 0</span>
          <input type="date" id="rep-jump-date" class="rep-select" style="height:26px;padding:2px 6px;width:120px" onchange="_repJumpToDate(this.value)" title="Go to date">
          <button class="rep-pill-toggle ${_repState.skipWeekends ? 'active' : ''}" id="rep-weekend-btn" onclick="_repToggleSkipWeekends()" title="Skip weekends">${_repIcon('weekend', 'icn')}</button>
          <button class="rep-pill-toggle ${_repState.loop ? 'active' : ''}" id="rep-loop-btn" onclick="_repToggleLoop()" title="Loop replay">${_repIcon('loop', 'icn')}</button>
          <button class="rep-pill-toggle" onclick="_repZoom(1)" title="Zoom out (fewer candles)">－</button>
          <button class="rep-pill-toggle" onclick="_repZoom(-1)" title="Zoom in (more candles)">＋</button>
        </div>
      </div>
    </div>

    <div class="rep-bottom-dock" id="rep-bottom-dock"></div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));
  document.addEventListener('keydown', _repKeyHandler);
  _repUpdateToolbarActive();
  _repRenderIndicatorPopoverState();
  _repRenderLayoutsList();
}

// ── Keyboard shortcuts ───────────────────────────────────
function _repKeyHandler(e) {
  if (!_repState) return;
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
  if (e.code === 'Space') { e.preventDefault(); _repTogglePlay(); }
  else if (e.key === 'ArrowRight') { _repStep(1); }
  else if (e.key === 'ArrowLeft') { _repStep(-1); }
  else if (e.key === 'Home') { _repReset(); }
  else if (e.key === '/') { e.preventDefault(); _repOpenSymbolSearch(); }
  else if (e.key === 'Escape') { _repCloseSymbolSearch(); _repSetTool(null); _repHideContextMenu(); _repClosePopovers(); }
  else if (e.key === 'Delete' || e.key === 'Backspace') { _repDeleteSelected(); }
  else if (e.key === 'v' || e.key === 'V') { _repSetTool('select'); }
  else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); _repUndo(); }
  else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); _repRedo(); }
}

// ══════════════════════════════════════════════════════
// SYMBOL SEARCH — TradingView-style dialog: type to filter,
// ↑/↓/Enter/Esc to navigate, tabs for Favorites/Recent/Popular/
// Forex/Crypto/Indices/Synthetic. Reads TV_SYMBOL_CATALOG from
// tv-datafeed.js, so results here are exactly what the chart's
// Datafeed can actually resolve — no dead ends.
// ══════════════════════════════════════════════════════
const REP_SYMSEARCH_TABS = [
  { id: 'popular', label: 'Popular' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'recent', label: 'Recent' },
  { id: 'forex', label: 'Forex' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'index', label: 'Indices' },
  { id: 'synthetic', label: 'Synthetic' },
];
let _repSymSearchState = { tab: 'popular', query: '', highlighted: 0, results: [] };

function _repSymSearchStore(key) { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) { return []; } }
function _repSymSearchFavorites() { return _repSymSearchStore('nxtgen_rep_fav_symbols'); }
function _repSymSearchRecents() { return _repSymSearchStore('nxtgen_rep_recent_symbols'); }
function _repSymSearchToggleFavorite(symbol) {
  const favs = _repSymSearchFavorites();
  const idx = favs.indexOf(symbol);
  if (idx >= 0) favs.splice(idx, 1); else favs.unshift(symbol);
  localStorage.setItem('nxtgen_rep_fav_symbols', JSON.stringify(favs.slice(0, 30)));
  _repRenderSymbolSearchResults();
}
function _repSymSearchPushRecent(symbol) {
  const recents = _repSymSearchRecents().filter(s => s !== symbol);
  recents.unshift(symbol);
  localStorage.setItem('nxtgen_rep_recent_symbols', JSON.stringify(recents.slice(0, 12)));
}

function _repOpenSymbolSearch() {
  const backdrop = document.getElementById('rep-symbol-search-backdrop'); if (!backdrop) return;
  _repClosePopovers();
  _repSymSearchState = { tab: 'popular', query: '', highlighted: 0, results: [] };
  backdrop.classList.add('open');
  _repRenderSymbolSearchTabs();
  _repRenderSymbolSearchResults();
  const input = document.getElementById('rep-symsearch-input');
  if (input) { input.value = ''; setTimeout(() => input.focus(), 0); }
}
function _repCloseSymbolSearch() {
  document.getElementById('rep-symbol-search-backdrop')?.classList.remove('open');
}
function _repSetSymSearchTab(tabId) {
  _repSymSearchState.tab = tabId;
  _repSymSearchState.highlighted = 0;
  _repRenderSymbolSearchTabs();
  _repRenderSymbolSearchResults();
}
function _repRenderSymbolSearchTabs() {
  const el = document.getElementById('rep-symsearch-tabs'); if (!el) return;
  el.innerHTML = REP_SYMSEARCH_TABS.map(t => `<button class="rep-symsearch-tab ${_repSymSearchState.tab === t.id ? 'active' : ''}" onclick="_repSetSymSearchTab('${t.id}')">${t.label}</button>`).join('');
}
function _repSymbolSearchInput(value) {
  _repSymSearchState.query = value;
  _repSymSearchState.highlighted = 0;
  _repRenderSymbolSearchResults();
}
function _repSymbolSearchMatches() {
  const q = (_repSymSearchState.query || '').trim().toUpperCase();
  const pool = (typeof TV_SYMBOL_CATALOG !== 'undefined') ? TV_SYMBOL_CATALOG : [];
  if (q) return pool.filter(s => s.symbol.toUpperCase().includes(q) || s.description.toUpperCase().includes(q));
  if (_repSymSearchState.tab === 'favorites') { const favs = _repSymSearchFavorites(); return pool.filter(s => favs.includes(s.symbol)); }
  if (_repSymSearchState.tab === 'recent') return _repSymSearchRecents().map(sym => pool.find(s => s.symbol === sym)).filter(Boolean);
  if (_repSymSearchState.tab === 'popular') return pool;
  return pool.filter(s => s.type === _repSymSearchState.tab);
}
function _repRenderSymbolSearchResults() {
  const el = document.getElementById('rep-symsearch-results'); if (!el) return;
  const favs = _repSymSearchFavorites();
  const results = _repSymbolSearchMatches();
  _repSymSearchState.results = results;
  if (!results.length) {
    el.innerHTML = `<div class="rep-symsearch-empty">No symbols match "${_repSymSearchState.query}"</div>`;
    return;
  }
  el.innerHTML = results.map((s, i) => `
    <div class="rep-symsearch-row ${i === _repSymSearchState.highlighted ? 'highlighted' : ''}" onmouseenter="_repSymSearchState.highlighted=${i}" onclick="_repSymbolSearchSelect('${s.symbol}')">
      <span class="rep-symsearch-type">${s.type}</span>
      <span class="rep-symsearch-name">${s.symbol}</span>
      <span class="rep-symsearch-desc">${s.description}</span>
      <button class="rep-symsearch-fav ${favs.includes(s.symbol) ? 'on' : ''}" onclick="event.stopPropagation();_repSymSearchToggleFavorite('${s.symbol}')" title="Favorite">★</button>
    </div>`).join('');
}
function _repSymbolSearchKeydown(e) {
  const results = _repSymSearchState.results;
  if (e.key === 'ArrowDown') { e.preventDefault(); _repSymSearchState.highlighted = Math.min(results.length - 1, _repSymSearchState.highlighted + 1); _repRenderSymbolSearchResults(); _repSymSearchScrollHighlighted(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); _repSymSearchState.highlighted = Math.max(0, _repSymSearchState.highlighted - 1); _repRenderSymbolSearchResults(); _repSymSearchScrollHighlighted(); }
  else if (e.key === 'Enter') { e.preventDefault(); const s = results[_repSymSearchState.highlighted]; if (s) _repSymbolSearchSelect(s.symbol); }
  else if (e.key === 'Escape') { e.preventDefault(); _repCloseSymbolSearch(); }
}
function _repSymSearchScrollHighlighted() {
  document.querySelector('#rep-symsearch-results .rep-symsearch-row.highlighted')?.scrollIntoView({ block: 'nearest' });
}

async function _repSymbolSearchSelect(symbol) {
  if (!_repState) return;
  _repSymSearchPushRecent(symbol);
  _repCloseSymbolSearch();
  _repPause();
  _repState.symbol = symbol;
  _repState._savedIndex = null;

  const chart = _repState.tvChart;
  if (chart && chart.setSymbol) {
    // Real chart already exists — swap its symbol in place instead
    // of tearing down and rebuilding the whole widget.
    const tvInterval = tvIntervalFromSourceInterval(_repState.interval, _repState.source);
    chart.setSymbol(symbol, tvInterval, () => {
      if (window.TVReplay) { TVReplay.bars = []; TVReplay.cursor = -1; } // force re-seed on next getBars
      _repRenderShell();
      _repLoadCandles(); // keeps _repState.candles/index/HUD in sync exactly as before
    });
  } else {
    _repRenderShell();
    await _repLoadCandles();
  }
}

async function _repChangeSymbolInterval() {
  if (!_repState) return;
  _repPause();
  _repState.interval = document.getElementById('rep-interval-select')?.value || _repState.interval;
  _repState._savedIndex = null;
  await _repLoadCandles();
}

function _repSourceChanged() {
  if (!_repState) return;
  const newSourceId = document.getElementById('rep-source-select')?.value || _repState.source;
  const oldSession = _btGetSessionById(_repState.sessionId);
  const newSrc = _repGetSource(newSourceId);
  _repState.symbol = newSrc.mapPair(oldSession?.pair) || newSrc.symbolPlaceholder;
  _repState.interval = _repMapIntervalForSource(oldSession?.timeframe, newSourceId);
  _repState.source = newSourceId;
  _repState._savedIndex = null;
  _repRenderShell();
  _repLoadCandles();
}

// ── Load candles + boot the chart ───────────────────────
async function _repLoadCandles() {
  const status = document.getElementById('rep-status-msg');
  if (status) status.innerHTML = '<div class="rep-spinner"></div>Loading candles…';
  if (status) status.style.display = 'flex';
  try {
    const result = await _repFetchCandles(_repState.symbol, _repState.interval, 500, _repState.source);
    const candles = result.candles || [];
    if (!candles.length) throw new Error('No candle data returned for this symbol/interval');

    if (result.fallback && result.source !== _repState.source) {
      const from = _repGetSource(result.requestedSource || _repState.source).label;
      const to = _repGetSource(result.source).label;
      _repState.source = result.source;
      _repState.symbol = result.symbol || _repState.symbol;
      _repState.interval = result.interval || _repState.interval;
      _repRenderShell();
      if (typeof showToast === 'function') showToast(`${from} unavailable — showing ${to} data instead`, 'info');
    }

    _repState.candles = candles;
    const seed = Math.min(_repState.candlesPerView - 1, candles.length - 1);
    _repState.index = (_repState._savedIndex !== null && _repState._savedIndex < candles.length) ? _repState._savedIndex : seed;

    const chartReady = _repState.chart ? true : _repInitChart();
    if (chartReady) {
      _repSetChartData(true);
      if (status) status.style.display = 'none';
    }
    // Keep the counter/progress bar/date field in sync with the
    // loaded candles regardless of whether the chart itself could
    // render (e.g. charting_library/ not added yet) — this used to
    // get stuck at 0 / 0 because _repSetChartData bails out early
    // when there's no chart, and the HUD update lived inside it.
    _repUpdateReplayHud();
    _repRenderBottomDock();
  } catch (err) {
    const isSetup = /404|not found|relay/i.test(err.message);
    if (status) {
      status.innerHTML = `<div>Couldn't load chart data: ${err.message}</div><small style="color:var(--text3)">${isSetup ? 'The market-data-proxy Edge Function may not be deployed yet, or TWELVE_DATA_API_KEY isn\'t set.' : 'Double-check the symbol format (e.g. EUR/USD) and try again.'}</small>`;
      status.classList.add('rep-error'); status.style.display = 'flex';
    }
  }
}

// ── TradingView Advanced Charting Library bootstrap ─────
// Requires charting_library/ (from TradingView's private repo,
// see TRADINGVIEW_INTEGRATION_GUIDE.md) and tv-datafeed.js to be
// loaded first. Until that folder is added, `TradingView.widget`
// won't exist and this will throw — the catch below falls back
// to a clear status message instead of a silent blank chart.
function _repInitChart() {
  const container = document.getElementById('rep-chart-wrap'); if (!container) return false;
  if (typeof TradingView === 'undefined' || !TradingView.widget) {
    const status = document.getElementById('rep-status-msg');
    if (status) {
      status.innerHTML = `<div>TradingView charting library not found.</div><small style="color:var(--text3)">Add charting_library/ (see TRADINGVIEW_INTEGRATION_GUIDE.md) and reload.</small>`;
      status.classList.add('rep-error'); status.style.display = 'flex';
    }
    return false;
  }

  const tvInterval = tvIntervalFromSourceInterval(_repState.interval, _repState.source);
  const widget = new TradingView.widget({
    container,
    library_path: 'charting_library/',
    datafeed: TVDatafeed,
    symbol: _repState.symbol,
    interval: tvInterval,
    fullscreen: false,
    autosize: true,
    theme: 'Dark',
    overrides: {
      'paneProperties.background': '#080b12',
      'paneProperties.backgroundType': 'solid',
      'paneProperties.vertGridProperties.color': 'rgba(255,255,255,.04)',
      'paneProperties.horzGridProperties.color': 'rgba(255,255,255,.04)',
      'mainSeriesProperties.candleStyle.upColor': '#34d399',
      'mainSeriesProperties.candleStyle.downColor': '#f87171',
      'mainSeriesProperties.candleStyle.wickUpColor': '#34d399',
      'mainSeriesProperties.candleStyle.wickDownColor': '#f87171',
      'mainSeriesProperties.candleStyle.borderVisible': false,
      'scalesProperties.textColor': 'rgba(226,232,240,.62)',
    },
    disabled_features: ['header_symbol_search', 'header_compare'],
    enabled_features: ['study_templates', 'use_localstorage_for_settings'],
    client_id: 'nxtgen-journal',
    user_id: (window._currentUserId || 'guest'),
    load_last_chart: true,
  });

  widget.onChartReady(() => {
    _repState.tvChart = widget.activeChart();
    _repApplyTheme();
    _repUpdateReplayHud();
  });

  _repState.chart = widget;
  return true;
}

// Kept as a no-op call target — the real chart autosizes itself.
// This used to resize the canvas overlay the old hand-rolled
// drawing engine painted into.
function _repResizeOverlay() {}

// TV resolution string ("1","5","15","30","60","240","1D","1W")
// from whatever interval shorthand the active source uses.
function tvIntervalFromSourceInterval(interval, sourceId) {
  const table = {
    twelvedata: { '1min': '1', '5min': '5', '15min': '15', '30min': '30', '1h': '60', '4h': '240', '1day': '1D', '1week': '1W' },
    dukascopy: { m1: '1', m5: '5', m15: '15', m30: '30', h1: '60', h4: '240', d1: '1D' },
    oanda: { M1: '1', M5: '5', M15: '15', M30: '30', H1: '60', H4: '240', D: '1D', W: '1W' },
  };
  return (table[sourceId] && table[sourceId][interval]) || '60';
}

// ── Feed the visible replay window into the real chart ──
// _repState.index stays the single source of truth (every existing
// play/step/scrub/jump-to-date function only ever touches that
// number, unchanged) — this function's job is just to make the
// real TradingView chart agree with it.
//
// The library's realtime API (subscribeBars) is built for a live
// feed appending new bars in order, not for arbitrary rewinding —
// so a plain +1 step is pushed as a tick (cheap, matches how the
// library expects updates), while any backward step, scrub, or
// date-jump forces the datafeed's getBars to be re-queried against
// the new cursor via resetCache()/resetData().
function _repSetChartData(recenter) {
  if (!_repState || !_repState.chart) return;
  if (!window.TVReplay || !TVReplay.bars.length) { _repUpdateReplayHud(); return; }

  const delta = _repState.index - TVReplay.cursor;
  if (delta === 1) {
    TVReplay.step(1);
  } else if (delta !== 0) {
    TVReplay.cursor = _repState.index;
    const chart = _repState.tvChart;
    if (chart && chart.resetCache && chart.resetData) {
      chart.resetCache();
      chart.resetData();
    }
  }
  _repUpdateReplayHud();
}

function _repUpdateReplayHud() {
  if (!_repState) return;
  const total = _repState.candles.length;
  const pct = total > 1 ? (_repState.index / (total - 1)) * 100 : 0;
  const fill = document.getElementById('rep-progress-fill'); if (fill) fill.style.width = pct + '%';
  const slider = document.getElementById('rep-progress-slider'); if (slider) slider.value = pct;
  const counter = document.getElementById('rep-candle-counter'); if (counter) counter.textContent = `${_repState.index + 1} / ${total}`;
  const dateInput = document.getElementById('rep-jump-date');
  const c = _repState.candles[_repState.index];
  if (dateInput && c) dateInput.value = new Date(c.time).toISOString().slice(0, 10);
}

// ══════════════════════════════════════════════════════
// COORDINATE HELPERS — bridge chart pixel space ↔ time/price
// ══════════════════════════════════════════════════════
function _repTimeMsToX(ms) {
  const x = _repState.chart.timeScale().timeToCoordinate(Math.floor(ms / 1000));
  return x;
}
function _repPriceToY(price) { return _repState.candleSeries.priceToCoordinate(price); }
function _repYToPrice(y) { return _repState.candleSeries.coordinateToPrice(y); }
function _repXToTimeMs(x) {
  const ts = _repState.chart.timeScale();
  const t = ts.coordinateToTime(x);
  if (t != null) return t * 1000;
  // extrapolate into empty space to the right (or left) of loaded data
  const logical = ts.coordinateToLogical(x);
  const slice = _repState.candles.slice(0, _repState.index + 1);
  if (logical == null || slice.length < 2) return null;
  const barMs = slice[slice.length - 1].time - slice[slice.length - 2].time;
  return slice[slice.length - 1].time + Math.round(logical - (slice.length - 1)) * barMs;
}
function _repSnapPoint(point) {
  if (!_repState.magnet) return point;
  const idx = _repIndexForTime(point.time);
  const c = _repState.candles[idx];
  if (!c) return point;
  const candidates = [c.open, c.high, c.low, c.close];
  let best = candidates[0], bestDist = Infinity;
  candidates.forEach(v => { const d = Math.abs(v - point.price); if (d < bestDist) { bestDist = d; best = v; } });
  return { time: c.time, price: best };
}
function _repPointFromPixel(x, y) {
  const time = _repXToTimeMs(x);
  const price = _repYToPrice(y);
  if (time == null || price == null) return null;
  return _repSnapPoint({ time, price });
}

// ══════════════════════════════════════════════════════
// OVERLAY RENDERING — drawings live in chart-relative time/
// price space and get re-projected to pixels every frame,
// so they stay glued to their candles through pan/zoom.
// ══════════════════════════════════════════════════════
function _repDrawOverlay() {
  if (!_repState || !_repState.overlayCtx) return;
  const ctx = _repState.overlayCtx, W = _repState.overlayW, H = _repState.overlayH;
  ctx.clearRect(0, 0, W, H);
  (_repState.drawings || []).forEach((dw, i) => _repRenderOneDrawing(ctx, dw, i === _repState._hoverIdx, dw.id === _repState.selectedId));
  if (_repState.drawDraft && _repState.drawDraft.p1) {
    const tool = REP_TOOLS.find(t => t.id === _repState.activeTool);
    if (tool && tool.kind === 'brush') {
      _repRenderOneDrawing(ctx, { kind: 'brush', color: tool.color, points: _repState.drawDraft.points }, false, false);
    } else if (tool && _repState.drawDraft.cur) {
      _repRenderOneDrawing(ctx, {
        kind: tool.kind, color: tool.color, stroke: tool.stroke, dashed: tool.dashed,
        arrow: tool.arrow, measure: tool.measure, label: tool.drawLabel, extension: tool.extension,
        p1: _repState.drawDraft.p1, p2: _repState.drawDraft.cur,
      }, false, false);
    }
  }
  if (_repState._manualCrosshair) _repRenderManualCrosshair(ctx);
}

function _repRenderManualCrosshair(ctx) {
  const { x, y } = _repState._manualCrosshair;
  ctx.save();
  ctx.strokeStyle = 'rgba(226,232,240,.28)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(_repState.overlayW, y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, _repState.overlayH); ctx.stroke();
  ctx.restore();
}

function _repRenderOneDrawing(ctx, dw, hovered, selected) {
  ctx.save();
  ctx.strokeStyle = dw.stroke || dw.color; ctx.fillStyle = dw.color;
  ctx.lineWidth = selected ? 2.25 : (hovered ? 2 : 1.5);
  ctx.setLineDash(dw.dashed ? [5, 4] : []);

  const handles = [];

  if (dw.kind === 'hline') {
    const y = _repPriceToY(dw.p1.price); if (y == null) { ctx.restore(); return; }
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(_repState.overlayW - 2, y); ctx.stroke();
    ctx.setLineDash([]); ctx.fillStyle = dw.color; ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText(dw.p1.price.toFixed(5), 6, y - 4);
    handles.push({ x: 40, y, key: 'p1' });
  } else if (dw.kind === 'vline') {
    const x = _repTimeMsToX(dw.p1.time); if (x == null) { ctx.restore(); return; }
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, _repState.overlayH); ctx.stroke();
    handles.push({ x, y: 30, key: 'p1' });
  } else if (dw.kind === 'rect' || dw.kind === 'circle') {
    const x1 = _repTimeMsToX(dw.p1.time), x2 = _repTimeMsToX(dw.p2.time);
    const y1 = _repPriceToY(dw.p1.price), y2 = _repPriceToY(dw.p2.price);
    if ([x1, x2, y1, y2].some(v => v == null)) { ctx.restore(); return; }
    const rx = Math.min(x1, x2), ry = Math.min(y1, y2), rw = Math.abs(x2 - x1), rh = Math.abs(y2 - y1);
    ctx.setLineDash(dw.dashed ? [5, 4] : []);
    if (dw.kind === 'rect') { ctx.fillRect(rx, ry, rw, rh); ctx.strokeRect(rx, ry, rw, rh); }
    else { ctx.beginPath(); ctx.ellipse(rx + rw / 2, ry + rh / 2, rw / 2, rh / 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    if (dw.label) { ctx.setLineDash([]); ctx.fillStyle = dw.stroke || dw.color; ctx.font = '10px Plus Jakarta Sans, sans-serif'; ctx.fillText(dw.label, rx + 4, ry + 12); }
    handles.push({ x: x1, y: y1, key: 'p1' }, { x: x2, y: y2, key: 'p2' });
  } else if (dw.kind === 'line' || dw.kind === 'ray') {
    let x1 = _repTimeMsToX(dw.p1.time), y1 = _repPriceToY(dw.p1.price);
    let x2 = _repTimeMsToX(dw.p2.time), y2 = _repPriceToY(dw.p2.price);
    if ([x1, y1, x2, y2].some(v => v == null)) { ctx.restore(); return; }
    if (dw.kind === 'ray' && x2 !== x1) {
      const slope = (y2 - y1) / (x2 - x1);
      const edgeX = _repState.overlayW;
      const edgeY = y1 + slope * (edgeX - x1);
      x2 = edgeX; y2 = edgeY;
    }
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    if (dw.arrow) {
      const angle = Math.atan2(y2 - y1, x2 - x1), len = 9;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(x2, y2); ctx.lineTo(x2 - len * Math.cos(angle - Math.PI / 6), y2 - len * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(x2, y2); ctx.lineTo(x2 - len * Math.cos(angle + Math.PI / 6), y2 - len * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    }
    if (dw.measure) {
      const dPrice = dw.p2.price - dw.p1.price;
      const dMin = Math.round((dw.p2.time - dw.p1.time) / 60000);
      const pips = Math.abs(dPrice) * (dw.p1.price < 20 ? 10000 : 100);
      ctx.setLineDash([]); ctx.fillStyle = dw.color; ctx.font = '11px JetBrains Mono, monospace';
      ctx.fillText(`${dPrice >= 0 ? '+' : ''}${dPrice.toFixed(5)}  (${pips.toFixed(1)}p)  ${dMin}m`, (x1 + x2) / 2 + 8, (y1 + y2) / 2 - 8);
    }
    const origX2 = _repTimeMsToX(dw.p2.time), origY2 = _repPriceToY(dw.p2.price);
    handles.push({ x: x1, y: y1, key: 'p1' }, { x: origX2 ?? x2, y: origY2 ?? y2, key: 'p2' });
  } else if (dw.kind === 'fib') {
    const levels = dw.extension ? [0, 0.618, 1, 1.272, 1.618, 2, 2.618] : [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    const x1 = _repTimeMsToX(dw.p1.time), x2 = _repTimeMsToX(dw.p2.time);
    if (x1 == null || x2 == null) { ctx.restore(); return; }
    levels.forEach(l => {
      const price = dw.p1.price + (dw.p2.price - dw.p1.price) * l;
      const y = _repPriceToY(price); if (y == null) return;
      ctx.beginPath(); ctx.moveTo(Math.min(x1, x2), y); ctx.lineTo(Math.max(x1, x2), y); ctx.stroke();
      ctx.setLineDash([]); ctx.fillStyle = dw.color; ctx.font = '9px JetBrains Mono, monospace';
      ctx.fillText(`${l} (${price.toFixed(5)})`, Math.max(x1, x2) + 4, y + 3);
      ctx.setLineDash(dw.dashed ? [5, 4] : []);
    });
    const y1 = _repPriceToY(dw.p1.price), y2 = _repPriceToY(dw.p2.price);
    handles.push({ x: x1, y: y1, key: 'p1' }, { x: x2, y: y2, key: 'p2' });
  } else if (dw.kind === 'text') {
    const x = _repTimeMsToX(dw.p1.time), y = _repPriceToY(dw.p1.price);
    if (x == null || y == null) { ctx.restore(); return; }
    ctx.setLineDash([]); ctx.fillStyle = dw.color; ctx.font = '600 12px Plus Jakarta Sans, sans-serif';
    ctx.fillText(dw.text || '', x, y);
    handles.push({ x, y, key: 'p1' });
  } else if (dw.kind === 'brush') {
    const pts = (dw.points || []).map(p => ({ x: _repTimeMsToX(p.time), y: _repPriceToY(p.price) })).filter(p => p.x != null && p.y != null);
    if (pts.length < 2) { ctx.restore(); return; }
    ctx.setLineDash([]); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();
  }

  if (selected) {
    ctx.setLineDash([]);
    handles.forEach(h => {
      if (h.x == null || h.y == null) return;
      ctx.beginPath(); ctx.arc(h.x, h.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#0b0e14'; ctx.fill();
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2; ctx.stroke();
    });
  }
  ctx.restore();
  Object.defineProperty(dw, '_handles', { value: handles, writable: true, configurable: true, enumerable: false });
}

// ── Hit-testing for the selection tool ──────────────────
function _repDistToSegment(px, py, x1, y1, x2, y2) {
  const A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1;
  const dot = A * C + B * D, lenSq = C * C + D * D;
  let t = lenSq ? dot / lenSq : -1;
  t = Math.max(0, Math.min(1, t));
  const ex = x1 + t * C, ey = y1 + t * D;
  return Math.hypot(px - ex, py - ey);
}
function _repHitTest(px, py) {
  const list = _repState.drawings;
  for (let i = list.length - 1; i >= 0; i--) {
    const dw = list[i];
    const handles = dw._handles || [];
    for (const h of handles) {
      if (h.x == null || h.y == null) continue;
      if (Math.hypot(px - h.x, py - h.y) <= 6) return { drawing: dw, index: i, handle: h.key };
    }
    if (dw.kind === 'hline') { const y = _repPriceToY(dw.p1.price); if (y != null && Math.abs(py - y) <= 5) return { drawing: dw, index: i, handle: 'body' }; }
    else if (dw.kind === 'vline') { const x = _repTimeMsToX(dw.p1.time); if (x != null && Math.abs(px - x) <= 5) return { drawing: dw, index: i, handle: 'body' }; }
    else if (dw.kind === 'line' || dw.kind === 'ray' || dw.kind === 'measure') {
      const x1 = _repTimeMsToX(dw.p1.time), y1 = _repPriceToY(dw.p1.price), x2 = _repTimeMsToX(dw.p2.time), y2 = _repPriceToY(dw.p2.price);
      if ([x1, y1, x2, y2].every(v => v != null) && _repDistToSegment(px, py, x1, y1, x2, y2) <= 6) return { drawing: dw, index: i, handle: 'body' };
    } else if (dw.kind === 'rect' || dw.kind === 'circle' || dw.kind === 'fib') {
      const x1 = _repTimeMsToX(dw.p1.time), x2 = _repTimeMsToX(dw.p2.time), y1 = _repPriceToY(dw.p1.price), y2 = _repPriceToY(dw.p2.price);
      if ([x1, x2, y1, y2].every(v => v != null)) {
        const rx = Math.min(x1, x2), ry = Math.min(y1, y2), rw = Math.abs(x2 - x1), rh = Math.abs(y2 - y1);
        if (px >= rx && px <= rx + rw && py >= ry && py <= ry + rh) return { drawing: dw, index: i, handle: 'body' };
      }
    } else if (dw.kind === 'text') {
      const x = _repTimeMsToX(dw.p1.time), y = _repPriceToY(dw.p1.price);
      if (x != null && y != null && px >= x - 4 && px <= x + 90 && py >= y - 14 && py <= y + 6) return { drawing: dw, index: i, handle: 'body' };
    }
  }
  return null;
}

// ══════════════════════════════════════════════════════
// OVERLAY MOUSE / WHEEL / CONTEXT-MENU HANDLERS
// ══════════════════════════════════════════════════════
function _repOverlayLocalXY(e) {
  const rect = document.getElementById('rep-overlay').getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function _repOverlayMouseDown(e) {
  if (!_repState || !_repState.activeTool) return; // no tool → let native chart pan/zoom/crosshair run
  const { x, y } = _repOverlayLocalXY(e);
  const tool = REP_TOOLS.find(t => t.id === _repState.activeTool);
  _repHideContextMenu();

  if (_repState.activeTool === 'select') {
    const hit = _repHitTest(x, y);
    if (hit) {
      _repState.selectedId = hit.drawing.id;
      _repPushHistory();
      _repState._dragging = { drawing: hit.drawing, handle: hit.handle, startX: x, startY: y, orig: JSON.parse(JSON.stringify(hit.drawing)) };
    } else {
      _repState.selectedId = null;
      _repState._panning = { startX: x, startLogical: _repState.chart.timeScale().getVisibleLogicalRange() };
    }
    _repDrawOverlay();
    return;
  }

  const point = _repPointFromPixel(x, y); if (!point) return;

  if (tool.kind === 'hline') { _repPushHistory(); _repState.drawings.push({ id: _repUid(), type: tool.id, kind: 'hline', color: tool.color, dashed: tool.dashed, p1: { price: point.price } }); _repFinishToolPlacement(); return; }
  if (tool.kind === 'vline') { _repPushHistory(); _repState.drawings.push({ id: _repUid(), type: tool.id, kind: 'vline', color: tool.color, p1: { time: point.time } }); _repFinishToolPlacement(); return; }
  if (tool.kind === 'text') {
    const txt = prompt('Annotation text:');
    if (txt) { _repPushHistory(); _repState.drawings.push({ id: _repUid(), type: tool.id, kind: 'text', color: tool.color, p1: point, text: txt }); }
    _repFinishToolPlacement(); return;
  }
  if (tool.kind === 'brush') { _repState.drawDraft = { p1: point, points: [point] }; return; }
  _repState.drawDraft = { p1: point, cur: point };
}

function _repOverlayMouseMove(e) {
  if (!_repState) return;
  const { x, y } = _repOverlayLocalXY(e);

  if (_repState._panning) {
    const dxPx = x - _repState._panning.startX;
    const barW = _repState.overlayW / Math.max(1, _repState.candlesPerView);
    const deltaBars = dxPx / barW;
    const r = _repState._panning.startLogical;
    if (r) _repState.chart.timeScale().setVisibleLogicalRange({ from: r.from - deltaBars, to: r.to - deltaBars });
    return;
  }
  if (_repState._dragging) {
    const d = _repState._dragging;
    const point = _repPointFromPixel(x, y); if (!point) return;
    if (d.drawing.kind === 'hline') d.drawing.p1.price = point.price;
    else if (d.drawing.kind === 'vline') d.drawing.p1.time = point.time;
    else if (d.drawing.kind === 'text') d.drawing.p1 = point;
    else if (d.handle === 'p1') d.drawing.p1 = point;
    else if (d.handle === 'p2') d.drawing.p2 = point;
    else if (d.handle === 'body') {
      const startPoint = _repPointFromPixel(d.startX, d.startY);
      if (startPoint && d.orig.p1) {
        const dt = point.time - startPoint.time, dp = point.price - startPoint.price;
        d.drawing.p1 = { time: d.orig.p1.time + dt, price: d.orig.p1.price + dp };
        if (d.orig.p2) d.drawing.p2 = { time: d.orig.p2.time + dt, price: d.orig.p2.price + dp };
      }
    }
    _repDrawOverlay();
    return;
  }
  if (_repState.drawDraft) {
    const tool = REP_TOOLS.find(t => t.id === _repState.activeTool);
    const point = _repPointFromPixel(x, y); if (!point) return;
    if (tool && tool.kind === 'brush') _repState.drawDraft.points.push(point);
    else _repState.drawDraft.cur = point;
    _repDrawOverlay();
    return;
  }
  const hit = _repHitTest(x, y);
  _repState._hoverIdx = hit ? hit.index : -1;
  _repState._manualCrosshair = { x, y };
  const point = _repPointFromPixel(x, y);
  if (point) _repUpdateOhlcBadge(point.time);
  _repDrawOverlay();
}

function _repOverlayMouseUp() {
  if (!_repState) return;
  if (_repState._panning) { _repState._panning = null; return; }
  if (_repState._dragging) { _repState._dragging = null; _repSaveState(); return; }
  if (_repState.drawDraft) {
    const tool = REP_TOOLS.find(t => t.id === _repState.activeTool);
    if (tool && tool.kind === 'brush') {
      if (_repState.drawDraft.points.length > 1) { _repPushHistory(); _repState.drawings.push({ id: _repUid(), type: tool.id, kind: 'brush', color: tool.color, points: _repState.drawDraft.points }); }
      _repState.drawDraft = null; _repFinishToolPlacement(); return;
    }
    if (tool && _repState.drawDraft.cur) {
      _repPushHistory();
      _repState.drawings.push({
        id: _repUid(), type: tool.id, kind: tool.kind, color: tool.color, stroke: tool.stroke,
        dashed: tool.dashed, arrow: tool.arrow, measure: tool.measure, label: tool.drawLabel, extension: tool.extension,
        p1: _repState.drawDraft.p1, p2: _repState.drawDraft.cur,
      });
    }
    _repState.drawDraft = null;
    _repFinishToolPlacement();
  }
}

function _repOverlayWheel(e) {
  e.preventDefault();
  _repZoom(e.deltaY > 0 ? 1 : -1);
}

function _repOverlayDblClick() {
  if (_repState?.drawDraft?.points) { _repOverlayMouseUp(); }
}

function _repOverlayContextMenu(e) {
  e.preventDefault();
  if (!_repState) return;
  const { x, y } = _repOverlayLocalXY(e);
  const hit = _repHitTest(x, y);
  if (!hit) { _repHideContextMenu(); return; }
  _repState.selectedId = hit.drawing.id;
  _repDrawOverlay();
  _repShowContextMenu(e.clientX, e.clientY, hit.drawing, hit.index);
}

function _repFinishToolPlacement() {
  _repState.activeTool = 'select';
  _repUpdateToolbarActive();
  _repSaveState();
  _repDrawOverlay();
}

function _repUpdateOhlcBadge(timeMs) {
  const idx = _repIndexForTime(timeMs);
  const c = _repState.candles[Math.min(idx, _repState.index)];
  const badge = document.getElementById('rep-ohlc-badge'); if (!badge || !c) return;
  const up = c.close >= c.open;
  const d = new Date(c.time);
  badge.style.display = 'flex';
  badge.innerHTML = `<span>${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    <span>O <b>${c.open.toFixed(5)}</b></span><span>H <b>${c.high.toFixed(5)}</b></span>
    <span>L <b>${c.low.toFixed(5)}</b></span><span class="${up ? 'up' : 'dn'}">C <b>${c.close.toFixed(5)}</b></span>`;
}

function _repNativeCrosshairUpdate(param) {
  if (!_repState || _repState.activeTool) return;
  if (!param || !param.time) { const b = document.getElementById('rep-ohlc-badge'); if (b) b.style.display = 'none'; return; }
  _repUpdateOhlcBadge(param.time * 1000);
}

// ══════════════════════════════════════════════════════
// TOOLBAR / TOGGLES
// ══════════════════════════════════════════════════════
function _repSetTool(id) {
  _repState.activeTool = (_repState.activeTool === id) ? null : id;
  _repState.drawDraft = null;
  _repUpdateToolbarActive();
  const chart = _repState.tvChart; if (!chart) return;
  const toolName = TV_LINE_TOOL_MAP[_repState.activeTool];
  chart.selectLineTool((_repState.activeTool && toolName && toolName !== 'cursor') ? toolName : 'cursor');
}
function _repUpdateToolbarActive() {
  document.querySelectorAll('.rep-tool-btn[data-tool]').forEach(b => b.classList.toggle('active', b.dataset.tool === _repState.activeTool));
  const overlay = document.getElementById('rep-overlay');
  if (overlay) overlay.classList.toggle('drawing', !!_repState.activeTool);
  if (!_repState.activeTool) { _repState._manualCrosshair = null; _repDrawOverlay?.(); }
}
function _repToggleMagnet() {
  _repState.magnet = !_repState.magnet;
  document.getElementById('rep-magnet-btn')?.classList.toggle('on', _repState.magnet);
  _repSaveState();
}
function _repToggleLoop() {
  _repState.loop = !_repState.loop;
  document.getElementById('rep-loop-btn')?.classList.toggle('active', _repState.loop);
  _repSaveState();
}
function _repToggleSkipWeekends() {
  _repState.skipWeekends = !_repState.skipWeekends;
  document.getElementById('rep-weekend-btn')?.classList.toggle('active', _repState.skipWeekends);
  _repSaveState();
}
function _repClearDrawings() {
  openGlassModal({
    icon: '<svg class="icn" aria-hidden="true"><use href="#ic-trash"></use></svg>',
    title: 'Clear All Drawings?',
    body: 'Every trendline, zone, and annotation on this chart will be removed. This cannot be undone.',
    confirmLabel: 'Clear Drawings',
    confirmClass: 'glass-btn-danger',
    onConfirm: () => { _repState.tvChart?.removeAllShapes(); }
  });
}
function _repDeleteSelected() {
  const chart = _repState?.tvChart; if (!chart) return;
  chart.selection().allSources().forEach(id => chart.removeEntity(id));
  chart.selection().clear();
  _repHideContextMenu();
}
function _repDuplicateSelected() {
  const chart = _repState?.tvChart; if (!chart) return;
  const [id] = chart.selection().allSources(); if (!id) return;
  const shape = chart.getShapeById(id); if (!shape) return;
  const shiftSec = ((_repState.candles[1]?.time - _repState.candles[0]?.time) / 1000 * 6) || 0;
  const points = shape.getPoints().map(p => ({ ...p, time: p.time + shiftSec }));
  const props = shape.getProperties();
  chart.createMultipointShape(points, { shape: props.linetool || props.shape, overrides: props }).then(newId => {
    chart.selection().clear();
    chart.selection().add(newId);
  });
  _repHideContextMenu();
}
function _repChangeLayer(dir) {
  if (!_repState || !_repState.selectedId) return;
  const list = _repState.drawings;
  const i = list.findIndex(d => d.id === _repState.selectedId); if (i < 0) return;
  const j = dir > 0 ? i + 1 : i - 1;
  if (j < 0 || j >= list.length) return;
  _repPushHistory();
  [list[i], list[j]] = [list[j], list[i]];
  _repSaveState(); _repDrawOverlay(); _repHideContextMenu();
}
function _repSetDrawingColor(color) {
  if (!_repState || !_repState.selectedId) return;
  const dw = _repState.drawings.find(d => d.id === _repState.selectedId); if (!dw) return;
  _repPushHistory();
  dw.color = color; if (dw.stroke) dw.stroke = color;
  _repSaveState(); _repDrawOverlay(); _repHideContextMenu();
}

// ── Right-click context menu ─────────────────────────────
const REP_CTX_COLORS = ['#fbbf24', '#60a5fa', '#34d399', '#f87171', '#a78bfa', '#f472b6', '#e2e8f0'];
function _repShowContextMenu(clientX, clientY, drawing, index) {
  const menu = document.getElementById('rep-ctx-menu'); if (!menu) return;
  menu.innerHTML = `
    <div class="rep-ctx-item" onclick="_repDuplicateSelected()">${_repIcon('save', 'icn')}Duplicate</div>
    <div class="rep-ctx-item" onclick="_repChangeLayer(1)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M4 8l8-5 8 5-8 5z"/><path d="M4 16l8 5 8-5"/></svg>Bring Forward</div>
    <div class="rep-ctx-item" onclick="_repChangeLayer(-1)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M4 16l8-5 8 5-8 5z"/><path d="M4 8l8 5 8-5"/></svg>Send Backward</div>
    <div class="rep-ctx-sep"></div>
    <div class="rep-ctx-colors">${REP_CTX_COLORS.map(c => `<div class="rep-ctx-color" style="background:${c}" onclick="_repSetDrawingColor('${c}')"></div>`).join('')}</div>
    <div class="rep-ctx-sep"></div>
    <div class="rep-ctx-item danger" onclick="_repDeleteSelected()"><svg class="icn" viewBox="0 0 24 24"><use href="#ic-trash"></use></svg>Delete</div>
  `;
  menu.style.left = clientX + 'px'; menu.style.top = clientY + 'px';
  menu.classList.add('open');
  setTimeout(() => document.addEventListener('click', _repHideContextMenu, { once: true }), 0);
}
function _repHideContextMenu() { document.getElementById('rep-ctx-menu')?.classList.remove('open'); }

// ── Indicators / layouts popovers ────────────────────────
function _repClosePopovers() {
  document.getElementById('rep-indicators-popover')?.classList.remove('open');
  document.getElementById('rep-layouts-popover')?.classList.remove('open');
  document.getElementById('rep-settings-popover')?.classList.remove('open');
}
function _repToggleSettingsPopover() {
  const p = document.getElementById('rep-settings-popover'); if (!p) return;
  document.getElementById('rep-indicators-popover')?.classList.remove('open');
  document.getElementById('rep-layouts-popover')?.classList.remove('open');
  p.classList.toggle('open');
}
function _repSetTheme(key, value) {
  if (!_repState) return;
  _repState.theme[key] = value;
  _repApplyTheme();
  _repSaveState();
}
function _repToggleThemeFlag(key) {
  if (!_repState) return;
  _repState.theme[key] = !_repState.theme[key];
  document.querySelector(`#rep-settings-popover .rep-popover-row[data-theme-toggle="${key}"]`)?.classList.toggle('on', _repState.theme[key]);
  _repApplyTheme();
  _repSaveState();
}
function _repResetTheme() {
  if (!_repState) return;
  _repState.theme = { upColor: '#34d399', downColor: '#f87171', grid: true, volume: true, watermark: true };
  const up = document.getElementById('rep-theme-up'); if (up) up.value = _repState.theme.upColor;
  const down = document.getElementById('rep-theme-down'); if (down) down.value = _repState.theme.downColor;
  document.querySelectorAll('#rep-settings-popover .rep-popover-row[data-theme-toggle]').forEach(row => row.classList.add('on'));
  _repApplyTheme();
  _repSaveState();
}
function _repApplyTheme() {
  if (!_repState || !_repState.chart) return;
  const t = _repState.theme;
  _repState.candleSeries.applyOptions({ upColor: t.upColor, downColor: t.downColor, wickUpColor: t.upColor, wickDownColor: t.downColor });
  _repState.chart.applyOptions({
    grid: {
      vertLines: { color: 'rgba(255,255,255,.04)', visible: t.grid },
      horzLines: { color: 'rgba(255,255,255,.04)', visible: t.grid },
    },
  });
  if (_repState.volumeSeries) _repState.volumeSeries.applyOptions({ visible: t.volume });
  const badge = document.querySelector('.rep-symbol-badge'); if (badge) badge.style.display = t.watermark ? 'block' : 'none';
}
function _repToggleIndicatorsPopover() {
  const p = document.getElementById('rep-indicators-popover'); if (!p) return;
  document.getElementById('rep-layouts-popover')?.classList.remove('open');
  document.getElementById('rep-settings-popover')?.classList.remove('open');
  p.classList.toggle('open');
}
function _repToggleLayoutsPopover() {
  const p = document.getElementById('rep-layouts-popover'); if (!p) return;
  document.getElementById('rep-indicators-popover')?.classList.remove('open');
  document.getElementById('rep-settings-popover')?.classList.remove('open');
  p.classList.toggle('open');
  _repRenderLayoutsList();
}
function _repRenderIndicatorPopoverState() {
  document.querySelectorAll('#rep-indicators-popover .rep-popover-row').forEach(row => {
    row.classList.toggle('on', !!_repState.indicators[row.dataset.ind]);
  });
}


// ══════════════════════════════════════════════════════
// INDICATORS — computed client-side from the visible replay
// window. `type:'overlay'` indicators share the main price
// scale (drawn over candles); `type:'oscillator'` indicators
// render in a dedicated strip pinned to the bottom of the
// same chart via their own price scale — Lightweight Charts
// v4 doesn't have true stacked panes, so only one oscillator
// can be active at a time to keep that strip readable (this
// is the one place we fall short of full TradingView parity;
// multi-pane support is a v5-library upgrade for a later pass).
// ══════════════════════════════════════════════════════
const REP_OSC_SCALE = 'rep-osc';
function _repIndicatorPopoverHtml() {
  const checkSvg = '<svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6" fill="none" stroke="currentColor" stroke-width="3"/></svg>';
  const row = id => `<div class="rep-popover-row" data-ind="${id}" onclick="_repToggleIndicator('${id}')">
      <span><span class="dot" style="background:${REP_IND_DEFS_COLORS[id]}"></span>${REP_IND_DEFS[id].label}</span>
      <span class="rep-popover-check">${checkSvg}</span></div>`;
  const overlays = Object.keys(REP_IND_DEFS).filter(id => REP_IND_DEFS[id].type === 'overlay');
  const oscillators = Object.keys(REP_IND_DEFS).filter(id => REP_IND_DEFS[id].type === 'oscillator');
  return `<div class="rep-popover-title">Overlays</div>${overlays.map(row).join('')}
    <div class="rep-popover-title" style="margin-top:6px">Oscillators <span style="text-transform:none;font-weight:500;opacity:.7">(1 active)</span></div>${oscillators.map(row).join('')}`;
}
const REP_IND_DEFS_COLORS = {
  ema9: '#fbbf24', ema21: '#60a5fa', ema50: '#f472b6', sma50: '#a78bfa', sma200: '#f87171',
  vwap: '#2dd4bf', bb: '#60a5fa', rsi: '#a78bfa', macd: '#60a5fa', stoch: '#60a5fa', atr: '#2dd4bf',
};
const REP_IND_DEFS = {
  ema9:   { label: 'EMA 9',                 type: 'overlay',    calc: c => [{ kind: 'line', color: '#fbbf24', data: _repEMA(c, 9) }] },
  ema21:  { label: 'EMA 21',                type: 'overlay',    calc: c => [{ kind: 'line', color: '#60a5fa', data: _repEMA(c, 21) }] },
  ema50:  { label: 'EMA 50',                type: 'overlay',    calc: c => [{ kind: 'line', color: '#f472b6', data: _repEMA(c, 50) }] },
  sma50:  { label: 'SMA 50',                type: 'overlay',    calc: c => [{ kind: 'line', color: '#a78bfa', data: _repSMA(c, 50) }] },
  sma200: { label: 'SMA 200',               type: 'overlay',    calc: c => [{ kind: 'line', color: '#f87171', data: _repSMA(c, 200) }] },
  vwap:   { label: 'VWAP',                  type: 'overlay',    calc: c => [{ kind: 'line', color: '#2dd4bf', data: _repVWAP(c) }] },
  bb:     { label: 'Bollinger Bands (20,2)',type: 'overlay',    calc: c => _repBollinger(c, 20, 2) },
  rsi:    { label: 'RSI (14)',              type: 'oscillator', calc: c => _repRSI(c, 14) },
  macd:   { label: 'MACD (12,26,9)',        type: 'oscillator', calc: c => _repMACD(c, 12, 26, 9) },
  stoch:  { label: 'Stochastic (14,3,3)',   type: 'oscillator', calc: c => _repStochastic(c, 14, 3, 3) },
  atr:    { label: 'ATR (14)',              type: 'oscillator', calc: c => _repATR(c, 14) },
};

function _repEMA(candles, period) {
  const k = 2 / (period + 1); let ema = null;
  return candles.map((c, i) => {
    if (i < period - 1) return null;
    if (ema === null) { ema = candles.slice(0, period).reduce((a, x) => a + x.close, 0) / period; return { time: Math.floor(c.time / 1000), value: ema }; }
    ema = c.close * k + ema * (1 - k);
    return { time: Math.floor(c.time / 1000), value: ema };
  }).filter(Boolean);
}
function _repSMAValues(candles, period) {
  return candles.map((c, i) => i < period - 1 ? null : candles.slice(i - period + 1, i + 1).reduce((a, x) => a + x.close, 0) / period);
}
function _repSMA(candles, period) {
  return _repSMAValues(candles, period).map((v, i) => v == null ? null : { time: Math.floor(candles[i].time / 1000), value: v }).filter(Boolean);
}
function _repVWAP(candles) {
  let cumPV = 0, cumV = 0;
  return candles.map(c => {
    const typical = (c.high + c.low + c.close) / 3;
    const vol = c.volume || 1; // forex feeds often lack real volume — fall back to an even weight
    cumPV += typical * vol; cumV += vol;
    return { time: Math.floor(c.time / 1000), value: cumPV / cumV };
  });
}
function _repBollinger(candles, period, mult) {
  const sma = _repSMAValues(candles, period);
  const mid = [], upper = [], lower = [];
  candles.forEach((c, i) => {
    if (sma[i] == null) return;
    const slice = candles.slice(i - period + 1, i + 1);
    const variance = slice.reduce((a, x) => a + Math.pow(x.close - sma[i], 2), 0) / period;
    const sd = Math.sqrt(variance);
    const t = Math.floor(c.time / 1000);
    mid.push({ time: t, value: sma[i] }); upper.push({ time: t, value: sma[i] + mult * sd }); lower.push({ time: t, value: sma[i] - mult * sd });
  });
  return [
    { kind: 'line', color: 'rgba(96,165,250,.55)', width: 1, data: upper },
    { kind: 'line', color: 'rgba(226,232,240,.4)', width: 1, data: mid },
    { kind: 'line', color: 'rgba(96,165,250,.55)', width: 1, data: lower },
  ];
}
function _repRSI(candles, period) {
  let avgGain = 0, avgLoss = 0; const out = [];
  for (let i = 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    const gain = Math.max(0, change), loss = Math.max(0, -change);
    if (i <= period) { avgGain += gain / period; avgLoss += loss / period; if (i === period) out.push(_repRsiPoint(candles[i], avgGain, avgLoss)); continue; }
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out.push(_repRsiPoint(candles[i], avgGain, avgLoss));
  }
  return [
    { kind: 'line', color: '#a78bfa', width: 1.5, data: out },
    { kind: 'line', color: 'rgba(248,113,113,.35)', width: 1, data: candles.map(c => ({ time: Math.floor(c.time / 1000), value: 70 })) },
    { kind: 'line', color: 'rgba(52,211,153,.35)', width: 1, data: candles.map(c => ({ time: Math.floor(c.time / 1000), value: 30 })) },
  ];
}
function _repRsiPoint(c, avgGain, avgLoss) {
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
  return { time: Math.floor(c.time / 1000), value: rsi };
}
function _repEmaSeries(values, period) {
  const k = 2 / (period + 1); let ema = null; const out = [];
  values.forEach((v, i) => {
    if (v == null) { out.push(null); return; }
    if (ema === null) { ema = v; } else { ema = v * k + ema * (1 - k); }
    out.push(ema);
  });
  return out;
}
function _repMACD(candles, fast, slow, signalPeriod) {
  const closes = candles.map(c => c.close);
  const emaFast = _repEmaSeriesFromCloses(closes, fast);
  const emaSlow = _repEmaSeriesFromCloses(closes, slow);
  const macdLine = closes.map((_, i) => (emaFast[i] != null && emaSlow[i] != null) ? emaFast[i] - emaSlow[i] : null);
  const signal = _repEmaSeries(macdLine, signalPeriod);
  const t = i => Math.floor(candles[i].time / 1000);
  const macdData = [], signalData = [], histData = [];
  candles.forEach((c, i) => {
    if (macdLine[i] == null) return;
    macdData.push({ time: t(i), value: macdLine[i] });
    if (signal[i] != null) {
      signalData.push({ time: t(i), value: signal[i] });
      const hist = macdLine[i] - signal[i];
      histData.push({ time: t(i), value: hist, color: hist >= 0 ? 'rgba(52,211,153,.65)' : 'rgba(248,113,113,.65)' });
    }
  });
  return [
    { kind: 'histogram', data: histData },
    { kind: 'line', color: '#60a5fa', width: 1.5, data: macdData },
    { kind: 'line', color: '#fbbf24', width: 1.5, data: signalData },
  ];
}
function _repEmaSeriesFromCloses(closes, period) {
  const k = 2 / (period + 1); let ema = null;
  return closes.map((v, i) => {
    if (i < period - 1) return null;
    if (ema === null) { ema = closes.slice(0, period).reduce((a, x) => a + x, 0) / period; return ema; }
    ema = v * k + ema * (1 - k); return ema;
  });
}
function _repStochastic(candles, period, kSmooth, dSmooth) {
  const rawK = candles.map((c, i) => {
    if (i < period - 1) return null;
    const slice = candles.slice(i - period + 1, i + 1);
    const hh = Math.max(...slice.map(x => x.high)), ll = Math.min(...slice.map(x => x.low));
    return hh === ll ? 50 : ((c.close - ll) / (hh - ll)) * 100;
  });
  const kVals = rawK.map((v, i) => {
    if (v == null) return null;
    const window = rawK.slice(Math.max(0, i - kSmooth + 1), i + 1).filter(x => x != null);
    return window.reduce((a, b) => a + b, 0) / window.length;
  });
  const dVals = kVals.map((v, i) => {
    if (v == null) return null;
    const window = kVals.slice(Math.max(0, i - dSmooth + 1), i + 1).filter(x => x != null);
    return window.reduce((a, b) => a + b, 0) / window.length;
  });
  const t = i => Math.floor(candles[i].time / 1000);
  return [
    { kind: 'line', color: '#60a5fa', width: 1.5, data: kVals.map((v, i) => v == null ? null : { time: t(i), value: v }).filter(Boolean) },
    { kind: 'line', color: '#fbbf24', width: 1.5, data: dVals.map((v, i) => v == null ? null : { time: t(i), value: v }).filter(Boolean) },
    { kind: 'line', color: 'rgba(248,113,113,.3)', width: 1, data: candles.map(c => ({ time: Math.floor(c.time / 1000), value: 80 })) },
    { kind: 'line', color: 'rgba(52,211,153,.3)', width: 1, data: candles.map(c => ({ time: Math.floor(c.time / 1000), value: 20 })) },
  ];
}
function _repATR(candles, period) {
  const trs = candles.map((c, i) => {
    if (i === 0) return c.high - c.low;
    const prevClose = candles[i - 1].close;
    return Math.max(c.high - c.low, Math.abs(c.high - prevClose), Math.abs(c.low - prevClose));
  });
  let atr = null; const out = [];
  trs.forEach((tr, i) => {
    if (i < period - 1) return;
    if (atr === null) { atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period; }
    else { atr = (atr * (period - 1) + tr) / period; }
    out.push({ time: Math.floor(candles[i].time / 1000), value: atr });
  });
  return [{ kind: 'line', color: '#2dd4bf', width: 1.5, data: out }];
}

// Indicators now render as real TradingView studies (multi-pane,
// draggable, resizable — for free) instead of the old hand-rolled
// line series, so this only has to track which study id backs
// which of your existing popover toggles.
function _repToggleIndicator(id) {
  const def = REP_IND_DEFS[id]; const study = REP_TV_STUDY_MAP[id];
  const chart = _repState?.tvChart;
  if (!def || !study || !chart) return;
  const turningOn = !_repState.indicators[id];

  if (turningOn && def.type === 'oscillator') {
    // No longer a hard limit — real panes stack cleanly — but we
    // keep "one oscillator at a time" as the default UX unless you
    // want to open this up now that multi-pane is free.
    Object.keys(REP_IND_DEFS).forEach(otherId => {
      if (otherId !== id && REP_IND_DEFS[otherId].type === 'oscillator' && _repState.indicators[otherId]) {
        _repRemoveIndicatorStudy(otherId);
      }
    });
  }

  _repState.indicators[id] = turningOn;
  document.querySelector(`#rep-indicators-popover .rep-popover-row[data-ind="${id}"]`)?.classList.toggle('on', turningOn);

  if (turningOn) {
    chart.createStudy(study.name, false, false, study.inputs).then(studyId => {
      _repState.indicatorStudyIds = _repState.indicatorStudyIds || {};
      _repState.indicatorStudyIds[id] = studyId;
    });
  } else {
    _repRemoveIndicatorStudy(id);
  }
  _repSaveState();
}
function _repRemoveIndicatorStudy(id) {
  const chart = _repState?.tvChart;
  const studyId = _repState?.indicatorStudyIds?.[id];
  if (chart && studyId) chart.removeEntity(studyId);
  if (_repState?.indicatorStudyIds) delete _repState.indicatorStudyIds[id];
  _repState.indicators[id] = false;
  document.querySelector(`#rep-indicators-popover .rep-popover-row[data-ind="${id}"]`)?.classList.remove('on');
}

function _repApplyIndicators(slice) {
  if (!_repState || !_repState.chart) return;
  Object.keys(_repState.indicators).forEach(id => {
    if (!_repState.indicators[id]) return;
    const def = REP_IND_DEFS[id]; if (!def) return;
    const parts = def.calc(slice);
    if (!_repState.indicatorSeries[id]) {
      _repState.indicatorSeries[id] = parts.map(p => {
        const scaleOpts = def.type === 'oscillator' ? { priceScaleId: REP_OSC_SCALE } : {};
        if (p.kind === 'histogram') return _repState.chart.addHistogramSeries({ priceLineVisible: false, lastValueVisible: false, ...scaleOpts });
        return _repState.chart.addLineSeries({ color: p.color, lineWidth: p.width || 1.5, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false, ...scaleOpts });
      });
    }
    parts.forEach((p, i) => _repState.indicatorSeries[id][i]?.setData(p.data));
  });
}

// ══════════════════════════════════════════════════════
// PLAYBACK CONTROLS
// ══════════════════════════════════════════════════════
function _repIsWeekend(ms) { const d = new Date(ms).getUTCDay(); return d === 0 || d === 6; }
function _repNextPlayableIndex(from, dir) {
  let idx = from + dir;
  if (_repState.skipWeekends) {
    while (idx >= 0 && idx < _repState.candles.length && _repIsWeekend(_repState.candles[idx].time)) idx += dir;
  }
  return idx;
}
function _repTogglePlay() { _repState.playing ? _repPause() : _repPlay(); }
function _repPlay() {
  if (!_repState || _repState.playing) return;
  if (_repState.index >= _repState.candles.length - 1) {
    if (_repState.loop) { _repState.index = Math.min(_repState.candlesPerView - 1, _repState.candles.length - 1); }
    else return;
  }
  _repState.playing = true;
  document.getElementById('rep-play-icon').innerHTML = '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>';
  const delay = Math.max(30, 500 / _repState.speed);
  _repState._timer = setInterval(() => {
    let next = _repNextPlayableIndex(_repState.index, 1);
    if (next >= _repState.candles.length) {
      if (_repState.loop) next = Math.min(_repState.candlesPerView - 1, _repState.candles.length - 1);
      else { _repPause(); return; }
    }
    _repState.index = next;
    _repSetChartData(true);
  }, delay);
}
function _repPause() {
  if (!_repState) return;
  _repState.playing = false;
  clearInterval(_repState._timer);
  const icon = document.getElementById('rep-play-icon'); if (icon) icon.innerHTML = '<path d="M7 5l12 7-12 7z"/>';
  _repSaveState();
}
function _repStep(dir) {
  if (!_repState) return;
  _repPause();
  const next = _repNextPlayableIndex(_repState.index, dir);
  _repState.index = Math.max(0, Math.min(_repState.candles.length - 1, next));
  _repSetChartData(true);
  _repSaveState();
}
function _repReset() {
  if (!_repState) return;
  _repPause();
  _repState.index = Math.min(_repState.candlesPerView - 1, _repState.candles.length - 1);
  _repSetChartData(true);
  _repSaveState();
}
function _repSetSpeed(val) { if (_repState) { _repState.speed = parseFloat(val) || 1; _repSaveState(); if (_repState.playing) { _repPause(); _repPlay(); } } }
function _repZoom(dir) {
  if (!_repState) return;
  _repState.candlesPerView = Math.max(20, Math.min(400, _repState.candlesPerView + dir * 10));
  // Native mouse-wheel/pinch/trackpad zoom is built into the real
  // chart now, so the toolbar buttons just proxy to it — this
  // action id name should be confirmed against your library
  // version's docs (IChartWidgetApi action ids).
  try { _repState.tvChart?.executeActionById(dir > 0 ? 'zoomIn' : 'zoomOut'); } catch (e) {}
  _repSaveState();
}
function _repJumpToDate(dateStr) {
  if (!_repState || !dateStr) return;
  _repPause();
  const targetMs = new Date(dateStr).getTime();
  const idx = _repIndexForTime(targetMs);
  _repState.index = Math.max(0, Math.min(_repState.candles.length - 1, idx));
  _repSetChartData(true);
  _repSaveState();
}
function _repScrubProgress(val) {
  if (!_repState) return;
  _repPause();
  const total = _repState.candles.length;
  _repState.index = Math.max(0, Math.min(total - 1, Math.round((val / 100) * (total - 1))));
  _repSetChartData(true);
  _repSaveState();
}
function _repToggleFullscreen() {
  const el = document.getElementById('rep-fullscreen-overlay');
  if (!document.fullscreenElement) el?.requestFullscreen?.().catch(() => {});
  else document.exitFullscreen?.();
}

// ══════════════════════════════════════════════════════
// SAVE / LOAD LAYOUTS — named drawing-set snapshots, kept
// in localStorage per browser (fast, no schema migration
// needed; promote to Supabase alongside the layout manager
// in a later phase if traders want them synced across devices).
// ══════════════════════════════════════════════════════
function _repLayoutsStore() { try { return JSON.parse(localStorage.getItem('nxtgen_rep_layouts') || '{}'); } catch (e) { return {}; } }
function _repSaveLayout() {
  const name = prompt('Name this layout:', `${_repState.symbol} setup`);
  if (!name) return;
  const store = _repLayoutsStore();
  store[name] = { drawings: _repState.drawings, indicators: _repState.indicators, savedAt: Date.now() };
  localStorage.setItem('nxtgen_rep_layouts', JSON.stringify(store));
  if (typeof showToast === 'function') showToast(`Layout "${name}" saved`, 'success');
  _repRenderLayoutsList();
}
function _repRenderLayoutsList() {
  const wrap = document.getElementById('rep-layouts-list'); if (!wrap) return;
  const store = _repLayoutsStore();
  const names = Object.keys(store);
  wrap.innerHTML = names.length ? names.map(n => `
    <div class="rep-popover-row" onclick="_repLoadLayout('${n.replace(/'/g, "\\'")}')">
      <span>${n}</span>
      <span onclick="event.stopPropagation();_repDeleteLayout('${n.replace(/'/g, "\\'")}')" style="opacity:.5;padding:2px"><svg class="icn" style="width:12px;height:12px" viewBox="0 0 24 24"><use href="#ic-trash"></use></svg></span>
    </div>`).join('') : `<div style="padding:8px;font-size:11px;color:var(--text3)">No saved layouts yet</div>`;
}
function _repLoadLayout(name) {
  const store = _repLayoutsStore(); const layout = store[name]; if (!layout) return;
  _repPushHistory();
  _repState.drawings = JSON.parse(JSON.stringify(layout.drawings || []));
  _repState.indicators = layout.indicators || _repState.indicators;
  Object.keys(_repState.indicatorSeries).forEach(id => { _repState.chart.removeSeries(_repState.indicatorSeries[id]); });
  _repState.indicatorSeries = {};
  _repApplyIndicators(_repState.candles.slice(0, _repState.index + 1));
  _repRenderIndicatorPopoverState();
  _repSaveState(); _repDrawOverlay(); _repClosePopovers();
  if (typeof showToast === 'function') showToast(`Layout "${name}" loaded`, 'success');
}
function _repDeleteLayout(name) {
  const store = _repLayoutsStore(); delete store[name];
  localStorage.setItem('nxtgen_rep_layouts', JSON.stringify(store));
  _repRenderLayoutsList();
}

// ══════════════════════════════════════════════════════
// BOTTOM TRADING DOCK — real session/account numbers pulled
// from the existing Backtesting Lab data layer (_btTradesForSession
// + _btComputeStats), not placeholders.
// ══════════════════════════════════════════════════════
function _repRenderBottomDock() {
  const dock = document.getElementById('rep-bottom-dock'); if (!dock) return;
  const session = _btGetSessionById(_repState.sessionId);
  const startingBalance = Number(session?.startingBalance) || 0;
  const trades = _btTradesForSession(_repState.sessionId);
  const stats = _btComputeStats(trades, startingBalance);
  const equity = startingBalance + (stats.netReturn || 0);
  const c = _repState.candles[_repState.index];
  const dateStr = c ? new Date(c.time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  dock.innerHTML = `
    <div class="rep-dock-stats">
      <div class="rep-dock-stat"><span class="rep-dock-stat-label">Balance</span><span class="rep-dock-stat-value">$${startingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
      <div class="rep-dock-stat"><span class="rep-dock-stat-label">Equity</span><span class="rep-dock-stat-value">$${equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
      <div class="rep-dock-divider"></div>
      <div class="rep-dock-stat"><span class="rep-dock-stat-label">Realized PnL</span><span class="rep-dock-stat-value ${(stats.netReturn || 0) >= 0 ? 'up' : 'dn'}">${(stats.netReturn || 0) >= 0 ? '+' : ''}$${(stats.netReturn || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
      <div class="rep-dock-stat"><span class="rep-dock-stat-label">Avg RR</span><span class="rep-dock-stat-value">${stats.avgRR ?? '—'}</span></div>
      <div class="rep-dock-stat"><span class="rep-dock-stat-label">Win Rate</span><span class="rep-dock-stat-value">${stats.winRate != null ? stats.winRate + '%' : '—'}</span></div>
      <div class="rep-dock-divider"></div>
      <div class="rep-dock-stat"><span class="rep-dock-stat-label">Trades</span><span class="rep-dock-stat-value">${stats.totalTests}</span></div>
      <div class="rep-dock-stat"><span class="rep-dock-stat-label">Replay Time</span><span class="rep-dock-stat-value" style="font-size:11px">${dateStr}</span></div>
    </div>
    <div class="rep-dock-actions">
      <input type="number" class="rep-qty-input" id="rep-qty-input" placeholder="Lots" step="0.01" value="1.00">
      <button class="rep-exec-btn rep-exec-buy" onclick="_repExecuteTrade('buy')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>Buy</button>
      <button class="rep-exec-btn rep-exec-sell" onclick="_repExecuteTrade('sell')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>Sell</button>
    </div>
  `;
}

// ── Trade execution bridge (Chart Replay → Trade Simulator) ──
function _repExecuteTrade(direction) {
  if (!_repState) return;
  const candle = _repState.candles[_repState.index];
  if (!candle) { showToast('No candle to execute against', 'danger'); return; }
  const sessionId = _repState.sessionId;
  _repSaveState();
  document.getElementById('rep-fullscreen-overlay')?.remove();
  document.removeEventListener('keydown', _repKeyHandler);
  try { _repState.chart?.remove(); } catch (e) {}
  _repState = null;
  _openTradeEntryModal(sessionId, null, {
    direction,
    entry_price: candle.close,
    entry_time: new Date(candle.time).toISOString(),
  });
}

// ═══════════════════════════════════════════════════
// GOALS — Supabase-backed, per user
// Table: journal_goals  { id, user_id, data jsonb, created_at }
// data = { groups: [{q, items:[{t,done}]}], affirmations: [str] }
// ═══════════════════════════════════════════════════
let _goalsData = { groups: [], affirmations: [] };
let _goalsRowId = null;

async function _goalsLoad() {
  // Always reset to a clean, empty state first so no stale/previous-session
  // data (or the old shared default affirmations) can ever bleed into a
  // different account's view.
  _goalsRowId = null;
  _goalsData  = { groups: [], affirmations: [] };
  if (!_currentUser) return;
  const { data, error } = await sb
    .from('journal_goals')
    .select('id, data')
    .eq('user_id', _currentUser.id)
    .maybeSingle();
  if (error) { console.error('goalsLoad:', error.message); return; }
  if (data) {
    _goalsRowId = data.id;
    _goalsData  = data.data || { groups: [], affirmations: [] };
    if (!_goalsData.affirmations) _goalsData.affirmations = [];
    if (!_goalsData.groups) _goalsData.groups = [];
  }
}

async function _goalsSave() {
  if (!_currentUser) return;
  const row = { user_id: _currentUser.id, data: _goalsData };
  if (_goalsRowId) {
    await sb.from('journal_goals').update(row).eq('id', _goalsRowId);
  } else {
    const { data } = await sb.from('journal_goals').insert(row).select('id').single();
    if (data) _goalsRowId = data.id;
  }
}

function buildGoals() {
  // Personal bests from live trades
  const pbTbody = document.getElementById('goals-pb-tbody');
  if (pbTbody) {
    const wins = trades.filter(t => t.pnl > 0);
    const bigWin = wins.length ? wins.reduce((a, b) => _pnlPctValue(b) > _pnlPctValue(a) ? b : a, wins[0]) : null;
    // Best month
    const monthMap = {};
    trades.forEach(t => { const k = t.date.slice(0,7); monthMap[k] = (monthMap[k]||0)+_pnlPctValue(t); });
    const bestMonthKey = Object.keys(monthMap).sort((a,b) => monthMap[b]-monthMap[a])[0];
    // Streak
    const sorted = [...trades].sort((a,b) => a.date.localeCompare(b.date));
    let maxStreak=0, cur=0;
    sorted.forEach(t => { if(t.outcome==='Win'){cur++;maxStreak=Math.max(maxStreak,cur);}else cur=0; });
    // Best RR
    const rrAll = trades.map(t => { const v = _parseRR(t.rr); return v !== null ? {v,t} : null; }).filter(Boolean);
    const bestRR = rrAll.length ? rrAll.reduce((a,b)=>b.v>a.v?b:a,rrAll[0]) : null;

    pbTbody.innerHTML = [
      bigWin  ? `<tr><td>Biggest Win %</td><td class="outcome-win mono">${_pnlLabel(bigWin)}</td><td>${bigWin.date}</td><td class="bold">${bigWin.pair}</td></tr>` : '',
      bestMonthKey ? `<tr><td>Best Month PnL</td><td class="outcome-win mono">+${monthMap[bestMonthKey].toFixed(1)}%</td><td>${bestMonthKey}</td><td>—</td></tr>` : '',
      maxStreak ? `<tr><td>Longest Win Streak</td><td class="outcome-win mono">${maxStreak} trades</td><td>—</td><td>—</td></tr>` : '',
      bestRR  ? `<tr><td>Best R:R Achieved</td><td class="outcome-win mono">1:${bestRR.v}</td><td>${bestRR.t.date}</td><td class="bold">${bestRR.t.pair}</td></tr>` : '',
    ].filter(Boolean).join('') || '<tr><td colspan="4" style="color:var(--text3);text-align:center;font-style:italic">Log trades to see personal bests</td></tr>';
  }

  // Goals groups
  const goalsEl = document.getElementById('goals-list');
  if (goalsEl) {
    if (_goalsData.groups.length === 0) {
      goalsEl.innerHTML = '<div class="wl-empty-state" style="padding:30px 0"><div class="wl-empty-icon">' + icon('target') + '</div><div class="wl-empty-title">No goals yet</div><div class="wl-empty-sub">Click + Add Group to create your first goal group.</div></div>';
    } else {
      goalsEl.innerHTML = _goalsData.groups.map((g, gi) => {
        const gTotal = g.items.length;
        const gDone  = g.items.filter(item => item.done).length;
        const gPct   = gTotal ? Math.round((gDone / gTotal) * 100) : 0;
        return `
        <div class="goals-group" style="margin-bottom:18px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <div style="font-size:12px;font-weight:700;color:var(--text2);letter-spacing:.3px">${g.q}</div>
            <div style="display:flex;gap:6px">
              <button class="wl-week-btn" style="font-size:10px;padding:3px 9px" onclick="goalsAddItem(${gi})">＋ Goal</button>
              <button class="wl-week-btn danger" style="font-size:10px;padding:3px 9px" onclick="goalsDeleteGroup(${gi})"><svg class="icn" aria-hidden="true"><use href="#ic-close"></use></svg></button>
            </div>
          </div>
          <div class="acc-progress-wrap" style="margin-top:0;margin-bottom:10px">
            <div class="acc-progress-label">
              <span>${gDone} of ${gTotal} complete</span>
              <span>${gPct}%</span>
            </div>
            <div class="acc-progress-bg">
              <div class="acc-progress-fill" style="width:${gPct}%"></div>
            </div>
          </div>
          <div class="checklist-grid">${g.items.map((item, ii) => {
            if (_goalEditIdx && _goalEditIdx.gi === gi && _goalEditIdx.ii === ii) {
              return `
            <div class="cl-item editing" draggable="false">
              <span class="cl-drag-handle" style="opacity:.25;cursor:default">⠿</span>
              <div class="cl-box">${item.done ? '✓' : ''}</div>
              <input type="text" class="cl-edit-input" id="goal-edit-input-${gi}-${ii}" value="${item.t.replace(/"/g,'&quot;')}"
                     onkeydown="if(event.key==='Enter'){goalSaveEdit(${gi},${ii})} else if(event.key==='Escape'){goalCancelEdit()}">
              <div class="acc-ms-actions" style="opacity:1">
                <button class="wl-week-btn primary" style="font-size:10px;padding:2px 7px" onclick="goalSaveEdit(${gi},${ii})">✓ Done</button>
                <button class="wl-week-btn" style="font-size:10px;padding:2px 7px" onclick="goalCancelEdit()"><svg class="icn" aria-hidden="true"><use href="#ic-close"></use></svg></button>
              </div>
            </div>`;
            }
            return `
            <div class="cl-item${item.done?' checked':''}"
                 draggable="true"
                 ondragstart="goalDragStart(event,${gi},${ii})"
                 ondragover="goalDragOver(event)"
                 ondragenter="goalDragEnter(event,${gi},${ii})"
                 ondragleave="goalDragLeave(event)"
                 ondrop="goalDrop(event,${gi},${ii})"
                 ondragend="goalDragEnd(event)"
                 onclick="goalsToggle(${gi},${ii})">
              <span class="cl-drag-handle${_goalClickSrc && _goalClickSrc.gi===gi && _goalClickSrc.ii===ii ? ' selected' : ''}" onclick="goalHandleClick(event,${gi},${ii})" title="Drag, or click and click another to swap">⠿</span>
              <div class="cl-box">${item.done?'✓':''}</div>
              <span class="cl-text">${item.t}</span>
              <div class="acc-ms-actions">
                <button class="wl-week-btn" style="font-size:10px;padding:2px 7px" onclick="goalStartEdit(${gi},${ii});event.stopPropagation()"><svg class="icn" aria-hidden="true"><use href="#ic-edit"></use></svg></button>
                <button class="wl-week-btn danger" style="font-size:10px;padding:2px 7px" onclick="goalDeleteItem(${gi},${ii});event.stopPropagation()"><svg class="icn" aria-hidden="true"><use href="#ic-close"></use></svg></button>
              </div>
            </div>`;
          }).join('')}
          </div>
        </div>`;
      }).join('');
    }
    _renderGoalsProgress();
    if (_goalEditIdx) {
      const input = document.getElementById(`goal-edit-input-${_goalEditIdx.gi}-${_goalEditIdx.ii}`);
      if (input) { input.focus(); input.select(); }
    }
  }

  // Affirmations
  const affEl = document.getElementById('affirmations');
  if (affEl) {
    if (!_goalsData.affirmations || _goalsData.affirmations.length === 0) {
      affEl.innerHTML = '<div class="wl-empty-state" style="padding:30px 0"><div class="wl-empty-icon"><svg class="icn" aria-hidden="true"><use href="#ic-sparkle"></use></svg></div><div class="wl-empty-title">No affirmations yet</div><div class="wl-empty-sub">Click + Add above to create your first one.</div></div>';
      return;
    }
    affEl.innerHTML = _goalsData.affirmations.map((a, i) => {
      if (_affEditIdx === i) {
        return `
      <div class="rule-card aff-card editing" draggable="false">
        <span class="cl-drag-handle" style="opacity:.25;cursor:default">⠿</span>
        <div style="flex:1;min-width:0">
          <div class="rule-num">${String(i+1).padStart(2,'0')}</div>
          <input type="text" class="cl-edit-input" id="aff-edit-input-${i}" value="${a.replace(/"/g,'&quot;')}"
                 onkeydown="if(event.key==='Enter'){affSaveEdit(${i})} else if(event.key==='Escape'){affCancelEdit()}">
        </div>
        <div class="acc-ms-actions" style="opacity:1">
          <button class="wl-week-btn primary" style="font-size:10px;padding:2px 7px" onclick="affSaveEdit(${i})">✓ Done</button>
          <button class="wl-week-btn" style="font-size:10px;padding:2px 7px" onclick="affCancelEdit()"><svg class="icn" aria-hidden="true"><use href="#ic-close"></use></svg></button>
        </div>
      </div>`;
      }
      return `
      <div class="rule-card aff-card"
           draggable="true"
           ondragstart="affDragStart(event,${i})"
           ondragover="affDragOver(event)"
           ondragenter="affDragEnter(event,${i})"
           ondragleave="affDragLeave(event)"
           ondrop="affDrop(event,${i})"
           ondragend="affDragEnd(event)">
        <span class="cl-drag-handle${_affClickSrc===i ? ' selected' : ''}" onclick="affHandleClick(event,${i})" title="Drag, or click and click another to swap">⠿</span>
        <div style="flex:1;min-width:0">
          <div class="rule-num">${String(i+1).padStart(2,'0')}</div>
          <div class="rule-text" style="font-style:italic">"${a}"</div>
        </div>
        <div class="acc-ms-actions">
          <button class="wl-week-btn" style="font-size:10px;padding:2px 7px" onclick="affStartEdit(${i});event.stopPropagation()"><svg class="icn" aria-hidden="true"><use href="#ic-edit"></use></svg></button>
          <button class="wl-week-btn danger" style="font-size:10px;padding:2px 7px" onclick="affDeleteItem(${i});event.stopPropagation()"><svg class="icn" aria-hidden="true"><use href="#ic-close"></use></svg></button>
        </div>
      </div>`;
    }).join('');
    if (_affEditIdx !== null) {
      const input = document.getElementById(`aff-edit-input-${_affEditIdx}`);
      if (input) { input.focus(); input.select(); }
    }
  }
}

let _affDragSrc  = null;   // index currently being dragged
let _affClickSrc = null;   // index selected via click-to-reorder
let _affEditIdx  = null;   // index currently being inline-edited

function affDragStart(e, i) {
  _affDragSrc = i;
  _affClickSrc = null;
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(i));
}

function affDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function affDragEnter(e, i) {
  if (_affDragSrc !== null && i !== _affDragSrc) e.currentTarget.classList.add('drag-over');
}

function affDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

async function affDrop(e, i) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  if (_affDragSrc === null || _affDragSrc === i) { _affDragSrc = null; return; }
  const arr = _goalsData.affirmations;
  const [moved] = arr.splice(_affDragSrc, 1);
  arr.splice(i, 0, moved);
  _affDragSrc = null;
  buildGoals();
  await _goalsSave();
}

function affDragEnd() {
  document.querySelectorAll('#affirmations .aff-card').forEach(el => el.classList.remove('dragging', 'drag-over'));
  _affDragSrc = null;
}

async function affHandleClick(e, i) {
  e.stopPropagation();
  if (_affClickSrc === null) {
    _affClickSrc = i;
    buildGoals();
  } else if (_affClickSrc === i) {
    _affClickSrc = null;
    buildGoals();
  } else {
    const arr = _goalsData.affirmations;
    const [moved] = arr.splice(_affClickSrc, 1);
    arr.splice(i, 0, moved);
    _affClickSrc = null;
    buildGoals();
    await _goalsSave();
  }
}

function affStartEdit(i) {
  _affClickSrc = null;
  _affEditIdx = i;
  buildGoals();
}

async function affSaveEdit(i) {
  const input = document.getElementById(`aff-edit-input-${i}`);
  const text = input ? input.value.trim() : '';
  if (text) _goalsData.affirmations[i] = text;
  _affEditIdx = null;
  buildGoals();
  await _goalsSave();
}

function affCancelEdit() {
  _affEditIdx = null;
  buildGoals();
}

function affAddItem() {
  const text = prompt('Affirmation:');
  if (!text) return;
  _goalsData.affirmations.push(text.trim());
  buildGoals();
  _goalsSave();
}

async function affDeleteItem(i) {
  if (!confirm(`Delete this affirmation?`)) return;
  _goalsData.affirmations.splice(i, 1);
  buildGoals();
  await _goalsSave();
}

let _goalDragSrc  = null;   // {gi, ii} currently being dragged
let _goalClickSrc = null;   // {gi, ii} selected via click-to-reorder
let _goalEditIdx  = null;   // {gi, ii} currently being inline-edited

async function goalsToggle(gi, ii) {
  _goalsData.groups[gi].items[ii].done = !_goalsData.groups[gi].items[ii].done;
  buildGoals();
  await _goalsSave();
}

function goalStartEdit(gi, ii) {
  _goalClickSrc = null;
  _goalEditIdx = { gi, ii };
  buildGoals();
}

async function goalSaveEdit(gi, ii) {
  const input = document.getElementById(`goal-edit-input-${gi}-${ii}`);
  const text = input ? input.value.trim() : '';
  if (text) _goalsData.groups[gi].items[ii].t = text;
  _goalEditIdx = null;
  buildGoals();
  await _goalsSave();
}

function goalCancelEdit() {
  _goalEditIdx = null;
  buildGoals();
}

async function goalDeleteItem(gi, ii) {
  if (!confirm(`Delete goal: "${_goalsData.groups[gi].items[ii].t}"?`)) return;
  _goalsData.groups[gi].items.splice(ii, 1);
  buildGoals();
  await _goalsSave();
}

function goalDragStart(e, gi, ii) {
  _goalDragSrc = { gi, ii };
  _goalClickSrc = null;
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(ii));
}

function goalDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function goalDragEnter(e, gi, ii) {
  if (_goalDragSrc && _goalDragSrc.gi === gi && _goalDragSrc.ii !== ii) e.currentTarget.classList.add('drag-over');
}

function goalDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

async function goalDrop(e, gi, ii) {
  e.preventDefault();
  e.stopPropagation();
  e.currentTarget.classList.remove('drag-over');
  if (!_goalDragSrc || _goalDragSrc.gi !== gi || _goalDragSrc.ii === ii) { _goalDragSrc = null; return; }
  const arr = _goalsData.groups[gi].items;
  const [moved] = arr.splice(_goalDragSrc.ii, 1);
  arr.splice(ii, 0, moved);
  _goalDragSrc = null;
  buildGoals();
  await _goalsSave();
}

function goalDragEnd() {
  document.querySelectorAll('.goals-group .cl-item').forEach(el => el.classList.remove('dragging', 'drag-over'));
  _goalDragSrc = null;
}

async function goalHandleClick(e, gi, ii) {
  e.stopPropagation();
  if (!_goalClickSrc) {
    _goalClickSrc = { gi, ii };
    buildGoals();
  } else if (_goalClickSrc.gi === gi && _goalClickSrc.ii === ii) {
    _goalClickSrc = null;
    buildGoals();
  } else if (_goalClickSrc.gi !== gi) {
    // Reordering is confined to within a single group
    _goalClickSrc = { gi, ii };
    buildGoals();
  } else {
    const arr = _goalsData.groups[gi].items;
    const [moved] = arr.splice(_goalClickSrc.ii, 1);
    arr.splice(ii, 0, moved);
    _goalClickSrc = null;
    buildGoals();
    await _goalsSave();
  }
}

function _renderGoalsProgress() {
  const fill = document.getElementById('goals-progress-fill');
  const text = document.getElementById('goals-progress-text');
  const pct  = document.getElementById('goals-progress-pct');
  if (!fill || !text || !pct) return;
  const allItems = _goalsData.groups.flatMap(g => g.items);
  const total = allItems.length;
  const done  = allItems.filter(item => item.done).length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  text.textContent = `${done} of ${total} complete`;
  pct.textContent  = `${percent}%`;
  fill.style.setProperty('--target-width', percent + '%');
  fill.style.width = percent + '%';
}

function goalsAddGroup() {
  const name = prompt('Goal group name (e.g. Q3 2026 <svg class="icn icn-blue" aria-hidden="true"><use href="#ic-dot"></use></svg>):');
  if (!name) return;
  _goalsData.groups.push({ q: name, items: [] });
  buildGoals();
  _goalsSave();
}

function goalsDeleteGroup(gi) {
  if (!confirm(`Delete "${_goalsData.groups[gi].q}"?`)) return;
  _goalsData.groups.splice(gi, 1);
  buildGoals();
  _goalsSave();
}

function goalsAddItem(gi) {
  const text = prompt('Goal text:');
  if (!text) return;
  _goalsData.groups[gi].items.push({ t: text, done: false });
  buildGoals();
  _goalsSave();
}

// ═══════════════════════════════════════════════════
// MONTHLY REVIEW — dynamic from trades + Supabase reflections
// Table: journal_monthly { id, user_id, month_key text, r1 text, r2 text, r3 text }
// month_key = "2026-05"
// ═══════════════════════════════════════════════════
let _mrYear  = new Date().getFullYear();
let _mrMonth = new Date().getMonth(); // 0-based
let _mrCache = {};  // { "2026-05": { id, r1, r2, r3 } }
let _mrDirty = false;

const _MR_MONTHS = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];
const _MR_GRADE = (wr) => wr >= 75 ? 'A' : wr >= 65 ? 'B' : wr >= 55 ? 'C' : 'D';

async function _mrLoadMonth(key) {
  if (_mrCache[key] !== undefined) return;
  if (!_currentUser) { _mrCache[key] = null; return; }
  const { data, error } = await sb.from('journal_monthly')
    .select('id, r1, r2, r3').eq('user_id', _currentUser.id).eq('month_key', key).maybeSingle();
  if (error) { console.error('mrLoad:', error.message); _mrCache[key] = null; return; }
  _mrCache[key] = data || null;
}

async function mrSaveReflections() {
  if (!_currentUser) return;
  const key = `${_mrYear}-${String(_mrMonth+1).padStart(2,'0')}`;
  const r1 = document.getElementById('mr-r1')?.value || '';
  const r2 = document.getElementById('mr-r2')?.value || '';
  const r3 = document.getElementById('mr-r3')?.value || '';
  const row = { user_id: _currentUser.id, month_key: key, r1, r2, r3 };
  const btn = document.getElementById('mr-save-btn');
  if (btn) { btn.textContent = 'Saving…'; btn.disabled = true; }
  if (_mrCache[key]?.id) {
    await sb.from('journal_monthly').update(row).eq('id', _mrCache[key].id);
    _mrCache[key] = { ..._mrCache[key], r1, r2, r3 };
  } else {
    const { data } = await sb.from('journal_monthly').insert(row).select('id').single();
    _mrCache[key] = { id: data?.id, r1, r2, r3 };
  }
  if (btn) { btn.textContent = '✓ Saved'; btn.disabled = false; }
  _mrDirty = false;
  setTimeout(() => { if(btn) { btn.style.display='none'; } }, 1500);
}

function mrReflectDirty() {
  _mrDirty = true;
  const btn = document.getElementById('mr-save-btn');
  if (btn) btn.style.display = '';
}

function mrNav(dir) {
  _mrMonth += dir;
  if (_mrMonth > 11) { _mrMonth = 0; _mrYear++; }
  if (_mrMonth < 0)  { _mrMonth = 11; _mrYear--; }
  buildMonthlyReview();
}

// Expand/collapse the per-trade list under a Pair Breakdown row.
function _mrTogglePairRow(rowId, headerEl) {
  const rows = document.querySelectorAll(`tr.mr-pair-sub-row[data-group="${rowId}"]`);
  const isOpen = rows.length && rows[0].style.display !== 'none';
  rows.forEach(r => { r.style.display = isOpen ? 'none' : 'table-row'; });
  const arrow = headerEl?.querySelector('.mr-pair-arrow');
  if (arrow) arrow.style.transform = isOpen ? '' : 'rotate(90deg)';
}

// Normalize a trade's PnL to a percentage, the same way updateKPIs() does:
// MT5/$-unit trades store their pnl in dollars, so it must be converted via
// the trade's own account size before it can be treated as a percentage.
// Without this, dollar values (e.g. -$1018 on a BTCUSD.X MT5 import) were
// being printed directly as "-101.8%", which also corrupted every aggregate
// (Net PnL, Avg Loss, Profit Factor, Pair Breakdown) that summed raw t.pnl.
function _mrTradePct(t) {
  const accSize = getAccSizeForAccount(t.account);
  const dollars = toPnlDollars(t, accSize);
  if (accSize > 0) return (dollars / accSize) * 100;
  // No known account size — if it's already a plain % trade, use it as-is;
  // otherwise we can't meaningfully convert, so fall back to 0 rather than
  // displaying a dollar figure dressed up as a percentage.
  return (!_isMt5Trade(t) && t.pnlUnit !== '$') ? (parseFloat(t.pnl) || 0) : 0;
}

async function buildMonthlyReview() {
  const key = `${_mrYear}-${String(_mrMonth+1).padStart(2,'0')}`;
  const monthName = _MR_MONTHS[_mrMonth];

  // Update nav label
  const navLabel = document.getElementById('mr-nav-label');
  if (navLabel) navLabel.textContent = `${monthName} ${_mrYear}`;

  // Filter trades for this month
  const mt = trades.filter(t => t.date.startsWith(key));
  const wins   = mt.filter(t => t.outcome === 'Win');
  const losses = mt.filter(t => t.outcome === 'Loss');
  const wr     = mt.length ? ((wins.length / mt.length) * 100).toFixed(1) : 0;
  const pctOf  = (t) => _mrTradePct(t);
  const netPnl = mt.reduce((a, t) => a + pctOf(t), 0).toFixed(1);
  const avgW   = wins.length   ? (wins.reduce((a,t)=>a+pctOf(t),0)/wins.length).toFixed(1) : 0;
  const avgL   = losses.length ? (losses.reduce((a,t)=>a+pctOf(t),0)/losses.length).toFixed(1) : 0;
  const lossPnls = losses.map(pctOf);
  const winPnls  = wins.map(pctOf);
  const pf = lossPnls.length
    ? Math.abs(winPnls.reduce((a,b)=>a+b,0) / lossPnls.reduce((a,b)=>a+b,0)).toFixed(2)
    : '∞';
  // Streak within month
  const sorted = [...mt].sort((a,b)=>a.date.localeCompare(b.date));
  let maxS=0, curS=0;
  sorted.forEach(t => { if(t.outcome==='Win'){curS++;maxS=Math.max(maxS,curS);}else curS=0; });
  const grade = _MR_GRADE(parseFloat(wr));

  // Cover
  const coverLabel = document.getElementById('mr-cover-label');
  const coverTitle = document.getElementById('mr-cover-title');
  const coverSub   = document.getElementById('mr-cover-sub');
  if (coverLabel) coverLabel.textContent = 'Deep Performance Review · ' + _mrYear;
  if (coverTitle) coverTitle.textContent = 'Monthly Review — ' + monthName;
  if (coverSub && mt.length) coverSub.textContent =
    `Grade: ${grade} · ${mt.length} trades · Win streak ${maxS}`;
  else if (coverSub) coverSub.textContent = 'No trades logged this month';

  // Stats grid
  const statsGrid = document.getElementById('mr-stats-grid');
  if (statsGrid) {
    if (mt.length === 0) {
      statsGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:30px;color:var(--text3);font-style:italic">No trades logged for ' + monthName + ' ' + _mrYear + '</div>';
    } else {
      const pnlCol = netPnl >= 0 ? 'green' : 'red';
      statsGrid.innerHTML = `
        <div class="month-stat"><div class="month-stat-label">Total Trades</div><div class="month-stat-val blue">${mt.length}</div></div>
        <div class="month-stat"><div class="month-stat-label">Win Rate</div><div class="month-stat-val ${wr>=65?'green':'red'}">${wr}%</div></div>
        <div class="month-stat"><div class="month-stat-label">Net PnL</div><div class="month-stat-val ${pnlCol}">${netPnl>=0?'+':''}${netPnl}%</div></div>
        <div class="month-stat"><div class="month-stat-label">Avg Win</div><div class="month-stat-val green">+${avgW}%</div></div>
        <div class="month-stat"><div class="month-stat-label">Avg Loss</div><div class="month-stat-val red">${avgL}%</div></div>
        <div class="month-stat"><div class="month-stat-label">Profit Factor</div><div class="month-stat-val gold">${pf}x</div></div>
        <div class="month-stat"><div class="month-stat-label">Win Streak</div><div class="month-stat-val blue">${maxS}</div></div>
        <div class="month-stat"><div class="month-stat-label">Grade</div><div class="month-stat-val ${grade==='A'?'green':grade==='B'?'blue':grade==='C'?'gold':'red'}">${grade}</div></div>`;
    }
  }

  // Loss audit — rows are clickable to open the underlying trade
  const lossTbody = document.getElementById('mr-loss-tbody');
  if (lossTbody) {
    lossTbody.innerHTML = losses.length
      ? losses.map(t => `
          <tr class="mr-clickable-row" onclick="openDetail(${t.id})" title="Click to view trade">
            <td>${t.date}</td>
            <td class="bold">${t.pair}</td>
            <td>${t.strategy || '—'}</td>
            <td class="outcome-loss mono">${pctOf(t).toFixed(1)}%</td>
            <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.notes || '—'}</td>
          </tr>`).join('')
      : '<tr><td colspan="5" style="color:var(--text3);text-align:center;font-style:italic">No losses this month <svg class="icn" aria-hidden="true"><use href="#ic-sparkle"></use></svg></td></tr>';
  }

  // Pair breakdown — each pair row expands to list its trades for the
  // month; clicking a trade in that list opens it in the detail panel.
  const pairTbody = document.getElementById('mr-pair-tbody');
  if (pairTbody) {
    const pairMap = {};
    mt.forEach(t => {
      if (!pairMap[t.pair]) pairMap[t.pair] = { trades: 0, wins: 0, pnl: 0, list: [] };
      pairMap[t.pair].trades++;
      if (t.outcome === 'Win') pairMap[t.pair].wins++;
      pairMap[t.pair].pnl += pctOf(t);
      pairMap[t.pair].list.push(t);
    });
    const pairs = Object.entries(pairMap).sort((a,b) => b[1].pnl - a[1].pnl);
    pairTbody.innerHTML = pairs.length
      ? pairs.map(([pair, d], idx) => {
          const pwr = ((d.wins/d.trades)*100).toFixed(0);
          const pc  = d.pnl >= 0 ? 'outcome-win' : 'outcome-loss';
          const rowId = `mr-pair-sub-${idx}`;
          const subRows = d.list
            .sort((a,b) => a.date.localeCompare(b.date))
            .map(t => `
              <tr class="mr-clickable-row mr-pair-sub-row" data-group="${rowId}" style="display:none" onclick="event.stopPropagation();openDetail(${t.id})" title="Click to view trade">
                <td style="padding-left:26px;color:var(--text3)"><svg class="icn" aria-hidden="true"><use href="#ic-arrow-right"></use></svg> ${t.date}</td>
                <td colspan="2" style="color:var(--text2)">${t.strategy || '—'}</td>
                <td class="${t.outcome==='Win'?'outcome-win':'outcome-loss'} mono">${pctOf(t)>=0?'+':''}${pctOf(t).toFixed(1)}%</td>
              </tr>`).join('');
          return `<tr class="mr-clickable-row mr-pair-row" data-group="${rowId}" onclick="_mrTogglePairRow('${rowId}',this)" title="Click to view trades for ${pair}">
            <td class="bold"><span class="mr-pair-arrow" style="display:inline-block;width:12px;transition:transform .15s">▸</span> ${pair}</td>
            <td>${d.trades}</td>
            <td class="${pwr>=65?'outcome-win':'outcome-loss'} mono">${pwr}%</td>
            <td class="${pc} mono">${d.pnl>=0?'+':''}${d.pnl.toFixed(1)}%</td>
          </tr>${subRows}`;
        }).join('')
      : '<tr><td colspan="4" style="color:var(--text3);text-align:center;font-style:italic">No trades this month</td></tr>';
  }

  // Reflections — load from Supabase if not cached
  await _mrLoadMonth(key);
  const cached = _mrCache[key];
  const r1El = document.getElementById('mr-r1');
  const r2El = document.getElementById('mr-r2');
  const r3El = document.getElementById('mr-r3');
  if (r1El) r1El.value = cached?.r1 || '';
  if (r2El) r2El.value = cached?.r2 || '';
  if (r3El) r3El.value = cached?.r3 || '';
  _mrDirty = false;
  const btn = document.getElementById('mr-save-btn');
  if (btn) btn.style.display = 'none';
}

