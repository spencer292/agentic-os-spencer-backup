// Phase 8: what is inside compiled_assets/styles.css, and how much of it can any
// page on this theme actually render?
//
// Shopify concatenates every {% stylesheet %} block in the theme into one file and
// serves it, render-blocking, on every page. It does not matter whether the section
// that owns the CSS is on the page — the bytes ship regardless. Measured cost of
// that bundle on this build: mobile FCP 1,744-2,112 ms with it, ~1,200 ms without.
//
// This walks the reachability graph from the real entry points (layout, template
// JSON/Liquid, the header and footer groups) through render/include/section/
// content_for, and reports which files with a {% stylesheet %} block are never
// reachable — i.e. pure weight.
//
//   node scripts/audit-css-bundle.mjs            # what nothing can ever render
//   node scripts/audit-css-bundle.mjs --strict   # what the current templates do render
//
// The default walk counts a block as reachable if any section's schema declares it,
// because a merchant can add it in the theme editor. --strict counts only what the
// committed templates actually render, so the gap between the two numbers is the
// price of keeping Horizon's editor flexibility.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const STRICT = process.argv.includes('--strict');
const ROOT = path.join(path.dirname(path.dirname(fileURLToPath(import.meta.url))), 'theme');
const read = p => fs.readFileSync(p, 'utf8');
const exists = p => fs.existsSync(p);

const stylesheetBytes = src => {
  let n = 0;
  for (const m of src.matchAll(/\{%-?\s*stylesheet\s*-?%\}([\s\S]*?)\{%-?\s*endstylesheet\s*-?%\}/g)) n += m[1].length;
  return n;
};

// Resolve a logical name to a file, trying the block underscore convention too.
function resolve(kind, name) {
  for (const candidate of [
    path.join(ROOT, kind, `${name}.liquid`),
    kind === 'blocks' ? path.join(ROOT, 'blocks', `_${name}.liquid`) : null
  ]) {
    if (candidate && exists(candidate)) return candidate;
  }
  return null;
}

const seen = new Set();
const queue = [];
const push = p => { if (p && !seen.has(p)) { seen.add(p); queue.push(p); } };

// --- roots -------------------------------------------------------------------
for (const f of fs.readdirSync(path.join(ROOT, 'layout'))) push(path.join(ROOT, 'layout', f));

function sectionsFromJson(src) {
  // Section group files and template JSON both key sections/blocks by "type".
  const out = [];
  for (const m of src.matchAll(/"type"\s*:\s*"([a-zA-Z0-9_@\/-]+)"/g)) out.push(m[1]);
  return out;
}

for (const dir of ['templates', 'sections']) {
  for (const f of fs.readdirSync(path.join(ROOT, dir))) {
    const p = path.join(ROOT, dir, f);
    if (f.endsWith('.liquid') && dir === 'templates') { push(p); continue; }
    if (!f.endsWith('.json')) continue;
    // Only the two section groups count as roots inside sections/.
    if (dir === 'sections' && !f.endsWith('-group.json')) continue;
    for (const type of sectionsFromJson(read(p))) {
      push(resolve('sections', type));
      push(resolve('blocks', type));
    }
  }
}

// --- walk --------------------------------------------------------------------
// Block schemas declare which child blocks a section accepts; a template using
// {% content_for 'blocks' %} can render any of them, so they count as reachable.
while (queue.length) {
  const p = queue.shift();
  const src = read(p);

  for (const m of src.matchAll(/\{%-?\s*(?:render|include)\s+'([^']+)'/g)) push(resolve('snippets', m[1]));
  for (const m of src.matchAll(/\{%-?\s*(?:render|include)\s+"([^"]+)"/g)) push(resolve('snippets', m[1]));
  for (const m of src.matchAll(/\{%-?\s*section\s+'([^']+)'/g)) push(resolve('sections', m[1]));
  for (const m of src.matchAll(/\{%-?\s*sections\s+'([^']+)'/g)) {
    const groupFile = path.join(ROOT, 'sections', `${m[1]}-group.json`);
    if (exists(groupFile)) for (const type of sectionsFromJson(read(groupFile))) {
      push(resolve('sections', type));
      push(resolve('blocks', type));
    }
  }
  for (const m of src.matchAll(/content_for\s+'block'\s*,\s*type:\s*'([^']+)'/g)) push(resolve('blocks', m[1]));
  // Child block types a section's schema declares. Not rendered unless a template
  // asks for them, but addable in the theme editor — so they only count outside --strict.
  if (!STRICT) {
    const schema = src.match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/);
    if (schema) for (const m of schema[1].matchAll(/"type"\s*:\s*"([a-zA-Z0-9_@\/-]+)"/g)) push(resolve('blocks', m[1]));
  }
}

// --- report ------------------------------------------------------------------
let reachableBytes = 0, deadBytes = 0;
const dead = [];
for (const dir of ['sections', 'snippets', 'blocks', 'layout']) {
  for (const f of fs.readdirSync(path.join(ROOT, dir))) {
    if (!f.endsWith('.liquid')) continue;
    const p = path.join(ROOT, dir, f);
    const n = stylesheetBytes(read(p));
    if (!n) continue;
    if (seen.has(p)) reachableBytes += n;
    else { deadBytes += n; dead.push([n, path.relative(ROOT, p)]); }
  }
}
dead.sort((a, b) => b[0] - a[0]);

const kb = n => (n / 1024).toFixed(1) + ' KB';
console.log(`
{%% stylesheet %%} bytes, uncompressed${STRICT ? '  [--strict: only what the templates render today]' : ''}:`);
console.log(`  reachable from a real entry point : ${kb(reachableBytes)}`);
console.log(`  unreachable (pure bundle weight)  : ${kb(deadBytes)}  — ${(100 * deadBytes / (deadBytes + reachableBytes)).toFixed(0)}% of the bundle`);
console.log(`\nUnreachable files (${dead.length}), largest first:`);
for (const [n, p] of dead) console.log(`  ${String(n).padStart(6)}  ${p}`);
