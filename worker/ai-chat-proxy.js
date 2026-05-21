// Cloudflare Worker — AI Chat with RAG (Groq)
// Deploy: wrangler deploy
// Secrets: wrangler secret put GROQ_API_KEY

const SYSTEM_PROMPT = `You are Sam, a digital clone of Samir Paudel. You ONLY know what's written in the Context below from Samir's actual website. If the Context doesn't have the exact answer, say "I don't have that information" — do NOT make up anything, do NOT elaborate, do NOT use your training data.

CRITICAL RULES:
- Quote or closely paraphrase the Context. Never add details not in it.
- Speak in first person ("I", "my", "me") as if you ARE Samir.
- Keep it short and natural like a real person texting.
- Use **bold** and links like [page](/url) when referencing things.
- Samir's site is samirpaudel.me — reference it naturally.

If the Context is empty, say "I don't have that information" immediately — don't guess.`;

const RAG_DATA_URL = 'https://samirpaudel.me/rag-data.json';
const EMBED_MODEL = '@cf/baai/bge-small-en-v1.5';
const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// ── In-memory RAG cache ──
let ragChunks = null;
let ragEmbeddings = null;
let ragReady = false;
let loading = false;
let lastAttempt = 0;

async function loadRag(env) {
  if (ragReady || loading) return;
  if (Date.now() - lastAttempt < 30_000) return;
  lastAttempt = Date.now();
  loading = true;

  try {
    const res = await fetch(RAG_DATA_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const chunks = await res.json();
    if (!chunks.length) throw new Error('empty RAG data');

    const texts = chunks.map(c => `${c.title}: ${c.text}`.slice(0, 2000));
    const result = await env.AI.run(EMBED_MODEL, { text: texts });
    const embeddings = result.data.map(d => d.embedding);

    ragChunks = chunks;
    ragEmbeddings = embeddings;
    ragReady = true;
    console.log(`RAG loaded: ${chunks.length} chunks`);
  } catch (err) {
    console.error('RAG load failed:', err);
  } finally {
    loading = false;
  }
}

function cosineSimilarity(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

function topK(queryEmbedding, k) {
  const scored = ragEmbeddings.map((emb, i) => ({ i, score: cosineSimilarity(queryEmbedding, emb) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k).map(s => ragChunks[s.i]);
}

// ── Request handler ──
export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

    try {
      const body = await request.json();
      const messages = body.messages;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return new Response(JSON.stringify({ error: 'messages array is required' }), {
          status: 400, headers: cors,
        });
      }

      if (!ragReady) ctx.waitUntil(loadRag(env));

      const apiKey = env.GROQ_API_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'API key not configured' }), {
          status: 500, headers: cors,
        });
      }

      // ── Retrieve relevant context ──
      let contextText = '';
      const userMsg = messages.filter(m => m.role === 'user').pop();

      if (ragReady && ragChunks.length > 0 && userMsg) {
        try {
          const qResult = await env.AI.run(EMBED_MODEL, { text: [userMsg.text] });
          const qEmb = qResult.data[0].embedding;
          const relevant = topK(qEmb, 8);

          contextText = relevant
            .map(c => `[${c.title}](${c.url}): ${c.text}`)
            .join('\n\n');
        } catch (_) {}
      }

      // ── Build OpenAI-style messages ──
      const groqMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
      ];

      for (const m of messages) {
        groqMessages.push({ role: m.role === 'model' ? 'assistant' : m.role, content: m.text });
      }

      // Inject context into last user message
      if (contextText) {
        for (let i = groqMessages.length - 1; i >= 0; i--) {
          if (groqMessages[i].role === 'user') {
            groqMessages[i].content = `Context from Samir's website:\n${contextText}\n\nUser question: ${groqMessages[i].content}`;
            break;
          }
        }
      }

      const res = await fetch(GROQ_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: groqMessages,
          temperature: 0.15,
          max_tokens: 600,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        return new Response(JSON.stringify({ error: 'Groq API error', details: err }), {
          status: res.status, headers: cors,
        });
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

      return new Response(JSON.stringify({ response: reply }), { headers: cors });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Internal error', details: err.message }), {
        status: 500, headers: cors,
      });
    }
  },
};
