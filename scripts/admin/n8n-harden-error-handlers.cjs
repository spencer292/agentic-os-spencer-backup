/**
 * Harden the estate's two error handlers so a transient Gmail failure does not
 * swallow an alert.
 *
 * WHY (2026-08-12): `90 Podcast - Error Handler` and `Error Notification` are the
 * only things that tell Roy a workflow failed, and each was a bare
 * `errorTrigger -> gmail` with `retryOnFail: false`. One flaky send and the alert
 * is gone — the underlying failure still happened, but nobody hears about it.
 *
 * This adds retry to the send. It does NOT solve the deeper problem, which is
 * recorded here so it is not forgotten: BOTH handlers, and the daily estate audit,
 * authenticate with the SAME Gmail credential (wa0yZ2ZcsSUmWqpG). If that token
 * expires, every alerting path in the estate goes quiet at once and the silence
 * reads exactly like "nothing is wrong". Retry does not help there. The fix is an
 * alert channel that does not depend on n8n or on that credential — see the
 * recommendation in projects/briefs/n8n-audit/.
 *
 * Usage: node scripts/admin/n8n-harden-error-handlers.cjs [--dry]
 */
'use strict';

const fs = require('fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const env = { ...process.env };
try {
  for (const l of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* rely on process.env */ }

const BASE = 'https://allthepower.app.n8n.cloud/api/v1';
const H = { 'X-N8N-API-KEY': env.N8N_API_KEY, 'Content-Type': 'application/json' };
const HANDLERS = [
  ['7P8rKQ3agA3rXTzk', '90 Podcast - Error Handler'],
  ['PcVD0vktcyopmglEmQLef', 'Error Notification'],
];
const DRY = process.argv.includes('--dry');

async function api(method, p, body) {
  const r = await fetch(`${BASE}${p}`, { method, headers: H, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const text = await r.text();
  return { ok: r.ok, status: r.status, text, json: (() => { try { return JSON.parse(text); } catch { return null; } })() };
}

(async () => {
  if (!env.N8N_API_KEY) { console.error('N8N_API_KEY missing'); process.exit(1); }

  for (const [id, label] of HANDLERS) {
    const full = (await api('GET', `/workflows/${id}`)).json;
    if (!full) { console.error(`  ! ${label}: could not read`); continue; }
    const wasActive = full.active;

    let changed = 0;
    const nodes = full.nodes.map((n) => {
      if (!/gmail|slack|telegram/i.test(n.type)) return n;
      if (n.retryOnFail === true && n.maxTries >= 3) return n;
      changed++;
      return { ...n, retryOnFail: true, maxTries: 3, waitBetweenTries: 5000 };
    });

    // An error handler that refuses the call is worse than no handler: the caller
    // records a failure, the handler records a failure, and nobody is told anything.
    // With callerPolicy unset n8n applies its instance default (same-owner), so a
    // workflow in another project is REFUSED with:
    //   "Another workflow tried to invoke this workflow to handle errors.
    //    Unfortunately current permissions do not allow this."
    // Proven live: a test workflow in ATP-Production was refused by Error Notification.
    // These handlers only email Roy, so there is no reason to restrict who may call them.
    const settings = { ...(full.settings || {}) };
    const policyWasWrong = settings.callerPolicy !== 'any';
    settings.callerPolicy = 'any';
    if (policyWasWrong) changed++;

    console.log(`${label}: ${changed} change(s) (active=${wasActive}, callerPolicy was ${full.settings?.callerPolicy || 'unset/default'})`);
    if (!changed || DRY) continue;

    const put = await api('PUT', `/workflows/${id}`, {
      name: full.name, nodes, connections: full.connections, settings,
    });
    if (!put.ok) { console.error(`  ! PUT ${put.status}: ${put.text.slice(0, 160)}`); continue; }

    const after = (await api('GET', `/workflows/${id}`)).json;
    if (wasActive && !after.active) {
      const act = await api('POST', `/workflows/${id}/activate`);
      console.log(`  re-activated (${act.status})`);
    }
    const check = (await api('GET', `/workflows/${id}`)).json;
    const sends = check.nodes.filter((n) => /gmail|slack|telegram/i.test(n.type));
    const ok = sends.every((n) => n.retryOnFail === true)
      && check.settings?.callerPolicy === 'any'
      && check.active === wasActive;
    console.log(`  ${ok ? 'ok' : 'FAIL'}  retryOnFail=${sends.map((n) => n.retryOnFail).join(',')}  callerPolicy=${check.settings?.callerPolicy}  active=${check.active}`);
  }

  if (DRY) console.log('\nDRY RUN — nothing changed.');
  else {
    console.log('\nNOTE: retry does not cover the real single point of failure —');
    console.log('both handlers AND the daily estate audit use the same Gmail credential.');
    console.log('An expired token silences the whole estate at once.');
  }
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
