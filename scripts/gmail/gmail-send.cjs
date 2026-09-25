#!/usr/bin/env node
// Sends an email via the Gmail API, with optional file attachments (multipart/mixed).
// Same auth pattern as the triage scripts: .env refresh token -> access token -> REST.
// The connected account (roy@atpbos.com) is the From identity.
//
// Usage:
//   node scripts/gmail/gmail-send.cjs --to a@b.com --subject "Hi" --bodyFile body.txt --attach file.pdf
//   node scripts/gmail/gmail-send.cjs --to a@b.com --subject "Hi" --body "inline text" --attach a.pdf,b.pdf
//   ... --dry-run   # build MIME + print headers, do NOT send
//
// Flags: --to (required, comma-separated ok) · --subject · --body | --bodyFile ·
//        --attach <paths, comma-separated> · --cc · --dry-run
const fs = require("fs");
const path = require("path");
const { getAccessToken, gapi, b64url } = require("./_lib.cjs");

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf("--" + n); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true) : d; };
const dryRun = !!opt("dry-run", false);

const to = opt("to", null);
const cc = opt("cc", null);
const subject = opt("subject", "");
const bodyInline = opt("body", null);
const bodyFile = opt("bodyFile", null);
const attachArg = opt("attach", null);

const MIME_BY_EXT = { ".pdf": "application/pdf", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".txt": "text/plain", ".md": "text/markdown", ".html": "text/html", ".csv": "text/csv", ".zip": "application/zip", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".mp4": "video/mp4", ".mp3": "audio/mpeg", ".mov": "video/quicktime" };

function wrap76(b64) { return b64.replace(/(.{76})/g, "$1\r\n"); }

// RFC 2047: non-ASCII header values must be encoded-word wrapped, or clients
// render mojibake (em-dashes arrive as "â€“" etc.). ASCII passes through.
function encodeHeader(value) {
  return /^[\x20-\x7e]*$/.test(value)
    ? value
    : `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

async function myEmail(token) { const p = await gapi(token, "/profile"); return p.emailAddress; }

function buildMime({ from, to, cc, subject, body, attachments }) {
  const boundary = "=_atp_" + Date.now().toString(36) + "_" + process.pid.toString(36);
  const head = [
    `From: ${from}`,
    `To: ${to}`,
    ...(cc ? [`Cc: ${cc}`] : []),
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    "",
  ];
  const parts = [];
  // text/plain body part
  parts.push(
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    body || "",
    ""
  );
  // attachment parts
  for (const a of attachments) {
    const b64 = wrap76(a.buf.toString("base64"));
    parts.push(
      `--${boundary}`,
      `Content-Type: ${a.mime}; name="${a.name}"`,
      `Content-Disposition: attachment; filename="${a.name}"`,
      "Content-Transfer-Encoding: base64",
      "",
      b64,
      ""
    );
  }
  parts.push(`--${boundary}--`, "");
  return head.join("\r\n") + parts.join("\r\n");
}

(async () => {
  if (!to || to === true) { console.error("✗ Provide --to <address>."); process.exit(1); }
  const body = bodyInline && bodyInline !== true ? bodyInline
    : (bodyFile && bodyFile !== true ? fs.readFileSync(bodyFile, "utf8") : "");
  if (!body.trim()) { console.error("✗ Provide --body or --bodyFile."); process.exit(1); }

  const attachments = [];
  if (attachArg && attachArg !== true) {
    for (const p of String(attachArg).split(",").map(s => s.trim()).filter(Boolean)) {
      if (!fs.existsSync(p)) { console.error(`✗ Attachment not found: ${p}`); process.exit(1); }
      const ext = path.extname(p).toLowerCase();
      attachments.push({ name: path.basename(p), mime: MIME_BY_EXT[ext] || "application/octet-stream", buf: fs.readFileSync(p) });
    }
  }

  const token = await getAccessToken();
  const from = await myEmail(token);
  const mime = buildMime({ from, to, cc: cc && cc !== true ? cc : null, subject, body, attachments });

  const sizeKB = Math.round(Buffer.byteLength(mime, "utf8") / 1024);
  console.error(`From: ${from}`);
  console.error(`To:   ${to}${cc && cc !== true ? "  Cc: " + cc : ""}`);
  console.error(`Subj: ${subject}`);
  console.error(`Attach: ${attachments.map(a => `${a.name} (${Math.round(a.buf.length / 1024)}KB)`).join(", ") || "(none)"}`);
  console.error(`MIME size: ~${sizeKB}KB`);

  if (dryRun) { console.error("\nDRY-RUN — not sent. First headers:\n" + mime.split("\r\n").slice(0, 6).join("\n")); return; }

  const res = await gapi(token, "/messages/send", { method: "POST", body: JSON.stringify({ raw: b64url(mime) }) });
  console.error(`\n✓ Sent. messageId=${res.id} threadId=${res.threadId}`);
})().catch((e) => { console.error("✗", e.message); process.exit(1); });
