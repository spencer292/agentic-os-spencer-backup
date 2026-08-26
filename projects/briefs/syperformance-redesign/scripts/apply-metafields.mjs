/**
 * Phase 3 — create the product metafield definitions, and populate the ones the
 * Phase 0 audit already knows.
 *
 *   node scripts/apply-metafields.mjs                 # dry run
 *   node scripts/apply-metafields.mjs --apply         # create definitions + write values
 *   node scripts/apply-metafields.mjs --apply --only=definitions|values
 *
 * Two jobs, deliberately in one script because the second is meaningless
 * without the first.
 *
 * DEFINITIONS: every `custom.*` field the theme already reads. Phase 4's product
 * template and Phase 5's cards were built against these names, so creating them
 * finishes that plumbing as well as starting the fitment work.
 *
 * VALUES: only what can be derived with confidence from data/product-audit.json —
 * `made_in_house`, `platform`, and `drivetrain` where the platform implies it.
 * Everything else (chassis, hp_rating, build_time, turbo and wastegate
 * compatibility, and all the written blocks) is a judgement call and goes out as
 * a CSV for Spencer instead. The plan says the same: "Bulk-populating these
 * metafields across ~64+ SKUs is a data task, not a code task."
 *
 * The 51 products the audit could not classify get `made_in_house = false`, not
 * null. That is a deliberate claim: until someone confirms otherwise, a part is
 * not ours. Writing null would leave the theme falling back to the generated
 * handle list forever and hide the fact that the question is unanswered.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const repoRoot = join(root, '..', '..', '..');

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const ONLY = args.find((a) => a.startsWith('--only='))?.split('=')[1] ?? 'all';
const wants = (s) => ONLY === 'all' || ONLY === s;

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
  console.error('Missing Shopify credentials. Run: node scripts/check-token.mjs');
  process.exit(1);
}
if (STORE !== GUARD) {
  console.error(`Refusing to run against "${STORE}". This script only targets the build replica.`);
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
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const body = await res.json();
  if (body.errors) throw new Error(`GraphQL: ${JSON.stringify(body.errors).slice(0, 600)}`);
  return body.data;
}

const log = (...a) => console.log(...a);
const plan = (...a) => console.log(APPLY ? '  ' : '  [dry] ', ...a);

// ---------------------------------------------------------------------------
// Definitions
// ---------------------------------------------------------------------------

/**
 * `storefront: PUBLIC_READ` is required or the theme cannot read the value at
 * all — the metafield exists in admin and renders as blank on the page, which
 * is a genuinely confusing failure to debug.
 */
const DEFINITIONS = [
  // --- fitment -------------------------------------------------------------
  {
    key: 'platform',
    name: 'Platform',
    type: 'list.single_line_text_field',
    description: 'Engine family this part is cut for. Drives the fitment selector.',
  },
  {
    key: 'chassis',
    name: 'Chassis',
    type: 'list.single_line_text_field',
    description: 'Chassis codes: EG, EK, DC2, DC5, EP3, FG/FA, A90/A91 and so on.',
  },
  {
    key: 'drivetrain',
    name: 'Drivetrain',
    type: 'single_line_text_field',
    description: 'FWD, AWD or RWD.',
  },
  // --- the facts the product page states plainly ---------------------------
  {
    key: 'made_in_house',
    name: 'Made in-house',
    type: 'boolean',
    description: 'True only for parts SY machines. Never guess — an unearned badge is worse than none.',
  },
  {
    key: 'hp_rating',
    name: 'HP rating',
    type: 'number_integer',
    description: 'Maximum supported horsepower. Leave blank unless the number is real.',
  },
  {
    key: 'build_time',
    name: 'Build time',
    type: 'single_line_text_field',
    description: 'Lead time as it should read on the page. Published, never hidden.',
  },
  {
    key: 'turbo_compat',
    name: 'Turbo compatibility',
    type: 'single_line_text_field',
  },
  {
    key: 'wastegate_compat',
    name: 'Wastegate compatibility',
    type: 'single_line_text_field',
  },
  // --- the written blocks the Phase 4 template requires --------------------
  {
    key: 'why_this_part',
    name: 'Why this part exists',
    type: 'rich_text_field',
    description: 'What fails on the stock or cheap part, what we changed, what that means for you.',
  },
  {
    key: 'before_you_buy',
    name: 'Before you buy',
    type: 'rich_text_field',
    description: 'The honest caveats. What else you need, what might need modification.',
  },
  {
    key: 'specs',
    name: 'Specifications',
    type: 'multi_line_text_field',
    description: 'One "Label: Value" per line. Material, dimensions, tolerances, hardware, torque.',
  },
  {
    key: 'install_notes',
    name: 'Install notes',
    type: 'rich_text_field',
  },
  {
    key: 'install_pdf',
    name: 'Install guide',
    type: 'file_reference',
  },
  {
    key: 'complete_the_build',
    name: 'Complete the build',
    type: 'list.product_reference',
    description: 'What this part genuinely requires. Curated by hand, never algorithmic.',
  },
];

async function applyDefinitions() {
  log(`\n== DEFINITIONS (${DEFINITIONS.length}) ==`);

  const existing = await gql(
    `{ metafieldDefinitions(first: 100, ownerType: PRODUCT, namespace: "custom") { nodes { id key } } }`
  );
  const have = new Set(existing.metafieldDefinitions.nodes.map((n) => n.key));

  for (const def of DEFINITIONS) {
    if (have.has(def.key)) {
      plan(`exists  custom.${def.key.padEnd(20)} ${def.type}`);
      continue;
    }
    plan(`create  custom.${def.key.padEnd(20)} ${def.type}`);
    if (!APPLY) continue;

    const data = await gql(
      `mutation($definition: MetafieldDefinitionInput!) {
        metafieldDefinitionCreate(definition: $definition) {
          createdDefinition { id }
          userErrors { field message code }
        }
      }`,
      {
        definition: {
          namespace: 'custom',
          key: def.key,
          name: def.name,
          description: def.description,
          type: def.type,
          ownerType: 'PRODUCT',
          access: { storefront: 'PUBLIC_READ' },
        },
      }
    );

    const errs = data.metafieldDefinitionCreate.userErrors ?? [];
    if (errs.length) {
      // TAKEN means someone created it by hand; that is fine and not a failure.
      if (errs.every((e) => e.code === 'TAKEN')) {
        log(`          already taken, skipping`);
        continue;
      }
      throw new Error(`custom.${def.key}: ${errs.map((e) => `${e.field}: ${e.message}`).join('; ')}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Values
// ---------------------------------------------------------------------------

const PLATFORM_LABELS = {
  'Honda K': 'Honda K-Series',
  'Honda B': 'Honda B-Series',
  'Honda D': 'Honda D-Series',
  'Honda H/F': 'Honda H/F-Series',
  'Evo 8/9': 'Evo 7/8/9',
  'Evo X': 'Evo X',
  'B58/BMW-Toyota': 'BMW / Toyota B58',
  'Universal / fab': 'Universal',
};

/** The audit's platform string can name more than one family; split it. */
function platformList(raw) {
  if (!raw || raw === 'Unclassified') return [];
  return raw
    .split('+')
    .map((s) => s.trim())
    .map((s) => PLATFORM_LABELS[s])
    .filter(Boolean);
}

/**
 * Drivetrain is only written where the platform genuinely implies it. Most parts
 * do not, and a wrong FWD/AWD tag on a halfshaft is worse than no tag — it will
 * filter the part out of the results of the customer who actually needs it.
 */
function drivetrainFor(product) {
  const t = `${product.title} ${product.tags}`.toLowerCase();
  if (t.includes('awd')) return 'AWD';
  if (t.includes('rwd')) return 'RWD';
  if (t.includes('fwd') || t.includes('sfwd')) return 'FWD';
  return null;
}

async function applyValues() {
  const products = JSON.parse(readFileSync(join(root, 'data', 'product-audit.json'), 'utf8'));

  log(`\n== VALUES (${products.length} products) ==`);

  // handle -> gid
  const ids = new Map();
  let cursor = null;
  for (;;) {
    const data = await gql(
      `query($cursor: String) {
        products(first: 250, after: $cursor) {
          pageInfo { hasNextPage endCursor }
          nodes { id handle }
        }
      }`,
      { cursor }
    );
    for (const n of data.products.nodes) ids.set(n.handle, n.id);
    if (!data.products.pageInfo.hasNextPage) break;
    cursor = data.products.pageInfo.endCursor;
  }

  const metafields = [];
  const counts = { made_in_house: 0, platform: 0, drivetrain: 0, missing: 0 };

  for (const p of products) {
    const ownerId = ids.get(p.handle);
    if (!ownerId) {
      counts.missing++;
      continue;
    }

    const inHouse = p.origin === 'IN-HOUSE';
    metafields.push({
      ownerId,
      namespace: 'custom',
      key: 'made_in_house',
      type: 'boolean',
      value: String(inHouse),
    });
    counts.made_in_house++;
    if (inHouse) counts.platform += 0;

    const platforms = platformList(p.platform);
    if (platforms.length) {
      metafields.push({
        ownerId,
        namespace: 'custom',
        key: 'platform',
        type: 'list.single_line_text_field',
        value: JSON.stringify(platforms),
      });
      counts.platform++;
    }

    const dt = drivetrainFor(p);
    if (dt) {
      metafields.push({
        ownerId,
        namespace: 'custom',
        key: 'drivetrain',
        type: 'single_line_text_field',
        value: dt,
      });
      counts.drivetrain++;
    }
  }

  plan(`made_in_house  ${counts.made_in_house} products (${products.filter((p) => p.origin === 'IN-HOUSE').length} true)`);
  plan(`platform       ${counts.platform} products`);
  plan(`drivetrain     ${counts.drivetrain} products`);
  if (counts.missing) plan(`NOT IN STORE   ${counts.missing} products from the audit have no match`);
  plan(`${metafields.length} metafield writes total`);

  if (!APPLY) return;

  // metafieldsSet caps at 25 per call.
  for (let i = 0; i < metafields.length; i += 25) {
    const batch = metafields.slice(i, i + 25);
    const data = await gql(
      `mutation($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          userErrors { field message code }
        }
      }`,
      { metafields: batch }
    );
    const errs = data.metafieldsSet.userErrors ?? [];
    if (errs.length) {
      throw new Error(`metafieldsSet batch ${i / 25}: ${errs.map((e) => `${e.field}: ${e.message}`).join('; ')}`);
    }
    if ((i / 25) % 4 === 0) log(`   …${Math.min(i + 25, metafields.length)}/${metafields.length}`);
  }
}

// ---------------------------------------------------------------------------

const t0 = Date.now();
log(`Store:  ${STORE}`);
log(`Mode:   ${APPLY ? 'APPLY — writing' : 'DRY RUN — nothing will be written'}`);

if (wants('definitions')) await applyDefinitions();
if (wants('values')) await applyValues();

log(`\nDone in ${((Date.now() - t0) / 1000).toFixed(1)}s, ${calls} API calls.`);
if (!APPLY) log('Dry run only. Re-run with --apply to write.');
