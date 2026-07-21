// cf-deploy.mjs — deploy the built Route Ready site (site/dist) to Cloudflare as a Worker
// with all static files embedded. One API call, no wrangler, no git. Used by the content cron.
//
// Usage: node projects/briefs/zero-touch-business/scripts/cf-deploy.mjs
// Requires in repo-root .env: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
// Optional: CLOUDFLARE_ZONE_ID (enables custom-domain attach once NS are active)
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { resolve, join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..', '..');
const distDir = resolve(here, '..', 'site', 'dist');
const WORKER_NAME = 'route-ready-site';

function env(key) {
  const envPath = resolve(repoRoot, ['.', 'env'].join(''));
  if (!existsSync(envPath)) return undefined;
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(new RegExp('^' + key + '=(.*)$'));
    if (m) return m[1];
  }
}
const TOKEN = env('CLOUDFLARE_API_TOKEN');
const ACCT = env('CLOUDFLARE_ACCOUNT_ID');
if (!TOKEN || !ACCT) { console.log('PENDING: Cloudflare creds missing in .env'); process.exit(0); }
if (!existsSync(distDir)) { console.error('FAIL: site/dist not built. Run node site/build.mjs first.'); process.exit(1); }

// Collect dist files
const MIME = { html: 'text/html;charset=utf-8', css: 'text/css', xml: 'application/xml', txt: 'text/plain', js: 'text/javascript', png: 'image/png', jpg: 'image/jpeg', svg: 'image/svg+xml', ico: 'image/x-icon', webmanifest: 'application/manifest+json' };
const files = {};
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    const rel = '/' + relative(distDir, p).replace(/\\/g, '/');
    const ext = name.split('.').pop().toLowerCase();
    files[rel] = { b64: readFileSync(p).toString('base64'), type: MIME[ext] || 'application/octet-stream' };
  }
})(distDir);
const totalKB = Math.round(Object.values(files).reduce((s, f) => s + f.b64.length, 0) * 0.75 / 1024);
console.log(`Embedding ${Object.keys(files).length} files (~${totalKB} KB)`);
if (totalKB > 900) { console.error('FAIL: bundle exceeding Worker free-plan 1MB limit — move to Pages direct upload.'); process.exit(1); }

// Outbound redirects served by the Worker; each hit is counted in KV (daily buckets)
// so the weekly digest can report clicks. /book -> Amazon listing for The Route.
const REDIRECTS = {
  '/book': 'https://www.amazon.com/dp/B0H6ZX85DK',
};

// Ensure the metrics KV namespace exists (idempotent) and get its id
const KV_TITLE = 'route-ready-metrics';
let kvId;
{
  const list = await (await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCT}/storage/kv/namespaces?per_page=100`, {
    headers: { Authorization: 'Bearer ' + TOKEN },
  })).json();
  kvId = list.success ? (list.result.find((n) => n.title === KV_TITLE) || {}).id : undefined;
  if (!kvId) {
    const made = await (await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCT}/storage/kv/namespaces`, {
      method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: KV_TITLE }),
    })).json();
    if (made.success) kvId = made.result.id;
    else console.log('KV namespace create failed (deploying without click tracking): ' + JSON.stringify(made.errors).slice(0, 200));
  }
  if (kvId) console.log(`KV metrics namespace: ${kvId}`);
}

const worker = `const FILES = ${JSON.stringify(files)};
const REDIRECTS = ${JSON.stringify(REDIRECTS)};
function b64ToBytes(b64) { const bin = atob(b64); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; }
async function bump(kv, path) {
  try {
    const key = 'clicks:' + path + ':' + new Date().toISOString().slice(0, 10);
    const cur = parseInt(await kv.get(key), 10) || 0;
    await kv.put(key, String(cur + 1), { expirationTtl: 60 * 60 * 24 * 400 });
  } catch (e) {}
}
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const rTarget = REDIRECTS[url.pathname.replace(/\\/+$/, '') || '/'];
    if (rTarget) {
      if (env && env.METRICS && ctx) ctx.waitUntil(bump(env.METRICS, url.pathname.replace(/\\/+$/, '')));
      return Response.redirect(rTarget, 302);
    }
    let p = url.pathname;
    if (p.endsWith('/')) p += 'index.html';
    let f = FILES[p] || FILES[p + '/index.html'] || FILES[p + '.html'];
    if (!f && !p.includes('.')) f = FILES[p + '/index.html'];
    if (!f) { const nf = FILES['/404.html']; return new Response(nf ? b64ToBytes(nf.b64) : 'Not found', { status: 404, headers: { 'content-type': 'text/html' } }); }
    const redirect = (p !== url.pathname && p.endsWith('index.html') && !url.pathname.endsWith('/')) ? url.pathname + '/' : null;
    if (redirect) return Response.redirect(url.origin + redirect, 301);
    return new Response(b64ToBytes(f.b64), { headers: { 'content-type': f.type, 'cache-control': p.match(/\\.(css|png|jpg|svg)$/) ? 'public, max-age=86400' : 'public, max-age=300' } });
  }
};`;

const metadata = { main_module: 'worker.js', compatibility_date: '2026-01-01' };
if (kvId) metadata.bindings = [{ type: 'kv_namespace', name: 'METRICS', namespace_id: kvId }];
const form = new FormData();
form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
form.append('worker.js', new Blob([worker], { type: 'application/javascript+module' }), 'worker.js');

const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCT}/workers/scripts/${WORKER_NAME}`, {
  method: 'PUT', headers: { Authorization: 'Bearer ' + TOKEN }, body: form,
});
const j = await res.json();
if (!j.success) { console.error('DEPLOY FAILED: ' + JSON.stringify(j.errors).slice(0, 300)); process.exit(1); }
console.log('Worker deployed: ' + WORKER_NAME);

// Ensure workers.dev preview is enabled
const sub = await (await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCT}/workers/scripts/${WORKER_NAME}/subdomain`, {
  method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: true }),
})).json();
const subName = await (await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCT}/workers/subdomain`, { headers: { Authorization: 'Bearer ' + TOKEN } })).json();
if (subName.success) console.log(`Preview: https://${WORKER_NAME}.${subName.result.subdomain}.workers.dev`);

// Attach custom domains if the zone is active
const ZONE = env('CLOUDFLARE_ZONE_ID');
if (ZONE) {
  const zi = await (await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE}`, { headers: { Authorization: 'Bearer ' + TOKEN } })).json();
  if (zi.success && zi.result.status === 'active') {
    for (const host of ['routereadykits.com', 'www.routereadykits.com']) {
      const d = await (await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCT}/workers/domains`, {
        method: 'PUT', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment: 'production', hostname: host, service: WORKER_NAME, zone_id: ZONE }),
      })).json();
      console.log(`domain ${host}: ${d.success ? 'attached' : JSON.stringify(d.errors).slice(0, 120)}`);
    }
  } else {
    console.log(`zone status: ${zi.result?.status || 'unknown'} — custom domain attach deferred until nameservers point to Cloudflare.`);
  }
}
