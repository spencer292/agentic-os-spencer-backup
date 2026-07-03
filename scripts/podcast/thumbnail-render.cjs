/**
 * Render a YouTube thumbnail via Gemini 3 Pro Image (Nano Banana Pro), composing
 * a provided cut-out person photo onto the new "Duo / Big Emotion" treatment.
 * Usage: node scripts/podcast/thumbnail-render.cjs <hostImg> <hookText> <outPng> [guestImg]
 */
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('C:/Claude/agent-os-v3/agentic-os/.env', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const KEY = env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
const [hostImg, hook, outPng, guestImg] = process.argv.slice(2);
if (!KEY) { console.log('No GEMINI_API_KEY in .env'); process.exit(1); }
if (!hostImg || !hook || !outPng) { console.log('usage: thumbnail-render.cjs <hostImg> <hookText> <outPng> [guestImg]'); process.exit(1); }

const b64 = p => fs.readFileSync(p).toString('base64');
const mimeOf = p => p.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

const duo = guestImg
  ? `Place the FIRST person (Image 1, the host) large on the LEFT and the SECOND person (Image 2, the guest) large on the RIGHT, both from the chest up, faces clearly visible and identifiable. PRESERVE EACH PERSON'S REAL FACE AND LIKENESS EXACTLY — do not alter, beautify, or invent features. Slightly turn them toward each other (a conversation).`
  : `Place the person (Image 1, the host) large on the LEFT, from the chest up, confident and engaged. PRESERVE HIS REAL FACE AND LIKENESS EXACTLY — do not alter or invent features. Leave the RIGHT side for the bold text.`;

const prompt = `Create a high-CTR YouTube PODCAST thumbnail, 1280x720 pixels, 16:9 landscape.
${duo}
BACKGROUND: deep near-black charcoal (hex #25282B, the brand "Night Sky") with a subtle radial spotlight and faint texture. High contrast so faces pop. Add a thin bright accent edge-light around the people to separate them from the background.
HOOK TEXT: "${hook}" in the lower-center/third — heavy bold condensed sans-serif, ALL CAPS, very large, bright punchy lime-green (hex #C8F02E) with a thick solid black outline/stroke and a soft shadow. Must be instantly legible shrunk to a tiny mobile thumbnail. Keep it to these words only.
BRAND MARK: small "POWER MOVERS" wordmark in clean white in the TOP-LEFT corner.
RULES: maximum 3 visual elements, one-second read, no clutter, no episode numbers, no logos other than the wordmark, no watermarks. Keep the BOTTOM-RIGHT corner clear (YouTube duration stamp). Photographic, premium, punchy. Output exactly 1280x720.`;

const parts = [{ text: prompt }, { inline_data: { mime_type: mimeOf(hostImg), data: b64(hostImg) } }];
if (guestImg) parts.push({ inline_data: { mime_type: mimeOf(guestImg), data: b64(guestImg) } });

(async () => {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ['Text', 'Image'] } }),
  });
  const j = await r.json();
  if (!r.ok) { console.log('FAILED', r.status, JSON.stringify(j).slice(0, 500)); return; }
  let img = null;
  for (const p of j.candidates?.[0]?.content?.parts || []) { if (p.inlineData?.data || p.inline_data?.data) { img = p.inlineData?.data || p.inline_data?.data; break; } }
  if (!img) { console.log('No image in response:', JSON.stringify(j).slice(0, 500)); return; }
  fs.writeFileSync(outPng, Buffer.from(img, 'base64'));
  console.log('Saved', outPng, '(' + Math.round(fs.statSync(outPng).size / 1024) + ' KB)');
})().catch(e => console.log('Error:', e.message));
