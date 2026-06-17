// Vercel serverless function — place at:  api/claude.js
// The constructor calls POST /api/claude; this forwards it to the Anthropic
// API with the server-side key. The key never reaches the browser.
//
// Required: in Vercel → Settings → Environment Variables add
//   ANTHROPIC_API_KEY = sk-ant-...
// Runs on Node 18+ (global fetch is available).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: { message: 'Method not allowed' } });
    return;
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    res.status(401).json({
      error: { message: 'ANTHROPIC_API_KEY is not set in Vercel → Settings → Environment Variables' }
    });
    return;
  }

  try {
    // req.body is already parsed by Vercel; fall back to raw if needed.
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body
    });

    const text = await upstream.text();          // pass through verbatim
    res
      .status(upstream.status)
      .setHeader('Content-Type', 'application/json')
      .send(text);
  } catch (e) {
    res.status(500).json({ error: { message: 'Proxy error: ' + (e && e.message || e) } });
  }
}
