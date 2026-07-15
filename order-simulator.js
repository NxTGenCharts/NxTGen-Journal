/* ============================================================
   BACKTEST LAB — TRADING SIMULATOR (account + order engine)
   Pure data/logic, no DOM. Framework-free so it can be unit
   tested or reused by a headless "run my strategy over history"
   feature later. UI lives in order-ui.js.

   PnL model is intentionally simple for Phase 2: pnl = priceDiff
   * qty * direction, where qty is in "units" of the instrument
   (not lots/contracts). That's fine for practising execution and
   RR discipline; swap in real pip-value/contract-size math per
   symbol before this touches real broker accounting.
   ============================================================ */

class TradingAccount {
  constructor(startBalance = 100000) {
    this.startBalance = startBalance;
    this.balance = startBalance;      // realized
    this.positions = [];              // open: {id,symbol,side,qty,entry,sl,tp,trail,openTime}
    this.pendingOrders = [];          // {id,symbol,side,type:'limit'|'stop',qty,price,sl,tp}
    this.closedTrades = [];           // history — feeds the journal sync
    this._nextId = 1;
    this._lastPrice = null;

    this.onPositionOpened = () => {};
    this.onPositionClosed = () => {};
    this.onOrderPlaced = () => {};
    this.onOrderCancelled = () => {};
    this.onAccountChange = () => {};
  }

  // ---------- position sizing ----------
  // method: 'lots' | 'risk_pct' | 'fixed' | 'account_pct'
  // value: the number the user typed for that method
  // slDistance: |entry - sl| in price units (required for risk_pct)
  calcSize(method, value, price, slDistance) {
    switch (method) {
      case 'lots': return value * 100000; // standard lot = 100k units, simplified
      case 'fixed': return value / price; // $ amount -> units at current price
      case 'account_pct': return (this.balance * (value / 100)) / price;
      case 'risk_pct': {
        const riskDollars = this.balance * (value / 100);
        if (!slDistance || slDistance <= 0) return 0;
        return riskDollars / slDistance;
      }
      default: return value;
    }
  }

  // ---------- orders ----------
  placeMarket({ symbol, side, qty, price, sl, tp }) {
    const pos = { id: this._nextId++, symbol, side, qty, entry: price, sl: sl || null, tp: tp || null, trail: null, openTime: Date.now() };
    this.positions.push(pos);
    this.onPositionOpened(pos);
    this.onAccountChange(this);
    return pos;
  }
  placePending({ symbol, side, type, qty, price, sl, tp }) {
    const order = { id: this._nextId++, symbol, side, type, qty, price, sl: sl || null, tp: tp || null };
    this.pendingOrders.push(order);
    this.onOrderPlaced(order);
    return order;
  }
  cancelOrder(id) {
    this.pendingOrders = this.pendingOrders.filter(o => o.id !== id);
    this.onOrderCancelled(id);
  }
  modifyOrder(id, patch) {
    const o = this.pendingOrders.find(x => x.id === id); if (!o) return;
    Object.assign(o, patch);
    this.onAccountChange(this);
  }
  modifyPosition(id, patch) {
    const p = this.positions.find(x => x.id === id); if (!p) return;
    Object.assign(p, patch);
    this.onAccountChange(this);
  }
  setTrailingStop(id, distance) {
    const p = this.positions.find(x => x.id === id); if (!p) return;
    p.trail = distance;
  }
  closePosition(id, price, reason = 'manual', partialQty = null) {
    const idx = this.positions.findIndex(x => x.id === id); if (idx === -1) return;
    const p = this.positions[idx];
    const qtyClosed = partialQty && partialQty < p.qty ? partialQty : p.qty;
    const dir = p.side === 'long' ? 1 : -1;
    const pnl = (price - p.entry) * dir * qtyClosed;
    this.balance += pnl;
    const trade = {
      id: p.id, symbol: p.symbol, side: p.side, qty: qtyClosed, entry: p.entry, exit: price,
      pnl, rr: p.sl ? Math.abs(pnl) / (Math.abs(p.entry - p.sl) * qtyClosed || 1) * (pnl >= 0 ? 1 : -1) : null,
      openTime: p.openTime, closeTime: Date.now(), reason,
    };
    this.closedTrades.push(trade);
    if (qtyClosed >= p.qty) this.positions.splice(idx, 1);
    else p.qty -= qtyClosed;
    this.onPositionClosed(trade);
    this.onAccountChange(this);
    return trade;
  }
  closeAll(price) { [...this.positions].forEach(p => this.closePosition(p.id, price, 'close-all')); }
  reversePosition(id, price) {
    const p = this.positions.find(x => x.id === id); if (!p) return;
    const qty = p.qty, symbol = p.symbol, newSide = p.side === 'long' ? 'short' : 'long';
    this.closePosition(id, price, 'reverse');
    return this.placeMarket({ symbol, side: newSide, qty, price });
  }

  // ---------- simulation step (call once per revealed candle) ----------
  tick(candle) {
    if (!candle) return;
    this._lastPrice = candle.c;

    // 1. pending order triggers (checked against the candle's range)
    for (const o of [...this.pendingOrders]) {
      let triggered = false, fillPrice = o.price;
      if (o.type === 'limit') {
        if (o.side === 'long' && candle.l <= o.price) triggered = true;
        if (o.side === 'short' && candle.h >= o.price) triggered = true;
      } else if (o.type === 'stop') {
        if (o.side === 'long' && candle.h >= o.price) triggered = true;
        if (o.side === 'short' && candle.l <= o.price) triggered = true;
      }
      if (triggered) {
        this.cancelOrder(o.id);
        this.placeMarket({ symbol: o.symbol, side: o.side, qty: o.qty, price: fillPrice, sl: o.sl, tp: o.tp });
      }
    }

    // 2. trailing stop update + SL/TP exit checks
    for (const p of [...this.positions]) {
      if (p.trail) {
        if (p.side === 'long') p.sl = p.sl == null ? candle.c - p.trail : Math.max(p.sl, candle.c - p.trail);
        else p.sl = p.sl == null ? candle.c + p.trail : Math.min(p.sl, candle.c + p.trail);
      }
      if (p.side === 'long') {
        if (p.sl != null && candle.l <= p.sl) { this.closePosition(p.id, p.sl, 'stop-loss'); continue; }
        if (p.tp != null && candle.h >= p.tp) { this.closePosition(p.id, p.tp, 'take-profit'); continue; }
      } else {
        if (p.sl != null && candle.h >= p.sl) { this.closePosition(p.id, p.sl, 'stop-loss'); continue; }
        if (p.tp != null && candle.l <= p.tp) { this.closePosition(p.id, p.tp, 'take-profit'); continue; }
      }
    }
    this.onAccountChange(this);
  }

  unrealizedPnl(price = this._lastPrice) {
    if (price == null) return 0;
    return this.positions.reduce((sum, p) => sum + (price - p.entry) * (p.side === 'long' ? 1 : -1) * p.qty, 0);
  }
  realizedPnl() { return this.balance - this.startBalance; }
  equity(price = this._lastPrice) { return this.balance + this.unrealizedPnl(price); }

  reset(startBalance = this.startBalance) {
    this.startBalance = startBalance; this.balance = startBalance;
    this.positions = []; this.pendingOrders = []; this.closedTrades = []; this._lastPrice = null;
    this.onAccountChange(this);
  }
}

if (typeof module !== 'undefined') module.exports = { TradingAccount };
