// Publish collections to the Online Store sales channel, and clear any URL
// redirect that would shadow one of them.
//
//   node scripts/publish-collections.mjs           # dry run
//   node scripts/publish-collections.mjs --apply
//
// Two things bit the Phase 2b restructure and both were silent:
//
// 1. A collection created through the Admin API is NOT published to any sales
//    channel. It exists, it has products, the admin shows it — and the storefront
//    returns 404. Nothing in the create mutation warns you.
//
// 2. Phase 2 created a redirect /collections/evo-turbo-manifolds ->
//    /collections/turbo-manifolds, because the old site had that handle and the IA
//    consolidated it. Re-creating it as a real sub-collection means the redirect now
//    shadows a live page. The redirect has to go, which also gives the old URL — one
//    that already has search equity — a real page again instead of a bounce.
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

const TARGETS = [
  'k-series-synchros', 'b-h-series-synchros', 'k-series-transmission-hardware',
  'k-series-awd-driveline', 'honda-k-turbo-manifolds', 'evo-turbo-manifolds',
  'honda-b-d-h-turbo-manifolds', 'honda-k-series-engine', 'honda-k-series-electronics',
  'honda-k-series-cooling', 'b-d-h-driveline-hardware'
];

// --- find the Online Store publication --------------------------------------
const pubs = await gql(`{ publications(first: 20) { nodes { id name } } }`);
const online = pubs.publications.nodes.find(p => /online store/i.test(p.name));
if (!online) { console.error('No Online Store publication found:', pubs.publications.nodes.map(p => p.name)); process.exit(1); }
console.log(`Online Store publication: ${online.id}`);

// --- find the collections ----------------------------------------------------
const found = {};
let cursor = null;
do {
  const d = await gql(`query($c:String){ collections(first:100, after:$c){ pageInfo{hasNextPage endCursor} nodes{ id handle resourcePublicationsCount{count} } } }`, { c: cursor });
  for (const n of d.collections.nodes) if (TARGETS.includes(n.handle)) found[n.handle] = n;
  cursor = d.collections.pageInfo.hasNextPage ? d.collections.pageInfo.endCursor : null;
} while (cursor);

const unpublished = TARGETS.filter(h => found[h] && found[h].resourcePublicationsCount.count === 0);
const missing = TARGETS.filter(h => !found[h]);
if (missing.length) console.error(`  not found: ${missing.join(', ')}`);
console.log(`\n${unpublished.length} of ${TARGETS.length} need publishing.`);

// --- find shadowing redirects ------------------------------------------------
const shadowing = [];
cursor = null;
do {
  const d = await gql(`query($c:String){ urlRedirects(first:250, after:$c){ pageInfo{hasNextPage endCursor} nodes{ id path target } } }`, { c: cursor });
  for (const n of d.urlRedirects.nodes) {
    const h = TARGETS.find(t => n.path === `/collections/${t}`);
    if (h) shadowing.push(n);
  }
  cursor = d.urlRedirects.pageInfo.hasNextPage ? d.urlRedirects.pageInfo.endCursor : null;
} while (cursor);

if (shadowing.length) {
  console.log(`\n${shadowing.length} redirect(s) shadowing a new collection — these must go:`);
  for (const r of shadowing) console.log(`  ${r.path} -> ${r.target}`);
}

if (!APPLY) {
  console.log('\nDry run. Re-run with --apply.');
  process.exit(0);
}

// --- publish -----------------------------------------------------------------
const PUBLISH = `mutation($id: ID!, $input: [PublicationInput!]!) {
  publishablePublish(id: $id, input: $input) {
    userErrors { field message }
  }
}`;
for (const h of unpublished) {
  const res = await gql(PUBLISH, { id: found[h].id, input: [{ publicationId: online.id }] });
  const errs = res.publishablePublish.userErrors;
  console.log(errs.length ? `  FAILED ${h}: ${JSON.stringify(errs)}` : `  published ${h}`);
}

// --- remove shadowing redirects ----------------------------------------------
const DEL = `mutation($id: ID!) { urlRedirectDelete(id: $id) { deletedUrlRedirectId userErrors { field message } } }`;
for (const r of shadowing) {
  const res = await gql(DEL, { id: r.id });
  const errs = res.urlRedirectDelete.userErrors;
  console.log(errs.length ? `  FAILED redirect ${r.path}: ${JSON.stringify(errs)}` : `  removed redirect ${r.path}`);
}

console.log('\nDone. Verify with a storefront fetch, not the admin — the admin shows unpublished collections too.');
