// shared Jobber auth + gql helper (mirrors engine.mjs pattern)
import fs from 'node:fs';
const ENV_PATH = 'C:/Agentic-os-got-moles/.env';
const TOKEN_URL = 'https://api.getjobber.com/api/oauth/token';
const GQL_URL = 'https://api.getjobber.com/api/graphql';
const GQL_VERSION = '2025-04-16';
export const TZ = 'America/Los_Angeles';

function loadEnv() {
  const env = {};
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}
function saveEnvKey(key, value) {
  let txt = fs.readFileSync(ENV_PATH, 'utf8');
  const re = new RegExp(`^${key}=.*$`, 'm');
  txt = re.test(txt) ? txt.replace(re, `${key}=${value}`) : txt + `\n${key}=${value}\n`;
  fs.writeFileSync(ENV_PATH, txt);
}
let accessToken = null, tokenAt = 0;
async function getToken(force = false) {
  if (!force && accessToken && Date.now() - tokenAt < 50 * 60 * 1000) return accessToken;
  const env = loadEnv();
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.JOBBER_CLIENT_ID,
      client_secret: env.JOBBER_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: env.JOBBER_REFRESH_TOKEN,
    }),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) { console.error(`Token refresh failed HTTP ${res.status}`, JSON.stringify(d)); process.exit(1); }
  if (d.refresh_token && d.refresh_token !== env.JOBBER_REFRESH_TOKEN) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
  accessToken = d.access_token; tokenAt = Date.now();
  return accessToken;
}
export let lastCost = null;
export const sleep = ms => new Promise(r => setTimeout(r, ms));
const onlyPermissionHides = errs => errs.every(e => /hidden due to permissions/i.test(e.message || ''));
export async function gql(query, attempt = 0) {
  const token = await getToken();
  const res = await fetch(GQL_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': GQL_VERSION },
    body: JSON.stringify({ query }),
  });
  if (res.status === 401 && attempt < 2) { await getToken(true); return gql(query, attempt + 1); }
  const data = await res.json().catch(() => ({}));
  const throttled = res.status === 429 || (data.errors && JSON.stringify(data.errors).includes('THROTTLED'));
  if (throttled && attempt < 7) { const w = Math.min(60000, 2000 * 2 ** attempt); console.error(`  … throttled, waiting ${w/1000}s`); await sleep(w); return gql(query, attempt + 1); }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(data).slice(0,300)}`);
  if (data.errors && !(data.data && onlyPermissionHides(data.errors))) throw new Error(`GraphQL: ${JSON.stringify(data.errors).slice(0,400)}`);
  // cost-aware pacing: Jobber leaky bucket (max 10000, restore 500/s)
  const c = data.extensions?.cost;
  if (c) {
    lastCost = c;
    const avail = c.throttleStatus?.currentlyAvailable ?? 10000;
    const need = (c.requestedQueryCost || 0) * 1.2 + 500;
    if (avail < need) await sleep(Math.min(20000, Math.ceil(((need - avail) / (c.throttleStatus?.restoreRate || 500)) * 1000)));
  }
  return data.data;
}
export function ptDayBoundsUtc(date) {
  const mk = (yy, mm, dd) => {
    const noonUtc = new Date(Date.UTC(yy, mm - 1, dd, 12));
    const ptHour = +noonUtc.toLocaleString('en-US', { timeZone: TZ, hour: '2-digit', hour12: false });
    return new Date(Date.UTC(yy, mm - 1, dd, 12 - ptHour)).toISOString();
  };
  const [y, m, d] = date.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return { after: mk(y, m, d), before: mk(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate()) };
}
