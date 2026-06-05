import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": [
    "authorization", "content-type",
    "x-mt5-token", "x-mt5-account", "apikey",
  ].join(", "),
};

function makeAdmin() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SERVICE_ROLE_KEY");
  if (!url) throw new Error("Missing env: SUPABASE_URL");
  if (!key) throw new Error("Missing env: SERVICE_ROLE_KEY");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  try {
    if (req.method === "POST") return await handlePost(req);
    if (req.method === "GET")  return await handleGet(req);
    return jsonError("Method not allowed", 405);
  } catch (err) {
    console.error("[mt5-sync] CRASH:", String(err));
    return jsonError("Internal server error: " + String(err), 500);
  }
});

async function handlePost(req: Request): Promise<Response> {
  // Log ALL headers so we can see exactly what MT5 sends
  const allHeaders: Record<string, string> = {};
  req.headers.forEach((val, key) => { allHeaders[key] = val; });
  console.log("[mt5-sync] POST headers:", JSON.stringify(allHeaders));

  const token   = (req.headers.get("x-mt5-token")   || "").trim();
  const account = (req.headers.get("x-mt5-account") || "").trim();

  console.log(`[mt5-sync] token="${token}" account="${account}"`);
  console.log(`[mt5-sync] token length=${token.length} account length=${account.length}`);

  if (!token || token.length < 10) return jsonError("Missing or invalid X-MT5-Token", 401);
  if (!account) return jsonError("Missing X-MT5-Account header", 400);

  let trades: unknown[];
  try {
    // MQL5 StringToCharArray adds a null terminator \0 — strip it before parsing
    const raw = await req.text();
    const cleaned = raw.replace(/\0/g, "").trim();
    console.log(`[mt5-sync] raw body (first 120 chars): ${cleaned.slice(0, 120)}`);
    const body = JSON.parse(cleaned);
    trades = Array.isArray(body) ? body : [];
    console.log(`[mt5-sync] received ${trades.length} trades`);
  } catch (e) {
    console.error("[mt5-sync] JSON parse error:", String(e));
    return jsonError("Invalid JSON body", 400);
  }

  const admin = makeAdmin();

  // Fetch ALL accounts and log them so we can compare
  const { data, error } = await admin
    .from("journal_account_data")
    .select("accounts");

  if (error) {
    console.error("[mt5-sync] DB error:", error.message);
    return jsonError("DB read failed", 500);
  }

  console.log(`[mt5-sync] DB rows found: ${data?.length ?? 0}`);

  // Log every account and its token for comparison
  let tokenMatch = false;
  let accountMatch = false;
  let bothMatch = false;

  for (const row of (data ?? [])) {
    const accounts = row.accounts ?? [];
    for (const a of accounts) {
      const storedToken   = a?.mt5?.webhookToken ?? "(none)";
      const storedName    = a?.name ?? "(none)";
      const tMatch = storedToken === token;
      const aMatch = storedName  === account;
      console.log(`[mt5-sync] account="${storedName}" tokenMatch=${tMatch} nameMatch=${aMatch}`);
      console.log(`[mt5-sync]   stored token="${storedToken.slice(0,16)}..." received="${token.slice(0,16)}..."`);
      console.log(`[mt5-sync]   stored name bytes=${[...storedName].map(c=>c.charCodeAt(0)).join(",")} received bytes=${[...account].map(c=>c.charCodeAt(0)).join(",")}`);
      if (tMatch) tokenMatch = true;
      if (aMatch) accountMatch = true;
      if (tMatch && aMatch) bothMatch = true;
    }
  }

  console.log(`[mt5-sync] result: tokenMatch=${tokenMatch} accountMatch=${accountMatch} bothMatch=${bothMatch}`);

  if (!bothMatch) {
    return jsonError(`Token/account mismatch. tokenFound=${tokenMatch} accountFound=${accountMatch}`, 400);
  }

  // Sanitise and insert
  if (trades.length === 0) return json({ ok: true, inserted: 0 });

  const rows = trades.map((t) => sanitiseTrade(t, token, account)).filter(Boolean) as TradeRow[];
  if (rows.length === 0) return json({ ok: true, inserted: 0, message: "All records failed validation" });

  const { error: upsertErr } = await admin
    .from("mt5_trade_buffer")
    .upsert(rows, { onConflict: "token,ticket" });

  if (upsertErr) {
    console.error("[mt5-sync] upsert error:", upsertErr.message);
    return jsonError("DB write failed", 500);
  }

  return json({ ok: true, inserted: rows.length });
}

async function handleGet(req: Request): Promise<Response> {
  const url     = new URL(req.url);
  const token   = (url.searchParams.get("token")   || "").trim();
  const account = (url.searchParams.get("account") || "").trim();

  if (!token || token.length < 10) return jsonError("Missing or invalid token param", 401);
  if (!account) return jsonError("Missing account param", 400);

  const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return jsonError("Missing Authorization header", 401);

  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
  const { data: { user }, error: authErr } = await anonClient.auth.getUser(jwt);
  if (authErr || !user) return jsonError("Invalid or expired session", 401);

  const admin = makeAdmin();

  const { data: accData } = await admin
    .from("journal_account_data")
    .select("accounts")
    .eq("user_id", user.id)
    .single();

  const accounts = accData?.accounts ?? [];
  const owns = accounts.some(
    (a: AccountObj) => a?.name === account && a?.mt5?.webhookToken === token,
  );
  if (!owns) return jsonError("Token does not belong to your account", 403);

  const { data: rows, error: fetchErr } = await admin
    .from("mt5_trade_buffer")
    .select("*")
    .eq("token", token)
    .order("close_time", { ascending: true });

  if (fetchErr) return jsonError("DB read failed", 500);

  const trades = (rows ?? []).map(rowToTrade);

  if (trades.length > 0) {
    const ids = (rows ?? []).map((r) => r.id);
    await admin.from("mt5_trade_buffer").delete().in("id", ids);
  }

  return json({ ok: true, trades, account });
}

interface AccountObj {
  name?: string;
  mt5?:  { webhookToken?: string; enabled?: boolean };
}

interface TradeRow {
  token: string; account: string; ticket: string; symbol: string;
  trade_type: string; lots: number; open_price: number; close_price: number;
  open_time: number; close_time: number; profit: number; swap: number; commission: number;
}

// deno-lint-ignore no-explicit-any
function sanitiseTrade(t: any, token: string, account: string): TradeRow | null {
  try {
    const ticket     = String(t.ticket ?? "").trim();
    const symbol     = String(t.symbol ?? "").trim().toUpperCase().slice(0, 20);
    const tradeType  = String(t.type   ?? "").trim().toLowerCase();
    const lots       = clampNum(t.lots,        0,   1000);
    const openPrice  = clampNum(t.openPrice,   0,   1_000_000);
    const closePrice = clampNum(t.closePrice,  0,   1_000_000);
    const openTime   = clampInt(t.openTime,    0,   9_999_999_999);
    const closeTime  = clampInt(t.closeTime,   0,   9_999_999_999);
    const profit     = clampNum(t.profit,     -1e7, 1e7);
    const swap       = clampNum(t.swap,       -1e6, 1e6);
    const commission = clampNum(t.commission, -1e6, 0);

    if (!ticket)                            return null;
    if (!symbol || symbol.length < 2)       return null;
    if (!["buy","sell"].includes(tradeType)) return null;
    if (lots <= 0)                          return null;

    return {
      token, account, ticket, symbol,
      trade_type: tradeType, lots,
      open_price: openPrice, close_price: closePrice,
      open_time: openTime, close_time: closeTime,
      profit, swap, commission,
    };
  } catch {
    return null;
  }
}

// deno-lint-ignore no-explicit-any
function rowToTrade(row: any) {
  return {
    ticket: row.ticket, symbol: row.symbol, type: row.trade_type,
    lots: row.lots, openPrice: row.open_price, closePrice: row.close_price,
    openTime: row.open_time, closeTime: row.close_time,
    profit: row.profit, swap: row.swap, commission: row.commission,
  };
}

// deno-lint-ignore no-explicit-any
function clampNum(v: any, min: number, max: number): number {
  const n = parseFloat(v);
  return isFinite(n) ? Math.min(max, Math.max(min, n)) : 0;
}

// deno-lint-ignore no-explicit-any
function clampInt(v: any, min: number, max: number): number {
  return Math.round(clampNum(v, min, max));
}

// deno-lint-ignore no-explicit-any
function json(body: any, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function jsonError(message: string, status: number): Response {
  return json({ ok: false, error: message }, status);
}
