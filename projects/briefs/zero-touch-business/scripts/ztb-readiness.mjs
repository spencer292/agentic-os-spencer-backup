// ztb-readiness.mjs — shared Phase-0 readiness probe for the Route Ready automation.
// Prints JSON: which launch dependencies are live vs pending. Safe to run anytime.
// Usage: node projects/briefs/zero-touch-business/scripts/ztb-readiness.mjs
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
const cfgPath = resolve(projRoot, 'site', 'config.json');
const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));

const status = {
  checked_at: new Date().toISOString(),
  gumroad_token: Boolean(env.GUMROAD_ACCESS_TOKEN),
  gumroad_product_url: cfg.tokens.GUMROAD_CLEANING_KIT_URL !== 'PENDING_GUMROAD_SETUP',
  lead_magnet_endpoint: cfg.tokens.LEAD_MAGNET_URL !== 'PENDING_EMAIL_SETUP',
  site_deploy_hook: Boolean(env.CLOUDFLARE_API_TOKEN && env.CLOUDFLARE_ACCOUNT_ID),
  ads_account: Boolean(env.ROUTE_READY_ADS_CUSTOMER_ID),
  ga_or_gsc: Boolean(env.ROUTE_READY_GSC_SITE_URL),
};
status.launch_ready = status.gumroad_product_url && status.site_deploy_hook;
status.pending = Object.entries(status)
  .filter(([k, v]) => v === false && k !== 'launch_ready')
  .map(([k]) => k);

console.log(JSON.stringify(status, null, 2));
