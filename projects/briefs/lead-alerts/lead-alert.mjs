#!/usr/bin/env node
// Got Moles — New Lead Alert (local cron edition)
//
// Polls Jobber for newly created clients, decides which are inbound leads worth a
// callback, and emails Spencer. Ported from n8n workflow LGD33gS2IupDhUi0, which
// could never be activated: n8n and this machine share one Jobber OAuth app, and
// Jobber invalidates the old refresh token whenever the app is re-authorized, so
// only one side can hold a live token at a time. This machine holds it, so the
// alert runs here.
//
// Jobber auth is delegated to .claude/skills/tool-jobber/scripts/jobber-api.mjs so
// there is exactly ONE implementation of token refresh/rotation in the repo. Do not
// re-implement it here — a second refresher is how the n8n credential died.
//
// Usage:
//   node projects/briefs/lead-alerts/lead-alert.mjs              # normal poll (cron)
//   node projects/briefs/lead-alerts/lead-alert.mjs --dry-run    # no email, no state write
//   node projects/briefs/lead-alerts/lead-alert.mjs --prime      # mark current window seen, alert nothing
//   node projects/briefs/lead-alerts/lead-alert.mjs --window-hours 168 --dry-run   # backfill review
//   node projects/briefs/lead-alerts/lead-alert.mjs --test-email # SMTP check, no Jobber call
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { sendMail } from './send-mail.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..', '..');
const JOBBER_CLI = path.join(ROOT, '.claude', 'skills', 'tool-jobber', 'scripts', 'jobber-api.mjs');
const STATE_PATH = path.join(HERE, 'state.json');
const RUNS_DIR = path.join(HERE, 'runs');

// ---------------------------------------------------------------- args + env

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const val = (f, d) => {
  const i = argv.indexOf(f);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};

const DRY_RUN = has('--dry-run');
const PRIME = has('--prime');
const TEST_EMAIL = has('--test-email');
const NO_EMAIL = has('--no-email');
const AS_JSON = has('--json');
const WINDOW_HOURS = Number(val('--window-hours', '3'));

function loadEnv() {
  const p = path.join(ROOT, '.env');
  const env = {};
  if (!fs.existsSync(p)) return env;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}
const env = loadEnv();

const SMTP = {
  host: env.LEAD_ALERT_SMTP_HOST || 'smtp.gmail.com',
  port: env.LEAD_ALERT_SMTP_PORT || 465,
  user: env.LEAD_ALERT_SMTP_USER || '',
  pass: env.LEAD_ALERT_SMTP_PASS || '',
  to: env.LEAD_ALERT_TO || env.LEAD_ALERT_SMTP_USER || '',
};
const EMAIL_READY = Boolean(SMTP.user && SMTP.pass && SMTP.to);

// ---------------------------------------------------------------- tuning

const WINDOW_MS = WINDOW_HOURS * 60 * 60 * 1000;
const DEDUPE_MS = 48 * 60 * 60 * 1000; // same phone twice inside 48h = one lead
const JUNK_HOLD_MS = 70 * 60 * 1000;   // let the CallRail sync repair caller-ID stubs first
const SEEN_ID_CAP = 400;

const JUNK_NAME = /^(wireless caller|unknown|unknown caller|no caller id|restricted|anonymous)$/i;
const CITY_ONLY = /^[a-z .'-]+\s+wa$/i;

// Overseas SEO/marketing spam hits the website form regularly (the 2026-07-28 sweep
// caught one in 21). Flag, never drop — a heuristic must not eat a real customer.
// A usable US number is 10 digits, or 11 starting with the country code 1.
function isSuspectPhone(phone) {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  return !(digits.length === 10 || (digits.length === 11 && digits.startsWith('1')));
}

// ---------------------------------------------------------------- state

function readState() {
  try {
    const s = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    return { seenIds: [], seenPhones: {}, primed: false, ...s };
  } catch {
    return { seenIds: [], seenPhones: {}, primed: false };
  }
}
function writeState(state) {
  if (DRY_RUN) return;
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n');
}

// ---------------------------------------------------------------- jobber

function jobberQuery(query) {
  return new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      [JOBBER_CLI, 'query', query],
      { cwd: ROOT, maxBuffer: 10 * 1024 * 1024, timeout: 120000 },
      (err, stdout, stderr) => {
        if (err) return reject(new Error(`Jobber query failed: ${(stderr || err.message).trim().slice(0, 500)}`));
        try {
          resolve(JSON.parse(stdout));
        } catch {
          reject(new Error(`Jobber returned non-JSON: ${stdout.slice(0, 300)}`));
        }
      }
    );
  });
}

async function fetchRecentClients(sinceIso, maxPages = 10) {
  const nodes = [];
  let after = null;

  // A normal 3h poll is one page. Pagination exists so a long --window-hours
  // backfill (or a bulk import day) is not silently truncated at 50 records.
  for (let page = 0; page < maxPages; page++) {
    const cursor = after ? `, after: "${after}"` : '';
    const query = `query {
  clients(first: 50${cursor}, filter: {createdAt: {after: "${sinceIso}"}}) {
    nodes {
      id
      name
      firstName
      lastName
      createdAt
      isLead
      emails { address }
      phones { number }
      billingAddress { street city postalCode }
    }
    pageInfo { hasNextPage endCursor }
  }
}`;
    const data = await jobberQuery(query);
    nodes.push(...(data?.clients?.nodes ?? []));
    const info = data?.clients?.pageInfo;
    if (!info?.hasNextPage || !info.endCursor) return nodes;
    after = info.endCursor;
  }

  console.error(`!! WARNING: stopped after ${maxPages} pages — window may be truncated.`);
  return nodes;
}

// ---------------------------------------------------------------- lead picking

function clientUrl(gid) {
  // gid://Jobber/Client/147619393 arrives base64-encoded
  try {
    const numeric = Buffer.from(gid, 'base64').toString('utf8').split('/').pop();
    if (numeric && /^\d+$/.test(numeric)) return `https://secure.getjobber.com/clients/${numeric}`;
  } catch { /* fall through */ }
  return 'https://secure.getjobber.com/clients';
}

function ptTime(iso) {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function pickLeads(nodes, state, now) {
  const seenIds = new Set(state.seenIds);
  const leads = [];
  const skipped = { alreadySeen: 0, existingCustomer: 0, noContact: 0, heldStub: 0, dupePhone: 0 };

  for (const c of nodes) {
    if (seenIds.has(c.id)) { skipped.alreadySeen++; continue; }

    const email = c.emails?.[0]?.address || '';
    const phone = c.phones?.[0]?.number || '';
    const street = c.billingAddress?.street || '';
    const name = (c.name || `${c.firstName || ''} ${c.lastName || ''}`).trim();
    const createdMs = new Date(c.createdAt).getTime();

    // Has a real address and is not flagged as a lead => office data entry on an
    // existing customer, not someone sitting waiting for a callback.
    if (!c.isLead && street) { seenIds.add(c.id); skipped.existingCustomer++; continue; }
    if (!email && !phone) { seenIds.add(c.id); skipped.noContact++; continue; }

    const junk = JUNK_NAME.test(name) || CITY_ONLY.test(name) || /,.*\bN\/A\b/i.test(name);

    // Caller-ID stub ("Wireless Caller", "Kent Wa", "Smith,John N/A"): hold briefly.
    // The CallRail sync usually lands a properly named record for the same number
    // within the hour and we would rather alert with the real name. Deliberately
    // NOT marked seen, so a later poll picks it up either way.
    if (junk && now - createdMs < JUNK_HOLD_MS) { skipped.heldStub++; continue; }

    const last10 = phone.replace(/\D/g, '').slice(-10);
    if (last10.length === 10) {
      const priorTs = state.seenPhones[last10];
      if (priorTs && now - priorTs < DEDUPE_MS) { seenIds.add(c.id); skipped.dupePhone++; continue; }
      state.seenPhones[last10] = now;
    }

    seenIds.add(c.id);

    let source;
    if (email && !street && !junk) source = 'Website form (likely)';
    else if (junk) source = 'Phone lead — caller ID only';
    else source = 'New lead';

    leads.push({
      id: c.id,
      name: name || '(no name given)',
      email,
      phone,
      address: [street, c.billingAddress?.city, c.billingAddress?.postalCode].filter(Boolean).join(', '),
      source,
      suspect: isSuspectPhone(phone),
      createdAt: c.createdAt,
      createdPT: ptTime(c.createdAt),
      jobberUrl: clientUrl(c.id),
    });
  }

  // Trim suppression state so it cannot grow without bound.
  state.seenIds = [...seenIds].slice(-SEEN_ID_CAP);
  const cutoff = now - DEDUPE_MS;
  for (const [k, ts] of Object.entries(state.seenPhones)) {
    if (ts < cutoff) delete state.seenPhones[k];
  }

  // Website-form leads first — those are the ones that were going unnoticed.
  // Suspected spam sinks to the bottom regardless of source.
  const rank = (l) => (l.suspect ? 3 : l.source.startsWith('Website') ? 0 : l.source.startsWith('New') ? 1 : 2);
  leads.sort((a, b) => rank(a) - rank(b) || new Date(a.createdAt) - new Date(b.createdAt));

  return { leads, skipped };
}

// ---------------------------------------------------------------- rendering

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function buildSubject(leads) {
  // Count real leads in the subject; flagged spam should never inflate the number
  // Spencer reacts to, but it still rides along in the body.
  const real = leads.filter((l) => !l.suspect);
  const shown = real.length ? real : leads;
  const tail = real.length && real.length < leads.length ? ` (+${leads.length - real.length} flagged)` : '';
  if (shown.length === 1) {
    return `New lead: ${shown[0].name}${shown[0].phone ? ' — ' + shown[0].phone : ''}${tail}`;
  }
  return `${shown.length} new leads: ${shown.map((l) => l.name).join(', ').slice(0, 80)}${tail}`;
}

function buildHtml(leads) {
  const blocks = leads.map((l) => `
  <div style="border-left:4px solid ${l.suspect ? '#b08a2e' : '#2f6f3e'};padding:12px 16px;margin:0 0 18px;background:${l.suspect ? '#fbf7ec' : '#f6f8f6'};">
    <div style="font-size:18px;font-weight:700;color:#14311d;">${esc(l.name)}</div>
    <div style="font-size:13px;color:#5b6b5f;margin:2px 0 10px;">${esc(l.source)} &middot; ${esc(l.createdPT)} PT</div>
    ${l.suspect ? '<div style="font-size:13px;font-weight:700;color:#8a6d1c;margin:0 0 10px;">⚠ Possible spam — phone is not a US number</div>' : ''}
    ${l.phone
      ? `<div style="margin:4px 0;"><a href="tel:${l.phone.replace(/[^\d+]/g, '')}" style="font-size:17px;font-weight:700;color:#2f6f3e;text-decoration:none;">${esc(l.phone)}</a></div>`
      : '<div style="margin:4px 0;color:#8a1c1c;">No phone number on the record</div>'}
    ${l.email ? `<div style="margin:4px 0;"><a href="mailto:${esc(l.email)}" style="color:#2f6f3e;">${esc(l.email)}</a></div>` : ''}
    ${l.address ? `<div style="margin:4px 0;color:#3d4a41;">${esc(l.address)}</div>` : ''}
    <div style="margin:12px 0 0;"><a href="${l.jobberUrl}" style="background:#2f6f3e;color:#ffffff;padding:8px 14px;border-radius:4px;text-decoration:none;font-size:14px;display:inline-block;">Open in Jobber</a></div>
  </div>`).join('');

  return `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:560px;">
  <p style="font-size:15px;color:#14311d;margin:0 0 16px;">${leads.length === 1 ? 'A new lead just came in.' : leads.length + ' new leads just came in.'} Call back while they are still shopping.</p>
  ${blocks}
  <p style="font-size:12px;color:#8a948c;border-top:1px solid #e2e7e3;padding-top:10px;">Got Moles lead alert &middot; polls Jobber on a schedule &middot; Agentic OS cron</p>
</div>`;
}

function buildText(leads) {
  return leads.map((l) => [
    l.suspect ? `${l.name}  [POSSIBLE SPAM — non-US phone]` : l.name,
    `  ${l.source} · ${l.createdPT} PT`,
    l.phone ? `  ${l.phone}` : '  NO PHONE ON RECORD',
    l.email ? `  ${l.email}` : null,
    l.address ? `  ${l.address}` : null,
    `  ${l.jobberUrl}`,
  ].filter(Boolean).join('\n')).join('\n\n');
}

// ---------------------------------------------------------------- run log

function logRun(entry) {
  if (DRY_RUN) return;
  fs.mkdirSync(RUNS_DIR, { recursive: true });
  const file = path.join(RUNS_DIR, `${new Date().toISOString().slice(0, 10)}.jsonl`);
  fs.appendFileSync(file, JSON.stringify(entry) + '\n');
}

// ---------------------------------------------------------------- main

async function main() {
  if (TEST_EMAIL) {
    if (!EMAIL_READY) {
      console.log('EMAIL NOT CONFIGURED — set LEAD_ALERT_SMTP_USER, LEAD_ALERT_SMTP_PASS, LEAD_ALERT_TO in .env');
      process.exit(1);
    }
    await sendMail({
      ...SMTP,
      subject: 'Got Moles lead alert — test',
      html: '<p>Lead alert email is wired up correctly. Real alerts will look like this.</p>',
    });
    console.log(`Test email sent to ${SMTP.to}.`);
    return;
  }

  const now = Date.now();
  const sinceIso = new Date(now - WINDOW_MS).toISOString().replace(/\.\d{3}Z$/, 'Z');
  const state = readState();

  const nodes = await fetchRecentClients(sinceIso);
  const { leads, skipped } = pickLeads(nodes, state, now);

  // First real run: mark the current window as already-handled instead of firing a
  // burst of alerts for leads Spencer has already dealt with.
  const priming = PRIME || (!state.primed && !DRY_RUN);
  if (priming) {
    state.primed = true;
    writeState(state);
    const msg = `Primed: ${leads.length} existing lead(s) in the last ${WINDOW_HOURS}h marked as already-seen. No alert sent. Alerts start from the next run.`;
    logRun({ at: new Date().toISOString(), primed: true, marked: leads.length });
    console.log(AS_JSON ? JSON.stringify({ primed: true, marked: leads.length }) : msg);
    return;
  }

  state.lastRun = new Date().toISOString();

  if (!leads.length) {
    writeState(state);
    if (AS_JSON) {
      console.log(JSON.stringify({ count: 0, skipped }));
    } else {
      console.log(`No new leads in the last ${WINDOW_HOURS}h. (scanned ${nodes.length} recent client records; held ${skipped.heldStub} caller-ID stub(s))`);
    }
    return;
  }

  const subject = buildSubject(leads);
  const html = buildHtml(leads);
  const text = buildText(leads);

  let emailed = false;
  let emailError = null;
  if (!NO_EMAIL && !DRY_RUN && EMAIL_READY) {
    try {
      await sendMail({ ...SMTP, subject, html, text });
      emailed = true;
    } catch (err) {
      emailError = err.message;
    }
  }

  // Only commit suppression state once delivery has been attempted. If the email
  // failed we still mark them seen (the leads are printed here and land in the
  // cron notification + run log), but the failure is surfaced loudly so a broken
  // mailbox never turns into leads silently disappearing.
  writeState(state);
  logRun({ at: new Date().toISOString(), count: leads.length, emailed, emailError, leads });

  if (AS_JSON) {
    console.log(JSON.stringify({ count: leads.length, emailed, emailError, leads }, null, 2));
    return;
  }

  console.log(`${leads.length} NEW LEAD${leads.length === 1 ? '' : 'S'}\n`);
  console.log(text);
  console.log('');
  if (emailed) console.log(`Emailed to ${SMTP.to}.`);
  else if (emailError) console.log(`!! EMAIL FAILED: ${emailError}\n!! The leads above were NOT emailed — follow up from this output.`);
  else if (!EMAIL_READY) console.log('!! EMAIL NOT CONFIGURED — leads reported here only. Set LEAD_ALERT_SMTP_* in .env.');
  else if (DRY_RUN || NO_EMAIL) console.log('(email suppressed by flag)');
}

main().catch((err) => {
  console.error(`!! ERROR: ${err.message}`);
  process.exit(1);
});
