// Stitch clips into one 1080x1920 ad, optionally lay a voiceover over it, and append a
// branded end card (Grass background, real logo PNG, CTA line). Burned captions are a separate
// pass: hand the output to the vid-ffmpeg-edit skill.
//
//   node .claude/skills/mkt-ai-video-ads/scripts/assemble.mjs --clips a.mp4,b.mp4,c.mp4 --out ad.mp4
//        [--vo vo.mp3] [--keep-clip-audio 0.25] [--card "Call or text Got Moles"] [--card-seconds 2.5]
//        [--logo "brand_context/rebrand/FILES/PNG/GOT MOLES FILES-01.png"]
//
// Run from the repo root. Needs ffmpeg on PATH.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const clips = (opt('--clips') || '').split(',').filter(Boolean);
const out = opt('--out');
if (!clips.length || !out) { console.error('usage: --clips a.mp4,b.mp4 --out ad.mp4 [--vo vo.mp3] [--card "CTA"] [--logo file.png]'); process.exit(1); }
const vo = opt('--vo');
const clipVol = opt('--keep-clip-audio', vo ? '0.25' : '1');
const card = opt('--card');
const cardSec = opt('--card-seconds', '2.5');
const logo = opt('--logo', 'brand_context/rebrand/FILES/PNG/GOT MOLES FILES-02.png'); // 02 = Cream, for dark backgrounds
// Brand type is Lexend Bold; fall back to Bahnschrift (ships with Windows) when it isn't installed.
const fontPath = ['C:/Windows/Fonts/Lexend-Bold.ttf', 'C:/Windows/Fonts/bahnschrift.ttf', 'C:/Windows/Fonts/arialbd.ttf'].find((f) => fs.existsSync(f));
const fontOpt = fontPath ? `fontfile='${fontPath.replace(':', '\\:')}':` : '';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gm-ad-'));
const ff = (a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a], { stdio: 'inherit' });
const hasAudio = (f) => execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', f], { encoding: 'utf8' }).trim() !== '';

// 1. Normalize every clip to 1080x1920 / 30fps / AAC stereo (silent track if none).
const norm = clips.map((c, i) => {
  const o = path.join(tmp, `n${i}.mp4`);
  const vf = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1';
  if (hasAudio(c)) ff(['-i', c, '-vf', vf, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-ar', '48000', '-ac', '2', o]);
  else ff(['-i', c, '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-shortest', '-vf', vf, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', o]);
  return o;
});

// 2. End card: brand Grass background, centered logo, Cream CTA text.
if (card) {
  const o = path.join(tmp, 'card.mp4');
  const text = card.replace(/[:\\']/g, (m) => '\\' + m);
  const logoIn = fs.existsSync(logo) ? ['-loop', '1', '-i', logo] : [];
  const filter = logoIn.length
    ? `[1:v]scale=760:-1[lg];[0:v][lg]overlay=(W-w)/2:(H-h)/2-180,drawtext=${fontOpt}text='${text}':fontcolor=0xE68C04:fontsize=72:x=(w-text_w)/2:y=h/2+120`
    : `[0:v]drawtext=${fontOpt}text='${text}':fontcolor=0xE68C04:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2`;
  ff(['-f', 'lavfi', '-i', `color=c=0x184241:s=1080x1920:r=30:d=${cardSec}`, ...logoIn, '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',
    '-filter_complex', filter, '-map', logoIn.length ? '2:a' : '1:a', '-t', cardSec, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', o]);
  norm.push(o);
}

// 3. Concatenate.
const list = path.join(tmp, 'list.txt');
fs.writeFileSync(list, norm.map((f) => `file '${f.replace(/\\/g, '/')}'`).join('\n'));
const joined = vo ? path.join(tmp, 'joined.mp4') : out;
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
ff(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', joined]);

// 4. Voiceover: duck clip audio under the VO.
if (vo) {
  ff(['-i', joined, '-i', vo, '-filter_complex', `[0:a]volume=${clipVol}[a0];[a0][1:a]amix=inputs=2:duration=first:dropout_transition=0[a]`,
    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', out]);
}
console.log(`saved ${out}`);
