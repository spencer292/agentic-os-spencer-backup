// Temporary read-only Gumroad check for the weekly digest. Safe to delete after use.
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
  console.log(JSON.stringify({ token: false }));
  process.exit(0);
}

const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

async function main() {
  const result = {};

  // Last 7 days sales
  try {
    const r = await fetch(`https://api.gumroad.com/v2/sales?access_token=${token}&after=${sevenDaysAgo}`);
    const data = await r.json();
    if (!data.success) {
      result.sales_7d_error = JSON.stringify(data);
    } else {
      const sales = data.sales || [];
      let gross = 0, refunds = 0;
      sales.forEach(s => { gross += (s.price || 0); if (s.refunded) refunds++; });
      result.sales_7d = { count: sales.length, gross_cents: gross, refunds, has_more_pages: !!data.next_page_url };
    }
  } catch (e) {
    result.sales_7d_error = e.message;
  }

  // Lifetime sales
  try {
    const r = await fetch(`https://api.gumroad.com/v2/sales?access_token=${token}`);
    const data = await r.json();
    if (!data.success) {
      result.sales_lifetime_error = JSON.stringify(data);
    } else {
      const sales = data.sales || [];
      let gross = 0;
      sales.forEach(s => { gross += (s.price || 0); });
      result.sales_lifetime = { count: sales.length, gross_cents: gross, has_more_pages: !!data.next_page_url };
    }
  } catch (e) {
    result.sales_lifetime_error = e.message;
  }

  // Products / publish status
  try {
    const r = await fetch(`https://api.gumroad.com/v2/products?access_token=${token}`);
    const data = await r.json();
    if (!data.success) {
      result.products_error = JSON.stringify(data);
    } else {
      result.products = (data.products || []).map(p => ({
        id: p.id,
        custom_permalink: p.custom_permalink,
        name: p.name,
        published: p.published,
        url: p.short_url || p.url,
      }));
    }
  } catch (e) {
    result.products_error = e.message;
  }

  console.log(JSON.stringify(result, null, 2));
}

main();
