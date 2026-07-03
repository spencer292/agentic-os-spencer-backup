#!/usr/bin/env node
// str-security-audit — non-destructive external probe.
// Usage: node probe.mjs <domain>   e.g. node probe.mjs got-moles.com
// Covers audit areas 1-5, 7, 9, 11. Dumps a JSON report to stdout.
// All probes are read-only: no form submissions, no state mutation,
// no auth attempts, no payloads beyond standard URL params.

import tls from 'node:tls';

const domain = process.argv[2];
if (!domain) {
  console.error('Usage: node probe.mjs <domain>');
  process.exit(1);
}

const UA = 'Mozilla/5.0 (compatible; str-security-audit/1.0; non-destructive probe)';
const report = { domain, probed_at: new Date().toISOString() };

async function head(url, opts = {}) {
  try {
    const res = await fetch(url, {
      method: opts.method || 'GET',
      redirect: 'manual',
      headers: { 'User-Agent': opts.ua || UA },
      signal: AbortSignal.timeout(15000),
    });
    return {
      status: res.status,
      location: res.headers.get('location'),
      headers: Object.fromEntries(res.headers.entries()),
      body: opts.body ? await res.text() : undefined,
    };
  } catch (e) {
    return { error: e.message };
  }
}

// --- Area 1: Transport / TLS ---
report.transport = {};
report.transport.http_redirect = await head(`http://${domain}/`);
const httpsRoot = await head(`https://${domain}/`, { body: true });
report.transport.https_root_status = httpsRoot.status;
report.transport.hsts = httpsRoot.headers?.['strict-transport-security'] || null;

report.tls = await new Promise((resolve) => {
  const socket = tls.connect(
    { host: domain, port: 443, servername: domain, timeout: 15000 },
    () => {
      const cert = socket.getPeerCertificate(true);
      resolve({
        protocol: socket.getProtocol(),
        cipher: socket.getCipher(),
        cert_subject: cert.subject?.CN,
        cert_issuer: cert.issuer?.O,
        valid_from: cert.valid_from,
        valid_to: cert.valid_to,
      });
      socket.end();
    }
  );
  socket.on('error', (e) => resolve({ error: e.message }));
  socket.on('timeout', () => { socket.destroy(); resolve({ error: 'timeout' }); });
});

// --- Area 2: Security headers (raw dump for the audit to grade) ---
report.headers = httpsRoot.headers || {};
report.csp = {
  enforcing: httpsRoot.headers?.['content-security-policy'] || null,
  report_only: httpsRoot.headers?.['content-security-policy-report-only'] || null,
};

// --- Area 5: Third-party scripts on homepage ---
const scriptOrigins = new Set();
if (httpsRoot.body) {
  const re = /<script[^>]+src=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(httpsRoot.body))) {
    try {
      const u = new URL(m[1], `https://${domain}`);
      if (u.hostname !== domain) scriptOrigins.add(u.hostname);
    } catch { /* relative or malformed — skip */ }
  }
  report.third_party = {
    external_script_origins: [...scriptOrigins],
    iframe_count: (httpsRoot.body.match(/<iframe/gi) || []).length,
    plain_http_refs: (httpsRoot.body.match(/http:\/\/(?!localhost)/gi) || []).length,
  };
}

// --- Area 4: Sensitive paths ---
const sensitivePaths = [
  '/.env', '/.env.local', '/.git/config', '/.git/HEAD', '/package.json',
  '/package-lock.json', '/.aws/credentials', '/phpinfo.php', '/server-status',
  '/.DS_Store', '/config.json', '/backup.zip', '/.well-known/security.txt',
  '/wp-login.php', '/wp-admin/',
];
report.sensitive_paths = {};
for (const p of sensitivePaths) {
  const r = await head(`https://${domain}${p}`);
  report.sensitive_paths[p] = { status: r.status, location: r.location };
}

// --- Area 7 + 11: App-layer + redirect-reflection probes ---
const appProbes = [
  '/?url=https://evil.example.com',
  '/?redirect=https://evil.example.com',
  '/?next=//evil.example.com',
  '/?return_to=https://evil.example.com',
  '/?s=<script>alert(1)</script>',
  "/?id=1'OR'1'='1",
];
report.app_layer = {};
for (const p of appProbes) {
  const r = await head(`https://${domain}${p}`, { body: true });
  const reflected = r.body ? r.body.includes('evil.example.com') || r.body.includes('<script>alert(1)') : null;
  report.app_layer[p] = {
    status: r.status,
    location: r.location,
    param_reflected_in_body: reflected,
    param_reflected_in_location: r.location ? r.location.includes('evil.example.com') : false,
  };
}

// --- Area 9: WAF / bot / rate-limit posture ---
report.waf = {};
for (const ua of ['sqlmap/1.6', 'masscan/1.0']) {
  const r = await head(`https://${domain}/`, { ua });
  report.waf[ua] = r.status;
}
const rapid = await Promise.all(
  Array.from({ length: 8 }, () => head(`https://${domain}/`))
);
report.waf.rapid_8_parallel = rapid.map((r) => r.status);

console.log(JSON.stringify(report, null, 2));
