// Write the tiered product copy from data/product-copy.json onto the build store.
//
// Source of truth is the JSON file, not the store: copy is reviewable and diffable in
// git, and a re-run is idempotent. Editing a description in the Shopify admin will be
// overwritten by the next run — change the JSON.
//
//   node scripts/apply-product-copy.mjs                 # dry run, reports word counts
//   node scripts/apply-product-copy.mjs --apply
//   node scripts/apply-product-copy.mjs --apply --only k-series-billet-halfshaft
//
// Where each block lands (types confirmed against the live metafield definitions):
//
//   lead            -> body_html                  HTML
//   whyThisPart     -> custom.why_this_part       rich_text_field
//   beforeYouBuy    -> custom.before_you_buy      rich_text_field
//   specs           -> custom.specs               multi_line_text_field, "Label: Value" per line
//   installNotes    -> custom.install_notes       rich_text_field
//   chassis         -> custom.chassis             list.single_line_text_field
//   turboCompat     -> custom.turbo_compat        single_line_text_field
//   wastegateCompat -> custom.wastegate_compat    single_line_text_field
//
// API note: on 2025-07 the productUpdate argument type is ProductUpdateInput, not
// ProductInput. The mismatch fails the whole mutation with a variableMismatch error
// rather than a userError, so it surfaces as a thrown exception, not a skipped write.
//
// rich_text_field will NOT accept HTML or plain text - it takes Shopify's own JSON
// document schema. The source file stays readable by writing a light markup (blank-line
// paragraphs, "- " bullets, **bold**) and converting here.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const APPLY = process.argv.includes('--apply');
const onlyIdx = process.argv.indexOf('--only');
const ONLY = onlyIdx > -1 ? process.argv[onlyIdx + 1] : null;

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

/** **bold** inside one line -> rich-text text nodes. */
function inline(text) {
  const nodes = [];
  for (const part of String(text).split(/(\*\*[^*]+\*\*)/g)) {
    if (!part) continue;
    if (part.startsWith('**') && part.endsWith('**')) nodes.push({ type: 'text', value: part.slice(2, -2), bold: true });
    else nodes.push({ type: 'text', value: part });
  }
  return nodes.length ? nodes : [{ type: 'text', value: '' }];
}

/** Light markup -> Shopify rich text JSON. Blank line = new block, "- " = list item. */
function richText(src) {
  const children = [];
  let list = null;
  for (const raw of String(src).split('\n')) {
    const line = raw.trim();
    if (!line) { list = null; continue; }
    if (line.startsWith('- ')) {
      if (!list) { list = { type: 'list', listType: 'unordered', children: [] }; children.push(list); }
      list.children.push({ type: 'list-item', children: inline(line.slice(2)) });
    } else {
      list = null;
      children.push({ type: 'paragraph', children: inline(line) });
    }
  }
  return JSON.stringify({ type: 'root', children });
}

/** Light markup -> body_html. Same conventions, so the source file reads the same throughout. */
function html(src) {
  const out = [];
  let inList = false;
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const bold = s => esc(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  for (const raw of String(src).split('\n')) {
    const line = raw.trim();
    if (!line) { if (inList) { out.push('</ul>'); inList = false; } continue; }
    if (line.startsWith('- ')) {
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push(`<li>${bold(line.slice(2))}</li>`);
    } else {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(`<p>${bold(line)}</p>`);
    }
  }
  if (inList) out.push('</ul>');
  return out.join('');
}

const wordCount = s => (String(s).replace(/[*\-]/g, ' ').match(/[A-Za-z0-9][A-Za-z0-9'’\-\/\.]*/g) || []).length;

const copy = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'product-copy.json'), 'utf8'));
const entries = Object.entries(copy.products).filter(([h]) => !ONLY || h === ONLY);
if (!entries.length) { console.error(ONLY ? `No copy for handle "${ONLY}"` : 'No copy in data/product-copy.json'); process.exit(1); }

// Resolve handles to ids, and refuse to write copy for a handle that does not exist.
const idByHandle = {};
{
  let cursor = null;
  do {
    const d = await gql(`query($c:String){ products(first:250, after:$c){ pageInfo{hasNextPage endCursor} nodes{ id handle } } }`, { c: cursor });
    for (const n of d.products.nodes) idByHandle[n.handle] = n.id;
    cursor = d.products.pageInfo.hasNextPage ? d.products.pageInfo.endCursor : null;
  } while (cursor);
}
const missing = entries.filter(([h]) => !idByHandle[h]).map(([h]) => h);
if (missing.length) { console.error(`Handles not on the store:\n  ${missing.join('\n  ')}`); process.exit(1); }

const TARGETS = { hero: [600, 900], inhouse: [350, 450], resold: [120, 180] };

console.log(`${entries.length} product(s)   ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);
let outOfBand = 0;
const plan = [];
for (const [handle, c] of entries) {
  // Count what the customer reads on the page, which includes the spec table.
  // The competitor figures in docs/competitors.md 3b are whole-page counts -
  // ETS embeds its specs and features in the description, so comparing our prose
  // alone against their 1,135 would be measuring two different things.
  const prose = wordCount(c.lead) + wordCount(c.whyThisPart || '') + wordCount(c.beforeYouBuy || '') + wordCount(c.installNotes || '');
  const total = prose + wordCount(c.specs || '');
  const [lo, hi] = TARGETS[c.tier] || [0, 1e9];
  const flag = total < lo ? ' UNDER' : total > hi ? ' OVER' : '';
  if (flag) outOfBand++;
  console.log(`  ${String(total).padStart(4)}w total  ${String(prose).padStart(4)}w prose  ${c.tier.padEnd(8)} ${handle}${flag}`);
  plan.push({ handle, c });
}
console.log(`\nTargets: hero ${TARGETS.hero.join('-')}   inhouse ${TARGETS.inhouse.join('-')}   resold ${TARGETS.resold.join('-')}`);
if (outOfBand) console.log(`${outOfBand} outside their band.`);
if (!APPLY) { console.log('\nRe-run with --apply.'); process.exit(0); }

console.log('');
for (const { handle, c } of plan) {
  const id = idByHandle[handle];
  const r1 = await gql(`mutation($p:ProductUpdateInput!){ productUpdate(product:$p){ userErrors{ field message } } }`,
    { p: { id, descriptionHtml: html(c.lead) } });
  if (r1.productUpdate.userErrors.length) { console.error(`  ${handle}: ${JSON.stringify(r1.productUpdate.userErrors)}`); continue; }

  const mf = [];
  const push = (key, type, value) => { if (value != null && String(value).trim() !== '') mf.push({ ownerId: id, namespace: 'custom', key, type, value }); };
  push('why_this_part', 'rich_text_field', c.whyThisPart && richText(c.whyThisPart));
  push('before_you_buy', 'rich_text_field', c.beforeYouBuy && richText(c.beforeYouBuy));
  push('install_notes', 'rich_text_field', c.installNotes && richText(c.installNotes));
  push('specs', 'multi_line_text_field', c.specs);
  push('turbo_compat', 'single_line_text_field', c.turboCompat);
  push('wastegate_compat', 'single_line_text_field', c.wastegateCompat);
  if (c.chassis?.length) push('chassis', 'list.single_line_text_field', JSON.stringify(c.chassis));
  if (c.hpRating) push('hp_rating', 'number_integer', String(c.hpRating));
  if (c.buildTime) push('build_time', 'single_line_text_field', c.buildTime);

  if (mf.length) {
    const r2 = await gql(`mutation($m:[MetafieldsSetInput!]!){ metafieldsSet(metafields:$m){ userErrors{ field message } } }`, { m: mf });
    if (r2.metafieldsSet.userErrors.length) { console.error(`  ${handle}: ${JSON.stringify(r2.metafieldsSet.userErrors)}`); continue; }
  }
  console.log(`  wrote ${String(mf.length).padStart(2)} metafield(s) + lead   ${handle}`);
}
