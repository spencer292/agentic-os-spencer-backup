import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..', '..');

function readEnv() {
  const out = {};
  const envPath = resolve(repoRoot, '.env');
  if (!existsSync(envPath)) return out;
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}

function getJSON(url) {
  return new Promise((resolvePromise, rejectPromise) => {
    https.get(url, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolvePromise(JSON.parse(data));
        } catch (e) {
          rejectPromise(new Error('PARSE_ERROR: ' + e.message + ' body=' + data.slice(0, 300)));
        }
      });
    }).on('error', e => rejectPromise(new Error('REQ_ERROR: ' + e.message)));
  });
}

const env = readEnv();
const token = env.GUMROAD_ACCESS_TOKEN;

if (!token) {
  console.log(JSON.stringify({ error: 'NO_TOKEN' }));
  process.exit(0);
}

const result = { sales: null, products: null };

try {
  const salesJson = await getJSON(`https://api.gumroad.com/v2/sales?access_token=${token}`);
  if (!salesJson.success) {
    result.sales = { error: JSON.stringify(salesJson) };
  } else {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const sales = salesJson.sales || [];
    const recent = sales.filter(s => new Date(s.created_at).getTime() >= sevenDaysAgo);
    const grossRecentCents = recent.reduce((sum, s) => sum + (s.price || 0), 0);
    const refundsRecent = recent.filter(s => s.refunded).length;
    const lifetimeGrossCents = sales.reduce((sum, s) => sum + (s.price || 0), 0);
    result.sales = {
      recent_count: recent.length,
      recent_gross_usd: (grossRecentCents / 100).toFixed(2),
      recent_refunds: refundsRecent,
      lifetime_sales_count: sales.length,
      lifetime_gross_usd: (lifetimeGrossCents / 100).toFixed(2),
    };
  }
} catch (e) {
  result.sales = { error: e.message };
}

try {
  const productsJson = await getJSON(`https://api.gumroad.com/v2/products?access_token=${token}`);
  if (!productsJson.success) {
    result.products = { error: JSON.stringify(productsJson) };
  } else {
    result.products = (productsJson.products || []).map(p => ({
      permalink: p.custom_permalink || p.id,
      name: p.name,
      published: p.published,
    }));
  }
} catch (e) {
  result.products = { error: e.message };
}

console.log(JSON.stringify(result, null, 2));
