/**
 * Render several DISTINCT thumbnail style options from one host photo, for comparison.
 * Usage: node scripts/podcast/thumbnail-options.cjs <hostImg> <outDir>
 */
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('C:/Claude/agent-os-v3/agentic-os/.env', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const KEY = env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
const [hostImg, outDir] = process.argv.slice(2);
if (!KEY || !hostImg || !outDir) { console.log('usage: thumbnail-options.cjs <hostImg> <outDir>'); process.exit(1); }
const b64 = fs.readFileSync(hostImg).toString('base64');
const mime = hostImg.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

const KEEP = 'PRESERVE THE MAN\'S REAL FACE AND LIKENESS EXACTLY from the provided photo — do not alter, beautify, age, or invent features. He is the podcast host. ';
const BASE = ' 1280x720 pixels, 16:9 landscape YouTube thumbnail. Brand colours: Musk Green #5E5C2B, Night Sky charcoal #333538, Dusty Blue #5E6D76, Sky off-white #E4EAE8. Must read instantly at tiny mobile size. Keep the bottom-right corner clear. Small clean "POWER MOVERS" wordmark, white, top-left. No clutter, no episode numbers, no extra logos, no watermarks. Premium and professional. Output 1280x720.';

const STYLES = {
  editorial: KEEP + 'PREMIUM EDITORIAL look. Place the man cleanly on the RIGHT against a deep Night Sky charcoal background. On the LEFT, a solid Musk Green vertical panel with a large bold headline in off-white Sky colour: "THE OWNER\'S LIE" (heavy modern sans-serif, tight, sophisticated). Restrained, high-end magazine feel, lots of calm contrast.' + BASE,
  minimal: KEEP + 'MINIMAL / CINEMATIC-CLEAN look. One large face, tight chest-up crop on the LEFT, dramatic soft side-lighting, deep charcoal background with gentle depth and negative space on the right. Short punchy hook lower-right: "ESCAPE THE TRAP" in bold off-white with a thin Musk Green underline accent. Very clean, one-second read, no neon.' + BASE,
  colorblock: KEEP + 'BOLD MODERN look. Place the man on the LEFT cut out cleanly. Behind him a confident solid Dusty Blue background with a subtle geometric block. Large bold text on the right in off-white: "BREAK FREE" with a thin Musk Green keyline. Energetic but on-brand and tasteful, NOT neon.' + BASE,
  warm: KEEP + 'WARM, HUMAN, TRUSTWORTHY look. The man placed RIGHT, naturally lit, against a softly textured Musk-Green-to-charcoal gradient (earthy, no harsh black). Bold but warm headline on the LEFT in off-white Sky colour: "TRAPPED BY SUCCESS". Approachable, credible, premium business-podcast tone.' + BASE,
};

(async () => {
  for (const [name, prompt] of Object.entries(STYLES)) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: b64 } }] }], generationConfig: { responseModalities: ['Text', 'Image'] } }),
    });
    const j = await r.json();
    if (!r.ok) { console.log(name, 'FAILED', r.status, JSON.stringify(j).slice(0, 200)); continue; }
    let img = null;
    for (const p of j.candidates?.[0]?.content?.parts || []) { if (p.inlineData?.data || p.inline_data?.data) { img = p.inlineData?.data || p.inline_data?.data; break; } }
    if (!img) { console.log(name, 'no image'); continue; }
    const out = `${outDir}/option-${name}.png`;
    fs.writeFileSync(out, Buffer.from(img, 'base64'));
    console.log('Saved', out, '(' + Math.round(fs.statSync(out).size / 1024) + ' KB)');
  }
})().catch(e => console.log('Error:', e.message));
