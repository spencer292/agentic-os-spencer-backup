// Brand pages, and the casing cleanup they depend on.
//
//   node scripts/apply-brands-collections.mjs          # dry run
//   node scripts/apply-brands-collections.mjs --apply
//
// The vendor field carries the same brand under two spellings — TRANSLAB and
// Translab, BLOX and Blox, PULSAR and Pulsar, TurboSmart and Turbosmart, plus a
// lowercase `honda`. Shopify treats those as different vendors, so every one of
// those brands was split across two groups and neither looked complete. Casing is
// normalised first; the brand collections are built from the normalised value.
//
// Only brands Spencer named plus any with two or more products get a page. A
// one-product brand page is a thin page, and there are a dozen of those.
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
const STORE = E.SHOPIFY_BUILD_STORE, TOKEN = E.SHOPIFY_BUILD_ADMIN_TOKEN;
if (STORE !== 'syperformance-build.myshopify.com') { console.error(`Refusing to run against ${STORE}`); process.exit(1); }
const API = `https://${STORE}/admin/api/2025-07/graphql.json`;
async function gql(query, variables = {}) {
  const res = await fetch(API, { method: 'POST', headers: { 'X-Shopify-Access-Token': TOKEN, 'content-type': 'application/json' }, body: JSON.stringify({ query, variables }) });
  const j = await res.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors, null, 1));
  return j.data;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

// canonical spelling, keyed by lowercased vendor
const CANON = {
  translab: 'Translab', blox: 'Blox', pulsar: 'Pulsar', turbosmart: 'Turbosmart',
  honda: 'Honda', aem: 'AEM', vibrant: 'Vibrant', rywire: 'Rywire',
  koyo: 'Koyo', walbro: 'Walbro', hondata: 'Hondata', 'bf gears': 'BF Gears',
  'mickey thompson': 'Mickey Thompson', 'competition clutch': 'Competition Clutch',
  'comp 1 clutch': 'Comp 1 Clutch', 'synchro solutionz': 'Synchro Solutionz',
  'syperformance': 'SYPerformance', deatschwerks: 'DeatschWerks',
  'injector dynamics': 'Injector Dynamics', 'fuel injector clinic': 'Fuel Injector Clinic'
};

// Brands that get a page: named by Spencer, or two-plus products.
const NAMED = new Set(['Translab', 'Competition Clutch', 'Synchro Solutionz', 'Honda', 'Blox', 'Mickey Thompson', 'Comp 1 Clutch']);
const BLURB = {
  'Translab': 'Translab billet transmission and driveline hardware — AWD cuffs, transfer case block-offs, VSS block-offs and the shims and setup tools that go with a build. Specialist parts for people already inside the gearbox.',
  'Competition Clutch': 'Competition Clutch single-disc clutch kits. Clutch capacity is chosen against torque at the crank and how the car is driven, not against a peak horsepower number — a street car that sees traffic and a car that only sees a launch want different discs.',
  'Synchro Solutionz': 'Synchro Solutionz synchros, hubs, sliders, springs and complete rebuild kits for Honda B, H and K series transmissions — manufactured by SYPerformance. The line that fixes the grind into second or third that most owners misread as needing a whole rebuild.',
  'Honda': 'Genuine Honda parts we keep on the shelf because the OEM item is still the right answer — timing chain kits, second gears and the factory components a build reuses.',
  'Blox': 'Blox Racing suspension and cooling for 92-00 Civic and 94-01 Integra — coilovers and radiators for the chassis this catalogue is built around.',
  'Mickey Thompson': 'Mickey Thompson drag radials. The tyre decides whether any of the rest of this catalogue reaches the ground.',
  // Comp 1 Clutch is its own brand (Spencer, 2026-08-26) and is NOT the same as
  // Competition Clutch, which is also in the catalogue. No ownership claim here.
  'Comp 1 Clutch': 'Comp 1 Clutch twin and triple disc clutches, for cars that have outgrown a single disc. Clutch capacity is chosen against torque at the crank and how the car is driven, not against a peak horsepower number. Not to be confused with Competition Clutch, a separate brand also stocked here.'
};

// --- read products -----------------------------------------------------------
const products = [];
{
  let cursor = null;
  do {
    const d = await gql(`query($c:String){ products(first:250, after:$c){ pageInfo{hasNextPage endCursor} nodes{ id handle title vendor } } }`, { c: cursor });
    products.push(...d.products.nodes);
    cursor = d.products.pageInfo.hasNextPage ? d.products.pageInfo.endCursor : null;
  } while (cursor);
}

const canonOf = v => CANON[String(v || '').trim().toLowerCase()] || String(v || '').trim();
const needsRename = products.filter(p => p.vendor && canonOf(p.vendor) !== p.vendor);

const counts = {};
for (const p of products) { const b = canonOf(p.vendor); if (b) counts[b] = (counts[b] || 0) + 1; }

const wanted = Object.entries(counts)
  .filter(([b, n]) => b !== 'SYPerformance' && (NAMED.has(b) || n >= 2))
  .sort((a, b) => b[1] - a[1]);

console.log(`\n${needsRename.length} products need a vendor casing fix:`);
for (const p of needsRename) console.log(`  ${p.vendor.padEnd(14)} -> ${canonOf(p.vendor).padEnd(14)} ${p.title.slice(0, 44)}`);

console.log(`\n${wanted.length} brand pages:`);
for (const [b, n] of wanted) console.log(`  ${String(n).padStart(3)}  ${b}${BLURB[b] ? '' : '   (no blurb — generic copy)'}`);

if (!APPLY) { console.log('\nDry run. Re-run with --apply.'); process.exit(0); }

// --- 1. normalise vendor casing ---------------------------------------------
const UPD = `mutation($input: ProductInput!){ productUpdate(input:$input){ product{ id vendor } userErrors{ field message } } }`;
for (const p of needsRename) {
  const r = await gql(UPD, { input: { id: p.id, vendor: canonOf(p.vendor) } });
  const e = r.productUpdate.userErrors;
  if (e.length) console.error(`  FAILED ${p.handle}: ${JSON.stringify(e)}`);
}
console.log(`\nRenamed ${needsRename.length} vendors.`);

// --- 2. create/populate/publish brand collections ----------------------------
const existing = {};
{
  let cursor = null;
  do {
    const d = await gql(`query($c:String){ collections(first:100, after:$c){ pageInfo{hasNextPage endCursor} nodes{ id handle } } }`, { c: cursor });
    for (const n of d.collections.nodes) existing[n.handle] = n.id;
    cursor = d.collections.pageInfo.hasNextPage ? d.collections.pageInfo.endCursor : null;
  } while (cursor);
}
const pubs = await gql(`{ publications(first:20){ nodes{ id name } } }`);
const online = pubs.publications.nodes.find(p => /online store/i.test(p.name));

// Two brands already have a collection from Phase 2 under a bare handle. Reuse
// them rather than shipping brand-synchro-solutionz alongside synchro-solutionz.
const ALIAS = { 'Synchro Solutionz': 'synchro-solutionz', 'Comp 1 Clutch': 'comp-1-clutch' };
const slug = b => b.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const CREATE = `mutation($input: CollectionInput!){ collectionCreate(input:$input){ collection{ id handle } userErrors{ field message } } }`;
const ADD = `mutation($id: ID!, $productIds:[ID!]!){ collectionAddProductsV2(id:$id, productIds:$productIds){ job{ id } userErrors{ field message } } }`;
const PUBLISH = `mutation($id: ID!, $input:[PublicationInput!]!){ publishablePublish(id:$id, input:$input){ userErrors{ field message } } }`;

for (const [brand, n] of wanted) {
  const handle = ALIAS[brand] || `brand-${slug(brand)}`;
  let id = existing[handle];
  if (!id) {
    const body = BLURB[brand] || `${brand} parts stocked by SYPerformance.`;
    const r = await gql(CREATE, { input: { handle, title: brand, descriptionHtml: `<p>${body}</p>` } });
    const e = r.collectionCreate.userErrors;
    if (e.length) { console.error(`  FAILED ${handle}: ${JSON.stringify(e)}`); continue; }
    id = r.collectionCreate.collection.id;
  }
  const ids = products.filter(p => canonOf(p.vendor) === brand).map(p => p.id);
  await gql(ADD, { id, productIds: ids });
  if (online) await gql(PUBLISH, { id, input: [{ publicationId: online.id }] });
  console.log(`  ${handle.padEnd(28)} ${ids.length} products`);
}

await sleep(6000);
console.log('\nDone. Verify with a storefront fetch.');
