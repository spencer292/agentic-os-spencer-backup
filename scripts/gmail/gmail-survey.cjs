#!/usr/bin/env node
// READ-ONLY mailbox survey. Samples mail across a window and aggregates by sender,
// domain, Gmail category, and bulk/automation signals — to inform a folder taxonomy.
// Touches nothing. Usage:
//   node scripts/gmail/gmail-survey.cjs                       # last 90 days, up to 400 msgs
//   node scripts/gmail/gmail-survey.cjs --query "newer_than:180d" --max 600
//   node scripts/gmail/gmail-survey.cjs --query "in:inbox"     # only what's in the inbox now
const fs = require("fs");
const path = require("path");
const { getAccessToken, gapi } = require("./_lib.cjs");

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf("--" + n); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true) : d; };
const QUERY = (opt("query", null) && opt("query") !== true) ? opt("query") : "newer_than:90d";
const MAX = parseInt(opt("max", "400"), 10);
const TOP = parseInt(opt("top", "30"), 10);
const CONC = 5;

const CATS = { CATEGORY_PERSONAL: "Primary", CATEGORY_SOCIAL: "Social", CATEGORY_PROMOTIONS: "Promotions", CATEGORY_UPDATES: "Updates", CATEGORY_FORUMS: "Forums" };
const AUTO_LOCAL = /^(no-?reply|do-?not-?reply|noreply|notifications?|notify|updates?|mailer|bounce|alert|alerts|news|newsletter|info|hello|team|support|account|billing|receipts?|invoice|postmaster|automated)/i;

function header(headers, name) { const h = (headers || []).find((x) => x.name.toLowerCase() === name.toLowerCase()); return h ? h.value : null; }
function parseEmail(v) { if (!v) return null; const m = v.match(/<([^>]+)>/); return (m ? m[1] : v).trim().toLowerCase(); }
function domainOf(email) { if (!email) return "(unknown)"; const at = email.split("@")[1] || ""; return at.replace(/^.*\.(?=[^.]+\.[^.]+$)/, ""); } // collapse sub-domains to registrable-ish

async function pool(items, worker, conc) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: conc }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await worker(items[idx], idx); }
  }));
  return out;
}

(async () => {
  const token = await getAccessToken();
  // 1) gather ids
  const ids = []; let pageToken = null;
  do {
    const p = new URLSearchParams({ q: QUERY, maxResults: "100" });
    if (pageToken) p.set("pageToken", pageToken);
    const list = await gapi(token, "/messages?" + p.toString());
    for (const m of list.messages || []) ids.push(m.id);
    pageToken = list.nextPageToken;
  } while (pageToken && ids.length < MAX);
  const sample = ids.slice(0, MAX);

  // 2) fetch metadata (limited concurrency)
  const wanted = ["From", "Subject", "List-Unsubscribe", "Precedence", "Auto-Submitted"];
  const rows = await pool(sample, async (id) => {
    const hp = new URLSearchParams({ format: "metadata" });
    for (const h of wanted) hp.append("metadataHeaders", h);
    try {
      const m = await gapi(token, `/messages/${id}?` + hp.toString());
      const H = m.payload && m.payload.headers;
      const email = parseEmail(header(H, "From"));
      const labelIds = m.labelIds || [];
      const cat = (labelIds.map((l) => CATS[l]).find(Boolean)) || "Primary";
      const bulk = !!header(H, "List-Unsubscribe") || /bulk|list/i.test(header(H, "Precedence") || "");
      const local = (email || "").split("@")[0] || "";
      const automated = bulk || AUTO_LOCAL.test(local) || /auto/i.test(header(H, "Auto-Submitted") || "");
      return { email, domain: domainOf(email), cat, bulk, automated, unread: labelIds.includes("UNREAD"), inbox: labelIds.includes("INBOX") };
    } catch { return null; }
  }, CONC);

  const data = rows.filter(Boolean);
  const n = data.length;
  const tally = (key) => { const t = {}; for (const r of data) { const k = typeof key === "function" ? key(r) : r[key]; t[k] = (t[k] || 0) + 1; } return t; };
  const sortDesc = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]);
  const pct = (x) => `${Math.round((x / n) * 100)}%`;

  const byCat = tally("cat");
  const byDomain = sortDesc(tally("domain"));
  const bySender = sortDesc(tally("email"));
  const automated = data.filter((r) => r.automated).length;
  const bulk = data.filter((r) => r.bulk).length;
  const inboxNow = data.filter((r) => r.inbox).length;
  const unread = data.filter((r) => r.unread).length;
  const uniqueSenders = Object.keys(tally("email")).length;
  const uniqueDomains = Object.keys(tally("domain")).length;

  // report
  const L = [];
  L.push(`\n=== MAILBOX SURVEY — query "${QUERY}" — sampled ${n} of ${ids.length} listed ===\n`);
  L.push(`Unique senders: ${uniqueSenders}   Unique domains: ${uniqueDomains}`);
  L.push(`Automated/no-reply: ${automated} (${pct(automated)})   Bulk/unsubscribe: ${bulk} (${pct(bulk)})   Human-ish: ${n - automated} (${pct(n - automated)})`);
  L.push(`Currently in INBOX: ${inboxNow} (${pct(inboxNow)})   Unread: ${unread} (${pct(unread)})`);
  L.push(`\n-- Gmail category split --`);
  for (const [k, v] of sortDesc(byCat)) L.push(`  ${k.padEnd(12)} ${String(v).padStart(4)}  ${pct(v)}`);
  L.push(`\n-- Top ${TOP} sender DOMAINS --`);
  for (const [k, v] of byDomain.slice(0, TOP)) {
    const ex = data.find((r) => r.domain === k);
    L.push(`  ${String(v).padStart(4)}  ${k.padEnd(34)} ${ex && ex.automated ? "(auto)" : ""}`);
  }
  L.push(`\n-- Top ${TOP} individual SENDERS --`);
  for (const [k, v] of bySender.slice(0, TOP)) L.push(`  ${String(v).padStart(4)}  ${k}`);
  const report = L.join("\n");
  console.log(report);

  fs.mkdirSync(".tmp/gmail", { recursive: true });
  fs.writeFileSync(path.join(".tmp/gmail", "survey.json"), JSON.stringify({ query: QUERY, n, byCat, byDomain, bySender, automated, bulk, inboxNow, unread }, null, 2));
  console.error(`\n(JSON written to .tmp/gmail/survey.json)`);
})().catch((e) => { console.error("✗", e.message); process.exit(1); });
