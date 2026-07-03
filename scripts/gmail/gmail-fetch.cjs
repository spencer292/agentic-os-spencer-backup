#!/usr/bin/env node
// READ-ONLY. Lists new INBOX messages since the last run and emits a JSON array
// the cron's Claude turn classifies. Never modifies anything in Gmail.
//
// Usage:
//   node scripts/gmail/gmail-fetch.cjs                 # incremental: since last run (or 1d)
//   node scripts/gmail/gmail-fetch.cjs --since 2d      # override window (Nd / Nh / YYYY-MM-DD)
//   node scripts/gmail/gmail-fetch.cjs --out file.json # also write to a file
//   node scripts/gmail/gmail-fetch.cjs --max 50        # cap messages examined (default 200)
//   node scripts/gmail/gmail-fetch.cjs --no-state      # don't read/write the last-run marker
//   node scripts/gmail/gmail-fetch.cjs --query "..."   # raw Gmail query override
//
// Already-triaged messages (carrying any Triage/* label) are skipped so re-runs are safe.
const fs = require("fs");
const path = require("path");
const { getAccessToken, gapi, getLabelMap, TRIAGE_LABELS } = require("./_lib.cjs");

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf("--" + name);
  return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true) : def;
};
const STATE_PATH = path.join(__dirname, ".last-run.json");
const noState = !!opt("no-state", false);
const outFile = opt("out", null);
const maxMsgs = parseInt(opt("max", "200"), 10);
const wantFull = !!opt("full", false);          // pull + decode the real body, not just the snippet
const bodyMax = parseInt(opt("bodymax", "6000"), 10);

// Resolve the "after:" epoch (seconds). Priority: --since > state file > default 1 day.
function sinceEpoch() {
  const since = opt("since", null);
  if (since && since !== true) {
    const rel = String(since).match(/^(\d+)\s*([dh])$/i);
    if (rel) {
      const n = parseInt(rel[1], 10);
      const secs = rel[2].toLowerCase() === "d" ? n * 86400 : n * 3600;
      return Math.floor(Date.now() / 1000) - secs;
    }
    const t = Date.parse(since);
    if (!isNaN(t)) return Math.floor(t / 1000);
  }
  if (!noState) {
    try {
      const s = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
      // 1h overlap so a message arriving right at the boundary is never missed (labeling is idempotent).
      if (s.lastRunEpoch) return s.lastRunEpoch - 3600;
    } catch {}
  }
  return Math.floor(Date.now() / 1000) - 86400; // default: last 24h
}

function header(headers, name) {
  const h = (headers || []).find((x) => x.name.toLowerCase() === name.toLowerCase());
  return h ? h.value : null;
}
function parseEmail(value) {
  if (!value) return null;
  const m = value.match(/<([^>]+)>/);
  return (m ? m[1] : value).trim().toLowerCase();
}
function decodeB64url(data) {
  return Buffer.from((data || "").replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}
// Walk the MIME tree, prefer text/plain, fall back to a stripped text/html.
function extractBody(payload) {
  if (!payload) return "";
  let plain = "", html = "";
  (function walk(p) {
    if (!p) return;
    const mt = (p.mimeType || "").toLowerCase();
    if (p.body && p.body.data) {
      if (mt === "text/plain") plain += decodeB64url(p.body.data);
      else if (mt === "text/html") html += decodeB64url(p.body.data);
    }
    for (const sub of p.parts || []) walk(sub);
  })(payload);
  const text = plain || html.replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
  return text.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

(async () => {
  const token = await getAccessToken();
  const labelMap = await getLabelMap(token);
  const triageIds = new Set(TRIAGE_LABELS.map((n) => labelMap[n]).filter(Boolean));

  const after = sinceEpoch();
  const runEpoch = Math.floor(Date.now() / 1000);
  const query = opt("query", null) && opt("query") !== true
    ? opt("query")
    : `in:inbox -in:chats after:${after}`;

  // Page through messages.list up to the cap.
  const ids = [];
  let pageToken = null;
  do {
    const params = new URLSearchParams({ q: query, maxResults: "100" });
    if (pageToken) params.set("pageToken", pageToken);
    const list = await gapi(token, "/messages?" + params.toString());
    for (const m of list.messages || []) ids.push(m.id);
    pageToken = list.nextPageToken;
  } while (pageToken && ids.length < maxMsgs);

  const wanted = ["From", "Reply-To", "To", "Subject", "Date", "Message-ID",
    "List-Unsubscribe", "Precedence", "Auto-Submitted"];
  const out = [];
  let skippedTriaged = 0;
  for (const id of ids.slice(0, maxMsgs)) {
    let msg;
    if (wantFull) {
      msg = await gapi(token, `/messages/${id}?format=full`);
    } else {
      const hp = new URLSearchParams({ format: "metadata" });
      for (const h of wanted) hp.append("metadataHeaders", h);
      msg = await gapi(token, `/messages/${id}?` + hp.toString());
    }
    const labelIds = msg.labelIds || [];
    if (labelIds.some((l) => triageIds.has(l))) { skippedTriaged++; continue; } // already triaged

    const H = msg.payload && msg.payload.headers;
    const fromRaw = header(H, "From");
    const replyTo = header(H, "Reply-To");
    out.push({
      id: msg.id,
      threadId: msg.threadId,
      from: fromRaw,
      fromEmail: parseEmail(fromRaw),
      replyToEmail: parseEmail(replyTo) || parseEmail(fromRaw),
      to: header(H, "To"),
      subject: header(H, "Subject"),
      date: header(H, "Date"),
      snippet: msg.snippet || "",
      body: wantFull ? extractBody(msg.payload).slice(0, bodyMax) : undefined,
      labelIds,
      isUnread: labelIds.includes("UNREAD"),
      messageIdHeader: header(H, "Message-ID"),
      // bulk/automation signals the classifier leans on:
      listUnsubscribe: !!header(H, "List-Unsubscribe"),
      precedenceBulk: /bulk|list|junk/i.test(header(H, "Precedence") || ""),
      autoSubmitted: /auto/i.test(header(H, "Auto-Submitted") || ""),
    });
  }

  const payload = {
    fetchedAt: new Date(runEpoch * 1000).toISOString(),
    query,
    windowAfter: new Date(after * 1000).toISOString(),
    counts: { listed: ids.length, returned: out.length, skippedTriaged },
    messages: out,
  };
  const json = JSON.stringify(payload, null, 2);
  if (outFile) {
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, json);
  }
  // stderr = human summary, stdout = the JSON (so it can be piped or captured).
  console.error(`✓ ${out.length} new message(s) for triage (listed ${ids.length}, skipped ${skippedTriaged} already-triaged). Window since ${payload.windowAfter}.`);
  process.stdout.write(json + "\n");

  if (!noState) {
    try { fs.writeFileSync(STATE_PATH, JSON.stringify({ lastRunEpoch: runEpoch }, null, 2)); } catch {}
  }
})().catch((e) => { console.error("✗", e.message); process.exit(1); });
