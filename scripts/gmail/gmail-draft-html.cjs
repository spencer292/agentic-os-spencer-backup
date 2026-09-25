#!/usr/bin/env node
// Creates a NEW (non-threaded) HTML draft in Gmail. NEVER sends — the draft lands
// in Drafts for a human to read, edit and send. Companion to gmail-draft.cjs
// (which is plain-text and reply-threaded).
//
// Builds multipart/related > multipart/alternative(text/plain, text/html) + inline
// images, so branded HTML renders everywhere and still degrades to readable text.
//
// Usage:
//   node scripts/gmail/gmail-draft-html.cjs \
//     --to "someone@example.com" \
//     --subject "Subject line" \
//     --html body.html --text body.txt \
//     --inline "atplogo=brand_context/Branding/ALL THE POWER LOGO/PNG/LOGO-09.png"
//
// Flags:
//   --to        recipient(s), comma-separated. Optional — omit to leave the draft
//               addressed to nobody so a human fills it in before sending.
//   --cc        optional
//   --subject   required
//   --html      path to the HTML body (required)
//   --text      path to the plain-text alternative (optional but recommended)
//   --inline    comma-separated cid=path pairs for images referenced as src="cid:NAME"
//   --attach    comma-separated file paths attached as normal downloads (PDFs etc)
//   --update    existing draft id — replace that draft in place instead of adding a new one
//   --dry-run   build the MIME and print the headers, create nothing
//
// GMAIL_ACCOUNT=allthepower selects the All The Power mailbox (see _lib.cjs).
const fs = require("fs");
const path = require("path");
const { getAccessToken, gapi, b64url } = require("./_lib.cjs");

const args = process.argv.slice(2);
const opt = (n, d) => {
  const i = args.indexOf("--" + n);
  return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true) : d;
};

const to = opt("to", "");
const cc = opt("cc", "");
const subject = opt("subject", "");
const htmlFile = opt("html", null);
const textFile = opt("text", null);
const inlineSpec = opt("inline", "");
const attachSpec = opt("attach", "");
const updateId = opt("update", null);
const dryRun = !!opt("dry-run", false);

const IMG_MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif" };
const FILE_MIME = {
  ".pdf": "application/pdf", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".txt": "text/plain", ".csv": "text/csv", ".zip": "application/zip",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

// RFC 2047 — non-ASCII header values must be encoded-word wrapped or clients show mojibake.
function encodeHeader(v) {
  return /^[\x20-\x7e]*$/.test(v) ? v : `=?UTF-8?B?${Buffer.from(v, "utf8").toString("base64")}?=`;
}
const b64lines = (buf) => buf.toString("base64").replace(/(.{76})/g, "$1\r\n");

function build() {
  const html = fs.readFileSync(htmlFile, "utf8");
  const text = textFile ? fs.readFileSync(textFile, "utf8") : html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  const inlines = String(inlineSpec || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pair) => {
      const eq = pair.indexOf("=");
      if (eq < 0) { console.error(`✗ --inline needs cid=path, got "${pair}"`); process.exit(1); }
      const cid = pair.slice(0, eq).trim();
      const file = pair.slice(eq + 1).trim();
      const ext = path.extname(file).toLowerCase();
      return { cid, file, mime: IMG_MIME[ext] || "application/octet-stream", data: fs.readFileSync(file) };
    });

  // Real file attachments (not inline images). Wrapped in multipart/mixed around
  // the multipart/related body so clients show them as normal paperclip files.
  const attachments = String(attachSpec || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((file) => {
      if (!fs.existsSync(file)) { console.error(`✗ --attach file not found: ${file}`); process.exit(1); }
      const ext = path.extname(file).toLowerCase();
      return { file, mime: FILE_MIME[ext] || "application/octet-stream", data: fs.readFileSync(file) };
    });

  const mix = "----=_mix_" + Math.random().toString(36).slice(2);
  const rel = "----=_rel_" + Math.random().toString(36).slice(2);
  const alt = "----=_alt_" + Math.random().toString(36).slice(2);
  const L = [];

  if (to) L.push(`To: ${to}`);
  if (cc) L.push(`Cc: ${cc}`);
  L.push(`Subject: ${encodeHeader(subject)}`);
  L.push("MIME-Version: 1.0");
  if (attachments.length) {
    L.push(`Content-Type: multipart/mixed; boundary="${mix}"`);
    L.push("");
    L.push(`--${mix}`);
  }
  L.push(`Content-Type: multipart/related; boundary="${rel}"`);
  L.push("");

  L.push(`--${rel}`);
  L.push(`Content-Type: multipart/alternative; boundary="${alt}"`);
  L.push("");
  L.push(`--${alt}`);
  L.push('Content-Type: text/plain; charset="UTF-8"');
  L.push("Content-Transfer-Encoding: base64");
  L.push("");
  L.push(b64lines(Buffer.from(text, "utf8")));
  L.push(`--${alt}`);
  L.push('Content-Type: text/html; charset="UTF-8"');
  L.push("Content-Transfer-Encoding: base64");
  L.push("");
  L.push(b64lines(Buffer.from(html, "utf8")));
  L.push(`--${alt}--`);

  for (const img of inlines) {
    L.push(`--${rel}`);
    L.push(`Content-Type: ${img.mime}; name="${path.basename(img.file)}"`);
    L.push(`Content-ID: <${img.cid}>`);
    L.push(`Content-Disposition: inline; filename="${path.basename(img.file)}"`);
    L.push("Content-Transfer-Encoding: base64");
    L.push("");
    L.push(b64lines(img.data));
  }
  L.push(`--${rel}--`);

  for (const att of attachments) {
    const name = path.basename(att.file);
    L.push(`--${mix}`);
    L.push(`Content-Type: ${att.mime}; name="${encodeHeader(name)}"`);
    L.push(`Content-Disposition: attachment; filename="${encodeHeader(name)}"`);
    L.push("Content-Transfer-Encoding: base64");
    L.push("");
    L.push(b64lines(att.data));
  }
  if (attachments.length) L.push(`--${mix}--`);

  return L.join("\r\n");
}

(async () => {
  if (!htmlFile || htmlFile === true) { console.error("✗ Provide --html <file>."); process.exit(1); }
  if (!subject || subject === true) { console.error("✗ Provide --subject."); process.exit(1); }

  const mime = build();
  if (dryRun) {
    console.log(`[dry] ${mime.length} bytes — headers:`);
    console.log(mime.split("\r\n\r\n")[0]);
    return;
  }

  const token = await getAccessToken();
  const replacing = updateId && updateId !== true;
  const draft = await gapi(token, replacing ? `/drafts/${updateId}` : "/drafts", {
    method: replacing ? "PUT" : "POST",
    body: JSON.stringify({ ...(replacing ? { id: updateId } : {}), message: { raw: b64url(mime) } }),
  });
  const verb = replacing ? "updated" : "created";
  console.error(`✓ Draft ${verb}: ${draft.id}${to ? ` → ${to}` : " (no recipient — fill in before sending)"}`);
})().catch((e) => { console.error("✗", e.message); process.exit(1); });
