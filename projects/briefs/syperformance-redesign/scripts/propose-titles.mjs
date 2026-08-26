/**
 * Phase 7 — propose standardised product titles.
 *
 *   node scripts/propose-titles.mjs
 *
 * Writes data/title-review.csv. Nothing is applied. The plan is explicit that
 * this goes to Spencer first — "Generate as CSV for my review before importing"
 * — and titles are the most visible text on the site, so a bad automated rewrite
 * is worse than a messy human one.
 *
 * What Phase 0 found: titles are a mix of `SYPerformance Honda K Series...`,
 * `SYP Bseries...`, and `MITSUBISHI EVO X TOP MOUNT TURBO MANIFOLD V BAND` in
 * full caps. Four spellings of the house brand. The target shape is:
 *
 *     SYPerformance [Platform] [Part] — [key spec or fitment]
 *
 * This proposes the first three; the trailing spec is left to Spencer because it
 * needs knowledge of the part, not string rules.
 *
 * ALL-CAPS is the one change made confidently. Everything else is proposed with
 * a stated reason so a reviewer can disagree per row.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

/**
 * Tokens that must keep their exact casing. Title-casing rules destroy every one
 * of these — "AWD" becomes "Awd", "B58" survives but "RSX" becomes "Rsx" — and
 * on a parts site those strings are the product.
 */
const KEEP = [
  'SYPerformance', 'AWD', 'FWD', 'RWD', 'SFWD', 'HD', 'LSD', 'CNC', 'OEM', 'VSS', 'VTEC',
  'B58', 'S58', 'B48', 'K20', 'K24', 'K20A2', 'B16', 'B18', 'B18A', 'B18B', 'H22', 'H23',
  'RSX', 'TSX', 'DC2', 'DC5', 'EP3', 'EG', 'EK', 'FG2', 'FA5', 'CT9A', 'CZ4A', 'A90', 'A91',
  'T3', 'T4', 'T3/T4', 'BOV', 'ECU', 'IAT', 'PSI', 'LPH', 'MM', 'ID', 'US', 'JDM', 'SBXM',
  'V2', 'V3', 'BMW', 'AEM', 'FIC', 'KPro', 'M10x1.5', 'RBC', 'RBB', 'UJ', 'PTE', 'S2000',
  'II', 'III', 'QR', 'GSR', 'ITR', 'LS', 'SI', 'TYPE-R',
];
const KEEP_MAP = new Map(KEEP.map((k) => [k.toLowerCase(), k]));

// Articles and conjunctions only. "on", "in" and "to" are particles in part
// names — "Weld On Fittings", "Block Off Plate" — and lowercasing them reads
// as a typo rather than as style.
const SMALL = new Set(['a', 'an', 'and', 'the', 'or', 'of']);

/** Words the store spells inconsistently. */
const FIXES = [
  [/\bsyperformance\b/gi, 'SYPerformance'],
  [/\bsyp\b(?!erformance)/gi, 'SYPerformance'],
  [/\bsynchro\s+solutions\b/gi, 'Synchro Solutionz'],
  [/\bbseries\b/gi, 'B Series'],
  [/\bkseries\b/gi, 'K Series'],
  [/\bvband\b/gi, 'V-Band'],
  [/\bv\s+band\b/gi, 'V-Band'],
  [/\bscatter\s+sheild\b/gi, 'Scatter Shield'],
  [/\btcase\b/gi, 'Transfer Case'],
  [/\bhalfshaft\b/gi, 'Halfshaft'],
  [/\btitanuim\b/gi, 'Titanium'],
  [/\blancer\s+evolution\b/gi, 'Lancer Evo'],
];

function titleCase(str) {
  return str
    .split(/(\s+)/)
    .map((word) => {
      if (/^\s+$/.test(word)) return word;
      const bare = word.replace(/[^A-Za-z0-9./-]/g, '');
      const keep = KEEP_MAP.get(bare.toLowerCase());
      if (keep) return word.replace(bare, keep);
      if (/\d/.test(word)) return word; // sizes, part codes, years — leave alone

      // Slash-joined platform codes: "B/D/F/H-Series" must not become
      // "B/d/f/h-series". Each fragment is cased on its own.
      if (word.includes('/')) {
        return word
          .split('/')
          .map((part) => {
            const k = KEEP_MAP.get(part.replace(/[^A-Za-z0-9]/g, '').toLowerCase());
            if (k) return part.replace(/[A-Za-z0-9]+/, k);
            if (part.length <= 2) return part.toUpperCase();
            return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
          })
          .join('/');
      }

      const lower = word.toLowerCase();
      if (SMALL.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
}

const products = JSON.parse(readFileSync(join(root, 'data', 'product-audit.json'), 'utf8'));

const rows = [];
let allCaps = 0;
let brandFixed = 0;
let changed = 0;

for (const p of products) {
  const original = p.title;
  const reasons = [];

  let next = original.replace(/\s+/g, ' ').trim();

  // ALL CAPS — the confident change.
  const letters = next.replace(/[^A-Za-z]/g, '');
  const isShouting = letters.length > 6 && letters === letters.toUpperCase();
  if (isShouting) {
    next = titleCase(next);
    reasons.push('was ALL CAPS');
    allCaps++;
  } else {
    // Still normalise the KEEP tokens so "Awd" and "Vband" get corrected.
    next = titleCase(next);
  }

  for (const [re, to] of FIXES) {
    if (re.test(next)) {
      next = next.replace(re, to);
      if (!reasons.includes('spelling normalised')) reasons.push('spelling normalised');
    }
  }

  // In-house parts lead with the brand, one word, once.
  if (p.origin === 'IN-HOUSE' && p.brand === 'SYPerformance' && !/^SYPerformance\b/.test(next)) {
    next = `SYPerformance ${next}`;
    reasons.push('brand prefix added');
    brandFixed++;
  }

  next = next.replace(/\s+/g, ' ').trim();

  if (next !== original) changed++;

  rows.push({
    handle: p.handle,
    origin: p.origin,
    brand: p.brand,
    current: original,
    proposed: next === original ? '' : next,
    reason: reasons.join('; '),
    approved: '',
  });
}

const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
const csv = [
  'handle,origin,brand,currentTitle,proposedTitle,reason,approvedTitle',
  ...rows.map((r) => [r.handle, r.origin, r.brand, r.current, r.proposed, r.reason, r.approved].map(esc).join(',')),
].join('\n');

writeFileSync(join(root, 'data', 'title-review.csv'), csv, 'utf8');

console.log(`Wrote data/title-review.csv`);
console.log(`  ${products.length} products`);
console.log(`  ${changed} proposed changes`);
console.log(`    ${allCaps} were ALL CAPS`);
console.log(`    ${brandFixed} gained a brand prefix`);
console.log(`  ${products.length - changed} already fine`);
console.log(`\nNothing applied. Fill the approvedTitle column and hand it back.`);
