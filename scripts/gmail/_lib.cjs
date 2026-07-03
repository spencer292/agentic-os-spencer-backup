// Shared Gmail helpers for the daily-triage scripts.
// Pattern: read .env -> refresh token -> access token -> raw fetch to Gmail REST.
// No SDK, no secrets ever printed. Required by gmail-fetch / gmail-label / gmail-draft.
const fs = require("fs");
const path = require("path");

const ENV_PATH = path.join(__dirname, "..", "..", ".env");
const API = "https://gmail.googleapis.com/gmail/v1/users/me";

function readEnv() {
  const out = {};
  try {
    for (const line of fs.readFileSync(ENV_PATH, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
  return out;
}

function requireKeys(env, keys) {
  for (const k of keys) {
    if (!env[k]) { console.error(`✗ Missing ${k} in .env`); process.exit(1); }
  }
}

// refresh-token -> short-lived access token
async function getAccessToken() {
  const e = readEnv();
  requireKeys(e, ["GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN"]);
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: e.GMAIL_CLIENT_ID, client_secret: e.GMAIL_CLIENT_SECRET,
      refresh_token: e.GMAIL_REFRESH_TOKEN, grant_type: "refresh_token",
    }),
  });
  const t = await r.json();
  if (!t.access_token) { console.error("✗ Token refresh failed:", JSON.stringify(t)); process.exit(1); }
  return t.access_token;
}

// Thin wrapper around the Gmail REST API. Throws on non-2xx with the body for context.
async function gapi(token, pathOrUrl, opts = {}) {
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : API + pathOrUrl;
  const res = await fetch(url, {
    ...opts,
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let body; try { body = text ? JSON.parse(text) : {}; } catch { body = text; }
  if (!res.ok) {
    const msg = body && body.error ? JSON.stringify(body.error) : String(body).slice(0, 300);
    throw new Error(`Gmail ${res.status} on ${url.replace(API, "")}: ${msg}`);
  }
  return body;
}

function b64url(input) {
  return Buffer.from(input, "utf8").toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Returns { name -> id } for every label on the account.
async function getLabelMap(token) {
  const r = await gapi(token, "/labels");
  const map = {};
  for (const l of r.labels || []) map[l.name] = l.id;
  return map;
}

// Idempotently ensure a label exists; returns its id. Caches via the passed map.
async function ensureLabel(token, name, map) {
  if (map && map[name]) return map[name];
  try {
    const created = await gapi(token, "/labels", {
      method: "POST",
      body: JSON.stringify({
        name,
        labelListVisibility: "labelShow",
        messageListVisibility: "show",
      }),
    });
    if (map) map[name] = created.id;
    return created.id;
  } catch (e) {
    // Race / already-exists: re-read and return the existing id.
    const fresh = await getLabelMap(token);
    if (fresh[name]) { if (map) map[name] = fresh[name]; return fresh[name]; }
    throw e;
  }
}

// The triage taxonomy, in one place so every script agrees.
const TRIAGE_LABELS = ["Triage/Junk", "Triage/Needs-You", "Triage/Drafted", "Triage/FYI"];

module.exports = {
  ENV_PATH, readEnv, requireKeys, getAccessToken, gapi, b64url,
  getLabelMap, ensureLabel, TRIAGE_LABELS,
};
