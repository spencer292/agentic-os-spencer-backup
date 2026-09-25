#!/usr/bin/env node
// Shared DataForSEO v3 client for the SEO/AEO/GEO skill chain.
// Root-owned (lives in .claude/skills/str-ai-seo/scripts/) so every client inherits it and
// update-clients.sh never wipes it. Run from a CLIENT folder so that client's .env wins.
//
// Usage:
//   node <root>/.claude/skills/str-ai-seo/scripts/dataforseo.mjs <endpoint> [json-payload | @file.json] [--out file.json] [--raw] [--dry]
//
//   <endpoint>  path after /v3/, e.g. dataforseo_labs/google/ranked_keywords/live
//   payload     a JSON array of task objects, or a single object (auto-wrapped in [ ]).
//               Omit for GET endpoints (appendix/user_data, */locations, */languages).
//   --out       write the full JSON response to a file (default: print to stdout)
//   --raw       print the untouched response; default prints a compact summary + result
//   --dry       print the request that WOULD be sent and exit (no cost)
//
// Examples (run from clients/got-moles/):
//   node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs appendix/user_data
//   node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs dataforseo_labs/google/ranked_keywords/live \
//        '{"target":"got-moles.com","location_code":2840,"language_code":"en","limit":1000}' --out projects/str-keyword-strategy/data/ranked.json
//   node ../../.claude/skills/str-ai-seo/scripts/dataforseo.mjs ai_optimization/ai_keyword_data/keywords_search_volume/live \
//        '{"keywords":["mole removal near me","how to get rid of moles in yard"],"location_code":2840,"language_code":"en"}'
//
// Credentials: DATAFORSEO_LOGIN + DATAFORSEO_PASSWORD, read from ./.env (cwd) then each parent .env up to the
// filesystem root. Values are never printed. Every call logs endpoint, task status and cost to stderr and to
// .dataforseo-usage.log in the cwd so budget can be reconciled against the account balance.
//
// Location codes: 2840 = United States. Language: "en". Common WA local codes can be found via
//   node dataforseo.mjs serp/google/locations '' --raw | grep -i "washington"

import fs from "node:fs";
import path from "node:path";

const API = "https://api.dataforseo.com/v3/";

function loadEnvChain(startDir) {
  const out = {};
  let dir = path.resolve(startDir);
  const seen = [];
  while (true) {
    const f = path.join(dir, ".env");
    if (fs.existsSync(f)) seen.push(f);
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Nearest .env wins: load farthest first, nearest last.
  for (const f of seen.reverse()) {
    for (const line of fs.readFileSync(f, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      out[m[1]] = v;
    }
  }
  return out;
}

function usage(msg) {
  if (msg) console.error("error:", msg);
  console.error("usage: dataforseo.mjs <endpoint> [json-payload|@file] [--out file] [--raw] [--dry]");
  process.exit(msg ? 2 : 0);
}

const argv = process.argv.slice(2);
if (!argv.length || argv[0] === "-h" || argv[0] === "--help") usage();
const flags = { out: null, raw: false, dry: false };
const positional = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--out") flags.out = argv[++i];
  else if (a === "--raw") flags.raw = true;
  else if (a === "--dry") flags.dry = true;
  else positional.push(a);
}
const endpoint = positional[0].replace(/^\/?(v3\/)?/, "");
let payload = positional[1];

let body = null;
if (payload && payload.trim() !== "") {
  if (payload.startsWith("@")) payload = fs.readFileSync(payload.slice(1), "utf8");
  let parsed;
  try { parsed = JSON.parse(payload); } catch (e) { usage(`payload is not valid JSON: ${e.message}`); }
  body = Array.isArray(parsed) ? parsed : [parsed];
}

const env = loadEnvChain(process.cwd());
const login = env.DATAFORSEO_LOGIN || env.DATAFORSEO_USERNAME || env.DATAFORSEO_EMAIL;
const password = env.DATAFORSEO_PASSWORD || env.DATAFORSEO_API_KEY;
if (!login || !password) {
  console.error("error: DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD not found in any .env from", process.cwd(), "upward");
  process.exit(3);
}

const method = body ? "POST" : "GET";
if (flags.dry) {
  console.log(JSON.stringify({ method, url: API + endpoint, body }, null, 2));
  process.exit(0);
}

const res = await fetch(API + endpoint, {
  method,
  headers: {
    Authorization: "Basic " + Buffer.from(`${login}:${password}`).toString("base64"),
    "Content-Type": "application/json",
  },
  body: body ? JSON.stringify(body) : undefined,
});
const text = await res.text();
let json;
try { json = JSON.parse(text); } catch { console.error("non-JSON response:", res.status, text.slice(0, 500)); process.exit(4); }

const tasks = json.tasks || [];
const cost = json.cost ?? tasks.reduce((s, t) => s + (t.cost || 0), 0);
const taskStatus = tasks.map(t => `${t.status_code} ${t.status_message}`).join("; ") || "(no tasks)";
const logLine = `${new Date().toISOString()}\t${endpoint}\t${json.status_code} ${json.status_message}\ttasks=[${taskStatus}]\tcost=${cost}`;
console.error(logLine);
try { fs.appendFileSync(path.join(process.cwd(), ".dataforseo-usage.log"), logLine + "\n"); } catch {}

const output = flags.raw ? json : {
  status: `${json.status_code} ${json.status_message}`,
  cost,
  tasks: tasks.map(t => ({ id: t.id, status: `${t.status_code} ${t.status_message}`, cost: t.cost, result_count: t.result_count, result: t.result })),
};

if (flags.out) {
  fs.mkdirSync(path.dirname(path.resolve(flags.out)), { recursive: true });
  fs.writeFileSync(flags.out, JSON.stringify(output, null, 2));
  console.error("written:", path.resolve(flags.out));
} else {
  console.log(JSON.stringify(output, null, 2));
}
if (json.status_code !== 20000 || tasks.some(t => t.status_code !== 20000)) process.exit(1);
