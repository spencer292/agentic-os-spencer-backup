#!/usr/bin/env node
// One-time Gmail OAuth — gets a refresh token for the daily-triage automation.
// Prereq: GMAIL_CLIENT_ID + GMAIL_CLIENT_SECRET in .env (a "Desktop app" OAuth client).
// Run:    node scripts/gmail/gmail-auth.cjs   → approve in browser → paste the printed line into .env
const fs = require("fs");
const path = require("path");
const http = require("http");

const ENV_PATH = path.join(__dirname, "..", "..", ".env");
const SCOPE = "https://www.googleapis.com/auth/gmail.modify"; // read + label + draft + send; NO hard-delete
const PORT = 8910;
const REDIRECT = `http://localhost:${PORT}`;

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

const env = readEnv();
const CLIENT_ID = env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = env.GMAIL_CLIENT_SECRET;
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("\n✗ Missing GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET in .env.");
  console.error("  Create a 'Desktop app' OAuth client at console.cloud.google.com → Credentials,");
  console.error("  add both keys to .env, then re-run this script.\n");
  process.exit(1);
}

const authUrl = "https://accounts.google.com/o/oauth2/v2/auth?" + new URLSearchParams({
  client_id: CLIENT_ID,
  redirect_uri: REDIRECT,
  response_type: "code",
  scope: SCOPE,
  access_type: "offline",
  prompt: "consent",
}).toString();

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, REDIRECT);
  const code = u.searchParams.get("code");
  if (!code) { res.writeHead(400); res.end("Waiting for Google redirect…"); return; }
  try {
    const r = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT, grant_type: "authorization_code",
      }),
    });
    const tok = await r.json();
    if (!tok.refresh_token) {
      res.writeHead(500); res.end("No refresh_token returned — revoke prior access at myaccount.google.com/permissions and retry.");
      console.error("\n✗ No refresh_token in response:", JSON.stringify(tok, null, 2), "\n");
      server.close(() => process.exit(1));
    }
    // Write the refresh token straight to .env (replace if present, else append) —
    // it never gets printed, so the credential stays off-screen.
    let content = "";
    try { content = fs.readFileSync(ENV_PATH, "utf8"); } catch {}
    const line = `GMAIL_REFRESH_TOKEN=${tok.refresh_token}`;
    const re = /^GMAIL_REFRESH_TOKEN=.*$/m;
    content = re.test(content) ? content.replace(re, line) : content.replace(/\s*$/, "") + "\n" + line + "\n";
    fs.writeFileSync(ENV_PATH, content);
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<h2>Gmail connected ✓</h2><p>Token saved. Close this tab and return to the terminal.</p>");
    console.log("\n✓ Connected — GMAIL_REFRESH_TOKEN written to .env. Setup complete.\n");
    server.close(() => process.exit(0));
  } catch (e) {
    res.writeHead(500); res.end("Token exchange failed: " + e.message);
    console.error("\n✗ Token exchange failed:", e, "\n");
    server.close(() => process.exit(1));
  }
});

server.listen(PORT, () => {
  console.log("\n1) Open this URL, sign in as the inbox you want triaged, and approve:\n");
  console.log("   " + authUrl + "\n");
  console.log(`2) Waiting on ${REDIRECT} for the redirect…  (Ctrl+C to cancel)\n`);
});
