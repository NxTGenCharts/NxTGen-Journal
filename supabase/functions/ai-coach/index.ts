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
// ─────────────────────────────────────────────────────────────────

// deno-lint-ignore-file no-explicit-any

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

// Any current Gemini model that supports vision (images) works here.
// gemini-flash-latest always points at Google's current recommended
// Flash model, so you don't have to update this when they rev versions.
// Pin an exact version (e.g. "gemini-3.5-flash") instead if you want
// stable, predictable behaviour.
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-flash-latest';

const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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

    const geminiRes = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    });

    const geminiData = await geminiRes.json();

    if (!geminiRes.ok) {
      const msg = geminiData?.error?.message || `Gemini API error ${geminiRes.status}`;
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