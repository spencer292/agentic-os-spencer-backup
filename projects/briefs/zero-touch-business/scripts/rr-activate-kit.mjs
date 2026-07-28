#!/usr/bin/env node
// rr-activate-kit.mjs — flip a kit's buy button live on the site, but ONLY once Gumroad
// confirms the product is actually purchasable.
//
// Why this exists: on 2026-07-20 the cleaning kit silently reverted to unpublished and the
// site kept selling it — 0 sales read as "no demand" when it was really a closed store.
// This makes that failure impossible in the other direction: the site cannot advertise a
// product that Gumroad says is unpublished or has no files attached.
//
// Checks, in order: product exists -> published === true -> at least one file attached.
// Only then does it write the real short_url into site/config.json.
//
// Usage:
//   node .../rr-activate-kit.mjs pw-kit            # check only, report
//   node .../rr-activate-kit.mjs pw-kit --write    # also update site/config.json
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const projRoot = resolve(here, '..');
const repoRoot = resolve(projRoot, '..', '..', '..');

const KIT_TOKEN = {
  'cleaning-kit': 'GUMROAD_CLEANING_KIT_URL',
  'pw-kit': 'GUMROAD_PW_KIT_URL',
  'lawn-kit': 'GUMROAD_LAWN_KIT_URL',
};

const kit = process.argv[2];
const WRITE = process.argv.includes('--write');
if (!kit || !KIT_TOKEN[kit]) {
  console.error('FAIL: pass a kit — one of: %s', Object.keys(KIT_TOKEN).join(', '));
  process.exit(1);
}

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
if (!TOKEN) { console.log(JSON.stringify({ status: 'PENDING', reason: 'GUMROAD_ACCESS_TOKEN missing' })); process.exit(0); }

const stateFile = resolve(projRoot, 'products', kit, 'gumroad-product.json');
if (!existsSync(stateFile)) {
  console.log(JSON.stringify({ status: 'NOT_CREATED', kit, fix: `node scripts/rr-gumroad-publish-kit.mjs ${kit}` }));
  process.exit(0);
}
const state = JSON.parse(readFileSync(stateFile, 'utf8'));

const res = await fetch(`https://api.gumroad.com/v2/products/${encodeURIComponent(state.product_id)}?access_token=${TOKEN}`);
const json = await res.json();
if (!res.ok || json.success === false) {
  console.log(JSON.stringify({ status: 'ERROR', detail: JSON.stringify(json).slice(0, 300) }));
  process.exit(1);
}
const p = json.product;
const fileCount = Array.isArray(p.file_info) ? p.file_info.length
  : (p.file_info && typeof p.file_info === 'object' ? Object.keys(p.file_info).length : 0);

const out = {
  kit,
  product_id: state.product_id,
  name: p.name,
  published: p.published,
  short_url: p.short_url,
  price_cents: p.price,
  files_attached: fileCount,
  token: KIT_TOKEN[kit],
};

if (!p.published) {
  out.status = 'NOT_PUBLISHED';
  out.blocker = 'Gumroad says this product is unpublished. Attach the files + cover in the dashboard, then: node scripts/rr-gumroad-publish-kit.mjs ' + kit + ' --publish';
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}
// NOTE (2026-07-26): Gumroad API v2 `file_info` returns empty even when files ARE
// attached — verified against the PW kit, which had all 14 files visible in the
// dashboard while the API reported zero. So this cannot gate activation; it would
// block every kit forever. Treat it as advisory and rely on `published`, which
// Gumroad only sets once the product is genuinely for sale.
if (fileCount === 0) {
  out.file_check = 'UNVERIFIABLE — Gumroad API does not report attached files reliably; confirm in the dashboard';
}

out.status = 'READY';
if (WRITE) {
  const cfgPath = resolve(projRoot, 'site', 'config.json');
  const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
  const before = cfg.tokens[KIT_TOKEN[kit]];
  cfg.tokens[KIT_TOKEN[kit]] = p.short_url;
  writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n');
  out.config_updated = { token: KIT_TOKEN[kit], from: before, to: p.short_url };
  out.next = 'node site/build.mjs, then deploy (scripts/cf-deploy.mjs)';
} else {
  out.next = `re-run with --write to put ${p.short_url} into site/config.json`;
}
console.log(JSON.stringify(out, null, 2));
process.exit(0); // explicit: avoids a libuv teardown assertion on Windows after fetch
