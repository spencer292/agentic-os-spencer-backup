/**
 * Shared connection details for the SYPerformance build store, plus the one thing
 * every Phase 8 script needs: an authenticated cookie jar for a password-protected
 * development store previewing the build theme.
 *
 * The storefront password is read from `.env` at the repo root as
 * SHOPIFY_BUILD_STORE_PASSWORD — it is a credential, and credentials do not go in
 * tracked files (AGENTS.md, Memory System). The store handle and theme id are not
 * secret and stay here.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = join(here, '..');
const envPath = join(here, '..', '..', '..', '..', '.env');

function env() {
  let raw;
  try {
    raw = readFileSync(envPath, 'utf8');
  } catch {
    throw new Error(`No .env at ${envPath} — see scripts/check-token.mjs`);
  }
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

export const STORE = 'syperformance-build.myshopify.com';
// The build theme. Overridable with SYP_THEME_ID so a candidate theme can be
// verified before it is published, without editing this file.
export const THEME_ID = process.env.SYP_THEME_ID || '157001318557';
export const BASE = `https://${STORE}`;

export function storefrontPassword() {
  const value = process.env.SHOPIFY_BUILD_STORE_PASSWORD || env().SHOPIFY_BUILD_STORE_PASSWORD;
  if (!value) {
    throw new Error(
      'SHOPIFY_BUILD_STORE_PASSWORD is not set.\n' +
      `  Add it to ${envPath} — it is the storefront password for ${STORE},\n` +
      '  the one you type on the "Enter using password" screen.'
    );
  }
  return value;
}

/**
 * Unlocks the storefront, pins the preview theme, and returns the resulting
 * cookies both as a header string and as CDP Network.setCookie records.
 * Throws if the preview theme did not stick, so a run can never silently
 * measure the published theme instead of the build.
 */
export async function authenticate() {
  const jar = {};
  const setJar = (res) => {
    for (const c of (res.headers.getSetCookie?.() ?? [])) {
      const [kv] = c.split(';');
      const i = kv.indexOf('=');
      jar[kv.slice(0, i)] = kv.slice(i + 1);
    }
  };
  const header = () => Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ');

  setJar(await fetch(`${BASE}/password`, { redirect: 'manual' }));
  setJar(await fetch(`${BASE}/password`, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'content-type': 'application/x-www-form-urlencoded', cookie: header() },
    body: `form_type=storefront_password&utf8=%E2%9C%93&password=${encodeURIComponent(storefrontPassword())}`
  }));
  setJar(await fetch(`${BASE}/?preview_theme_id=${THEME_ID}`, { redirect: 'manual', headers: { cookie: header() } }));

  const probe = await fetch(`${BASE}/`, { headers: { cookie: header() } });
  const html = await probe.text();
  const theme = (html.match(/Shopify\.theme = (\{.*?\})/) || [])[1];
  if (!theme) throw new Error('Could not read Shopify.theme — is the storefront password correct?');
  if (!theme.includes(THEME_ID)) throw new Error(`Preview theme not pinned — got ${theme}`);

  return {
    cookieHeader: header(),
    cdpCookies: Object.entries(jar).map(([name, value]) => ({ name, value, domain: STORE, path: '/' }))
  };
}

/**
 * Unlocks the storefront but deliberately does NOT pin the preview theme, so the
 * caller sees whatever theme is published. Used to reproduce what someone gets
 * when the preview cookie is missing or has been cleared by "Exit preview".
 */
export async function authenticateNoPreview() {
  const jar = {};
  const setJar = (res) => {
    for (const c of (res.headers.getSetCookie?.() ?? [])) {
      const [kv] = c.split(';');
      const i = kv.indexOf('=');
      jar[kv.slice(0, i)] = kv.slice(i + 1);
    }
  };
  const header = () => Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ');

  setJar(await fetch(`${BASE}/password`, { redirect: 'manual' }));
  setJar(await fetch(`${BASE}/password`, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'content-type': 'application/x-www-form-urlencoded', cookie: header() },
    body: `form_type=storefront_password&utf8=%E2%9C%93&password=${encodeURIComponent(storefrontPassword())}`
  }));

  const probe = await fetch(`${BASE}/`, { headers: { cookie: header() } });
  const theme = ((await probe.text()).match(/Shopify\.theme = (\{.*?\})/) || [])[1];
  console.error('serving theme:', theme);

  return {
    cookieHeader: header(),
    cdpCookies: Object.entries(jar).map(([name, value]) => ({ name, value, domain: STORE, path: '/' }))
  };
}
