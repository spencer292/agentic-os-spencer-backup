#!/usr/bin/env node
// OpenAI (ChatGPT) Ads — Advertiser API client. SDK-free.
// Reads OPENAI_ADS_API_KEY from the nearest .env. The key is never printed.
//
// Usage (run from the Got Moles folder):
//   node .claude/skills/tool-openai-ads/scripts/openai-ads.mjs test
//   node .claude/skills/tool-openai-ads/scripts/openai-ads.mjs list campaigns|ad_groups|ads [query]
//   node .claude/skills/tool-openai-ads/scripts/openai-ads.mjs get /v1/campaigns/cmpn_123
//   node .claude/skills/tool-openai-ads/scripts/openai-ads.mjs post /v1/campaigns '<json>'|@file.json [--apply]
//   node .claude/skills/tool-openai-ads/scripts/openai-ads.mjs pause|activate|archive campaigns|ad_groups|ads <id> [--apply]
//
// Every POST is a dry run unless --apply is passed: it prints exactly what would be sent.
// The SKILL requires the user's explicit go-ahead before any --apply (this account spends real money).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const BASE = 'https://api.ads.openai.com';

function findEnvPath() {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const p = path.join(dir, '.env');
    if (fs.existsSync(p)) return p;
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return null;
}
function loadEnv() {
  const env = {};
  const p = findEnvPath();
  if (!p) return env;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

const KEY = loadEnv().OPENAI_ADS_API_KEY;
if (!KEY) {
  console.error('Missing OPENAI_ADS_API_KEY in .env. Create it in Ads Manager > Settings (https://ads.openai.com/settings) and paste it into .env as OPENAI_ADS_API_KEY=...');
  process.exit(1);
}

async function call(method, p, body) {
  const headers = { Authorization: `Bearer ${KEY}`, Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (method === 'POST' && body !== undefined) headers['Idempotency-Key'] = crypto.randomUUID();
  const res = await fetch(BASE + p, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) {
    console.error(`HTTP ${res.status} ${method} ${p}`);
    console.error(typeof data === 'string' ? data.slice(0, 2000) : JSON.stringify(data, null, 2));
    process.exit(2);
  }
  return data;
}

const readBody = (arg) => {
  if (!arg) return undefined;
  const raw = arg.startsWith('@') ? fs.readFileSync(arg.slice(1), 'utf8') : arg;
  return JSON.parse(raw);
};

const [cmd, a1, a2, ...rest] = process.argv.slice(2);
const apply = process.argv.includes('--apply');
const RESOURCES = ['campaigns', 'ad_groups', 'ads'];

switch (cmd) {
  case 'test': {
    const acct = await call('GET', '/v1/ad_account');
    const pick = (o, ks) => Object.fromEntries(ks.filter((k) => o && o[k] !== undefined).map((k) => [k, o[k]]));
    console.log('Connected. Ad account:');
    console.log(JSON.stringify(pick(acct, ['id', 'name', 'status', 'currency', 'timezone', 'review', 'reviews']), null, 2));
    break;
  }
  case 'list': {
    if (!RESOURCES.includes(a1)) { console.error(`list needs one of: ${RESOURCES.join(', ')}`); process.exit(1); }
    const q = a2 && !a2.startsWith('--') ? `?${a2}` : '';
    console.log(JSON.stringify(await call('GET', `/v1/${a1}${q}`), null, 2));
    break;
  }
  case 'get': {
    if (!a1?.startsWith('/')) { console.error('get needs a path, e.g. /v1/campaigns'); process.exit(1); }
    console.log(JSON.stringify(await call('GET', a1), null, 2));
    break;
  }
  case 'post': {
    if (!a1?.startsWith('/')) { console.error('post needs a path and a JSON body'); process.exit(1); }
    const body = readBody(a2);
    if (!apply) {
      console.log(`DRY RUN (add --apply to send): POST ${a1}`);
      console.log(JSON.stringify(body, null, 2));
      break;
    }
    console.log(JSON.stringify(await call('POST', a1, body), null, 2));
    break;
  }
  case 'pause':
  case 'activate':
  case 'archive': {
    if (!RESOURCES.includes(a1) || !a2) { console.error(`${cmd} needs a resource (${RESOURCES.join('|')}) and an id`); process.exit(1); }
    const p = `/v1/${a1}/${a2}/${cmd}`;
    if (!apply) { console.log(`DRY RUN (add --apply to send): POST ${p}`); break; }
    console.log(JSON.stringify(await call('POST', p, {}), null, 2));
    break;
  }
  default:
    console.log('Commands: test | list <campaigns|ad_groups|ads> [query] | get <path> | post <path> <json|@file> [--apply] | pause|activate|archive <resource> <id> [--apply]');
}
