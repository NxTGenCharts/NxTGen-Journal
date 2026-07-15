/* ============================================================
   BACKTEST LAB — ORDER UI
   OrderLinesLayer: draws + makes draggable the entry/SL/TP lines
   for every open position and pending order, directly on the
   chart (implements the ChartEngine pluggable-layer interface).
   OrderPanel: buy/sell + quantity + sizing method + SL/TP inputs.
   AccountBar: balance / equity / realized / unrealized readout.
   ============================================================ */

class OrderLinesLayer {
  constructor(chart, account, getCurrentSymbol) {
    this.chart = chart;
    this.account = account;
    this.getCurrentSymbol = getCurrentSymbol;
    this.dragging = null; // {kind:'sl'|'tp'|'entry', id, isPending}
    chart.addLayer(this);
  }

  _lines() {
    const sym = this.getCurrentSymbol();
    const lines = [];
    for (const p of this.account.positions) {
      if (p.symbol !== sym) continue;
      lines.push({ kind: 'entry', id: p.id, isPending: false, price: p.entry, color: '#e2e8f0', dash: [], label: `${p.side.toUpperCase()} ${p.qty.toFixed(0)}` });
      if (p.sl != null) lines.push({ kind: 'sl', id: p.id, isPending: false, price: p.sl, color: '#f87171', dash: [4, 3], label: 'SL' });
      if (p.tp != null) lines.push({ kind: 'tp', id: p.id, isPending: false, price: p.tp, color: '#34d399', dash: [4, 3], label: 'TP' });
    }
    for (const o of this.account.pendingOrders) {
      if (o.symbol !== sym) continue;
      lines.push({ kind: 'entry', id: o.id, isPending: true, price: o.price, color: '#60a5fa', dash: [6, 3], label: `${o.type.toUpperCase()} ${o.side.toUpperCase()}` });
      if (o.sl != null) lines.push({ kind: 'sl', id: o.id, isPending: true, price: o.sl, color: '#f87171', dash: [4, 3], label: 'SL' });
      if (o.tp != null) lines.push({ kind: 'tp', id: o.id, isPending: true, price: o.tp, color: '#34d399', dash: [4, 3], label: 'TP' });
    }
    return lines;
  }

  render(ctx) {
    const plotW = this.chart.canvas.clientWidth - this.chart.opts.priceAxisWidth;
    for (const line of this._lines()) {
      const y = this.chart.priceToY(line.price);
      ctx.strokeStyle = line.color; ctx.setLineDash(line.dash); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(plotW, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = line.color; ctx.font = '10px monospace';
      ctx.fillText(`${line.label}  ${line.price.toFixed(5)}`, 6, y - 4);
    }
  }

  onMouseDown(e) {
    const rect = this.chart.canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const TOL = 6;
    for (const line of this._lines()) {
      const ly = this.chart.priceToY(line.price);
      if (Math.abs(ly - y) < TOL) { this.dragging = line; return true; }
    }
    return false;
  }
  onMouseMove(e, rect) {
    if (!this.dragging) return;
    const y = e.clientY - rect.top;
    const price = this.chart.yToPrice(y);
    const { kind, id, isPending } = this.dragging;
    const patch = { [kind === 'entry' ? 'price' : kind]: price };
    if (isPending) this.account.modifyOrder(id, kind === 'entry' ? { price } : patch);
    else if (kind === 'entry') { /* dragging open-position entry isn't meaningful; ignore */ }
    else this.account.modifyPosition(id, patch);
    this.chart.render();
  }
  onMouseUp() { this.dragging = null; }
}

class OrderPanel {
  constructor(container, account, getPrice) {
    this.account = account;
    this.getPrice = getPrice;
    this.el = document.createElement('div');
    this.el.className = 'bl-order-panel';
    this.el.innerHTML = `
      <select class="bl-o-type">
        <option value="market">Market</option>
        <option value="limit">Limit</option>
        <option value="stop">Stop</option>
      </select>
      <input class="bl-o-price" type="number" step="0.00001" placeholder="Order price" style="display:none">
      <select class="bl-o-sizing">
        <option value="risk_pct">Risk %</option>
        <option value="lots">Lots</option>
        <option value="fixed">Fixed $</option>
        <option value="account_pct">Account %</option>
      </select>
      <input class="bl-o-sizeval" type="number" value="1" step="0.1" style="width:64px">
      <input class="bl-o-sl" type="number" placeholder="SL distance" step="0.00001" style="width:90px">
      <input class="bl-o-tp" type="number" placeholder="TP distance" step="0.00001" style="width:90px">
      <button class="bl-o-buy">Buy</button>
      <button class="bl-o-sell">Sell</button>`;
    container.appendChild(this.el);

    this.typeSel = this.el.querySelector('.bl-o-type');
    this.priceInput = this.el.querySelector('.bl-o-price');
    this.typeSel.onchange = () => { this.priceInput.style.display = this.typeSel.value === 'market' ? 'none' : 'inline-block'; };

    this.el.querySelector('.bl-o-buy').onclick = () => this._submit('long');
    this.el.querySelector('.bl-o-sell').onclick = () => this._submit('short');
  }

  _submit(side) {
    const price = this.getPrice();
    if (price == null) return;
    const type = this.typeSel.value;
    const sizing = this.el.querySelector('.bl-o-sizing').value;
    const sizeVal = +this.el.querySelector('.bl-o-sizeval').value || 0;
    const slDist = +this.el.querySelector('.bl-o-sl').value || 0;
    const tpDist = +this.el.querySelector('.bl-o-tp').value || 0;
    const entryPrice = type === 'market' ? price : (+this.priceInput.value || price);
    const qty = this.account.calcSize(sizing, sizeVal, entryPrice, slDist) || 0;
    if (qty <= 0) { alert('Enter a valid size (risk % needs an SL distance too).'); return; }
    const sl = slDist ? (side === 'long' ? entryPrice - slDist : entryPrice + slDist) : null;
    const tp = tpDist ? (side === 'long' ? entryPrice + tpDist : entryPrice - tpDist) : null;
    const symbol = this._symbol || 'EURUSD';

    if (type === 'market') this.account.placeMarket({ symbol, side, qty, price: entryPrice, sl, tp });
    else this.account.placePending({ symbol, side, type, qty, price: entryPrice, sl, tp });
  }

  setSymbol(sym) { this._symbol = sym; }
}

class AccountBar {
  constructor(container, account, getPrice) {
    this.account = account; this.getPrice = getPrice;
    this.el = document.createElement('div');
    this.el.className = 'bl-account-bar';
    container.appendChild(this.el);
    account.onAccountChange = () => this.render();
    this.render();
  }
  render() {
    const price = this.getPrice();
    const bal = this.account.balance;
    const unreal = this.account.unrealizedPnl(price);
    const equity = this.account.equity(price);
    const fmt = (n) => (n >= 0 ? '+' : '') + n.toFixed(2);
    this.el.innerHTML = `
      <span>Balance <b>$${bal.toFixed(2)}</b></span>
      <span>Equity <b>$${equity.toFixed(2)}</b></span>
      <span class="${unreal >= 0 ? 'pos' : 'neg'}">Unrealized <b>${fmt(unreal)}</b></span>
      <span class="${this.account.realizedPnl() >= 0 ? 'pos' : 'neg'}">Realized <b>${fmt(this.account.realizedPnl())}</b></span>
      <span>Open <b>${this.account.positions.length}</b></span>
      <button class="bl-close-all">Close All</button>`;
    this.el.querySelector('.bl-close-all').onclick = () => { if (price != null) this.account.closeAll(price); };
  }
}

if (typeof module !== 'undefined') module.exports = { OrderLinesLayer, OrderPanel, AccountBar };
