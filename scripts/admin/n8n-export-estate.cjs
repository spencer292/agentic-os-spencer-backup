/**
 * Export the live n8n estate to reviewable, REDACTED files.
 *
 * Built 2026-08-12 to hand the estate to an external reviewer (Codex) without
 * handing over credentials. n8n workflow JSON routinely carries secrets in
 * plain sight — hardcoded Bearer tokens in httpRequest headers, API keys pasted
 * into Code nodes, connection strings in query params. Anything leaving this
 * machine for a third-party model must be scrubbed first, and the scrub must be
 * verified rather than assumed.
 *
 * What is kept: structure (nodes, types, connections, triggers, gates), settings
 * (error workflow, timezone), activity (last run, status counts), and node
 * parameters with secret-shaped values replaced.
 * What is dropped: credential payloads, and any value matching a secret pattern.
 *
 * Usage: node scripts/admin/n8n-export-estate.cjs [outDir]
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
const H = { 'X-N8N-API-KEY': env.N8N_API_KEY, accept: 'application/json' };
const OUT = process.argv[2] || path.join(ROOT, 'projects', 'briefs', 'n8n-audit', 'export');

// Values that must never leave the machine. Checked against every string in the tree.
//
// The 40-char thresholds below are NOT sufficient on their own. The first version of
// this script passed its own scan and still shipped a live 22-character Zoom secret
// (`const ZOOM_SECRET_TOKEN = '...'` inside a Code node) and a 32-character
// AssemblyAI key to an external reviewer. Two blind spots caused it: the value was
// shorter than every length threshold, and it lived inside a jsCode STRING, so
// key-based redaction never saw it as a key. Hence NAMED_ASSIGNMENT below, and the
// fail-closed check at the end of the run.
const SECRET_PATTERNS = [
  /\b(sk|rk|pk)-[A-Za-z0-9_-]{16,}/g,          // OpenAI / Stripe / Anthropic style
  /\bghp_[A-Za-z0-9]{20,}/g,                   // GitHub PAT
  /\bAIza[A-Za-z0-9_-]{20,}/g,                 // Google API key
  /\bxox[baprs]-[A-Za-z0-9-]{10,}/g,           // Slack
  /\bBearer\s+[A-Za-z0-9._-]{16,}/gi,          // bare bearer tokens
  /\bey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, // JWT
  /\b[A-Za-z0-9+/]{40,}={0,2}\b/g,             // long base64-ish blobs
  /\b[a-f0-9]{32,}\b/gi,                       // hex secrets (32 = a bare MD5/key)
  /(postgres|mysql|mongodb(\+srv)?):\/\/[^\s"']+/gi, // connection strings
];

// Any `SOMETHING_SECRET = "value"` / `"token": "value"` assignment, at ANY length —
// the variable name is the tell, so entropy and length thresholds do not apply.
// Deliberately runs over raw strings too, which is how it reaches into Code nodes.
const NAMED_ASSIGNMENT =
  /((?:[A-Za-z_][A-Za-z0-9_]*)?(?:SECRET|TOKEN|API[_-]?KEY|APIKEY|PASSWORD|PASSWD|SIGNATURE|HMAC|AUTH|CREDENTIAL)[A-Za-z0-9_]*)(\s*[:=]\s*)(['"])([^'"\s]{8,})\3/gi;

// n8n expressions are not literals — never treat them as secrets.
const isExpression = (v) => /^=?\{\{/.test(v) || /^\$\(|^\$json|^\$node/.test(v);

let redactionCount = 0;
function scrubString(s) {
  let out = s;
  // Named assignments first — catches short, prefix-less secrets inside Code nodes.
  out = out.replace(NAMED_ASSIGNMENT, (m, name, sep, q, val) => {
    if (isExpression(val)) return m;
    redactionCount++;
    return `${name}${sep}${q}[REDACTED:${val.length}chars]${q}`;
  });
  for (const re of SECRET_PATTERNS) {
    out = out.replace(re, (m) => { redactionCount++; return `[REDACTED:${m.length}chars]`; });
  }
  return out;
}

/** Find credential-shaped literals that survived. Used to FAIL CLOSED. */
function findSurvivors(text) {
  const out = [];
  const re = new RegExp(NAMED_ASSIGNMENT.source, 'gi');
  let m;
  while ((m = re.exec(text))) {
    const val = m[4];
    if (val.startsWith('[REDACTED') || isExpression(val)) continue;
    if (/^(true|false|null|undefined|string|json|header|generic|predefined)$/i.test(val)) continue;
    out.push(`${m[1]} = ${val.slice(0, 3)}…(${val.length} chars)`);
  }
  for (const p of SECRET_PATTERNS) {
    const hits = text.match(new RegExp(p.source, p.flags));
    if (hits) for (const h of hits.slice(0, 3)) out.push(`${String(h).slice(0, 6)}…(${String(h).length} chars)`);
  }
  return [...new Set(out)];
}

function scrub(value) {
  if (typeof value === 'string') return scrubString(value);
  if (Array.isArray(value)) return value.map(scrub);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      // Credential payloads never travel. The credential NAME/ID is useful context
      // (which account a node uses); the contents are not ours to share.
      if (/^(credentials|auth|headerAuth|accessToken|apiKey|password|secret|token)$/i.test(k)) {
        out[k] = typeof v === 'object' && v !== null
          ? Object.fromEntries(Object.entries(v).map(([ck, cv]) => [ck, { id: cv?.id, name: cv?.name }]))
          : '[REDACTED]';
        continue;
      }
      out[k] = scrub(v);
    }
    return out;
  }
  return value;
}

const listAll = async (endpoint) => {
  let all = [];
  let cursor;
  do {
    const r = await fetch(`${BASE}${endpoint}${endpoint.includes('?') ? '&' : '?'}limit=250${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, { headers: H });
    if (!r.ok) throw new Error(`${endpoint} -> ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const j = await r.json();
    all = all.concat(j.data || []);
    cursor = j.nextCursor;
  } while (cursor);
  return all;
};

(async () => {
  if (!env.N8N_API_KEY) { console.error('N8N_API_KEY missing'); process.exit(1); }
  fs.mkdirSync(OUT, { recursive: true });

  console.log('Fetching workflows...');
  const list = await listAll('/workflows');
  const real = list.filter((w) => !String(w.name || '').startsWith('ZZ TEMP'));
  console.log(`  ${list.length} total, ${real.length} real`);

  console.log('Fetching executions (recent sample)...');
  const execs = await listAll('/executions');
  console.log(`  ${execs.length} executions`);

  const byWf = {};
  for (const e of execs) (byWf[e.workflowId] = byWf[e.workflowId] || []).push(e);

  // Per-workflow detail, fetched individually so we get full node parameters.
  const detail = [];
  for (let i = 0; i < real.length; i++) {
    const w = real[i];
    const r = await fetch(`${BASE}/workflows/${w.id}`, { headers: H });
    if (!r.ok) { console.log(`  ! ${w.id} ${r.status}`); continue; }
    const full = await r.json();
    const runs = (byWf[w.id] || []).slice().sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
    detail.push(scrub({
      id: full.id,
      name: full.name,
      active: full.active,
      isArchived: full.isArchived,
      createdAt: full.createdAt,
      updatedAt: full.updatedAt,
      settings: full.settings,
      triggers: full.nodes.filter((n) => /trigger|webhook/i.test(n.type)).map((n) => ({ name: n.name, type: n.type, parameters: n.parameters })),
      nodes: full.nodes.map((n) => ({
        name: n.name, type: n.type, typeVersion: n.typeVersion,
        disabled: n.disabled || false, executeOnce: n.executeOnce || false,
        onError: n.onError, retryOnFail: n.retryOnFail,
        credentials: n.credentials, parameters: n.parameters,
      })),
      connections: full.connections,
      activity: {
        runsInSample: runs.length,
        lastRun: runs[0]?.startedAt || null,
        lastStatus: runs[0]?.status || null,
        statusCounts: runs.reduce((a, e) => { a[e.status] = (a[e.status] || 0) + 1; return a; }, {}),
      },
    }));
    if ((i + 1) % 25 === 0) console.log(`  ${i + 1}/${real.length}`);
  }

  const index = detail.map((w) => ({
    id: w.id, name: w.name, active: w.active, nodes: w.nodes.length,
    triggers: w.triggers.map((t) => t.type.replace('n8n-nodes-base.', '')),
    errorWorkflow: w.settings?.errorWorkflow || null,
    lastRun: w.activity.lastRun, runsInSample: w.activity.runsInSample,
    updatedAt: w.updatedAt,
  }));

  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 2));
  fs.writeFileSync(path.join(OUT, 'workflows.json'), JSON.stringify(detail, null, 2));
  fs.writeFileSync(path.join(OUT, 'executions.json'), JSON.stringify(
    execs.map((e) => ({ id: e.id, workflowId: e.workflowId, status: e.status, startedAt: e.startedAt, stoppedAt: e.stoppedAt, mode: e.mode })), null, 2));

  // Verification: prove the scrub worked rather than trusting it, and FAIL CLOSED.
  // The first version of this script printed a warning and left the files on disk;
  // the export was shared before anyone read the warning. An export that might carry
  // a live credential must not exist as a shareable file at all.
  console.log(`\nWrote ${detail.length} workflows to ${OUT}`);
  console.log(`Redactions applied: ${redactionCount}`);

  const survivors = findSurvivors(fs.readFileSync(path.join(OUT, 'workflows.json'), 'utf8'));
  if (survivors.length) {
    for (const f of ['workflows.json', 'index.json', 'executions.json']) {
      try { fs.unlinkSync(path.join(OUT, f)); } catch { /* already gone */ }
    }
    console.error(`\n!! ${survivors.length} credential-shaped value(s) SURVIVED the scrub.`);
    console.error('!! THE EXPORT HAS BEEN DELETED — it was not safe to share.');
    for (const s of survivors.slice(0, 12)) console.error(`   ${s}`);
    console.error('\nAdd a pattern for each, re-run, and treat any value that already left');
    console.error('this machine as compromised — rotate it rather than assuming it was unread.');
    process.exit(1);
  }
  console.log('Post-scrub scan: clean — no credential-shaped values remain. Safe to share.');
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
