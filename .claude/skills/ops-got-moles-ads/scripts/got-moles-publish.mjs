#!/usr/bin/env node
// Curated publish: Roy's working copy (clients/got-moles) -> the client standalone
// repo (agentic-os-got-moles). Copies ONLY the allowlisted paths, refuses any file
// containing secret patterns, never touches per-user/meta files. After running,
// review `git status` in the standalone, commit, push — consumers then `git pull`.
//
// Usage:  node .claude/skills/ops-got-moles-ads/scripts/got-moles-publish.mjs [--dry-run] [extra paths...]
//   --dry-run       show what would be copied, copy nothing
//   extra paths     additional working-copy-relative files/folders to publish once
import fs from 'node:fs';
import path from 'node:path';

// This file lives at clients/got-moles/.claude/skills/ops-got-moles-ads/scripts/,
// so the client root is four levels up.
const SRC = path.resolve(import.meta.dirname, '..', '..', '..', '..');   // clients/got-moles
const DST = path.resolve(SRC, '..', '..', '..', 'agentic-os-got-moles'); // sibling standalone
const DRY = process.argv.includes('--dry-run');
const extra = process.argv.slice(2).filter(a => a !== '--dry-run');

// What ships, working-copy-relative. Shapes are identical for these paths
// (client subfolder root == standalone root), so it's a straight mirror per path.
const ALLOW = [
  '.claude/skills/mkt-authority-content', '.claude/skills/ops-blog-pipeline',
  '.claude/skills/ops-cms-content', '.claude/skills/str-ai-seo-local',
  '.claude/skills/str-authority-strategy', '.claude/skills/str-cro-audit',
  '.claude/skills/str-internal-links', '.claude/skills/str-keyword-strategy',
  '.claude/skills/str-onpage-audit', '.claude/skills/str-question-harvester',
  '.claude/skills/str-security-audit', '.claude/skills/tool-jobber', '.claude/skills/tool-n8n',
  '.claude/skills/tool-optimoroute',
  '.claude/skills/viz-component-library',
  '.claude/skills/viz-design-system', '.claude/skills/viz-page-architect',
  'brand_context',
  ...extra,
];

// Never publish, even if explicitly listed.
const DENY = [
  /(^|\/)\.env/, /(^|\/)context\//, /CLAUDE\.local\.md$/, /SKILL\.local\.md$/,
  /(^|\/)\.planning\//, /got-moles-deployment/, /_gsc-status\.mjs$/, /_gsc-today\.mjs$/,
  /_aio-baseline\.mjs$/, /_push-flip-plan/, /_push-indexing/, /_update-flip-plan/,
  /node_modules/, /\.git\//,
];
const SECRETS = /ntn_[A-Za-z0-9]{20}|GOCSPX-[A-Za-z0-9_-]+|1\/\/0[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{30,}|sk-[A-Za-z0-9]{40,}|xox[bp]-/;
// Files that DOCUMENT secret formats (detection rules/pattern tables) — scan-exempt.
const SCAN_EXEMPT = [/security-patterns\.md$/, /secret-rules\.cjs$/];

let copied = 0, blocked = [], denied = [];
function publish(rel) {
  const from = path.join(SRC, rel);
  if (!fs.existsSync(from)) { console.warn(`skip (missing): ${rel}`); return; }
  const stat = fs.statSync(from);
  if (stat.isDirectory()) {
    for (const e of fs.readdirSync(from)) publish(path.join(rel, e).replace(/\\/g, '/'));
    return;
  }
  if (DENY.some(re => re.test(rel))) { denied.push(rel); return; }
  // secret scan on text-ish files
  if (!SCAN_EXEMPT.some(re => re.test(rel)) && /\.(md|mjs|js|cjs|ts|tsx|json|yaml|yml|sh|ps1|txt|html|css)$/.test(rel)) {
    const body = fs.readFileSync(from, 'utf8');
    if (SECRETS.test(body)) { blocked.push(rel); return; }
  }
  const to = path.join(DST, rel);
  if (!DRY) {
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }
  copied++;
}

for (const p of ALLOW) publish(p);

console.log(`${DRY ? '[dry-run] would copy' : 'copied'}: ${copied} files -> ${DST}`);
if (denied.length) console.log(`denied (never-publish rules): ${denied.length}\n  ` + denied.slice(0, 10).join('\n  '));
if (blocked.length) {
  console.error(`\nBLOCKED — secret patterns found, NOT copied (${blocked.length}):\n  ` + blocked.join('\n  '));
  process.exitCode = 1;
}
if (!DRY) console.log('\nNext: cd to the standalone, review `git status`, commit, push.');
