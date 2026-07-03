#!/usr/bin/env node
'use strict';
/**
 * tool-website-security — passive / non-intrusive live-website security audit.
 *
 * Checks only what a normal browser visit would reveal, plus DNS/TLS lookups.
 * No fuzzing, no payloads, no brute-force enumeration. Safe and legal to run
 * against any site without prior authorization.
 *
 * Built-in Node modules only (https/http/tls/dns) — nothing to install, no curl.
 *
 * Usage:
 *   node scan.cjs <url> [--out <path>] [--format md|json] [--no-paths] [--quiet]
 */

const https = require('https');
const http = require('http');
const tls = require('tls');
const dns = require('dns').promises;
const { URL } = require('url');

const SP = String.fromCharCode(32);   // a space, written via escape to avoid editor NUL traps
const UA = 'tool-website-security/1.0 (passive audit; +https://github.com/agentic-os)';

// ---------- args ----------
const argv = process.argv.slice(2);
function flag(name, def) {
  const i = argv.indexOf('--' + name);
  if (i === -1) return def;
  const v = argv[i + 1];
  return (v === undefined || v.startsWith('--')) ? true : v;
}
let target = argv.find(a => !a.startsWith('--'));
const FORMAT = flag('format', 'md');
const OUT = flag('out', null);
const NO_PATHS = !!flag('no-paths', false);
const QUIET = !!flag('quiet', false);
function log(...a) { if (!QUIET) console.error(...a); }

if (!target) { console.error('Usage: node scan.cjs <url> [--out path] [--format md|json] [--no-paths]'); process.exit(1); }
if (!/^https?:\/\//i.test(target)) target = 'https://' + target;
let base;
try { base = new URL(target); } catch { console.error('Invalid URL: ' + target); process.exit(1); }
const HOST = base.hostname;

const findings = [];
const SEV = { high: 0, medium: 1, low: 2, info: 3 };
function add(severity, category, title, detail) { findings.push({ severity, category, title, detail }); }

// ---------- tiny fetch with manual redirect following ----------
function fetchUrl(urlStr, { method = 'GET', maxRedirects = 5 } = {}) {
  return new Promise((resolve) => {
    let u;
    try { u = new URL(urlStr); } catch { return resolve({ error: 'bad url' }); }
    const mod = u.protocol === 'http:' ? http : https;
    const req = mod.request(u, {
      method,
      headers: { 'User-Agent': UA, 'Accept': '*/*' },
      timeout: 10000,
      rejectUnauthorized: false,   // we want to INSPECT bad certs, not fail on them
    }, (res) => {
      const status = res.statusCode;
      const loc = res.headers.location;
      if (status >= 300 && status < 400 && loc && maxRedirects > 0) {
        res.resume();
        const next = new URL(loc, u).toString();
        return resolve(fetchUrl(next, { method, maxRedirects: maxRedirects - 1 }).then(r => ({ ...r, redirectedFrom: urlStr })));
      }
      let body = ''; let size = 0;
      res.on('data', (c) => { size += c.length; if (size < 250000) body += c.toString('utf8'); });
      res.on('end', () => resolve({ status, headers: res.headers, body, finalUrl: u.toString() }));
    });
    req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }); });
    req.on('error', (e) => resolve({ error: e.message }));
    req.end();
  });
}

// ---------- TLS certificate inspection ----------
function inspectTls(host) {
  return new Promise((resolve) => {
    const socket = tls.connect({ host, port: 443, servername: host, timeout: 10000, rejectUnauthorized: false }, () => {
      const cert = socket.getPeerCertificate();
      const protocol = socket.getProtocol();
      const authorized = socket.authorized;
      const authError = socket.authorizationError;
      socket.end();
      resolve({ cert, protocol, authorized, authError });
    });
    socket.on('timeout', () => { socket.destroy(); resolve({ error: 'timeout' }); });
    socket.on('error', (e) => resolve({ error: e.message }));
  });
}

// ---------- checks ----------
async function checkHttpsRedirect() {
  const r = await fetchUrl('http://' + HOST + '/', { });
  if (r.error) { add('info', 'transport', 'HTTP (port 80) not reachable', 'Could not test HTTP→HTTPS redirect: ' + r.error); return; }
  if (r.finalUrl && r.finalUrl.startsWith('https://')) add('info', 'transport', 'HTTP redirects to HTTPS', 'Good — plain HTTP is upgraded to HTTPS.');
  else add('high', 'transport', 'No HTTP→HTTPS redirect', 'The site serves content over plain HTTP without redirecting to HTTPS. Traffic can be intercepted/modified.');
}

function checkSecurityHeaders(h) {
  const want = [
    { key: 'strict-transport-security', sev: 'medium', name: 'HSTS (Strict-Transport-Security)', why: 'Forces HTTPS for future visits; blocks SSL-strip downgrade attacks.' },
    { key: 'content-security-policy', sev: 'medium', name: 'Content-Security-Policy', why: 'Primary defence against XSS and data injection.' },
    { key: 'x-frame-options', sev: 'low', name: 'X-Frame-Options', why: 'Prevents clickjacking via framing (or use CSP frame-ancestors).' },
    { key: 'x-content-type-options', sev: 'low', name: 'X-Content-Type-Options', why: 'Stops MIME-sniffing (should be "nosniff").' },
    { key: 'referrer-policy', sev: 'low', name: 'Referrer-Policy', why: 'Limits referrer leakage to third parties.' },
    { key: 'permissions-policy', sev: 'low', name: 'Permissions-Policy', why: 'Restricts powerful browser features (camera, geolocation, etc.).' },
  ];
  for (const w of want) {
    if (h[w.key]) add('info', 'headers', w.name + ' present', String(h[w.key]).slice(0, 120));
    else add(w.sev, 'headers', 'Missing ' + w.name, w.why);
  }
  // HSTS quality
  const hsts = h['strict-transport-security'];
  if (hsts) {
    const m = /max-age=(\d+)/i.exec(hsts);
    if (!m || parseInt(m[1], 10) < 15552000) add('low', 'headers', 'HSTS max-age low', 'Recommend max-age ≥ 15552000 (180 days); consider includeSubDomains + preload.');
  }
  // information disclosure
  for (const k of ['server', 'x-powered-by', 'x-aspnet-version', 'x-aspnetmvc-version', 'x-generator']) {
    if (h[k] && /\d/.test(String(h[k]))) add('low', 'disclosure', 'Version disclosure: ' + k, String(h[k]).slice(0, 120) + ' — drop version numbers to avoid fingerprinting known-CVE software.');
    else if (h[k]) add('info', 'disclosure', 'Header reveals stack: ' + k, String(h[k]).slice(0, 120));
  }
}

function checkCookies(h) {
  const cookies = h['set-cookie'];
  if (!cookies || !cookies.length) { add('info', 'cookies', 'No cookies set on this response', 'Nothing to flag.'); return; }
  for (const c of cookies) {
    const name = c.split('=')[0];
    const flags = [];
    if (!/;\s*Secure/i.test(c)) flags.push('Secure');
    if (!/;\s*HttpOnly/i.test(c)) flags.push('HttpOnly');
    if (!/;\s*SameSite/i.test(c)) flags.push('SameSite');
    if (flags.length) add('medium', 'cookies', 'Cookie "' + name + '" missing flags', 'Missing: ' + flags.join(', ') + '. Secure (HTTPS-only), HttpOnly (no JS access), SameSite (CSRF defence).');
    else add('info', 'cookies', 'Cookie "' + name + '" well-flagged', 'Secure + HttpOnly + SameSite present.');
  }
}

async function checkTls() {
  const t = await inspectTls(HOST);
  if (t.error) { add('info', 'tls', 'TLS inspection failed', t.error); return; }
  if (t.protocol && /TLSv1(\.0|\.1)?$/.test(t.protocol)) add('high', 'tls', 'Weak TLS protocol: ' + t.protocol, 'TLS 1.0/1.1 are deprecated and insecure. Require TLS 1.2+.');
  else if (t.protocol) add('info', 'tls', 'TLS protocol ' + t.protocol, 'Modern protocol in use.');
  if (!t.authorized && t.authError) {
    const sev = /SELF_SIGNED|UNABLE_TO_VERIFY|DEPTH_ZERO/i.test(t.authError) ? 'high' : 'medium';
    add(sev, 'tls', 'Certificate not trusted', 'authorizationError: ' + t.authError);
  }
  const cert = t.cert || {};
  if (cert.valid_to) {
    const ms = Date.parse(cert.valid_to) - Date.now();
    const days = Math.round(ms / 86400000);
    if (days < 0) add('high', 'tls', 'Certificate EXPIRED', 'Expired ' + (-days) + ' days ago (' + cert.valid_to + ').');
    else if (days < 15) add('high', 'tls', 'Certificate expiring imminently', days + ' days left (' + cert.valid_to + ').');
    else if (days < 30) add('medium', 'tls', 'Certificate expiring soon', days + ' days left (' + cert.valid_to + ').');
    else add('info', 'tls', 'Certificate valid', days + ' days left; issuer ' + ((cert.issuer && cert.issuer.O) || 'unknown') + '.');
  }
}

function apexDomain(host) {
  // Email auth records (SPF/DMARC) live on the registrable domain, not the www
  // subdomain. Strip a leading www. — good enough without bundling the full
  // public-suffix list. (A deeper subdomain audit would need the PSL.)
  return host.replace(/^www\./i, '');
}
function dnsUnavailable(code) { return /ECONNREFUSED|ETIMEOUT|ETIMEDOUT|ESERVFAIL|EREFUSED|ENOTFOUND/i.test(code || ''); }

async function checkDns() {
  const domain = apexDomain(HOST);
  let dnsDown = false;
  // SPF (on apex)
  try {
    const txt = (await dns.resolveTxt(domain)).map(a => a.join(''));
    const spf = txt.find(r => /^v=spf1/i.test(r));
    if (spf) add('info', 'email', 'SPF record present (' + domain + ')', spf.slice(0, 140));
    else add('low', 'email', 'No SPF record (' + domain + ')', 'Without SPF, attackers can more easily spoof email from this domain.');
  } catch (e) {
    if (dnsUnavailable(e.code)) { dnsDown = true; add('info', 'email', 'Email-auth checks skipped — DNS unavailable', 'DNS lookups failed (' + e.code + ') in this environment. Re-run on a normal network to verify SPF/DMARC — this is NOT a "missing record" finding.'); }
    else add('low', 'email', 'No SPF record (' + domain + ')', 'No TXT/SPF found (' + (e.code || 'lookup failed') + ').');
  }
  // DMARC (on apex)
  if (!dnsDown) {
    try {
      const d = (await dns.resolveTxt('_dmarc.' + domain)).map(a => a.join(''));
      const dmarc = d.find(r => /v=DMARC1/i.test(r));
      if (dmarc) {
        add('info', 'email', 'DMARC record present (' + domain + ')', dmarc.slice(0, 140));
        if (/p=none/i.test(dmarc)) add('low', 'email', 'DMARC policy is p=none', 'Monitoring only — spoofed mail is not rejected. Move toward p=quarantine/reject once aligned.');
      } else add('low', 'email', 'No DMARC policy (' + domain + ')', 'Add a _dmarc TXT record to control spoofing of your domain.');
    } catch (e) {
      if (!dnsUnavailable(e.code)) add('low', 'email', 'No DMARC record (' + domain + ')', 'No _dmarc TXT record found (' + (e.code || 'lookup failed') + ').');
    }
    // MX (informational)
    try { const mx = await dns.resolveMx(domain); if (mx.length) add('info', 'email', 'MX records (' + domain + ')', mx.map(m => m.exchange).slice(0, 3).join(', ')); } catch {}
  }
  add('info', 'email', 'DKIM not checked', 'DKIM needs a selector to look up and cannot be enumerated passively. Verify selectors manually if you manage the domain.');
}

async function checkSecurityTxt() {
  for (const p of ['/.well-known/security.txt', '/security.txt']) {
    const r = await fetchUrl(base.origin + p);
    if (!r.error && r.status === 200) { add('info', 'disclosure', 'security.txt present', 'Found at ' + p + ' (RFC 9116 contact channel).'); return; }
  }
  add('low', 'disclosure', 'No security.txt', 'Optional but recommended (RFC 9116): publish /.well-known/security.txt so researchers can report issues.');
}

async function checkExposedFiles() {
  // A fixed, small, well-known list — NOT enumeration/brute force. Each is a single GET
  // to a publicly-knowable path. Skipped entirely with --no-paths.
  // Each entry has a content SIGNATURE — we only flag a 200 when the body
  // actually looks like the sensitive file. Many hosts (ClickFunnels, SPAs,
  // catch-all routers) return HTTP 200 with a normal page for unknown paths
  // (a "soft 404"); without a signature check every path would false-positive.
  const sensitive = [
    { p: '/.git/config', sev: 'high', sig: /\[core\]|\[remote |repositoryformatversion/i, what: 'Exposed git repo config — source code may be downloadable.' },
    { p: '/.git/HEAD', sev: 'high', sig: /^ref:\s|refs\/heads\//i, what: 'Exposed .git directory — full source history may be reconstructable.' },
    { p: '/.env', sev: 'high', sig: /^[A-Z][A-Z0-9_]{2,}\s*=/m, what: 'Environment file with secrets may be publicly served.' },
    { p: '/server-status', sev: 'medium', sig: /Apache Server Status|Server uptime|requests currently being processed/i, what: 'Apache status page may expose internal request data.' },
    { p: '/phpinfo.php', sev: 'medium', sig: /phpinfo\(\)|<title>PHP \d|PHP Version/i, what: 'phpinfo() leaks server config and paths.' },
    { p: '/.DS_Store', sev: 'low', sig: /Bud1/, what: 'macOS metadata file leaks directory structure.' },
  ];
  for (const s of sensitive) {
    const r = await fetchUrl(base.origin + s.p);
    if (!r.error && r.status === 200 && r.body && s.sig.test(r.body)) {
      add(s.sev, 'exposure', 'Reachable: ' + s.p, s.what + ' (HTTP 200, content confirmed)');
    }
    await new Promise(res => setTimeout(res, 150));   // be polite
  }
}

function checkMixedContentAndFingerprint(r) {
  const h = r.headers || {};
  // tech fingerprint
  const stack = [];
  if (h.server) stack.push('Server: ' + h.server);
  if (h['x-powered-by']) stack.push('X-Powered-By: ' + h['x-powered-by']);
  const gen = /<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)/i.exec(r.body || '');
  if (gen) stack.push('Generator: ' + gen[1]);
  if (/wp-content|wp-includes/i.test(r.body || '')) stack.push('WordPress (paths detected)');
  if (stack.length) add('info', 'fingerprint', 'Technology fingerprint', stack.join(' | ').slice(0, 200));
  // mixed content (only meaningful on https pages)
  if ((r.finalUrl || '').startsWith('https://')) {
    const mixed = (r.body || '').match(/(?:src|href)=["']http:\/\/[^"']+/gi);
    if (mixed && mixed.length) add('medium', 'mixed-content', 'Mixed content (' + mixed.length + ' http:// resources)', 'HTTPS page loads resources over plain HTTP; browsers may block them and it weakens the secure context. Example: ' + mixed[0].slice(0, 80));
  }
}

// ---------- run ----------
(async () => {
  log('Scanning ' + base.origin + ' …');
  const main = await fetchUrl(base.toString());
  if (main.error) {
    add('info', 'transport', 'Could not fetch site', main.error + ' — the rest of the HTTP checks were skipped. TLS/DNS checks still ran below.');
  } else {
    add('info', 'transport', 'Fetched ' + (main.finalUrl || base.toString()), 'HTTP ' + main.status);
    checkSecurityHeaders(main.headers || {});
    checkCookies(main.headers || {});
    checkMixedContentAndFingerprint(main);
  }
  await checkHttpsRedirect();
  await checkTls();
  await checkDns();
  await checkSecurityTxt();
  if (!NO_PATHS) await checkExposedFiles();

  findings.sort((a, b) => (SEV[a.severity] - SEV[b.severity]) || a.category.localeCompare(b.category));
  output();
})();

function counts() { const c = { high: 0, medium: 0, low: 0, info: 0 }; for (const f of findings) c[f.severity]++; return c; }
function grade() {
  const c = counts();
  // Highs dominate; mediums matter; lows are hardening — capped so a handful of
  // best-practice nits can't sink a site with otherwise strong fundamentals.
  const score = Math.max(0, 100 - c.high * 30 - c.medium * 8 - Math.min(c.low * 2, 14));
  let letter = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 55 ? 'D' : 'F';
  // Any high-severity finding (exposed .env/.git, expired/weak TLS, no HTTPS)
  // is a serious problem — never let it sit above a D.
  if (c.high > 0 && 'ABC'.includes(letter)) letter = 'D';
  return { score, letter };
}
function toMarkdown() {
  const c = counts(); const g = grade();
  const L = [];
  L.push('# Website Security Audit — ' + HOST);
  L.push('');
  L.push('**Target:** ' + base.origin + '  ');
  L.push('**Grade:** ' + g.letter + ' (' + g.score + '/100)  ');
  L.push('**Findings:** ' + c.high + ' high · ' + c.medium + ' medium · ' + c.low + ' low · ' + c.info + ' info  ');
  L.push('**Method:** passive / non-intrusive (no fuzzing, no enumeration)');
  L.push('');
  for (const sev of ['high', 'medium', 'low']) {
    const grp = findings.filter(f => f.severity === sev);
    if (!grp.length) continue;
    L.push('## ' + sev.toUpperCase() + ' (' + grp.length + ')');
    L.push('');
    L.push('| Category | Finding | Detail |');
    L.push('|----------|---------|--------|');
    for (const f of grp) L.push('| ' + f.category + ' | ' + f.title + ' | ' + String(f.detail).replace(/\|/g, '\\|').slice(0, 300) + ' |');
    L.push('');
  }
  const info = findings.filter(f => f.severity === 'info');
  if (info.length) { L.push('## Info / Positive'); L.push(''); for (const f of info) L.push('- **' + f.title + '** (' + f.category + '): ' + String(f.detail).slice(0, 200)); L.push(''); }
  L.push('---');
  L.push('_Generated by tool-website-security — passive checks only. A clean result is not a penetration test; it means no issues were visible without active probing._');
  return L.join('\n');
}
function output() {
  const out = FORMAT === 'json'
    ? JSON.stringify({ target: base.origin, host: HOST, grade: grade(), counts: counts(), findings }, null, 2)
    : toMarkdown();
  if (OUT && OUT !== true) {
    const fs = require('fs'); const path = require('path');
    fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
    fs.writeFileSync(OUT, out);
    log('Report written to ' + path.resolve(OUT));
  } else {
    process.stdout.write(out + '\n');
  }
  const c = counts();
  log('Done: ' + c.high + ' high · ' + c.medium + ' medium · ' + c.low + ' low.');
  process.exit(c.high > 0 ? 2 : 0);
}
