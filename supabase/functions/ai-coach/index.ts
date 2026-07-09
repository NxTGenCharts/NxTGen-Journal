// supabase/functions/ai-coach/index.ts
//
// NxTGen AI Coach — Gemini backend
// ─────────────────────────────────────────────────────────────────
// Drop-in replacement for the old Anthropic-powered function.
// The frontend (app.js) is UNCHANGED — it still POSTs:
//   { system: "...", messages: [{ role, content }, ...] }
// and still reads back:
//   { content: [{ type: "text", text: "..." }] }
//
// Internally this function now talks to Google's Gemini API
// (generativelanguage.googleapis.com) instead of Anthropic, and
// translates between the two formats so nothing else has to change.
//
// UPDATE: Added automatic retry with exponential backoff when Gemini
// returns 503 ("model overloaded / high demand"). This is a transient
// error on Google's side, not a bug in this function — retrying a
// couple of times with a short delay usually succeeds.
// ─────────────────────────────────────────────────────────────────

// deno-lint-ignore-file no-explicit-any

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

// Any current Gemini model that supports vision (images) works here.
// gemini-flash-latest always points at Google's current recommended
// Flash model, so you don't have to update this when they rev versions.
// Pin an exact version (e.g. "gemini-2.5-flash") instead if you want
// stable, predictable behaviour and to avoid congestion on the alias.
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-flash-latest';

const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Retry configuration for transient Gemini errors (503 = overloaded,
// 429 = rate limited). Exponential backoff: 500ms, 1s, 2s.
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;
const RETRYABLE_STATUS_CODES = new Set([429, 503]);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (!GEMINI_API_KEY) {
    return json(
      { error: 'GEMINI_API_KEY is not set. Run: supabase secrets set GEMINI_API_KEY=your_key' },
      500,
    );
  }

  try {
    const { system, messages } = await req.json();

    if (!Array.isArray(messages) || !messages.length) {
      return json({ error: 'messages array is required' }, 400);
    }

    const contents = messages.map(anthropicMessageToGemini);

    const geminiBody: Record<string, any> = {
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    };

    if (system) {
      geminiBody.systemInstruction = { parts: [{ text: system }] };
    }

    const geminiRes = await callGeminiWithRetry(geminiBody);
    const geminiData = await geminiRes.json();

    if (!geminiRes.ok) {
      const msg = geminiData?.error?.message || `Gemini API error ${geminiRes.status}`;

      // Give the frontend a clearer signal for transient overload errors
      // so it can show a friendlier message instead of the raw Gemini text.
      if (RETRYABLE_STATUS_CODES.has(geminiRes.status)) {
        return json(
          {
            error: 'AI Coach is experiencing high demand right now. Please try again in a few seconds.',
            transient: true,
            rawError: msg,
          },
          geminiRes.status,
        );
      }

      return json({ error: msg }, geminiRes.status);
    }

    const candidate = geminiData?.candidates?.[0];

    // Handle safety blocks / empty responses gracefully
    if (!candidate) {
      const blockReason = geminiData?.promptFeedback?.blockReason;
      return json(
        {
          content: [
            {
              type: 'text',
              text: blockReason
                ? `⚠ Response blocked by Gemini safety filters (${blockReason}). Try rephrasing.`
                : '⚠ No response generated. Try again.',
            },
          ],
        },
      );
    }

    const text = (candidate.content?.parts || [])
      .map((p: any) => p.text || '')
      .join('');

    // Return in the same shape the old Anthropic proxy returned,
    // so app.js's `data.content.filter(b => b.type === 'text')...` keeps working.
    return json({ content: [{ type: 'text', text }] });
  } catch (err) {
    return json({ error: (err as Error).message || 'Unknown server error' }, 500);
  }
});

/**
 * Calls the Gemini API, automatically retrying with exponential backoff
 * if Gemini responds with a transient error (503 overloaded, 429 rate
 * limited). Returns the final Response object (success or failure) —
 * the caller reads geminiRes.ok / geminiRes.status as normal.
 */
async function callGeminiWithRetry(body: Record<string, any>): Promise<Response> {
  let lastRes: Response | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok || !RETRYABLE_STATUS_CODES.has(res.status)) {
      return res;
    }

    lastRes = res;

    if (attempt < MAX_RETRIES) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt); // 500ms, 1s, 2s
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Exhausted all retries — return the last (failing) response so the
  // caller can surface Gemini's error message to the client.
  return lastRes as Response;
}

/**
 * Convert one Anthropic-style message ({role, content}) into a
 * Gemini "content" object ({role, parts}).
 *
 * Anthropic content is either:
 *   - a plain string, or
 *   - an array of blocks: { type: 'text', text } | { type: 'image', source: { type:'base64', media_type, data } }
 *
 * Gemini parts are:
 *   - { text } | { inlineData: { mimeType, data } }
 */
function anthropicMessageToGemini(msg: { role: string; content: any }) {
  const role = msg.role === 'assistant' ? 'model' : 'user';

  if (typeof msg.content === 'string') {
    return { role, parts: [{ text: msg.content }] };
  }

  const parts = (msg.content || []).map((block: any) => {
    if (block.type === 'image') {
      return {
        inlineData: {
          mimeType: block.source?.media_type || 'image/jpeg',
          data: block.source?.data || '',
        },
      };
    }
    // default: text block
    return { text: block.text || '' };
  });

  return { role, parts };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}