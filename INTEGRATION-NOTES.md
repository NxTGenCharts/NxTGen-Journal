# Backtest Lab — Phase 1 + 2 (chart engine, drawing tools, order simulator)

## What's in here
- **chart-engine.js** — canvas candlestick renderer: pan, zoom, crosshair, price/time axes, auto price-scaling, replay cursor, and a pluggable-layer system (`chart.addLayer(...)`) that drawing tools and order lines both hook into. Includes `generateCandles()`, a synthetic OHLC generator standing in for real historical data.
- **drawing-tools.js** — the drawing-object system: trend line, ray, extended line, horizontal/vertical line, rectangle, fib retracement/extension, text, long/short position tool (now with a live-draggable stop-loss handle and RR readout), measure tool. Handles select, drag-to-move, drag-endpoint-to-resize, delete, magnet snap-to-OHLC.
- **order-simulator.js** — `TradingAccount`: virtual balance, market/limit/stop orders, SL/TP, trailing stop, partial close, reverse, close-all, position sizing (lots / risk % / fixed $ / account %), and `tick(candle)` which triggers pending orders and SL/TP against each newly-revealed replay candle. Framework-free — usable headless later for "run my strategy over history" style features.
- **order-ui.js** — `OrderLinesLayer` (draggable entry/SL/TP lines directly on the chart, for both open positions and pending orders), `OrderPanel` (buy/sell, order type, sizing method, SL/TP distance inputs), `AccountBar` (balance/equity/realized/unrealized/close-all).
- **backtest-ui.js** — left drawing toolbar, symbol search (type-to-filter, not a dropdown), timeframe selector, replay transport bar (play/pause/step/speed/slider/clock) — now wired to call `account.tick()` on every revealed candle, which is what connects replay to trading.
- **backtest-lab.css** — styling that reuses your existing theme variables (`--bg2`, `--glass-2`, `--blue`, `--text`, etc.) with fallbacks.
- **demo.html** — standalone page wiring all of the above together, buy/sell buttons and all.

## How to try it
Open `demo.html` in a browser. Drag to pan, scroll to zoom, pick a drawing tool from the left rail. Hit play on the replay bar, then place a market/limit/stop order from the top-right panel — as replay advances, pending orders and SL/TP will trigger automatically against the newly revealed candles, and the bottom bar tracks balance/equity/PnL live. Try the long/short position tool on the chart itself for a visual RR box (drag its third handle to adjust the stop).

## How this plugs into your existing app
1. Add all seven files above alongside `app.js`/`styles.css`.
2. Inside `page-backtesting`, add the container structure from `demo.html`'s `<body>`, then run the same wiring script scoped to it.
3. Replace `generateCandles()` with a real fetch returning `{t,o,h,l,c,v}[]` from your Supabase historical-data table — nothing else needs to change.
4. Journal sync: `account.onPositionClosed` already fires with a fully-formed trade object (symbol, side, qty, entry, exit, pnl, rr, open/close time, reason) — wire that callback to insert into your trades table the same way your manual simulator already does.

## Simplifications to know about (documented in code comments too)
- PnL math is `priceDiff * qty` in raw price units, not real pip-value/contract-size accounting per instrument — fine for practising execution/RR discipline, not for exact broker-matching P&L. Worth revisiting before this feeds real performance stats.
- SL/TP/pending-order triggers are checked once per revealed candle using that candle's high/low — not full tick-by-tick intrabar sequencing, so if a candle's high and low both cross different levels in the same bar, the order of events is approximated rather than exact.

## Deliberately not done yet (Phase 3+)
- Layout save/restore (persist drawings + symbol + timeframe + replay position + open positions to Supabase, so a session resumes exactly where you left off)
- Indicators (EMA/SMA/VWAP/RSI/MACD/etc.)
- Object right-click context menu (copy/paste/duplicate/lock/hide/layer order), object tree panel
- Actually wiring `onPositionClosed` into your trades table (currently just logs to console as a stub)
- Chart settings dialog (candle colors, grid, session separators, log/percentage scale toggle)

Want layout persistence next, or indicators, or should I go ahead and wire the journal sync for real (I'd need to see how your manual trade simulator currently inserts into Supabase to match the shape)?

## On the TradingView Charting Library
If your application gets approved later, the swap-in point is `chart-engine.js`'s public surface (`setData`, `setReplayCursor`, coordinate helpers, `addLayer`) — drawing tools, order lines, replay, and symbol search are all written against that surface, not against canvas internals, so this surrounding UI shouldn't need a rewrite even if the renderer underneath changes.

