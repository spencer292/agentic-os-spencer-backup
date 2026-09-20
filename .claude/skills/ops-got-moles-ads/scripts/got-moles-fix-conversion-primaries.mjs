// Align conversion actions to the canonical rule:
//   Phone calls = Primary. Everything else = Secondary.
//
// Three changes:
//   - Repeat Phone Call (7607826202)         → PRIMARY
//   - Local actions - Website visits (7605894698)    → SECONDARY
//   - Local actions - Other engagements (7609941007) → SECONDARY
//
// Usage:
//   node scripts/got-moles-fix-conversion-primaries.mjs           # DRY RUN (default)
//   node scripts/got-moles-fix-conversion-primaries.mjs --apply   # actually mutate

import fs from 'node:fs';
const env = {};
for (const l of fs.readFileSync('.env','utf8').split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"')&&v.endsWith('"')) || (v.startsWith("'")&&v.endsWith("'"))) v = v.slice(1,-1);
  env[m[1]] = v;
}

const cid = '1665761172';
const mcc = env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
const VERSION = 'v23';
const APPLY = process.argv.includes('--apply');

// Only mutable conversion actions. The two GOOGLE_HOSTED `Local actions - *`
// rows reject API mutation (MUTATE_NOT_ALLOWED) — must be flipped in the Ads UI.
const TARGETS = [
  { id: '7607826202', name: 'Repeat Phone Call', desired: false },
];

const tk = await (await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: {'Content-Type': 'application/x-www-form-urlencoded'},
  body: new URLSearchParams({
    client_id: env.GOOGLE_ADS_CLIENT_ID,
    client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
    refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  }),
})).json();
const at = tk.access_token;

async function gaql(query) {
  const r = await fetch(`https://googleads.googleapis.com/${VERSION}/customers/${cid}/googleAds:search`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + at,
      'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN,
      'login-customer-id': mcc,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({query}),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(j));
  return j.results || [];
}

console.log(`\nMode: ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);

// Pre-flight: read current state
const ids = TARGETS.map(t => t.id).join(',');
const rows = await gaql(`SELECT conversion_action.id, conversion_action.name, conversion_action.primary_for_goal FROM conversion_action WHERE conversion_action.id IN (${ids})`);
const live = {};
for (const r of rows) live[r.conversionAction.id] = r.conversionAction.primaryForGoal === true;

console.log('Current → Desired:\n');
const operations = [];
for (const t of TARGETS) {
  const current = live[t.id];
  const flag = (b) => b ? 'PRIMARY' : 'secondary';
  const change = current === t.desired ? '(no change)' : `→ ${flag(t.desired)}`;
  console.log(`  ${t.name.padEnd(40)}  ${flag(current).padEnd(9)}  ${change}`);
  if (current !== t.desired) {
    operations.push({
      update: {
        resourceName: `customers/${cid}/conversionActions/${t.id}`,
        primaryForGoal: t.desired,
      },
      updateMask: 'primary_for_goal',
    });
  }
}

if (operations.length === 0) {
  console.log('\nAll targets already match desired state. Nothing to do.');
  process.exit(0);
}

console.log(`\n${operations.length} mutation(s) queued.`);
if (!APPLY) {
  console.log('\n[DRY RUN] Re-run with --apply to execute.');
  process.exit(0);
}

const r = await fetch(`https://googleads.googleapis.com/${VERSION}/customers/${cid}/conversionActions:mutate`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + at,
    'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN,
    'login-customer-id': mcc,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ operations }),
});
const j = await r.json();
if (!r.ok) {
  console.error(`❌ Mutate failed:\n${JSON.stringify(j, null, 2)}`);
  process.exit(1);
}
console.log(`✅ Mutated ${j.results?.length || 0} conversion action(s).`);
for (const res of j.results || []) console.log(`   ${res.resourceName}`);
