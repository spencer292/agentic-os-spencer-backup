/**
 * n8n throwaway-workflow helper — the ONE implementation.
 *
 * Several scripts need to call an API (Google Drive, mostly) using a credential
 * that lives in n8n and nowhere else. The trick is to create a tiny n8n workflow
 * with a webhook trigger + one credentialed httpRequest node, activate it, hit the
 * webhook, take the response, then destroy the workflow.
 *
 * WHY THIS FILE EXISTS (2026-08-11)
 * ---------------------------------
 * That helper had been copy-pasted into six scripts. Every copy ended with:
 *
 *     } finally { if (id) await fetch(`${N8N}/workflows/${id}`, { method: 'DELETE', headers }); }
 *
 * The DELETE result was never checked. n8n now refuses it outright:
 *
 *     409 "Cannot delete a published workflow. Unpublish it before deleting."
 *
 * Since the workflow is activated moments earlier, that fired on every single call.
 * From 2026-08-07 every temp workflow leaked, still ACTIVE, still holding a registered
 * webhook. By 2026-08-11 the instance held 4,652 junk workflows against 113 real ones,
 * and the weekly estate audit (which pages only the first 250 workflows) was drowning
 * in them. Confirmed live via the `doctor` command below, not inferred.
 *
 * The fix is not just "delete harder" — it is:
 *   1. tear down in the order n8n now requires: deactivate -> archive -> delete
 *   2. CHECK every response
 *   3. verify the workflow is actually gone
 *   4. shout loudly when it is not, so the next leak is caught on day one
 *
 * Nothing here throws on a failed teardown: a leaked temp workflow must never take
 * down a Drive sweep that is otherwise succeeding. It warns, and it counts.
 */

'use strict';

const N8N = 'https://allthepower.app.n8n.cloud/api/v1';
const WEBHOOK_BASE = 'https://allthepower.app.n8n.cloud/webhook';
const N8N_PROJECT = 'Dmp86aYd0evZH0Dr'; // ATP — Production
const DOCS_CRED = { googleDocsOAuth2Api: { id: 'MP5lsnBo4QJCHbdZ', name: 'Google Docs account 4' } };
const TEMP_PREFIX = 'ZZ TEMP';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Process-wide teardown tally, so a long run can report leaks at the end. */
const leakStats = { created: 0, destroyed: 0, leaked: 0, leakedIds: [] };

function makeHookPath(tag) {
  return `zz-${String(tag).toLowerCase()}-${process.pid}-${Date.now().toString(36)}`;
}

/** The webhook trigger node every temp workflow starts with. */
function hookNode(hookPath) {
  return {
    id: 'wh',
    name: 'Hook',
    type: 'n8n-nodes-base.webhook',
    typeVersion: 2,
    position: [0, 0],
    parameters: { httpMethod: 'GET', path: hookPath, responseMode: 'lastNode' },
  };
}

/**
 * A credentialed httpRequest node — the shape 5 of the 6 call sites use.
 * `responseFormat: 'text'` for raw bodies (VTT etc); `fullResponse` to see status codes.
 */
function httpNode({
  method, url, jsonBody, headers, fullResponse, responseFormat,
  id = 'call', name = 'Call', position = [220, 0], credentials = DOCS_CRED,
}) {
  const parameters = {
    method,
    url,
    authentication: 'predefinedCredentialType',
    nodeCredentialType: 'googleDocsOAuth2Api',
    options: {},
  };
  if (fullResponse) parameters.options = { response: { response: { fullResponse: true, neverError: true } } };
  else if (responseFormat) parameters.options = { response: { response: { responseFormat } } };
  if (headers) {
    parameters.sendHeaders = true;
    parameters.headerParameters = { parameters: headers };
  }
  if (jsonBody !== undefined) {
    parameters.sendBody = true;
    parameters.specifyBody = 'json';
    parameters.jsonBody = typeof jsonBody === 'string' ? jsonBody : JSON.stringify(jsonBody);
  }
  return { id, name, type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position, parameters, credentials };
}

async function apiCall(n8nBase, apiKey, method, pathSuffix, body) {
  const headers = { 'X-N8N-API-KEY': apiKey, 'Content-Type': 'application/json' };
  const res = await fetch(`${n8nBase}${pathSuffix}`, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  let text = '';
  try { text = await res.text(); } catch { /* body already consumed / empty */ }
  return { ok: res.ok, status: res.status, text };
}

/** n8n reports "still being unpublished" while deactivation settles — worth retrying. */
function isTransient({ status, text }) {
  return status === 409 && /still being unpublished|try again/i.test(String(text || ''));
}

/**
 * Destroy a temp workflow properly: deactivate -> archive -> delete -> verify.
 *
 * Each step tolerates failure, because n8n versions differ in what they require
 * and in what they consider an error (archiving an already-archived workflow is a
 * 200; deactivating an inactive one may 400). Only the FINAL verification decides
 * whether this leaked.
 *
 * Never throws. Returns { ok, status, steps }.
 */
async function destroyTempWorkflow({ id, apiKey, n8nBase = N8N, log = console.error, label = '' }) {
  if (!id) return { ok: true, steps: [], status: 'no-id' };
  const steps = [];
  const step = async (name, method, suffix) => {
    try {
      const r = await apiCall(n8nBase, apiKey, method, suffix);
      steps.push(`${name}:${r.status}`);
      return r;
    } catch (e) {
      steps.push(`${name}:EXC(${e.message})`);
      return { ok: false, status: 0, text: e.message };
    }
  };

  // 1. Deactivate — releases the registered webhook, and lifts the gate that makes a
  //    naive DELETE fail with:
  //      409 "Cannot delete a published workflow. Unpublish it before deleting."
  //    That 409 is the exact bug that leaked 4,652 workflows: the old code fired a bare
  //    DELETE at a live workflow and never looked at the response.
  await step('deactivate', 'POST', `/workflows/${id}/deactivate`);

  // 2. Archive — n8n's soft-delete, also required before a hard delete. Idempotent per
  //    the OpenAPI spec, so a repeat is a harmless 200.
  await step('archive', 'POST', `/workflows/${id}/archive`);

  // 3. Hard delete — with a bounded retry, because UNPUBLISHING IS ASYNC. Deleting too
  //    soon after deactivate returns:
  //      409 "Workflow is still being unpublished. Please try again in a few moments."
  //    Without this retry the teardown would pass or fail on timing luck and leak
  //    intermittently — the same silent failure mode, just rarer and harder to spot.
  let del = await step('delete', 'DELETE', `/workflows/${id}`);
  for (let i = 0; i < 4 && !del.ok && isTransient(del); i++) {
    await sleep(750 * (i + 1));
    del = await step(`delete-retry${i + 1}`, 'DELETE', `/workflows/${id}`);
  }

  // 4. Verify. A 404 here is success — anything else means it is still on the instance.
  let gone = del.ok;
  if (!gone) {
    const check = await step('verify', 'GET', `/workflows/${id}`);
    gone = check.status === 404;
  }

  if (gone) {
    leakStats.destroyed++;
    return { ok: true, steps, status: 'destroyed' };
  }

  leakStats.leaked++;
  if (leakStats.leakedIds.length < 50) leakStats.leakedIds.push(id);
  log(
    `  !! LEAKED temp workflow ${id}${label ? ` (${label})` : ''} — teardown [${steps.join(' ')}], `
    + `last body: ${String(del.text || '').slice(0, 200)}`
  );
  log('     Run: node scripts/lib/n8n-temp-workflow.cjs doctor   to diagnose.');
  return { ok: false, steps, status: 'leaked' };
}

/**
 * Full lifecycle: create -> transfer -> activate -> poll webhook -> destroy.
 *
 * `buildNodes(hookPath)` must return the node array (including the hook node).
 * Returns the raw response body as text; callers decide how to parse it.
 */
async function runTempWorkflow({
  apiKey,
  tag,
  buildNodes,
  connections,
  attempts = 20,
  delayMs = 1500,
  n8nBase = N8N,
  webhookBase = WEBHOOK_BASE,
  projectId = N8N_PROJECT,
  log = console.error,
}) {
  if (!apiKey) throw new Error('N8N_API_KEY missing — n8n-routed call unavailable');
  const hookPath = makeHookPath(tag);
  const wf = {
    name: `${TEMP_PREFIX} - ${String(tag).toUpperCase()} ${hookPath}`,
    settings: { executionOrder: 'v1' },
    nodes: buildNodes(hookPath),
    connections,
  };

  let id;
  try {
    const cr = await apiCall(n8nBase, apiKey, 'POST', '/workflows', wf);
    if (!cr.ok) throw new Error(`n8n create ${cr.status}: ${cr.text.slice(0, 200)}`);
    id = JSON.parse(cr.text).id;
    leakStats.created++;

    // Check these. An unchecked API response is exactly what caused the Aug 2026 leak;
    // the same blind spot here would silently produce a workflow that never runs.
    const tr = await apiCall(n8nBase, apiKey, 'PUT', `/workflows/${id}/transfer`, { destinationProjectId: projectId });
    if (!tr.ok && tr.status !== 204) log(`  ! n8n transfer ${tr.status}: ${tr.text.slice(0, 150)}`);
    const act = await apiCall(n8nBase, apiKey, 'POST', `/workflows/${id}/activate`);
    if (!act.ok) throw new Error(`n8n activate ${act.status}: ${act.text.slice(0, 200)}`);

    let out = '';
    let notRegistered = false;
    for (let i = 0; i < attempts; i++) {
      await sleep(delayMs);
      try {
        const run = await fetch(`${webhookBase}/${hookPath}`);
        out = await run.text();
        if (run.ok && out) return out;
        // n8n can report a workflow active while its webhook registry has not bound the
        // path. Polling to the end would then hand the caller a 404 error body dressed up
        // as data. Name it instead — it is an instance fault, not a bad response.
        notRegistered = run.status === 404 && /webhook .* is not registered/i.test(out);
      } catch { /* webhook not live yet */ }
    }
    if (notRegistered) {
      throw new Error(
        `n8n reported workflow ${id} active but never registered its webhook "${hookPath}". `
        + 'This is an instance-side fault: n8n-routed calls cannot work until it clears. '
        + 'Check with: node scripts/lib/n8n-temp-workflow.cjs doctor',
      );
    }
    return out;
  } finally {
    await destroyTempWorkflow({ id, apiKey, n8nBase, log, label: tag });
  }
}

/** Run `fn` over `items` with bounded concurrency, preserving order. */
async function mapLimit(items, concurrency, fn) {
  const out = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

/** List every workflow, following the cursor. The API caps a page at 250. */
async function listAllWorkflows({ apiKey, n8nBase = N8N }) {
  let all = [];
  let cursor;
  do {
    const r = await apiCall(n8nBase, apiKey, 'GET', `/workflows?limit=250${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
    if (!r.ok) throw new Error(`list workflows ${r.status}: ${r.text.slice(0, 200)}`);
    const j = JSON.parse(r.text);
    all = all.concat(j.data || []);
    cursor = j.nextCursor;
  } while (cursor);
  return all;
}

/**
 * Sweep leaked `ZZ TEMP` workflows off the instance.
 *
 * Deliberately phased rather than per-workflow teardown: unpublishing is ASYNC, so
 * deactivating all of them first, then archiving, then deleting, gives n8n time to
 * settle between stages and avoids thousands of "still being unpublished" retries.
 *
 * SAFETY:
 *  - only touches names beginning with `ZZ TEMP` — never a real workflow
 *  - skips anything created within `olderThanMinutes` so a CONCURRENT drain's
 *    in-flight temp workflow is never ripped out from under it
 *  - dry-run unless `apply` is true
 *  - idempotent: re-run to mop up anything that failed
 */
async function sweepLeakedTemps({
  apiKey, n8nBase = N8N, olderThanMinutes = 30, apply = false,
  // Concurrency 3 is measured, not guessed. n8n has a SHARED unpublish worker queue,
  // and pushing past ~3 concurrent deletes saturates it:
  //   concurrency 1 -> 24/24 ok in 28.7s
  //   concurrency 3 -> 24/24 ok in  8.1s   <- sweet spot
  //   concurrency 8 -> 10/24 ok in  2.3s   (14x 409 "still being unpublished")
  // Saturating that queue does collateral damage too: while it is backed up, n8n
  // cannot register NEW webhooks or schedule triggers, so unrelated workflows silently
  // fail to activate. Do not raise this to "go faster" — it goes slower and breaks things.
  concurrency = 3, log = console.log, nowMs = Date.now(),
}) {
  if (!apiKey) throw new Error('N8N_API_KEY missing');

  log('Listing workflows (paging through all of them)...');
  const all = await listAllWorkflows({ apiKey, n8nBase });
  const temps = all.filter((w) => String(w.name || '').startsWith(TEMP_PREFIX));
  const cutoff = nowMs - olderThanMinutes * 60000;
  const stale = temps.filter((w) => new Date(w.createdAt).getTime() < cutoff);
  const tooNew = temps.length - stale.length;

  log(`  total workflows : ${all.length}`);
  log(`  real workflows  : ${all.length - temps.length}`);
  log(`  ${TEMP_PREFIX} temps    : ${temps.length}`);
  log(`  sweepable       : ${stale.length}  (${tooNew} skipped as newer than ${olderThanMinutes}m — may be in flight)`);

  if (!stale.length) { log('\nNothing to sweep.'); return { swept: 0, failed: 0, remaining: temps.length }; }
  if (!apply) {
    log('\nDRY RUN — nothing changed. Re-run with --apply to remove them.');
    return { swept: 0, failed: 0, remaining: temps.length, wouldSweep: stale.length };
  }

  const active = stale.filter((w) => w.active);
  log(`\nPhase 1/3: deactivate ${active.length} active workflow(s)...`);
  let done = 0;
  await mapLimit(active, concurrency, async (w) => {
    await apiCall(n8nBase, apiKey, 'POST', `/workflows/${w.id}/deactivate`);
    if (++done % 250 === 0) log(`  deactivated ${done}/${active.length}`);
  });

  const toArchive = stale.filter((w) => !w.isArchived);
  log(`Phase 2/3: archive ${toArchive.length} workflow(s)...`);
  done = 0;
  await mapLimit(toArchive, concurrency, async (w) => {
    await apiCall(n8nBase, apiKey, 'POST', `/workflows/${w.id}/archive`);
    if (++done % 250 === 0) log(`  archived ${done}/${toArchive.length}`);
  });

  // Delete in repeated passes rather than retrying in line. Under concurrency the
  // API sheds a fraction of deletes (contention, not a real refusal — the same id
  // deletes fine on a second look). Backing off inside each call serialised the whole
  // sweep behind its slowest failures; sweeping the remainder again is far quicker.
  log(`Phase 3/3: delete ${stale.length} workflow(s)...`);
  let pending = stale;
  let failed = 0;
  const failures = [];
  for (let pass = 1; pass <= 5 && pending.length; pass++) {
    done = 0;
    const stillFailing = [];
    await mapLimit(pending, concurrency, async (w) => {
      const r = await apiCall(n8nBase, apiKey, 'DELETE', `/workflows/${w.id}`);
      if (!r.ok && r.status !== 404) {
        stillFailing.push(w);
        if (pass === 5 && failures.length < 20) failures.push(`${w.id} ${r.status} ${String(r.text).slice(0, 100)}`);
      }
      if (++done % 500 === 0) log(`  pass ${pass}: ${done}/${pending.length}`);
    });
    log(`  pass ${pass}: deleted ${pending.length - stillFailing.length}, ${stillFailing.length} left`);
    pending = stillFailing;
    if (pending.length) await sleep(2000);
  }
  failed = pending.length;

  const after = await listAllWorkflows({ apiKey, n8nBase });
  const remaining = after.filter((w) => String(w.name || '').startsWith(TEMP_PREFIX)).length;
  log(`\nSwept ${stale.length - failed} of ${stale.length}. ${failed} failed.`);
  if (failures.length) { log('First failures:'); failures.forEach((f) => log(`  ${f}`)); }
  log(`Instance now: ${after.length} workflows, ${remaining} ${TEMP_PREFIX} remaining, ${after.length - remaining} real.`);
  if (failed) log('Re-run the sweep to retry the failures — it is idempotent.');
  return { swept: stale.length - failed, failed, remaining };
}

/** Print a one-line teardown summary. Call at the end of a long run. */
function reportLeaks(log = console.error) {
  const { created, destroyed, leaked } = leakStats;
  if (!created) return;
  if (leaked) {
    log(`!! n8n temp workflows: ${created} created, ${destroyed} destroyed, ${leaked} LEAKED (still on the instance).`);
    log(`   Leaked ids (first ${leakStats.leakedIds.length}): ${leakStats.leakedIds.join(', ')}`);
  } else {
    log(`n8n temp workflows: ${created} created, ${destroyed} destroyed, 0 leaked.`);
  }
}

/**
 * Diagnostic: create one minimal temp workflow and tear it down, printing the exact
 * status code of every step. This is what tells you WHY deletes are failing —
 * a 401 on archive/delete means the API key lacks the `workflow:delete` scope;
 * a 400 on delete that clears after archive means the archive gate is the cause.
 */
async function doctor({ apiKey, n8nBase = N8N, log = console.log }) {
  if (!apiKey) { log('N8N_API_KEY missing.'); return 1; }
  const hookPath = makeHookPath('doctor');
  const wf = {
    name: `${TEMP_PREFIX} - DOCTOR ${hookPath}`,
    settings: { executionOrder: 'v1' },
    nodes: [hookNode(hookPath)],
    connections: {},
  };

  log('1. create workflow...');
  const cr = await apiCall(n8nBase, apiKey, 'POST', '/workflows', wf);
  log(`   create: ${cr.status}${cr.ok ? '' : ' ' + cr.text.slice(0, 200)}`);
  if (!cr.ok) return 1;
  const id = JSON.parse(cr.text).id;
  log(`   id = ${id}`);

  log('2. activate (reproduces the real flow)...');
  const act = await apiCall(n8nBase, apiKey, 'POST', `/workflows/${id}/activate`);
  log(`   activate: ${act.status}`);

  log('3. naive DELETE while active + un-archived (what the old code did)...');
  const naive = await apiCall(n8nBase, apiKey, 'DELETE', `/workflows/${id}`);
  log(`   DELETE: ${naive.status} ${naive.ok ? '(succeeded)' : naive.text.slice(0, 250)}`);

  if (naive.ok) {
    log('\nVERDICT: a naive delete still works. The leak has another cause —');
    log('         check network failures or an API key rotation mid-run.');
    return 0;
  }

  log('4. deactivate, then DELETE (is deactivate alone sufficient?)...');
  const deact = await apiCall(n8nBase, apiKey, 'POST', `/workflows/${id}/deactivate`);
  log(`   deactivate: ${deact.status}`);
  const afterDeact = await apiCall(n8nBase, apiKey, 'DELETE', `/workflows/${id}`);
  log(`   DELETE: ${afterDeact.status} ${afterDeact.ok ? '(succeeded)' : afterDeact.text.slice(0, 250)}`);

  if (afterDeact.ok) {
    log('\nVERDICT: the publish/active gate is the root cause — a naive DELETE on a live');
    log('         workflow 409s, and deactivating first clears it. The archive step in');
    log('         destroyTempWorkflow() is belt-and-braces for versions that also');
    log('         require a soft-delete; it is idempotent and costs one call. Fix is live.');
    return 0;
  }

  log('5. archive, then DELETE (archive gate also required)...');
  const res = await destroyTempWorkflow({ id, apiKey, n8nBase, log: (m) => log(m), label: 'doctor' });
  log(`   steps: ${res.steps.join(' ')}`);

  if (res.ok) {
    log('\nVERDICT: both gates apply — deactivate AND archive are required before DELETE.');
    log('         Both steps in destroyTempWorkflow() are load-bearing. Fix is live.');
    return 0;
  }
  log('\nVERDICT: even the full teardown failed. Read the status codes above:');
  log('         409 => see the webhook-registration check below.');
  log('         401/403 => the API key is missing the `workflow:delete` scope.');
  log('         Regenerate the key in n8n with that scope and update N8N_API_KEY in .env.');
  log(`         NOTE: workflow ${id} is still on the instance — remove it by hand.`);
  return 1;
}

module.exports = {
  N8N, WEBHOOK_BASE, N8N_PROJECT, DOCS_CRED, TEMP_PREFIX,
  makeHookPath, hookNode, httpNode,
  runTempWorkflow, destroyTempWorkflow, reportLeaks, leakStats, doctor,
  sweepLeakedTemps, listAllWorkflows,
};

// ── CLI: node scripts/lib/n8n-temp-workflow.cjs doctor ────────────────────────
if (require.main === module) {
  const fs = require('fs');
  const path = require('node:path');
  const env = { ...process.env };
  const envPath = path.join(__dirname, '..', '..', '.env');
  try {
    for (const l of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch { /* rely on process.env */ }

  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const flag = (n) => argv.includes(n);
  const val = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };

  if (cmd === 'doctor') {
    doctor({ apiKey: env.N8N_API_KEY })
      .then(async (code) => {
        // Teardown is only half of "can this pattern work". The other half is whether
        // n8n will actually bind a new webhook — it can report a workflow active while
        // never registering the path, which breaks every n8n-routed Drive call.
        console.log('\n--- webhook registration check ---');
        try {
          const out = await runTempWorkflow({
            apiKey: env.N8N_API_KEY,
            tag: 'drchk',
            attempts: 6,
            delayMs: 2000,
            buildNodes: (hookPath) => [
              hookNode(hookPath),
              { id: 'c', name: 'Call', type: 'n8n-nodes-base.code', typeVersion: 2, position: [220, 0], parameters: { jsCode: 'return [{json:{ok:true}}];' } },
            ],
            connections: { Hook: { main: [[{ node: 'Call', type: 'main', index: 0 }]] } },
            log: () => {},
          });
          console.log(String(out).includes('"ok":true')
            ? 'OK — n8n registers new webhooks. n8n-routed Drive calls will work.'
            : `Unexpected response: ${String(out).slice(0, 200)}`);
        } catch (e) {
          console.log(`FAILING — ${e.message}`);
          console.log('\nEvery script that routes a Drive call through n8n is blocked until this clears');
          console.log('(zoom-drain, archive-video, drive-via-n8n, drive-upload, mining get-transcript).');
          console.log('n8n believes the workflow is active, so this is an instance-side registry fault:');
          console.log('restart the n8n Cloud instance to rebuild the webhook registry, or raise it with support.');
          process.exit(1);
        }
        process.exit(code);
      });
  } else if (cmd === 'sweep') {
    sweepLeakedTemps({
      apiKey: env.N8N_API_KEY,
      apply: flag('--apply'),
      olderThanMinutes: Number(val('--older-than', 30)),
      concurrency: Number(val('--concurrency', 3)),
    })
      .then((r) => process.exit(r.failed ? 1 : 0))
      .catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
  } else {
    console.log('usage:');
    console.log('  node scripts/lib/n8n-temp-workflow.cjs doctor');
    console.log('  node scripts/lib/n8n-temp-workflow.cjs sweep [--apply] [--older-than 30] [--concurrency 6]');
    process.exit(1);
  }
}
