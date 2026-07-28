#!/usr/bin/env node
// rr-gumroad-publish-kit.mjs — create/update any Route Ready kit on Gumroad.
// Generalized from gumroad-publish.mjs (which is hard-wired to the cleaning kit and
// stays as-is). Creates the product UNPUBLISHED; --publish flips it live.
//
// Gumroad's API cannot upload deliverable files — those attach in the dashboard.
// This script does everything else: name, price, description, and the state file.
//
// Usage:
//   node .../rr-gumroad-publish-kit.mjs pw-kit
//   node .../rr-gumroad-publish-kit.mjs lawn-kit --publish
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const projRoot = resolve(here, '..');
const repoRoot = resolve(projRoot, '..', '..', '..');

const kit = process.argv[2];
if (!kit || kit.startsWith('--')) {
  console.error('FAIL: pass a kit folder name, e.g. pw-kit | lawn-kit | cleaning-kit');
  process.exit(1);
}
const kitDir = resolve(projRoot, 'products', kit);
if (!existsSync(kitDir)) {
  console.error(`FAIL: no such kit folder: products/${kit}`);
  process.exit(1);
}
const stateFile = resolve(kitDir, 'gumroad-product.json');

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
  console.log('PENDING: GUMROAD_ACCESS_TOKEN not in .env — nothing done.');
  process.exit(0);
}

const listingPath = resolve(kitDir, 'listing-copy.md');
if (!existsSync(listingPath)) {
  console.error(`FAIL: products/${kit}/listing-copy.md not found`);
  process.exit(1);
}
const listing = readFileSync(listingPath, 'utf8');
const name = (listing.match(/\*\*Product name:\*\* (.+)/) || [])[1]?.trim();
const priceMatch = (listing.match(/\*\*Price:\*\* \$(\d+)/) || [])[1];
const descBlock = listing.split('## Description')[1]?.split('## Metadata')[0]?.trim();
if (!name || !priceMatch || !descBlock) {
  console.error('FAIL: could not parse listing-copy.md (name/price/description).');
  process.exit(1);
}

// Deliverables must exist before a product goes live — a published product with no
// files is the store-closed failure mode in reverse.
const delivDir = resolve(kitDir, 'deliverables');
const files = existsSync(delivDir)
  ? readdirSync(delivDir).filter(f => /\.(docx|xlsx|pdf)$/i.test(f))
  : [];
const wantPublish = process.argv.includes('--publish');
if (wantPublish && files.length === 0) {
  console.error('FAIL: --publish refused — no deliverable files in products/%s/deliverables.', kit);
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

// Gumroad renders the description as HTML, not markdown. Sending raw markdown puts
// literal ** on the live sales page and collapses the bullets into one run-on
// paragraph (observed on the PW listing 2026-07-26). Convert before sending.
function mdToHtml(md) {
  const inline = (s) => s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');

  const out = [];
  let list = null;
  const closeList = () => { if (list) { out.push(`<ul>${list.join('')}</ul>`); list = null; } };

  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) { closeList(); continue; }
    if (/^[-*]\s+/.test(line)) {
      list = list || [];
      list.push(`<li>${inline(line.replace(/^[-*]\s+/, ''))}</li>`);
      continue;
    }
    closeList();
    if (/^#{1,6}\s+/.test(line)) {
      const level = Math.min(line.match(/^#+/)[0].length + 1, 6);
      out.push(`<h${level}>${inline(line.replace(/^#{1,6}\s+/, ''))}</h${level}>`);
    } else {
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  closeList();
  return out.join('\n');
}

const state = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')) : {};
const fields = {
  name,
  price: String(Number(priceMatch) * 100),
  description: mdToHtml(descBlock),
  customizable_price: 'false',
};

try {
  let product;
  if (state.product_id) {
    product = (await api(`/products/${state.product_id}`, 'PUT', fields)).product;
    console.log(`UPDATED product ${state.product_id} (published=${product.published})`);
  } else {
    product = (await api('/products', 'POST', fields)).product;
    console.log(`CREATED product ${product.id} — UNPUBLISHED`);
  }
  if (wantPublish && !product.published) {
    product = (await api(`/products/${product.id}`, 'PUT', { published: 'true' })).product;
    console.log('PUBLISHED.');
  }
  writeFileSync(stateFile, JSON.stringify({
    kit,
    product_id: product.id,
    short_url: product.short_url,
    published: product.published,
    updated_at: new Date().toISOString(),
  }, null, 2));
  console.log(`Short URL: ${product.short_url}`);
  console.log(`Deliverables ready to attach: ${files.length} file(s) in products/${kit}/deliverables/`);
  if (!product.published) {
    console.log('NEXT: attach the 14 files + cover art in the Gumroad dashboard, then re-run with --publish.');
  }
} catch (e) {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
}
