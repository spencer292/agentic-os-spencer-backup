#!/usr/bin/env node
/* Reads the n8n-audit analysis.json and prints compact, grouped digests.
 * Read-only. Usage: node scripts/admin/n8n-digest.cjs [path]
 */
const fs = require("fs");
const p = process.argv[2] || "projects/briefs/n8n-audit/data/analysis.json";
const a = JSON.parse(fs.readFileSync(p, "utf8"));
const W = a.workflows;
const days = (iso) => iso ? Math.round((Date.parse(a.fetchedAt) - Date.parse(iso)) / 864e5) : null;
const sched = (w) => w.triggers.filter(t => t.kind === "schedule").map(t => t.detail).join("; ") || w.triggerKinds.join(",");
const exErr = (w) => w.exec ? `${w.exec.runs}r/${w.exec.errors}e last ${days(w.exec.last)}d` : "—";
const flags = (w) => w.secretFlags.length ? `${w.secretFlags.length} nodes` : "";
const TEST = /(^|[\s_])(test|temp|tmp|copy|old|draft|untitled|my workflow|placeholder|wip|demo|backup|\bv\d\b)/i;

const line = (w) => `  ${w.active ? "●" : "○"} ${w.name}  [${w.nodeCount}n ${days(w.updatedAt)}d-old ${exErr(w)}${flags(w) ? " 🔑" + flags(w) : ""}]`;

console.log(`=== n8n audit digest ===`);
console.log(`fetched ${a.fetchedAt}`);
if (a.execWindow) console.log(`exec window: ${a.execWindow.count} executions span ${days(a.execWindow.oldest)}d (${a.execWindow.oldest} .. ${a.execWindow.newest})`);
console.log(JSON.stringify(a.summary, null, 0));

const grp = (title, list) => {
  console.log(`\n## ${title} (${list.length})`);
  for (const w of list) console.log(line(w) + (w.triggers.length ? `\n      ${w.triggers.map(t => `${t.kind}:${t.node}${t.detail ? "=" + t.detail : ""}`).join(" | ")}` : ""));
};

const active = W.filter(w => w.active);
const inactive = W.filter(w => !w.active);

grp("ACTIVE — schedule-triggered", active.filter(w => w.triggerKinds.includes("schedule")).sort((x, y) => x.name.localeCompare(y.name)));
grp("ACTIVE — poll-triggered (Notion/Gmail/Drive watchers)", active.filter(w => w.triggerKinds.includes("poll")).sort((x, y) => x.name.localeCompare(y.name)));
grp("ACTIVE — webhook-triggered", active.filter(w => w.triggerKinds.includes("webhook") && !w.triggerKinds.includes("poll") && !w.triggerKinds.includes("schedule")).sort((x, y) => x.name.localeCompare(y.name)));
grp("ACTIVE — sub-workflow / app-event only", active.filter(w => w.triggerKinds.every(k => k === "sub-workflow" || k === "app-event")).sort((x, y) => x.name.localeCompare(y.name)));
grp("ACTIVE — no triggers detected (orphan/odd)", active.filter(w => w.triggerKinds.length === 0));

grp("INACTIVE — all", inactive.sort((x, y) => (days(y.updatedAt) - days(x.updatedAt))));

console.log(`\n## EMPTY (0 nodes)`);
for (const w of W.filter(w => w.nodeCount === 0)) console.log(line(w));

console.log(`\n## TEST/TEMP/JUNK-NAMED`);
for (const w of W.filter(w => TEST.test(w.name)).sort((x, y) => Number(y.active) - Number(x.active))) console.log(line(w));

console.log(`\n## ACTIVE but NO runs in exec window`);
for (const w of active.filter(w => !w.exec || w.exec.runs === 0)) console.log(line(w) + `  triggers=${w.triggerKinds.join(",")}`);

console.log(`\n## ERRORS in window`);
for (const w of W.filter(w => w.exec && w.exec.errors > 0)) console.log(line(w));

console.log(`\n## DUPLICATE GROUPS (by node-shape)`);
for (const g of a.dupByShape) console.log(`  shape[${g.fingerprint || "EMPTY"}]: ${g.workflows.join("  |  ")}`);
console.log(`\n## DUPLICATE GROUPS (by name)`);
for (const g of a.dupByName) console.log(`  "${g.base}": ${g.workflows.join("  |  ")}`);

console.log(`\n## SECURITY — hardcoded-secret heuristics (flags only)`);
const flagAgg = {};
for (const w of W.filter(w => w.secretFlags.length)) {
  const types = [...new Set(w.secretFlags.flatMap(f => f.flags))];
  types.forEach(t => flagAgg[t] = (flagAgg[t] || 0) + 1);
  console.log(`  ${w.active ? "●" : "○"} ${w.name}: ${w.secretFlags.length} nodes — ${types.join(", ")}`);
}
console.log(`  -- flag-type totals: ${JSON.stringify(flagAgg)}`);

console.log(`\n## CREDENTIAL USAGE (distinct credential names across all workflows)`);
const credAgg = {};
for (const w of W) for (const c of w.credentials) for (const n of c.names) {
  const k = `${c.type} :: ${n}`; credAgg[k] = (credAgg[k] || 0) + 1;
}
for (const [k, v] of Object.entries(credAgg).sort((x, y) => y[1] - x[1])) console.log(`  ${v}×  ${k}`);
