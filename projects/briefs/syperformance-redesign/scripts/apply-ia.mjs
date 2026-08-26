/**
 * Phase 2 — apply the information architecture to the build store.
 *
 * Creates the 33 collections designed in docs/ia.md, assigns their members,
 * publishes them to the Online Store, rebuilds the main menu, and writes the
 * 45 URL redirects.
 *
 *   node scripts/apply-ia.mjs            # dry run — prints every mutation, writes nothing
 *   node scripts/apply-ia.mjs --apply    # actually writes
 *   node scripts/apply-ia.mjs --apply --only=collections|menu|redirects
 *
 * Reads credentials from the repo-root .env:
 *   SHOPIFY_BUILD_STORE=syperformance-build.myshopify.com
 *   SHOPIFY_BUILD_ADMIN_TOKEN=shpat_...
 *
 * The store name is asserted against the build store on every run. This script
 * refuses to run against syperformance.net — see GUARD below. That is deliberate
 * and should stay that way even after SY hands over credentials, because the
 * handover model is a theme zip plus a runbook, never a script pointed at his
 * live catalogue.
 *
 * Intro copy is parsed out of docs/ia.md rather than duplicated here, so the
 * document a human reviews is the same text that reaches the store.
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
const wants = (step) => ONLY === 'all' || ONLY === step;

// ---------------------------------------------------------------------------
// Credentials
// ---------------------------------------------------------------------------

const GUARD = 'syperformance-build.myshopify.com';

function loadEnv() {
  let raw = '';
  try {
    raw = readFileSync(join(repoRoot, '.env'), 'utf8');
  } catch {
    throw new Error(`Cannot read ${join(repoRoot, '.env')} — see docs/ia.md §7 for how to create the token.`);
  }
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
  console.error('Missing SHOPIFY_BUILD_STORE / SHOPIFY_BUILD_ADMIN_TOKEN in .env.');
  console.error('See docs/ia.md §7 — two minutes in the dev store admin.');
  process.exit(1);
}
if (STORE !== GUARD) {
  console.error(`Refusing to run: SHOPIFY_BUILD_STORE is "${STORE}", expected "${GUARD}".`);
  console.error('This script only ever targets the build replica, never a live store.');
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
    // Shopify's GraphQL bucket refills at 50 points/s; a flat pause is enough
    // at this volume and keeps the retry logic honest.
    await new Promise((r) => setTimeout(r, 2000));
    return gql(query, variables);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 400)}`);

  const body = await res.json();
  if (body.errors) throw new Error(`GraphQL: ${JSON.stringify(body.errors).slice(0, 600)}`);
  return body.data;
}

/** Every mutation returns userErrors; treating them as warnings hides real failures. */
function assertNoUserErrors(label, payload) {
  const errs = payload?.userErrors ?? [];
  if (errs.length) throw new Error(`${label}: ${errs.map((e) => `${e.field}: ${e.message}`).join('; ')}`);
}

// ---------------------------------------------------------------------------
// Inputs — the IA itself
// ---------------------------------------------------------------------------

const ia = JSON.parse(readFileSync(join(root, 'data', 'ia-collections.json'), 'utf8'));

/**
 * Intro copy lives in docs/ia.md §4 as `**\`handle\` — Title**` followed by a
 * blockquote. Parsing it keeps the reviewed document and the shipped text the
 * same thing.
 */
function parseCopy() {
  const md = readFileSync(join(root, 'docs', 'ia.md'), 'utf8');
  const copy = new Map();
  const re = /^\*\*`([a-z0-9-]+)` — (.+?)\*\*\s*\n((?:^> .*\n?)+)/gm;
  let m;
  while ((m = re.exec(md))) {
    const [, handle, title, quote] = m;
    const body = quote
      .split('\n')
      .filter((l) => l.startsWith('> '))
      .map((l) => l.slice(2).trim())
      .join(' ')
      .trim();
    copy.set(handle, { title, body });
  }
  return copy;
}

const copy = parseCopy();

const missingCopy = Object.keys(ia.collections).filter((h) => !copy.has(h));
if (missingCopy.length) {
  console.error(`No intro copy in docs/ia.md for: ${missingCopy.join(', ')}`);
  console.error('Every collection ships with copy — a collection with no words cannot rank.');
  process.exit(1);
}

// Redirects, parsed from the §6 table so the document stays canonical there too.
function parseRedirects() {
  const md = readFileSync(join(root, 'docs', 'ia.md'), 'utf8');
  const out = [];
  const re = /^\| `([a-z0-9-]+)` \| [\d,]+ \| (?:→ )?`?([^|`]+?)`?(?: —[^|]*)? \|$/gm;
  let m;
  while ((m = re.exec(md))) {
    const from = `/collections/${m[1]}`;
    const target = m[2].trim();
    const to = target.startsWith('/') ? target : `/collections/${target}`;
    out.push({ from, to });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

const log = (...a) => console.log(...a);
const plan = (...a) => console.log(APPLY ? '  ' : '  [dry] ', ...a);

/** handle -> gid, for products already in the store. */
async function fetchProductIds() {
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
  return ids;
}

/** handle -> gid, for collections that already exist (re-runs are safe). */
async function fetchCollectionIds() {
  const ids = new Map();
  let cursor = null;
  for (;;) {
    const data = await gql(
      `query($cursor: String) {
        collections(first: 250, after: $cursor) {
          pageInfo { hasNextPage endCursor }
          nodes { id handle }
        }
      }`,
      { cursor }
    );
    for (const n of data.collections.nodes) ids.set(n.handle, n.id);
    if (!data.collections.pageInfo.hasNextPage) break;
    cursor = data.collections.pageInfo.endCursor;
  }
  return ids;
}

async function onlineStorePublicationId() {
  const data = await gql(`{ publications(first: 20) { nodes { id name } } }`);
  const pub = data.publications.nodes.find((p) => p.name === 'Online Store');
  if (!pub) throw new Error('No "Online Store" publication found — check the write_publications scope.');
  return pub.id;
}

async function applyCollections(productIds, collectionIds, publicationId) {
  // `clearance` is created empty on purpose. docs/ia.md §5: the old SALE SPECIAL
  // held 118 of 198 products and migrating it would reproduce the exact problem
  // the redesign exists to fix. What goes in it is Spencer's call.
  const specs = { ...ia.collections, clearance: { title: 'Clearance', group: 'brand', members: [] } };
  log(`\n== COLLECTIONS (${Object.keys(specs).length}) ==`);

  for (const [handle, spec] of Object.entries(specs)) {
    const { title, body } = copy.get(handle);
    const members = spec.members.map((h) => productIds.get(h)).filter(Boolean);
    const missing = spec.members.length - members.length;
    const existing = collectionIds.get(handle);

    plan(
      `${existing ? 'update' : 'create'} ${handle.padEnd(28)} ${String(members.length).padStart(3)} products` +
        (missing ? `  (${missing} not found in store)` : '')
    );

    if (!APPLY) continue;

    let id = existing;
    if (id) {
      const data = await gql(
        `mutation($input: CollectionInput!) {
          collectionUpdate(input: $input) { collection { id } userErrors { field message } }
        }`,
        { input: { id, title, descriptionHtml: `<p>${body}</p>` } }
      );
      assertNoUserErrors(`collectionUpdate ${handle}`, data.collectionUpdate);
    } else {
      const data = await gql(
        `mutation($input: CollectionInput!) {
          collectionCreate(input: $input) { collection { id } userErrors { field message } }
        }`,
        { input: { handle, title, descriptionHtml: `<p>${body}</p>` } }
      );
      assertNoUserErrors(`collectionCreate ${handle}`, data.collectionCreate);
      id = data.collectionCreate.collection.id;
      collectionIds.set(handle, id);
    }

    // Membership in batches — collectionAddProducts caps at 250 per call.
    for (let i = 0; i < members.length; i += 250) {
      const data = await gql(
        `mutation($id: ID!, $productIds: [ID!]!) {
          collectionAddProducts(id: $id, productIds: $productIds) {
            userErrors { field message }
          }
        }`,
        { id, productIds: members.slice(i, i + 250) }
      );
      assertNoUserErrors(`collectionAddProducts ${handle}`, data.collectionAddProducts);
    }

    const pub = await gql(
      `mutation($id: ID!, $input: [PublicationInput!]!) {
        publishablePublish(id: $id, input: $input) { userErrors { field message } }
      }`,
      { id, input: [{ publicationId }] }
    );
    assertNoUserErrors(`publish ${handle}`, pub.publishablePublish);
  }
}

/**
 * The menu. Nesting mirrors docs/ia.md §2 exactly. Items point at collections by
 * gid so a renamed title never breaks a link.
 */
const MENU = [
  {
    title: 'SYP Billet',
    collection: 'syp-billet',
    items: [
      {
        title: 'Drivetrain',
        collection: 'syp-drivetrain',
        items: [
          { title: 'Billet Halfshafts, Carriers & Selectors', collection: 'billet-drivetrain' },
          { title: 'Transmission Internals', collection: 'transmission-internals' },
          { title: 'LSD, Gearsets & Final Drives', collection: 'lsd' },
          { title: 'Clutch & Flywheel', collection: 'clutch-flywheel' },
        ],
      },
      { title: 'Single Lobe Rockers', collection: 'syp-single-lobe-rockers' },
      { title: 'Turbo Manifolds', collection: 'syp-turbo-manifolds' },
      { title: 'Cooling & Charge Piping', collection: 'syp-cooling' },
      { title: 'Clamps, Hardware & Fabrication', collection: 'syp-fabrication-hardware' },
    ],
  },
  {
    title: 'Honda',
    collection: 'honda',
    items: [
      { title: 'K-Series', collection: 'honda-k-series' },
      { title: 'B/D/H-Series', collection: 'honda-b-d-h-series' },
    ],
  },
  {
    title: 'Mitsubishi Evo',
    collection: 'mitsubishi-evo-parts',
    items: [
      { title: 'Evo 7/8/9', collection: 'mitsubishi-evo-7-8-9' },
      { title: 'Evo X', collection: 'mitsubishi-evo-x' },
    ],
  },
  { title: 'BMW / Toyota B58', collection: 'bmw-toyota-b58' },
  {
    title: 'Forced Induction',
    collection: 'forced-induction',
    items: [
      { title: 'Turbo Manifolds', collection: 'turbo-manifolds' },
      { title: 'Exhaust & Hot Parts', collection: 'exhaust-hot-parts' },
      { title: 'Cooling & Charge Piping', collection: 'cooling' },
      { title: 'Fueling', collection: 'fueling' },
      { title: 'Engine Management & Electronics', collection: 'engine-management' },
    ],
  },
  {
    title: 'Fabrication',
    collection: 'universal-fabrication',
    items: [
      { title: 'Clamps, V-Band & Flanges', collection: 'clamps-v-band-flanges' },
      { title: 'Pie Cuts, Mandrel Bends & Tube', collection: 'pie-cuts-mandrel-bends' },
    ],
  },
  {
    // The parent IS the engine-internals collection. Repeating it as a child
    // would put the same URL in the menu twice - which is precisely what Phase 0
    // criticised in the old nav, where SHOP BY BRAND and SHOP BY PRODUCT both
    // pointed at /collections.
    title: 'Engine',
    collection: 'engine',
    items: [
      { title: 'Valvetrain', collection: 'valvetrain' },
      { title: 'Intake & Throttle Bodies', collection: 'intake' },
      { title: 'Chassis & Suspension', collection: 'suspension' },
      { title: 'Exterior', collection: 'exterior' },
    ],
  },
  {
    // No brands index page exists, and pointing this at syp-billet would tell a
    // visitor that "Brands" means the in-house billet collection. /collections
    // is the honest target until Phase 6 builds a real one.
    title: 'Brands',
    url: '/collections',
    items: [
      { title: 'Synchro Solutionz', collection: 'synchro-solutionz' },
      { title: 'Comp 1 Clutch', collection: 'comp-1-clutch' },
    ],
  },
];

function toMenuItems(nodes, collectionIds) {
  return nodes.map((n) => {
    const children = n.items ? { items: toMenuItems(n.items, collectionIds) } : {};

    // A plain URL item, for targets that are not a collection.
    if (n.url) return { title: n.title, type: 'HTTP', url: n.url, ...children };

    const id = collectionIds.get(n.collection);
    if (!id) throw new Error(`Menu points at a collection that does not exist: ${n.collection}`);
    return { title: n.title, type: 'COLLECTION', resourceId: id, ...children };
  });
}

/** Print the tree without resolving gids, so a dry run can show the shape. */
function printMenu(nodes, collectionIds, depth = 0) {
  for (const n of nodes) {
    const target = n.url ? n.url : n.collection;
    const pending = !n.url && !collectionIds.has(n.collection);
    plan(
      `${'  '.repeat(depth)}${n.title.padEnd(38 - depth * 2)} -> ${target}` +
        (pending ? '  (created earlier in this run)' : '')
    );
    if (n.items) printMenu(n.items, collectionIds, depth + 1);
  }
}

async function applyMenu(collectionIds) {
  log('\n== MENU ==');
  const count = (nodes) => nodes.reduce((n, i) => n + 1 + (i.items ? count(i.items) : 0), 0);

  // On a dry run the collections have not been created, so their gids do not
  // exist and toMenuItems would throw on the first one. Print the tree instead:
  // the point of a dry run is to show the shape, not to prove the ids resolve.
  if (!APPLY) {
    plan(`main-menu: ${MENU.length} top-level, ${count(MENU)} items total`);
    printMenu(MENU, collectionIds);
    return;
  }

  const items = toMenuItems(MENU, collectionIds);
  plan(`main-menu: ${MENU.length} top-level, ${count(items)} items total`);

  const existing = await gql(`{ menus(first: 20) { nodes { id handle } } }`);
  const menu = existing.menus.nodes.find((m) => m.handle === 'main-menu');

  if (menu) {
    const data = await gql(
      `mutation($id: ID!, $title: String!, $handle: String!, $items: [MenuItemUpdateInput!]!) {
        menuUpdate(id: $id, title: $title, handle: $handle, items: $items) {
          menu { id } userErrors { field message }
        }
      }`,
      { id: menu.id, title: 'Main menu', handle: 'main-menu', items }
    );
    assertNoUserErrors('menuUpdate', data.menuUpdate);
  } else {
    const data = await gql(
      `mutation($title: String!, $handle: String!, $items: [MenuItemCreateInput!]!) {
        menuCreate(title: $title, handle: $handle, items: $items) {
          menu { id } userErrors { field message }
        }
      }`,
      { title: 'Main menu', handle: 'main-menu', items }
    );
    assertNoUserErrors('menuCreate', data.menuCreate);
  }
}

async function applyRedirects() {
  const redirects = parseRedirects();
  log(`\n== REDIRECTS (${redirects.length}) ==`);

  const failures = [];

  for (const r of redirects) {
    plan(`${r.from.padEnd(48)} -> ${r.to}`);
    if (!APPLY) continue;

    const data = await gql(
      `mutation($input: UrlRedirectInput!) {
        urlRedirectCreate(urlRedirect: $input) { urlRedirect { id } userErrors { field message } }
      }`,
      { input: { path: r.from, target: r.to } }
    );

    const errs = data.urlRedirectCreate.userErrors ?? [];
    if (!errs.length) continue;
    // A redirect that already exists is not a failure on a re-run.
    if (errs.every((e) => /already|taken|exists/i.test(e.message))) continue;

    // Everything else is collected rather than thrown, so one bad row does not
    // abandon the other 44 — but it is reported and the run exits non-zero.
    // `/collections/frontpage` is the expected one: Shopify reserves that handle.
    failures.push(`${r.from} -> ${r.to}: ${errs.map((e) => e.message).join('; ')}`);
  }

  if (failures.length) {
    log(`\n  ${failures.length} redirect(s) rejected by Shopify:`);
    for (const f of failures) log(`    ${f}`);
  }
  return failures.length;
}

// ---------------------------------------------------------------------------

const t0 = Date.now();
log(`Store:  ${STORE}`);
log(`Mode:   ${APPLY ? 'APPLY — writing' : 'DRY RUN — nothing will be written'}`);

const productIds = await fetchProductIds();
const collectionIds = await fetchCollectionIds();
log(`Found:  ${productIds.size} products, ${collectionIds.size} existing collections`);

if (wants('collections')) {
  const publicationId = APPLY ? await onlineStorePublicationId() : null;
  await applyCollections(productIds, collectionIds, publicationId);
}
if (wants('menu')) await applyMenu(collectionIds);
const redirectFailures = wants('redirects') ? await applyRedirects() : 0;

log(`\nDone in ${((Date.now() - t0) / 1000).toFixed(1)}s, ${calls} API calls.`);
if (!APPLY) log('Dry run only. Re-run with --apply to write.');
if (redirectFailures) process.exitCode = 1;
