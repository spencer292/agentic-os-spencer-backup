// gumroad-publish.mjs — create/update the Cleaning Business Starter Kit on Gumroad.
// Creates the product UNPUBLISHED (publish flag stays false until Spencer's batch-1 approval).
// Requires GUMROAD_ACCESS_TOKEN in repo-root .env. Idempotent: stores the product id in
// products/cleaning-kit/gumroad-product.json and switches to update mode when present.
//
// Usage:
//   node .../gumroad-publish.mjs           # create or update (stays unpublished)
//   node .../gumroad-publish.mjs --publish # also flip published=true (post-approval only)
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const projRoot = resolve(here, '..');
const repoRoot = resolve(projRoot, '..', '..', '..');
const stateFile = resolve(projRoot, 'products', 'cleaning-kit', 'gumroad-product.json');

function env(key) {
  const envPath = resolve(repoRoot, '.env');
  if (!existsSync(envPath)) return undefined;
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && m[1] === key) return m[2].replace(/^["']|["']$/g, '');
  }
  return undefined;
}

const TOKEN = env('GUMROAD_ACCESS_TOKEN');
if (!TOKEN) {
  console.log('PENDING: GUMROAD_ACCESS_TOKEN not in .env — Gumroad account not connected yet. Nothing done.');
  process.exit(0);
}

// Parse listing copy: title/price from the listing file; description = the "## Description" body as HTML-ish text.
const listing = readFileSync(resolve(projRoot, 'products', 'cleaning-kit', 'listing-copy.md'), 'utf8');
const name = (listing.match(/\*\*Product name:\*\* (.+)/) || [])[1]?.trim();
const priceMatch = (listing.match(/\*\*Price:\*\* \$(\d+)/) || [])[1];
const descBlock = listing.split('## Description')[1]?.split('## Metadata')[0]?.trim();
if (!name || !priceMatch || !descBlock) {
  console.error('FAIL: could not parse listing-copy.md (name/price/description).');
  process.exit(1);
}

const api = async (path, method = 'GET', body = {}) => {
  const params = new URLSearchParams({ access_token: TOKEN, ...body });
  const url = `https://api.gumroad.com/v2${path}${method === 'GET' ? `?${params}` : ''}`;
  const res = await fetch(url, method === 'GET' ? {} : { method, body: params });
  const json = await res.json();
  if (!res.ok || json.success === false) throw new Error(`${method} ${path}: ${res.status} ${JSON.stringify(json).slice(0, 300)}`);
  return json;
};

const wantPublish = process.argv.includes('--publish');
const state = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')) : {};

const fields = {
  name,
  price: String(Number(priceMatch) * 100),
  description: descBlock,
  customizable_price: 'false',
};

try {
  let product;
  if (state.product_id) {
    product = (await api(`/products/${state.product_id}`, 'PUT', fields)).product;
    console.log(`UPDATED product ${state.product_id} (published=${product.published})`);
  } else {
    product = (await api('/products', 'POST', fields)).product;
    console.log(`CREATED product ${product.id} — UNPUBLISHED, awaiting Spencer approval`);
  }
  if (wantPublish && !product.published) {
    product = (await api(`/products/${product.id}`, 'PUT', { published: 'true' })).product;
    console.log('PUBLISHED (post-approval flag was passed).');
  }
  writeFileSync(stateFile, JSON.stringify({
    product_id: product.id,
    short_url: product.short_url,
    published: product.published,
    updated_at: new Date().toISOString(),
  }, null, 2));
  console.log(`Short URL: ${product.short_url}`);
  console.log('NOTE: file uploads (the deliverable PDF) and cover art still attach via the Gumroad dashboard or a follow-up API call once assets are rendered.');
} catch (e) {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
}
