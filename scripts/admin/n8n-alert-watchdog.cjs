/**
 * Independent watchdog for the n8n alerting path.
 *
 * WHY (2026-08-12): every alert the estate can raise depends on n8n being healthy
 * AND on one Gmail credential. Both error handlers and the daily estate audit send
 * through `Gmail account` (wa0yZ2ZcsSUmWqpG). If that token expires, or n8n refuses
 * the handler call, or n8n is simply down, every alerting path goes quiet at once —
 * and that silence is indistinguishable from "nothing is wrong".
 *
 * So this watchdog deliberately lives OUTSIDE n8n: it runs on Roy's machine from
 * cron, talks to n8n read-only over the API, and notifies over Telegram. It shares
 * no credential and no runtime with the thing it watches. A watchdog inside the
 * system it monitors is not a watchdog.
 *
 * The load-bearing check is the CROSS-CHECK: for every failed execution, was a
 * handler actually invoked shortly afterwards? An errorWorkflow that is set but
 * refused (caller policy) or whose send fails produces exactly the same visible
 * state as a healthy estate — a failure logged, and no email. Counting errors alone
 * would not catch that; pairing errors to handler runs does.
 *
 * KNOWN LIMIT, stated rather than hidden: this only runs while the machine is on.
 * It closes the "n8n or Gmail is broken" gap, not the "laptop is shut" gap.
 *
 * Usage:
 *   node scripts/admin/n8n-alert-watchdog.cjs            # check + notify on problems
 *   node scripts/admin/n8n-alert-watchdog.cjs --dry      # report, never send
 *   node scripts/admin/n8n-alert-watchdog.cjs --test     # prove the Telegram path works
 */
'use strict';

const fs = require('fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const env = { ...process.env };
// Root .env holds N8N_API_KEY. The Telegram bridge keeps its own .env alongside the
// daemon (it self-writes TELEGRAM_ALLOWED_CHAT_ID on first contact), so read both —
// the whole point of this watchdog is to use a channel the estate does not share.
for (const p of [path.join(ROOT, '.env'), path.join(ROOT, 'projects', 'briefs', 'telegram-bridge', '.env')]) {
  try {
    for (const l of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch { /* file may not exist */ }
}

const BASE = 'https://allthepower.app.n8n.cloud/api/v1';
const H = { 'X-N8N-API-KEY': env.N8N_API_KEY, accept: 'application/json' };
const HANDLERS = { PcVD0vktcyopmglEmQLef: 'Error Notification', '7P8rKQ3agA3rXTzk': '90 Podcast - Error Handler' };
const AUDIT_ID = 'lvbcw3D5As5hUHj7';
const STATE = path.join(ROOT, 'cron', 'state', 'n8n-alert-watchdog.json');

const DRY = process.argv.includes('--dry');
const TEST = process.argv.includes('--test');

/** Handler must run within this long of the failure to count as "alerted". */
const PAIR_WINDOW_MS = 5 * 60 * 1000;
/** How far back to look each run. */
const LOOKBACK_MS = 6 * 60 * 60 * 1000;
/** The daily audit is late past this. */
const AUDIT_STALE_H = 30;

async function telegram(text) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_ALLOWED_CHAT_ID;
  if (!token || !chatId) return { ok: false, why: 'TELEGRAM_BOT_TOKEN / TELEGRAM_ALLOWED_CHAT_ID not set in .env' };
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  });
  return { ok: r.ok, why: r.ok ? '' : `HTTP ${r.status} ${(await r.text()).slice(0, 160)}` };
}

const readState = () => { try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch { return { notified: [] }; } };
const writeState = (s) => { fs.mkdirSync(path.dirname(STATE), { recursive: true }); fs.writeFileSync(STATE, JSON.stringify(s, null, 2)); };

(async () => {
  if (TEST) {
    const r = await telegram('n8n alert watchdog: test message. If you can read this, the independent alert channel works.');
    console.log(r.ok ? 'Telegram OK — independent channel is live.' : `Telegram FAILED — ${r.why}`);
    process.exit(r.ok ? 0 : 1);
  }

  const problems = [];
  const state = readState();
  const now = Date.now();

  // 1. Can we reach n8n at all? If not, nothing else here is meaningful.
  let workflows;
  try {
    const r = await fetch(`${BASE}/workflows?limit=250`, { headers: H });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    workflows = (await r.json()).data || [];
  } catch (e) {
    const msg = `n8n UNREACHABLE from the watchdog: ${e.message}. No automation can be assumed to be running.`;
    console.error(msg);
    if (!DRY) await telegram(`[n8n watchdog]\n${msg}`);
    process.exit(1);
  }
  const names = Object.fromEntries(workflows.map((w) => [w.id, w.name]));

  // 2. Recent executions.
  const ex = ((await (await fetch(`${BASE}/executions?limit=250`, { headers: H })).json()).data) || [];
  const at = (e) => new Date(e.startedAt || e.stoppedAt || 0).getTime();
  const recent = ex.filter((e) => at(e) > now - LOOKBACK_MS);

  const handlerRuns = recent.filter((e) => HANDLERS[e.workflowId]);
  const failures = recent.filter((e) => (e.status === 'error' || e.status === 'crashed') && !HANDLERS[e.workflowId]);

  // 3. THE CROSS-CHECK — a failure with no handler run after it was never reported.
  const unreported = failures.filter((f) => !handlerRuns.some((h) => {
    const d = at(h) - at(f);
    return d >= 0 && d <= PAIR_WINDOW_MS;
  }));
  if (unreported.length) {
    problems.push(`${unreported.length} failed execution(s) with NO alert raised:\n`
      + unreported.slice(0, 8).map((f) => `  · ${names[f.workflowId] || f.workflowId} (exec ${f.id}, ${f.startedAt})`).join('\n'));
  }

  // 4. Did the alert path itself fail? This is the case email can never tell you about.
  const brokenHandlers = handlerRuns.filter((h) => h.status === 'error' || h.status === 'crashed');
  if (brokenHandlers.length) {
    problems.push(`the ALERT PATH itself failed ${brokenHandlers.length} time(s) — errors are not reaching you:\n`
      + brokenHandlers.slice(0, 5).map((h) => `  · ${HANDLERS[h.workflowId]} (exec ${h.id})`).join('\n'));
  }

  // 5. Is every active workflow still covered? Coverage silently regresses on edit.
  let uncovered = 0;
  for (const w of workflows.filter((x) => x.active && !String(x.name).startsWith('ZZ TEMP'))) {
    const full = await (await fetch(`${BASE}/workflows/${w.id}`, { headers: H })).json();
    if (!full.settings?.errorWorkflow) uncovered++;
  }
  if (uncovered) problems.push(`${uncovered} active workflow(s) have no errorWorkflow — they fail silently.`);

  // 6. Leaked throwaway workflows creeping back.
  const temps = workflows.filter((w) => String(w.name || '').startsWith('ZZ TEMP'));
  if (temps.length > 25) problems.push(`${temps.length} ZZ TEMP throwaway workflows on the instance — teardown is failing again.`);

  // 7. Has the daily audit actually run?
  const auditRuns = ex.filter((e) => e.workflowId === AUDIT_ID);
  const lastAudit = auditRuns.length ? Math.max(...auditRuns.map(at)) : 0;
  const auditAgeH = (now - lastAudit) / 3600000;
  if (!lastAudit || auditAgeH > AUDIT_STALE_H) {
    problems.push(`daily estate audit has not run for ${lastAudit ? auditAgeH.toFixed(1) + 'h' : 'as long as the sample covers'}.`);
  }

  const summary = problems.length
    ? `[n8n watchdog] ${problems.length} problem(s):\n\n${problems.join('\n\n')}`
    : `[n8n watchdog] clean — ${workflows.filter((w) => w.active).length} active workflows, `
      + `${failures.length} failure(s) in ${LOOKBACK_MS / 3600000}h, all reported, audit ${auditAgeH.toFixed(1)}h ago.`;
  console.log(summary);

  if (!problems.length) { writeState({ ...state, lastCleanAt: new Date(now).toISOString() }); return; }

  // Only notify about things not already notified, so a standing problem does not
  // re-ping every run — but re-raise daily so it cannot be forgotten.
  const key = problems.join('|').slice(0, 400);
  const lastSame = state.lastKey === key ? new Date(state.lastNotifiedAt || 0).getTime() : 0;
  if (now - lastSame < 20 * 3600 * 1000) {
    console.log('(same problem already notified within 20h — not re-sending)');
    return;
  }
  if (DRY) { console.log('\nDRY RUN — would have sent the above.'); return; }

  const sent = await telegram(summary);
  console.log(sent.ok ? 'Telegram notified.' : `Telegram FAILED — ${sent.why}`);
  writeState({ ...state, lastKey: key, lastNotifiedAt: new Date(now).toISOString() });
  process.exitCode = 1;
})().catch((e) => { console.error('watchdog FAILED:', e.message); process.exit(1); });
