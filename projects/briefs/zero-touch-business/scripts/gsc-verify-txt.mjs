// gsc-verify-txt.mjs — add the Google Search Console domain-verification TXT
// record to the routereadykits.com Cloudflare zone. Idempotent: re-running when
// the record exists is a no-op. Same env-loading pattern as ztb-readiness.mjs.
// Usage: node projects/briefs/zero-touch-business/scripts/gsc-verify-txt.mjs
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
const token = env.CLOUDFLARE_API_TOKEN;
const zone = env.CLOUDFLARE_ZONE_ID;
if (!token || !zone) {
  console.error('Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ZONE_ID in .env');
  process.exit(1);
}

const VALUE = 'google-site-verification=14ciDnWogjp1tLnmERt9q9ngdZ_LWjxnIAaHzlFspnc';

const api = (path, opts = {}) =>
  fetch(`https://api.cloudflare.com/client/v4/zones/${zone}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  }).then(r => r.json());

const existing = await api('/dns_records?type=TXT&name=routereadykits.com');
if (!existing.success) {
  console.error('List failed:', JSON.stringify(existing.errors));
  process.exit(1);
}

const hit = existing.result.find(r => r.content.replace(/"/g, '') === VALUE);
if (hit) {
  console.log('TXT record already present:', hit.id);
  process.exit(0);
}

const res = await api('/dns_records', {
  method: 'POST',
  body: JSON.stringify({ type: 'TXT', name: '@', content: VALUE, ttl: 300, comment: 'GSC domain verification' }),
});
if (!res.success) {
  console.error('Create failed:', JSON.stringify(res.errors));
  process.exit(1);
}
console.log('TXT record created:', res.result.id, res.result.name);
