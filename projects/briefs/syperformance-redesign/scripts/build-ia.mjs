/**
 * Phase 2 — build the new information architecture from the real catalogue.
 *
 * The old store has 57 collections, 12 of them holding one or two products, and
 * a 118-product collection called SALE SPECIAL. Rather than redesign that by
 * eye, this assigns every one of the 198 products to the new scheme with
 * explicit rules and reports the counts, so the nav is designed against what
 * actually exists.
 *
 * Reads:  ../data/product-audit.json, ../data/collection-members.json, ../data/collections.json
 * Writes: ../data/ia-collections.json  (new collection set + member handles)
 *         ../data/ia-report.txt        (human-readable counts and leftovers)
 *
 * Nothing here touches a store. It is pure analysis over the Phase 0 capture.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, '..', 'data');

const read = (name) => JSON.parse(readFileSync(join(dataDir, name), 'utf8'));

const products = read('product-audit.json');
const members = read('collection-members.json');
const oldCollections = read('collections.json');

/** handle -> Set of old collection handles it belongs to */
const memberOf = new Map();
for (const [collection, handles] of Object.entries(members)) {
  for (const handle of handles) {
    if (!memberOf.has(handle)) memberOf.set(handle, new Set());
    memberOf.get(handle).add(collection);
  }
}

const inOld = (p, ...collections) => {
  const set = memberOf.get(p.handle);
  return set ? collections.some((c) => set.has(c)) : false;
};

const t = (p) => `${p.title} ${p.tags}`.toLowerCase();
const has = (p, ...needles) => needles.some((n) => t(p).includes(n));

// ---------------------------------------------------------------------------
// Platform
// ---------------------------------------------------------------------------

const platformOf = (p) => {
  const plat = p.platform;
  if (plat.includes('B58')) return 'b58';
  if (plat.includes('Evo X')) return 'evo-x';
  if (plat.includes('Evo 8/9')) return 'evo-8-9';
  if (plat.includes('Honda K')) return 'honda-k';
  if (plat.includes('Honda B') || plat.includes('Honda D') || plat.includes('Honda H')) return 'honda-bdh';
  if (plat.includes('Universal')) return 'universal';

  // The audit left 49 unclassified. Most are resold or universal fab; recover
  // what the title makes obvious rather than dumping them all in one bucket.
  if (has(p, 'evo x', 'evolution x')) return 'evo-x';
  if (has(p, 'evo 7', 'evo 8', 'evo 9', 'evo7', 'evo8', 'evo9', 'lancer')) return 'evo-8-9';
  if (has(p, 'b58', 'supra', 'a90', 'a91', 'bmw')) return 'b58';
  if (has(p, 'k series', 'k-series', 'k20', 'k24', 'rsx', 'ep3', 'dc5')) return 'honda-k';
  if (has(p, 'b series', 'b-series', 'b16', 'b18', 'h22', 'h series', 'd series', 'gsr', 'itr', 'integra'))
    return 'honda-bdh';
  if (inOld(p, 'honda', 'honda-turbo-manifolds', 'honda-intercoolers')) return 'honda-multi';
  if (inOld(p, 'mitsubishi-evo-parts', 'evo-turbo', 'evo-turbo-manifolds', 'evo-fueling', 'evo-hot-parts'))
    return 'evo-8-9';
  if (inOld(p, 'b58-3-0l-supra-bmw')) return 'b58';
  return 'universal';
};

// ---------------------------------------------------------------------------
// System — what the part IS, independent of platform
// ---------------------------------------------------------------------------

const systemOf = (p) => {
  // Order matters: first match wins, most specific first.
  if (
    has(p, 'synchro', 'slider', 'collar', 'dust boot', 'reverse gear', 'speedo ring', '2nd gear', 'thrust tool')
  )
    return 'transmission-internals';
  if (has(p, 'halfshaft', 'axle', 'carrier', 'bellhousing', 'transfer case', 'tcase', 't-case', 'block off'))
    return 'drivetrain-billet';
  if (has(p, 'lsd', 'limited slip', 'differential', 'gearset', 'gear set', 'final drive', 'cuff'))
    return 'differential-gearing';
  if (has(p, 'shift selector', 'shifter', 'shift cable', 'selector rod')) return 'shifting';
  if (has(p, 'clutch', 'flywheel', 'scatter')) return 'clutch-flywheel';
  if (has(p, 'rocker', 'timing chain', 'valve', 'camshaft', 'retainer')) return 'valvetrain';
  if (has(p, 'manifold') && !has(p, 'intake manifold stud')) return 'turbo-manifolds';
  if (has(p, 'downpipe', 'down pipe', 'up pipe', 'uppipe', 'header', 'exhaust', 'muffler', 'hot parts'))
    return 'exhaust-hot-parts';
  if (has(p, 'intercooler', 'charge pipe', 'coolant', 'radiator', 'water neck', 'overflow', 'fill pot', 'fill neck'))
    return 'cooling';
  if (has(p, 'turbo kit', 'turbocharger', 'wastegate', 'blow off', 'bov', 'boost controller')) return 'forced-induction';
  if (has(p, 'turbo')) return 'forced-induction';
  if (has(p, 'injector', 'fuel pump', 'fuel rail', 'regulator', 'fueling', 'surge tank')) return 'fueling';
  if (has(p, 'ecu', 'kpro', 'hondata', 'wiring', 'harness', 'sensor', 'gauge', 'alternator relocation'))
    return 'electronics';
  if (has(p, 'vanjen', 'vband', 'v-band', 'clamp', 'bellow', 'flange', 'stud', 'titanium', 'hardware', 'bung'))
    return 'clamps-hardware';
  if (has(p, 'pie cut', 'mandrel', 'weld on', 'weld-on', 'tubing', '6061', 'cap')) return 'fabrication';
  if (has(p, 'throttle body', 'throttle cable', 'intake manifold', 'adapter plate')) return 'intake';
  if (has(p, 'intake')) return 'intake';
  if (has(p, 'suspension', 'traction bar', 'coilover', 'tire', 'camber')) return 'chassis';
  if (has(p, 'hood pin', 'hood hinge', 'fender', 'spoiler', 'trim', 'carbon')) return 'exterior';
  // Engine internals and service parts. Kept as its own bucket rather than
  // folded into 'other' because it is the natural cross-sell on a rebuild.
  if (
    has(
      p,
      'oil pan',
      'oil pump',
      'water plate',
      'water bypass',
      'thermostat',
      'seals kit',
      'seal kit',
      'bearings kit',
      'bearing kit',
      'idler pulley',
      'shim',
      'crank case',
      'ccv',
      'vacuum block',
      'boost solenoid',
      'coil',
      'resonator',
      'wideband'
    )
  )
    return 'engine-internals';
  if (has(p, 'uj bend', 'bend')) return 'fabrication';
  return 'other';
};

// ---------------------------------------------------------------------------
// Build the new collection set
// ---------------------------------------------------------------------------

/** @type {Map<string, {title: string, group: string, members: string[]}>} */
const out = new Map();
const add = (handle, title, group, product) => {
  if (!out.has(handle)) out.set(handle, { title, group, members: [] });
  out.get(handle).members.push(product.handle);
};

const SYSTEM_TITLES = {
  'transmission-internals': 'Transmission Internals',
  'drivetrain-billet': 'Billet Drivetrain',
  'differential-gearing': 'LSD, Gearsets & Final Drives',
  shifting: 'Shifting',
  'clutch-flywheel': 'Clutch & Flywheel',
  valvetrain: 'Valvetrain',
  'turbo-manifolds': 'Turbo Manifolds',
  'exhaust-hot-parts': 'Exhaust & Hot Parts',
  cooling: 'Cooling & Charge Piping',
  'forced-induction': 'Forced Induction',
  fueling: 'Fueling',
  electronics: 'Electronics & Engine Management',
  'clamps-hardware': 'Clamps & Hardware',
  fabrication: 'Fabrication',
  intake: 'Intake',
  chassis: 'Chassis & Suspension',
  'engine-internals': 'Engine Internals & Service Parts',
  exterior: 'Exterior',
  other: 'Other',
};

const PLATFORM_TITLES = {
  'honda-k': 'Honda K-Series',
  'honda-bdh': 'Honda B/D/H-Series',
  'honda-multi': 'Honda',
  'evo-8-9': 'Mitsubishi Evo 7/8/9',
  'evo-x': 'Mitsubishi Evo X',
  b58: 'BMW / Toyota B58',
  universal: 'Universal & Fabrication',
};

const rows = [];

for (const p of products) {
  const platform = platformOf(p);
  const system = systemOf(p);
  const inHouse = p.origin.startsWith('IN-HOUSE');
  rows.push({ handle: p.handle, title: p.title, brand: p.brand, origin: p.origin, platform, system, price: p.priceMin });

  // 1. The manufacturing spine — in-house only.
  if (inHouse) {
    add('syp-billet', 'SYP Billet — Made In-House', 'billet', p);

    const billetGroup =
      {
        'drivetrain-billet': 'syp-drivetrain',
        'transmission-internals': 'syp-drivetrain',
        'differential-gearing': 'syp-drivetrain',
        shifting: 'syp-drivetrain',
        'clutch-flywheel': 'syp-drivetrain',
        valvetrain: 'syp-valvetrain',
        'turbo-manifolds': 'syp-turbo-manifolds',
        'exhaust-hot-parts': 'syp-turbo-manifolds',
        cooling: 'syp-cooling',
        'clamps-hardware': 'syp-clamps-hardware',
        fabrication: 'syp-fabrication',
      }[system] ?? null;

    if (billetGroup) {
      const titles = {
        'syp-drivetrain': 'SYP Drivetrain',
        'syp-valvetrain': 'SYP Valvetrain',
        'syp-turbo-manifolds': 'SYP Turbo Manifolds',
        'syp-cooling': 'SYP Cooling',
        'syp-clamps-hardware': 'SYP Clamps & Hardware',
        'syp-fabrication': 'SYP Fabrication',
      };
      add(billetGroup, titles[billetGroup], 'billet', p);
    }
  }

  // 2. The platform spine — everything, in-house and resold.
  add(`platform-${platform}`, PLATFORM_TITLES[platform], 'platform', p);

  // 3. The system spine — cross-platform, how people shop when they know the part.
  add(`system-${system}`, SYSTEM_TITLES[system], 'system', p);

  // 4. Brand collections.
  if (p.brand === 'Synchro Solutionz') add('synchro-solutionz', 'Synchro Solutionz', 'brand', p);
  if (p.brand === 'Comp 1 Clutch') add('comp-1-clutch', 'Comp 1 Clutch', 'brand', p);
}

// ---------------------------------------------------------------------------
// Final set — merges and renames
//
// The raw buckets above are the classification. This is the shipped set: thin
// buckets folded into their nearest sibling, and handles renamed to what a
// customer would search for rather than to the internal grouping key. Handles
// are the URL, so they are chosen once here and never changed again.
// ---------------------------------------------------------------------------

const RENAME = {
  'syp-valvetrain': 'syp-single-lobe-rockers',
  'syp-clamps-hardware': 'syp-fabrication-hardware',
  'platform-honda-k': 'honda-k-series',
  'platform-honda-bdh': 'honda-b-d-h-series',
  'platform-honda-multi': 'honda-b-d-h-series',
  'platform-evo-8-9': 'mitsubishi-evo-7-8-9',
  'platform-evo-x': 'mitsubishi-evo-x',
  'platform-b58': 'bmw-toyota-b58',
  'platform-universal': 'universal-fabrication',
  'system-transmission-internals': 'transmission-internals',
  'system-drivetrain-billet': 'billet-drivetrain',
  'system-differential-gearing': 'lsd',
  'system-clutch-flywheel': 'clutch-flywheel',
  'system-valvetrain': 'valvetrain',
  'system-turbo-manifolds': 'turbo-manifolds',
  'system-exhaust-hot-parts': 'exhaust-hot-parts',
  'system-cooling': 'cooling',
  'system-forced-induction': 'forced-induction',
  'system-fueling': 'fueling',
  'system-electronics': 'engine-management',
  'system-engine-internals': 'engine',
  'system-intake': 'intake',
  'system-clamps-hardware': 'clamps-v-band-flanges',
  'system-fabrication': 'pie-cuts-mandrel-bends',
  'system-chassis': 'suspension',
  'system-exterior': 'exterior',
};

// Folded away entirely: their members move into the target and the bucket goes.
const FOLD = {
  'syp-fabrication': 'syp-fabrication-hardware',
  'system-shifting': 'billet-drivetrain',
  'system-other': 'engine',
};

const final = new Map();
const push = (handle, title, group, members) => {
  if (!final.has(handle)) final.set(handle, { title, group, members: new Set() });
  for (const m of members) final.get(handle).members.add(m);
};

for (const [handle, c] of out) {
  const folded = FOLD[handle];
  if (folded) continue;
  push(RENAME[handle] ?? handle, c.title, c.group, c.members);
}
for (const [from, to] of Object.entries(FOLD)) {
  const src = out.get(from);
  if (!src) continue;
  const target = final.get(to);
  if (!target) throw new Error(`fold target missing: ${to}`);
  for (const m of src.members) target.members.add(m);
}

const FINAL_TITLES = {
  'syp-single-lobe-rockers': 'Single Lobe Rockers',
  'syp-fabrication-hardware': 'SYP Clamps, Hardware & Fabrication',
  'billet-drivetrain': 'Billet Halfshafts, Carriers & Selectors',
  'clamps-v-band-flanges': 'Clamps, V-Band & Flanges',
  'pie-cuts-mandrel-bends': 'Pie Cuts, Mandrel Bends & Tube',
  'forced-induction': 'Forced Induction — Turbos, Wastegates & BOV',
  'engine-management': 'Engine Management & Electronics',
  'engine': 'Engine Internals & Service Parts',
  'intake': 'Intake & Throttle Bodies',
  'cooling': 'Cooling & Charge Piping',
  'suspension': 'Chassis & Suspension',
  'lsd': 'LSD, Gearsets & Final Drives',
  'universal-fabrication': 'Universal & Fabrication',
};
for (const [handle, title] of Object.entries(FINAL_TITLES)) {
  if (final.has(handle)) final.get(handle).title = title;
}


// Platform parents. These exist so HONDA and MITSUBISHI EVO are real landing
// pages rather than menu headings that go nowhere, and because both handles
// already exist on the live store — keeping them costs nothing and saves two
// redirects on established URLs.
const PARENTS = {
  honda: { title: 'Honda', from: ['honda-k-series', 'honda-b-d-h-series'] },
  'mitsubishi-evo-parts': { title: 'Mitsubishi Evo', from: ['mitsubishi-evo-7-8-9', 'mitsubishi-evo-x'] },
};
for (const [handle, spec] of Object.entries(PARENTS)) {
  const members = new Set();
  for (const child of spec.from) {
    for (const m of final.get(child)?.members ?? []) members.add(m);
  }
  final.set(handle, { title: spec.title, group: 'platform', members });
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const lines = [];
const section = (name) => {
  lines.push('', `== ${name} ==`);
};

const sorted = [...final.entries()]
  .map(([handle, c]) => [handle, { ...c, members: [...c.members] }])
  .sort((a, b) => b[1].members.length - a[1].members.length);

for (const group of ['billet', 'platform', 'system', 'brand']) {
  section(group.toUpperCase());
  for (const [handle, c] of sorted) {
    if (c.group !== group) continue;
    lines.push(`${String(c.members.length).padStart(4)}  ${handle.padEnd(30)} ${c.title}`);
  }
}

section('THIN (under 4 products — merge candidates)');
for (const [handle, c] of sorted) {
  if (c.members.length < 4) lines.push(`${String(c.members.length).padStart(4)}  ${handle.padEnd(30)} ${c.title}`);
}

section('SYSTEM = other (needs a rule or a home)');
for (const r of rows.filter((r) => r.system === 'other')) {
  lines.push(`      ${r.origin.padEnd(18)} ${r.platform.padEnd(12)} ${r.title}`);
}

section('OLD COLLECTIONS -> retired / kept');
for (const c of oldCollections.sort((a, b) => b.products_count - a.products_count)) {
  lines.push(`${String(c.products_count).padStart(4)}  ${c.handle.padEnd(36)} ${c.title}`);
}

section('TOTALS');
lines.push(`products: ${products.length}`);
lines.push(`new collections: ${final.size}   (old: ${oldCollections.length})`);
lines.push(`in-house: ${products.filter((p) => p.origin.startsWith('IN-HOUSE')).length}`);

writeFileSync(join(dataDir, 'ia-report.txt'), lines.join('\n'), 'utf8');
writeFileSync(
  join(dataDir, 'ia-collections.json'),
  JSON.stringify(
    {
      generated: 'phase-2',
      collections: Object.fromEntries(sorted.map(([handle, c]) => [handle, c])),
      products: rows,
    },
    null,
    2
  ),
  'utf8'
);

console.log(lines.join('\n'));
