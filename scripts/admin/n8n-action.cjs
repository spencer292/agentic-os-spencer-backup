#!/usr/bin/env node
/* n8n workflow action tool — the ONLY write-capable script in the audit set.
 * Safely activates / deactivates a single workflow by id. Reversible:
 * deactivate <-> activate. Never deletes. Reads N8N_API_KEY from .env; never prints it.
 *
 * Usage:
 *   node scripts/admin/n8n-action.cjs --id <wfId> --deactivate
 *   node scripts/admin/n8n-action.cjs --id <wfId> --activate
 *   node scripts/admin/n8n-action.cjs --id <wfId> --status     # read-only check
 *
 * It always GETs the workflow first, prints name + current state, performs the
 * single toggle, then re-reads and prints the resulting state. One id per call.
 */
const fs = require("fs");
const path = require("path");

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : def;
}
const flag = (n) => process.argv.includes(`--${n}`);

function loadEnv(key, def) {
  if (process.env[key]) return process.env[key].trim();
  const envPath = path.resolve(__dirname, "..", "..", ".env");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(new RegExp(`^\\s*${key}\\s*=\\s*(.*)\\s*$`));
      if (m) return m[1].replace(/^["']|["']$/g, "").trim();
    }
  }
  return def;
}
const KEY = loadEnv("N8N_API_KEY", "");
let BASE = loadEnv("N8N_BASE_URL", "https://allthepower.app.n8n.cloud").replace(/\/+$/, "");
if (!/\/api\/v1$/.test(BASE)) BASE += "/api/v1";

async function api(ep, method = "GET") {
  const res = await fetch(`${BASE}${ep}`, { method, headers: { "X-N8N-API-KEY": KEY, accept: "application/json" } });
  const t = await res.text();
  let j; try { j = JSON.parse(t); } catch { j = t; }
  if (!res.ok) throw new Error(`${method} ${ep} -> ${res.status}: ${String(t).slice(0, 200)}`);
  return j;
}

(async () => {
  if (!KEY) { console.error("N8N_API_KEY not found"); process.exit(2); }
  const id = arg("id");
  if (!id) { console.error("--id required"); process.exit(2); }

  const before = await api(`/workflows/${id}`);
  console.log(`workflow: "${before.name}" (${id})  active=${before.active}`);

  if (flag("status")) return;

  let action = null;
  if (flag("deactivate")) action = "deactivate";
  else if (flag("activate")) action = "activate";
  else { console.error("specify --deactivate | --activate | --status"); process.exit(2); }

  if (action === "deactivate" && !before.active) { console.log("already inactive — no change"); return; }
  if (action === "activate" && before.active) { console.log("already active — no change"); return; }

  await api(`/workflows/${id}/${action}`, "POST");
  const after = await api(`/workflows/${id}`);
  console.log(`-> ${action} done. active=${after.active}  (reverse with --${action === "deactivate" ? "activate" : "deactivate"})`);
})();
