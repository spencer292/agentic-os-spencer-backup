#!/usr/bin/env node
// Read-only connection test: refresh-token -> access-token -> users.me.profile.
// Prints email + counts only (no secrets). Run: node scripts/gmail/gmail-check.cjs
const fs = require("fs");
const path = require("path");
const ENV = path.join(__dirname, "..", "..", ".env");

function readEnv() {
  const o = {};
  for (const l of fs.readFileSync(ENV, "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) o[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return o;
}

(async () => {
  const e = readEnv();
  for (const k of ["GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN"]) {
    if (!e[k]) { console.error(`✗ Missing ${k} in .env`); process.exit(1); }
  }
  const tr = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: e.GMAIL_CLIENT_ID, client_secret: e.GMAIL_CLIENT_SECRET,
      refresh_token: e.GMAIL_REFRESH_TOKEN, grant_type: "refresh_token",
    }),
  });
  const t = await tr.json();
  if (!t.access_token) { console.error("✗ Token refresh failed:", JSON.stringify(t)); process.exit(1); }
  const pr = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
    headers: { Authorization: "Bearer " + t.access_token },
  });
  const p = await pr.json();
  if (!p.emailAddress) { console.error("✗ Profile call failed:", JSON.stringify(p)); process.exit(1); }
  console.log(`✓ Gmail connected: ${p.emailAddress}  |  messages: ${p.messagesTotal}  |  threads: ${p.threadsTotal}`);
})();
