#!/usr/bin/env node
// Got Moles — Daily Quote Chase
//
// Finds open quotes that have gone quiet and emails the list to Spencer and Muhammad.
//
// WHY THIS EXISTS (measured 2026-08-12 over 368 quotes since 2026-06-01):
//   - 90% of every quote Got Moles will ever win converts within 4.4 days of being sent.
//     After ~5 days a quote is functionally dead. Chasing is a same-week activity.
//   - Spencer averages 3.32 communications per quote and follows up on the ones he is
//     LOSING just as hard (3.20 touches on open/lost). Muhammad averaged 1.68 and 1.40.
//   - Inside Muhammad's book the correlation was absolute: every quote he won had 2+
//     touches, and 6 of his 10 unwon quotes had exactly 1.
//   - His close rate on quotes customers actually OPEN is 82%, against Spencer's 81% —
//     identical. The gap was never persuasion. It was that the quote went out once and
//     nothing happened afterwards.
//
// So this job flags exactly two failure modes, both mechanical:
//   UNOPENED   — sent, customer never opened it. Email may not have landed. Phone them.
//   NO FOLLOW-UP — one touch and nothing since.
//
// Jobber auth is delegated to .claude/skills/tool-jobber/scripts/jobber-api.mjs so there
// is exactly ONE token refresher in the repo (see lead-alert.mjs for why that matters).
// Read-only on Jobber by design — this job never mutates anything.
//
// Usage:
//   node projects/briefs/quote-chase/quote-chase.mjs                # normal run (cron)
//   node projects/briefs/quote-chase/quote-chase.mjs --dry-run      # print, send nothing
//   node projects/briefs/quote-chase/quote-chase.mjs --json         # machine-readable
//   node projects/briefs/quote-chase/quote-chase.mjs --test-email   # SMTP check only
//   node projects/briefs/quote-chase/quote-chase.mjs --days 45      # widen the lookback
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { sendMail } from '../lead-alerts/send-mail.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..', '..');
const JOBBER_CLI = path.join(ROOT, '.claude', 'skills', 'tool-jobber', 'scripts', 'jobber-api.mjs');
const RUNS_DIR = path.join(HERE, 'runs');
const STATE_PATH = path.join(HERE, 'state.json');

// ---------------------------------------------------------------- args + env

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };

const DRY_RUN = has('--dry-run');
const AS_JSON = has('--json');
const TEST_EMAIL = has('--test-email');
const NO_EMAIL = has('--no-email');
const LOOKBACK_DAYS = Number(val('--days', '30'));

function loadEnv() {
  const p = path.join(ROOT, '.env');
  const env = {};
  if (!fs.existsSync(p)) return env;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !line.trim().startsWith('#')) env[m[1]] = m[2].trim();
  }
  return env;
}
const env = loadEnv();

// Recipients live in a plain JSON file, not .env — addresses are not secrets and adding
// someone should be a reviewable edit. Spencer is hard-defaulted so a broken recipients
// file can never silently cut the owner out of his own report.
const OWNER_FALLBACK = 'spencer@got-moles.com';
function loadRecipients() {
  const p = path.join(HERE, 'recipients.json');
  try {
    const list = JSON.parse(fs.readFileSync(p, 'utf8')).to;
    if (Array.isArray(list) && list.length) return list.filter((e) => typeof e === 'string' && e.includes('@'));
  } catch (err) {
    console.log(`!! recipients.json unreadable (${err.message}) — falling back to ${OWNER_FALLBACK}.`);
  }
  return [OWNER_FALLBACK];
}
const ALL_TO = [...new Set([...loadRecipients(), OWNER_FALLBACK].map((s) => s.trim().toLowerCase()))];

const SMTP = {
  host: env.LEAD_ALERT_SMTP_HOST || 'smtp.gmail.com',
  port: env.LEAD_ALERT_SMTP_PORT || 465,
  user: env.LEAD_ALERT_SMTP_USER || '',
  pass: env.LEAD_ALERT_SMTP_PASS || '',
  to: ALL_TO,
};
const EMAIL_READY = Boolean(SMTP.user && SMTP.pass && SMTP.to.length);

// ---------------------------------------------------------------- tuning

const CHASE_AFTER_H = 24;   // nothing is "quiet" before a full day has passed
const URGENT_AFTER_H = 48;
const DEAD_AFTER_H = 120;   // 5 days — past the measured p90 of 4.4d, email is spent
const H = 3600000;
// A quote unopened after this many touches is almost certainly a bad email address,
// not a hesitant customer. Worth saying out loud rather than "follow up again".
const BAD_ADDRESS_TOUCHES = 3;

// ---------------------------------------------------------------- suppression state
//
// The actionable tiers (chase/urgent) are always reported in full — they are time-boxed
// and clear themselves within days. The dead tier does NOT clear itself: a quote nobody
// archives stays unopened forever, so reporting it in full every morning would put a
// permanent 13-item wall of stale names at the top of a daily email and train everyone
// to stop reading it. Dead quotes get ONE full airing, then drop to a one-line reminder.

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')); }
  catch { return { seen: {} }; }
}
function saveState(state) {
  try { fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 1)); }
  catch (err) { console.log(`!! could not write state.json (${err.message}) — next run will re-report in full.`); }
}

// ---------------------------------------------------------------- jobber

function jobberQueryOnce(query) {
  return new Promise((resolve, reject) => {
    execFile(process.execPath, [JOBBER_CLI, 'query', query],
      { cwd: ROOT, maxBuffer: 32 * 1024 * 1024, timeout: 120000 },
      (err, stdout, stderr) => {
        if (err) return reject(new Error(`Jobber query failed: ${(stderr || err.message).trim().slice(0, 500)}`));
        try { resolve(JSON.parse(stdout)); }
        catch { reject(new Error(`Jobber returned non-JSON: ${stdout.slice(0, 300)}`)); }
      });
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function jobberQuery(query, tries = 3) {
  let lastErr;
  for (let a = 1; a <= tries; a++) {
    try { return await jobberQueryOnce(query); }
    catch (err) {
      lastErr = err;
      if (!/THROTTLED|rate.?limit|ETIMEDOUT|ECONNRESET|502|503|504/i.test(err.message) || a === tries) throw err;
      await sleep(a * 5000);
    }
  }
  throw lastErr;
}

async function fetchOpenQuotes(sinceISO) {
  const out = [];
  let cursor = null;
  do {
    const q = `{
      quotes(first: 50, filter: { createdAt: { after: "${sinceISO}" }, status: awaiting_response }${cursor ? `, after: "${cursor}"` : ''}) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id quoteNumber createdAt sentAt clientHubViewedAt quoteStatus jobberWebUri
          amounts { total }
          salesperson { name { full } }
          client { id name emails { address } phones { number } }
          property { address { street city postalCode } }
          lineItems(first: 10) { nodes { name } }
        }
      }
    }`;
    const d = (await jobberQuery(q)).quotes;
    out.push(...d.nodes);
    cursor = d.pageInfo.hasNextPage ? d.pageInfo.endCursor : null;
  } while (cursor);
  return out;
}

// Jobber's API exposes the COUNT of messages linked to a quote but not their bodies or
// channel (MessageInterfaceEdge has no `node` field), so this is a follow-up-volume
// proxy, not a transcript. 1 == the initial send and nothing since.
async function fetchTouches(quotes) {
  const counts = {};
  for (let i = 0; i < quotes.length; i += 15) {
    const batch = quotes.slice(i, i + 15);
    const frag = batch.map((x, j) => `q${j}: quote(id: "${x.id}") { quoteNumber linkedCommunications(first: 1) { totalCount } }`).join('\n');
    const r = await jobberQuery(`{ ${frag} }`);
    for (const v of Object.values(r)) if (v?.quoteNumber != null) counts[v.quoteNumber] = v.linkedCommunications.totalCount;
  }
  return counts;
}

// ---------------------------------------------------------------- shaping

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const money = (n) => '$' + Number(n || 0).toLocaleString('en-US');
const ageStr = (h) => (h < 48 ? `${Math.round(h)}h` : `${(h / 24).toFixed(1)}d`);

function productOf(q) {
  const s = JSON.stringify(q.lineItems?.nodes || []).toLowerCase();
  if (s.includes('total mole control')) return 'TMCP';
  if (s.includes('quick fix')) return 'Quick Fix';
  return 'Other';
}

function classify(quotes, touches, now) {
  const rows = [];
  for (const q of quotes) {
    // A quote that was never sent is a different problem (it is sitting in drafts) and
    // is not a chase target — skip rather than tell someone to follow up on nothing.
    if (!q.sentAt) continue;
    // Internal/test quotes written to a staff member's own record.
    if ((q.client?.name || '').toLowerCase().includes('muhammad javed')) continue;

    const ageH = (now - new Date(q.sentAt)) / H;
    if (ageH < CHASE_AFTER_H) continue;

    const unopened = !q.clientHubViewedAt;
    const t = touches[q.quoteNumber] ?? 1;
    const noFollowUp = t <= 1;
    if (!unopened && !noFollowUp) continue; // opened AND chased — nothing to do

    // Short tokens only — the human-readable sentence is composed once per customer at
    // group level, so a customer holding two quotes doesn't get the same warning twice.
    const reasons = [];
    if (unopened) reasons.push('never opened');
    if (noFollowUp) reasons.push('no follow-up');
    const badAddress = unopened && t >= BAD_ADDRESS_TOUCHES;

    rows.push({
      quoteNumber: q.quoteNumber,
      owner: (q.salesperson?.name?.full || 'Unassigned').trim(),
      client: q.client?.name || '(no name)',
      clientId: q.client?.id,
      email: q.client?.emails?.[0]?.address || '',
      phone: q.client?.phones?.[0]?.number || '',
      zip: q.property?.address?.postalCode || '',
      city: q.property?.address?.city || '',
      value: q.amounts?.total || 0,
      product: productOf(q),
      sentAt: q.sentAt,
      ageH,
      touches: t,
      unopened,
      noFollowUp,
      badAddress,
      reasons,
      tier: ageH >= DEAD_AFTER_H ? 'dead' : ageH >= URGENT_AFTER_H ? 'urgent' : 'chase',
      url: q.jobberWebUri || '',
    });
  }
  rows.sort((a, b) => b.ageH - a.ageH);

  // Same customer, two quotes (the Quick Fix + TMCP habit) is ONE phone call, not two.
  const groups = new Map();
  for (const r of rows) {
    const k = r.clientId || `q${r.quoteNumber}`;
    if (!groups.has(k)) groups.set(k, { ...r, quotes: [] });
    groups.get(k).quotes.push(r);
  }
  for (const g of groups.values()) {
    g.value = g.quotes.reduce((s, x) => s + x.value, 0);
    g.ageH = Math.max(...g.quotes.map((x) => x.ageH));
    g.tier = g.ageH >= DEAD_AFTER_H ? 'dead' : g.ageH >= URGENT_AFTER_H ? 'urgent' : 'chase';
    g.maxTouches = Math.max(...g.quotes.map((x) => x.touches));
    g.badAddress = g.quotes.some((x) => x.badAddress);
    // One sentence per customer, not one per quote.
    const why = [...new Set(g.quotes.flatMap((x) => x.reasons))];
    g.why = g.badAddress
      ? [`never opened after ${g.maxTouches} touches — check the email address is right`, ...why.filter((w) => w !== 'never opened')].join(' · ')
      : why.join(' · ');
  }
  return [...groups.values()].sort((a, b) => b.ageH - a.ageH);
}

// ---------------------------------------------------------------- render

const TIER = {
  dead: { label: 'LAST CHANCE', note: 'past 5 days — past the point email works. Phone call only.', color: '#b3261e' },
  urgent: { label: 'URGENT', note: 'past 48h and still silent.', color: '#c26a00' },
  chase: { label: 'CHASE TODAY', note: 'past 24h.', color: '#2f6f3e' },
};

function renderHtml(groups, stale, now) {
  const owners = [...new Set(groups.map((g) => g.owner))].sort();
  const total = groups.reduce((s, g) => s + g.value, 0);
  const card = (g) => {
    const t = TIER[g.tier];
    const nums = g.quotes.map((q) => `#${q.quoteNumber}`).join(' + ');
    return `
    <tr><td style="padding:10px 0;border-bottom:1px solid #e8e8e8;">
      <div style="font:600 15px/1.35 -apple-system,Segoe UI,Roboto,sans-serif;color:#111;">
        ${esc(g.client)} <span style="font-weight:400;color:#666;">— ${esc(g.city)} ${esc(g.zip)}</span>
      </div>
      <div style="font:13px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#444;margin-top:3px;">
        <span style="color:${t.color};font-weight:600;">${ageStr(g.ageH)} silent</span>
        · ${esc(nums)} · ${esc(g.quotes.map((q) => q.product).join(' + '))}
        · <strong>${money(g.value)}</strong>
        · ${g.maxTouches} touch${g.maxTouches === 1 ? '' : 'es'}
      </div>
      <div style="font:13px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#b3261e;margin-top:2px;">${esc(g.why)}</div>
      <div style="font:13px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;margin-top:4px;">
        ${g.phone ? `<a href="tel:${esc(g.phone.replace(/[^\d+]/g, ''))}" style="color:#2f6f3e;text-decoration:none;font-weight:600;">${esc(g.phone)}</a>` : '<span style="color:#999;">no phone</span>'}
        ${g.email ? ` &nbsp;·&nbsp; <a href="mailto:${esc(g.email)}" style="color:#555;">${esc(g.email)}</a>` : ''}
        ${g.url ? ` &nbsp;·&nbsp; <a href="${esc(g.url)}" style="color:#555;">open in Jobber</a>` : ''}
      </div>
    </td></tr>`;
  };

  const ownerBlock = (owner) => {
    const mine = groups.filter((g) => g.owner === owner);
    const v = mine.reduce((s, g) => s + g.value, 0);
    let html = `<h2 style="font:600 16px/1.3 -apple-system,Segoe UI,Roboto,sans-serif;color:#111;margin:26px 0 4px;">${esc(owner)} <span style="font-weight:400;color:#666;">— ${mine.length} to chase, ${money(v)}</span></h2>`;
    for (const tier of ['dead', 'urgent', 'chase']) {
      const rows = mine.filter((g) => g.tier === tier);
      if (!rows.length) continue;
      html += `<div style="font:600 11px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;letter-spacing:.08em;color:${TIER[tier].color};margin:14px 0 2px;">${TIER[tier].label} — ${esc(TIER[tier].note)}</div>`;
      html += `<table width="100%" cellpadding="0" cellspacing="0">${rows.map(card).join('')}</table>`;
    }
    return html;
  };

  // Previously-aired dead quotes: one line each, no card, no repeat of the detail.
  const staleBlock = stale.length ? `
    <h2 style="font:600 16px/1.3 -apple-system,Segoe UI,Roboto,sans-serif;color:#111;margin:30px 0 2px;">Already flagged — archive or make a final call</h2>
    <div style="font:12px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#777;margin-bottom:8px;">${stale.length} older quote${stale.length === 1 ? '' : 's'}, ${money(stale.reduce((s, g) => s + g.value, 0))}. Reported in full already — archiving in Jobber removes them from this list.</div>
    <table width="100%" cellpadding="0" cellspacing="0">${stale.map((g) => `
      <tr><td style="padding:5px 0;border-bottom:1px solid #f0f0f0;font:13px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;color:#555;">
        <strong style="color:#333;">${esc(g.client)}</strong> — ${ageStr(g.ageH)} · ${money(g.value)} · ${esc(g.owner)}
        ${g.phone ? ` · <a href="tel:${esc(g.phone.replace(/[^\d+]/g, ''))}" style="color:#2f6f3e;text-decoration:none;">${esc(g.phone)}</a>` : ''}
      </td></tr>`).join('')}</table>` : '';

  return `<div style="max-width:640px;margin:0 auto;padding:20px 16px;background:#fff;">
    <div style="font:600 19px/1.3 -apple-system,Segoe UI,Roboto,sans-serif;color:#111;">Quote chase — ${groups.length} open quote${groups.length === 1 ? '' : 's'} gone quiet</div>
    <div style="font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#555;margin-top:4px;">
      ${money(total)} of live pipeline · ${new Date(now).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'full', timeStyle: 'short' })} PT
    </div>
    ${owners.map(ownerBlock).join('')}
    ${staleBlock}
    <div style="font:12px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#777;margin-top:28px;padding-top:12px;border-top:1px solid #e8e8e8;">
      <strong>Why it's worth the call:</strong> across 368 quotes, 90% of everything Got Moles ever wins
      converts within <strong>4.4 days</strong> of being sent, and 58% within 24 hours. A quote sitting
      unopened at 48 hours is not "still thinking" — it usually means the email never landed.
      Quotes that got a second touch converted; quotes that got one didn't.
      <br><br>Nothing here is a Jobber change — this report is read-only. Chase by phone, then log the touch in Jobber so it drops off this list.
    </div>
  </div>`;
}

function renderText(groups, stale, now) {
  const lines = [`QUOTE CHASE — ${groups.length} open quotes gone quiet`,
    `${money(groups.reduce((s, g) => s + g.value, 0))} of live pipeline`,
    new Date(now).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }) + ' PT', ''];
  for (const owner of [...new Set(groups.map((g) => g.owner))].sort()) {
    const mine = groups.filter((g) => g.owner === owner);
    lines.push(`== ${owner} — ${mine.length} to chase, ${money(mine.reduce((s, g) => s + g.value, 0))}`);
    for (const tier of ['dead', 'urgent', 'chase']) {
      for (const g of mine.filter((x) => x.tier === tier)) {
        lines.push(`  [${TIER[tier].label}] ${g.client} (${g.city} ${g.zip}) — ${ageStr(g.ageH)} silent, ${money(g.value)}`);
        lines.push(`      ${g.quotes.map((q) => '#' + q.quoteNumber).join(' + ')} · ${g.why} · ${g.maxTouches} touch(es)`);
        lines.push(`      ${g.phone || 'no phone'}  ${g.email || ''}`);
      }
    }
    lines.push('');
  }
  if (stale.length) {
    lines.push(`== ALREADY FLAGGED — archive or final call (${stale.length}, ${money(stale.reduce((s, g) => s + g.value, 0))})`);
    for (const g of stale) lines.push(`  ${g.client} — ${ageStr(g.ageH)} · ${money(g.value)} · ${g.owner} · ${g.phone || 'no phone'}`);
    lines.push('');
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------- main

async function main() {
  if (TEST_EMAIL) {
    if (!EMAIL_READY) { console.log('!! EMAIL NOT CONFIGURED — set LEAD_ALERT_SMTP_USER / LEAD_ALERT_SMTP_PASS in .env'); process.exit(1); }
    await sendMail({ ...SMTP, subject: 'Quote chase — SMTP test', html: '<p>Quote chase SMTP test. If you got this, delivery works.</p>' });
    console.log(`Test email sent to: ${SMTP.to.join(', ')}`);
    return;
  }

  const now = Date.now();
  const since = new Date(now - LOOKBACK_DAYS * 24 * H).toISOString();
  const open = await fetchOpenQuotes(since);
  const touches = await fetchTouches(open);
  const all = classify(open, touches, now);

  // Split off dead-tier quotes that have already had their full airing.
  const state = loadState();
  const keyOf = (g) => g.quotes.map((q) => q.quoteNumber).sort().join('+');
  const groups = [], stale = [];
  for (const g of all) {
    const seenBefore = Boolean(state.seen[keyOf(g)]);
    (g.tier === 'dead' && seenBefore ? stale : groups).push(g);
  }
  stale.sort((a, b) => b.value - a.value);

  if (AS_JSON) { console.log(JSON.stringify({ generatedAt: new Date(now).toISOString(), openQuotesScanned: open.length, groups, stale }, null, 2)); return; }

  if (!groups.length && !stale.length) { console.log(`No quotes to chase. (${open.length} open quotes scanned, all either opened and followed up, or under ${CHASE_AFTER_H}h old.) [SILENT]`); return; }
  if (!groups.length) { console.log(`Nothing new to chase — ${stale.length} previously-flagged quote(s) still open. [SILENT]`); return; }

  const total = money(groups.reduce((s, g) => s + g.value, 0));
  const dead = groups.filter((g) => g.tier === 'dead').length;
  const subject = `Quote chase — ${groups.length} quiet quote${groups.length === 1 ? '' : 's'}, ${total}${dead ? ` (${dead} past 5 days)` : ''}`;

  console.log(renderText(groups, stale, now));
  console.log(`Scanned ${open.length} open quotes over the last ${LOOKBACK_DAYS} days.`);

  if (DRY_RUN || NO_EMAIL) { console.log(`\n[dry run] Would email "${subject}" to: ${SMTP.to.join(', ')}`); return; }
  if (!EMAIL_READY) { console.log('!! EMAIL NOT CONFIGURED — set LEAD_ALERT_SMTP_USER / LEAD_ALERT_SMTP_PASS in .env'); process.exit(1); }

  let delivered = false;
  try {
    await sendMail({ ...SMTP, subject, html: renderHtml(groups, stale, now), text: renderText(groups, stale, now) });
    console.log(`\nEmailed to ${SMTP.to.join(', ')}`);
    delivered = true;
  } catch (err) {
    console.log(`\n!! EMAIL FAILED: ${err.message}`);
    process.exitCode = 1;
  }

  // Only mark quotes as "aired" once the email actually left. A failed send that still
  // advanced the state would demote a dead quote to a one-liner nobody ever read in full.
  if (delivered) {
    for (const g of groups) {
      if (g.tier !== 'dead') continue;
      state.seen[keyOf(g)] = { firstReported: new Date(now).toISOString(), client: g.client, value: g.value };
    }
    // Forget quotes that have left the open set, so a re-quoted customer airs again.
    const live = new Set(all.map(keyOf));
    for (const k of Object.keys(state.seen)) if (!live.has(k)) delete state.seen[k];
    saveState(state);
  }

  try {
    fs.mkdirSync(RUNS_DIR, { recursive: true });
    fs.writeFileSync(path.join(RUNS_DIR, `${new Date(now).toISOString().slice(0, 10)}.json`),
      JSON.stringify({ generatedAt: new Date(now).toISOString(), scanned: open.length, groups }, null, 1));
  } catch { /* the report already went out; a log failure must not fail the run */ }
}

main().catch((err) => { console.log(`!! ERROR: ${err.message}`); process.exit(1); });
