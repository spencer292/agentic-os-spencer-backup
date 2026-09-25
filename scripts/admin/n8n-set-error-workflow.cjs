/**
 * Attach an errorWorkflow to every active workflow that lacks one.
 *
 * WHY (2026-08-12): an external audit found 32 of 45 active workflows with no
 * `settings.errorWorkflow`. Those fail SILENTLY — n8n records the failed execution
 * and tells nobody. The podcast chain (01-09) was already wired to
 * `90 Podcast - Error Handler`; everything else had nothing.
 *
 * Routing:
 *   - podcast chain (name starts with a two-digit number) -> 90 Podcast - Error Handler
 *   - everything else                                      -> Error Notification
 *   - the two handlers themselves                          -> each other (mutual cover)
 *
 * SAFETY: PUT /workflows/{id} replaces the whole workflow, and re-saving a live
 * workflow can disturb trigger registration. So this script:
 *   - writes a rollback snapshot of every workflow's prior settings BEFORE touching
 *     anything, and can restore from it (--rollback)
 *   - runs one workflow at a time (n8n sheds concurrent writes — see
 *     scripts/lib/n8n-temp-workflow.cjs for the measured limits)
 *   - preserves `active` and re-activates if a save drops it
 *   - verifies each change by re-reading the workflow, and stops on first failure
 *   - --canary applies to ONE frequently-scheduled workflow so you can confirm it
 *     still fires before touching the other 31
 *
 * Usage:
 *   node scripts/admin/n8n-set-error-workflow.cjs --dry
 *   node scripts/admin/n8n-set-error-workflow.cjs --canary
 *   node scripts/admin/n8n-set-error-workflow.cjs --apply
 *   node scripts/admin/n8n-set-error-workflow.cjs --rollback
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
const PODCAST_HANDLER = '7P8rKQ3agA3rXTzk';   // 90 Podcast - Error Handler
const GENERAL_HANDLER = 'PcVD0vktcyopmglEmQLef'; // Error Notification
const SNAPSHOT = path.join(ROOT, 'projects', 'briefs', 'n8n-audit', 'errorworkflow-rollback.json');
const CANARY_NAME = 'Quote Card Router'; // scheduled ~15 min: proves triggers survive a save

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const arg = (n) => process.argv.includes(n);

async function api(method, p, body) {
  const r = await fetch(`${BASE}${p}`, { method, headers: H, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const text = await r.text();
  return { ok: r.ok, status: r.status, text, json: (() => { try { return JSON.parse(text); } catch { return null; } })() };
}

async function listActive() {
  let all = [];
  let cursor;
  do {
    const r = await api('GET', `/workflows?limit=250${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
    if (!r.ok) throw new Error(`list ${r.status}`);
    all = all.concat(r.json.data || []);
    cursor = r.json.nextCursor;
  } while (cursor);
  return all.filter((w) => w.active && !String(w.name).startsWith('ZZ TEMP'));
}

function handlerFor(w) {
  if (w.id === PODCAST_HANDLER) return GENERAL_HANDLER;
  if (w.id === GENERAL_HANDLER) return PODCAST_HANDLER;
  return /^\d{2}\s/.test(w.name) ? PODCAST_HANDLER : GENERAL_HANDLER;
}

/** Set settings.errorWorkflow on one workflow, preserving everything else. */
async function applyOne(w, handlerId, log) {
  const full = (await api('GET', `/workflows/${w.id}`)).json;
  const wasActive = full.active;
  const body = {
    name: full.name,
    nodes: full.nodes,
    connections: full.connections,
    settings: { ...(full.settings || {}), errorWorkflow: handlerId },
  };
  const put = await api('PUT', `/workflows/${w.id}`, body);
  if (!put.ok) { log(`  ! ${w.name}: PUT ${put.status} ${put.text.slice(0, 140)}`); return false; }

  // A save can drop the active flag; put it back rather than leaving it off.
  const after = (await api('GET', `/workflows/${w.id}`)).json;
  if (wasActive && !after.active) {
    const act = await api('POST', `/workflows/${w.id}/activate`);
    log(`    re-activated (${act.status})`);
  }
  const check = (await api('GET', `/workflows/${w.id}`)).json;
  const ok = check.settings?.errorWorkflow === handlerId && check.active === wasActive;
  log(`  ${ok ? 'ok  ' : 'FAIL'} ${w.name}  -> ${handlerId}  (active ${check.active})`);
  return ok;
}

(async () => {
  if (!env.N8N_API_KEY) { console.error('N8N_API_KEY missing'); process.exit(1); }

  if (arg('--rollback')) {
    const snap = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'));
    console.log(`Restoring prior settings for ${snap.length} workflow(s)...`);
    for (const s of snap) {
      const full = (await api('GET', `/workflows/${s.id}`)).json;
      const body = { name: full.name, nodes: full.nodes, connections: full.connections, settings: s.settings };
      const r = await api('PUT', `/workflows/${s.id}`, body);
      console.log(`  ${r.ok ? 'ok  ' : 'FAIL'} ${s.name}`);
      await sleep(300);
    }
    return;
  }

  const active = await listActive();
  const missing = [];
  for (const w of active) {
    const full = (await api('GET', `/workflows/${w.id}`)).json;
    if (!full.settings?.errorWorkflow) missing.push({ ...w, settings: full.settings || {} });
  }

  console.log(`active: ${active.length} | already covered: ${active.length - missing.length} | to fix: ${missing.length}\n`);
  const plan = missing.map((w) => ({ ...w, handler: handlerFor(w) }));
  for (const p of plan) {
    console.log(`  ${p.name}  ->  ${p.handler === PODCAST_HANDLER ? '90 Podcast - Error Handler' : 'Error Notification'}`);
  }

  if (arg('--dry')) { console.log('\nDRY RUN — nothing changed.'); return; }

  // Rollback snapshot BEFORE any write.
  fs.mkdirSync(path.dirname(SNAPSHOT), { recursive: true });
  fs.writeFileSync(SNAPSHOT, JSON.stringify(plan.map((p) => ({ id: p.id, name: p.name, settings: p.settings })), null, 2));
  console.log(`\nRollback snapshot -> ${SNAPSHOT}`);

  const targets = arg('--canary')
    ? plan.filter((p) => p.name === CANARY_NAME)
    : plan;
  if (arg('--canary') && !targets.length) { console.error(`canary "${CANARY_NAME}" not in the list`); process.exit(1); }

  console.log(`\nApplying to ${targets.length} workflow(s), one at a time...`);
  let failed = 0;
  for (const t of targets) {
    const ok = await applyOne(t, t.handler, (m) => console.log(m));
    if (!ok) {
      failed++;
      console.error('\nStopping on first failure — nothing further will be touched.');
      console.error('Restore with: node scripts/admin/n8n-set-error-workflow.cjs --rollback');
      break;
    }
    await sleep(400);
  }
  console.log(`\nDone. ${targets.length - failed} applied, ${failed} failed.`);
  if (arg('--canary')) {
    console.log(`\nCANARY: confirm "${CANARY_NAME}" still fires on schedule before running --apply.`);
  }
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
