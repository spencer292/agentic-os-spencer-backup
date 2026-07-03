#!/usr/bin/env node
// CONTENT triage over already-filed mail. Reads From + Subject + snippet of each
// message (that's what triage is) and decides: invoice -> Finance, marketing -> Junk,
// genuine signal (failure/security/action-required) -> Needs-You, else -> FYI.
// Never deletes. Default scope = the swept area folders.
//
//   node scripts/gmail/gmail-retriage.cjs --dry-run     # read + classify, print plan + signal list
//   node scripts/gmail/gmail-retriage.cjs               # apply
//   node scripts/gmail/gmail-retriage.cjs --query "label:Notification"
const fs = require("fs");
const { getAccessToken, gapi, getLabelMap, ensureLabel } = require("./_lib.cjs");

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf("--" + n); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true) : d; };
const dryRun = !!opt("dry-run", false);
const QUERY = (opt("query", null) && opt("query") !== true) ? opt("query")
  : "label:Notification OR label:Marketing OR label:Finance OR label:Newsletters";

const h = (H, n) => { const x = (H || []).find((a) => a.name.toLowerCase() === n.toLowerCase()); return x ? x.value : null; };
const clean = (s) => (s || "").replace(/[​-‏⁠﻿‍ ]/g, "").replace(/\s+/g, " ").trim();
const parseEmail = (v) => { if (!v) return null; const m = v.match(/<([^>]+)>/); return (m ? m[1] : v).trim().toLowerCase(); };

async function pool(items, w, c) { const o = []; let i = 0; await Promise.all(Array.from({ length: c }, async () => { while (i < items.length) { const k = i++; o[k] = await w(items[k]); } })); return o; }
async function listIds(token, query, cap = 4000) {
  const ids = []; let pt = null;
  do { const p = new URLSearchParams({ q: query, maxResults: "500" }); if (pt) p.set("pageToken", pt);
    const l = await gapi(token, "/messages?" + p.toString()); for (const m of l.messages || []) ids.push(m.id); pt = l.nextPageToken;
  } while (pt && ids.length < cap);
  return ids;
}
async function batchModify(token, ids, add, remove) {
  for (let i = 0; i < ids.length; i += 1000) {
    await gapi(token, "/messages/batchModify", { method: "POST", body: JSON.stringify({ ids: ids.slice(i, i + 1000), addLabelIds: add, removeLabelIds: remove || [] }) });
  }
}

// ---- the content classifier (reads From + Subject + snippet) ----
// Three-way split that matters: OPS (your own pipelines failing — summarised, not listed),
// NEEDS-YOU (genuine external action: money/account/security), JUNK (marketing), FYI (rest).
const RX = {
  trial:   /\btrial\b/,
  // high-precision: real external action / security only (NOT generic "failed" — that's OPS below)
  signal:  /\b(payment (was )?declined|card (was )?declined|past due|overdue|account (will be )?(paused|suspended|disabled|locked)|will be paused|action required|requires? (your )?(action|attention)|verify your (email|account|identity|domain|advertiser)|advertiser verification|verify your .{0,20}contact|confirm your (email|account)|password reset|reset your password|security alert|new sign-?in|sign-?in detected|suspicious|unauthor|account email problem|username has changed|has been changed|deprecat(ed|ing|ion)|failed to publish|confirmation instructions)\b/,
  invoice: /\b(receipt|invoice|statement|payment (received|confirmation|succeeded)|renewal (complete|completed|confirmation)|subscription renewed|your bill\b|amount (due|paid)|payout|credit note)\b/,
  junk:    /(\d+% off|\bwebinar\b|\bregister\b|last chance|final call|don'?t forget|welcome to|introducing|\bnew:|\btips\b|get started|one quick question|\bsurvey\b|\brecap\b|upgrade to|\bdiscover\b|better answers|join (us|the|the biggest)|\brecording\b|invited:|\bebook\b|\bguide\b|newsletter|new from|this week|\bmonthly\b|live with|q&amp;a|q&a|credits? (added|ready)|don'?t miss|\bsale\b|\boffer\b|\bpromo|lineup|black friday|now in |build .* inside|🌱|✨|⏳)/,
};
function classify(fromEmail, subject, snippet) {
  const from = fromEmail || "";
  const dom = from.split("@")[1] || "";
  const subj = clean(subject);
  const text = (subj + " ||| " + clean(snippet)).toLowerCase();
  const finance = RX.invoice.test(text);
  // OPS = your own automation failing (n8n self-alerts + Vercel deploy failures) — high volume, summarise
  const ops = (/@atpbos\.com$/.test(from) && /workflow (failed|error)/i.test(subj))
    || (/vercel\.com$/.test(dom) && /fail(ed|ure).*deploy|deployment/i.test(subj));
  // marketing senders never carry real signal even if their body shouts urgency
  const marketingSender = /^(newsletter|marketing|news)@/.test(from) || /gohighlevel|clickfunnels|russellbrunson/.test(dom);
  let triage;
  if (ops) triage = "OPS";
  else if (marketingSender && !finance) triage = "JUNK";
  else if (RX.trial.test(text) && /(left|ends?|day|expir|upgrade|downgrad)/.test(text)) triage = finance ? "FYI" : "JUNK";
  else if (RX.signal.test(text)) triage = "NEEDS-YOU";
  else if (finance) triage = "FYI";
  else if (RX.junk.test(text)) triage = "JUNK";
  else triage = "FYI";
  return { finance, triage, ops };
}
// strip ids/dates so repeated failures collapse to one line in the report
function normSubj(s) {
  return clean(s).replace(/^⚠️?\s*/, "").replace(/[#\d]{3,}[-\d]*/g, "").replace(/\s+/g, " ").trim().slice(0, 48);
}

(async () => {
  const token = await getAccessToken();
  const L = await getLabelMap(token);
  for (const n of ["Triage/Junk", "Triage/Needs-You", "Triage/FYI"]) await ensureLabel(token, n, L);

  const ids = await listIds(token, QUERY);
  console.error(`Reading ${ids.length} message(s)…`);
  const rows = await pool(ids, async (id) => {
    const hp = new URLSearchParams({ format: "metadata" });
    for (const x of ["From", "Subject"]) hp.append("metadataHeaders", x);
    const m = await gapi(token, `/messages/${id}?` + hp.toString());
    const H = m.payload && m.payload.headers;
    const c = classify(parseEmail(h(H, "From")), h(H, "Subject"), m.snippet);
    return { id, from: clean(h(H, "From")), subject: clean(h(H, "Subject")), labels: m.labelIds || [], ...c };
  }, 6);

  const fin = rows.filter((r) => r.finance && !(r.labels.includes(L.Finance)));
  const junk = rows.filter((r) => r.triage === "JUNK");
  const needs = rows.filter((r) => r.triage === "NEEDS-YOU");
  const ops = rows.filter((r) => r.triage === "OPS");
  const fyi = rows.filter((r) => r.triage === "FYI");

  console.error(`\n${dryRun ? "[DRY-RUN] would apply" : "Applying"} over ${rows.length} msgs:`);
  console.error(`  Invoices -> Finance:        ${fin.length}`);
  console.error(`  Junk (marketing):           ${junk.length}`);
  console.error(`  Needs-You (real action):    ${needs.length}`);
  console.error(`  Ops failures (FYI, summary): ${ops.length}`);
  console.error(`  FYI (rest):                 ${fyi.length}`);

  // group helper
  const groupBy = (arr, keyFn) => { const m = new Map(); for (const r of arr) { const k = keyFn(r); m.set(k, (m.get(k) || 0) + 1); } return [...m.entries()].sort((a, b) => b[1] - a[1]); };

  // NEEDS-YOU — deduped, the actual shortlist that needs Roy
  console.log(`\n=== NEEDS-YOU — ${needs.length} msgs, deduped to distinct issues ===`);
  for (const [k, n] of groupBy(needs, (r) => `${(r.from.split("<")[0] || r.from).trim().slice(0, 22)} | ${normSubj(r.subject)}`)) {
    console.log(`  ${String(n).padStart(3)}×  ${k}`);
  }
  // OPS — your pipelines failing, summarised by pipeline
  console.log(`\n=== OPS (your own pipelines failing — FYI) — ${ops.length} alerts ===`);
  for (const [k, n] of groupBy(ops, (r) => normSubj(r.subject)).slice(0, 15)) console.log(`  ${String(n).padStart(3)}×  ${k}`);

  fs.mkdirSync(".tmp/gmail", { recursive: true });
  fs.writeFileSync(".tmp/gmail/retriage-signals.json", JSON.stringify({ needs, ops: ops.length }, null, 2));

  if (!dryRun) {
    if (fin.length) await batchModify(token, fin.map((r) => r.id), [L.Finance], [L.Notification, L.Marketing].filter(Boolean));
    if (junk.length) await batchModify(token, junk.map((r) => r.id), [L["Triage/Junk"]]);
    if (needs.length) await batchModify(token, needs.map((r) => r.id), [L["Triage/Needs-You"]]);
    if (ops.length) await batchModify(token, ops.map((r) => r.id), [L["Triage/FYI"]]);
    if (fyi.length) await batchModify(token, fyi.map((r) => r.id), [L["Triage/FYI"]]);
    console.error("\n✓ Applied. Ops alerts tagged FYI (kept in Notification); see summary above.");
  } else {
    console.error("\n(dry-run — nothing changed)");
  }
})().catch((e) => { console.error("✗", e.message); process.exit(1); });
