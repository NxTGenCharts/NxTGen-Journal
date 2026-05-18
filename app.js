/* ════════════════════════════════════════════════════════
   NxTGen Trading Journal — app.js
   Cloud storage: Supabase (trades + deleted_trades tables)
   localStorage kept ONLY for: theme preference
   ════════════════════════════════════════════════════════ */

// ══════════════════════════════════════════════════════
// SUPABASE CONFIG — paste your full publishable key below
// ══════════════════════════════════════════════════════
const SUPABASE_URL  = 'https://jlqgdwfbwdiieafhwisy.supabase.co';
const SUPABASE_ANON = 'PASTE_YOUR_FULL_PUBLISHABLE_KEY_HERE';
const BASE_URL      = 'https://dabossmira.github.io/NxTGen-Journal';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

// Current authenticated user — set on boot
let _currentUser = null;

// ── SEED DATA (shown on first load / for new users) ───
const SEED_TRADES = [
  {id:1,date:"2026-03-02",pair:"EURGBP",pos:"Sell",rr:"1:4",pnl:0,outcome:"B.E",kz:"Asian",strategy:"IRL > ERL",tf:"30m > 3m",account:"PaperTrading",rating:4,notes:"Price tapped Asian range high and stalled — moved SL to BE. Valid setup but no follow-through.",pretrade:"Bearish bias from daily OB",emotion:"Calm",risk:"0.5%",checklist:[0,1,2,3,4,6],charts:[]},
  {id:2,date:"2026-03-02",pair:"USDCAD",pos:"Sell",rr:"1:3",pnl:-1,outcome:"Loss",kz:"London",strategy:"",tf:"",account:"PaperTrading",rating:5,notes:"Entered without a confirmed strategy. Lesson: always tag setup before entry.",pretrade:"",emotion:"Neutral",risk:"0.5%",checklist:[0,1],charts:[]},
  {id:3,date:"2026-03-03",pair:"XAUUSD",pos:"Sell",rr:"1:5",pnl:5.6,outcome:"Win",kz:"London",strategy:"IRL > ERL",tf:"30m > 3m",account:"PaperTrading",rating:5,notes:"Beautiful liquidity sweep at London open. Price delivered into daily SIBI. Full target hit.",pretrade:"Clean daily FVG fill setup",emotion:"Confident",risk:"0.5%",checklist:[0,1,2,3,4,5,6,7],charts:[]},
  {id:4,date:"2026-03-04",pair:"GBPUSD",pos:"Buy",rr:"1:4",pnl:4,outcome:"Win",kz:"London",strategy:"ERL > IRL",tf:"1h > 5m",account:"PaperTrading",rating:5,notes:"4h ERL swept cleanly. 1h OB respected. Entered on 5m confirmation candle. Held for full target.",pretrade:"ERL > IRL confirmed on 4h",emotion:"Calm",risk:"0.8%",checklist:[0,1,2,3,4,5,6,7],charts:[]},
  {id:5,date:"2026-03-04",pair:"GBPJPY",pos:"Buy",rr:"1:3",pnl:3,outcome:"Win",kz:"London",strategy:"ERL > IRL",tf:"30m > 3m",account:"PaperTrading",rating:5,notes:"Correlated entry with GBPUSD. 30m structure shift confirmed. Quick delivery into ERL.",pretrade:"Correlated with GBPUSD bias",emotion:"Confident",risk:"0.5%",checklist:[0,1,2,3,4,5,6,7],charts:[]},
  {id:6,date:"2026-03-05",pair:"XAUUSD",pos:"Sell",rr:"1:3.5",pnl:3.4,outcome:"Win",kz:"London",strategy:"IRL > ERL",tf:"30m > 3m",account:"PaperTrading",rating:5,notes:"1am London manipulation swept IRL. 30m MS confirmed bearish. Clean 3m entry.",pretrade:"IRL swept at 1am manipulation",emotion:"Calm",risk:"0.8%",checklist:[0,1,2,3,4,5,6,7],charts:[]},
  {id:7,date:"2026-03-05",pair:"GBPUSD",pos:"Sell",rr:"1:4",pnl:3.3,outcome:"Win",kz:"New York",strategy:"IRL > ERL",tf:"30m > 3m",account:"PaperTrading",rating:5,notes:"NY open continued London sell. Clean delivery.",pretrade:"NY continuation of London trend",emotion:"Calm",risk:"0.5%",checklist:[0,1,2,4,5,6],charts:[]},
  {id:8,date:"2026-03-06",pair:"GBPUSD",pos:"Buy",rr:"1:3",pnl:0,outcome:"B.E",kz:"London",strategy:"NxtGen - Mod",tf:"1h > 3m",account:"PaperTrading",rating:4,notes:"Good entry. Moved SL to BE too quickly on first pullback. Price eventually hit target. Patience needed.",pretrade:"NxtGen model — 1h CISD",emotion:"Anxious",risk:"0.5%",checklist:[0,1,2,3,4,5,6],charts:[]},
  {id:9,date:"2026-03-09",pair:"GBPUSD",pos:"Sell",rr:"1:3",pnl:3,outcome:"Win",kz:"London",strategy:"NxtGen - Mod",tf:"30m > 3m",account:"GFT $5k - P1",rating:4,notes:"First funded account trade. Clean NxtGen setup. Stuck to plan. Great execution.",pretrade:"Strong bearish week bias",emotion:"Calm",risk:"0.5%",checklist:[0,1,2,3,4,5,6,7],charts:[]},
  {id:10,date:"2026-03-10",pair:"ES",pos:"Sell",rr:"1:2.5",pnl:2.6,outcome:"Win",kz:"New York",strategy:"IRL > ERL",tf:"30m > 3m",account:"GFT $10k - P1",rating:5,notes:"ES gap fill at NY open. IRL swept. 30m OB gave entry. Smooth delivery.",pretrade:"IRL > ERL model on ES futures",emotion:"Confident",risk:"1%",checklist:[0,1,2,3,4,5,6,7],charts:[]},
  {id:11,date:"2026-03-10",pair:"GBPUSD",pos:"Buy",rr:"1:2",pnl:2.1,outcome:"Win",kz:"New York",strategy:"IRL > ERL",tf:"30m > 3m",account:"GFT $5k - P1",rating:5,notes:"London sell complete. NY reversal from daily IRL. 30m MS shifted bullish.",pretrade:"Reversal after London sell",emotion:"Calm",risk:"0.5%",checklist:[0,1,2,3,4,5,6,7],charts:[]},
  {id:12,date:"2026-03-10",pair:"GBPUSD",pos:"Sell",rr:"1:3",pnl:5.2,outcome:"Win",kz:"London",strategy:"NxtGen - Mod",tf:"30m > 3m",account:"GFT $5k - P1",rating:5,notes:"Best trade of the week. 1am manipulation clear. 30m MS bearish. 3m entry perfect. Full RR hit.",pretrade:"NxtGen textbook sell setup",emotion:"Confident",risk:"1%",checklist:[0,1,2,3,4,5,6,7],charts:[]},
  {id:13,date:"2026-03-11",pair:"GBPUSD",pos:"Sell",rr:"1:2",pnl:-1,outcome:"Loss",kz:"London",strategy:"NxtGen - Mod",tf:"1h > 5m",account:"GFT $5k - P1",rating:5,notes:"Took a sell when daily was still bullish. NxtGen model needs HTF alignment. Costly lesson.",pretrade:"NxtGen setup but HTF bullish",emotion:"Fearful",risk:"0.5%",checklist:[0,1,2,3,4,5],charts:[]},
  {id:14,date:"2026-03-12",pair:"GBPUSD",pos:"Buy",rr:"1:3",pnl:2.8,outcome:"Win",kz:"London",strategy:"IRL > ERL",tf:"30m > 3m",account:"GFT $5k - P1",rating:5,notes:"Back to buying after Thursday's loss. Daily IRL held perfectly. 30m shift. Clean 3m entry.",pretrade:"Daily bullish — IRL respected",emotion:"Calm",risk:"0.8%",checklist:[0,1,2,3,4,5,6,7],charts:[]},
  {id:15,date:"2026-03-13",pair:"EURUSD",pos:"Sell",rr:"1:4",pnl:4,outcome:"Win",kz:"London",strategy:"NxtGen - Mod",tf:"1h > 3m",account:"GFT $10k - P1",rating:4,notes:"EURUSD weekly bearish. Daily SIBI. 1h confirmed. 3m entry. Full target in 2hrs.",pretrade:"EURUSD daily SIBI fill",emotion:"Confident",risk:"1%",checklist:[0,1,2,3,4,5,6,7],charts:[]},
  {id:16,date:"2026-04-01",pair:"GBPUSD",pos:"Buy",rr:"1:3",pnl:3,outcome:"Win",kz:"London",strategy:"IRL > ERL",tf:"30m > 3m",account:"GFT $5k - P1",rating:5,notes:"Q2 started strong. Daily bullish continuation. IRL > ERL textbook.",pretrade:"Strong weekly bullish bias Q2",emotion:"Calm",risk:"0.8%",checklist:[0,1,2,3,4,5,6,7],charts:[]},
  {id:17,date:"2026-04-02",pair:"EURUSD",pos:"Sell",rr:"1:4",pnl:-1,outcome:"Loss",kz:"London",strategy:"NxtGen - Mod",tf:"1h > 3m",account:"GFT $5k - P1",rating:3,notes:"Rating was 3 stars — should not have taken it. Data shows 3-star setups underperform.",pretrade:"Marginal setup",emotion:"Anxious",risk:"0.5%",checklist:[0,1,2,3,4],charts:[]},
  {id:18,date:"2026-04-03",pair:"XAUUSD",pos:"Buy",rr:"1:5",pnl:5,outcome:"Win",kz:"Asian",strategy:"ERL > IRL",tf:"30m > 3m",account:"GFT $10k - P1",rating:5,notes:"Asian consolidation broke cleanly at 3am. ERL swept. Full 1:5 RR delivered in NY.",pretrade:"Asian range break setup",emotion:"Calm",risk:"1%",checklist:[0,1,2,3,4,5,6,7],charts:[]},
  {id:19,date:"2026-04-07",pair:"EURUSD",pos:"Buy",rr:"1:4",pnl:0,outcome:"B.E",kz:"London",strategy:"IRL > ERL",tf:"1h > 5m",account:"GFT $5k - P1",rating:4,notes:"CPI data caused spike — stopped BE. Should have closed before news.",pretrade:"Valid but NY news risk",emotion:"Anxious",risk:"0.5%",checklist:[0,1,2,3,4,5,6],charts:[]},
  {id:20,date:"2026-04-09",pair:"XAUUSD",pos:"Buy",rr:"1:4",pnl:4,outcome:"Win",kz:"London",strategy:"IRL > ERL",tf:"1h > 3m",account:"GFT $10k - P1",rating:5,notes:"Strong week for gold. Daily IRL into previous week low swept. 1h OB entry. Clean delivery.",pretrade:"Daily bullish gold bias",emotion:"Confident",risk:"1%",checklist:[0,1,2,3,4,5,6,7],charts:[]},
];

const CHECKLIST_ITEMS=["HTF PDA confirmed","4h profiling done","Liquidity sweep seen","SMT divergence checked","CISD confirmed","R:R ≥ 1:3","Active killzone","No FOMO / Calm"];
const EMOTIONS=["Calm","Confident","Anxious","Fearful","Neutral","Revenge"];
const CHART_LABELS=["Daily HTF","4h Structure","1h Confirm","30m Trigger","3m/5m Entry","Result"];
const RULES=["Never trade without HTF bias confirmed","Never enter without an active killzone","Never risk more than 1% on funded accounts","Never chase price — missed entry = no entry","Never move SL before 30% of target is hit","Never trade 15 min before/after red news","Never skip the entry checklist","Never take more than 2 trades per day","Never take a 3★ or below setup","Never trade while angry, fearful or revenge-seeking"];
const MODELS=[
  {title:"Model 1 — IRL > ERL",dir:"Bearish",sub:"Price at Internal Range Liquidity → delivers to External Range Liquidity",steps:["Daily/Weekly confirms bearish bias","4h shows sell-side delivery","1am London manipulation sweeps buy-side (IRL)","30m market structure shifts bearish (BOS/CHoCH)","Enter on 3m OB or FVG · SL above manipulation high","Target: ERL — previous lows, daily BISI, weekly discount"]},
  {title:"Model 2 — ERL > IRL",dir:"Bullish",sub:"Price at External Range Liquidity → returns to Internal Range Liquidity",steps:["Daily/Weekly confirms bullish bias","4h shows buy-side delivery","1am London manipulation sweeps sell-side (ERL)","30m market structure shifts bullish","Enter on 3m OB or FVG · SL below manipulation low","Target: IRL — previous highs, daily SIBI, weekly premium"]},
  {title:"Model 3 — NxtGen Modified",dir:"SMT + CISD",sub:"SMT divergence confirms manipulation · CISD gives entry",steps:["Identify SMT between GBPUSD/EURUSD or Gold/DXY","One pair makes new high/low while other fails → SMT confirmed","Wait for CISD on 1h or 30m","Enter on 3m/5m · tight SL","Target: opposing liquidity pool"]},
];
const WL_PAIRS=[
  {name:"GBPUSD",priority:"🔴 HIGH",bias:"Bear",tfs:[{tf:"Weekly",bias:"bear"},{tf:"Daily",bias:"bear"},{tf:"4H",bias:"bear"},{tf:"1H",bias:"neu"}],note:"Setup: NxtGen IRL>ERL · Key: 1.2650 OB · R:R 1:3 · London kill zone · Watch 1am manipulation"},
  {name:"XAUUSD",priority:"🔴 HIGH",bias:"Bull",tfs:[{tf:"Weekly",bias:"bull"},{tf:"Daily",bias:"bull"},{tf:"4H",bias:"neu"}],note:"Setup: IRL>ERL bounce · Target: 3100 EQL · R:R 1:4 · Asian range then NY breakout"},
  {name:"EURUSD",priority:"🟡 MED",bias:"Bear",tfs:[{tf:"Weekly",bias:"bear"},{tf:"Daily",bias:"bear"},{tf:"4H",bias:"bear"}],note:"Setup: Liquidity sweep · FOMC risk — wait for NY open · R:R 1:3"},
  {name:"GBPJPY",priority:"🟡 MED",bias:"Bull",tfs:[{tf:"Weekly",bias:"bull"},{tf:"Daily",bias:"bull"},{tf:"4H",bias:"neu"}],note:"Check DXY correlation · SMT divergence with GBPUSD · R:R 1:5"},
];
const PREWEEK_CHECKS=["DXY analysis complete","All high-priority pairs analyzed top-down","Key news events noted (WAT times)","Weekly levels drawn on charts","London KZ confirmed: 9am–12pm WAT","New York KZ confirmed: 3pm–6pm WAT","Asian KZ confirmed: 2am–5am WAT","Max 2 trades/day set","Max daily loss −2% set","Max weekly loss −5% set","No pending FOMO setups","Mindset: calm and rule-based"];
const MILESTONES=["Pass GFT $5k Phase 1","Pass GFT $10k Phase 1","Receive first funded payout","Scale to $50k funded","Scale to $100k funded","Open personal live account","Consistent $1k/month"];
const GOALS=[
  {q:"Q1 2026 ✅",items:[{t:"Log every trade with full notes",done:true},{t:"Achieve 70%+ win rate in March",done:true},{t:"Pass first GFT challenge (Phase 1)",done:true},{t:"Build consistent London session routine",done:true},{t:"Achieve $1,000 profit from funded accounts",done:false}]},
  {q:"Q2 2026 🔵 Active",items:[{t:"Maintain 70%+ win rate",done:true},{t:"Pass GFT $10k Phase 1",done:false},{t:"Receive first funded payout",done:false},{t:"Trade 3 consecutive winning weeks",done:false},{t:"Build Sunday watchlist habit",done:false}]},
  {q:"Q3 2026",items:[{t:"Scale to 2% risk on top setups",done:false},{t:"Add NASDAQ to watchlist",done:false},{t:"Achieve $3,000 total payouts",done:false}]},
];
const AFFIRMATIONS=["I only take A+ setups. I am patient.","I follow my plan. I do not chase price.","My edge works over time. One trade does not define me.","I protect my capital above all else.","I am calm, disciplined, and consistent.","Losses are the cost of doing business. I learn and move on.","I trade the model, not my emotions."];

// ── STATE ─────────────────────────────────────────────
let trades = [];
let deletedTrades = [];
let tradeState = {};   // keyed by trade id — holds notes/charts/checklist
let currentDetail = null;
let currentUploadSlot = null;
let _detFullscreen = false;
let _detEditMode = false;
let _detActiveTab = 'overview';

// ══════════════════════════════════════════════════════
// SUPABASE HELPERS
// Each function talks to the DB and also keeps the local
// in-memory arrays (trades, deletedTrades, tradeState) in sync.
// ══════════════════════════════════════════════════════

/* Map a Supabase DB row → the shape the rest of the app expects */
function _rowToTrade(row) {
  return {
    id:       row.id,
    date:     row.trade_date,
    pair:     row.pair,
    pos:      row.pos,
    rr:       row.rr,
    pnl:      parseFloat(row.pnl) || 0,
    outcome:  row.outcome,
    kz:       row.kz,
    strategy: row.strategy || '',
    tf:       row.tf || '',
    account:  row.account,
    rating:   row.rating || 5,
    risk:     row.risk || '0.5%',
    notes:    row.notes || '',
    pretrade: row.pretrade || '',
    emotion:  row.emotion || 'Calm',
    checklist: row.checklist || [],
    charts:   row.charts || [],
    chartLabels: row.chart_labels || [...CHART_LABELS],
    mistakes: row.mistakes || '',
  };
}

/* Map a Supabase deleted_trades row */
function _rowToDeleted(row) {
  return {
    ..._rowToTrade(row),
    deletedAt: row.deleted_at,
    originalId: row.original_id,
  };
}

/* Load all active trades for this user from Supabase */
async function loadTrades() {
  const { data, error } = await sb
    .from('journal_trades')
    .select('*')
    .order('trade_date', { ascending: false });

  if (error) {
    console.error('loadTrades error:', error.message);
    return false;
  }

  if (data.length === 0) {
    // First time this user logs in — seed the demo trades
    await seedDemoTrades();
  } else {
    trades = data.map(_rowToTrade);
    // Rebuild tradeState from DB rows
    tradeState = {};
    data.forEach(row => {
      tradeState[row.id] = {
        notes:       row.notes || '',
        pretrade:    row.pretrade || '',
        mistakes:    row.mistakes || '',
        emotion:     row.emotion || 'Calm',
        checklist:   row.checklist || [],
        charts:      row.charts || [],
        chartLabels: row.chart_labels || [...CHART_LABELS],
      };
    });
  }
  return true;
}

/* Load deleted trades for this user */
async function loadDeletedTrades() {
  const { data, error } = await sb
    .from('journal_deleted_trades')
    .select('*')
    .order('deleted_at', { ascending: false });

  if (error) { console.error('loadDeletedTrades error:', error.message); return; }
  deletedTrades = (data || []).map(_rowToDeleted);
}

/* Insert demo seed trades for brand new users */
async function seedDemoTrades() {
  showToast('Setting up your journal…', 'info');
  const rows = SEED_TRADES.map(t => ({
    user_id:      _currentUser.id,
    trade_date:   t.date,
    pair:         t.pair,
    pos:          t.pos,
    rr:           t.rr,
    pnl:          t.pnl,
    outcome:      t.outcome,
    kz:           t.kz,
    strategy:     t.strategy,
    tf:           t.tf,
    account:      t.account,
    rating:       t.rating,
    risk:         t.risk,
    notes:        t.notes,
    pretrade:     t.pretrade,
    emotion:      t.emotion,
    checklist:    t.checklist,
    charts:       t.charts,
    chart_labels: [...CHART_LABELS],
    mistakes:     '',
  }));

  const { data, error } = await sb.from('journal_trades').insert(rows).select();
  if (error) { console.error('Seed error:', error.message); return; }
  trades = data.map(_rowToTrade);
  tradeState = {};
  data.forEach(row => {
    tradeState[row.id] = {
      notes: row.notes || '', pretrade: row.pretrade || '',
      mistakes: '', emotion: row.emotion || 'Calm',
      checklist: row.checklist || [], charts: row.charts || [],
      chartLabels: [...CHART_LABELS],
    };
  });
  showToast('Welcome! Demo trades loaded.', 'restore');
}

/* Save (upsert) a single trade to Supabase */
async function _cloudSaveTrade(t) {
  const s = getTS(t.id);
  const row = {
    id:           t.id,
    user_id:      _currentUser.id,
    trade_date:   t.date,
    pair:         t.pair,
    pos:          t.pos,
    rr:           t.rr,
    pnl:          t.pnl,
    outcome:      t.outcome,
    kz:           t.kz,
    strategy:     t.strategy,
    tf:           t.tf,
    account:      t.account,
    rating:       t.rating,
    risk:         t.risk,
    notes:        s.notes || t.notes || '',
    pretrade:     s.pretrade || t.pretrade || '',
    emotion:      s.emotion || t.emotion || 'Calm',
    checklist:    s.checklist || t.checklist || [],
    charts:       s.charts || t.charts || [],
    chart_labels: s.chartLabels || [...CHART_LABELS],
    mistakes:     s.mistakes || '',
  };

  const { error } = await sb.from('journal_trades').upsert(row, { onConflict: 'id' });
  if (error) {
    console.error('_cloudSaveTrade error:', error.message);
    showToast('Save failed — check connection', 'danger');
    return false;
  }
  return true;
}

/* Delete a trade from journal_trades (soft delete: insert to journal_deleted_trades) */
async function _cloudSoftDelete(t) {
  const deletedRow = {
    user_id:      _currentUser.id,
    original_id:  t.id,
    trade_date:   t.date,
    pair:         t.pair,
    pos:          t.pos,
    rr:           t.rr,
    pnl:          t.pnl,
    outcome:      t.outcome,
    kz:           t.kz,
    strategy:     t.strategy,
    tf:           t.tf,
    account:      t.account,
    rating:       t.rating,
    risk:         t.risk,
    notes:        t.notes || '',
    pretrade:     t.pretrade || '',
    emotion:      t.emotion || 'Calm',
    checklist:    t.checklist || [],
    charts:       t.charts || [],
    chart_labels: t.chartLabels || [...CHART_LABELS],
    mistakes:     t.mistakes || '',
    deleted_at:   new Date().toISOString(),
  };

  const [del, ins] = await Promise.all([
    sb.from('journal_trades').delete().eq('id', t.id),
    sb.from('journal_deleted_trades').insert(deletedRow),
  ]);

  if (del.error) { console.error('Delete error:', del.error.message); return false; }
  if (ins.error) { console.error('Insert deleted error:', ins.error.message); return false; }
  return true;
}

/* Restore a deleted trade: remove from deleted, insert back to active */
async function _cloudRestoreTrade(deletedRow) {
  const newRow = {
    user_id:      _currentUser.id,
    trade_date:   deletedRow.date,
    pair:         deletedRow.pair,
    pos:          deletedRow.pos,
    rr:           deletedRow.rr,
    pnl:          deletedRow.pnl,
    outcome:      deletedRow.outcome,
    kz:           deletedRow.kz,
    strategy:     deletedRow.strategy,
    tf:           deletedRow.tf,
    account:      deletedRow.account,
    rating:       deletedRow.rating,
    risk:         deletedRow.risk,
    notes:        deletedRow.notes || '',
    pretrade:     deletedRow.pretrade || '',
    emotion:      deletedRow.emotion || 'Calm',
    checklist:    deletedRow.checklist || [],
    charts:       deletedRow.charts || [],
    chart_labels: deletedRow.chartLabels || [...CHART_LABELS],
    mistakes:     deletedRow.mistakes || '',
  };

  // Find the DB id of the deleted record (stored as originalId in local model)
  const { data: delData } = await sb
    .from('journal_deleted_trades')
    .select('id')
    .eq('original_id', deletedRow.originalId)
    .eq('user_id', _currentUser.id)
    .single();

  const [ins, del] = await Promise.all([
    sb.from('journal_trades').insert(newRow).select().single(),
    delData ? sb.from('journal_deleted_trades').delete().eq('id', delData.id) : Promise.resolve({ error: null }),
  ]);

  if (ins.error) { console.error('Restore insert error:', ins.error.message); return null; }
  return _rowToTrade(ins.data);
}

/* Permanently delete a record from journal_deleted_trades */
async function _cloudPermDelete(originalId) {
  const { error } = await sb
    .from('journal_deleted_trades')
    .delete()
    .eq('original_id', originalId)
    .eq('user_id', _currentUser.id);
  if (error) { console.error('Perm delete error:', error.message); return false; }
  return true;
}

/* Empty trash — delete all deleted_trades for this user */
async function _cloudEmptyTrash() {
  const { error } = await sb
    .from('journal_deleted_trades')
    .delete()
    .eq('user_id', _currentUser.id);
  if (error) { console.error('Empty trash error:', error.message); return false; }
  return true;
}

// ── tradeState helper (in-memory, synced on each save) ──
function getTS(id) {
  if (!tradeState[id]) tradeState[id] = {
    notes: '', pretrade: '', mistakes: '', emotion: 'Calm',
    checklist: [], charts: [], chartLabels: [...CHART_LABELS],
  };
  if (!tradeState[id].chartLabels) tradeState[id].chartLabels = [...CHART_LABELS];
  if (!tradeState[id].charts) tradeState[id].charts = [];
  return tradeState[id];
}

// ── NAVIGATION ────────────────────────────────────────
function nav(pageId, sbEl, label, extra) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.sb-item').forEach(s => s.classList.remove('active'));
  const pg = document.getElementById('page-' + pageId);
  if (pg) { pg.classList.add('active'); pg.scrollTop = 0; }
  const tab = document.getElementById('tab-' + pageId);
  if (tab) tab.classList.add('active');
  if (sbEl) sbEl.classList.add('active');
  document.getElementById('topbar-page').textContent = label;
  if (pageId === 'tradelog') renderTradeTable(trades);
  renderCalendar();
  if (pageId === 'quarter' && extra) { renderQuarterPage(extra.year, extra.q); }
  if (pageId === 'calendar') { setTimeout(renderCalendar, 0); }
  if (pageId === 'trash') { setTimeout(renderTrash, 0); }
}

// ── DASHBOARD: PAIR TABLE ────────────────────────────
function buildPairTable() {
  const pairs = [...new Set(trades.map(t => t.pair))].sort((a, b) => {
    const la = trades.filter(t => t.pair === a).length;
    const lb = trades.filter(t => t.pair === b).length;
    return lb - la;
  });
  const tbody = document.getElementById('pair-table-body');
  tbody.innerHTML = pairs.map(p => {
    const pt = trades.filter(t => t.pair === p);
    if (!pt.length) return '';
    const wins = pt.filter(t => t.outcome === 'Win').length;
    const wr = pt.length ? Math.round(wins / pt.length * 100) : 0;
    const netPnl = pt.reduce((a, t) => a + t.pnl, 0).toFixed(1);
    const wrClass = wr >= 70 ? 'pill-green' : wr >= 50 ? 'pill-gold' : 'pill-red';
    const pnlClass = netPnl > 0 ? 'outcome-win' : 'outcome-loss';
    const barColor = wr >= 70 ? 'green' : 'red';
    return `<tr><td class="bold">${p}</td><td>${pt.length}</td><td><span class="pill ${wrClass}">${wr}%</span></td><td class="${pnlClass} mono">${netPnl > 0 ? '+' : ''}${netPnl}%</td><td><div class="win-bar-wrap"><div class="win-bar-bg"><div class="win-bar-fill ${barColor}" style="width:${wr}%"></div></div></div></td></tr>`;
  }).join('');
}

function refreshPairFilter() {
  const sel = document.getElementById('filter-pair');
  if (!sel) return;
  const cur = sel.value;
  const pairs = [...new Set(trades.map(t => t.pair))].sort();
  sel.innerHTML = '<option value="">All pairs</option>' + pairs.map(p => `<option${p === cur ? ' selected' : ''}>${p}</option>`).join('');
}

// ── TRADE TABLE ───────────────────────────────────────
function starsHTML(n) { return '★'.repeat(n) + '<span class="empty">' + '★'.repeat(5 - n) + '</span>'; }
function renderTradeTable(list) {
  const tbody = document.getElementById('trade-table-body');
  tbody.innerHTML = list.map(t => {
    const pnlC = t.pnl > 0 ? 'outcome-win' : t.pnl < 0 ? 'outcome-loss' : 'outcome-be';
    const outC = t.outcome === 'Win' ? 'outcome-win' : t.outcome === 'Loss' ? 'outcome-loss' : 'outcome-be';
    const posC = t.pos === 'Buy' ? 'pos-buy' : 'pos-sell';
    return `<tr class="trade-log-row" onmouseenter="showRowActions(${t.id},this)" onmouseleave="hideRowActions(${t.id})" onclick="openDetail(${t.id})">
      <td class="mono" style="color:var(--text2)">${t.date}</td>
      <td class="bold">${t.pair}</td>
      <td><span class="${posC}">${t.pos}</span></td>
      <td class="mono">${t.rr}</td>
      <td class="${pnlC} mono">${t.pnl > 0 ? '+' : ''}${t.pnl}%</td>
      <td class="${outC}">${t.outcome}</td>
      <td style="color:var(--text2)">${t.kz}</td>
      <td style="color:var(--text2);font-size:12px">${t.strategy || '—'}</td>
      <td style="color:var(--text2);font-size:12px">${t.account}</td>
      <td class="stars">${starsHTML(t.rating)}</td>
      <td class="row-actions" id="ra-${t.id}" style="white-space:nowrap;opacity:0;transition:opacity .15s">
        <button onclick="event.stopPropagation();openDetail(${t.id},true)" style="background:rgba(58,134,255,.15);border:1px solid rgba(58,134,255,.3);color:var(--blue);border-radius:4px;padding:2px 8px;font-size:11px;cursor:pointer;margin-right:4px">✏️</button>
        <button onclick="event.stopPropagation();quickDelete(${t.id})" style="background:rgba(230,57,70,.12);border:1px solid rgba(230,57,70,.25);color:var(--red);border-radius:4px;padding:2px 8px;font-size:11px;cursor:pointer">🗑</button>
      </td>
    </tr>`;
  }).join('');
  const countEl = document.getElementById('trade-count');
  if (countEl) countEl.textContent = `Showing ${list.length} of ${trades.length} trades · Sum PnL: ${list.reduce((a, t) => a + t.pnl, 0).toFixed(1)}%`;
  document.querySelectorAll('#trade-table-body tr').forEach((row, i) => {
    row.style.opacity = '0'; row.style.transform = 'translateY(6px)';
    row.style.transition = `opacity 0.18s ${i * 0.02}s ease,transform 0.18s ${i * 0.02}s ease`;
    setTimeout(() => { row.style.opacity = ''; row.style.transform = ''; }, 10);
  });
}
function showRowActions(id, row) { const el = document.getElementById('ra-' + id); if (el) el.style.opacity = '1'; }
function hideRowActions(id) { const el = document.getElementById('ra-' + id); if (el) el.style.opacity = '0'; }
function filterTable() {
  const q = document.getElementById('search-input').value.toLowerCase();
  const oc = document.getElementById('filter-outcome').value;
  const kz = document.getElementById('filter-kz').value;
  const pr = document.getElementById('filter-pair').value;
  const filtered = trades.filter(t => {
    const qs = !q || (t.pair.toLowerCase().includes(q) || t.date.includes(q) || t.kz.toLowerCase().includes(q) || t.strategy.toLowerCase().includes(q));
    return qs && (!oc || t.outcome === oc) && (!kz || t.kz === kz) && (!pr || t.pair === pr);
  });
  renderTradeTable(filtered);
}

// ── TRADE DETAIL PANEL ────────────────────────────────
function openDetail(id, editMode) {
  if (currentDetail !== id) { _detActiveTab = 'overview'; _detEditMode = false; }
  currentDetail = id;
  _detEditMode = editMode || false;
  if (!_detActiveTab) _detActiveTab = 'overview';
  _renderDetail(id);
  document.getElementById('detail-panel').classList.add('open');
}

function _renderDetail(id) {
  const t = trades.find(x => x.id === id);
  if (!t) return;
  const s = getTS(id);
  const pnlC = t.pnl > 0 ? 'green' : t.pnl < 0 ? 'red' : 'blue';
  const expandIcon = _detFullscreen ? '⊡' : '⤢';
  const expandTip = _detFullscreen ? 'Exit fullscreen' : 'Expand to fullscreen';

  const panelHeader = `
    <div class="det-panel-header">
      <div style="display:flex;align-items:center;gap:8px">
        ${_detEditMode
          ? `<button class="det-btn edit-active" onclick="_toggleEditMode(${id})" style="padding:5px 10px">✕ Cancel</button>
             <button class="det-btn" onclick="_saveEdit(${id})" style="background:rgba(52,211,153,.15);border-color:var(--green);color:var(--green);padding:5px 10px">💾 Save Changes</button>`
          : `<button class="det-btn" onclick="_toggleEditMode(${id})" style="padding:5px 10px">✏️ Edit</button>
             <button class="det-btn del-btn" onclick="_confirmDelete(${id})" style="padding:5px 10px">🗑 Delete</button>`
        }
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <button class="det-panel-expand" onclick="toggleDetailSize(${id})" title="${expandTip}">${expandIcon}</button>
        <button class="det-panel-close" onclick="closeDetail()" title="Close">✕</button>
      </div>
    </div>`;

  const header = `
    <div class="detail-pair" style="background:linear-gradient(135deg,var(--text) 0%,var(--text2) 100%);-webkit-background-clip:text;background-clip:text">${t.pair}</div>
    <div class="detail-meta">${t.date} · ${t.pos} · ${t.account}</div>
    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
      <span class="pill ${t.outcome === 'Win' ? 'pill-green' : t.outcome === 'Loss' ? 'pill-red' : 'pill-blue'}">${t.outcome}</span>
      <span class="pill ${t.pos === 'Buy' ? 'pill-green' : 'pill-red'}">${t.pos}</span>
      <span class="pill pill-grey">${t.rr}</span>
      <span class="pill pill-grey">${t.kz}</span>
    </div>`;

  const tabsHTML = ['overview', 'charts', 'notes'].map(tab => `
    <div class="det-tab${_detActiveTab === tab ? ' active' : ''}" data-tab="${tab}" onclick="_switchDetTab('${tab}',${id})">
      ${tab === 'overview' ? 'Overview' : tab === 'charts' ? '📷 Charts' : '📝 Notes'}
    </div>`).join('');

  const viewStats = `
    <div class="detail-stats">
      <div class="stat-row"><span class="stat-label">PnL</span><span class="stat-val ${pnlC}">${t.pnl > 0 ? '+' : ''}${t.pnl}%</span></div>
      <div class="stat-row"><span class="stat-label">R:R</span><span class="stat-val">${t.rr}</span></div>
      <div class="stat-row"><span class="stat-label">Strategy</span><span class="stat-val">${t.strategy || '—'}</span></div>
      <div class="stat-row"><span class="stat-label">TF</span><span class="stat-val">${t.tf || '—'}</span></div>
      <div class="stat-row"><span class="stat-label">Risk</span><span class="stat-val">${t.risk || '—'}</span></div>
      <div class="stat-row"><span class="stat-label">Rating</span><span class="stat-val stars">${starsHTML(t.rating)}</span></div>
    </div>
    <div id="del-confirm-area"></div>`;

  const editForm = `
    <div class="form-grid" style="margin-bottom:14px">
      <div class="form-field"><label class="form-label">Date</label><input type="date" class="form-input" id="e-date" value="${t.date}"></div>
      <div class="form-field"><label class="form-label">Pair</label><input type="text" class="form-input" id="e-pair" value="${t.pair}"></div>
      <div class="form-field"><label class="form-label">Position</label><select class="form-select" id="e-pos"><option${t.pos === 'Buy' ? ' selected' : ''}>Buy</option><option${t.pos === 'Sell' ? ' selected' : ''}>Sell</option></select></div>
      <div class="form-field"><label class="form-label">R:R</label><input type="text" class="form-input" id="e-rr" value="${t.rr}"></div>
      <div class="form-field"><label class="form-label">PnL %</label><input type="number" class="form-input" id="e-pnl" step="0.1" value="${t.pnl}"></div>
      <div class="form-field"><label class="form-label">Outcome</label><select class="form-select" id="e-outcome"><option${t.outcome === 'Win' ? ' selected' : ''}>Win</option><option${t.outcome === 'Loss' ? ' selected' : ''}>Loss</option><option${t.outcome === 'B.E' ? ' selected' : ''}>B.E</option></select></div>
      <div class="form-field"><label class="form-label">Killzone</label><select class="form-select" id="e-kz"><option${t.kz === 'London' ? ' selected' : ''}>London</option><option${t.kz === 'New York' ? ' selected' : ''}>New York</option><option${t.kz === 'Asian' ? ' selected' : ''}>Asian</option><option${t.kz === 'Tokyo' ? ' selected' : ''}>Tokyo</option></select></div>
      <div class="form-field"><label class="form-label">Account</label><select class="form-select" id="e-acc"><option${t.account === 'PaperTrading' ? ' selected' : ''}>PaperTrading</option><option${t.account === 'GFT $5k - P1' ? ' selected' : ''}>GFT $5k - P1</option><option${t.account === 'GFT $10k - P1' ? ' selected' : ''}>GFT $10k - P1</option></select></div>
      <div class="form-field"><label class="form-label">Strategy</label><select class="form-select" id="e-strat"><option${t.strategy === 'NxtGen - Mod' ? ' selected' : ''}>NxtGen - Mod</option><option${t.strategy === 'IRL > ERL' ? ' selected' : ''}>IRL > ERL</option><option${t.strategy === 'ERL > IRL' ? ' selected' : ''}>ERL > IRL</option><option${t.strategy === 'SMT Divergence' ? ' selected' : ''}>SMT Divergence</option></select></div>
      <div class="form-field"><label class="form-label">TF</label><select class="form-select" id="e-tf"><option${t.tf === '30m > 3m' ? ' selected' : ''}>30m > 3m</option><option${t.tf === '1h > 5m' ? ' selected' : ''}>1h > 5m</option><option${t.tf === '1h > 3m' ? ' selected' : ''}>1h > 3m</option><option${t.tf === '4h > 15m' ? ' selected' : ''}>4h > 15m</option></select></div>
    </div>
    <div class="form-field" style="margin-bottom:10px"><label class="form-label">Rating</label>
      <div id="star-editor" data-rating="${t.rating}" style="display:flex;gap:6px;font-size:22px;cursor:pointer">
        ${[1,2,3,4,5].map(n => `<span onclick="setStarRating(${id},${n})" style="cursor:pointer" class="${n <= t.rating ? 'lit' : ''}">${n <= t.rating ? '★' : '☆'}</span>`).join('')}
      </div>
    </div>
    <div id="del-confirm-area"></div>`;

  const checklistHTML = `
    <div class="detail-section">
      <div class="detail-section-label">Entry Checklist</div>
      <div class="checklist-grid">${CHECKLIST_ITEMS.map((item, i) => {
        const checked = (s.checklist || []).includes(i);
        return `<div class="cl-item${checked ? ' checked' : ''}" onclick="toggleCheck(${id},${i})"><div class="cl-box">${checked ? '✓' : ''}</div><span class="cl-text">${item}</span></div>`;
      }).join('')}</div>
    </div>`;

  const emotionHTML = `
    <div class="detail-section">
      <div class="detail-section-label">Emotion</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${EMOTIONS.map(e => `<span class="emo-chip${(s.emotion || 'Calm') === e ? ' active' : ''}" onclick="setEmo(${id},'${e}')">${e}</span>`).join('')}
      </div>
    </div>`;

  const chartLabels = s.chartLabels && s.chartLabels.length ? s.chartLabels : [...CHART_LABELS];
  const chartsContent = `
    <div class="det-tab-content${_detActiveTab === 'charts' ? ' active' : ''}" data-tab="charts">
      <div class="detail-section">
        <div class="detail-section-label" style="display:flex;align-items:center;justify-content:space-between">
          Chart Screenshots
          <button onclick="addChartSlot(${id})" style="font-size:11px;padding:3px 10px;background:var(--blue-dim);border:1px solid rgba(96,165,250,.3);color:var(--blue);border-radius:4px;cursor:pointer">+ Add slot</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
          ${chartLabels.map((lbl, i) => `
            <div style="text-align:center">
              <div class="img-slot" onclick="triggerImg(${id},${i})" title="Upload ${lbl}">
                ${(s.charts || [])[i]
                  ? `<img src="${s.charts[i]}" alt="${lbl}"><div class="img-overlay">🔄 Replace</div>`
                  : `<div style="font-size:24px;opacity:.4">📷</div>`}
              </div>
              <div style="display:flex;align-items:center;gap:4px">
                <input type="text" value="${lbl}" onchange="renameChartSlot(${id},${i},this.value)"
                  style="flex:1;font-size:10px;background:var(--glass-1);border:1px solid var(--glass-border);border-radius:4px;padding:3px 6px;color:var(--text2);outline:none;font-family:var(--font-mono)"
                  onfocus="this.style.borderColor='rgba(96,165,250,.45)'" onblur="this.style.borderColor='var(--glass-border)'">
                <button onclick="removeChartSlot(${id},${i})" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:12px;padding:2px" onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--text3)'">✕</button>
              </div>
              ${(s.charts || [])[i] ? `<button onclick="clearChartImage(${id},${i})" style="font-size:10px;color:var(--red);background:none;border:none;cursor:pointer">✕ Clear image</button>` : ''}
            </div>`).join('')}
        </div>
      </div>
    </div>`;

  const notesContent = `
    <div class="det-tab-content${_detActiveTab === 'notes' ? ' active' : ''}" data-tab="notes">
      <div class="detail-section">
        <div class="detail-section-label">Pre-Trade Notes</div>
        <textarea class="notes-area" id="det-pretrade" oninput="getTS(${id}).pretrade=this.value">${s.pretrade || t.pretrade || ''}</textarea>
      </div>
      <div class="detail-section">
        <div class="detail-section-label">Trade Reflection</div>
        <textarea class="notes-area" id="det-notes" style="min-height:120px" oninput="getTS(${id}).notes=this.value">${s.notes || t.notes || ''}</textarea>
      </div>
      <div class="detail-section">
        <div class="detail-section-label">Mistakes</div>
        <textarea class="notes-area" id="det-mistakes" oninput="getTS(${id}).mistakes=this.value">${s.mistakes || ''}</textarea>
      </div>
      <button class="save-btn" id="det-save" onclick="detSave(${id})">💾 Save Notes</button>
    </div>`;

  const overviewContent = `
    <div class="det-tab-content${_detActiveTab === 'overview' ? ' active' : ''}" data-tab="overview">
      ${_detEditMode ? editForm : viewStats}
      ${_detEditMode ? '' : (checklistHTML + emotionHTML)}
    </div>`;

  document.getElementById('detail-content').innerHTML =
    panelHeader + header +
    `<div class="det-tabs">${tabsHTML}</div>` +
    overviewContent + chartsContent + notesContent;
}

function closeDetail() {
  const panel = document.getElementById('detail-panel');
  panel.classList.remove('open', 'fullscreen');
  _detFullscreen = false;
}
function toggleDetailSize(id) {
  const panel = document.getElementById('detail-panel');
  _detFullscreen = !_detFullscreen;
  panel.classList.toggle('fullscreen', _detFullscreen);
  _renderDetail(id);
}
function toggleCheck(id, idx) {
  const s = getTS(id);
  if (!s.checklist) s.checklist = [];
  const p = s.checklist.indexOf(idx);
  if (p >= 0) s.checklist.splice(p, 1); else s.checklist.push(idx);
  _cloudSaveTrade(trades.find(t => t.id === id));
  openDetail(id);
}
function setEmo(id, val) {
  getTS(id).emotion = val;
  _cloudSaveTrade(trades.find(t => t.id === id));
  openDetail(id);
}
function triggerImg(id, slot) {
  currentUploadSlot = { id, slot };
  document.getElementById('img-input').value = '';
  document.getElementById('img-input').click();
}
function handleImg(e) {
  const f = e.target.files[0];
  if (!f || !currentUploadSlot) return;
  const r = new FileReader();
  r.onload = async ev => {
    const s = getTS(currentUploadSlot.id);
    if (!s.charts) s.charts = [];
    s.charts[currentUploadSlot.slot] = ev.target.result;
    await _cloudSaveTrade(trades.find(t => t.id === currentUploadSlot.id));
    openDetail(currentUploadSlot.id);
  };
  r.readAsDataURL(f);
}
async function detSave(id) {
  const s = getTS(id);
  const n = document.getElementById('det-notes');
  const p = document.getElementById('det-pretrade');
  const m = document.getElementById('det-mistakes');
  if (n) s.notes = n.value;
  if (p) s.pretrade = p.value;
  if (m) s.mistakes = m.value;
  const t = trades.find(x => x.id === id);
  if (t) {
    t.notes = s.notes; t.pretrade = s.pretrade;
  }
  const ok = await _cloudSaveTrade(t);
  const btn = document.getElementById('det-save');
  if (btn) {
    btn.classList.add('saved');
    btn.textContent = ok ? '✓ Saved' : '✗ Error';
    setTimeout(() => { btn.classList.remove('saved'); btn.textContent = '💾 Save Notes'; }, 2000);
  }
}

// ── MODAL ─────────────────────────────────────────────
function openModal(prefill) {
  document.getElementById('m-date').value = new Date().toISOString().slice(0, 10);
  document.getElementById('m-pair').value = 'GBPUSD';
  document.getElementById('m-pair-custom').style.display = 'none';
  document.getElementById('m-pos').value = 'Buy';
  document.getElementById('m-rr').value = '';
  document.getElementById('m-pnl').value = '';
  document.getElementById('m-outcome').value = 'Win';
  document.getElementById('m-kz').value = 'London';
  document.getElementById('m-strat').value = 'NxtGen - Mod';
  document.getElementById('m-tf').value = '30m > 3m';
  document.getElementById('m-acc').value = 'PaperTrading';
  document.getElementById('m-rating').value = '★★★★★';
  document.getElementById('m-risk').value = '0.5%';
  document.getElementById('m-pretrade').value = '';
  document.getElementById('m-notes').value = '';
  if (prefill && prefill.date) document.getElementById('m-date').value = prefill.date;
  document.getElementById('modal').classList.add('open');
}
function closeModal() { document.getElementById('modal').classList.remove('open'); }
function syncCustomPair(val) {
  const ci = document.getElementById('m-pair-custom');
  if (val === '__custom__') { ci.style.display = 'block'; ci.focus(); } else ci.style.display = 'none';
}
function getPairValue() {
  const sel = document.getElementById('m-pair').value;
  if (sel === '__custom__') {
    const cv = document.getElementById('m-pair-custom').value.trim().toUpperCase();
    return cv || 'CUSTOM';
  }
  return sel;
}

async function saveTrade() {
  const dateVal = document.getElementById('m-date').value;
  if (!dateVal) { alert('Please select a date'); return; }

  const btn = document.querySelector('#modal .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

  const pairVal = getPairValue();
  const ratingVal = document.getElementById('m-rating').value.split('★').length - 1;

  const newTrade = {
    user_id:      _currentUser.id,
    trade_date:   dateVal,
    pair:         pairVal,
    pos:          document.getElementById('m-pos').value,
    rr:           document.getElementById('m-rr').value || '1:3',
    pnl:          parseFloat(document.getElementById('m-pnl').value) || 0,
    outcome:      document.getElementById('m-outcome').value,
    kz:           document.getElementById('m-kz').value,
    strategy:     document.getElementById('m-strat').value,
    tf:           document.getElementById('m-tf').value,
    account:      document.getElementById('m-acc').value,
    rating:       ratingVal,
    risk:         document.getElementById('m-risk').value,
    notes:        document.getElementById('m-notes').value,
    pretrade:     document.getElementById('m-pretrade').value,
    emotion:      'Calm',
    checklist:    [],
    charts:       [],
    chart_labels: [...CHART_LABELS],
    mistakes:     '',
  };

  const { data, error } = await sb.from('journal_trades').insert(newTrade).select().single();

  if (btn) { btn.disabled = false; btn.textContent = 'Save Trade'; }

  if (error) {
    showToast('Error saving trade: ' + error.message, 'danger');
    return;
  }

  const t = _rowToTrade(data);
  trades.unshift(t);
  trades.sort((a, b) => b.date.localeCompare(a.date));
  tradeState[t.id] = {
    notes: t.notes, pretrade: t.pretrade, emotion: 'Calm',
    checklist: [], charts: [], chartLabels: [...CHART_LABELS], mistakes: '',
  };

  closeModal();
  document.getElementById('m-pair').value = 'GBPUSD';
  document.getElementById('m-pair-custom').style.display = 'none';
  _refreshAll();
  nav('tradelog', null, 'Trade Log');
  renderTradeTable(trades);
  document.getElementById('page-tradelog').scrollTop = 0;
  showToast(t.pair + ' trade saved ✓', 'restore');
}

// ── WATCHLIST ─────────────────────────────────────────
function buildWatchlist() {
  const cont = document.getElementById('watchlist-cards');
  cont.innerHTML = WL_PAIRS.map(p => `
    <div class="wl-pair-card">
      <div class="wl-pair-head">
        <div class="wl-pair-name">${p.name}</div>
        <div class="wl-priority">${p.priority} <span class="pill ${p.bias === 'Bull' ? 'pill-green' : 'pill-red'}">${p.bias}ish</span></div>
      </div>
      <div class="wl-tf-row">${p.tfs.map(tf => `<span class="tf-chip ${tf.bias === 'bull' ? 'tf-bull' : tf.bias === 'bear' ? 'tf-bear' : 'tf-neu'}">${tf.tf} ${tf.bias === 'bull' ? '↑' : tf.bias === 'bear' ? '↓' : '→'}</span>`).join('')}</div>
      <div class="wl-note">${p.note}</div>
    </div>
  `).join('');
  const cl = document.getElementById('preweek-checklist');
  cl.innerHTML = PREWEEK_CHECKS.map((item, i) => `<div class="cl-item" onclick="this.classList.toggle('checked');this.querySelector('.cl-box').textContent=this.classList.contains('checked')?'✓':''"><div class="cl-box"></div><span class="cl-text">${item}</span></div>`).join('');
}

// ── ENTRY FORM ────────────────────────────────────────
function buildEntryForm() {
  document.getElementById('entry-form-content').innerHTML = `
    <div class="form-grid">
      <div class="form-field"><label class="form-label">Date</label><input type="date" class="form-input" value="${new Date().toISOString().slice(0,10)}"></div>
      <div class="form-field"><label class="form-label">Pair</label><select class="form-select"><option>GBPUSD</option><option>XAUUSD</option><option>EURUSD</option><option>GBPJPY</option><option>USDCAD</option><option>ES</option></select></div>
      <div class="form-field"><label class="form-label">Position</label><select class="form-select"><option>Buy</option><option>Sell</option></select></div>
      <div class="form-field"><label class="form-label">R:R</label><input type="text" class="form-input" placeholder="1:3"></div>
      <div class="form-field"><label class="form-label">PnL %</label><input type="number" class="form-input" step="0.1" placeholder="3.5"></div>
      <div class="form-field"><label class="form-label">Outcome</label><select class="form-select"><option>Win</option><option>Loss</option><option>B.E</option></select></div>
      <div class="form-field"><label class="form-label">Killzone</label><select class="form-select"><option>London</option><option>New York</option><option>Asian</option><option>Tokyo</option></select></div>
      <div class="form-field"><label class="form-label">Strategy</label><select class="form-select"><option>NxtGen - Mod</option><option>IRL > ERL</option><option>ERL > IRL</option><option>SMT Divergence</option></select></div>
      <div class="form-field"><label class="form-label">TF Alignment</label><select class="form-select"><option>30m > 3m</option><option>1h > 5m</option><option>1h > 3m</option></select></div>
      <div class="form-field"><label class="form-label">Account</label><select class="form-select"><option>PaperTrading</option><option>GFT $5k - P1</option><option>GFT $10k - P1</option></select></div>
      <div class="form-field"><label class="form-label">Rating</label><select class="form-select"><option>★★★★★</option><option>★★★★☆</option><option>★★★☆☆</option></select></div>
      <div class="form-field"><label class="form-label">Risk</label><select class="form-select"><option>0.5%</option><option>0.8%</option><option>1%</option><option>1.5%</option></select></div>
    </div>
    <div class="sec-head" style="margin-top:20px">Entry Checklist</div>
    <div class="checklist-grid">${CHECKLIST_ITEMS.map(item => `<div class="cl-item" onclick="this.classList.toggle('checked');this.querySelector('.cl-box').textContent=this.classList.contains('checked')?'✓':''"><div class="cl-box"></div><span class="cl-text">${item}</span></div>`).join('')}</div>
    <div class="sec-head">Bias</div>
    <div style="display:flex;gap:8px;margin-bottom:16px">
      <div class="cl-item" onclick="this.classList.toggle('checked')"><div class="cl-box"></div><span class="cl-text">Bullish</span></div>
      <div class="cl-item" onclick="this.classList.toggle('checked')"><div class="cl-box"></div><span class="cl-text">Bearish</span></div>
    </div>
    <div class="form-field" style="margin-bottom:12px"><label class="form-label">HTF Analysis</label><textarea class="form-textarea" placeholder="What is price doing on the daily?"></textarea></div>
    <div class="form-field" style="margin-bottom:12px"><label class="form-label">LTF Entry</label><textarea class="form-textarea" placeholder="CHoCH, BOS, OB, FVG, SMT?"></textarea></div>
    <div class="form-field" style="margin-bottom:12px"><label class="form-label">Pre-Trade Talk</label><textarea class="form-textarea" placeholder="Your mindset and thesis."></textarea></div>
    <div class="form-field" style="margin-bottom:12px"><label class="form-label">Mistakes Made</label><textarea class="form-textarea" placeholder="What mistakes, if any?"></textarea></div>
    <div class="form-field" style="margin-bottom:20px"><label class="form-label">Post-Trade Notes</label><textarea class="form-textarea" style="min-height:120px" placeholder="Full narrative."></textarea></div>
    <button class="save-btn" onclick="alert('Use the + New Trade button in the topbar to save trades to the cloud.')">📋 Reference Only — Use + New Trade to Save</button>
  `;
}
function previewSlot(input) {
  if (!input.files[0]) return;
  const r = new FileReader();
  const slot = input.previousElementSibling;
  r.onload = e => {
    slot.innerHTML = `<img src="${e.target.result}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:4px"><div class="img-overlay">Replace</div>`;
    slot.onclick = () => input.click();
  };
  r.readAsDataURL(input.files[0]);
}

// ── ACCOUNTS ──────────────────────────────────────────
function buildAccounts() {
  const accs = [
    {name:"PaperTrading",size:"Unlimited",type:"Practice",status:"active",target:0,current:0,progress:100,trades:8,wr:62.5,pnl:19.3},
    {name:"GFT $5k — P1",size:"$5,000",type:"Phase 1 · Target: +10%",status:"active",target:500,current:350,progress:70,trades:16,wr:81.3,pnl:30.5},
    {name:"GFT $10k — P1",size:"$10,000",type:"Phase 1 · Target: +10%",status:"active",target:1000,current:400,progress:40,trades:9,wr:88.9,pnl:10.0},
    {name:"GFT $5k — P2",size:"$5,000",type:"Phase 2 · Pending",status:"pending",target:0,current:0,progress:0,trades:0,wr:0,pnl:0},
  ];
  document.getElementById('accounts-grid').innerHTML = accs.map(a => `
    <div class="acc-card">
      <div class="acc-card-head"><div class="acc-name">${a.name}</div><span class="acc-status ${a.status}">${a.status === 'active' ? 'Active' : 'Pending'}</span></div>
      <div class="acc-row"><span class="k">Size</span><span class="v">${a.size}</span></div>
      <div class="acc-row"><span class="k">Type</span><span class="v" style="font-family:var(--font-body);font-size:11px">${a.type}</span></div>
      <div class="acc-row"><span class="k">Trades</span><span class="v">${a.trades}</span></div>
      <div class="acc-row"><span class="k">Win Rate</span><span class="v" style="color:var(--green)">${a.wr}%</span></div>
      <div class="acc-row"><span class="k">Net PnL</span><span class="v" style="color:var(--green)">${a.pnl ? '+' + a.pnl + '%' : '—'}</span></div>
      ${a.target ? `<div class="acc-progress-wrap"><div class="acc-progress-label"><span>Progress to target</span><span>${a.progress}%</span></div><div class="acc-progress-bg"><div class="acc-progress-fill" style="width:${a.progress}%"></div></div></div>` : ''}
    </div>
  `).join('');
  const ml = document.getElementById('milestones-list');
  const done = [0, 1];
  ml.innerHTML = MILESTONES.map((m, i) => `<div class="cl-item${done.includes(i) ? ' checked' : ''}" onclick="this.classList.toggle('checked');this.querySelector('.cl-box').textContent=this.classList.contains('checked')?'✓':''"><div class="cl-box">${done.includes(i) ? '✓' : ''}</div><span class="cl-text">${m}</span></div>`).join('');
}

// ── PLAYBOOK ──────────────────────────────────────────
function buildPlaybook() {
  document.getElementById('model-cards').innerHTML = MODELS.map(m => `
    <div class="model-card">
      <div class="model-title">${m.title}</div>
      <div class="model-sub">${m.sub}</div>
      <div class="model-steps">${m.steps.map(s => `<div class="model-step">${s}</div>`).join('')}</div>
    </div>
  `).join('');
  document.getElementById('rules-list').innerHTML = RULES.map((r, i) => `<div class="rule-card"><div class="rule-num">RULE ${String(i + 1).padStart(2, '0')}</div><div class="rule-text">${r}</div></div>`).join('');
}

// ── GOALS ─────────────────────────────────────────────
function buildGoals() {
  document.getElementById('goals-list').innerHTML = GOALS.map(g => `
    <div style="margin-bottom:14px">
      <div style="font-size:12px;font-weight:600;color:var(--text2);margin-bottom:8px">${g.q}</div>
      <div class="checklist-grid">${g.items.map(item => `<div class="cl-item${item.done ? ' checked' : ''}" onclick="this.classList.toggle('checked');this.querySelector('.cl-box').textContent=this.classList.contains('checked')?'✓':''"><div class="cl-box">${item.done ? '✓' : ''}</div><span class="cl-text">${item.t}</span></div>`).join('')}</div>
    </div>
  `).join('');
  document.getElementById('affirmations').innerHTML = AFFIRMATIONS.map((a, i) => `<div class="rule-card"><div class="rule-num">${String(i + 1).padStart(2, '0')}</div><div class="rule-text" style="font-style:italic">"${a}"</div></div>`).join('');
}

// ── KPIs ─────────────────────────────────────────────
function updateKPIs() {
  const total = trades.length;
  const wins = trades.filter(t => t.outcome === 'Win').length;
  const losses = trades.filter(t => t.outcome === 'Loss').length;
  const wr = total ? ((wins / total) * 100).toFixed(1) : 0;
  const netPnl = trades.reduce((a, t) => a + t.pnl, 0).toFixed(1);
  const winPnls = trades.filter(t => t.pnl > 0).map(t => t.pnl);
  const lossPnls = trades.filter(t => t.pnl < 0).map(t => t.pnl);
  const avgW = winPnls.length ? (winPnls.reduce((a, b) => a + b, 0) / winPnls.length).toFixed(1) : 0;
  const avgL = lossPnls.length ? (lossPnls.reduce((a, b) => a + b, 0) / lossPnls.length).toFixed(1) : 0;
  const pf = lossPnls.length ? Math.abs(winPnls.reduce((a, b) => a + b, 0) / lossPnls.reduce((a, b) => a + b, 0)).toFixed(2) : '∞';
  const rrNums = trades.map(t => { const m = (t.rr || '').match(/1:([\d.]+)/); return m ? parseFloat(m[1]) : null; }).filter(x => x !== null);
  const avgRR = rrNums.length ? (rrNums.reduce((a, b) => a + b, 0) / rrNums.length).toFixed(1) : null;
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  let streak = 0, maxStreak = 0, curStreak = 0;
  sorted.forEach(t => { if (t.outcome === 'Win') { curStreak++; if (curStreak > maxStreak) maxStreak = curStreak; } else curStreak = 0; });
  const rev = [...sorted].reverse();
  for (const t of rev) { if (t.outcome === 'Win') streak++; else break; }
  document.getElementById('kpi-total').textContent = total;
  document.getElementById('kpi-wr').textContent = wr + '%';
  document.getElementById('kpi-pnl').textContent = (netPnl > 0 ? '+' : '') + netPnl + '%';
  document.getElementById('kpi-pf').textContent = pf + 'x';
  document.getElementById('kpi-aw').textContent = (avgW > 0 ? '+' : '') + avgW + '%';
  document.getElementById('kpi-al').textContent = avgL + '%';
  const rrEl = document.getElementById('kpi-rr'); if (rrEl) rrEl.textContent = avgRR ? '1:' + avgRR : '—';
  const wsEl = document.getElementById('kpi-ws'); if (wsEl) wsEl.textContent = streak > 0 ? streak + '↑ (best:' + maxStreak + ')' : maxStreak ? '0 (best:' + maxStreak + ')' : '0';
  document.querySelectorAll('.kpi-value').forEach(el => { el.style.transform = 'scale(1.04)'; el.style.transition = 'transform 0.3s ease'; setTimeout(() => el.style.transform = '', 320); });
  const subEl = document.getElementById('dash-last-updated');
  if (subEl) { const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' }); subEl.textContent = 'Last updated ' + now + ' WAT'; }
}

// ── QUARTER / YEAR HELPERS ────────────────────────────
function getQuarter(dateStr) { const m = parseInt(dateStr.slice(5, 7)); return m <= 3 ? 1 : m <= 6 ? 2 : m <= 9 ? 3 : 4; }
function getYear(dateStr) { return parseInt(dateStr.slice(0, 4)); }
const Q_MONTHS = { 1: 'Jan/Feb/Mar', 2: 'Apr/May/Jun', 3: 'Jul/Aug/Sep', 4: 'Oct/Nov/Dec' };
const Q_RANGE = { 1: [1, 2, 3], 2: [4, 5, 6], 3: [7, 8, 9], 4: [10, 11, 12] };

function buildSidebarYears() {
  const years = [...new Set(trades.map(t => getYear(t.date)))].sort((a, b) => b - a);
  [2025, 2026].forEach(y => { if (!years.includes(y)) years.push(y); });
  years.sort((a, b) => b - a);
  const cont = document.getElementById('sb-years');
  cont.innerHTML = years.map(year => {
    const curYear = new Date().getFullYear();
    const curQ = getQuarter(new Date().toISOString());
    return `<div class="sb-section">
      <div class="sb-section-label" style="display:flex;align-items:center;justify-content:space-between;cursor:pointer" onclick="toggleYear(${year})">
        <span>${year}</span><span id="yr-arrow-${year}" style="font-size:10px;color:var(--text3)">▼</span>
      </div>
      <div id="yr-quarters-${year}">${[1, 2, 3, 4].map(q => {
        const qt = trades.filter(t => getYear(t.date) === year && getQuarter(t.date) === q);
        const isActive = year === curYear && q === curQ;
        const hasTrades = qt.length > 0;
        return `<div class="sb-item${isActive ? ' q2' : ''}" id="sb-q-${year}-${q}" onclick="openQuarter(${year},${q},this)" style="opacity:${hasTrades || isActive ? 1 : 0.45}">
          <span class="ico">${isActive ? '📂' : '📁'}</span>
          <span class="lbl">Q${q} — ${Q_MONTHS[q]}</span>
          ${hasTrades ? `<span style="font-size:10px;color:var(--text3);margin-left:auto">${qt.length}</span>` : ''}
        </div>`;
      }).join('')}</div>
    </div>`;
  }).join('');
}

const _yrOpen = {};
function toggleYear(year) {
  const el = document.getElementById(`yr-quarters-${year}`);
  const ar = document.getElementById(`yr-arrow-${year}`);
  _yrOpen[year] = !(_yrOpen[year] !== false);
  if (_yrOpen[year]) { el.style.display = 'none'; ar.textContent = '▶'; }
  else { el.style.display = ''; ar.textContent = '▼'; }
}
function openQuarter(year, q, sbEl) { nav('quarter', sbEl, `Q${q} ${year} — ${Q_MONTHS[q]}`, { year, q }); }
function renderQuarterPage(year, q) {
  const months = Q_RANGE[q];
  const qt = trades.filter(t => getYear(t.date) === year && getQuarter(t.date) === q);
  const wins = qt.filter(t => t.outcome === 'Win').length;
  const losses = qt.filter(t => t.outcome === 'Loss').length;
  const bes = qt.filter(t => t.outcome === 'B.E').length;
  const wr = qt.length ? ((wins / qt.length) * 100).toFixed(1) : 0;
  const netPnl = qt.reduce((a, t) => a + t.pnl, 0).toFixed(1);
  const winPnls = qt.filter(t => t.pnl > 0).map(t => t.pnl);
  const lossPnls = qt.filter(t => t.pnl < 0).map(t => t.pnl);
  const avgW = winPnls.length ? (winPnls.reduce((a, b) => a + b, 0) / winPnls.length).toFixed(1) : 0;
  const avgL = lossPnls.length ? (lossPnls.reduce((a, b) => a + b, 0) / lossPnls.length).toFixed(1) : 0;
  const pf = lossPnls.length ? Math.abs(winPnls.reduce((a, b) => a + b, 0) / lossPnls.reduce((a, b) => a + b, 0)).toFixed(2) : '∞';
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthRows = months.map(m => {
    const mt = qt.filter(t => parseInt(t.date.slice(5, 7)) === m);
    if (!mt.length) return `<tr><td style="color:var(--text3)">${MONTH_NAMES[m - 1]} ${year}</td><td style="color:var(--text3)">—</td><td>—</td><td>—</td><td>—</td></tr>`;
    const mw = mt.filter(t => t.outcome === 'Win').length;
    const mwr = ((mw / mt.length) * 100).toFixed(0);
    const mpnl = mt.reduce((a, t) => a + t.pnl, 0).toFixed(1);
    const pnlC = mpnl > 0 ? 'outcome-win' : 'outcome-loss';
    return `<tr onclick="filterTableAndNav('${year}-${String(m).padStart(2, '0')}')"><td class="bold">${MONTH_NAMES[m - 1]} ${year}</td><td>${mt.length}</td><td><span class="pill ${mwr >= 70 ? 'pill-green' : mwr >= 50 ? 'pill-gold' : 'pill-red'}">${mwr}%</span></td><td class="${pnlC} mono">${mpnl > 0 ? '+' : ''}${mpnl}%</td><td>${mw}W / ${mt.filter(t => t.outcome === 'Loss').length}L / ${mt.filter(t => t.outcome === 'B.E').length}BE</td></tr>`;
  }).join('');
  const tradeRows = qt.map(t => {
    const pnlC = t.pnl > 0 ? 'outcome-win' : t.pnl < 0 ? 'outcome-loss' : 'outcome-be';
    const outC = t.outcome === 'Win' ? 'outcome-win' : t.outcome === 'Loss' ? 'outcome-loss' : 'outcome-be';
    const posC = t.pos === 'Buy' ? 'pos-buy' : 'pos-sell';
    return `<tr onclick="openDetail(${t.id})" style="cursor:pointer"><td class="mono" style="color:var(--text2)">${t.date}</td><td class="bold">${t.pair}</td><td><span class="${posC}">${t.pos}</span></td><td class="mono">${t.rr}</td><td class="${pnlC} mono">${t.pnl > 0 ? '+' : ''}${t.pnl}%</td><td class="${outC}">${t.outcome}</td><td style="color:var(--text2)">${t.kz}</td><td style="color:var(--text2);font-size:12px">${t.strategy || '—'}</td><td class="stars">${starsHTML(t.rating)}</td></tr>`;
  }).join('');
  document.getElementById('quarter-page-inner').innerHTML = `
    <div class="cover"><div class="cover-label">Quarterly Performance · ${year}</div><div class="cover-title">Q${q} ${year} — ${Q_MONTHS[q]}</div><div class="cover-sub">${qt.length} trades · Win rate ${wr}% · Net PnL ${netPnl > 0 ? '+' : ''}${netPnl}%</div></div>
    <div class="kpi-grid" style="margin-bottom:16px">
      <div class="kpi-card"><div class="kpi-label">Total trades</div><div class="kpi-value blue">${qt.length || '—'}</div></div>
      <div class="kpi-card"><div class="kpi-label">Win rate</div><div class="kpi-value ${wr >= 65 ? 'green' : 'red'}">${wr}%</div></div>
      <div class="kpi-card"><div class="kpi-label">Net PnL</div><div class="kpi-value ${netPnl > 0 ? 'green' : 'red'}">${netPnl > 0 ? '+' : ''}${netPnl}%</div></div>
      <div class="kpi-card"><div class="kpi-label">Profit factor</div><div class="kpi-value gold">${pf}x</div></div>
    </div>
    <div class="kpi-grid" style="margin-bottom:20px">
      <div class="kpi-card"><div class="kpi-label">Wins</div><div class="kpi-value green">${wins}</div></div>
      <div class="kpi-card"><div class="kpi-label">Losses</div><div class="kpi-value red">${losses}</div></div>
      <div class="kpi-card"><div class="kpi-label">Break evens</div><div class="kpi-value blue">${bes}</div></div>
      <div class="kpi-card"><div class="kpi-label">Avg win / loss</div><div class="kpi-value white" style="font-size:14px">+${avgW}% / ${avgL}%</div></div>
    </div>
    ${qt.length === 0 ? `<div style="text-align:center;padding:40px;color:var(--text3)">No trades logged for Q${q} ${year} yet.<br><br><button class="btn btn-primary" onclick="openModal()" style="margin-top:10px">+ Add Trade</button></div>` : `
    <div class="sec-head">Month Breakdown</div>
    <table class="data-table" style="margin-bottom:20px"><thead><tr><th>Month</th><th>Trades</th><th>Win%</th><th>Net PnL</th><th>W/L/BE</th></tr></thead><tbody>${monthRows}</tbody></table>
    <div class="sec-head" style="display:flex;align-items:center;justify-content:space-between"><span>All Trades — Q${q} ${year}</span><button class="btn" onclick="openModal()" style="font-size:11px;padding:4px 10px">+ Add Trade</button></div>
    <table class="data-table"><thead><tr><th>Date</th><th>Pair</th><th>Pos</th><th>R:R</th><th>PnL</th><th>Outcome</th><th>Killzone</th><th>Strategy</th><th>★</th></tr></thead><tbody>${tradeRows}</tbody></table>
    <div style="margin-top:10px;font-size:12px;color:var(--text3)">${qt.length} trades · Click any row to view details</div>
    `}`;
}
function filterTableAndNav(ym) { nav('tradelog', null, 'Trade Log'); document.getElementById('search-input').value = ym; filterTable(); }

// ── THEME ─────────────────────────────────────────────
function toggleTheme() {
  const doc = document.documentElement;
  const isLight = doc.getAttribute('data-theme') === 'light';
  doc.setAttribute('data-theme', isLight ? '' : 'light');
  const btn = document.getElementById('theme-btn');
  if (btn) { btn.textContent = isLight ? '🌙' : '☀️'; btn.classList.add('spinning'); setTimeout(() => btn.classList.remove('spinning'), 420); }
  try { localStorage.setItem('nxtgen_theme', isLight ? 'dark' : 'light'); } catch (e) {}
}
function loadTheme() {
  try {
    const t = localStorage.getItem('nxtgen_theme') || 'dark';
    const isDark = t !== 'light';
    document.documentElement.setAttribute('data-theme', isDark ? '' : 'light');
    const btn = document.getElementById('theme-btn');
    if (btn) btn.textContent = isDark ? '🌙' : '☀️';
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  } catch (e) {}
}

// ── LIVE CLOCK ────────────────────────────────────────
function updateClock() {
  const el = document.getElementById('topbar-clock');
  if (!el) return;
  const now = new Date();
  const t = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Africa/Lagos' });
  const d = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Africa/Lagos' });
  el.textContent = d + ' · ' + t + ' WAT';
}

// ── TAB SWITCHING ─────────────────────────────────────
function _switchDetTab(tab, id) {
  _detActiveTab = tab;
  document.querySelectorAll('.det-tab').forEach(el => el.classList.toggle('active', el.dataset.tab === tab));
  document.querySelectorAll('.det-tab-content').forEach(el => el.classList.toggle('active', el.dataset.tab === tab));
}

// ── EDIT MODE ─────────────────────────────────────────
function _toggleEditMode(id) { _detEditMode = !_detEditMode; _detActiveTab = 'overview'; _renderDetail(id); }

function setStarRating(id, n) {
  const editor = document.getElementById('star-editor');
  if (!editor) return;
  editor.dataset.rating = n;
  editor.querySelectorAll('span').forEach((s, i) => { s.textContent = i < n ? '★' : '☆'; s.className = i < n ? 'lit' : ''; });
}

async function _saveEdit(id) {
  const t = trades.find(x => x.id === id);
  if (!t) return;
  const get = sel => { const el = document.getElementById(sel); return el ? el.value : null; };
  const dateVal = get('e-date'), pairVal = get('e-pair'), posVal = get('e-pos'), rrVal = get('e-rr');
  const pnlVal = get('e-pnl'), outcomeVal = get('e-outcome'), kzVal = get('e-kz');
  const accVal = get('e-acc'), stratVal = get('e-strat'), tfVal = get('e-tf');
  const editor = document.getElementById('star-editor');
  const ratingVal = editor ? parseInt(editor.dataset.rating || t.rating) : t.rating;
  if (dateVal) t.date = dateVal;
  if (pairVal) t.pair = pairVal.trim().toUpperCase();
  if (posVal) t.pos = posVal;
  if (rrVal) t.rr = rrVal;
  if (pnlVal !== null) t.pnl = parseFloat(pnlVal) || 0;
  if (outcomeVal) t.outcome = outcomeVal;
  if (kzVal) t.kz = kzVal;
  if (accVal) t.account = accVal;
  if (stratVal) t.strategy = stratVal;
  if (tfVal) t.tf = tfVal;
  t.rating = ratingVal;
  trades.sort((a, b) => b.date.localeCompare(a.date));
  const ok = await _cloudSaveTrade(t);
  _refreshAll();
  _detEditMode = false;
  _renderDetail(id);
  showToast(t.pair + (ok ? ' updated ✓' : ' update failed'), ok ? 'restore' : 'danger');
}

function _confirmDelete(id) {
  const t = trades.find(x => x.id === id);
  if (!t) return;
  const area = document.getElementById('del-confirm-area');
  if (!area) return;
  area.innerHTML = `
    <div class="del-confirm" style="margin-top:14px">
      <div class="del-confirm-text">Move <strong>${t.pair}</strong> (${t.date}, ${t.pnl > 0 ? '+' : ''}${t.pnl}%) to Trash?<br><span style="font-size:11px;color:var(--text3)">You can restore it from Trash anytime.</span></div>
      <div class="del-confirm-btns">
        <button class="del-no" onclick="document.getElementById('del-confirm-area').innerHTML=''">Cancel</button>
        <button class="del-yes" onclick="_executeSoftDelete(${id})">🗑 Move to Trash</button>
      </div>
    </div>`;
  area.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function _executeSoftDelete(id) {
  const t = trades.find(x => x.id === id);
  if (!t) return;
  const ok = await _cloudSoftDelete(t);
  if (!ok) { showToast('Delete failed', 'danger'); return; }
  deletedTrades.unshift({ ...t, deletedAt: new Date().toISOString(), originalId: t.id });
  trades = trades.filter(x => x.id !== id);
  delete tradeState[id];
  closeDetail();
  _refreshAll();
  showToast(t.pair + ' moved to Trash', 'danger', { label: 'View Trash', fn: "nav('trash',null,'Trash')" });
}

// ── CHART SLOT MANAGEMENT ─────────────────────────────
async function addChartSlot(id) {
  const s = getTS(id);
  if (!s.chartLabels || !s.chartLabels.length) s.chartLabels = [...CHART_LABELS];
  s.chartLabels.push('TF ' + (s.chartLabels.length + 1));
  if (!s.charts) s.charts = [];
  await _cloudSaveTrade(trades.find(t => t.id === id));
  _renderDetail(id);
}
async function removeChartSlot(id, idx) {
  const s = getTS(id);
  if (!s.chartLabels) s.chartLabels = [...CHART_LABELS];
  if (s.chartLabels.length <= 1) { showToast('Must keep at least one slot', 'info'); return; }
  s.chartLabels.splice(idx, 1);
  if (s.charts) s.charts.splice(idx, 1);
  await _cloudSaveTrade(trades.find(t => t.id === id));
  _renderDetail(id);
}
async function renameChartSlot(id, idx, val) {
  const s = getTS(id);
  if (!s.chartLabels) s.chartLabels = [...CHART_LABELS];
  s.chartLabels[idx] = val.trim() || ('TF ' + (idx + 1));
  await _cloudSaveTrade(trades.find(t => t.id === id));
}
async function clearChartImage(id, idx) {
  const s = getTS(id);
  if (s.charts) s.charts[idx] = null;
  await _cloudSaveTrade(trades.find(t => t.id === id));
  _renderDetail(id);
}
async function removeChart(id, slot) {
  const s = getTS(id);
  if (s.charts) s.charts[slot] = null;
  await _cloudSaveTrade(trades.find(t => t.id === id));
  _renderDetail(id);
}

// ── CALENDAR ─────────────────────────────────────────
const MONTH_NAMES_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();
function calNav(dir) { calMonth += dir; if (calMonth > 11) { calMonth = 0; calYear++; } if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendar(); }
function getAccSize() { return parseFloat(document.getElementById('cal-acc-size').value) || 5000; }
function getCalFilter() { const el = document.getElementById('cal-acc-filter'); return el ? el.value : ''; }
function pnlToUSD(pnl, accSize) { return (pnl / 100) * accSize; }
function fmtUSD(val) { const abs = Math.abs(val); const s = abs >= 1000 ? '$' + (abs / 1000).toFixed(1) + 'k' : '$' + abs.toFixed(2); return (val < 0 ? '-' : val > 0 ? '+' : '') + s; }
function groupTradesByDay(tradeList) { const dayMap = {}; tradeList.forEach(t => { if (!dayMap[t.date]) dayMap[t.date] = { trades: [], totalPnl: 0, wins: 0, losses: 0, bes: 0 }; dayMap[t.date].trades.push(t); dayMap[t.date].totalPnl += t.pnl; if (t.outcome === 'Win') dayMap[t.date].wins++; else if (t.outcome === 'Loss') dayMap[t.date].losses++; else dayMap[t.date].bes++; }); return dayMap; }
function calculateDailyOutcome(totalPnl) { if (totalPnl > 0) return 'win'; if (totalPnl < 0) return 'loss'; return 'breakeven'; }
function calculateCalendarWinrate(dayMap) { const days = Object.values(dayMap); const winDays = days.filter(d => calculateDailyOutcome(d.totalPnl) === 'win').length; const lossDays = days.filter(d => calculateDailyOutcome(d.totalPnl) === 'loss').length; const beDays = days.filter(d => calculateDailyOutcome(d.totalPnl) === 'breakeven').length; const denom = winDays + lossDays; const wr = denom > 0 ? ((winDays / denom) * 100) : 0; return { winDays, lossDays, beDays, wr: parseFloat(wr.toFixed(2)) }; }
function showCalTooltip(e, dayData, dateStr, accSize) { const tip = document.getElementById('cal-tooltip'); if (!tip || !dayData) return; const dt = new Date(dateStr + 'T12:00:00'); const dateLabel = dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); const outcome = calculateDailyOutcome(dayData.totalPnl); const usd = pnlToUSD(dayData.totalPnl, accSize); const outLabel = outcome === 'win' ? '🟢 Winning Day' : outcome === 'loss' ? '🔴 Losing Day' : '⚪ Breakeven Day'; const outColor = outcome === 'win' ? 'var(--green)' : outcome === 'loss' ? 'var(--red)' : 'var(--text3)'; tip.innerHTML = `<div class="cal-tooltip-date">${dateLabel}</div><div class="cal-tooltip-row"><span class="k">Net PnL</span><span class="v" style="color:${usd >= 0 ? 'var(--green)' : 'var(--red)'}">${fmtUSD(usd)}</span></div><div class="cal-tooltip-row"><span class="k">Total trades</span><span class="v">${dayData.trades.length}</span></div><div class="cal-tooltip-row"><span class="k">Wins</span><span class="v" style="color:var(--green)">${dayData.wins}</span></div><div class="cal-tooltip-row"><span class="k">Losses</span><span class="v" style="color:var(--red)">${dayData.losses}</span></div>${dayData.bes ? `<div class="cal-tooltip-row"><span class="k">Break evens</span><span class="v" style="color:var(--blue)">${dayData.bes}</span></div>` : ''}<hr class="cal-tooltip-divider"><div class="cal-tooltip-outcome" style="color:${outColor}">${outLabel}</div>`; const x = Math.min(e.clientX + 14, window.innerWidth - 224); const y = Math.min(e.clientY + 14, window.innerHeight - 200); tip.style.left = x + 'px'; tip.style.top = y + 'px'; tip.style.display = 'block'; }
function hideCalTooltip() { const tip = document.getElementById('cal-tooltip'); if (tip) tip.style.display = 'none'; }

function renderCalendar() {
  const accSize = getAccSize(); const accFilter = getCalFilter();
  const label = document.getElementById('cal-month-label');
  if (label) label.textContent = MONTH_NAMES_LONG[calMonth] + ' ' + calYear;
  const ym = calYear + '-' + String(calMonth + 1).padStart(2, '0');
  const monthTrades = trades.filter(t => t.date.startsWith(ym) && (!accFilter || t.account === accFilter));
  const dayMap = groupTradesByDay(monthTrades);
  const { winDays, lossDays, beDays, wr } = calculateCalendarWinrate(dayMap);
  const tradingDays = Object.keys(dayMap);
  const totalTrades = monthTrades.length;
  const totalPnlPct = monthTrades.reduce((a, t) => a + t.pnl, 0);
  const totalUSD = pnlToUSD(totalPnlPct, accSize);
  let bestDay = null, worstDay = null;
  Object.entries(dayMap).forEach(([date, d]) => { if (!bestDay || d.totalPnl > dayMap[bestDay].totalPnl) bestDay = date; if (!worstDay || d.totalPnl < dayMap[worstDay].totalPnl) worstDay = date; });
  const kpiEl = document.getElementById('cal-kpi-row');
  if (kpiEl) {
    const dayName = d => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
    const bestUSD = bestDay ? pnlToUSD(dayMap[bestDay].totalPnl, accSize) : 0;
    const worstUSD = worstDay ? pnlToUSD(dayMap[worstDay].totalPnl, accSize) : 0;
    const wrColor = wr >= 70 ? 'green' : wr >= 50 ? 'white' : 'red';
    kpiEl.innerHTML = `<div class="cal-kpi"><div class="cal-kpi-label">🗂 Trades</div><div class="cal-kpi-val white">${totalTrades}<span style="font-size:10px;color:var(--text3);font-family:var(--font-body);margin-left:5px">${tradingDays.length}d</span></div></div><div class="cal-kpi"><div class="cal-kpi-label">💰 P&L</div><div class="cal-kpi-val ${totalUSD >= 0 ? 'green' : 'red'}">${fmtUSD(totalUSD)}</div></div><div class="cal-kpi"><div class="cal-kpi-label">📈 Best${bestDay ? ' (' + dayName(bestDay) + ')' : ''}</div><div class="cal-kpi-val green">${bestDay ? fmtUSD(bestUSD) : '—'}</div></div><div class="cal-kpi"><div class="cal-kpi-label">📉 Worst${worstDay ? ' (' + dayName(worstDay) + ')' : ''}</div><div class="cal-kpi-val ${worstUSD < 0 ? 'red' : 'green'}">${worstDay ? fmtUSD(worstUSD) : '—'}</div></div><div class="cal-kpi"><div class="cal-kpi-label">🎯 Day Win Rate</div><div class="cal-kpi-val ${wrColor}">${wr}%</div><div style="font-size:9px;color:var(--text3);margin-top:3px;display:flex;gap:5px"><span style="color:var(--green)">▲${winDays}W</span><span style="color:var(--red)">▼${lossDays}L</span><span>⬤${beDays}BE</span></div></div>`;
  }
  const daysEl = document.getElementById('cal-days');
  if (!daysEl) return;
  const firstDay = new Date(calYear, calMonth, 1);
  let startDow = firstDay.getDay() - 1; if (startDow < 0) startDow = 6;
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const daysInPrev = new Date(calYear, calMonth, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);
  let cells = [];
  for (let i = startDow - 1; i >= 0; i--) { const prevMonth = calMonth === 0 ? 12 : calMonth; const prevYear = calMonth === 0 ? calYear - 1 : calYear; cells.push({ day: daysInPrev - i, month: prevMonth, year: prevYear, current: false }); }
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, month: calMonth + 1, year: calYear, current: true });
  let nextD = 1;
  while (cells.length < 42) { const nextMonth = calMonth === 11 ? 1 : calMonth + 2; const nextYear = calMonth === 11 ? calYear + 1 : calYear; cells.push({ day: nextD++, month: nextMonth, year: nextYear, current: false }); }
  daysEl.innerHTML = cells.map(c => {
    const dateStr = c.year + '-' + String(c.month).padStart(2, '0') + '-' + String(c.day).padStart(2, '0');
    const isToday = dateStr === today; const dayData = dayMap[dateStr]; const hasTrades = !!dayData;
    const outcome = hasTrades ? calculateDailyOutcome(dayData.totalPnl) : null;
    let cls = 'cal-day'; if (!c.current) cls += ' other-month'; if (isToday) cls += ' today';
    if (hasTrades) { cls += ' has-trades'; if (outcome === 'win') cls += ' win-day'; else if (outcome === 'loss') cls += ' loss-day'; else cls += ' mixed-day'; }
    const dayNumHTML = isToday ? `<div class="cal-day-num"><span class="cal-today-badge">${c.day}</span></div>` : `<div class="cal-day-num">${String(c.day).padStart(2, '0')}</div>`;
    let dotHTML = '', pnlHTML = '', countHTML = '', pairsHTML = '';
    if (hasTrades) { const dotColor = outcome === 'win' ? 'green' : outcome === 'loss' ? 'red' : 'blue'; dotHTML = `<div class="cal-day-dot ${dotColor}"></div>`; const usd = pnlToUSD(dayData.totalPnl, accSize); pnlHTML = `<div class="cal-day-pnl ${usd > 0 ? 'green' : usd < 0 ? 'red' : 'zero'}">${fmtUSD(usd)}</div>`; countHTML = `<div class="cal-day-count">${dayData.trades.length} trade${dayData.trades.length > 1 ? 's' : ''}</div>`; const pairs = [...new Set(dayData.trades.map(t => t.pair))].join(', '); pairsHTML = `<div class="cal-day-pairs">${pairs}</div>`; }
    let clickAttr = '', hoverAttr = '';
    if (c.current) { if (hasTrades) { clickAttr = `onclick="openCalPopup(event,'${dateStr}')"`;  hoverAttr = `onmouseenter="showCalTooltip(event,window._dayMap&&window._dayMap['${dateStr}'],'${dateStr}',${accSize})" onmouseleave="hideCalTooltip()"`; } else { clickAttr = `onclick="closeCalPopup();openModal({date:'${dateStr}'})"` ; } }
    return `<div class="${cls}" ${clickAttr} ${hoverAttr}>${dotHTML}${dayNumHTML}${pnlHTML}${countHTML}${pairsHTML}</div>`;
  }).join('');
  window._dayMap = dayMap;
}

function openCalPopup(e, dateStr) {
  e.stopPropagation();
  const accFilter = getCalFilter();
  const accSize   = getAccSize();
  const dayTrades = trades.filter(t => t.date === dateStr && (!accFilter || t.account === accFilter));
  if (!dayTrades.length) return;

  const totalPnl = dayTrades.reduce((a, t) => a + t.pnl, 0);
  const totalUSD = pnlToUSD(totalPnl, accSize);
  const wins     = dayTrades.filter(t => t.outcome === 'Win').length;
  const losses   = dayTrades.filter(t => t.outcome === 'Loss').length;
  const outcome  = calculateDailyOutcome(totalPnl);
  const outColor = outcome === 'win' ? 'var(--green)' : outcome === 'loss' ? 'var(--red)' : 'var(--blue)';
  const outLabel = outcome === 'win' ? 'Winning Day ▲' : outcome === 'loss' ? 'Losing Day ▼' : 'Breakeven Day ⬤';
  const dt       = new Date(dateStr + 'T12:00:00');
  const dateLabel = dt.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });

  const tradeRows = dayTrades.map(t => {
    const pnlUSD = pnlToUSD(t.pnl, accSize);
    const pnlC   = t.pnl > 0 ? 'var(--green)' : t.pnl < 0 ? 'var(--red)' : 'var(--blue)';
    const icon   = t.outcome === 'Win' ? '✅' : t.outcome === 'Loss' ? '❌' : '➖';
    return '<div class="cal-popup-trade" onclick="closeCalPopup();openDetail(' + t.id + ')">'
      + '<div style="font-size:16px">' + icon + '</div>'
      + '<div class="cal-popup-pair">' + t.pair + '</div>'
      + '<div class="cal-popup-meta">' + t.pos + ' · ' + t.rr + ' · ' + (t.kz || '—') + '</div>'
      + '<div class="cal-popup-pnl" style="color:' + pnlC + '">' + fmtUSD(pnlUSD) + '</div>'
      + '</div>';
  }).join('');

  const sumColor = totalUSD >= 0 ? 'var(--green)' : 'var(--red)';

  const popup = document.getElementById('cal-popup');
  popup.innerHTML =
    '<div class="cal-popup-head">'
      + '<div>'
        + '<div class="cal-popup-date">' + dateLabel + '</div>'
        + '<div style="font-size:11px;color:' + outColor + ';font-weight:600;margin-top:2px">' + outLabel + '</div>'
      + '</div>'
      + '<div style="display:flex;gap:6px;align-items:center">'
        + '<button onclick="closeCalPopup();openModal({date:\'' + dateStr + '\'})" style="font-size:11px;padding:4px 9px;border-radius:var(--r-sm);background:var(--blue-dim);border:1px solid rgba(96,165,250,.3);color:var(--blue);cursor:pointer">+ Add</button>'
        + '<button class="cal-popup-close" onclick="closeCalPopup()">✕</button>'
      + '</div>'
    + '</div>'
    + tradeRows
    + '<div class="cal-popup-sum">'
      + '<span>' + dayTrades.length + ' trade' + (dayTrades.length > 1 ? 's' : '')
        + ' · <span style="color:var(--green)">' + wins + 'W</span>'
        + ' / <span style="color:var(--red)">' + losses + 'L</span></span>'
      + '<span style="font-family:var(--font-mono);font-weight:700;color:' + sumColor + '">' + fmtUSD(totalUSD) + '</span>'
    + '</div>';

  const x = Math.min(e.clientX + 12, window.innerWidth  - 356);
  const y = Math.min(e.clientY + 12, window.innerHeight - 320);
  popup.style.left    = x + 'px';
  popup.style.top     = y + 'px';
  popup.style.display = 'block';
}
function closeCalPopup() { document.getElementById('cal-popup').style.display = 'none'; }
document.addEventListener('click', e => { const p = document.getElementById('cal-popup'); if (p && !p.contains(e.target)) closeCalPopup(); });

// ── TRASH SYSTEM ──────────────────────────────────────
let trashSettings = { autoDays: 30 };
let _trashFilter = 'all';

function saveTrashSettings() {
  const input = document.getElementById('trash-days');
  const d = parseInt(input ? input.value : 30) || 30;
  trashSettings.autoDays = Math.max(1, d);
  try { localStorage.setItem('nxtgen_trash_cfg', JSON.stringify(trashSettings)); } catch(e) {}
  runAutoCleanup();
  renderTrash();
  showToast('Trash settings saved — ' + trashSettings.autoDays + ' day retention', 'restore');
}

function loadTrashSettings() {
  try {
    const s = localStorage.getItem('nxtgen_trash_cfg');
    if (s) trashSettings = JSON.parse(s);
  } catch(e) {}
}

function daysUntilExpiry(deletedAt) {
  if (!deletedAt) return trashSettings.autoDays;
  const elapsed = (Date.now() - new Date(deletedAt).getTime()) / (24 * 60 * 60 * 1000);
  return Math.max(0, Math.ceil(trashSettings.autoDays - elapsed));
}

async function runAutoCleanup() {
  if (!deletedTrades.length) return;
  const cutoff = Date.now() - (trashSettings.autoDays * 24 * 60 * 60 * 1000);
  const toExpire = deletedTrades.filter(t => t.deletedAt && new Date(t.deletedAt).getTime() < cutoff);
  for (const t of toExpire) {
    await _cloudPermDelete(t.id);
  }
  deletedTrades = deletedTrades.filter(t => !t.deletedAt || new Date(t.deletedAt).getTime() >= cutoff);
}

function setTrashFilter(f) {
  _trashFilter = f;
  ['all', 'today', 'week', 'month'].forEach(id => { const el = document.getElementById('tf-' + id); if (el) el.classList.toggle('active', id === f); });
  renderTrash();
}
function getFilteredTrash() {
  const now = new Date();
  return deletedTrades.filter(t => {
    if (_trashFilter === 'all') return true;
    if (!t.deletedAt) return _trashFilter === 'all';
    const d = new Date(t.deletedAt);
    if (_trashFilter === 'today') return d.toDateString() === now.toDateString();
    if (_trashFilter === 'week') return (now - d) < 7 * 864e5;
    if (_trashFilter === 'month') return (now - d) < 30 * 864e5;
    return true;
  });
}

function updateTrashBadge() {
  const badge = document.getElementById('trash-sb-badge');
  if (badge) { if (deletedTrades.length) { badge.textContent = deletedTrades.length; badge.style.display = ''; } else badge.style.display = 'none'; }
}

function renderTrash() {
  runAutoCleanup();
  updateTrashBadge();
  const list = document.getElementById('trash-list');
  const countEl = document.getElementById('trash-count');
  const emptyBtn = document.getElementById('empty-trash-btn');
  if (!list) return;
  const filtered = getFilteredTrash();
  if (!deletedTrades.length) {
    list.innerHTML = `<div class="trash-empty-state"><div style="font-size:56px;margin-bottom:14px">🗑</div><div style="font-size:16px;font-weight:600;margin-bottom:6px;color:var(--text)">Trash is empty</div><div style="font-size:13px;color:var(--text3);max-width:320px;margin:0 auto;line-height:1.6">Deleted trades appear here for ${trashSettings.autoDays} days. You can restore them anytime.</div></div>`;
    if (countEl) countEl.textContent = '';
    if (emptyBtn) emptyBtn.style.display = 'none';
    return;
  }
  if (countEl) countEl.textContent = (filtered.length !== deletedTrades.length ? filtered.length + ' of ' : '') + deletedTrades.length + ' deleted trade' + (deletedTrades.length !== 1 ? 's' : '');
  if (emptyBtn) emptyBtn.style.display = '';
  if (!filtered.length) { list.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text3)">No deleted trades match this filter.</div>`; return; }
  const today = new Date().toDateString();
  const todayGroup = filtered.filter(t => t.deletedAt && new Date(t.deletedAt).toDateString() === today);
  const earlierGroup = filtered.filter(t => !t.deletedAt || new Date(t.deletedAt).toDateString() !== today);
  function trashCardHTML(t) {
    const pnlC = t.pnl > 0 ? 'outcome-win' : t.pnl < 0 ? 'outcome-loss' : 'outcome-be';
    const outIcon = t.outcome === 'Win' ? '✅' : t.outcome === 'Loss' ? '❌' : '➖';
    const delDate = t.deletedAt ? new Date(t.deletedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown';
    const expDays = daysUntilExpiry(t.deletedAt);
    const expClass = expDays <= 3 ? 'urgent' : expDays <= 7 ? 'warning' : 'ok';
    const expLabel = expDays === 0 ? 'Expires today' : expDays === 1 ? '1 day left' : expDays + ' days left';
    const origId = t.originalId || t.id;
    return `<div class="trash-card" id="tc-${origId}">
      <div style="flex-shrink:0;width:38px;height:38px;border-radius:8px;background:rgba(230,57,70,.1);border:1px solid rgba(230,57,70,.2);display:flex;align-items:center;justify-content:center;font-size:18px">${outIcon}</div>
      <div class="trash-card-info">
        <div class="trash-card-pair">${t.pair} <span class="pill ${t.pos === 'Buy' ? 'pill-green' : 'pill-red'}" style="font-size:10px">${t.pos}</span> <span class="trash-expiry ${expClass}">${expLabel}</span></div>
        <div class="trash-card-meta">${t.date} · ${t.kz || '—'} · ${t.strategy || 'No strategy'} · ${t.account}</div>
        <div class="trash-card-meta" style="color:var(--text3)">Deleted: ${delDate}</div>
      </div>
      <div class="trash-card-pnl ${pnlC}" style="min-width:52px;text-align:right">${t.pnl > 0 ? '+' : ''}${t.pnl}%</div>
      <div class="trash-card-actions">
        <button class="glass-btn glass-btn-restore" style="font-size:11px;padding:5px 12px" onclick="restoreTrade('${origId}')">↩ Restore</button>
        <button class="glass-btn glass-btn-danger" style="font-size:11px;padding:5px 10px" onclick="permanentDelete('${origId}')">✕</button>
      </div>
    </div>`;
  }
  let html2 = '';
  if (todayGroup.length) { html2 += `<div class="trash-section-label">Today</div>`; html2 += todayGroup.map(t => trashCardHTML(t)).join(''); }
  if (earlierGroup.length) { if (todayGroup.length) html2 += `<div class="trash-section-label" style="margin-top:10px">Earlier</div>`; html2 += earlierGroup.map(t => trashCardHTML(t)).join(''); }
  list.innerHTML = html2;
}

async function quickDelete(id) {
  const t = trades.find(x => x.id === id);
  if (!t) return;
  openGlassModal({
    icon: '🗑', title: 'Move to Trash?',
    body: `<div class="glass-modal-trade-pill"><span class="${t.pos === 'Buy' ? 'pos-buy' : 'pos-sell'}">${t.pos}</span><strong>${t.pair}</strong><span style="color:var(--text3)">${t.date}</span><span class="${t.pnl >= 0 ? 'outcome-win' : 'outcome-loss'}">${t.pnl > 0 ? '+' : ''}${t.pnl}%</span></div><div style="font-size:12px;color:var(--text3);margin-top:6px">Trade will be kept in Trash for ${trashSettings.autoDays} days. Restore anytime.</div>`,
    confirmLabel: 'Move to Trash', confirmClass: 'glass-btn-danger',
    onConfirm: async () => {
      const ok = await _cloudSoftDelete(t);
      if (!ok) { showToast('Delete failed', 'danger'); return; }
      deletedTrades.unshift({ ...t, deletedAt: new Date().toISOString(), originalId: t.id });
      trades = trades.filter(x => x.id !== id);
      delete tradeState[id];
      _refreshAll();
      showToast(t.pair + ' moved to Trash', 'danger', { label: 'View Trash', fn: "nav('trash',null,'Trash')" });
    }
  });
}

async function restoreTrade(originalId) {
  const t = deletedTrades.find(x => (x.originalId || x.id) == originalId);
  if (!t) return;
  const restored = await _cloudRestoreTrade(t);
  if (!restored) { showToast('Restore failed', 'danger'); return; }
  deletedTrades = deletedTrades.filter(x => (x.originalId || x.id) != originalId);
  trades.push(restored);
  trades.sort((a, b) => b.date.localeCompare(a.date));
  tradeState[restored.id] = { notes: restored.notes || '', pretrade: restored.pretrade || '', emotion: restored.emotion || 'Calm', checklist: restored.checklist || [], charts: restored.charts || [], chartLabels: restored.chartLabels || [...CHART_LABELS], mistakes: restored.mistakes || '' };
  _refreshAll();
  renderTrash();
  showToast(t.pair + ' restored to Trade Log', 'restore');
}

function permanentDelete(originalId) {
  const t = deletedTrades.find(x => (x.originalId || x.id) == originalId);
  if (!t) return;
  openGlassModal({
    icon: '⚠️', title: 'Permanently Delete?',
    body: `<div class="glass-modal-trade-pill"><strong>${t.pair}</strong><span style="color:var(--text3)">${t.date}</span><span class="${t.pnl >= 0 ? 'outcome-win' : 'outcome-loss'}">${t.pnl > 0 ? '+' : ''}${t.pnl}%</span></div><div style="font-size:12px;color:var(--red);margin-top:8px;font-weight:500">This cannot be undone.</div>`,
    confirmLabel: 'Delete Forever', confirmClass: 'glass-btn-danger',
    onConfirm: async () => {
      await _cloudPermDelete(t.originalId || t.id);
      deletedTrades = deletedTrades.filter(x => (x.originalId || x.id) != originalId);
      delete tradeState[t.id];
      renderTrash();
      showToast(t.pair + ' permanently deleted', 'danger');
    }
  });
}

function openEmptyTrashModal() {
  if (!deletedTrades.length) return;
  openGlassModal({
    icon: '🗑', title: 'Empty Entire Trash?',
    body: `<strong>${deletedTrades.length} trade${deletedTrades.length !== 1 ? 's' : ''}</strong> will be permanently deleted.<br><br><div style="font-size:12px;color:var(--red);font-weight:500">All data will be lost forever. This cannot be undone.</div>`,
    confirmLabel: 'Empty Trash', confirmClass: 'glass-btn-danger',
    onConfirm: async () => {
      const count = deletedTrades.length;
      await _cloudEmptyTrash();
      deletedTrades.forEach(t => delete tradeState[t.id]);
      deletedTrades = [];
      renderTrash();
      showToast(count + ' trades permanently deleted', 'danger');
    }
  });
}

// ── GLASS MODAL & TOAST ───────────────────────────────
let _gmCallback = null;
function openGlassModal({ icon, title, body, confirmLabel, confirmClass, onConfirm, onCancel }) {
  document.getElementById('gm-icon').textContent = icon || '⚠️';
  document.getElementById('gm-title').textContent = title || 'Confirm';
  document.getElementById('gm-body').innerHTML = body || '';
  _gmCallback = onConfirm || null;
  document.getElementById('gm-actions').innerHTML = `<button class="glass-btn glass-btn-cancel" onclick="closeGlassModal()">${onCancel || 'Cancel'}</button><button class="glass-btn ${confirmClass || 'glass-btn-danger'}" onclick="glassConfirm()">${confirmLabel || 'Confirm'}</button>`;
  document.getElementById('glass-modal-overlay').classList.add('open');
}
function closeGlassModal() { document.getElementById('glass-modal-overlay').classList.remove('open'); _gmCallback = null; }
function glassConfirm() { closeGlassModal(); if (_gmCallback) _gmCallback(); }
document.addEventListener('click', e => { const overlay = document.getElementById('glass-modal-overlay'); if (overlay && e.target === overlay) closeGlassModal(); });

function showToast(msg, type = 'info', action = null) {
  const t = document.getElementById('app-toast');
  if (!t) return;
  t.textContent = msg;
  if (action) { const btn = document.createElement('button'); btn.textContent = action.label; btn.style.cssText = 'margin-left:10px;background:none;border:1px solid rgba(255,255,255,.3);color:inherit;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:11px'; btn.onclick = () => { eval(action.fn); t.classList.remove('show'); }; t.appendChild(btn); }
  t.className = 'app-toast show ' + type;
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ── SIGN OUT ──────────────────────────────────────────
async function handleLogout() {
  await sb.auth.signOut();
  window.location.replace('./login.html');
}

// ── REFRESH ALL VIEWS ─────────────────────────────────
function _refreshAll() {
  updateKPIs(); buildPairTable(); refreshPairFilter();
  buildSidebarYears(); renderCalendar(); renderTradeTable(trades); updateTrashBadge();
}

// ── USER BAR (shows logged-in user + sign out button) ──
function _injectUserBar(user) {
  const topbarRight = document.querySelector('.topbar-right');
  if (!topbarRight) return;
  const name = user.user_metadata?.full_name || user.email;
  const bar = document.createElement('div');
  bar.style.cssText = 'display:flex;align-items:center;gap:10px;margin-right:4px';
  bar.innerHTML = `
    <span style="font-size:12px;color:var(--text2);font-family:var(--font-mono)">👤 ${name}</span>
    <button onclick="handleLogout()" style="padding:5px 12px;background:rgba(252,129,129,0.1);border:1px solid rgba(252,129,129,0.25);border-radius:6px;font-family:var(--font-body);font-size:12px;font-weight:600;color:#fc8181;cursor:pointer" onmouseover="this.style.background='rgba(252,129,129,0.2)'" onmouseout="this.style.background='rgba(252,129,129,0.1)'">Sign Out</button>`;
  topbarRight.prepend(bar);
}

// ══════════════════════════════════════════════════════
// BOOT — runs after DOM is ready
// Auth guard + load cloud data + render everything
// ══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function () {

  // 1. Theme first (prevents flash)
  loadTheme();

  // 2. Auth guard — redirect to login if not signed in
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    window.location.replace('./login.html');
    return;
  }
  _currentUser = session.user;

  // 3. Inject user bar + sign out
  _injectUserBar(_currentUser);

  // 4. Also sign out if another tab signs out
  sb.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') window.location.replace('./login.html');
  });

  // 5. Load data from Supabase
  loadTrashSettings();
  await loadTrades();
  await loadDeletedTrades();
  await runAutoCleanup();

  // 6. Render all UI
  updateKPIs();
  buildPairTable();
  buildSidebarYears();
  refreshPairFilter();
  updateTrashBadge();
  buildWatchlist();
  buildEntryForm();
  buildAccounts();
  buildPlaybook();
  buildGoals();
  renderTradeTable(trades);
  renderCalendar();

  // 7. Live clock
  updateClock();
  setInterval(updateClock, 1000);
});
