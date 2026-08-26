/**
 * Phase 7 — fix the vendor field.
 *
 *   node scripts/apply-brands.mjs            # dry run + writes the review CSV
 *   node scripts/apply-brands.mjs --apply
 *
 * Phase 0 called this "arguably the highest-leverage single SEO change on the
 * site". It is not an inconsistency, it is wrong data: the vendor field is being
 * used as the STORE's name rather than the BRAND's, so it says "Syperformance"
 * on Walbro fuel pumps, Mickey Thompson tires, AEM sensors, Hondata KPro,
 * Injector Dynamics injectors and Vibrant mufflers.
 *
 * That matters more than tidiness because Horizon emits product structured data
 * with Shopify's `structured_data` filter, which reads `brand` directly from
 * `vendor`. Every one of those products is currently telling Google that
 * SYPerformance manufactures it. Fixing the field fixes the schema at the same
 * time, with no template change.
 *
 * Same field is also spelled four ways for the house brand — Syperformance,
 * syperformance, SYP, and the Synchro variants — which splits one entity into
 * several as far as search is concerned.
 *
 * Three groups, three different treatments:
 *
 *   IN-HOUSE (110)  set to the canonical house brand. Safe: the audit confirmed
 *                   these and Spencer has not disputed them.
 *   RESOLD (36)     set to the real manufacturer, casing normalised.
 *   UNKNOWN (52)    spelling normalised only. We do NOT assert a manufacturer
 *                   for a part nobody has confirmed — that is the very mistake
 *                   this script exists to undo. They go in the review CSV.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const repoRoot = join(root, '..', '..', '..');

const APPLY = process.argv.includes('--apply');
const GUARD = 'syperformance-build.myshopify.com';

function loadEnv() {
  const raw = readFileSync(join(repoRoot, '.env'), 'utf8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = loadEnv();
const STORE = env.SHOPIFY_BUILD_STORE;
const TOKEN = env.SHOPIFY_BUILD_ADMIN_TOKEN;

if (!STORE || !TOKEN) {
  console.error('Missing credentials. Run: node scripts/check-token.mjs');
  process.exit(1);
}
if (STORE !== GUARD) {
  console.error(`Refusing to run against "${STORE}".`);
  process.exit(1);
}

const API = `https://${STORE}/admin/api/2025-07/graphql.json`;
let calls = 0;

async function gql(query, variables = {}) {
  calls++;
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 2000));
    return gql(query, variables);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const body = await res.json();
  if (body.errors) throw new Error(`GraphQL: ${JSON.stringify(body.errors).slice(0, 400)}`);
  return body.data;
}

/**
 * Canonical spellings. The audit's `brand` field is mostly right but carries the
 * store's own casing inconsistencies through, so normalise explicitly rather
 * than title-casing — "AEM" and "BF Gears USA" both break a naive rule.
 */
const CANON = {
  syperformance: 'SYPerformance',
  syp: 'SYPerformance',
  'synchro solutionz': 'Synchro Solutionz',
  'synchro solutions': 'Synchro Solutionz',
  'comp 1 clutch': 'Comp 1 Clutch',
  aem: 'AEM',
  pulsar: 'Pulsar',
  blox: 'Blox',
  turbosmart: 'Turbosmart',
  translab: 'Translab',
  honda: 'Honda',
  'bf gears': 'BF Gears USA',
  'bf gears usa': 'BF Gears USA',
  walbro: 'Walbro',
  koyo: 'Koyo',
  'mickey thompson': 'Mickey Thompson',
  vibrant: 'Vibrant',
  deatschwerks: 'DeatschWerks',
  'injector dynamics': 'Injector Dynamics',
  'fuel injector clinic': 'Fuel Injector Clinic',
  'competition clutch': 'Competition Clutch',
  hondata: 'Hondata',
  rywire: 'Rywire',
};

const canonical = (name) => CANON[String(name || '').trim().toLowerCase()] ?? String(name || '').trim();

const products = JSON.parse(readFileSync(join(root, 'data', 'product-audit.json'), 'utf8'));

console.log(`Store:  ${STORE}`);
console.log(`Mode:   ${APPLY ? 'APPLY — writing' : 'DRY RUN — nothing will be written'}`);

// handle -> {id, vendor}
const live = new Map();
let cursor = null;
for (;;) {
  const data = await gql(
    `query($cursor: String) {
      products(first: 250, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        nodes { id handle vendor }
      }
    }`,
    { cursor }
  );
  for (const n of data.products.nodes) live.set(n.handle, { id: n.id, vendor: n.vendor });
  if (!data.products.pageInfo.hasNextPage) break;
  cursor = data.products.pageInfo.endCursor;
}

const changes = [];
const review = [];
const stats = { 'IN-HOUSE': 0, RESOLD: 0, UNKNOWN: 0, unchanged: 0, missing: 0 };

for (const p of products) {
  const rec = live.get(p.handle);
  if (!rec) {
    stats.missing++;
    continue;
  }

  const target = canonical(p.origin === 'UNKNOWN' ? 'SYPerformance' : p.brand);

  if (p.origin === 'UNKNOWN') {
    review.push({
      handle: p.handle,
      title: p.title,
      currentVendor: rec.vendor,
      note: 'Unconfirmed — vendor spelling normalised only. Is this made in-house or resold?',
    });
  }

  if (rec.vendor === target) {
    stats.unchanged++;
    continue;
  }

  stats[p.origin]++;
  changes.push({ id: rec.id, handle: p.handle, from: rec.vendor, to: target, origin: p.origin });
}

// A compact sample rather than 160 lines of output.
const byPair = new Map();
for (const c of changes) {
  const key = `${c.from} -> ${c.to}`;
  byPair.set(key, (byPair.get(key) ?? 0) + 1);
}

console.log(`\n== VENDOR CHANGES (${changes.length}) ==`);
for (const [pair, n] of [...byPair.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${pair}`);
}
console.log(`\n  in-house ${stats['IN-HOUSE']}   resold ${stats.RESOLD}   unconfirmed ${stats.UNKNOWN}`);
console.log(`  already correct ${stats.unchanged}${stats.missing ? `   not in store ${stats.missing}` : ''}`);

// Review CSV for the 52 the audit could not call.
const csv = [
  'handle,title,currentVendor,note,ownerDecision',
  ...review.map((r) =>
    [r.handle, r.title, r.currentVendor, r.note, ''].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
  ),
].join('\n');
writeFileSync(join(root, 'data', 'brand-review.csv'), csv, 'utf8');
console.log(`\nWrote data/brand-review.csv — ${review.length} products needing Spencer's call.`);

if (!APPLY) {
  console.log('\nDry run only. Re-run with --apply to write.');
  process.exit(0);
}

for (let i = 0; i < changes.length; i += 20) {
  const batch = changes.slice(i, i + 20);
  await Promise.all(
    batch.map(async (c) => {
      const data = await gql(
        `mutation($product: ProductUpdateInput!) {
          productUpdate(product: $product) { product { id } userErrors { field message } }
        }`,
        { product: { id: c.id, vendor: c.to } }
      );
      const errs = data.productUpdate.userErrors ?? [];
      if (errs.length) throw new Error(`${c.handle}: ${errs.map((e) => e.message).join('; ')}`);
    })
  );
  console.log(`   …${Math.min(i + 20, changes.length)}/${changes.length}`);
}

console.log(`\nDone. ${calls} API calls.`);
