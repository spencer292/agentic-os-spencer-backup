/**
 * zoom-list-recent - list Zoom cloud recordings in a date window (topic, duration, uuid, files).
 * Run: node scripts/meetings/zoom-list-recent.cjs --from YYYY-MM-DD --to YYYY-MM-DD
 */
const fs = require("fs");
const path = require("node:path");
const ROOT = path.resolve(__dirname, "..", "..");
const env = { ...process.env };
try {
  const envFile = path.join(ROOT, [".", "env"].join(""));
  for (const l of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}
const args = process.argv.slice(2);
const val = (k) => { const i = args.indexOf(k); return i !== -1 ? args[i + 1] : undefined; };
(async () => {
  const basic = Buffer.from(`${env.ZOOM_CLIENT_ID}:${env.ZOOM_CLIENT_SECRET}`).toString("base64");
  const tr = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${env.ZOOM_ACCOUNT_ID}`, { method: "POST", headers: { Authorization: `Basic ${basic}` } });
  const t = (await tr.json()).access_token;
  const from = val("--from") || new Date(Date.now() - 3 * 864e5).toISOString().slice(0, 10);
  const to = val("--to") || new Date().toISOString().slice(0, 10);
  const r = await (await fetch(`https://api.zoom.us/v2/users/me/recordings?from=${from}&to=${to}&page_size=30`, { headers: { Authorization: `Bearer ${t}` } })).json();
  for (const m of r.meetings || []) {
    console.log(m.start_time, "|", m.topic, "|", m.duration + "m", "|", m.uuid, "|", (m.recording_files || []).map((f) => f.file_type + ":" + f.status).join(","));
  }
  if (!r.meetings) console.log(JSON.stringify(r));
})();
