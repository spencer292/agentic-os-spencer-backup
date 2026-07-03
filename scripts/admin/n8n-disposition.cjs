#!/usr/bin/env node
/* Classifies every workflow into a disposition bucket and writes a markdown
 * approval table. Read-only / analysis. Conservative: never recommends deletion
 * of anything still active; the heaviest active recommendation is "pause".
 * Usage: node scripts/admin/n8n-disposition.cjs [analysis.json] [out.md]
 */
const fs = require("fs");
const inP = process.argv[2] || "projects/briefs/n8n-audit/data/analysis.json";
const outP = process.argv[3] || "projects/briefs/n8n-audit/2026-06-16_disposition.md";
const a = JSON.parse(fs.readFileSync(inP, "utf8"));
const days = (iso) => iso ? Math.round((Date.parse(a.fetchedAt) - Date.parse(iso)) / 864e5) : null;
const TEST = /(^|[\s_])(test|temp|tmp|copy|old|draft|untitled|my workflow|placeholder|wip|demo|backup)(\b|_)/i;
const VIDEO = /^(video pipeline|v2-|video intake|carousel pdf|analyzer minimal|test trigger)/i;

const cadence = (w) => w.triggers.filter(t => t.kind === "schedule").map(t => t.detail).join("; ")
  || w.triggers.map(t => t.kind).filter((v, i, s) => s.indexOf(v) === i).join(",");
const health = (w) => w.exec ? `${w.exec.runs}r / ${w.exec.errors}e, last ${days(w.exec.last)}d ago` : "no runs in 2d window";

function classify(w) {
  const err100 = w.exec && w.exec.runs > 0 && w.exec.errors === w.exec.runs;
  const errSome = w.exec && w.exec.errors > 0 && w.exec.errors < w.exec.runs;
  if (w.active) {
    if (err100) return ["FIX-URGENT", `Failing 100% (${w.exec.errors}/${w.exec.runs}). Fix the failing node or PAUSE until repaired — it is burning executions every cycle for zero output.`];
    if (VIDEO.test(w.name)) return ["REVIEW-VIDEO", `Part of the multi-generation video-render cluster. Confirm whether this generation is canonical before pausing — pausing the live one breaks the pipeline.`];
    if (TEST.test(w.name) || /^(99 |test |temp )/i.test(w.name)) return ["REVIEW-ACTIVE", `Test/temp-named but still ACTIVE (open ${w.triggerKinds.join("/")} endpoint). Almost certainly safe to PAUSE — confirm it isn't a live dependency.`];
    if (errSome) return ["KEEP-WATCH", `Healthy overall but ${w.exec.errors} error(s) in window — keep, glance at the failures.`];
    return ["KEEP", `Active, healthy, part of the running system. Keep.`];
  }
  // inactive
  if (w.nodeCount === 0) return ["DELETE-JUNK", `Empty shell (0 nodes), inactive ${days(w.updatedAt)}d. Tag Archive now; delete next cycle.`];
  if (TEST.test(w.name)) return ["DELETE-JUNK", `Test/scaffold, inactive ${days(w.updatedAt)}d. Tag Archive now; delete next cycle.`];
  return ["ARCHIVE-REVIEW", `Real workflow but parked (inactive ${days(w.updatedAt)}d). Keep archived unless you still want it — then re-tag and confirm it runs.`];
}

const buckets = {};
for (const w of a.workflows) {
  const [b, rec] = classify(w);
  (buckets[b] ||= []).push({ ...w, _rec: rec });
}

const ORDER = ["FIX-URGENT", "REVIEW-ACTIVE", "REVIEW-VIDEO", "KEEP-WATCH", "KEEP", "ARCHIVE-REVIEW", "DELETE-JUNK"];
const DESC = {
  "FIX-URGENT": "🔴 Active & failing — fix or pause now",
  "REVIEW-ACTIVE": "🟠 Active test/temp endpoints — pause candidates (confirm)",
  "REVIEW-VIDEO": "🟠 Video-render cluster — needs your call on the canonical generation",
  "KEEP-WATCH": "🟡 Keep, minor errors to glance at",
  "KEEP": "🟢 Keep — the running system",
  "ARCHIVE-REVIEW": "⚪ Inactive, real — keep archived (delete later if unwanted)",
  "DELETE-JUNK": "⚫ Inactive junk/empties — tag Archive, delete next cycle",
};

let md = `# n8n Workflow Disposition List — 2026-06-16\n\n`;
md += `Generated from \`data/analysis.json\` (fetched ${a.fetchedAt}). Execution window ≈ 2 days.\n`;
md += `**Policy: deactivate-only.** Nothing is deleted in this round; "pause" = toggle inactive (fully reversible). Full backup exported before any change.\n\n`;
md += `Approve by editing the **Decision** column (KEEP / PAUSE / FIX / DELETE / leave blank = accept recommendation).\n\n`;
md += `| # | Bucket | Workflow | Trigger / cadence | Health | Updated | Recommendation | Decision |\n`;
md += `|--|--------|----------|-------------------|--------|---------|----------------|----------|\n`;
let i = 1;
const counts = {};
for (const b of ORDER) {
  const list = (buckets[b] || []).sort((x, y) => x.name.localeCompare(y.name));
  counts[b] = list.length;
  for (const w of list) {
    md += `| ${i++} | ${b} | ${w.name} | ${cadence(w) || "—"} | ${health(w)} | ${days(w.updatedAt)}d | ${w._rec} | |\n`;
  }
}
md += `\n## Bucket counts\n\n`;
for (const b of ORDER) md += `- **${b}** — ${counts[b] || 0} — ${DESC[b]}\n`;
md += `\nTotal: ${a.workflows.length}\n`;

fs.writeFileSync(outP, md);
console.log(`wrote ${outP}`);
for (const b of ORDER) {
  console.log(`\n[${b}] ${counts[b] || 0} — ${DESC[b]}`);
  for (const w of (buckets[b] || []).sort((x, y) => x.name.localeCompare(y.name))) console.log(`   - ${w.name}`);
}
