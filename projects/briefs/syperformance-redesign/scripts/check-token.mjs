/**
 * Verify the Shopify Admin token is where the scripts expect it, without ever
 * printing its value.
 *
 *   node scripts/check-token.mjs
 *
 * Reports the absolute path it read, whether the file exists, which of the two
 * keys are present (names only), and — if both are — makes one live API call and
 * prints the shop name and product count back as proof.
 *
 * The token value is never printed, logged or returned. Only its length and
 * prefix are shown, which is enough to spot a truncated paste or a stray quote
 * and useless to anyone reading the transcript.
 */

import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..', '..');
const envPath = join(repoRoot, '.env');

console.log(`Looking for: ${envPath}`);

let stat;
try {
  stat = statSync(envPath);
} catch {
  console.log('\n  NOT FOUND at that path.');
  console.log('  Create it there, or tell me where you saved it and I will point the scripts at it.');
  process.exit(1);
}

console.log(`Found:       ${stat.size} bytes, modified ${stat.mtime.toISOString()}`);

const raw = readFileSync(envPath, 'utf8');
const env = {};
for (const line of raw.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}

const keys = Object.keys(env);
console.log(`Parsed:      ${keys.length} keys`);

const shopifyKeys = keys.filter((k) => k.includes('SHOPIFY'));
console.log(`Shopify keys present: ${shopifyKeys.length ? shopifyKeys.join(', ') : 'NONE'}`);

const store = env.SHOPIFY_BUILD_STORE;
const token = env.SHOPIFY_BUILD_ADMIN_TOKEN;

if (!store || !token) {
  console.log('\n  Missing:');
  if (!store) console.log('    SHOPIFY_BUILD_STORE');
  if (!token) console.log('    SHOPIFY_BUILD_ADMIN_TOKEN');
  console.log('\n  Add them at the END of the file, one per line, no quotes:');
  console.log('    SHOPIFY_BUILD_STORE=syperformance-build.myshopify.com');
  console.log('    SHOPIFY_BUILD_ADMIN_TOKEN=shpat_...');
  process.exit(1);
}

// Shape check before spending an API call — catches a truncated paste or a
// copied placeholder faster than a 401 does.
console.log(`\nStore:  ${store}`);
console.log(`Token:  ${token.slice(0, 6)}… (${token.length} chars)`);
if (!token.startsWith('shpat_')) {
  console.log('  WARNING: does not start with "shpat_". That is not an Admin API access token.');
}

console.log('\nCalling the Admin API…');

const res = await fetch(`https://${store}/admin/api/2025-07/graphql.json`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
  body: JSON.stringify({ query: '{ shop { name myshopifyDomain } productsCount { count } }' }),
});

if (res.status === 401 || res.status === 403) {
  console.log(`  ${res.status} — the token was rejected. Reveal it again, or reinstall the app.`);
  process.exit(1);
}
if (!res.ok) {
  console.log(`  HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  process.exit(1);
}

const body = await res.json();
if (body.errors) {
  console.log(`  GraphQL error: ${JSON.stringify(body.errors).slice(0, 400)}`);
  console.log('  If this mentions access scopes, the app may have been installed before the scopes were saved.');
  process.exit(1);
}

const shop = body.data.shop;
console.log(`\n  OK — connected to "${shop.name}" (${shop.myshopifyDomain})`);
console.log(`  ${body.data.productsCount.count} products visible.`);
console.log('\nReady. Next: node scripts/apply-ia.mjs');
