// One-off digest helper — reads .env the same way ztb-readiness.mjs does, calls Gumroad sales + products.
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..', '..');

function readEnv() {
  const envPath = resolve(repoRoot, '.env');
  const out = {};
  if (!existsSync(envPath)) return out;
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}

const env = readEnv();
const token = env.GUMROAD_ACCESS_TOKEN;
if (!token) {
  console.log(JSON.stringify({ error: 'NO_TOKEN' }));
  process.exit(0);
}

const after = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

async function main() {
  const result = {};

  try {
    const salesRes = await fetch('https://api.gumroad.com/v2/sales?access_token=' + token + '&after=' + after);
    const salesData = await salesRes.json();
    if (!salesData.success) {
      result.sales_error = JSON.stringify(salesData);
    } else {
      const sales = salesData.sales || [];
      const gross = sales.reduce((s, x) => s + (x.price || 0), 0);
      const refunds = sales.filter((x) => x.refunded).length;
      result.sales_7d = {
        count: sales.length,
        gross_cents: gross,
        refunds,
        items: sales.map((s) => ({ product: s.product_name, price: s.price, created: s.created_at, refunded: s.refunded })),
      };
    }
  } catch (e) {
    result.sales_fetch_error = e.message;
  }

  try {
    const prodRes = await fetch('https://api.gumroad.com/v2/products?access_token=' + token);
    const prodData = await prodRes.json();
    if (!prodData.success) {
      result.products_error = JSON.stringify(prodData);
    } else {
      result.products = (prodData.products || []).map((p) => ({
        id: p.id,
        custom_permalink: p.custom_permalink,
        name: p.name,
        published: p.published,
        price: p.price,
        sales_count: p.sales_count,
      }));
    }
  } catch (e) {
    result.products_fetch_error = e.message;
  }

  console.log(JSON.stringify(result, null, 2));
}

main();
