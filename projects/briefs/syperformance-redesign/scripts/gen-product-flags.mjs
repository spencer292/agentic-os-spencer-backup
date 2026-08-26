/**
 * Phase 4 — generate the product-flag fallback snippet.
 *
 * The product template branches on whether a part is made in-house. The real
 * source for that is the `custom.made_in_house` metafield, which Phase 3 defines
 * and which needs an Admin API token to write. Until then the template falls
 * back to this generated list, built from the Phase 0 audit.
 *
 * Three rules, and they matter:
 *
 * 1. Only `origin = IN-HOUSE` gets in. The 51 products the audit could not call
 *    are NOT listed, so they render as resold. Never claim manufacture without
 *    evidence — a "MADE IN-HOUSE" badge on a resold Hondata ECU is worse than
 *    no badge at all.
 * 2. The metafield always wins when present. This list is a stopgap, not a
 *    second source of truth, and it disappears the moment Phase 3 lands.
 * 3. It is generated, never hand-edited. Re-run after any audit change.
 *
 *   node scripts/gen-product-flags.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const products = JSON.parse(readFileSync(join(root, 'data', 'product-audit.json'), 'utf8'));

const inHouse = products.filter((p) => p.origin === 'IN-HOUSE');
const unknown = products.filter((p) => p.origin === 'UNKNOWN');
const resold = products.filter((p) => p.origin === 'RESOLD');

const brandOf = (p) => p.brand || 'SYPerformance';
const byBrand = new Map();
for (const p of inHouse) {
  if (!byBrand.has(brandOf(p))) byBrand.set(brandOf(p), []);
  byBrand.get(brandOf(p)).push(p.handle);
}

const lines = [];
lines.push('{%- doc -%}');
lines.push('  GENERATED FILE — do not edit by hand.');
lines.push('  Source: scripts/gen-product-flags.mjs, from data/product-audit.json (Phase 0).');
lines.push('');
lines.push('  Outputs the manufacturing brand for an in-house part, or nothing at all.');
lines.push('  Liquid `render` is scope-isolated, so this returns a value to be captured');
lines.push('  rather than assigning variables the caller can read.');
lines.push('');
lines.push('  Fallback only. snippets/syp-product-flags.liquid reads the');
lines.push('  `custom.made_in_house` metafield first and consults this when it is absent.');
lines.push('');
lines.push(`  In-house: ${inHouse.length}   Resold: ${resold.length}   Unclassified: ${unknown.length}`);
lines.push('');
lines.push('  The unclassified products are deliberately absent, so they resolve as resold');
lines.push('  until Spencer marks them in data/unknowns-review.csv. Claiming manufacture on');
lines.push('  a part nobody has confirmed is the mistake this file exists to prevent.');
lines.push('');
lines.push('  @param {object} product - The product to test');
lines.push('{%- enddoc -%}');
lines.push('');
lines.push('{%- liquid');

let first = true;
for (const [brand, handles] of byBrand) {
  const key = brand.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  lines.push(`  assign syp_h_${key} = '${handles.sort().join(',')}' | split: ','`);
}
lines.push('');
for (const [brand] of byBrand) {
  const key = brand.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  lines.push(`  ${first ? 'if' : 'elsif'} syp_h_${key} contains product.handle`);
  lines.push(`    echo '${brand.replace(/'/g, "\'")}'`);
  first = false;
}
lines.push('  endif');
lines.push('-%}');
lines.push('');

writeFileSync(join(root, 'theme', 'snippets', 'syp-in-house-handles.liquid'), lines.join('\n'), 'utf8');

console.log(`Wrote theme/snippets/syp-in-house-handles.liquid`);
console.log(`  in-house      ${inHouse.length}`);
for (const [brand, handles] of byBrand) console.log(`    ${brand.padEnd(20)} ${handles.length}`);
console.log(`  resold        ${resold.length}`);
console.log(`  unclassified  ${unknown.length}  -> render as resold until reviewed`);
