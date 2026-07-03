#!/usr/bin/env node
// AREA filing — the "what part of my world is this" layer, orthogonal to Triage/*.
// Applies flat top-level area labels (ATP, Got-Moles, Finance, Marketing, Tech,
// People, Newsletters). Never deletes. Uses batchModify for efficiency.
//
// Modes:
//   --ensure                                   create the area labels, print ids
//   --auto  [--query "in:inbox"] [--dry-run]   rules-driven: tag by area-rules.json (label only, no archive)
//   --file --area Got-Moles --query "..." [--archive] [--dry-run]
//                                              bulk move: tag a whole query into one area (+archive into the folder)
const fs = require("fs");
const path = require("path");
const { getAccessToken, gapi, getLabelMap, ensureLabel } = require("./_lib.cjs");

const RULES = JSON.parse(fs.readFileSync(path.join(__dirname, "area-rules.json"), "utf8"));
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf("--" + n); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true) : d; };
const dryRun = !!opt("dry-run", false);

const h = (H, n) => { const x = (H || []).find((a) => a.name.toLowerCase() === n.toLowerCase()); return x ? x.value : null; };
const parseEmail = (v) => { if (!v) return null; const m = v.match(/<([^>]+)>/); return (m ? m[1] : v).trim().toLowerCase(); };
const domainOf = (e) => (e && e.split("@")[1]) || "";

async function listIds(token, query, cap = 2000) {
  const ids = []; let pt = null;
  do {
    const p = new URLSearchParams({ q: query, maxResults: "500" });
    if (pt) p.set("pageToken", pt);
    const l = await gapi(token, "/messages?" + p.toString());
    for (const m of l.messages || []) ids.push(m.id);
    pt = l.nextPageToken;
  } while (pt && ids.length < cap);
  return ids;
}

// batchModify in chunks of 1000.
async function batchModify(token, ids, addLabelIds, removeLabelIds) {
  for (let i = 0; i < ids.length; i += 1000) {
    await gapi(token, "/messages/batchModify", {
      method: "POST",
      body: JSON.stringify({ ids: ids.slice(i, i + 1000), addLabelIds, removeLabelIds }),
    });
  }
}

function matchArea(fromEmail, subject, self) {
  const dom = domainOf(fromEmail);
  const subj = (subject || "").toLowerCase();
  for (const r of RULES.rules) {
    if (r.senders && r.senders.includes(fromEmail)) return r.area;
    if (r.domains && r.domains.some((d) => dom === d || dom.endsWith("." + d))) return r.area;
    if (r.subjects && r.subjects.some((s) => subj.includes(s))) return r.area;
    if (r.workflowSelf && self && fromEmail === self && /workflow failed/i.test(subj)) return r.area;
  }
  return null;
}

(async () => {
  const token = await getAccessToken();
  const labelMap = await getLabelMap(token);
  for (const a of RULES.areas) await ensureLabel(token, a, labelMap);

  if (opt("ensure", false)) {
    console.log("✓ Area labels ready:");
    for (const a of RULES.areas) console.log(`   ${a} = ${labelMap[a]}`);
    return;
  }

  // ---- bulk move: one query -> one area ----
  if (opt("file", false)) {
    const area = opt("area", null);
    const query = opt("query", null);
    if (!area || area === true || !query || query === true) { console.error("✗ --file needs --area <Name> --query \"<gmail query>\"."); process.exit(1); }
    if (!labelMap[area]) { console.error(`✗ Unknown area "${area}". Known: ${RULES.areas.join(", ")}`); process.exit(1); }
    const archive = !!opt("archive", false);
    const ids = await listIds(token, query);
    console.error(`${dryRun ? "[dry] would file" : "Filing"} ${ids.length} message(s) -> ${area}${archive ? " (+archive out of inbox)" : ""}.`);
    if (!dryRun && ids.length) await batchModify(token, ids, [labelMap[area]], archive ? ["INBOX"] : []);
    console.error(dryRun ? "  (dry-run — nothing changed)" : "✓ Done.");
    return;
  }

  // ---- rules-driven auto-filing (label only; triage owns archiving) ----
  if (opt("auto", false)) {
    const query = (opt("query", null) && opt("query") !== true) ? opt("query") : "in:inbox";
    const self = (await gapi(token, "/profile")).emailAddress.toLowerCase();
    const ids = await listIds(token, query);
    // fetch minimal headers to classify
    const wanted = ["From", "Subject"];
    const buckets = {}; let unmatched = 0;
    for (const id of ids) {
      const hp = new URLSearchParams({ format: "metadata" });
      for (const w of wanted) hp.append("metadataHeaders", w);
      const m = await gapi(token, `/messages/${id}?` + hp.toString());
      const H = m.payload && m.payload.headers;
      const area = matchArea(parseEmail(h(H, "From")), h(H, "Subject"), self);
      if (!area) { unmatched++; continue; }
      (buckets[area] = buckets[area] || []).push(id);
    }
    const lines = Object.entries(buckets).map(([a, v]) => `${a} ${v.length}`).join(", ");
    console.error(`${dryRun ? "[dry] would tag" : "Tagged"}: ${lines || "(none)"}; unmatched ${unmatched} (left for triage/manual).`);
    if (!dryRun) for (const [a, v] of Object.entries(buckets)) await batchModify(token, v, [labelMap[a]], []);
    console.error(dryRun ? "  (dry-run — nothing changed)" : "✓ Done.");
    return;
  }

  console.error("✗ Pick a mode: --ensure | --auto | --file --area <Name> --query \"...\"");
  process.exit(1);
})().catch((e) => { console.error("✗", e.message); process.exit(1); });
