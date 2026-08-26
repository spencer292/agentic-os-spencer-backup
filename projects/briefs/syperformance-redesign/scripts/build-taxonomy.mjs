// Classify every product into system + part type, then report what collections
// that implies and how big each would be.
//
//   node scripts/build-taxonomy.mjs           # report
//   node scripts/build-taxonomy.mjs --write   # also write data/taxonomy.json
//
// The point is to let the catalogue decide the categories. A category is only
// worth a page if enough products land in it; anything under the floor gets
// rolled up rather than shipped as a three-product page that looks abandoned.
//
// Rules are ordered and first-match-wins, so put the specific ones first —
// "turbo manifold" has to beat "turbo", "halfshaft carrier" has to beat
// "halfshaft".
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const products = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'product-audit.json'), 'utf8'));

// [system, partType, /pattern/] — first match wins.
const RULES = [
  // ORDER MATTERS — first match wins, so the specific rule goes above the general
  // one. Two classes of rule have to come first:
  //
  //   1. Parts named after a system they are not part of. "Exhaust Manifold Studs"
  //      is a stud pack, not a manifold; it looked absurd sitting in the K-Series
  //      Turbo Manifolds collection. "B Series Coolant Flanges" is cooling, not a
  //      turbo flange.
  //   2. Narrow terms inside broad ones — "halfshaft carrier" above "halfshaft",
  //      "fill pot" above "coolant fill", "turbo manifold" above "flanges".

  // --- Named-after-another-system, tested first ----------------------------
  ['engine',  'engine-hardware',   /\bstuds?\b/i],
  ['cooling', 'fill-pots-tanks',   /fill pot|overflow|catch can|expansion tank/i],
  ['cooling', 'coolant-necks',     /coolant flange|water neck|coolant neck|water plate|water bypass|water housing|thermostat|coolant fill|fill neck/i],
  ['cooling', 'intercoolers',      /intercooler/i],

  // --- Drivetrain -----------------------------------------------------------
  ['drivetrain', 'halfshaft-carriers', /halfshaft carrier|axle carrier|intermediate shaft/i],
  ['drivetrain', 'halfshafts',         /halfshaft|half shaft|swap axle|insane shaft|\baxles?\b/i],
  // A scatter shield bolts to the bellhousing and contains a clutch failure. It is
  // transmission hardware, not a clutch part — Spencer flagged it reading wrong
  // sitting under Clutch & Flywheel. Note the catalogue spells it "Sheild".
  ['drivetrain', 'bellhousings',       /bellhousing|bell housing|awd billet cuff|billet cuff|scatter ?sh(ie|ei)ld/i],
  ['drivetrain', 'transfer-case',      /transfer case|vss block off|block off plate/i],
  ['drivetrain', 'shift-selectors',    /shift selector|shifter cable|\bshifter\b|selector fork/i],
  ['drivetrain', 'synchros',           /synchro|slider|\bhubs\b/i],
  ['drivetrain', 'gears',              /gear ?sets?|\bgear\b|dog 5th|reverse gear|countershaft/i],
  ['drivetrain', 'lsd-diff',           /\blsd\b|differential|diff bearing/i],
  // "Scatter Sheild" is spelled that way in the catalogue — match both spellings
  // rather than silently dropping the product out of every collection.
  ['drivetrain', 'clutch-flywheel',    /clutch|flywheel/i],
  ['drivetrain', 'bearings-seals',     /bearing|seals? kit|\bcollars?\b|thrust tool|\bshim\b|dust boot/i],

  // --- Forced induction -----------------------------------------------------
  ['forced-induction', 'turbo-manifolds',   /turbo manifold|manifold.*(top mount|bottom mount|forward facing|sidewinder|ram ?horn|mini ram|stock placement|factory placement)|exhaust manifold/i],
  ['forced-induction', 'boost-control',     /boost control|boost solenoid/i],
  ['forced-induction', 'wastegates-bov',    /wastegate|blow off|\bbov\b|raceport|hypergate/i],
  ['forced-induction', 'turbo-kits',        /turbo kit/i],
  ['forced-induction', 'downpipes',         /down ?pipe|up ?pipe|hot parts/i],
  ['forced-induction', 'turbo-flanges',     /turbo flange|v-?band flange|head flange|inlet flange|discharge vband|charge pipe flange|\bflanges?\b/i],
  ['forced-induction', 'oil-coolant-lines', /oil feed|oil drain|coolant feed|\bccv\b|crank case vent/i],
  ['forced-induction', 'turbo-accessories', /turbo blanket|heat shield/i],
  ['forced-induction', 'turbos',            /\bturbos\b|pte turbo|pulsar turbo/i],

  // --- Cooling, remainder ---------------------------------------------------
  ['cooling', 'charge-piping', /charge pipe|intercooler pipe|pipe kit/i],
  ['cooling', 'radiators',     /radiator/i],

  // --- Engine and valvetrain ------------------------------------------------
  ['engine', 'rockers',         /rocker/i],
  ['engine', 'timing',          /timing chain|chain guide/i],
  ['engine', 'accessory-drive', /alternator|idler|tensioner|pulley kit/i],
  ['engine', 'oil-system',      /oil pan|oil pump/i],
  ['engine', 'throttle-bodies', /throttle body|throttle cable|adapter plate|cold air intake|intake system/i],

  // --- Fuel and electronics -------------------------------------------------
  ['fuel',        'fuel-delivery',     /fuel rail|fuel pump|injector|fuel pressure|port injection|regulator/i],
  ['electronics', 'engine-management', /kpro|hondata|wideband|smart coil|\bsensors?\b|\becu\b/i],
  ['electronics', 'harnesses',         /harness|jumper|speedo ring|\bvss\b/i],
  ['electronics', 'gauges-sensors',    /gauge|air temp|weld ?in bung|\bbung\b/i],

  // --- Fabrication and hardware ---------------------------------------------
  ['fabrication', 'clamps-vband',     /v-?band assembly|vanjen|clamp/i],
  ['fabrication', 'bends-pie-cuts',   /mandrel bend|pie cut|uj bend|weld on cap|\bbends?\b/i],
  ['fabrication', 'flex-bellows',     /flex bellow|bellows/i],
  ['fabrication', 'weld-on-fittings', /weld ?on|weld-on|fitting/i],
  ['fabrication', 'shop-hardware',    /vacuum block/i],

  // --- Exhaust ---------------------------------------------------------------
  ['exhaust', 'mufflers-resonators', /muffler|resonator/i],

  // --- Suspension and chassis -----------------------------------------------
  ['suspension', 'coilovers',        /coilover/i],
  ['suspension', 'suspension-parts', /camber kit|traction bar|sway bar|control arm/i],
  ['suspension', 'tires',            /radial|\btires?\b/i],
  ['chassis',    'body-trim',        /carbon|fender|spoiler|door guard|hood pin|hood hinge/i]
];

const SYSTEM_LABEL = {
  drivetrain: 'Drivetrain',
  'forced-induction': 'Forced Induction',
  cooling: 'Cooling & Charge Air',
  engine: 'Engine & Valvetrain',
  fuel: 'Fuel',
  electronics: 'Electronics & Tuning',
  fabrication: 'Fabrication & Hardware',
  exhaust: 'Exhaust',
  suspension: 'Suspension',
  chassis: 'Chassis & Body',
  unclassified: 'Unclassified'
};

// Platform buckets, collapsed to the ones worth a page.
function platformKey(p) {
  const v = p.platform || '';
  if (/Honda K/.test(v)) return 'honda-k-series';
  if (/Honda B|Honda D|Honda H\/F/.test(v)) return 'honda-b-d-h-series';
  if (/Evo 8\/9/.test(v)) return 'mitsubishi-evo-7-8-9';
  if (/Evo X/.test(v)) return 'mitsubishi-evo-x';
  if (/B58/.test(v)) return 'bmw-toyota-b58';
  if (/Universal/.test(v)) return 'universal';
  return 'unassigned';
}

/*
 * Title first, tags only as a fallback.
 *
 * Matching title and tags together let a tag outvote the product's own name, which
 * is how "Honda Sfwd Intercooler" ended up in turbo kits (tagged `turbo kit`) and
 * "Pulsar Wastegates" ended up in turbos. The title is what the product IS; the
 * tags are what it RELATES TO. Only fall through to tags when the title says
 * nothing a rule recognises.
 */
function classify(p) {
  for (const [system, partType, re] of RULES) {
    if (re.test(p.title)) return { system, partType, via: 'title' };
  }
  const tags = p.tags || '';
  for (const [system, partType, re] of RULES) {
    if (re.test(tags)) return { system, partType, via: 'tags' };
  }
  return { system: 'unclassified', partType: 'unclassified', via: 'none' };
}

const rows = products.map(p => {
  const { system, partType } = classify(p);
  return { ...p, system, partType, platformKey: platformKey(p) };
});

// --- report ------------------------------------------------------------------
const bySystem = {};
const byPartType = {};
const byPlatformSystem = {};
for (const r of rows) {
  bySystem[r.system] = (bySystem[r.system] || 0) + 1;
  const pt = `${r.system}/${r.partType}`;
  byPartType[pt] = (byPartType[pt] || 0) + 1;
  const ps = `${r.platformKey} :: ${r.system}`;
  byPlatformSystem[ps] = (byPlatformSystem[ps] || 0) + 1;
}

const unclassified = rows.filter(r => r.system === 'unclassified');

console.log(`\n${products.length} products classified. ${unclassified.length} unmatched (${(100 * unclassified.length / products.length).toFixed(0)}%).\n`);

console.log('=== BY SYSTEM ===');
for (const [k, n] of Object.entries(bySystem).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${SYSTEM_LABEL[k] || k}`);
}

console.log('\n=== BY PART TYPE (candidate level-3 pages) ===');
for (const [k, n] of Object.entries(byPartType).sort((a, b) => b[1] - a[1])) {
  const flag = n >= 5 ? ' ' : ' <- thin';
  console.log(`  ${String(n).padStart(4)}  ${k}${flag}`);
}

console.log('\n=== PLATFORM x SYSTEM (candidate level-2 pages) ===');
for (const [k, n] of Object.entries(byPlatformSystem).sort((a, b) => b[1] - a[1])) {
  if (n >= 3) console.log(`  ${String(n).padStart(4)}  ${k}`);
}

if (unclassified.length) {
  console.log('\n=== UNMATCHED — need a rule or a manual assignment ===');
  for (const r of unclassified) console.log(`  ${r.title}`);
}

if (process.argv.includes('--write')) {
  const out = path.join(ROOT, 'data', 'taxonomy.json');
  fs.writeFileSync(out, JSON.stringify({
    generated: 'phase-2b',
    systemLabels: SYSTEM_LABEL,
    products: rows.map(r => ({
      id: r.id, handle: r.handle, title: r.title,
      platform: r.platform, platformKey: r.platformKey,
      system: r.system, partType: r.partType,
      inHouse: r.inHouse, brand: r.brand
    }))
  }, null, 2));
  console.log(`\nWrote data/taxonomy.json`);
}
