// _tmp-digest-gumroad.mjs — one-off digest fetch, safe to delete after run
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const projRoot = resolve(here, '..');
const repoRoot = resolve(projRoot, '..', '..', '..');

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

async function main() {
  const salesRes = await fetch('https://api.gumroad.com/v2/sales?access_token=' + token);
  const salesData = await salesRes.json();

  const productsRes = await fetch('https://api.gumroad.com/v2/products?access_token=' + token);
  const productsData = await productsRes.json();

  const out = {};

  if (!salesData.success) {
    out.sales_error = JSON.stringify(salesData);
  } else {
    const sales = salesData.sales || [];
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const recent = sales.filter(s => new Date(s.created_at).getTime() >= sevenDaysAgo);
    const recentRefunds = recent.filter(s => s.refunded);
    const allRefunds = sales.filter(s => s.refunded);
    out.sales = {
      recent_count: recent.length,
      recent_gross_cents: recent.reduce((sum, s) => sum + (s.price || 0), 0),
      recent_refunds: recentRefunds.length,
      lifetime_count: sales.length,
      lifetime_gross_cents: sales.reduce((sum, s) => sum + (s.price || 0), 0),
      lifetime_refunds: allRefunds.length,
    };
  }

  if (!productsData.success) {
    out.products_error = JSON.stringify(productsData);
  } else {
    out.products = (productsData.products || []).map(p => ({
      permalink: p.custom_permalink || p.id,
      short_url: p.short_url,
      name: p.name,
      published: p.published,
    }));
  }

  console.log(JSON.stringify(out, null, 2));
}

main().catch(e => console.log(JSON.stringify({ error: 'FETCH_ERROR', message: e.message })));
