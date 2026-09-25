#!/usr/bin/env node
// One-time Gmail OAuth — gets a refresh token for the daily-triage automation.
// Prereq: GMAIL_CLIENT_ID + GMAIL_CLIENT_SECRET in .env (a "Desktop app" OAuth client).
// Run:    node scripts/gmail/gmail-auth.cjs                        → default mailbox (GMAIL_REFRESH_TOKEN)
//         node scripts/gmail/gmail-auth.cjs --account allthepower  → GMAIL_REFRESH_TOKEN_ALLTHEPOWER
// Sign in AS the mailbox you're connecting when the browser opens.
const fs = require("fs");
const path = require("path");
const http = require("http");

const ENV_PATH = path.join(__dirname, "..", "..", ".env");
const SCOPE = "https://www.googleapis.com/auth/gmail.modify"; // read + label + draft + send; NO hard-delete
const PORT = 8910;
const REDIRECT = `http://localhost:${PORT}`;

const accountIdx = process.argv.indexOf("--account");
const ACCOUNT = accountIdx > -1 ? (process.argv[accountIdx + 1] || "").trim()
  : (process.argv.find(a => a.startsWith("--account=")) || "").split("=")[1] || "";
const TOKEN_KEY = ACCOUNT
  ? "GMAIL_REFRESH_TOKEN_" + ACCOUNT.toUpperCase().replace(/-/g, "_")
  : "GMAIL_REFRESH_TOKEN";

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
// Per-account OAuth client (mirrors _lib.cjs): GMAIL_CLIENT_ID_<ACCOUNT> wins when set,
// so a mailbox in a different Google org can use its own Cloud project's client.
const ACCT_SUFFIX = ACCOUNT ? "_" + ACCOUNT.toUpperCase().replace(/-/g, "_") : "";
const CLIENT_ID = env["GMAIL_CLIENT_ID" + ACCT_SUFFIX] || env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = env["GMAIL_CLIENT_SECRET" + ACCT_SUFFIX] || env.GMAIL_CLIENT_SECRET;
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
    const line = `${TOKEN_KEY}=${tok.refresh_token}`;
    const re = new RegExp(`^${TOKEN_KEY}=.*$`, "m");
    content = re.test(content) ? content.replace(re, line) : content.replace(/\s*$/, "") + "\n" + line + "\n";
    fs.writeFileSync(ENV_PATH, content);
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<h2>Gmail connected ✓</h2><p>Token saved. Close this tab and return to the terminal.</p>");
    console.log(`\n✓ Connected — ${TOKEN_KEY} written to .env. Setup complete.\n`);
    server.close(() => process.exit(0));
  } catch (e) {
    res.writeHead(500); res.end("Token exchange failed: " + e.message);
    console.error("\n✗ Token exchange failed:", e, "\n");
    server.close(() => process.exit(1));
  }
});

server.listen(PORT, () => {
  const hint = ACCOUNT ? `the "${ACCOUNT}" mailbox` : "the inbox you want triaged";
  console.log(`\n1) Open this URL, sign in as ${hint}, and approve:\n`);
  console.log("   " + authUrl + "\n");
  console.log(`2) Waiting on ${REDIRECT} for the redirect…  (Ctrl+C to cancel)\n`);
});
