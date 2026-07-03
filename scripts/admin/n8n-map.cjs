#!/usr/bin/env node
/* Builds a dependency map of the n8n estate from the raw backup + analysis.
 * Extracts real edges:
 *   - executeWorkflow nodes  -> caller calls callee (sub-workflow)
 *   - webhook exposure + httpRequest URLs that hit an internal /webhook/<path>
 * Groups workflows by domain, flags orphans, and emits:
 *   - map.json            (graph data)
 *   - a Mermaid diagram per domain + an overview, to stdout / --mmd
 * Read-only.
 */
const fs = require("fs");
const RAW = process.argv[2] || "projects/briefs/n8n-audit/backups/workflows-raw-2026-06-16.json";
const ANA = process.argv[3] || "projects/briefs/n8n-audit/data/analysis.json";
const raw = JSON.parse(fs.readFileSync(RAW, "utf8"));
const ana = JSON.parse(fs.readFileSync(ANA, "utf8"));
const meta = {}; for (const w of ana.workflows) meta[w.id] = w;

const GROUPS = [
  [/analytics pull/i, "analytics"],
  [/approval - schedule|caption router|text router|article router|quote card|chain publisher|video router/i, "social-distribution"],
  [/opus|rename opus/i, "opus-clips"],
  [/video pipeline|^v2-|ci (analyzer|assembler|enhancer|renderer|watcher)|video intake|carousel pdf|analyzer minimal|test trigger/i, "video-pipeline"],
  [/^\d\d (podcast|ops)|podcast|captivate|guest|episode|zoom/i, "podcast"],
  [/youtube/i, "youtube"],
  [/invoice|square|sales report|master data|gmail automation|pinterest|publer|journey/i, "reports-misc"],
  [/error|estate audit|dashboard|elevate|solution quiz/i, "ops"],
  [/my workflow|test|temp|backfill|untitled/i, "sandbox"],
];
const groupOf = (name) => { for (const [re, g] of GROUPS) if (re.test(name)) return g; return "misc"; };

// index webhook paths -> workflow id
const pathToWf = {};
const wfPaths = {};
function collectPaths(w) {
  const out = [];
  for (const n of w.nodes || []) {
    if ((n.type || "").toLowerCase().includes("webhook") && n.parameters && n.parameters.path) {
      const p = String(n.parameters.path).replace(/^\/+/, "");
      out.push(p); pathToWf[p] = w.id;
    }
  }
  wfPaths[w.id] = out;
}
raw.forEach(collectPaths);

function resolveWfId(v) {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object") return v.value || v.id || (v.__rl ? v.value : null);
  return null;
}

const edges = [];
const seen = new Set();
const addEdge = (from, to, via) => {
  if (!from || !to || from === to) return;
  const k = `${from}->${to}:${via}`; if (seen.has(k)) return; seen.add(k);
  edges.push({ from, to, via });
};

for (const w of raw) {
  for (const n of w.nodes || []) {
    const type = (n.type || "").toLowerCase();
    const p = n.parameters || {};
    // sub-workflow calls
    if (type.includes("executeworkflow") && !type.includes("trigger")) {
      const target = resolveWfId(p.workflowId);
      if (target) addEdge(w.id, target, "sub-workflow");
    }
    // http calls hitting an internal webhook path
    if (type.includes("httprequest")) {
      const url = typeof p.url === "string" ? p.url : (p.url && p.url.value) || "";
      const m = url.match(/\/webhook[^"' ]*?\/([a-z0-9\-_]+)/i) || url.match(/\/(v2-[a-z0-9\-]+|ci-[a-z0-9\-]+|assembler|find-file-temp|run-analyzer|trigger-analyzer-v4)\b/i);
      for (const path of Object.keys(pathToWf)) {
        if (url.includes(path)) addEdge(w.id, pathToWf[path], `webhook:/${path}`);
      }
    }
  }
}

// orphan analysis: workflows whose ONLY triggers are sub-workflow/internal-webhook and have no incoming edge
const incoming = {}; edges.forEach(e => (incoming[e.to] ||= []).push(e));
function isInternalOnly(w) {
  const kinds = (meta[w.id]?.triggerKinds) || [];
  if (!kinds.length) return false;
  return kinds.every(k => k === "sub-workflow") ||
    (kinds.every(k => k === "sub-workflow" || k === "webhook") && (wfPaths[w.id] || []).every(p => /^(v2-|ci-|assembler|find-file|run-analyzer|trigger-analyzer)/i.test(p)));
}
const orphans = raw.filter(w => isInternalOnly(w) && !(incoming[w.id]?.length));

// ----- emit graph json -----
const groups = {};
for (const w of raw) {
  const g = groupOf(w.name);
  (groups[g] ||= []).push({
    id: w.id, name: w.name, active: !!w.active,
    triggers: (meta[w.id]?.triggerKinds) || [],
    webhookPaths: wfPaths[w.id] || [],
    failing: meta[w.id]?.exec && meta[w.id].exec.runs > 0 && meta[w.id].exec.errors === meta[w.id].exec.runs,
    callsOut: edges.filter(e => e.from === w.id).length,
    calledBy: (incoming[w.id] || []).length,
    orphan: orphans.some(o => o.id === w.id),
  });
}
const out = { generatedFrom: RAW, groups, edges, orphans: orphans.map(o => o.name) };
fs.writeFileSync("projects/briefs/n8n-audit/data/map.json", JSON.stringify(out, null, 2));

// ----- console summary -----
console.log(`workflows=${raw.length}  edges=${edges.length}  orphans(internal,uncalled)=${orphans.length}\n`);
for (const [g, list] of Object.entries(groups).sort()) {
  console.log(`## ${g} (${list.length})  active=${list.filter(x => x.active).length}`);
  for (const w of list.sort((a, b) => a.name.localeCompare(b.name))) {
    const t = `${w.active ? "●" : "○"}${w.failing ? "🔴" : ""}${w.orphan ? "⚠orphan" : ""}`;
    const io = `in:${w.calledBy} out:${w.callsOut}`;
    const wh = w.webhookPaths.length ? ` wh[${w.webhookPaths.join(",")}]` : "";
    console.log(`  ${t} ${w.name}  (${io})${wh}`);
  }
  console.log("");
}
console.log("## EDGES (caller -> callee)");
for (const e of edges) console.log(`  ${meta[e.from]?.name || e.from}  --${e.via}-->  ${meta[e.to]?.name || e.to}`);
