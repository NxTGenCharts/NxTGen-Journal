import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, x-mt5-token, x-mt5-account, apikey",
};

function makeAdmin() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SERVICE_ROLE_KEY");
  if (!url) throw new Error("Missing env: SUPABASE_URL");
  if (!key) throw new Error("Missing env: SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  try {
    if (req.method === "POST") return await handlePost(req);
    if (req.method === "GET")  return await handleGet(req);
    return jsonError("Method not allowed", 405);
  } catch (err) {
    console.error("[mt5-sync] CRASH:", String(err));
    return jsonError("Internal server error: " + String(err), 500);
  }
});

// ── POST: EA pushes trades ───────────────────────────────────────────────────
async function handlePost(req: Request): Promise<Response> {
  const allHeaders: Record<string, string> = {};
  req.headers.forEach((val, key) => { allHeaders[key] = val; });
  console.log("[mt5-sync] POST headers:", JSON.stringify(allHeaders));

  const token   = (req.headers.get("x-mt5-token")   || "").trim();
  const account = (req.headers.get("x-mt5-account") || "").trim();

  console.log(`[mt5-sync] token="${token.slice(0,16)}..." account="${account}"`);

  if (!token || token.length < 10) return jsonError("Missing or invalid X-MT5-Token", 401);
  if (!account)                    return jsonError("Missing X-MT5-Account header", 400);

  let trades: unknown[];
  try {
    // MQL5 StringToCharArray adds a null terminator \0 — strip before parsing
    const raw     = await req.text();
    const cleaned = raw.replace(/\0/g, "").trim();
    console.log(`[mt5-sync] body preview: ${cleaned.slice(0, 120)}`);
    const body = JSON.parse(cleaned);
    trades = Array.isArray(body) ? body : [];
    console.log(`[mt5-sync] received ${trades.length} trades`);
  } catch (e) {
    console.error("[mt5-sync] JSON parse error:", String(e));
    return jsonError("Invalid JSON body", 400);
  }

  const admin = makeAdmin();
  const tokenValid = await verifyToken(admin, token, account);
  if (!tokenValid) {
    console.error(`[mt5-sync] token not found: account="${account}"`);
    return jsonError("Unrecognised token or account", 401);
  }

  if (trades.length === 0) return json({ ok: true, inserted: 0 });

  // Sanitise all trades
  const rows = trades
    .map((t) => sanitiseTrade(t, token, account))
    .filter(Boolean) as TradeRow[];

  if (rows.length === 0) return json({ ok: true, inserted: 0, message: "No valid trades" });

  // UPSERT — never deletes, just updates existing or inserts new
  // Trade history is permanent in the buffer until the user clears it
  const { error: upsertErr } = await admin
    .from("mt5_trade_buffer")
    .upsert(rows, { onConflict: "token,ticket" });

  if (upsertErr) {
    console.error("[mt5-sync] upsert error:", upsertErr.message);
    return jsonError("DB write failed", 500);
  }

  console.log(`[mt5-sync] upserted ${rows.length} trades OK`);
  return json({ ok: true, inserted: rows.length });
}

// ── GET: app fetches full trade history ──────────────────────────────────────
async function handleGet(req: Request): Promise<Response> {
  const url     = new URL(req.url);
  const token   = (url.searchParams.get("token")   || "").trim();
  const account = (url.searchParams.get("account") || "").trim();

  if (!token || token.length < 10) return jsonError("Missing or invalid token param", 401);
  if (!account)                    return jsonError("Missing account param", 400);

  // Verify JWT
  const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return jsonError("Missing Authorization header", 401);

  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
  const { data: { user }, error: authErr } = await anonClient.auth.getUser(jwt);
  if (authErr || !user) return jsonError("Invalid or expired session", 401);

  const admin = makeAdmin();

  // Confirm ownership
  const owns = await verifyTokenOwnership(admin, token, account, user.id);
  if (!owns) return jsonError("Token does not belong to your account", 403);

  // Fetch ALL trades for this token — ordered by close time descending (newest first)
  // NEVER deleted — full history always available
  const { data: rows, error: fetchErr } = await admin
    .from("mt5_trade_buffer")
    .select("*")
    .eq("token", token)
    .order("close_time", { ascending: false })
    .limit(500);

  if (fetchErr) {
    console.error("[mt5-sync] fetch error:", fetchErr.message);
    return jsonError("DB read failed", 500);
  }

  console.log(`[mt5-sync] GET returning ${rows?.length ?? 0} trades for account="${account}"`);
  return json({ ok: true, trades: (rows ?? []).map(rowToTrade), account });
}

// ── Token verification ───────────────────────────────────────────────────────
interface AccountObj {
  name?: string;
  mt5?:  { webhookToken?: string; enabled?: boolean };
}

function normaliseName(s: string): string {
  return s.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

async function verifyToken(
  admin: ReturnType<typeof createClient>,
  token: string,
  account: string,
): Promise<boolean> {
  const { data, error } = await admin.from("journal_account_data").select("accounts");
  if (error) { console.error("[mt5-sync] verifyToken DB error:", error.message); return false; }
  if (!data?.length) return false;
  const normAccount = normaliseName(account);
  return data.some((row) => {
    const accounts: AccountObj[] = row.accounts ?? [];
    return accounts.some((a) => {
      if (a?.mt5?.webhookToken !== token) return false;
      return a?.name === account || normaliseName(a?.name ?? "") === normAccount;
    });
  });
}

async function verifyTokenOwnership(
  admin: ReturnType<typeof createClient>,
  token: string,
  account: string,
  userId: string,
): Promise<boolean> {
  const { data, error } = await admin
    .from("journal_account_data").select("accounts").eq("user_id", userId).single();
  if (error || !data) return false;
  const accounts: AccountObj[] = data.accounts ?? [];
  const norm = normaliseName(account);
  return accounts.some((a) =>
    a?.mt5?.webhookToken === token &&
    (a?.name === account || normaliseName(a?.name ?? "") === norm)
  );
}

// ── Trade sanitisation ───────────────────────────────────────────────────────
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

    if (!ticket)                             return null;
    if (!symbol || symbol.length < 2)        return null;
    if (!["buy", "sell"].includes(tradeType)) return null;
    if (lots <= 0)                           return null;

    return {
      token, account, ticket, symbol,
      trade_type: tradeType, lots,
      open_price: openPrice, close_price: closePrice,
      open_time: openTime, close_time: closeTime,
      profit, swap, commission,
    };
  } catch { return null; }
}

// deno-lint-ignore no-explicit-any
function rowToTrade(row: any) {
  return {
    ticket:     row.ticket,
    symbol:     row.symbol,
    type:       row.trade_type,
    lots:       row.lots,
    openPrice:  row.open_price,
    closePrice: row.close_price,
    openTime:   row.open_time,
    closeTime:  row.close_time,
    profit:     row.profit,
    swap:       row.swap,
    commission: row.commission,
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
