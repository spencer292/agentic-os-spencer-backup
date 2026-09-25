#!/usr/bin/env node
/* List connected Zernio accounts. Read-only.
 * Reads ZERNIO_API_KEY from the project .env internally; never prints it.
 * Usage: node zernio_accounts.cjs [--json]
 *   --json   emit the raw accounts array as JSON instead of the human-readable list
 */
const fs = require("fs");
const path = require("path");

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")
    ? process.argv[i + 1] : def;
}
const flag = (n) => process.argv.includes(`--${n}`);

function loadKey() {
  if (process.env.ZERNIO_API_KEY) return process.env.ZERNIO_API_KEY.trim();
  const root = path.resolve(__dirname, "..", "..", "..", "..");
  const envPath = path.join(root, ".env");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*ZERNIO_API_KEY\s*=\s*(.*)\s*$/);
      if (m) return m[1].replace(/^["']|["']$/g, "").trim();
    }
  }
  return "";
}

(async () => {
  const key = loadKey();
  if (!key) { console.error("ZERNIO_API_KEY not found in env or .env"); process.exit(2); }
  const candidates = ["https://zernio.com/api/v1/accounts"];
  for (const url of candidates) {
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
      const text = await res.text();
      if (!res.ok) { console.error(`GET ${url} -> ${res.status}: ${text.slice(0, 200)}`); continue; }
      let data;
      try { data = JSON.parse(text); } catch { console.log(text.slice(0, 500)); return; }
      const accounts = Array.isArray(data) ? data : (data.accounts || data.data || []);
      if (flag("json")) {
        console.log(JSON.stringify(accounts, null, 2));
        return;
      }
      console.log(`Connected accounts (${accounts.length}):`);
      for (const a of accounts) {
        console.log(`  - platform=${a.platform || a.provider || "?"}  id=${a._id || a.id || a.accountId || "?"}  name=${a.name || a.username || a.displayName || a.profileName || ""}`);
      }
      return;
    } catch (e) {
      console.error(`request failed: ${e.message}`);
    }
  }
  process.exit(3);
})();
