#!/usr/bin/env node
// Sync a named Gmail account's credentials from the root .env into every client .env
// so `GMAIL_ACCOUNT=<name>` works from any workspace. Values are copied file-to-file
// and never printed. Run: node scripts/gmail/gmail-sync-account.cjs --account allthepower
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const ROOT_ENV = path.join(ROOT, ".env");
const CLIENTS_DIR = path.join(ROOT, "clients");

const accountIdx = process.argv.indexOf("--account");
const ACCOUNT = accountIdx > -1 ? (process.argv[accountIdx + 1] || "").trim()
  : (process.argv.find(a => a.startsWith("--account=")) || "").split("=")[1] || "";
if (!ACCOUNT) { console.error("✗ Usage: gmail-sync-account.cjs --account <name>"); process.exit(1); }
const SUFFIX = "_" + ACCOUNT.toUpperCase().replace(/-/g, "_");

function readEnv(file) {
  const out = {};
  try {
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
  return out;
}

function upsert(file, key, value) {
  let content = "";
  try { content = fs.readFileSync(file, "utf8"); } catch {}
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  content = re.test(content) ? content.replace(re, line) : content.replace(/\s*$/, "") + "\n" + line + "\n";
  fs.writeFileSync(file, content);
}

const root = readEnv(ROOT_ENV);
const tokenKey = "GMAIL_REFRESH_TOKEN" + SUFFIX;
if (!root[tokenKey]) {
  console.error(`✗ ${tokenKey} not found in root .env — run gmail-auth.cjs --account ${ACCOUNT} first.`);
  process.exit(1);
}
// The OAuth client that minted this token: per-account keys if present, else root shared.
const rootId = root["GMAIL_CLIENT_ID" + SUFFIX] || root.GMAIL_CLIENT_ID;
const rootSecret = root["GMAIL_CLIENT_SECRET" + SUFFIX] || root.GMAIL_CLIENT_SECRET;
if (!rootId || !rootSecret) { console.error("✗ Missing GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET in root .env"); process.exit(1); }

const clients = fs.readdirSync(CLIENTS_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory() && fs.existsSync(path.join(CLIENTS_DIR, d.name, "scripts", "gmail")))
  .map(d => d.name);

for (const c of clients) {
  const envFile = path.join(CLIENTS_DIR, c, ".env");
  const clientEnv = readEnv(envFile);
  const written = [tokenKey];
  upsert(envFile, tokenKey, root[tokenKey]);
  // Refresh tokens only work with the OAuth client that minted them — if this client's
  // shared GMAIL_CLIENT_ID is a different client, pin the pair via per-account keys.
  if (clientEnv.GMAIL_CLIENT_ID !== rootId) {
    upsert(envFile, "GMAIL_CLIENT_ID" + SUFFIX, rootId);
    upsert(envFile, "GMAIL_CLIENT_SECRET" + SUFFIX, rootSecret);
    written.push("GMAIL_CLIENT_ID" + SUFFIX, "GMAIL_CLIENT_SECRET" + SUFFIX);
  }
  console.log(`✓ clients/${c}/.env — wrote ${written.join(", ")}`);
}
console.log(`\nDone. Verify from any workspace: GMAIL_ACCOUNT=${ACCOUNT} node scripts/gmail/gmail-check.cjs`);
