// Add the twelve new sub-collections to the main menu.
//
//   node scripts/apply-menu-subcollections.mjs           # dry run, prints the resulting tree
//   node scripts/apply-menu-subcollections.mjs --apply
//
// menuUpdate REPLACES the whole item tree — there is no "add one item" mutation.
// So this reads the live menu, grafts the new children onto the right parents, and
// writes the complete tree back. It refuses to run if the live menu does not look
// like what it expects, rather than flattening the navigation.
//
// Shopify menus are three levels deep maximum. The new pages go in at level 3
// under Honda > K-Series and Honda > B/D/H-Series, which is where a buyer who has
// already picked their engine would look for them.
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

// parent menu-item title -> children to graft on, in order
const ADDITIONS = {
  'K-Series': [
    ['Synchros & Rebuild Kits', 'k-series-synchros'],
    ['Bearings, Seals & Gears', 'k-series-transmission-hardware'],
    ['AWD, Halfshafts & Transfer Case', 'k-series-awd-driveline'],
    ['Turbo Manifolds', 'honda-k-turbo-manifolds'],
    ['Engine & Valvetrain', 'honda-k-series-engine'],
    ['Cooling', 'honda-k-series-cooling'],
    ['Harnesses & Electronics', 'honda-k-series-electronics']
  ],
  'B/D/H-Series': [
    ['Synchros & Rebuild Kits', 'b-h-series-synchros'],
    ['Driveline & Transmission Hardware', 'b-d-h-driveline-hardware'],
    ['Turbo Manifolds', 'honda-b-d-h-turbo-manifolds'],
  ],
  'Evo 7/8/9': [
    ['Turbo Manifolds', 'evo-turbo-manifolds']
  ]
};

const MENU_Q = `{
  menus(first: 10) {
    nodes {
      id handle title
      items {
        id title type url resourceId tags
        items {
          id title type url resourceId tags
          items { id title type url resourceId tags }
        }
      }
    }
  }
}`;

const data = await gql(MENU_Q);
const menu = data.menus.nodes.find(m => m.handle === 'main-menu');
if (!menu) { console.error('main-menu not found'); process.exit(1); }

// Sanity: the menu must still look like the Phase 2 IA before we replace it.
const topTitles = menu.items.map(i => i.title);
const EXPECTED = ['SYP Billet', 'Honda', 'Mitsubishi Evo', 'BMW / Toyota B58', 'Forced Induction', 'Fabrication', 'Engine', 'Brands'];
const missing = EXPECTED.filter(t => !topTitles.includes(t));
if (missing.length) {
  console.error(`Live menu does not match what this script expects — missing top-level items: ${missing.join(', ')}`);
  console.error(`Found: ${topTitles.join(', ')}`);
  console.error('Refusing to replace the menu. Re-read it and update ADDITIONS first.');
  process.exit(1);
}

// Resolve collection handles -> gids so items link as COLLECTION resources rather
// than raw URLs (keeps them working if a handle is ever changed in admin).
const gidByHandle = {};
{
  let cursor = null;
  do {
    const d = await gql(`query($c:String){ collections(first:100, after:$c){ pageInfo{hasNextPage endCursor} nodes{ id handle } } }`, { c: cursor });
    for (const n of d.collections.nodes) gidByHandle[n.handle] = n.id;
    cursor = d.collections.pageInfo.hasNextPage ? d.collections.pageInfo.endCursor : null;
  } while (cursor);
}
const unresolved = Object.values(ADDITIONS).flat().filter(([, h]) => !gidByHandle[h]);
if (unresolved.length) {
  console.error(`Collections not found: ${unresolved.map(([, h]) => h).join(', ')}`);
  process.exit(1);
}

// Rebuild the tree. Existing items keep their id so Shopify preserves them.
const toInput = (item) => {
  const out = { id: item.id, title: item.title, type: item.type };
  if (item.resourceId) out.resourceId = item.resourceId; else out.url = item.url;
  if (item.tags?.length) out.tags = item.tags;
  return out;
};

let grafted = 0;
const rebuild = (item, depth) => {
  const node = toInput(item);
  const kids = (item.items || []).map(c => rebuild(c, depth + 1));
  const additions = ADDITIONS[item.title];
  if (additions && depth === 1) {
    const existingTitles = new Set(kids.map(k => k.title));
    for (const [title, handle] of additions) {
      if (existingTitles.has(title)) continue; // idempotent
      kids.push({ title, type: 'COLLECTION', resourceId: gidByHandle[handle] });
      grafted++;
    }
  }
  if (kids.length) node.items = kids;
  return node;
};
const newItems = menu.items.map(i => rebuild(i, 0));

// --- print the resulting tree ------------------------------------------------
const NEW_HANDLES = new Set(Object.values(ADDITIONS).flat().map(([, h]) => h));
const gidToHandle = Object.fromEntries(Object.entries(gidByHandle).map(([h, g]) => [g, h]));
const show = (items, indent = '  ') => {
  for (const i of items) {
    const h = gidToHandle[i.resourceId];
    const isNew = h && NEW_HANDLES.has(h) && !i.id;
    console.log(`${indent}${isNew ? '+ ' : '  '}${i.title}${h ? '  /collections/' + h : ''}`);
    if (i.items) show(i.items, indent + '    ');
  }
};
console.log(`\n${APPLY ? 'APPLYING' : 'DRY RUN'} — grafting ${grafted} new menu items\n`);
show(newItems);

if (!grafted) { console.log('\nNothing to add — already present.'); process.exit(0); }
if (!APPLY) { console.log('\nDry run. Re-run with --apply.'); process.exit(0); }

const UPDATE = `mutation($id: ID!, $title: String!, $handle: String!, $items: [MenuItemUpdateInput!]!) {
  menuUpdate(id: $id, title: $title, handle: $handle, items: $items) {
    menu { id handle items { id title items { id title items { id title } } } }
    userErrors { field message }
  }
}`;
const res = await gql(UPDATE, { id: menu.id, title: menu.title, handle: menu.handle, items: newItems });
const errs = res.menuUpdate.userErrors;
if (errs.length) { console.error('\nFAILED:', JSON.stringify(errs, null, 1)); process.exit(1); }

const count = (items) => items.reduce((n, i) => n + 1 + count(i.items || []), 0);
console.log(`\nMenu updated — ${count(res.menuUpdate.menu.items)} items total.`);
