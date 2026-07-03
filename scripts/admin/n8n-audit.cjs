#!/usr/bin/env node
/* n8n workflow audit fetcher — REST, read-only.
 *
 * Pulls the full workflow inventory + tags + recent executions from the n8n
 * Cloud public API and emits:
 *   - a compact per-workflow ANALYSIS json (--out)   : safe to read into context
 *   - the full RAW workflow export (--raw)            : backup, never read inline
 *   - a human summary on stdout
 *
 * Reads N8N_API_KEY (and optional N8N_BASE_URL) from the project .env internally;
 * never prints the key. This script is READ-ONLY — only GET requests.
 *
 * Dimensions covered:
 *   - active vs inactive
 *   - trigger / schedule inventory (cron, interval, webhook, poll, manual-only)
 *   - duplicate / overlap signals (name + node-shape fingerprint)
 *   - credential references used (names/types only — n8n never exposes values)
 *   - hardcoded-secret heuristics in node params (flags only, never the value)
 *   - execution health + volume (recent window): runs, errors, last run/status
 *
 * Usage:
 *   node scripts/admin/n8n-audit.cjs --out projects/briefs/n8n-audit/data/analysis.json \
 *        --raw projects/briefs/n8n-audit/backups/workflows-raw.json
 *
 * Options:
 *   --out <path>        write compact analysis JSON
 *   --raw <path>        write full raw workflows array (backup)
 *   --exec-pages <n>    max execution pages to pull (250/page, default 8 = 2000)
 *   --no-exec           skip executions (faster; no health/volume data)
 */
const fs = require("fs");
const path = require("path");

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")
    ? process.argv[i + 1] : def;
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
let BASE = loadEnv("N8N_BASE_URL", "https://allthepower.app.n8n.cloud");
BASE = BASE.replace(/\/+$/, "");
if (!/\/api\/v1$/.test(BASE)) BASE += "/api/v1";

async function api(ep) {
  const res = await fetch(`${BASE}${ep}`, {
    headers: { "X-N8N-API-KEY": KEY, accept: "application/json" },
  });
  const t = await res.text();
  let j; try { j = JSON.parse(t); } catch { j = t; }
  if (!res.ok) throw new Error(`${ep} -> ${res.status}: ${String(t).slice(0, 200)}`);
  return j;
}

async function pageAll(ep, cap = Infinity) {
  const out = [];
  let cursor = null, pages = 0;
  do {
    const q = ep + (ep.includes("?") ? "&" : "?") + "limit=250" + (cursor ? `&cursor=${encodeURIComponent(cursor)}` : "");
    const r = await api(q);
    if (Array.isArray(r)) { out.push(...r); break; }
    out.push(...(r.data || []));
    cursor = r.nextCursor || null;
    pages++;
  } while (cursor && pages < cap);
  return out;
}

// ---- trigger / schedule classification -------------------------------------
function classifyTriggers(nodes) {
  const triggers = [];
  for (const n of nodes || []) {
    const type = (n.type || "").toLowerCase();
    const p = n.parameters || {};
    if (type.includes("scheduletrigger") || type.includes("cron") || type.includes("interval")) {
      // n8n scheduleTrigger: parameters.rule.interval = [{field, ...}] OR cronExpression
      let detail = "";
      const rule = p.rule || {};
      const intervals = rule.interval || p.interval || [];
      if (Array.isArray(intervals) && intervals.length) {
        detail = intervals.map((iv) => {
          if (iv.cronExpression || iv.expression) return `cron(${iv.cronExpression || iv.expression})`;
          const f = iv.field || iv.unit || "?";
          const every = iv.minutesInterval || iv.hoursInterval || iv.daysInterval || iv.value || iv.secondsInterval;
          const at = (iv.triggerAtHour != null ? `@${iv.triggerAtHour}:${iv.triggerAtMinute ?? 0}` : "");
          return `every ${every ?? "?"} ${f}${at}`;
        }).join(", ");
      } else if (p.cronExpression) detail = `cron(${p.cronExpression})`;
      else if (p.triggerTimes) detail = JSON.stringify(p.triggerTimes).slice(0, 120);
      triggers.push({ kind: "schedule", node: n.name, detail });
    } else if (type.includes("webhook") || type.includes("respondtowebhook") && false) {
      triggers.push({ kind: "webhook", node: n.name, detail: p.path ? `/${p.path}` : (n.webhookId || "") });
    } else if (type === "n8n-nodes-base.manualtrigger" || type.includes("manualtrigger")) {
      triggers.push({ kind: "manual", node: n.name, detail: "" });
    } else if (type.includes("formtrigger")) {
      triggers.push({ kind: "form", node: n.name, detail: p.path ? `/${p.path}` : "" });
    } else if (type.includes("executeworkflowtrigger")) {
      triggers.push({ kind: "sub-workflow", node: n.name, detail: "called by another workflow" });
    } else if (type.includes("trigger")) {
      // app/polling triggers (gmail, telegram, rss, etc.)
      const poll = p.pollTimes ? "poll" : "event";
      triggers.push({ kind: poll === "poll" ? "poll" : "app-event", node: n.name, detail: type.replace("n8n-nodes-base.", "").replace("@n8n/n8n-nodes-langchain.", "") });
    }
  }
  return triggers;
}

// ---- secret heuristics (flags only — never capture the value) ---------------
const SECRET_PATTERNS = [
  [/bearer\s+[a-z0-9._\-]{12,}/i, "inline-bearer-token"],
  [/sk-[a-z0-9]{20,}/i, "openai-style-key"],
  [/ghp_[a-z0-9]{30,}/i, "github-pat"],
  [/xox[baprs]-[a-z0-9-]{10,}/i, "slack-token"],
  [/AKIA[0-9A-Z]{16}/, "aws-access-key"],
  [/AIza[0-9A-Za-z_\-]{30,}/, "google-api-key"],
  [/eyJ[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]{10,}/, "jwt"],
  [/["'](api[_-]?key|apikey|secret|password|token|auth)["']\s*:\s*["'][^"']{12,}["']/i, "hardcoded-credential-field"],
  [/[?&](api[_-]?key|apikey|token|key|access_token)=[a-z0-9._\-]{12,}/i, "secret-in-url"],
];
function scanSecrets(node) {
  const hits = [];
  let s = "";
  try { s = JSON.stringify(node.parameters || {}); } catch { return hits; }
  for (const [re, label] of SECRET_PATTERNS) {
    if (re.test(s)) hits.push(label);
  }
  return [...new Set(hits)];
}

// ---- node-shape fingerprint for duplicate detection -------------------------
function fingerprint(nodes) {
  const counts = {};
  for (const n of nodes || []) {
    const t = (n.type || "").replace("n8n-nodes-base.", "").replace("@n8n/n8n-nodes-langchain.", "lc.");
    counts[t] = (counts[t] || 0) + 1;
  }
  return Object.entries(counts).sort().map(([t, c]) => `${t}:${c}`).join("|");
}

(async () => {
  if (!KEY) { console.error("N8N_API_KEY not found in env or .env"); process.exit(2); }
  console.error(`[n8n-audit] base=${BASE}`);

  let workflows, tags;
  try {
    workflows = await pageAll("/workflows");
    tags = await pageAll("/tags").catch(() => []);
  } catch (e) {
    console.error(`[n8n-audit] FATAL fetching workflows: ${e.message}`);
    process.exit(1);
  }

  // executions (optional)
  const execByWf = {};
  let execWindow = { count: 0, oldest: null, newest: null };
  if (!flag("no-exec")) {
    try {
      const execs = await pageAll("/executions?includeData=false", Number(arg("exec-pages", 8)));
      for (const e of execs) {
        const wf = String(e.workflowId);
        const b = (execByWf[wf] ||= { runs: 0, errors: 0, last: null, lastStatus: null });
        b.runs++;
        const status = e.status || (e.finished ? "success" : (e.stoppedAt ? "unknown" : "running"));
        if (status === "error" || status === "crashed") b.errors++;
        const t = e.startedAt || e.createdAt || e.stoppedAt;
        if (t && (!b.last || t > b.last)) { b.last = t; b.lastStatus = status; }
        if (t) {
          if (!execWindow.oldest || t < execWindow.oldest) execWindow.oldest = t;
          if (!execWindow.newest || t > execWindow.newest) execWindow.newest = t;
        }
      }
      execWindow.count = execs.length;
      console.error(`[n8n-audit] executions pulled: ${execs.length} (window ${execWindow.oldest} .. ${execWindow.newest})`);
    } catch (e) {
      console.error(`[n8n-audit] executions unavailable: ${e.message}`);
    }
  }

  const tagName = {};
  for (const t of tags) tagName[t.id] = t.name;

  const analysis = workflows.map((w) => {
    const nodes = w.nodes || [];
    const triggers = classifyTriggers(nodes);
    const kinds = [...new Set(triggers.map((t) => t.kind))];
    const autoRuns = w.active && kinds.some((k) => k !== "manual");
    const manualOnly = triggers.length > 0 && kinds.every((k) => k === "manual");
    // credentials referenced
    const creds = {};
    const secretFlags = [];
    for (const n of nodes) {
      for (const [ctype, cval] of Object.entries(n.credentials || {})) {
        const nm = (cval && (cval.name || cval.id)) || "?";
        (creds[ctype] ||= new Set()).add(nm);
      }
      const hits = scanSecrets(n);
      if (hits.length) secretFlags.push({ node: n.name, flags: hits });
    }
    const credList = Object.entries(creds).map(([t, s]) => ({ type: t, names: [...s] }));
    const ex = execByWf[String(w.id)] || null;
    return {
      id: w.id,
      name: w.name,
      active: !!w.active,
      autoRuns,
      manualOnly,
      tags: (w.tags || []).map((t) => t.name || tagName[t.id] || t.id).filter(Boolean),
      nodeCount: nodes.length,
      triggers,
      triggerKinds: kinds,
      credentials: credList,
      sharedCredCount: credList.reduce((a, c) => a + c.names.length, 0),
      secretFlags,
      fingerprint: fingerprint(nodes),
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
      exec: ex,
    };
  });

  // duplicate / overlap signals
  const byFp = {}, byName = {};
  for (const a of analysis) {
    (byFp[a.fingerprint] ||= []).push(a.name);
    const base = a.name.toLowerCase().replace(/\b(copy|v\d+|\(\d+\)|test|old|new|final|backup)\b/g, "").replace(/\s+/g, " ").trim();
    (byName[base] ||= []).push(a.name);
  }
  const dupByShape = Object.entries(byFp).filter(([, v]) => v.length > 1).map(([fp, v]) => ({ fingerprint: fp, workflows: v }));
  const dupByName = Object.entries(byName).filter(([, v]) => v.length > 1).map(([base, v]) => ({ base, workflows: v }));

  const summary = {
    total: analysis.length,
    active: analysis.filter((a) => a.active).length,
    inactive: analysis.filter((a) => !a.active).length,
    autoRunning: analysis.filter((a) => a.autoRuns).length,
    activeButManualOnly: analysis.filter((a) => a.active && a.manualOnly).length,
    withSecretFlags: analysis.filter((a) => a.secretFlags.length).length,
    withErrors: analysis.filter((a) => a.exec && a.exec.errors > 0).length,
    noRecentRuns: analysis.filter((a) => a.active && (!a.exec || a.exec.runs === 0)).length,
    triggerKindBreakdown: analysis.reduce((m, a) => { a.triggerKinds.forEach((k) => (m[k] = (m[k] || 0) + 1)); return m; }, {}),
    duplicateShapeGroups: dupByShape.length,
    duplicateNameGroups: dupByName.length,
  };

  const out = { fetchedAt: new Date().toISOString(), base: BASE, execWindow, summary, dupByShape, dupByName, workflows: analysis };

  const outPath = arg("out");
  if (outPath) { fs.mkdirSync(path.dirname(outPath), { recursive: true }); fs.writeFileSync(outPath, JSON.stringify(out, null, 2)); console.error(`[n8n-audit] analysis -> ${outPath}`); }
  const rawPath = arg("raw");
  if (rawPath) { fs.mkdirSync(path.dirname(rawPath), { recursive: true }); fs.writeFileSync(rawPath, JSON.stringify(workflows, null, 2)); console.error(`[n8n-audit] raw backup -> ${rawPath} (${workflows.length} workflows)`); }

  // human summary on stdout
  console.log(JSON.stringify(summary, null, 2));
})();
