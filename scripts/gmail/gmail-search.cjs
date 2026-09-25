// READ-ONLY Gmail search. Lists messages (and optionally drafts) matching a Gmail query.
// Prints date, from/to, subject, snippet and label ids only — never bodies, never secrets.
//
// Usage:
//   node scripts/gmail/gmail-search.cjs --query "in:sent newer_than:10d spencer" [--max 20]
//   node scripts/gmail/gmail-search.cjs --drafts [--query "spencer"]      # list drafts (optionally filtered)
//   GMAIL_ACCOUNT=allthepower node scripts/gmail/gmail-search.cjs --query "..."
const { getAccessToken, gapi } = require("./_lib.cjs");
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf("--" + n); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true) : d; };
const query = opt("query", ""); const max = Number(opt("max", 20)); const drafts = !!opt("drafts", false);
const hdr = (m, n) => (m.payload?.headers || []).find(h => h.name.toLowerCase() === n)?.value || "";
(async () => {
  const token = await getAccessToken();
  if (drafts) {
    const l = await gapi(token, `/drafts?maxResults=${max}${query ? `&q=${encodeURIComponent(query)}` : ""}`);
    const list = l.drafts || [];
    console.log(`drafts matching "${query}": ${list.length}`);
    for (const d of list) {
      const full = await gapi(token, `/drafts/${d.id}?format=metadata&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`);
      const m = full.message || {};
      console.log(`- draft ${d.id} | msg ${m.id} | to: ${hdr(m, "to") || "(none)"} | subject: ${hdr(m, "subject") || "(none)"} | ${(m.snippet || "").slice(0, 120)}`);
    }
    return;
  }
  if (!query) { console.error("✗ Provide --query or --drafts."); process.exit(1); }
  const l = await gapi(token, `/messages?maxResults=${max}&q=${encodeURIComponent(query)}`);
  const list = l.messages || [];
  console.log(`messages matching "${query}": ${l.resultSizeEstimate ?? list.length}`);
  for (const it of list) {
    const m = await gapi(token, `/messages/${it.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`);
    console.log(`- ${hdr(m, "date")} | from: ${hdr(m, "from")} | to: ${hdr(m, "to")} | subject: ${hdr(m, "subject")} | labels: ${(m.labelIds || []).join(",")}\n    ${(m.snippet || "").slice(0, 160)}`);
  }
})().catch(e => { console.error("✗", e.message); process.exit(1); });
