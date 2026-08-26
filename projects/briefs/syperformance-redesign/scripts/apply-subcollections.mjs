// Creates the twelve level-3 collections from docs/catalogue-restructure.md §2.
//
//   node scripts/apply-subcollections.mjs           # dry run — shows what it would do
//   node scripts/apply-subcollections.mjs --apply   # create them
//
// Purely additive: nothing is deleted, no existing handle changes, so the Phase 2
// redirect map and the live Merchant Center listings are untouched. Re-running is
// safe — an existing handle is reported and skipped, never duplicated.
//
// Membership comes from data/taxonomy.json (scripts/build-taxonomy.mjs), so the
// classification is reproducible and reviewable rather than hand-typed.
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
if (!STORE || !TOKEN) { console.error('Missing store/token — see scripts/check-token.mjs'); process.exit(1); }
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

const taxonomy = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'taxonomy.json'), 'utf8')).products;
const P = (f) => taxonomy.filter(f);

// Intro copy is written to the same rule as the existing 33 (docs/ia.md §4): what
// the category is and what decision the buyer is making. No horsepower figures, no
// tolerances, no materials, no lead times — those are SY's to supply.
const COLLECTIONS = [
  {
    handle: 'k-series-synchros',
    title: 'K-Series Synchros & Rebuild Kits',
    match: p => p.platformKey === 'honda-k-series' && p.partType === 'synchros',
    body: `Synchro Solutionz synchros, hubs, sliders and springs for the K-series six-speed and five-speed, manufactured by SYPerformance. Synchro wear is the failure most owners misread as "the box needs rebuilding" — a grind into second or third under load is usually a cone and a slider, not a gearset. Available per-gear and as full 1-4 and 1-6 refreshes, with and without bearings and seals. Work out which gear is actually complaining before you buy the whole kit.`
  },
  {
    handle: 'b-h-series-synchros',
    title: 'B/H-Series Synchros & Rebuild Kits',
    match: p => p.platformKey === 'honda-b-d-h-series' && p.partType === 'synchros',
    body: `Brass and dual cone synchro kits, single cone synchros and per-gear sets for the Honda B and H series, manufactured by SYPerformance. Covers B16, B18, GSR, ITR, H22 and Accord Euro boxes, including AWD applications and the 5th gear sets these transmissions are known for. The families share a case but not every synchro — check the gear and the cone size against your box rather than the engine badge.`
  },
  {
    handle: 'k-series-transmission-hardware',
    title: 'K-Series Bearings, Seals & Gears',
    match: p => p.platformKey === 'honda-k-series' && ['bearings-seals', 'gears'].includes(p.partType),
    body: `Bearing kits, seal kits, collars and individual gears for the K-series transmission. The parts that go back in alongside a synchro refresh, and the ones worth replacing while the box is already apart — a bearing that was fine on the bench is rarely fine two seasons later. Includes OEM-spec second gear and dog fifth gear sets for builds that have outgrown the standard ratios.`
  },
  {
    handle: 'k-series-awd-driveline',
    title: 'K-Series AWD, Halfshafts & Transfer Case',
    match: p => p.platformKey === 'honda-k-series' && ['halfshafts', 'halfshaft-carriers', 'bellhousings', 'transfer-case', 'shift-selectors'].includes(p.partType),
    body: `Billet halfshafts and carriers, AWD bellhousings, transfer case block-offs and HD shift selectors for the K-series. This is the hardware that decides whether a built K-swap puts its power down or spends the season breaking axles. The carrier is the part most people find out about the hard way — a stock intermediate shaft support flexes under load, and once it does, the inner joint angle changes on every launch.`
  },
  {
    handle: 'honda-k-turbo-manifolds',
    title: 'Honda K-Series Turbo Manifolds',
    match: p => p.platformKey === 'honda-k-series' && p.partType === 'turbo-manifolds',
    body: `SYPerformance turbo manifolds for the Honda K-series — top mount, sidewinder, forward facing, mini ram and bottom mount ram horn, in both FWD and RWD layouts. Manifold choice sets turbo position, and turbo position sets what else has to move: hood clearance, downpipe routing, wastegate placement, charge piping. Decide the layout before you buy the turbo, not after. Read the fitment notes on each product before committing.`
  },
  {
    handle: 'evo-turbo-manifolds',
    title: 'Mitsubishi Evo Turbo Manifolds',
    match: p => ['mitsubishi-evo-7-8-9', 'mitsubishi-evo-x'].includes(p.platformKey) && p.partType === 'turbo-manifolds',
    body: `Turbo manifolds for the Mitsubishi Evo 7/8/9 and Evo X — stock placement, top mount V-band, bottom mount and forward facing. The 4G63 and the 4B11 do not share parts, so pick your generation before you shop. On this platform the manifold drives everything downstream: turbo position determines the downpipe, the wastegate routing and the intercooler piping, and changing your mind later means buying those twice.`
  },
  {
    handle: 'honda-b-d-h-turbo-manifolds',
    title: 'Honda B/D/H Turbo Manifolds',
    match: p => p.platformKey === 'honda-b-d-h-series' && p.partType === 'turbo-manifolds',
    body: `Turbo manifolds for the Honda B, D and H series — top mount, mini ram, ram horn and forward facing SFWD layouts. Covers B16, B18, GSR, ITR, D series and H22 applications. Runner design is a trade between spool, packaging and how the manifold survives heat cycling; the product pages say which trade each one makes. Check hood and firewall clearance for your chassis before choosing a layout.`
  },
  {
    handle: 'honda-k-series-engine',
    title: 'Honda K-Series Engine & Valvetrain',
    match: p => p.platformKey === 'honda-k-series' && p.system === 'engine',
    body: `Single lobe billet rockers, billet timing chain guides, adjustable idler pulleys, oil pans and oil pump kits for the K20 and K24. Most of what is here addresses the same problem: parts designed around a stock rev ceiling behaving differently once cams, springs and boost have moved that ceiling. The valvetrain items in particular are worth understanding before your next head build rather than after it.`
  },
  {
    handle: 'honda-k-series-electronics',
    title: 'Honda K-Series Harnesses & Electronics',
    match: p => p.platformKey === 'honda-k-series' && p.system === 'electronics',
    body: `Engine harnesses, swap adapter harnesses, VSS jumpers, speedo rings and the small electrical parts a K-swap needs to talk to the chassis it has landed in. Most swap headaches that look like fuelling or tuning problems are wiring problems. Check which chassis year and which ECU you are running before ordering a jumper — the RSX generations are not interchangeable.`
  },
  {
    handle: 'honda-k-series-cooling',
    title: 'Honda K-Series Cooling',
    match: p => p.platformKey === 'honda-k-series' && p.system === 'cooling',
    body: `Billet water necks, coolant fill necks and pots, RBC/RBB water plates and bypasses, and thermostat housings for the K-series, manufactured by SYPerformance. Coolant routing on a swapped K is rarely the routing Honda designed, and the factory plastic parts are the ones that fail first once the engine is working harder than it was meant to. These are the parts that decide whether a build makes its power on the third pull as well as the first.`
  },
  {
    handle: 'honda-b-d-h-forced-induction',
    title: 'Honda B/D/H Forced Induction',
    match: p => p.platformKey === 'honda-b-d-h-series' && p.system === 'forced-induction',
    body: `Turbo manifolds, hot parts and forced induction hardware for the Honda B, D and H series. Start with the manifold, because turbo position decides what else fits; the turbo, wastegate and charge piping all follow from it. Covers B16, B18, GSR, ITR, D series and H22 applications in both stock-frame and SFWD layouts.`
  },
  {
    handle: 'b-d-h-driveline-hardware',
    title: 'B/D/H Driveline & Transmission Hardware',
    // Everything in B/D/H drivetrain that is not a synchro, so this page and
    // b-h-series-synchros together cover the platform the way the K-series pair does.
    match: p => p.platformKey === 'honda-b-d-h-series' && p.system === 'drivetrain' && p.partType !== 'synchros',
    body: `Hydro billet halfshafts, billet halfshaft carriers, AWD cuffs, bearings, gears and clutch hardware for the Honda B, D and H series — everything that goes back into the driveline alongside a synchro refresh. The carrier is the part that gets bought twice: once by people who researched it, and once by people who have already replaced two sets of axles and worked out that the axle was never the problem. K-series equivalents are a separate line.`
  }
];

// --- resolve membership ------------------------------------------------------
const planned = COLLECTIONS.map(c => {
  const members = P(c.match);
  return { ...c, members };
});

console.log(`\n${APPLY ? 'APPLYING' : 'DRY RUN'} — ${planned.length} collections\n`);
console.log('  n   handle                              title');
console.log('  ' + '-'.repeat(78));
for (const c of planned) {
  console.log(`  ${String(c.members.length).padStart(2)}  ${c.handle.padEnd(34)}  ${c.title}`);
}
const thin = planned.filter(c => c.members.length < 4);
const empty = planned.filter(c => c.members.length === 0);
if (thin.length) console.log(`\n  thin (<4): ${thin.map(c => `${c.handle}(${c.members.length})`).join(', ')}`);
if (empty.length) { console.error(`\n  ABORT — empty collections: ${empty.map(c => c.handle).join(', ')}`); process.exit(1); }

// --- what already exists -----------------------------------------------------
const existing = new Set();
{
  let cursor = null;
  do {
    const d = await gql(`query($cursor:String){ collections(first:100, after:$cursor){ pageInfo{hasNextPage endCursor} nodes{ handle } } }`, { cursor });
    for (const n of d.collections.nodes) existing.add(n.handle);
    cursor = d.collections.pageInfo.hasNextPage ? d.collections.pageInfo.endCursor : null;
  } while (cursor);
}
const toCreate = planned.filter(c => !existing.has(c.handle));
const skipped = planned.filter(c => existing.has(c.handle));
if (skipped.length) console.log(`\n  already exist, skipping: ${skipped.map(c => c.handle).join(', ')}`);
console.log(`\n  ${toCreate.length} to create.`);

if (!APPLY) {
  console.log('\n  Dry run only. Re-run with --apply to create them.');
  process.exit(0);
}

// --- create ------------------------------------------------------------------
const CREATE = `mutation($input: CollectionInput!) {
  collectionCreate(input: $input) {
    collection { id handle title }
    userErrors { field message }
  }
}`;
const ADD = `mutation($id: ID!, $productIds: [ID!]!) {
  collectionAddProducts(id: $id, productIds: $productIds) {
    collection { id handle productsCount { count } }
    userErrors { field message }
  }
}`;

for (const c of toCreate) {
  const res = await gql(CREATE, {
    input: { handle: c.handle, title: c.title, descriptionHtml: `<p>${c.body}</p>` }
  });
  const errs = res.collectionCreate.userErrors;
  if (errs.length) { console.error(`  FAILED ${c.handle}:`, JSON.stringify(errs)); continue; }
  const id = res.collectionCreate.collection.id;

  const ids = c.members.map(m => `gid://shopify/Product/${m.id}`);
  const added = await gql(ADD, { id, productIds: ids });
  const aErrs = added.collectionAddProducts.userErrors;
  if (aErrs.length) { console.error(`  ${c.handle}: created but add failed:`, JSON.stringify(aErrs)); continue; }
  console.log(`  created ${c.handle.padEnd(34)} ${added.collectionAddProducts.collection.productsCount.count} products`);
}

console.log('\nDone. Re-run scripts/list-collections.mjs to confirm counts.');
