#!/usr/bin/env node
/* List connected Zernio (getlate.dev) accounts. Read-only.
 * Reads ZERNIO_API_KEY from the project .env internally; never prints it.
 * Usage: node zernio_accounts.cjs
 */
const fs = require("fs");
const path = require("path");

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
  const candidates = ["https://getlate.dev/api/v1/accounts"];
  for (const url of candidates) {
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
      const text = await res.text();
      if (!res.ok) { console.error(`GET ${url} -> ${res.status}: ${text.slice(0, 200)}`); continue; }
      let data;
      try { data = JSON.parse(text); } catch { console.log(text.slice(0, 500)); return; }
      const accounts = Array.isArray(data) ? data : (data.accounts || data.data || []);
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
