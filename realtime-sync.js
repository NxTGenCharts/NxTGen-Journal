/* ════════════════════════════════════════════════════════════════════════════
   NxTGen Trading Journal — realtime-sync.js
   Supabase Realtime subscriptions for instant cross-device sync.

   HOW TO ADD TO YOUR PROJECT:
   1. Enable Realtime on each table in Supabase Dashboard:
      → Table Editor → (table name) → "Realtime" toggle → ON
      Do this for: journal_trades, journal_deleted_trades, journal_watchlist,
                   journal_account_data, journal_playbook, journal_goals,
                   journal_monthly, journal_profiles
   2. Place this file next to app.js in your repo.
   3. In index.html, add BEFORE <script src="app.js">:
      <script src="realtime-sync.js"></script>

   WHAT IT DOES:
   - Listens to INSERT / UPDATE / DELETE on all 8 Supabase tables.
   - Merges incoming rows into the in-memory arrays (trades, deletedTrades, etc.)
     without touching anything that already matches.
   - Re-renders only the affected UI panels so the page never fully reloads.
   - Shows a tiny toast notification ("Synced ✓") so users know an update arrived.
   - Filters all events to the signed-in user's user_id (RLS still enforces this
     on the server; this is just a belt-and-suspenders client guard).
   ════════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────────────────
  // Internal state
  // ─────────────────────────────────────────────────────────────────────────
  let _realtimeChannel = null;
  let _toastTimer      = null;
  let _pendingRender   = {};   // debounce flags per panel

  // ─────────────────────────────────────────────────────────────────────────
  // Toast notification
  // ─────────────────────────────────────────────────────────────────────────
  function _showSyncToast(msg) {
    let toast = document.getElementById('rt-sync-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'rt-sync-toast';
      toast.style.cssText = [
        'position:fixed', 'bottom:24px', 'right:24px', 'z-index:99999',
        'background:rgba(30,40,55,.92)', 'color:#e2e8f0',
        'border:1px solid rgba(58,134,255,.35)',
        'border-radius:10px', 'padding:9px 18px',
        'font-size:12.5px', 'font-family:inherit',
        'box-shadow:0 4px 24px rgba(0,0,0,.35)',
        'opacity:0', 'transform:translateY(12px)',
        'transition:opacity .25s,transform .25s',
        'pointer-events:none', 'white-space:nowrap',
      ].join(';');
      document.body.appendChild(toast);
    }
    toast.textContent = msg || '⚡ Synced across devices';
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
    }, 2200);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Debounced re-render helpers (prevents flooding renders on bulk changes)
  // ─────────────────────────────────────────────────────────────────────────
  function _scheduleRender(key, fn, delay) {
    delay = delay || 120;
    if (_pendingRender[key]) return;
    _pendingRender[key] = setTimeout(function () {
      delete _pendingRender[key];
      try { fn(); } catch (e) { console.warn('[RT] render error:', e); }
    }, delay);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Map a raw Supabase row → the trade object shape app.js uses
  // (mirrors the mapping inside loadTrades)
  // ─────────────────────────────────────────────────────────────────────────
  function _rowToTrade(row) {
    return {
      id:        row.id,
      date:      row.date,
      pair:      row.pair,
      pos:       row.pos,
      rr:        row.rr,
      pnl:       row.pnl,
      pnlUnit:   row.pnl_unit || '%',
      outcome:   row.outcome,
      kz:        row.kz,
      strategy:  row.strategy,
      tf:        row.tf,
      account:   row.account,
      rating:    row.rating,
      notes:     row.notes,
      pretrade:  row.pretrade,
      emotion:   row.emotion,
      risk:      row.risk,
      checklist: row.checklist  || [],
      charts:    row.charts     || [],
      source:    row.source,
      mt5Ticket: row.mt5_ticket,
      user_id:   row.user_id,
    };
  }

  function _rowToDeletedTrade(row) {
    return {
      id:        row.original_id || row.id,
      date:      row.date,
      pair:      row.pair,
      pos:       row.pos,
      rr:        row.rr,
      pnl:       row.pnl,
      pnlUnit:   row.pnl_unit || '%',
      outcome:   row.outcome,
      kz:        row.kz,
      strategy:  row.strategy,
      tf:        row.tf,
      account:   row.account,
      rating:    row.rating,
      notes:     row.notes,
      pretrade:  row.pretrade,
      emotion:   row.emotion,
      risk:      row.risk,
      checklist: row.checklist  || [],
      charts:    row.charts     || [],
      deletedAt: row.deleted_at,
      user_id:   row.user_id,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers — journal_trades
  // ─────────────────────────────────────────────────────────────────────────
  function _onTradeChange(payload) {
    if (!window.trades) return;
    const uid = window._currentUser && window._currentUser.id;

    if (payload.eventType === 'INSERT') {
      const row = payload.new;
      if (uid && row.user_id !== uid) return;
      if (window.trades.find(function (t) { return t.id === row.id; })) return;
      window.trades.push(_rowToTrade(row));
      _scheduleTradePanels();
      _showSyncToast('⚡ New trade synced');

    } else if (payload.eventType === 'UPDATE') {
      const row = payload.new;
      if (uid && row.user_id !== uid) return;
      const idx = window.trades.findIndex(function (t) { return t.id === row.id; });
      if (idx !== -1) {
        window.trades[idx] = _rowToTrade(row);
      } else {
        window.trades.push(_rowToTrade(row));
      }
      _scheduleTradePanels();
      _showSyncToast('⚡ Trade updated');

    } else if (payload.eventType === 'DELETE') {
      const id = payload.old.id;
      const before = window.trades.length;
      window.trades = window.trades.filter(function (t) { return t.id !== id; });
      if (window.trades.length !== before) {
        _scheduleTradePanels();
        _showSyncToast('⚡ Trade removed');
      }
    }
  }

  function _scheduleTradePanels() {
    _scheduleRender('trades', function () {
      if (typeof renderTradeTable  === 'function') renderTradeTable(window.trades);
      if (typeof updateKPIs        === 'function') updateKPIs();
      if (typeof buildPairTable    === 'function') buildPairTable();
      if (typeof buildKillzoneTable=== 'function') buildKillzoneTable();
      if (typeof buildStrategyTable=== 'function') buildStrategyTable();
      if (typeof buildMonthlyTable === 'function') buildMonthlyTable();
      if (typeof buildSidebarYears === 'function') buildSidebarYears();
      if (typeof renderCalendar    === 'function') renderCalendar();
      if (typeof updateTrashBadge  === 'function') updateTrashBadge();
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers — journal_deleted_trades
  // ─────────────────────────────────────────────────────────────────────────
  function _onDeletedTradeChange(payload) {
    if (!window.deletedTrades) return;
    const uid = window._currentUser && window._currentUser.id;

    if (payload.eventType === 'INSERT') {
      const row = payload.new;
      if (uid && row.user_id !== uid) return;
      const mapped = _rowToDeletedTrade(row);
      if (!window.deletedTrades.find(function (t) { return t.id === mapped.id; })) {
        window.deletedTrades.push(mapped);
      }
      // also remove from live trades if it somehow snuck in
      if (window.trades) {
        window.trades = window.trades.filter(function (t) { return t.id !== mapped.id; });
      }
      _scheduleRender('trash', function () {
        if (typeof renderTrashTab   === 'function') renderTrashTab();
        if (typeof updateTrashBadge === 'function') updateTrashBadge();
        if (typeof renderTradeTable === 'function') renderTradeTable(window.trades);
      });
      _showSyncToast('⚡ Trade trashed');

    } else if (payload.eventType === 'DELETE') {
      // permanently deleted or restored
      const id = payload.old.original_id || payload.old.id;
      window.deletedTrades = window.deletedTrades.filter(function (t) { return t.id !== id; });
      _scheduleRender('trash', function () {
        if (typeof renderTrashTab   === 'function') renderTrashTab();
        if (typeof updateTrashBadge === 'function') updateTrashBadge();
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers — journal_watchlist
  // ─────────────────────────────────────────────────────────────────────────
  function _onWatchlistChange(payload) {
    const uid = window._currentUser && window._currentUser.id;

    // Re-fetch from Supabase (watchlist rows contain complex nested JSON)
    // and re-render. Throttle to avoid hammering on rapid keystrokes from
    // another device (autosave fires on blur).
    _scheduleRender('watchlist', function () {
      if (typeof _wlLoad === 'function') {
        _wlLoad().then(function () {
          if (typeof buildWatchlist === 'function') buildWatchlist();
        });
      }
    }, 400);
    _showSyncToast('⚡ Watchlist synced');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers — journal_account_data
  // ─────────────────────────────────────────────────────────────────────────
  function _onAccountDataChange(payload) {
    _scheduleRender('accounts', function () {
      if (typeof _accLoad === 'function') {
        _accLoad().then(function () {
          if (typeof buildAccounts === 'function') buildAccounts();
          if (typeof renderCalendar=== 'function') renderCalendar();
        });
      }
    }, 300);
    _showSyncToast('⚡ Accounts synced');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers — journal_playbook
  // ─────────────────────────────────────────────────────────────────────────
  function _onPlaybookChange() {
    _scheduleRender('playbook', function () {
      if (typeof _pbLoad === 'function') {
        _pbLoad().then(function () {
          if (typeof buildPlaybook === 'function') buildPlaybook();
        });
      }
    }, 300);
    _showSyncToast('⚡ Playbook synced');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers — journal_goals
  // ─────────────────────────────────────────────────────────────────────────
  function _onGoalsChange() {
    _scheduleRender('goals', function () {
      if (typeof _goalsLoad === 'function') {
        _goalsLoad().then(function () {
          if (typeof buildGoals === 'function') buildGoals();
        });
      }
    }, 300);
    _showSyncToast('⚡ Goals synced');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers — journal_monthly
  // ─────────────────────────────────────────────────────────────────────────
  function _onMonthlyChange() {
    _scheduleRender('monthly', function () {
      if (typeof buildMonthlyReview === 'function') buildMonthlyReview();
    }, 300);
    _showSyncToast('⚡ Monthly review synced');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers — journal_profiles
  // ─────────────────────────────────────────────────────────────────────────
  function _onProfileChange() {
    _scheduleRender('profile', function () {
      if (typeof _profileLoad === 'function') {
        _profileLoad().then(function () {
          if (typeof _injectTopbarAvatar === 'function') _injectTopbarAvatar();
        });
      }
    }, 400);
    _showSyncToast('⚡ Profile synced');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Master subscribe function
  // ─────────────────────────────────────────────────────────────────────────
  function _subscribe() {
    if (_realtimeChannel) return;   // already subscribed

    // sb is the Supabase client created in app.js — it is a global variable
    if (typeof sb === 'undefined') {
      console.warn('[RT] Supabase client (sb) not found. Retrying in 1s…');
      setTimeout(_subscribe, 1000);
      return;
    }

    _realtimeChannel = sb
      .channel('nxtgen-journal-realtime')

      // ── journal_trades ──────────────────────────────────────────────────
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'journal_trades' },
          _onTradeChange)

      // ── journal_deleted_trades ──────────────────────────────────────────
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'journal_deleted_trades' },
          _onDeletedTradeChange)

      // ── journal_watchlist ───────────────────────────────────────────────
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'journal_watchlist' },
          _onWatchlistChange)

      // ── journal_account_data ────────────────────────────────────────────
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'journal_account_data' },
          _onAccountDataChange)

      // ── journal_playbook ────────────────────────────────────────────────
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'journal_playbook' },
          _onPlaybookChange)

      // ── journal_goals ───────────────────────────────────────────────────
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'journal_goals' },
          _onGoalsChange)

      // ── journal_monthly ─────────────────────────────────────────────────
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'journal_monthly' },
          _onMonthlyChange)

      // ── journal_profiles ────────────────────────────────────────────────
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'journal_profiles' },
          _onProfileChange)

      .subscribe(function (status, err) {
        if (status === 'SUBSCRIBED') {
          console.log('[RT] ✅ Realtime sync active across all tables.');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[RT] Realtime subscription error:', err || status, '— reconnecting in 5s…');
          _realtimeChannel = null;
          setTimeout(_subscribe, 5000);
        } else if (status === 'CLOSED') {
          console.log('[RT] Channel closed.');
          _realtimeChannel = null;
        }
      });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Visibility-based reconnect
  // When a tab/device wakes from sleep or comes back to the foreground,
  // Supabase websockets may have dropped. Re-subscribe if needed.
  // ─────────────────────────────────────────────────────────────────────────
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && !_realtimeChannel) {
      console.log('[RT] Tab visible — re-subscribing…');
      _subscribe();
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Boot: wait for DOMContentLoaded so app.js has set up sb and _currentUser
  // ─────────────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    // Give app.js time to authenticate and set _currentUser before we
    // subscribe (auth happens inside DOMContentLoaded in app.js too, so we
    // add a small delay to ensure that block finishes first).
    setTimeout(_subscribe, 1500);
  });

})();
