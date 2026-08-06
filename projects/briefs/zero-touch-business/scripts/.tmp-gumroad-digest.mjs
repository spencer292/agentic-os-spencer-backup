import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../../../');
const envPath = resolve(repoRoot, '.env');

function readEnv() {
  const out = {};
  if (!existsSync(envPath)) return out;
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

const env = readEnv();
const token = env.GUMROAD_ACCESS_TOKEN;

if (!token) {
  console.log(JSON.stringify({ error: 'NO_TOKEN' }));
  process.exit(0);
}

const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const salesRes = await fetch(`https://api.gumroad.com/v2/sales?access_token=${token}&after=${sevenDaysAgo}`);
const salesWeek = await salesRes.json();

const salesLifetimeRes = await fetch(`https://api.gumroad.com/v2/sales?access_token=${token}`);
const salesLifetime = await salesLifetimeRes.json();

const prodRes = await fetch(`https://api.gumroad.com/v2/products?access_token=${token}`);
const products = await prodRes.json();

const weekSales = salesWeek.sales || [];
const grossWeek = weekSales.reduce((sum, s) => sum + (s.price || 0), 0);
const refundsWeek = weekSales.filter(s => s.refunded).length;

const lifetimeSales = salesLifetime.sales || [];
const grossLifetime = lifetimeSales.reduce((sum, s) => sum + (s.price || 0), 0);

console.log(JSON.stringify({
  success_week: salesWeek.success,
  week_count: weekSales.length,
  gross_week_cents: grossWeek,
  refunds_week: refundsWeek,
  success_lifetime: salesLifetime.success,
  lifetime_count: lifetimeSales.length,
  gross_lifetime_cents: grossLifetime,
  products_success: products.success,
  products: (products.products || []).map(p => ({
    id: p.id,
    name: p.name,
    published: p.published,
    price: p.price,
    permalink: p.short_url
  }))
}, null, 2));
