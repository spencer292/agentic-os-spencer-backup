#!/usr/bin/env node
/**
 * YouTube OAuth write client — consent + token exchange (--authorize) and a
 * credential smoke check (--check, the default).
 *
 * Zero-dependency CommonJS: Node built-ins (fs, path, http, crypto) and
 * global fetch only. No googleapis SDK, no dotenv.
 *
 * Scope requested: exactly one — see the SCOPE constant below. No broader
 * YouTube scope is ever requested. Never console.log a full client secret,
 * refresh token or access token — at most the last four characters.
 *
 * This script never writes .env itself. --authorize prints the target
 * variable name and the exact line to paste, with the value elided, so
 * saving the secret into .env stays a deliberate human action.
 *
 * Exports getAccessToken(channel) so youtube-write.cjs refreshes through
 * this one code path instead of duplicating the exchange.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');

const REDIRECT_URI = 'http://localhost:8765';
const SCOPE = 'https://www.googleapis.com/auth/youtube.force-ssl';
const LOOPBACK_PORT = 8765;
const CALLBACK_TIMEOUT_MS = 5 * 60 * 1000;

// --- .env resolution: walk up from __dirname to the first directory that
// has a .env, or the first that has package.json (treated as repo root),
// never a hardcoded parent-segment count.
function findEnvPath() {
  let dir = __dirname;
  for (let i = 0; i < 20; i++) {
    const envCandidate = path.join(dir, '.env');
    if (fs.existsSync(envCandidate)) return envCandidate;
    if (fs.existsSync(path.join(dir, 'package.json'))) return envCandidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

// Prefers process.env, falls back to the repo-root .env. Returns "" when
// absent, never throws, never prints the resolved value.
function envVar(name) {
  try {
    if (process.env[name]) return process.env[name].trim();
    const envPath = findEnvPath();
    if (envPath && fs.existsSync(envPath)) {
      const re = new RegExp(`^\\s*${name}\\s*=\\s*(.*)\\s*$`);
      for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
        const m = line.match(re);
        if (m) return m[1].replace(/^["']|["']$/g, '').trim();
      }
    }
  } catch {
    // never throw — callers get "" on any read failure
  }
  return '';
}

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')
    ? process.argv[i + 1]
    : def;
}
const flag = (n) => process.argv.includes(`--${n}`);

function refreshTokenVarName(channel) {
  if (channel === 'breathwork') return 'YOUTUBE_OAUTH_REFRESH_TOKEN_BREATHWORK';
  if (channel === 'main') return 'YOUTUBE_OAUTH_REFRESH_TOKEN_MAIN';
  return null;
}

function last4(v) {
  if (!v) return '(absent)';
  return v.length <= 4 ? `…${v}` : `…${v.slice(-4)}`;
}

/**
 * Exchanges the channel's stored refresh token for a fresh access token.
 * Stateless — no caching layer, matches got-moles-notion-sync.mjs's pattern.
 * Returns { ok: true, accessToken, scope } or { ok: false, missing? , error? }.
 */
async function getAccessToken(channel) {
  const clientId = envVar('YOUTUBE_OAUTH_CLIENT_ID');
  const clientSecret = envVar('YOUTUBE_OAUTH_CLIENT_SECRET');
  const refreshVarName = refreshTokenVarName(channel);
  const refreshToken = refreshVarName ? envVar(refreshVarName) : '';

  const missing = [];
  if (!clientId) missing.push('YOUTUBE_OAUTH_CLIENT_ID');
  if (!clientSecret) missing.push('YOUTUBE_OAUTH_CLIENT_SECRET');
  if (!refreshVarName) {
    missing.push(`unknown --channel "${channel}" (accepted: breathwork, main)`);
  } else if (!refreshToken) {
    missing.push(refreshVarName);
  }
  if (missing.length) return { ok: false, missing };

  let res;
  try {
    res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
  } catch (e) {
    return { ok: false, error: `network error: ${e.message}` };
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    return {
      ok: false,
      error: json.error_description || json.error || `HTTP ${res.status}`,
      status: res.status,
    };
  }
  return { ok: true, accessToken: json.access_token, scope: json.scope || '' };
}

async function authorize(channel) {
  const refreshVarName = refreshTokenVarName(channel);
  if (!refreshVarName) {
    console.error(`Unknown --channel "${channel}". Accepted values: breathwork, main.`);
    process.exitCode = 1;
    return;
  }
  const clientId = envVar('YOUTUBE_OAUTH_CLIENT_ID');
  if (!clientId) {
    console.log('MISSING: YOUTUBE_OAUTH_CLIENT_ID');
    process.exitCode = 1;
    return;
  }
  const clientSecret = envVar('YOUTUBE_OAUTH_CLIENT_SECRET');
  if (!clientSecret) {
    console.log('MISSING: YOUTUBE_OAUTH_CLIENT_SECRET');
    process.exitCode = 1;
    return;
  }

  const state = crypto.randomBytes(16).toString('hex');

  // PKCE (RFC 7636). The client secret sits in the environment, so without a
  // verifier an intercepted loopback code is directly exchangeable. S256 is
  // the only challenge method worth using.
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })}`;

  console.log(`Open this URL and consent as the ${channel} channel's owning Google account:`);
  console.log(authUrl);
  console.log(`Waiting for the callback on ${REDIRECT_URI} ...`);

  const callbackResult = await new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { server.close(); } catch { /* already closing */ }
      resolve(value);
    };

    const server = http.createServer((req, res) => {
      const url = new URL(req.url, REDIRECT_URI);

      // Ignore anything that is not the callback path. A browser favicon
      // fetch or a local port scanner used to hit the no-code branch below,
      // which resolved the promise and closed the server — aborting a
      // legitimate in-flight authorization.
      if (url.pathname !== '/') {
        res.statusCode = 404;
        res.end();
        return;
      }

      const returnedState = url.searchParams.get('state');
      const err = url.searchParams.get('error');
      const code = url.searchParams.get('code');

      if (err) {
        res.end('Authorization failed — you can close this tab.');
        finish({ ok: false, error: err });
        return;
      }
      if (returnedState !== state) {
        res.end('State mismatch — rejected. You can close this tab.');
        finish({ ok: false, error: 'state parameter mismatch — rejected callback' });
        return;
      }
      if (!code) {
        res.end('No authorization code received — you can close this tab.');
        finish({ ok: false, error: 'no code in callback' });
        return;
      }
      res.end('Authorized — you can close this tab.');
      finish({ ok: true, code });
    });

    // Without an 'error' listener an EADDRINUSE on port 8765 throws as an
    // uncaught exception and this promise never settles.
    server.on('error', (e) => finish({ ok: false, error: `callback server: ${e.message}` }));

    // Never hang forever waiting for a consent that may never come — the
    // project's cron discipline is that nothing ends on a question.
    const timer = setTimeout(() => {
      finish({ ok: false, error: 'timed out waiting for the OAuth callback' });
    }, CALLBACK_TIMEOUT_MS);
    timer.unref();

    // RFC 8252 calls for the loopback interface. Omitting the host bound
    // 0.0.0.0, so any host on the LAN could reach the callback endpoint.
    server.listen(LOOPBACK_PORT, '127.0.0.1');
  });

  if (!callbackResult.ok) {
    console.error(`Authorization failed: ${callbackResult.error}`);
    process.exitCode = 1;
    return;
  }

  let tokenRes;
  try {
    tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: callbackResult.code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier,
      }),
    });
  } catch (e) {
    console.error(`Token exchange network error: ${e.message}`);
    process.exitCode = 1;
    return;
  }
  const tokenJson = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !tokenJson.refresh_token) {
    console.error(
      `Token exchange failed: ${tokenJson.error_description || tokenJson.error || `HTTP ${tokenRes.status}`}`
    );
    if (tokenRes.ok && !tokenJson.refresh_token) {
      console.error(
        'No refresh_token in the response. This happens when Google has already issued one ' +
          'for this client and account and access_type=offline + prompt=consent did not force a ' +
          'fresh grant. Revoke the app at https://myaccount.google.com/permissions and try again.'
      );
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Refresh token obtained for ${channel} (${last4(tokenJson.refresh_token)}).`);
  console.log('This script does not write .env for you — add this line yourself:');
  console.log(`${refreshVarName}=<paste the value Google returned — never printed here>`);
}

async function check(channel) {
  const clientId = envVar('YOUTUBE_OAUTH_CLIENT_ID');
  const clientSecret = envVar('YOUTUBE_OAUTH_CLIENT_SECRET');
  const refreshVarName = refreshTokenVarName(channel);

  if (!refreshVarName) {
    console.error(`Unknown --channel "${channel}". Accepted values: breathwork, main.`);
    process.exitCode = 1;
    return;
  }
  const refreshToken = envVar(refreshVarName);

  const missing = [];
  if (!clientId) missing.push('YOUTUBE_OAUTH_CLIENT_ID');
  if (!clientSecret) missing.push('YOUTUBE_OAUTH_CLIENT_SECRET');
  if (!refreshToken) missing.push(refreshVarName);
  if (missing.length) {
    for (const m of missing) console.log(`MISSING: ${m}`);
    process.exitCode = 1;
    return;
  }

  const result = await getAccessToken(channel);
  if (!result.ok) {
    console.error(`Token refresh failed: ${result.error || (result.missing || []).join(', ')}`);
    process.exitCode = 1;
    return;
  }
  console.log(`token ok for ${channel} (${last4(result.accessToken)})`);
  console.log(`scope: ${result.scope}`);
  if (result.scope !== SCOPE) {
    console.error(`SCOPE MISMATCH: expected exactly "${SCOPE}", got "${result.scope}"`);
    process.exitCode = 1;
  }
}

async function main() {
  const channel = arg('channel', '');
  if (flag('authorize')) {
    await authorize(channel);
  } else {
    // --check is the default when no mode flag is given.
    await check(channel);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`Unexpected error: ${err && err.message ? err.message : err}`);
    process.exitCode = 1;
  });
}

module.exports = { getAccessToken, envVar };
