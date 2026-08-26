// Reconcile the twelve new collections against data/taxonomy.json.
//
// A true sync, not an append: when a classification rule is corrected, products
// have to LEAVE the collection they were wrongly put in as well as join the right
// one. An add-only script leaves the mistake sitting on the storefront.
//
//   node scripts/fix-collection-members.mjs --debug   # one call, raw response
//   node scripts/fix-collection-members.mjs --apply
//
// Two separate traps got hit here, both silent:
//
// 1. collectionAddProducts (V1) reported zero userErrors and added zero products.
//    It is superseded by collectionAddProductsV2, which returns a Job. This uses V2
//    and polls the job before reporting a count, rather than trusting the response.
//
// 2. The product ids in data/product-audit.json are from the LIVE syperformance.net
//    store — that file is the Phase 0 scrape. The build store's catalogue was created
//    by CSV import and every product got a new id, so those ids resolve to null here.
//    Membership is therefore matched on HANDLE, which survived the import, and any
//    handle that does not resolve is reported rather than skipped quietly.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const APPLY = process.argv.includes('--apply');
const DEBUG = process.argv.includes('--debug');

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

// Same membership rules as apply-subcollections.mjs, kept in one place.
const taxonomy = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'taxonomy.json'), 'utf8')).products;
const RULES = {
  'k-series-synchros': p => p.platformKey === 'honda-k-series' && p.partType === 'synchros',
  'b-h-series-synchros': p => p.platformKey === 'honda-b-d-h-series' && p.partType === 'synchros',
  'k-series-transmission-hardware': p => p.platformKey === 'honda-k-series' && ['bearings-seals', 'gears'].includes(p.partType),
  'k-series-awd-driveline': p => p.platformKey === 'honda-k-series' && ['halfshafts', 'halfshaft-carriers', 'bellhousings', 'transfer-case', 'shift-selectors'].includes(p.partType),
  'honda-k-turbo-manifolds': p => p.platformKey === 'honda-k-series' && p.partType === 'turbo-manifolds',
  'evo-turbo-manifolds': p => ['mitsubishi-evo-7-8-9', 'mitsubishi-evo-x'].includes(p.platformKey) && p.partType === 'turbo-manifolds',
  'honda-b-d-h-turbo-manifolds': p => p.platformKey === 'honda-b-d-h-series' && p.partType === 'turbo-manifolds',
  'honda-k-series-engine': p => p.platformKey === 'honda-k-series' && p.system === 'engine',
  'honda-k-series-electronics': p => p.platformKey === 'honda-k-series' && p.system === 'electronics',
  'honda-k-series-cooling': p => p.platformKey === 'honda-k-series' && p.system === 'cooling',
  'b-d-h-driveline-hardware': p => p.platformKey === 'honda-b-d-h-series' && p.system === 'drivetrain' && p.partType !== 'synchros'
};

// Resolve collection handles to ids
const handles = Object.keys(RULES);
const idByHandle = {};
{
  let cursor = null;
  do {
    const d = await gql(`query($cursor:String){ collections(first:100, after:$cursor){ pageInfo{hasNextPage endCursor} nodes{ id handle productsCount{count} } } }`, { cursor });
    for (const n of d.collections.nodes) if (handles.includes(n.handle)) idByHandle[n.handle] = { id: n.id, count: n.productsCount.count };
    cursor = d.collections.pageInfo.hasNextPage ? d.collections.pageInfo.endCursor : null;
  } while (cursor);
}

// Resolve PRODUCT handles to this store's ids. See trap 2 in the header.
const productIdByHandle = {};
{
  let cursor = null;
  do {
    const d = await gql(`query($cursor:String){ products(first:250, after:$cursor){ pageInfo{hasNextPage endCursor} nodes{ id handle } } }`, { cursor });
    for (const n of d.products.nodes) productIdByHandle[n.handle] = n.id;
    cursor = d.products.pageInfo.hasNextPage ? d.products.pageInfo.endCursor : null;
  } while (cursor);
}
console.log(`Resolved ${Object.keys(productIdByHandle).length} product handles on the build store.`);

const missing = taxonomy.filter(p => !productIdByHandle[p.handle]);
if (missing.length) {
  console.error(`
${missing.length} taxonomy handles do NOT exist on the build store:`);
  for (const m of missing.slice(0, 20)) console.error(`  ${m.handle}`);
  if (missing.length > 20) console.error(`  ... and ${missing.length - 20} more`);
}

const gidsFor = (rule) => taxonomy.filter(rule).map(p => productIdByHandle[p.handle]).filter(Boolean);

const ADD_V2 = `mutation($id: ID!, $productIds: [ID!]!) {
  collectionAddProductsV2(id: $id, productIds: $productIds) {
    job { id done }
    userErrors { field message code }
  }
}`;
const REMOVE = `mutation($id: ID!, $productIds: [ID!]!) {
  collectionRemoveProducts(id: $id, productIds: $productIds) {
    job { id done }
    userErrors { field message }
  }
}`;

/** Products currently in a collection, as gids. */
async function currentMembers(collectionId) {
  const out = [];
  let cursor = null;
  do {
    const d = await gql(`query($id: ID!, $c: String){ collection(id:$id){ products(first:250, after:$c){ pageInfo{hasNextPage endCursor} nodes{ id } } } }`, { id: collectionId, c: cursor });
    for (const n of d.collection.products.nodes) out.push(n.id);
    cursor = d.collection.products.pageInfo.hasNextPage ? d.collection.products.pageInfo.endCursor : null;
  } while (cursor);
  return out;
}

if (DEBUG) {
  const h = 'k-series-synchros';
  const ids = gidsFor(RULES[h]);
  console.log(`${h}: ${ids.length} product ids, first = ${ids[0]}`);
  console.log('collection id =', idByHandle[h]?.id);
  const res = await gql(ADD_V2, { id: idByHandle[h].id, productIds: ids });
  console.log(JSON.stringify(res, null, 1));
  process.exit(0);
}

if (!APPLY) {
  console.log('\nWould populate:');
  for (const h of handles) {
    const n = gidsFor(RULES[h]).length;
    console.log(`  ${String(n).padStart(3)} -> ${h}  (currently ${idByHandle[h]?.count ?? '?'} )`);
  }
  console.log('\nRe-run with --apply.');
  process.exit(0);
}

const jobs = [];
for (const h of handles) {
  const entry = idByHandle[h];
  if (!entry) { console.error(`  missing collection: ${h}`); continue; }
  const want = gidsFor(RULES[h]);
  if (!want.length) { console.error(`  ${h}: no resolvable products, skipping`); continue; }

  const have = await currentMembers(entry.id);
  const wantSet = new Set(want);
  const haveSet = new Set(have);
  const toAdd = want.filter(id => !haveSet.has(id));
  const toRemove = have.filter(id => !wantSet.has(id));

  if (toAdd.length) {
    const res = await gql(ADD_V2, { id: entry.id, productIds: toAdd });
    const errs = res.collectionAddProductsV2.userErrors;
    if (errs.length) console.error(`  ${h}: add failed ${JSON.stringify(errs)}`);
    else jobs.push({ handle: h, jobId: res.collectionAddProductsV2.job?.id, expected: want.length });
  }
  if (toRemove.length) {
    const res = await gql(REMOVE, { id: entry.id, productIds: toRemove });
    const errs = res.collectionRemoveProducts.userErrors;
    if (errs.length) console.error(`  ${h}: remove failed ${JSON.stringify(errs)}`);
    else jobs.push({ handle: h, jobId: res.collectionRemoveProducts.job?.id, expected: want.length });
  }
  if (!jobs.some(j => j.handle === h)) jobs.push({ handle: h, jobId: null, done: true, expected: want.length });

  const change = [toAdd.length ? `+${toAdd.length}` : '', toRemove.length ? `-${toRemove.length}` : ''].filter(Boolean).join(' ') || 'no change';
  console.log(`  ${h.padEnd(34)} ${String(want.length).padStart(3)} target   ${change}`);
}

// Wait for the async jobs to finish before reporting anything.
console.log('\nWaiting for jobs...');
for (let attempt = 0; attempt < 20; attempt++) {
  await sleep(3000);
  let pending = 0;
  for (const j of jobs) {
    if (!j.jobId || j.done) continue;
    const d = await gql(`query($id: ID!){ job(id:$id){ id done } }`, { id: j.jobId });
    if (d.job?.done) j.done = true; else pending++;
  }
  if (!pending) break;
}

console.log('\nFinal counts:');
let cursor = null;
const final = {};
do {
  const d = await gql(`query($cursor:String){ collections(first:100, after:$cursor){ pageInfo{hasNextPage endCursor} nodes{ handle productsCount{count} } } }`, { cursor });
  for (const n of d.collections.nodes) final[n.handle] = n.productsCount.count;
  cursor = d.collections.pageInfo.hasNextPage ? d.collections.pageInfo.endCursor : null;
} while (cursor);

let bad = 0;
for (const j of jobs) {
  const got = final[j.handle] ?? 0;
  const ok = got === j.expected;
  if (!ok) bad++;
  console.log(`  ${ok ? 'ok  ' : 'MISS'} ${j.handle.padEnd(34)} ${got}/${j.expected}`);
}
process.exit(bad ? 1 : 0);
