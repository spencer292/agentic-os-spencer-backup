// Enforce one rule, in the two places it can be broken: a part is ours only if it
// is on the confirmed in-house list — both in `syp-*` collection membership AND in
// the custom.made_in_house metafield that the product-page badge reads.
//
// Why this exists. `syp-billet` is titled "SYP Billet — Our Own Parts" and its
// description opens "Every part on this page is manufactured by SYPerformance —
// our design, our drawings, our spec. Not picked from someone else's catalog and
// rebadged." Measured 2026-08-26 it held 110 products: 75 SYPerformance, 33
// Synchro Solutionz and 2 Comp 1 Clutch. Its child `syp-drivetrain` was worse —
// 33 of its 42 products were Synchro Solutionz, so the SYP Drivetrain page was
// three-quarters someone else's brand under a made-by-us heading.
//
// Spencer, 2026-08-26: "Synchro Solutionz is its own brand, Comp 1 Clutch is its
// own brand. SYP is just a distributor." Phase 7 had already corrected the
// product-level badge (snippets/syp-in-house-handles.liquid) and the homepage
// spec label. The collection membership was the half nobody re-checked.
//
// The rule is deliberately the SAME source of truth the product badge uses — the
// generated 75-handle list in snippets/syp-in-house-handles.liquid — so a product
// can never be badged resold on its own page and sit inside "our own parts" on
// the collection page. Vendor is NOT used: 52 unclassified products still carry
// vendor "SYPerformance" (checklist 1.2) and are not confirmed in-house.
//
// The metafield half matters more than it looks. snippets/syp-product-flags.liquid
// reads custom.made_in_house FIRST and only falls back to the handle list, so the
// Phase 7 correction to that list fixed a code path that never runs: all 35
// third-party products still carried made_in_house = true and still rendered the
// "SYP design" badge beside their own brand name. Caught on the rendered page,
// which is the only place it shows.
//
//   node scripts/fix-house-collections.mjs           # dry run
//   node scripts/fix-house-collections.mjs --apply
//
// Nothing is deleted and no product is orphaned — verified before applying, and
// re-verified here: every removal must still belong to another collection. The
// 35 removals all remain in synchro-solutionz / comp-1-clutch / transmission-
// internals / clutch-flywheel / honda / the platform pages.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const APPLY = process.argv.includes('--apply');

function env() {
  const out = {};
  for (const line of fs.readFileSync(path.join(ROOT, '..', '..', '..', '.env'), 'utf8').split(/\r?\n/)) {
    const eq = line.indexOf('=');
    if (eq < 1 || line.trimStart().startsWith('#')) continue;
    const k = line.slice(0, eq).trim();
    if (/^[A-Z0-9_]+$/.test(k)) out[k] = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  }
  return out;
}
const E = env();
const STORE = E.SHOPIFY_BUILD_STORE;
const TOKEN = E.SHOPIFY_BUILD_ADMIN_TOKEN;
if (STORE !== 'syperformance-build.myshopify.com') { console.error(`Refusing to run against ${STORE}`); process.exit(1); }

const API = `https://${STORE}/admin/api/2025-07/graphql.json`;
async function gql(query, variables = {}) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'X-Shopify-Access-Token': TOKEN, 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables })
  });
  const j = await res.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors, null, 1));
  return j.data;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

// The confirmed in-house handles, read from the generated snippet rather than
// copied — one list, one place to correct when Spencer classifies the other 52.
const snippet = fs.readFileSync(path.join(ROOT, 'theme', 'snippets', 'syp-in-house-handles.liquid'), 'utf8');
const match = snippet.match(/assign syp_h_syperformance = '([^']+)'/);
if (!match) { console.error('Could not read syp_h_syperformance from snippets/syp-in-house-handles.liquid'); process.exit(1); }
const IN_HOUSE = new Set(match[1].split(','));
console.log(`Confirmed in-house handles: ${IN_HOUSE.size}`);

// Every syp-* collection, with its members.
const collections = [];
{
  let cursor = null;
  do {
    const d = await gql(`query($c:String){ collections(first:100, after:$c){ pageInfo{hasNextPage endCursor} nodes{ id handle title productsCount{count} } } }`, { c: cursor });
    for (const n of d.collections.nodes) if (n.handle.startsWith('syp-')) collections.push(n);
    cursor = d.collections.pageInfo.hasNextPage ? d.collections.pageInfo.endCursor : null;
  } while (cursor);
}

async function members(id) {
  const out = [];
  let cursor = null;
  do {
    const d = await gql(`query($id:ID!,$c:String){ collection(id:$id){ products(first:250, after:$c){ pageInfo{hasNextPage endCursor} nodes{ id handle title vendor collections(first:25){ nodes{ handle } } } } } }`, { id, c: cursor });
    out.push(...d.collection.products.nodes);
    cursor = d.collection.products.pageInfo.hasNextPage ? d.collection.products.pageInfo.endCursor : null;
  } while (cursor);
  return out;
}

const REMOVE = `mutation($id: ID!, $productIds: [ID!]!) {
  collectionRemoveProducts(id: $id, productIds: $productIds) { job { id done } userErrors { field message } }
}`;

const plan = [];
for (const c of collections) {
  const have = await members(c.id);
  const strays = have.filter(p => !IN_HOUSE.has(p.handle));
  plan.push({ c, have, strays });
}

console.log('');
let orphanRisk = 0;
for (const { c, have, strays } of plan) {
  const houseCollections = new Set(collections.map(x => x.handle));
  console.log(`${c.handle.padEnd(28)} ${String(have.length).padStart(3)} products   ${strays.length ? `${strays.length} do not belong` : 'clean'}`);
  for (const s of strays) {
    // A removal must leave the product reachable somewhere that is not a syp-* page.
    const elsewhere = s.collections.nodes.map(n => n.handle).filter(h => !houseCollections.has(h));
    if (!elsewhere.length) { orphanRisk++; console.log(`    ORPHAN RISK  ${s.handle} (${s.vendor}) — no other collection`); }
  }
  const byVendor = {};
  for (const s of strays) byVendor[s.vendor] = (byVendor[s.vendor] || 0) + 1;
  for (const [v, n] of Object.entries(byVendor)) console.log(`    -${String(n).padStart(3)}  ${v}`);
}

if (orphanRisk) { console.error(`\nRefusing to apply: ${orphanRisk} product(s) would be left with no collection.`); process.exit(1); }

const total = plan.reduce((n, p) => n + p.strays.length, 0);
if (!total) console.log('\nMembership: every syp-* collection is already clean.');
else console.log(`\nMembership: ${total} removals across ${plan.filter(p => p.strays.length).length} collections.`);

const jobs = [];
for (const { c, strays } of plan) {
  if (!APPLY) break;
  if (!strays.length) continue;
  const res = await gql(REMOVE, { id: c.id, productIds: strays.map(s => s.id) });
  const errs = res.collectionRemoveProducts.userErrors;
  if (errs.length) { console.error(`  ${c.handle}: ${JSON.stringify(errs)}`); continue; }
  jobs.push({ handle: c.handle, jobId: res.collectionRemoveProducts.job?.id });
  console.log(`  ${c.handle}: removing ${strays.length}`);
}

if (jobs.length) console.log('\nWaiting for jobs...');
for (let attempt = 0; attempt < 20; attempt++) {
  await sleep(3000);
  let pending = 0;
  for (const j of jobs) {
    if (!j.jobId || j.done) continue;
    const d = await gql(`query($id:ID!){ job(id:$id){ id done } }`, { id: j.jobId });
    if (d.job?.done) j.done = true; else pending++;
  }
  if (!pending) break;
}

// ---------------------------------------------------------------------------
// Second half: the made_in_house metafield, which is what the badge actually reads.
console.log('\nmade_in_house metafield:');
const flagged = [];
{
  let cursor = null;
  do {
    const d = await gql(`query($c:String){ products(first:250, after:$c){ pageInfo{hasNextPage endCursor} nodes{ id handle vendor metafield(namespace:"custom", key:"made_in_house"){ value } } } }`, { c: cursor });
    for (const n of d.products.nodes) {
      if (n.metafield?.value === 'true' && !IN_HOUSE.has(n.handle)) flagged.push(n);
    }
    cursor = d.products.pageInfo.hasNextPage ? d.products.pageInfo.endCursor : null;
  } while (cursor);
}
if (!flagged.length) {
  console.log('  clean — nothing claims manufacture that is not on the list.');
} else {
  const byVendor = {};
  for (const f of flagged) byVendor[f.vendor] = (byVendor[f.vendor] || 0) + 1;
  for (const [v, n] of Object.entries(byVendor)) console.log(`  ${String(n).padStart(3)}  ${v}  -> false`);
  if (APPLY) {
    for (let i = 0; i < flagged.length; i += 25) {
      const batch = flagged.slice(i, i + 25).map(f => ({
        ownerId: f.id, namespace: 'custom', key: 'made_in_house', type: 'boolean', value: 'false'
      }));
      const res = await gql(`mutation($m:[MetafieldsSetInput!]!){ metafieldsSet(metafields:$m){ userErrors{ field message } } }`, { m: batch });
      if (res.metafieldsSet.userErrors.length) console.error(`  metafield write failed: ${JSON.stringify(res.metafieldsSet.userErrors)}`);
    }
    console.log(`  wrote false on ${flagged.length} products.`);
  } else {
    console.log(`  ${flagged.length} to correct. Re-run with --apply.`);
  }
}

// Shopify's productsCount is eventually consistent — it still reported 110 in the
// same request that had just removed 35 products, which reads as a silent failure.
// Walk the members instead, which is immediate.
console.log('\nFinal counts:');
for (const c of collections) {
  const now = await members(c.id);
  console.log(`  ${c.handle.padEnd(28)} ${String(now.length).padStart(3)}`);
}
