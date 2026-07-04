#!/usr/bin/env node
// Jobber GraphQL API client with OAuth2 (authorization code + refresh).
// Reads JOBBER_CLIENT_ID / JOBBER_CLIENT_SECRET / JOBBER_REFRESH_TOKEN from the nearest .env.
// `auth` runs the one-time browser flow (localhost callback) and persists the refresh token.
// Every other command refreshes the access token first, then calls the API.
// Mutations: this script runs whatever query it is given — the SKILL enforces confirm-before-mutate.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';

const AUTH_URL = 'https://api.getjobber.com/api/oauth/authorize';
const TOKEN_URL = 'https://api.getjobber.com/api/oauth/token';
const GQL_URL = 'https://api.getjobber.com/api/graphql';
const CB_PORT = 8734;
const CB_PATH = '/callback';

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
const ENV_PATH = findEnvPath();
function loadEnv() {
  const env = {};
  if (!ENV_PATH) return env;
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}
function saveEnvKey(key, value) {
  if (!ENV_PATH) return console.error(`No .env found — add ${key}=${value} manually.`);
  let text = fs.readFileSync(ENV_PATH, 'utf8');
  if (new RegExp(`^${key}=`, 'm').test(text)) {
    text = text.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${value}`);
  } else {
    text += `${text.endsWith('\n') ? '' : '\n'}${key}=${value}\n`;
  }
  fs.writeFileSync(ENV_PATH, text);
}

const env = loadEnv();
const ID = env.JOBBER_CLIENT_ID, SECRET = env.JOBBER_CLIENT_SECRET;
if (!ID || !SECRET) {
  console.error('Missing JOBBER_CLIENT_ID / JOBBER_CLIENT_SECRET in .env (create the app at https://developer.getjobber.com/apps).');
  process.exit(1);
}

async function tokenRequest(params) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: ID, client_secret: SECRET, ...params }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { console.error(`Token request failed (HTTP ${res.status}):`, JSON.stringify(data)); process.exit(1); }
  return data;
}

async function getAccessToken() {
  const rt = loadEnv().JOBBER_REFRESH_TOKEN;
  if (!rt) { console.error('No JOBBER_REFRESH_TOKEN in .env — run: jobber-api.mjs auth'); process.exit(1); }
  const d = await tokenRequest({ grant_type: 'refresh_token', refresh_token: rt });
  if (d.refresh_token && d.refresh_token !== rt) saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token); // rotation
  return d.access_token;
}

async function gql(query, variables) {
  const token = await getAccessToken();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const ver = loadEnv().JOBBER_GRAPHQL_VERSION;
  if (ver) headers['X-JOBBER-GRAPHQL-VERSION'] = ver;
  const res = await fetch(GQL_URL, { method: 'POST', headers, body: JSON.stringify({ query, variables }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { console.error(`HTTP ${res.status}:`, JSON.stringify(data, null, 2)); process.exit(1); }
  if (data.errors) { console.error('GraphQL errors:', JSON.stringify(data.errors, null, 2)); process.exit(1); }
  return data.data;
}

const [cmd, arg] = process.argv.slice(2);
const out = (o) => console.log(JSON.stringify(o, null, 2));

switch (cmd) {
  case 'auth': {
    const state = crypto.randomBytes(12).toString('hex');
    const redirect = `http://localhost:${CB_PORT}${CB_PATH}`;
    const url = `${AUTH_URL}?client_id=${encodeURIComponent(ID)}&redirect_uri=${encodeURIComponent(redirect)}&state=${state}`;
    console.log('\n1. Make sure the app\'s callback URL in the Developer Center is:', redirect);
    console.log('2. Open this URL in a browser signed into the COMPANY Jobber account:\n');
    console.log(url + '\n');
    console.log('Waiting for the callback...');
    const code = await new Promise((resolve) => {
      const srv = http.createServer((req, res) => {
        const u = new URL(req.url, `http://localhost:${CB_PORT}`);
        if (u.pathname !== CB_PATH) { res.writeHead(404).end(); return; }
        if (u.searchParams.get('state') !== state) { res.writeHead(400).end('State mismatch — rerun auth.'); return; }
        res.writeHead(200, { 'Content-Type': 'text/html' }).end('<h2>Connected. You can close this tab.</h2>');
        srv.close();
        resolve(u.searchParams.get('code'));
      });
      srv.listen(CB_PORT);
    });
    const d = await tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: redirect });
    saveEnvKey('JOBBER_REFRESH_TOKEN', d.refresh_token);
    console.log('\nRefresh token saved to .env. Test with: jobber-api.mjs test');
    break;
  }
  case 'test': {
    const d = await gql('query { account { id name } }');
    console.log(`Connected to Jobber account: ${d.account?.name} (${d.account?.id})`);
    break;
  }
  case 'query': {
    const q = fs.existsSync(arg) ? fs.readFileSync(arg, 'utf8') : arg;
    out(await gql(q));
    break;
  }
  case 'clients': {
    const n = Math.min(parseInt(arg || '10', 10), 50);
    const d = await gql(
      'query($n:Int){ clients(first:$n){ nodes{ id name } pageInfo{ hasNextPage endCursor } } }', { n });
    out(d.clients);
    break;
  }
  case 'jobs': {
    const n = Math.min(parseInt(arg || '10', 10), 50);
    const d = await gql(
      'query($n:Int){ jobs(first:$n){ nodes{ id title jobStatus } pageInfo{ hasNextPage endCursor } } }', { n });
    out(d.jobs);
    break;
  }
  default:
    console.log('Usage: jobber-api.mjs auth|test|query <file-or-inline-gql>|clients [n]|jobs [n]');
}
