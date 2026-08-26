/**
 * Phase 6 — create the trust pages on the build store.
 *
 * Templates for these pages are already in the theme. This creates the page
 * records that use them, and the `build` metaobject definition the build
 * gallery upgrades to.
 *
 *   node scripts/apply-pages.mjs            # dry run
 *   node scripts/apply-pages.mjs --apply
 *
 * Same credentials and the same build-store-only guard as apply-ia.mjs.
 *
 * Page BODY copy is deliberately thin here. About/Shop Tour needs Spencer's
 * story and photographs, and Warranty needs terms only he can commit to — this
 * creates the containers with their templates attached, not the words.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..', '..');

const APPLY = process.argv.includes('--apply');
const GUARD = 'syperformance-build.myshopify.com';

function loadEnv() {
  let raw = '';
  try {
    raw = readFileSync(join(repoRoot, '.env'), 'utf8');
  } catch {
    throw new Error('Cannot read .env — see docs/ia.md §7 for how to create the token.');
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
  console.error('Missing SHOPIFY_BUILD_STORE / SHOPIFY_BUILD_ADMIN_TOKEN in .env. See docs/ia.md §7.');
  process.exit(1);
}
if (STORE !== GUARD) {
  console.error(`Refusing to run: store is "${STORE}", expected "${GUARD}".`);
  process.exit(1);
}

const API = `https://${STORE}/admin/api/2025-07/graphql.json`;

async function gql(query, variables = {}) {
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

function assertNoUserErrors(label, payload) {
  const errs = payload?.userErrors ?? [];
  if (errs.length) throw new Error(`${label}: ${errs.map((e) => `${e.field}: ${e.message}`).join('; ')}`);
}

/**
 * templateSuffix maps to templates/page.{suffix}.json in the theme.
 * The footer's link settings point at these handles — keep them in step.
 */
const PAGES = [
  {
    handle: 'about',
    title: 'About / Shop tour',
    templateSuffix: 'about',
    body: '<p>Placeholder. Spencer writes this: who runs the shop, what machines it runs, how long, and what the shop is actually good at. Photographs go in the process steps in the theme editor.</p>',
  },
  {
    handle: 'warranty',
    title: 'Warranty',
    templateSuffix: 'warranty',
    body: '<p>Placeholder. Warranty terms must come from Spencer — this page intentionally ships without invented terms. Whatever SY can genuinely stand behind goes here and is repeated on every in-house product page.</p>',
  },
  {
    handle: 'lead-times',
    title: 'Lead times',
    templateSuffix: 'lead-times',
    body: '',
  },
  {
    handle: 'dealer-program',
    title: 'Dealer & pro program',
    templateSuffix: 'dealer',
    body: '',
  },
  {
    handle: 'build-gallery',
    title: 'Build gallery',
    templateSuffix: 'build-gallery',
    body: '',
  },
];

/**
 * The build metaobject. syp-gallery.liquid reads this when it exists and falls
 * back to section blocks until then, so creating it is an upgrade rather than a
 * migration — nothing already entered is lost.
 */
const BUILD_DEFINITION = {
  name: 'Build',
  type: 'build',
  displayNameKey: 'title',
  access: { storefront: 'PUBLIC_READ' },
  capabilities: { publishable: { enabled: true } },
  fieldDefinitions: [
    { key: 'title', name: 'Car', type: 'single_line_text_field', required: true },
    { key: 'platform', name: 'Platform', type: 'single_line_text_field' },
    { key: 'power', name: 'Power', type: 'single_line_text_field' },
    { key: 'result', name: 'Result', type: 'single_line_text_field' },
    { key: 'image', name: 'Photo', type: 'file_reference' },
    {
      key: 'parts',
      name: 'SYP parts on the car',
      type: 'list.product_reference',
    },
  ],
};

const log = (...a) => console.log(...a);
const plan = (...a) => console.log(APPLY ? '  ' : '  [dry] ', ...a);

log(`Store:  ${STORE}`);
log(`Mode:   ${APPLY ? 'APPLY — writing' : 'DRY RUN — nothing will be written'}`);

// --- Pages -------------------------------------------------------------------

log(`\n== PAGES (${PAGES.length}) ==`);

const existing = await gql(`{ pages(first: 100) { nodes { id handle } } }`);
const byHandle = new Map(existing.pages.nodes.map((p) => [p.handle, p.id]));

for (const page of PAGES) {
  const id = byHandle.get(page.handle);
  plan(`${id ? 'update' : 'create'} /pages/${page.handle.padEnd(16)} template: page.${page.templateSuffix}`);
  if (!APPLY) continue;

  if (id) {
    const data = await gql(
      `mutation($id: ID!, $page: PageUpdateInput!) {
        pageUpdate(id: $id, page: $page) { page { id } userErrors { field message } }
      }`,
      { id, page: { title: page.title, templateSuffix: page.templateSuffix } }
    );
    assertNoUserErrors(`pageUpdate ${page.handle}`, data.pageUpdate);
  } else {
    const data = await gql(
      `mutation($page: PageCreateInput!) {
        pageCreate(page: $page) { page { id } userErrors { field message } }
      }`,
      {
        page: {
          handle: page.handle,
          title: page.title,
          templateSuffix: page.templateSuffix,
          body: page.body,
          isPublished: true,
        },
      }
    );
    assertNoUserErrors(`pageCreate ${page.handle}`, data.pageCreate);
  }
}

// --- Build metaobject --------------------------------------------------------

log('\n== METAOBJECT ==');

const defs = await gql(`{ metaobjectDefinitions(first: 50) { nodes { id type } } }`);
const buildDef = defs.metaobjectDefinitions.nodes.find((d) => d.type === 'build');

plan(buildDef ? 'build definition already exists — leaving it alone' : 'create "build" metaobject definition');

if (APPLY && !buildDef) {
  const data = await gql(
    `mutation($definition: MetaobjectDefinitionCreateInput!) {
      metaobjectDefinitionCreate(definition: $definition) {
        metaobjectDefinition { id type } userErrors { field message }
      }
    }`,
    { definition: BUILD_DEFINITION }
  );
  assertNoUserErrors('metaobjectDefinitionCreate', data.metaobjectDefinitionCreate);
}

log('\nDone.');
if (!APPLY) log('Dry run only. Re-run with --apply to write.');
log('\nAfter this runs, point the footer link settings at the new page handles in the theme editor.');
