#!/usr/bin/env node
'use strict';
/**
 * tool-platform-security — static security audit of THIS codebase.
 *
 * Four checks (run all by default, or pick with --checks):
 *   secrets  — hardcoded credentials in tracked + untracked-not-ignored files
 *   history  — secrets committed earlier and still recoverable in git history
 *   deps     — known CVEs via `npm audit` for every package.json with a lockfile
 *   config   — .claude/settings.json permissions, .gitignore coverage,
 *              and any sensitive files tracked by git
 *
 * Pure Node, no external deps. Findings are redacted — a real secret is never
 * written into the report.
 *
 * Usage:
 *   node audit.cjs [--checks secrets,history,deps,config]
 *                  [--root <dir>] [--max-commits 1000]
 *                  [--format md|json] [--out <path>] [--quiet]
 */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const { scanText } = require('./secret-rules.cjs');

// ---------- args ----------
const args = process.argv.slice(2);
function flag(name, def) {
  const i = args.indexOf('--' + name);
  if (i === -1) return def;
  const v = args[i + 1];
  return (v === undefined || v.startsWith('--')) ? true : v;
}
const ROOT = path.resolve(gitTop(flag('root', process.cwd())) || flag('root', process.cwd()));
const CHECKS = String(flag('checks', 'secrets,history,deps,config')).split(',').map(s => s.trim()).filter(Boolean);
const MAX_COMMITS = parseInt(flag('max-commits', '1000'), 10);
const FORMAT = flag('format', 'md');
const QUIET = !!flag('quiet', false);
const OUT = flag('out', null);

function gitTop(cwd) {
  try { return cp.execSync('git rev-parse --show-toplevel', { cwd, encoding: 'utf8' }).trim(); }
  catch { return null; }
}
function git(cmdArgs, opts = {}) {
  return cp.execFileSync('git', cmdArgs, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, ...opts });
}
function log(...a) { if (!QUIET) console.error(...a); }

const SEV_ORDER = { high: 0, medium: 1, low: 2, info: 3 };
const findings = [];        // {check, severity, label, file, line, detail, match}
function add(f) { findings.push(f); }

// ---------- file enumeration (git-aware) ----------
const SKIP_EXT = new Set(['.png','.jpg','.jpeg','.gif','.webp','.ico','.svg','.pdf','.zip','.gz','.tar','.mp4','.mov','.mp3','.wav','.woff','.woff2','.ttf','.eot','.lock','.min.js','.map','.bin','.exe','.dll','.node']);
function listFiles() {
  let tracked = [], untracked = [];
  try { tracked = git(['ls-files']).split('\n').filter(Boolean); } catch {}
  try { untracked = git(['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean); } catch {}
  const all = [...new Set([...tracked, ...untracked])];
  return all.filter(rel => {
    const ext = path.extname(rel).toLowerCase();
    if (SKIP_EXT.has(ext)) return false;
    if (/(^|\/)package-lock\.json$/.test(rel)) return false;
    // never scan the live env files — they are SUPPOSED to hold secrets; scanning
    // them is pointless and re-leaks. We DO scan .env.example below.
    if (/(^|\/)\.env(\.local|\.production)?$/.test(rel)) return false;
    return true;
  });
}

// ---------- check: secrets (working tree) ----------
function checkSecrets() {
  const files = listFiles();
  log(`[secrets] scanning ${files.length} files…`);
  let scanned = 0;
  for (const rel of files) {
    const abs = path.join(ROOT, rel);
    let stat;
    try { stat = fs.statSync(abs); } catch { continue; }
    if (!stat.isFile() || stat.size > 1024 * 1024) continue;     // skip >1MB
    let text;
    try { text = fs.readFileSync(abs, 'utf8'); } catch { continue; }
    if (text.indexOf(String.fromCharCode(0)) !== -1) continue; // binary (null byte)
    scanned++;
    for (const hit of scanText(text, { filename: rel })) {
      add({ check: 'secrets', severity: hit.severity, label: hit.label,
            file: rel, line: hit.line, match: hit.match, detail: hit.context });
    }
  }
  log(`[secrets] scanned ${scanned} text files.`);
}

// ---------- check: git history ----------
function checkHistory() {
  log(`[history] scanning up to ${MAX_COMMITS} commits…`);
  let out;
  try {
    out = git(['log', '--all', '-p', '--no-color', `-n${MAX_COMMITS}`,
               '--', '.', ':(exclude)*.lock', ':(exclude)package-lock.json']);
  } catch (e) {
    add({ check: 'history', severity: 'info', label: 'git history scan skipped', file: null, line: null, match: null, detail: 'Not a git repo or git log failed: ' + e.message });
    return;
  }
  const lines = out.split('\n');
  let commit = null, file = null, seen = new Set();
  for (const raw of lines) {
    if (raw.startsWith('commit ')) { commit = raw.slice(7, 14); continue; }
    if (raw.startsWith('+++ b/')) { file = raw.slice(6); continue; }
    if (raw.startsWith('+') && !raw.startsWith('+++')) {
      const content = raw.slice(1);
      for (const hit of scanText(content, { filename: file })) {
        const key = commit + '|' + file + '|' + hit.match;
        if (seen.has(key)) continue;
        seen.add(key);
        add({ check: 'history', severity: hit.severity === 'high' ? 'high' : 'medium',
              label: hit.label, file, line: null, match: hit.match,
              detail: `commit ${commit}: ${hit.context}` });
      }
    }
  }
  log(`[history] done.`);
}

// ---------- check: dependency CVEs ----------
function checkDeps() {
  let pkgs = [];
  try { pkgs = git(['ls-files', '*package.json']).split('\n').filter(Boolean); } catch {}
  // root package.json may be untracked early on
  if (fs.existsSync(path.join(ROOT, 'package.json')) && !pkgs.includes('package.json')) pkgs.unshift('package.json');
  const dirs = [...new Set(pkgs.filter(p => !p.includes('node_modules')).map(p => path.dirname(p)))];
  log(`[deps] auditing ${dirs.length} package dir(s)…`);
  for (const d of dirs) {
    const abs = path.join(ROOT, d);
    const hasLock = ['package-lock.json', 'npm-shrinkwrap.json'].some(f => fs.existsSync(path.join(abs, f)));
    if (!hasLock) {
      add({ check: 'deps', severity: 'info', label: 'dependency audit skipped (no lockfile)',
            file: path.join(d, 'package.json'), line: null, match: null,
            detail: 'Run `npm install` to generate package-lock.json, then re-audit.' });
      continue;
    }
    let json;
    try {
      const res = cp.execFileSync('npm', ['audit', '--json'], { cwd: abs, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, shell: process.platform === 'win32' });
      json = JSON.parse(res);
    } catch (e) {
      // npm audit exits non-zero when vulns exist — stdout still holds the JSON
      try { json = JSON.parse(e.stdout || '{}'); } catch { json = null; }
      if (!json) { add({ check: 'deps', severity: 'info', label: 'npm audit failed', file: d, line: null, match: null, detail: (e.message || '').slice(0, 200) }); continue; }
    }
    const v = (json.metadata && json.metadata.vulnerabilities) || {};
    const total = v.total || 0;
    if (total === 0) { add({ check: 'deps', severity: 'info', label: 'no known vulnerabilities', file: d || '.', line: null, match: null, detail: 'npm audit clean' }); continue; }
    const sevMap = { critical: 'high', high: 'high', moderate: 'medium', low: 'low', info: 'info' };
    for (const k of ['critical', 'high', 'moderate', 'low']) {
      if (v[k]) add({ check: 'deps', severity: sevMap[k], label: `${v[k]} ${k}-severity dependency vulnerabilit${v[k] === 1 ? 'y' : 'ies'}`, file: path.join(d, 'package.json'), line: null, match: null, detail: `Run \`npm audit\` in ${d || '.'} for the package list. \`npm audit fix\` resolves most.` });
    }
  }
}

// ---------- check: config & permissions ----------
function checkConfig() {
  log('[config] reviewing settings, .gitignore, tracked sensitive files…');

  // 1) tracked sensitive files
  let tracked = [];
  try { tracked = git(['ls-files']).split('\n').filter(Boolean); } catch {}
  const SENSITIVE = [
    { re: /(^|\/)\.env(\.local|\.production)?$/, label: '.env file tracked by git (should be gitignored)' },
    { re: /\.(pem|key|p12|pfx)$/i, label: 'private key / cert file tracked by git' },
    { re: /(^|\/)id_rsa$/, label: 'SSH private key tracked by git' },
    { re: /service[-_]?account.*\.json$/i, label: 'service-account JSON tracked by git' },
    { re: /(^|\/)credentials(\.json)?$/i, label: 'credentials file tracked by git' },
  ];
  for (const f of tracked) {
    for (const s of SENSITIVE) {
      if (s.re.test(f) && !/\.example$/.test(f)) add({ check: 'config', severity: 'high', label: s.label, file: f, line: null, match: null, detail: 'Remove from the index (`git rm --cached`), gitignore it, and rotate anything it contained.' });
    }
  }

  // 2) .gitignore coverage
  const giPath = path.join(ROOT, '.gitignore');
  const gi = fs.existsSync(giPath) ? fs.readFileSync(giPath, 'utf8') : '';
  const NEED = ['.env', '*.pem', '*.key', 'id_rsa', '*.p12'];
  const missing = NEED.filter(p => !gi.split(/\r?\n/).some(l => l.trim() === p || l.trim() === p.replace('*', '')));
  if (!fs.existsSync(giPath)) add({ check: 'config', severity: 'medium', label: 'no .gitignore', file: null, line: null, match: null, detail: 'Add a .gitignore covering .env, *.pem, *.key, id_rsa, *.p12.' });
  else if (missing.length) add({ check: 'config', severity: 'low', label: '.gitignore missing sensitive patterns', file: '.gitignore', line: null, match: null, detail: 'Consider adding: ' + missing.join(', ') });

  // 3) .claude/settings.json permissions
  const sPath = path.join(ROOT, '.claude', 'settings.json');
  if (fs.existsSync(sPath)) {
    let s;
    try { s = JSON.parse(fs.readFileSync(sPath, 'utf8')); } catch { s = null; }
    if (s) {
      const perm = s.permissions || {};
      const allow = perm.allow || [];
      const deny = perm.deny || [];
      const broad = allow.filter(a => a === '*' || /^Bash\(\*\)$/.test(a) || a === 'Bash');
      if (broad.length) add({ check: 'config', severity: 'medium', label: 'overly broad permission allow rule', file: '.claude/settings.json', line: null, match: null, detail: 'Found: ' + broad.join(', ') + ' — prefer scoped allows over wildcards.' });
      const denyStr = JSON.stringify(deny);
      if (!/\.env/.test(denyStr)) add({ check: 'config', severity: 'low', label: 'settings.json deny list does not cover .env reads', file: '.claude/settings.json', line: null, match: null, detail: 'Add a deny rule for reading .env / credential files.' });
      add({ check: 'config', severity: 'info', label: 'permissions reviewed', file: '.claude/settings.json', line: null, match: null, detail: `${allow.length} allow rule(s), ${deny.length} deny rule(s).` });
    }
  } else {
    add({ check: 'config', severity: 'info', label: 'no .claude/settings.json', file: null, line: null, match: null, detail: 'No permission config found.' });
  }
}

// ---------- run ----------
const RUN = { secrets: checkSecrets, history: checkHistory, deps: checkDeps, config: checkConfig };
for (const c of CHECKS) { if (RUN[c]) { try { RUN[c](); } catch (e) { log(`[${c}] error: ${e.message}`); add({ check: c, severity: 'info', label: `${c} check errored`, file: null, line: null, match: null, detail: e.message }); } } }

findings.sort((a, b) => (SEV_ORDER[a.severity] - SEV_ORDER[b.severity]) || String(a.check).localeCompare(b.check) || String(a.file).localeCompare(String(b.file)));

// ---------- report ----------
function counts() {
  const c = { high: 0, medium: 0, low: 0, info: 0 };
  for (const f of findings) c[f.severity]++;
  return c;
}
function stamp() {
  // date passed in via --out or derived from filesystem-free source: use git if possible
  try { return git(['log', '-1', '--format=%cd', '--date=format:%Y-%m-%d']).trim() || 'report'; } catch { return 'report'; }
}
function toMarkdown() {
  const c = counts();
  const lines = [];
  lines.push(`# Platform Security Audit`);
  lines.push('');
  lines.push(`**Repo:** \`${ROOT}\`  `);
  lines.push(`**Checks:** ${CHECKS.join(', ')}  `);
  lines.push(`**Findings:** ${c.high} high · ${c.medium} medium · ${c.low} low · ${c.info} info`);
  lines.push('');
  const real = findings.filter(f => f.severity !== 'info');
  if (!real.length) lines.push('No high/medium/low findings. ✅');
  for (const sev of ['high', 'medium', 'low']) {
    const group = findings.filter(f => f.severity === sev);
    if (!group.length) continue;
    lines.push(`## ${sev.toUpperCase()} (${group.length})`);
    lines.push('');
    lines.push('| Check | Finding | Location | Detail |');
    lines.push('|-------|---------|----------|--------|');
    for (const f of group) {
      const loc = f.file ? `\`${f.file}\`${f.line ? ':' + f.line : ''}` : '—';
      const detail = (f.match ? `\`${f.match}\` — ` : '') + (f.detail || '');
      lines.push(`| ${f.check} | ${f.label} | ${loc} | ${detail.replace(/\|/g, '\\|').slice(0, 300)} |`);
    }
    lines.push('');
  }
  const info = findings.filter(f => f.severity === 'info');
  if (info.length) {
    lines.push('## Info');
    lines.push('');
    for (const f of info) lines.push(`- **${f.label}**${f.file ? ` (\`${f.file}\`)` : ''}: ${f.detail || ''}`);
    lines.push('');
  }
  lines.push('---');
  lines.push('_Generated by tool-platform-security. Secrets are redacted; rotate any flagged credential — assume a redacted match is still a real, compromised secret._');
  return lines.join('\n');
}

const out = FORMAT === 'json'
  ? JSON.stringify({ root: ROOT, checks: CHECKS, counts: counts(), findings: findings.map(({ _raw, ...f }) => f) }, null, 2)
  : toMarkdown();

if (OUT && OUT !== true) {
  fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
  fs.writeFileSync(OUT, out);
  log(`\nReport written to ${path.resolve(OUT)}`);
} else {
  process.stdout.write(out + '\n');
}

const c = counts();
log(`\nDone: ${c.high} high · ${c.medium} medium · ${c.low} low · ${c.info} info`);
process.exit(c.high > 0 ? 2 : 0);
