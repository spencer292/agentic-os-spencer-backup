#!/usr/bin/env node
// Download attachments from Gmail messages matching a query. Read-only.
// Run: node scripts/gmail/gmail-attachments.cjs --query "subject:X has:attachment" --out dir [--max 5]
const fs = require("fs");
const path = require("path");
const { getAccessToken, gapi } = require("./_lib.cjs");

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf("--" + n); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true) : d; };
const query = opt("query", null);
const outDir = opt("out", ".");
const maxMsgs = parseInt(opt("max", "5"), 10);

function walkParts(p, acc) {
  if (!p) return acc;
  if (p.filename && p.body && p.body.attachmentId) acc.push({ filename: p.filename, attachmentId: p.body.attachmentId, mimeType: p.mimeType, size: p.body.size });
  for (const sub of p.parts || []) walkParts(sub, acc);
  return acc;
}

(async () => {
  if (!query || query === true) { console.error("✗ Provide --query."); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });
  const token = await getAccessToken();
  const list = await gapi(token, `/messages?q=${encodeURIComponent(query)}&maxResults=${maxMsgs}`);
  if (!list.messages || !list.messages.length) { console.log("0 messages matched."); return; }
  for (const m of list.messages) {
    const full = await gapi(token, `/messages/${m.id}?format=full`);
    const subject = ((full.payload.headers || []).find((h) => h.name.toLowerCase() === "subject") || {}).value || "(no subject)";
    const atts = walkParts(full.payload, []);
    console.log(`message ${m.id} — "${subject}" — ${atts.length} attachment(s)`);
    for (const a of atts) {
      const data = await gapi(token, `/messages/${m.id}/attachments/${a.attachmentId}`);
      const buf = Buffer.from(String(data.data).replace(/-/g, "+").replace(/_/g, "/"), "base64");
      const dest = path.join(outDir, a.filename.replace(/[\\/:*?"<>|]/g, "_"));
      fs.writeFileSync(dest, buf);
      console.log(`  ✓ ${dest} (${buf.length} bytes, ${a.mimeType})`);
    }
  }
})().catch((e) => { console.error("✗", e.message); process.exit(1); });
