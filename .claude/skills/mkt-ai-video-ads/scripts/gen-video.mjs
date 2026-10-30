// One AI video clip via Google Veo 3.1 (Gemini API), image-to-video from a start frame
// (recommended) or text-only. Veo generates native audio; set --no-dialogue-style prompts
// yourself if you plan to lay ElevenLabs VO over it.
//
//   node .claude/skills/mkt-ai-video-ads/scripts/gen-video.mjs --prompt "<text>" --out <clip.mp4>
//        [--image <start.png>] [--last <end.png>] [--aspect 9:16] [--res 720p|1080p] [--seconds 4|6|8]
//        [--negative "<text>"] [--model veo-3.1-fast-generate-preview] [--dry]
//
// Run from the repo root. Needs GEMINI_API_KEY. COSTS REAL MONEY (~$0.15/s fast tier, more on the
// quality tier `veo-3.1-generate-preview`). Always --dry first and get Spencer's OK for a batch.
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const prompt = opt('--prompt');
const out = opt('--out');
const model = opt('--model', 'veo-3.1-fast-generate-preview');
if (!prompt || !out) { console.error('usage: --prompt "<text>" --out <clip.mp4> [--image start.png] [--last end.png] [--res 720p] [--seconds 8] [--dry]'); process.exit(1); }

try { process.loadEnvFile('.env'); } catch {}
const key = process.env.GEMINI_API_KEY;
if (!key) { console.error('GEMINI_API_KEY missing from .env (needed for Veo).'); process.exit(2); }

const asImage = (f) => ({ bytesBase64Encoded: fs.readFileSync(f).toString('base64'), mimeType: /\.jpe?g$/i.test(f) ? 'image/jpeg' : 'image/png' });
const instance = { prompt };
if (opt('--image')) instance.image = asImage(opt('--image'));
if (opt('--last')) instance.lastFrame = asImage(opt('--last'));
const parameters = {
  aspectRatio: opt('--aspect', '9:16'),
  resolution: opt('--res', '720p'),
  durationSeconds: Number(opt('--seconds', '8')),
  negativePrompt: opt('--negative', 'trap, dead animal, injured animal, blood, violence, text, watermark, logo, subtitles, distorted hands, warped face'),
};
if (args.includes('--dry')) { console.log(JSON.stringify({ model, out, image: opt('--image') || null, last: opt('--last') || null, parameters, prompt }, null, 2)); process.exit(0); }

const base = 'https://generativelanguage.googleapis.com/v1beta';
const headers = { 'content-type': 'application/json', 'x-goog-api-key': key };
const start = await fetch(`${base}/models/${model}:predictLongRunning`, { method: 'POST', headers, body: JSON.stringify({ instances: [instance], parameters }) });
let op = await start.json();
if (!start.ok) { console.error(`HTTP ${start.status}: ${JSON.stringify(op.error || op).slice(0, 800)}`); process.exit(3); }
console.log(`started ${op.name}`);

for (let i = 0; !op.done; i++) {
  if (i > 90) { console.error(`timed out; resume by polling ${op.name}`); process.exit(4); }
  await new Promise((r) => setTimeout(r, 10000));
  op = await (await fetch(`${base}/${op.name}`, { headers })).json();
  process.stdout.write('.');
}
console.log('');
if (op.error) { console.error('generation failed:', JSON.stringify(op.error).slice(0, 800)); process.exit(5); }
const sample = op.response?.generateVideoResponse?.generatedSamples?.[0];
const uri = sample?.video?.uri;
if (!uri) { console.error('no video in response (possibly filtered):', JSON.stringify(op.response).slice(0, 800)); process.exit(6); }
const vid = await fetch(uri, { headers: { 'x-goog-api-key': key }, redirect: 'follow' });
if (!vid.ok) { console.error(`download HTTP ${vid.status}`); process.exit(7); }
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
fs.writeFileSync(out, Buffer.from(await vid.arrayBuffer()));
console.log(`saved ${out}`);
