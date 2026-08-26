// What collections actually exist on the build store right now, with live product
// counts. Ground truth before adding any more — the store carries both the legacy
// collections from the old site and the 34 the Phase 2 IA created, and creating a
// duplicate handle silently makes a second page competing with the first.
//
//   node scripts/list-collections.mjs          # all, grouped
//   node scripts/list-collections.mjs --json   # machine-readable, to data/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

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
if (!STORE || !TOKEN) { console.error('SHOPIFY_BUILD_STORE / SHOPIFY_BUILD_ADMIN_TOKEN missing — see scripts/check-token.mjs'); process.exit(1); }
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

const Q = `query($cursor: String) {
  collections(first: 100, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id handle title productsCount { count } updatedAt
      ruleSet { appliedDisjunctively rules { column relation condition } }
      descriptionHtml
    }
  }
}`;

const all = [];
let cursor = null;
do {
  const d = await gql(Q, { cursor });
  all.push(...d.collections.nodes);
  cursor = d.collections.pageInfo.hasNextPage ? d.collections.pageInfo.endCursor : null;
} while (cursor);

all.sort((a, b) => b.productsCount.count - a.productsCount.count);

const hasCopy = c => (c.descriptionHtml || '').replace(/<[^>]+>/g, '').trim().length > 40;

console.log(`\n${all.length} collections on ${STORE}\n`);
console.log('  count  smart?  copy?  handle');
console.log('  ' + '-'.repeat(72));
for (const c of all) {
  console.log(
    `  ${String(c.productsCount.count).padStart(5)}  ` +
    `${(c.ruleSet ? 'smart ' : 'manual').padEnd(6)}  ` +
    `${(hasCopy(c) ? ' yes ' : ' NO  ')}  ${c.handle}`
  );
}

const empty = all.filter(c => c.productsCount.count === 0);
const fat = all.filter(c => c.productsCount.count > 30);
const noCopy = all.filter(c => !hasCopy(c));
console.log(`\n  ${fat.length} over 30 products (a wall to scan): ${fat.map(c => `${c.handle}(${c.productsCount.count})`).join(', ') || 'none'}`);
console.log(`  ${empty.length} empty: ${empty.map(c => c.handle).join(', ') || 'none'}`);
console.log(`  ${noCopy.length} with no intro copy`);

if (process.argv.includes('--json')) {
  const out = path.join(ROOT, 'data', 'collections-live.json');
  fs.writeFileSync(out, JSON.stringify(all.map(c => ({
    handle: c.handle, title: c.title, products: c.productsCount.count,
    smart: !!c.ruleSet, hasCopy: hasCopy(c)
  })), null, 2));
  console.log(`\nWrote data/collections-live.json`);
}
