// Supabase Edge Function: market-data-proxy
// Deploy with:  supabase functions deploy market-data-proxy
// Requires one secret:  supabase secrets set TWELVE_DATA_API_KEY=your_key_here
//
// Purpose: the Chart Replay feature in Backtesting Lab needs historical
// OHLC candles. Twelve Data's free tier is CORS-friendly, but calling it
// straight from the browser would (a) expose the API key in client code
// and (b) burn through the 800-calls/day free limit fast if every user's
// browser hit it directly with no shared caching. This function fixes
// both: the key lives only in Supabase secrets, and identical requests
// within a short window are served from `market_data_cache` instead of
// re-hitting Twelve Data.

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TWELVE_DATA_KEY = Deno.env.get("TWELVE_DATA_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// How long a cached response stays fresh, per interval family.
// Intraday intervals change fast during market hours; daily/weekly barely change.
function cacheTtlMs(interval: string): number {
  if (interval === "1day" || interval === "1week") return 12 * 60 * 60 * 1000; // 12h
  if (interval === "4h" || interval === "1h") return 60 * 60 * 1000;           // 1h
  return 15 * 60 * 1000;                                                       // 15min for anything faster
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!TWELVE_DATA_KEY) {
      return new Response(JSON.stringify({ error: "TWELVE_DATA_API_KEY secret is not set" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { symbol, interval, outputsize } = await req.json();
    if (!symbol || !interval) {
      return new Response(JSON.stringify({ error: "symbol and interval are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const size = Math.min(Math.max(parseInt(outputsize) || 500, 10), 5000);
    const cacheKey = `${symbol}|${interval}|${size}`;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check cache first
    const { data: cached } = await supabase
      .from("market_data_cache")
      .select("payload, fetched_at")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    if (cached && (Date.now() - new Date(cached.fetched_at).getTime()) < cacheTtlMs(interval)) {
      return new Response(JSON.stringify({ candles: cached.payload, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch fresh from Twelve Data
    const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&outputsize=${size}&apikey=${TWELVE_DATA_KEY}`;
    const tdResp = await fetch(url);
    const tdJson = await tdResp.json();

    if (tdJson.status === "error" || tdJson.code) {
      return new Response(JSON.stringify({ error: tdJson.message || "Twelve Data request failed" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const values = tdJson.values || [];
    // Twelve Data returns newest-first — flip to chronological order for the replay engine
    const candles = values
      .map((v: any) => ({
        time: new Date(v.datetime.replace(" ", "T")).getTime(),
        open: parseFloat(v.open), high: parseFloat(v.high),
        low: parseFloat(v.low), close: parseFloat(v.close),
      }))
      .filter((c: any) => !isNaN(c.time) && !isNaN(c.close))
      .reverse();

    // Best-effort cache write — don't fail the request if this errors
    await supabase.from("market_data_cache").upsert({
      cache_key: cacheKey, symbol, interval, payload: candles, fetched_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ candles, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
