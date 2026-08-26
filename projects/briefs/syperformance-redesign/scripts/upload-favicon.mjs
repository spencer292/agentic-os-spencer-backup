// Uploads brand/favicon-512.png to the build store's Files, then points the
// theme's favicon setting at it.
//
//   node scripts/upload-favicon.mjs          # report what it would do
//   node scripts/upload-favicon.mjs --write  # actually upload and set the setting
//
// Needs write_files on the Admin token. If the scope is missing the script says
// so and stops, rather than half-doing it — the theme carries a bundled fallback
// either way (see layout/theme.liquid), so the favicon works regardless.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const WRITE = process.argv.includes('--write');

function env() {
  const envPath = path.join(ROOT, '..', '..', '..', '.env');
  const out = {};
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const eq = line.indexOf('=');
    if (eq < 1 || line.trimStart().startsWith('#')) continue;
    const key = line.slice(0, eq).trim();
    if (!/^[A-Z0-9_]+$/.test(key)) continue;
    out[key] = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

const E = env();
const STORE = E.SHOPIFY_BUILD_STORE;
const TOKEN = E.SHOPIFY_BUILD_ADMIN_TOKEN;
if (!STORE || !TOKEN) {
  console.error('SHOPIFY_BUILD_STORE / SHOPIFY_BUILD_ADMIN_TOKEN missing from .env — see scripts/check-token.mjs');
  process.exit(1);
}
const API = `https://${STORE}/admin/api/2025-07/graphql.json`;

async function gql(query, variables = {}) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'X-Shopify-Access-Token': TOKEN, 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables })
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors, null, 1));
  return json.data;
}

// --- scope check -------------------------------------------------------------
const scopeRes = await fetch(`https://${STORE}/admin/oauth/access_scopes.json`, {
  headers: { 'X-Shopify-Access-Token': TOKEN }
});
const scopes = ((await scopeRes.json()).access_scopes || []).map(s => s.handle);
console.log(`Token scopes: ${scopes.join(', ') || '(none reported)'}\n`);

if (!scopes.includes('write_files')) {
  console.log('No write_files scope, so this script cannot upload to Files.');
  console.log('That is fine — the theme bundles the icon as a theme asset and');
  console.log('layout/theme.liquid falls back to it, so the favicon still works.');
  console.log('\nTo use the Shopify-hosted route instead, either:');
  console.log(`  a) add write_files to the custom app at https://${STORE}/admin/settings/apps`);
  console.log('     and reinstall it to reissue the token, or');
  console.log('  b) upload brand/favicon-512.png by hand in the theme editor:');
  console.log(`     https://${STORE}/admin/themes/157001318557/editor -> Theme settings -> Favicon`);
  process.exit(0);
}

if (!WRITE) {
  console.log('Dry run. Would upload brand/favicon-512.png and set the theme favicon.');
  console.log('Re-run with --write to do it.');
  process.exit(0);
}

// --- staged upload -----------------------------------------------------------
const bytes = readFileSync(path.join(ROOT, 'brand', 'favicon-512.png'));
const staged = await gql(`
  mutation stage($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets { url resourceUrl parameters { name value } }
      userErrors { field message }
    }
  }`, {
  input: [{
    filename: 'syp-favicon-512.png',
    mimeType: 'image/png',
    resource: 'FILE',
    httpMethod: 'POST',
    fileSize: String(bytes.length)
  }]
});
const errs = staged.stagedUploadsCreate.userErrors;
if (errs.length) throw new Error(JSON.stringify(errs));
const target = staged.stagedUploadsCreate.stagedTargets[0];

const form = new FormData();
for (const p of target.parameters) form.append(p.name, p.value);
form.append('file', new Blob([bytes], { type: 'image/png' }), 'syp-favicon-512.png');
const up = await fetch(target.url, { method: 'POST', body: form });
if (!up.ok) throw new Error(`staged upload failed: ${up.status} ${await up.text()}`);
console.log('Uploaded to staging.');

const created = await gql(`
  mutation create($files: [FileCreateInput!]!) {
    fileCreate(files: $files) {
      files { id fileStatus ... on MediaImage { image { url } } }
      userErrors { field message }
    }
  }`, {
  files: [{
    originalSource: target.resourceUrl,
    contentType: 'IMAGE',
    alt: 'SYPerformance'
  }]
});
const cErrs = created.fileCreate.userErrors;
if (cErrs.length) throw new Error(JSON.stringify(cErrs));
console.log('File created:', JSON.stringify(created.fileCreate.files[0], null, 1));

// --- point the theme setting at it ------------------------------------------
// image_picker settings serialise as shopify://shop_images/<filename>.
const settingsPath = path.join(ROOT, 'theme', 'config', 'settings_data.json');
let raw = readFileSync(settingsPath, 'utf8');
if (raw.includes('"favicon"')) {
  raw = raw.replace(/"favicon"\s*:\s*"[^"]*"/, '"favicon": "shopify://shop_images/syp-favicon-512.png"');
} else {
  raw = raw.replace(/("current"\s*:\s*\{)/, '$1\n    "favicon": "shopify://shop_images/syp-favicon-512.png",');
}
writeFileSync(settingsPath, raw);
console.log('\nSet settings_data.json favicon. Push the theme to apply:');
console.log('  shopify theme push --path theme --store ' + STORE + ' --theme 157001318557 --only config/settings_data.json');
