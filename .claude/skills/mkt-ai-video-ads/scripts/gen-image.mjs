// Start-frame / reference image via Nano Banana Pro (Gemini 3 Pro Image), with optional
// reference images (character passport, logo-free product, previous frame).
//
//   node .claude/skills/mkt-ai-video-ads/scripts/gen-image.mjs --prompt "<text>" --out <file.png>
//        [--ref <img> ...] [--aspect 9:16] [--size 1K|2K|4K] [--model gemini-3-pro-image] [--dry]
//
// Run from the repo root so .env resolves. Needs GEMINI_API_KEY. Roughly $0.13–0.24 per image.
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const all = (k) => args.flatMap((a, i) => (a === k ? [args[i + 1]] : []));
const prompt = opt('--prompt');
const out = opt('--out');
const model = opt('--model', 'gemini-3-pro-image');
if (!prompt || !out) { console.error('usage: --prompt "<text>" --out <file.png> [--ref img ...] [--aspect 9:16] [--size 2K] [--dry]'); process.exit(1); }

try { process.loadEnvFile('.env'); } catch {}
const key = process.env.GEMINI_API_KEY;
if (!key) { console.error('GEMINI_API_KEY missing from .env (needed for Nano Banana Pro).'); process.exit(2); }

const mime = (f) => ({ '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }[path.extname(f).toLowerCase()] || 'image/png');
const parts = [
  ...all('--ref').map((f) => ({ inline_data: { mime_type: mime(f), data: fs.readFileSync(f).toString('base64') } })),
  { text: prompt },
];
const body = {
  contents: [{ parts }],
  generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: opt('--aspect', '9:16'), imageSize: opt('--size', '2K') } },
};
if (args.includes('--dry')) { console.log(JSON.stringify({ model, refs: all('--ref'), out, imageConfig: body.generationConfig.imageConfig, prompt }, null, 2)); process.exit(0); }

const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
  method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body),
});
const j = await r.json();
if (!r.ok) { console.error(`HTTP ${r.status}: ${JSON.stringify(j.error || j).slice(0, 600)}`); process.exit(3); }
const img = j.candidates?.[0]?.content?.parts?.find((p) => p.inlineData || p.inline_data);
if (!img) { console.error('No image returned:', JSON.stringify(j).slice(0, 600)); process.exit(4); }
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
fs.writeFileSync(out, Buffer.from((img.inlineData || img.inline_data).data, 'base64'));
console.log(`saved ${out}`);
