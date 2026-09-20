#!/usr/bin/env node
// Creates threaded reply DRAFTS in Gmail. NEVER sends. Each draft lands in Drafts,
// attached to the original thread, and the source message gets the Triage/Drafted label.
//
// Usage:
//   node scripts/gmail/gmail-draft.cjs --in drafts.json
//   node scripts/gmail/gmail-draft.cjs --in drafts.json --dry-run   # build MIME, don't create
//
// drafts.json: [{
//   "id": "<sourceMsgId>", "threadId": "<threadId>", "to": "name@x.com",
//   "subject": "Re: ...", "messageIdHeader": "<...@mail.gmail.com>",
//   "body": "plain text reply"           // inline body, OR
//   "bodyFile": "path/to/body.txt",      // body from a file
//   "attachments": [{ "path": "file.pdf", "filename": "Nice Name.pdf" }]  // optional
// }]
const fs = require("fs");
const path = require("path");
const { getAccessToken, gapi, b64url, getLabelMap, ensureLabel } = require("./_lib.cjs");

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf("--" + n); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true) : d; };
const dryRun = !!opt("dry-run", false);
const inFile = opt("in", null);

// Read the connected account so the From header is correct.
async function myEmail(token) {
  const p = await gapi(token, "/profile");
  return p.emailAddress;
}

// RFC 2047: non-ASCII header values must be encoded-word wrapped, or clients
// render mojibake (em-dashes arrive as "â€“" etc.). ASCII passes through.
function encodeHeader(value) {
  return /^[\x20-\x7e]*$/.test(value)
    ? value
    : `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

const MIME_TYPES = { pdf: "application/pdf", epub: "application/epub+zip", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", txt: "text/plain" };

function buildMime({ from, to, cc, subject, messageIdHeader, body, attachments }) {
  // "Re:" only when this is a threaded reply; a fresh draft (no messageIdHeader) keeps its subject as given.
  const subj = messageIdHeader && !/^re:/i.test(subject || "") ? "Re: " + (subject || "") : (subject || "");
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
  ];
  if (cc) lines.push(`Cc: ${cc}`);
  lines.push(`Subject: ${encodeHeader(subj)}`);
  // Threading headers — make the draft attach as a reply, not a new conversation.
  if (messageIdHeader) {
    lines.push(`In-Reply-To: ${messageIdHeader}`);
    lines.push(`References: ${messageIdHeader}`);
  }
  lines.push("MIME-Version: 1.0");

  if (!attachments || !attachments.length) {
    lines.push('Content-Type: text/plain; charset="UTF-8"');
    lines.push("Content-Transfer-Encoding: 8bit");
    lines.push("");
    lines.push(body || "");
    return lines.join("\r\n");
  }

  const boundary = "----=_aos_" + Math.random().toString(36).slice(2);
  lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
  lines.push("");
  lines.push(`--${boundary}`);
  lines.push('Content-Type: text/plain; charset="UTF-8"');
  lines.push("Content-Transfer-Encoding: 8bit");
  lines.push("");
  lines.push(body || "");
  for (const att of attachments) {
    const data = fs.readFileSync(att.path);
    const name = att.filename || path.basename(att.path);
    const ext = (name.split(".").pop() || "").toLowerCase();
    const mime = MIME_TYPES[ext] || "application/octet-stream";
    const b64 = data.toString("base64").replace(/(.{76})/g, "$1\r\n");
    lines.push(`--${boundary}`);
    lines.push(`Content-Type: ${mime}; name="${encodeHeader(name)}"`);
    lines.push(`Content-Disposition: attachment; filename="${encodeHeader(name)}"`);
    lines.push("Content-Transfer-Encoding: base64");
    lines.push("");
    lines.push(b64);
  }
  lines.push(`--${boundary}--`);
  return lines.join("\r\n");
}

(async () => {
  if (!inFile || inFile === true) { console.error("✗ Provide --in <drafts.json>."); process.exit(1); }
  const items = JSON.parse(fs.readFileSync(inFile, "utf8"));
  if (!Array.isArray(items)) { console.error("✗ drafts file must be a JSON array."); process.exit(1); }

  const token = await getAccessToken();
  const from = await myEmail(token);
  const labelMap = await getLabelMap(token);
  const draftedId = dryRun ? null : await ensureLabel(token, "Triage/Drafted", labelMap);

  let created = 0, errors = 0;
  const summary = [];
  for (const it of items) {
    const body = it.body != null ? it.body : (it.bodyFile ? fs.readFileSync(it.bodyFile, "utf8") : "");
    if (!it.to || !body.trim()) { errors++; console.error(`  ✗ ${it.id || "?"}: missing 'to' or body`); continue; }
    const mime = buildMime({ from, to: it.to, cc: it.cc, subject: it.subject, messageIdHeader: it.messageIdHeader, body, attachments: it.attachments });

    if (dryRun) {
      console.log(`\n----- [dry] draft to ${it.to} (thread ${it.threadId || "new"}, ${mime.length} bytes) -----`);
      console.log(mime.length > 4000 ? mime.slice(0, 4000) + "\n…[attachment base64 truncated]" : mime);
      summary.push(`${it.to} (dry)`);
      continue;
    }
    try {
      const draft = await gapi(token, "/drafts", {
        method: "POST",
        body: JSON.stringify({
          message: { raw: b64url(mime), threadId: it.threadId || undefined },
        }),
      });
      created++;
      // Tag the source message so the report and the inbox agree a reply is waiting.
      if (it.id) {
        try { await gapi(token, `/messages/${it.id}/modify`, { method: "POST", body: JSON.stringify({ addLabelIds: [draftedId] }) }); } catch {}
      }
      summary.push(`${it.to} → draft ${draft.id}`);
    } catch (e) {
      errors++;
      console.error(`  ✗ ${it.id || it.to}: ${e.message}`);
    }
  }

  const head = dryRun ? "DRY-RUN — no drafts created" : `${created} draft(s) created`;
  console.error(`✓ ${head}, ${errors} error(s).`);
  for (const s of summary) console.error("   " + s);
})().catch((e) => { console.error("✗", e.message); process.exit(1); });
