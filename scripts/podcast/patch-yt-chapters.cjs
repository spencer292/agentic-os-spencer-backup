/**
 * Replace the full-episode timestamp block in an episode's YouTube Description
 * doc with the condensed edit's chapters.txt, so P06 uploads the condensed video
 * with chapters that actually match the cut (and start at 00:00, which YouTube
 * requires to render chapters at all).
 *
 * The doc is the source of truth P06 parses — this edits the doc in place via
 * the Docs API, routed through a temp n8n workflow (same mechanism as
 * drive-via-n8n.cjs; we have no local Drive OAuth).
 *
 * Usage:
 *   node scripts/podcast/patch-yt-chapters.cjs <ep>                # auto-find chapters.txt
 *   node scripts/podcast/patch-yt-chapters.cjs <ep> --chapters <path>
 *   node scripts/podcast/patch-yt-chapters.cjs <ep> --dry          # show diff, write nothing
 *
 * Idempotent: if the doc block already matches chapters.txt it exits 0 silently.
 * Run automatically by set-yt-ready.cjs before flipping GATE 3.
 */
const fs = require('fs');
const path = require('path');
const { runTempWorkflow, hookNode, httpNode } = require('../lib/n8n-temp-workflow.cjs');

const ROOT = 'C:/Claude/agent-os-v3/agentic-os';
const env = {};
for (const l of fs.readFileSync(ROOT + '/.env', 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const NOTION = env.NOTION_API_TOKEN || env.NOTION_TOKEN;
const DS = 'a145776d-cf65-4adc-b7ff-72bc971185b9';
const NH = { Authorization: `Bearer ${NOTION}`, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' };

const args = process.argv.slice(2);
const ep = args[0];
const dry = args.includes('--dry');
const chapArg = args.includes('--chapters') ? args[args.indexOf('--chapters') + 1] : null;
if (!ep || !/^\d+$/.test(ep)) { console.log('usage: patch-yt-chapters.cjs <ep> [--chapters <path>] [--dry]'); process.exit(1); }

const TS_LINE = /^-?\s*\d{1,2}:\d{2}(:\d{2})?\s*[-–]\s+/; // "- 09:15 - Title" (doc style)
const CHAP_LINE = /^(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)$/;   // "00:00 Title" (chapters.txt style)

function findChaptersFile() {
  const dir = path.join(ROOT, 'projects', 'vid-condensed-edit');
  const runs = fs.readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    // match "_087-", "_ep87-", "ep87 ", "87_" style run folders for this ep
    .filter(n => new RegExp(`(^|[_\\b])(ep)?0*${ep}[-_ ]`, 'i').test(n))
    .map(n => path.join(dir, n, 'chapters.txt'))
    .filter(fs.existsSync);
  if (!runs.length) return null;
  // newest by mtime wins (a re-cut supersedes)
  runs.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return runs[0];
}

async function docsApi(method, url, jsonBody) {
  const out = await runTempWorkflow({
    apiKey: env.N8N_API_KEY,
    tag: 'ytchap',
    attempts: 6,
    buildNodes: (hookPath) => [
      hookNode(hookPath),
      httpNode({ method, url, jsonBody, id: 'call', name: 'Docs' }),
    ],
    connections: { Hook: { main: [[{ node: 'Docs', type: 'main', index: 0 }]] } },
  });
  return JSON.parse(out);
}

(async () => {
  // 1. chapters.txt
  const chapFile = chapArg || findChaptersFile();
  if (!chapFile) { console.error(`Ep ${ep}: no chapters.txt found under projects/vid-condensed-edit/ — pass --chapters <path>.`); process.exit(1); }
  const chapters = fs.readFileSync(chapFile, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean)
    .map(l => { const m = l.match(CHAP_LINE); return m ? { ts: m[1], title: m[2] } : null; }).filter(Boolean);
  if (chapters.length < 3) { console.error(`Ep ${ep}: only ${chapters.length} chapters in ${chapFile} — need ≥3 (YouTube minimum).`); process.exit(1); }
  if (chapters[0].ts !== '00:00' && chapters[0].ts !== '0:00') { console.error(`Ep ${ep}: first chapter must be 00:00 (got ${chapters[0].ts}) — fix ${chapFile}.`); process.exit(1); }
  const newLines = chapters.map(c => `- ${c.ts} - ${c.title}`);

  // 2. Notion row → doc id
  const r = await fetch(`https://api.notion.com/v1/data_sources/${DS}/query`, {
    method: 'POST', headers: NH,
    body: JSON.stringify({ filter: { property: 'Episode Number', number: { equals: Number(ep) } } }),
  });
  const row = (await r.json()).results?.[0];
  if (!row) { console.error(`Ep ${ep}: no Notion row.`); process.exit(1); }
  const docUrl = row.properties['YouTube Desc Link']?.url || '';
  const docId = (docUrl.match(/\/d\/([A-Za-z0-9_-]+)/) || [])[1];
  if (!docId) { console.error(`Ep ${ep}: no YouTube Desc Link on the row.`); process.exit(1); }

  // 3. Fetch doc, locate the timestamp block
  const doc = await docsApi('GET', `https://docs.googleapis.com/v1/documents/${docId}`);
  const paras = [];
  for (const c of doc.body.content) {
    if (!c.paragraph) continue;
    const text = (c.paragraph.elements || []).map(e => e.textRun?.content || '').join('');
    paras.push({ start: c.startIndex, end: c.endIndex, text });
  }
  const tsParas = paras.filter(p => TS_LINE.test(p.text.trim()));
  if (!tsParas.length) { console.error(`Ep ${ep}: no timestamp block found in the doc (already restructured?). Nothing changed.`); process.exit(1); }
  // contiguous run only — guard against stray timestamp-looking lines elsewhere
  const first = tsParas[0];
  const block = [first];
  for (const p of tsParas.slice(1)) { if (p.start === block[block.length - 1].end) block.push(p); else break; }

  const oldLines = block.map(p => p.text.replace(/\n$/, ''));
  if (oldLines.join('\n') === newLines.join('\n')) { console.log(`Ep ${ep}: doc already matches ${path.basename(path.dirname(chapFile))}/chapters.txt — nothing to do.`); return; }

  console.log(`Ep ${ep}: replacing ${oldLines.length} full-episode timestamp line(s) with ${newLines.length} condensed chapter(s)`);
  console.log('  from: ' + oldLines[0] + (oldLines.length > 1 ? `  … (${oldLines.length} lines)` : ''));
  console.log('  to:   ' + newLines[0] + (newLines.length > 1 ? `  … (${newLines.length} lines)` : ''));
  console.log('  source: ' + chapFile);
  if (dry) { console.log('(dry run — doc not modified)'); return; }

  // 4. Delete the old block, insert the new one at the same position
  const startIndex = block[0].start;
  const endIndex = block[block.length - 1].end; // includes trailing \n
  const res = await docsApi('POST', `https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, JSON.stringify({
    requests: [
      { deleteContentRange: { range: { startIndex, endIndex } } },
      { insertText: { location: { index: startIndex }, text: newLines.join('\n') + '\n' } },
    ],
  }));
  if (res.error) { console.error(`Ep ${ep}: Docs API error — ${JSON.stringify(res.error).slice(0, 300)}`); process.exit(1); }
  console.log(`Ep ${ep}: ✓ doc patched — YouTube description now carries the condensed chapters.`);
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
