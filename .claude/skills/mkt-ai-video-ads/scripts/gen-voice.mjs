// Voiceover via ElevenLabs. Settings default to the course's tested VO profile
// (stability 78 / similarity 75 / style 22 / speed 1.05).
//
//   node .claude/skills/mkt-ai-video-ads/scripts/gen-voice.mjs --list
//   node .claude/skills/mkt-ai-video-ads/scripts/gen-voice.mjs --voice <voice_id> --text "<script>" --out vo.mp3
//        [--model eleven_multilingual_v2] [--speed 1.05]
//
// Run from the repo root. Needs ELEVENLABS_API_KEY. Use an American-accent voice. A cloned voice of
// Spencer or a tech requires their written consent (references/ai-ad-gate.md §3).
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
try { process.loadEnvFile('.env'); } catch {}
const key = process.env.ELEVENLABS_API_KEY;
if (!key) { console.error('ELEVENLABS_API_KEY missing from .env. Fallback: Veo native audio, or record VO on a phone.'); process.exit(2); }
const headers = { 'xi-api-key': key, 'content-type': 'application/json' };

if (args.includes('--list')) {
  const j = await (await fetch('https://api.elevenlabs.io/v1/voices', { headers })).json();
  for (const v of j.voices || []) console.log(`${v.voice_id}  ${v.name}  [${v.category}]  ${Object.values(v.labels || {}).join(', ')}`);
  process.exit(0);
}

const voice = opt('--voice'), text = opt('--text'), out = opt('--out');
if (!voice || !text || !out) { console.error('usage: --voice <id> --text "<script>" --out vo.mp3  (or --list)'); process.exit(1); }
const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
  method: 'POST', headers,
  body: JSON.stringify({
    text, model_id: opt('--model', 'eleven_multilingual_v2'),
    voice_settings: { stability: 0.78, similarity_boost: 0.75, style: 0.22, speed: Number(opt('--speed', '1.05')), use_speaker_boost: true },
  }),
});
if (!r.ok) { console.error(`HTTP ${r.status}: ${(await r.text()).slice(0, 500)}`); process.exit(3); }
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
console.log(`saved ${out}`);
