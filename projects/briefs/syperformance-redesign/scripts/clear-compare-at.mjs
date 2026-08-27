// Remove compare-at prices from the parts SYPerformance manufactures.
//
// Spencer, 2026-08-26: "get rid of the compare at prices." Checklist 4.8 had it as
// a recommendation; the trust ruleset makes the reason explicit. A compare-at price
// renders a SALE badge, and a permanent SALE badge on the parts whose page argues
// they are the best-designed thing you can bolt to the car argues the opposite.
// Nobody discounts the part they believe in.
//
// Scope: the 75 confirmed in-house handles only. Resold parts keep their compare-at
// prices — a genuine discount on somebody else's catalog part is a normal retail
// move and not this brand's positioning problem to solve.
//
// One exception, and it is a data defect rather than a pricing decision: a variant
// whose compare-at EQUALS its price renders a SALE badge advertising no discount at
// all. Those are cleared wherever they appear, in-house or not, and reported
// separately below.
//
//   node scripts/clear-compare-at.mjs           # dry run
//   node scripts/clear-compare-at.mjs --apply
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

const snippet = fs.readFileSync(path.join(ROOT, 'theme', 'snippets', 'syp-in-house-handles.liquid'), 'utf8');
const IN_HOUSE = new Set(snippet.match(/assign syp_h_syperformance = '([^']+)'/)[1].split(','));

const products = [];
{
  let cursor = null;
  do {
    const d = await gql(`query($c:String){ products(first:100, after:$c){ pageInfo{hasNextPage endCursor} nodes{ id handle title variants(first:100){ nodes{ id title price compareAtPrice } } } } }`, { c: cursor });
    products.push(...d.products.nodes);
    cursor = d.products.pageInfo.hasNextPage ? d.products.pageInfo.endCursor : null;
  } while (cursor);
}

const work = [];
const noDiscount = [];
for (const p of products) {
  const withCompare = p.variants.nodes.filter(v => v.compareAtPrice && Number(v.compareAtPrice) > 0);
  if (!withCompare.length) continue;
  const inHouse = IN_HOUSE.has(p.handle);
  const equal = withCompare.filter(v => Number(v.compareAtPrice) === Number(v.price));
  if (!inHouse && equal.length) noDiscount.push({ p, variants: equal });
  if (inHouse) work.push({ p, variants: withCompare, reason: 'in-house' });
}

console.log(`In-house products carrying a compare-at price: ${work.length}`);
for (const w of work) {
  const inverted = w.variants.some(v => Number(v.compareAtPrice) < Number(v.price));
  console.log(`  ${w.p.handle}${inverted ? '   [compare-at BELOW price - renders nothing useful]' : ''}`);
  for (const v of w.variants) console.log(`      ${v.title}: $${v.price}  was $${v.compareAtPrice}`);
}
if (noDiscount.length) {
  console.log(`\nResold products advertising a SALE with no discount (compare-at === price): ${noDiscount.length}`);
  for (const n of noDiscount) {
    console.log(`  ${n.p.handle}`);
    for (const v of n.variants) console.log(`      ${v.title}: $${v.price}  was $${v.compareAtPrice}`);
  }
}

const targets = [...work, ...noDiscount.map(n => ({ ...n, reason: 'no-discount' }))];
const variantCount = targets.reduce((n, t) => n + t.variants.length, 0);
if (!targets.length) { console.log('\nNothing to clear.'); process.exit(0); }
if (!APPLY) { console.log(`\n${variantCount} variants across ${targets.length} products. Re-run with --apply.`); process.exit(0); }

console.log('');
for (const t of targets) {
  const res = await gql(
    `mutation($pid:ID!,$v:[ProductVariantsBulkInput!]!){ productVariantsBulkUpdate(productId:$pid, variants:$v){ userErrors{ field message } } }`,
    { pid: t.p.id, v: t.variants.map(v => ({ id: v.id, compareAtPrice: null })) }
  );
  const errs = res.productVariantsBulkUpdate.userErrors;
  if (errs.length) console.error(`  ${t.p.handle}: ${JSON.stringify(errs)}`);
  else console.log(`  cleared ${String(t.variants.length).padStart(2)} variant(s)  ${t.p.handle}  (${t.reason})`);
}

// Read it back rather than trusting the mutation response.
let remaining = 0;
for (const t of targets) {
  const d = await gql(`query($h:String!){ productByHandle(handle:$h){ variants(first:100){ nodes{ compareAtPrice } } } }`, { h: t.p.handle });
  remaining += d.productByHandle.variants.nodes.filter(v => v.compareAtPrice && Number(v.compareAtPrice) > 0).length;
}
console.log(`\nVerified: ${remaining} compare-at prices remaining on the products touched.`);
