#!/usr/bin/env node
// Applies triage labels from a decisions file. Junk/FYI are archived out of the
// inbox (INBOX label removed) but NEVER deleted. Idempotent and re-runnable.
//
// Usage:
//   node scripts/gmail/gmail-label.cjs --ensure          # just create the Triage/* labels, print ids
//   node scripts/gmail/gmail-label.cjs --in decisions.json
//   node scripts/gmail/gmail-label.cjs --in decisions.json --dry-run   # show what WOULD change
//
// decisions.json: [{ "id": "<msgId>", "class": "JUNK|FYI|NEEDS-YOU|TO-RESPOND", "reason": "..." }]
const fs = require("fs");
const { getAccessToken, gapi, getLabelMap, ensureLabel, TRIAGE_LABELS } = require("./_lib.cjs");

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf("--" + n); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true) : d; };
const dryRun = !!opt("dry-run", false);
const inFile = opt("in", null);

// class -> { labels to ADD, whether to archive (remove INBOX) }
const CLASS_MAP = {
  JUNK:         { add: ["Triage/Junk"],      archive: true },
  FYI:          { add: ["Triage/FYI"],       archive: true },
  "NEEDS-YOU":  { add: ["Triage/Needs-You"], archive: false },
  "TO-RESPOND": { add: ["Triage/Needs-You"], archive: false }, // draft script adds Triage/Drafted
};

(async () => {
  const token = await getAccessToken();
  const labelMap = await getLabelMap(token);

  // Ensure the full taxonomy exists up front.
  for (const name of TRIAGE_LABELS) await ensureLabel(token, name, labelMap);

  if (opt("ensure", false)) {
    console.log("✓ Triage labels ready:");
    for (const n of TRIAGE_LABELS) console.log(`   ${n} = ${labelMap[n]}`);
    return;
  }

  if (!inFile || inFile === true) { console.error("✗ Provide --in <decisions.json> (or --ensure)."); process.exit(1); }
  const decisions = JSON.parse(fs.readFileSync(inFile, "utf8"));
  if (!Array.isArray(decisions)) { console.error("✗ decisions file must be a JSON array."); process.exit(1); }

  const tally = { JUNK: 0, FYI: 0, "NEEDS-YOU": 0, "TO-RESPOND": 0, skipped: 0, errors: 0 };
  for (const d of decisions) {
    const map = CLASS_MAP[d.class];
    if (!d.id || !map) { tally.skipped++; console.error(`  ↷ skip ${d.id || "?"} — unknown class ${d.class}`); continue; }
    const addLabelIds = map.add.map((n) => labelMap[n]).filter(Boolean);
    const removeLabelIds = map.archive ? ["INBOX"] : [];
    if (dryRun) {
      console.log(`  [dry] ${d.class.padEnd(10)} ${d.id}  +[${map.add.join(", ")}]${map.archive ? "  -INBOX (archive)" : ""}`);
      tally[d.class]++;
      continue;
    }
    try {
      await gapi(token, `/messages/${d.id}/modify`, {
        method: "POST",
        body: JSON.stringify({ addLabelIds, removeLabelIds }),
      });
      tally[d.class]++;
    } catch (e) {
      tally.errors++;
      console.error(`  ✗ ${d.id}: ${e.message}`);
    }
  }

  const head = dryRun ? "DRY-RUN — no changes made" : "Labels applied";
  console.error(`✓ ${head}: JUNK ${tally.JUNK} (archived), FYI ${tally.FYI} (archived), NEEDS-YOU ${tally["NEEDS-YOU"]}, TO-RESPOND ${tally["TO-RESPOND"]}, skipped ${tally.skipped}, errors ${tally.errors}.`);
})().catch((e) => { console.error("✗", e.message); process.exit(1); });
