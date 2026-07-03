#!/usr/bin/env node
/* Generate a music bed via ElevenLabs Music. Reads ELEVENLABS_API_KEY from .env
 * internally; never prints it. Saves an mp3.
 *
 * Usage: node elevenlabs_music.cjs --prompt "..." --ms 55000 --out track.mp3
 */
const fs = require("fs"), path = require("path");

function arg(n, d){const i=process.argv.indexOf(`--${n}`);return i>=0&&process.argv[i+1]?process.argv[i+1]:d;}
function loadKey(){
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY.trim();
  const p = path.resolve(__dirname, "..", "..", "..", "..", ".env");
  if (fs.existsSync(p)) for (const l of fs.readFileSync(p,"utf8").split(/\r?\n/)){
    const m=l.match(/^\s*ELEVENLABS_API_KEY\s*=\s*(.*)\s*$/); if(m) return m[1].replace(/^["']|["']$/g,"").trim();
  }
  return "";
}

(async () => {
  const key = loadKey();
  if (!key) { console.error("ELEVENLABS_API_KEY not found"); process.exit(2); }
  const prompt = arg("prompt", "Uplifting cinematic instrumental, hopeful and triumphant build, no vocals");
  const ms = parseInt(arg("ms", "55000"), 10);
  const out = arg("out", "track.mp3");

  // Eleven Music endpoint. Body: prompt + music_length_ms. Returns audio/mpeg.
  const endpoints = ["https://api.elevenlabs.io/v1/music", "https://api.elevenlabs.io/v1/music/compose"];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "xi-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, music_length_ms: ms }),
      });
      const ct = res.headers.get("content-type") || "";
      if (!res.ok) {
        const t = await res.text();
        console.error(`POST ${url} -> ${res.status} ${ct}: ${t.slice(0,250)}`);
        continue;
      }
      if (ct.includes("audio") || ct.includes("octet-stream")) {
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(out, buf);
        console.log(`  saved ${out} (${(buf.length/1e6).toFixed(2)} MB) from ${url}`);
        return;
      }
      // JSON response (maybe async job or a URL)
      const j = await res.json();
      console.log(`  ${url} returned JSON keys: ${Object.keys(j)}`);
      console.log(JSON.stringify(j).slice(0, 400));
      return;
    } catch (e) {
      console.error(`request to ${url} failed: ${e.code || e.message}`);
    }
  }
  process.exit(3);
})();
