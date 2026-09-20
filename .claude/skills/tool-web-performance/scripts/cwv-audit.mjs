#!/usr/bin/env node
/**
 * tool-web-performance. Core Web Vitals audit via the PageSpeed Insights API v5.
 *
 * Pulls, for every URL and every strategy (mobile + desktop by default):
 *   - FIELD data (CrUX): real Chrome users, 75th percentile, rolling 28-day window.
 *     URL-level when CrUX has enough traffic for that page, plus the origin-level
 *     fallback so a low-traffic page still gets a sitewide reading.
 *   - LAB data (Lighthouse): a single synthetic run on Google's throttled mobile
 *     or desktop profile. Reproducible, but one sample on one network.
 *
 * Field and lab disagree often and legitimately. Field is what Google ranks on.
 * Lab is what tells you which change to make. The report prints both side by side.
 *
 * Node built-ins and global fetch only. Nothing to install.
 *
 * Usage:
 *   node cwv-audit.mjs <url> [<url> ...] [flags]
 *   node cwv-audit.mjs --sitemap https://example.com/sitemap.xml --limit 10 [flags]
 *   node cwv-audit.mjs --from-json ./lh-home-mobile.json --from-json ./lh-home-desktop.json [flags]
 *
 * Flags:
 *   --sitemap <url>     Read URLs from a sitemap or sitemap index instead of argv
 *   --limit <n>         Cap how many sitemap URLs are audited (default 10)
 *   --from-json <path>  Build the report from a local Lighthouse JSON file instead of
 *                       calling the API. Repeatable. Use this when the keyless PageSpeed
 *                       quota is exhausted. Lab only, no field data.
 *   --strategy <list>   mobile | desktop | mobile,desktop   (default mobile,desktop)
 *   --out <path>        Write the markdown report here (default: stdout)
 *   --json <path>       Also write the raw parsed results as JSON
 *   --top <n>           Lighthouse opportunities listed per page (default 5)
 *   --delay <ms>        Pause between API calls (default 1200; raise if throttled)
 *   --retries <n>       Retries per call on 429/5xx (default 3)
 *   --env <path>        Explicit .env file to read PAGESPEED_API_KEY from
 *   --quiet             Suppress progress lines on stderr
 *
 * API key:
 *   Optional. Read from PAGESPEED_API_KEY in the environment or in a .env file
 *   found by walking up from the working directory. Only the NAME is ever printed,
 *   never the value. Without a key the API still answers, just at a much lower
 *   quota, so expect 429s on runs of more than a handful of URLs.
 *
 * Docs checked September 2026:
 *   https://developers.google.com/speed/docs/insights/v5/get-started
 *   https://developers.google.com/speed/docs/insights/rest/v5/pagespeedapi/runpagespeed
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

// ---------------------------------------------------------------- args

const argv = process.argv.slice(2);

function flag(name, fallback = null) {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = argv[i + 1];
  if (v === undefined || v.startsWith('--')) return true;
  return v;
}

function flagAll(name) {
  const out = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] !== `--${name}`) continue;
    const v = argv[i + 1];
    if (v !== undefined && !v.startsWith('--')) out.push(v);
  }
  return out;
}

const FROM_JSON = flagAll('from-json');

const SITEMAP = flag('sitemap', null);
const LIMIT = Number(flag('limit', 10)) || 10;
const OUT = flag('out', null);
const JSON_OUT = flag('json', null);
const TOP = Number(flag('top', 5)) || 5;
const DELAY = Number(flag('delay', 1200)) || 0;
const RETRIES = Number(flag('retries', 3)) || 0;
const ENV_PATH = flag('env', null);
const QUIET = flag('quiet', false) === true;

const STRATEGIES = String(flag('strategy', 'mobile,desktop'))
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter((s) => s === 'mobile' || s === 'desktop');

if (!STRATEGIES.length) STRATEGIES.push('mobile');

const POSITIONAL = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith('--')) {
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) i++;
    continue;
  }
  POSITIONAL.push(a);
}

function log(...a) {
  if (!QUIET) console.error(...a);
}

function die(msg) {
  console.error(msg);
  process.exit(1);
}

// ---------------------------------------------------------------- api key

function readEnvKey() {
  if (process.env.PAGESPEED_API_KEY) return { key: process.env.PAGESPEED_API_KEY, from: 'environment' };

  const candidates = [];
  if (ENV_PATH && typeof ENV_PATH === 'string') candidates.push(path.resolve(ENV_PATH));
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    candidates.push(path.join(dir, '.env'));
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }

  for (const file of candidates) {
    let text;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      if (line.slice(0, eq).trim() !== 'PAGESPEED_API_KEY') continue;
      let val = line.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (val) return { key: val, from: file };
    }
  }
  return { key: null, from: null };
}

const { key: API_KEY, from: KEY_SOURCE } = readEnvKey();

// ---------------------------------------------------------------- thresholds
// Core Web Vitals good/needs-improvement boundaries, verified September 2026.
// Field metrics are judged at the 75th percentile over a rolling 28-day window.

const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000, unit: 'ms', label: 'LCP', core: true },
  INP: { good: 200, poor: 500, unit: 'ms', label: 'INP', core: true },
  CLS: { good: 0.1, poor: 0.25, unit: '', label: 'CLS', core: true },
  TTFB: { good: 800, poor: 1800, unit: 'ms', label: 'TTFB', core: false },
  FCP: { good: 1800, poor: 3000, unit: 'ms', label: 'FCP', core: false },
  TBT: { good: 200, poor: 600, unit: 'ms', label: 'TBT', core: false },
  SI: { good: 3400, poor: 5800, unit: 'ms', label: 'Speed Index', core: false },
};

function verdict(metric, value) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'n/a';
  const t = THRESHOLDS[metric];
  if (!t) return 'n/a';
  if (value <= t.good) return 'PASS';
  if (value <= t.poor) return 'WARN';
  return 'FAIL';
}

function fmt(metric, value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '--';
  if (metric === 'CLS') return value.toFixed(3);
  if (value >= 1000) return `${(value / 1000).toFixed(2)} s`;
  return `${Math.round(value)} ms`;
}

// ---------------------------------------------------------------- fetching

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getJson(url, { retries = RETRIES, timeout = 120000 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { 'User-Agent': 'tool-web-performance/1.0 (+agentic-os)' },
      });
      clearTimeout(timer);
      if (res.status === 429 || res.status >= 500) {
        if (attempt < retries) {
          const wait = 2000 * Math.pow(2, attempt);
          log(`  ${res.status} from the API, retrying in ${wait}ms`);
          await sleep(wait);
          continue;
        }
      }
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = body?.error?.message || `HTTP ${res.status}`;
        return { ok: false, error: msg, status: res.status };
      }
      return { ok: true, data: body };
    } catch (err) {
      clearTimeout(timer);
      if (attempt < retries) {
        const wait = 2000 * Math.pow(2, attempt);
        log(`  ${err.message}, retrying in ${wait}ms`);
        await sleep(wait);
        continue;
      }
      return { ok: false, error: err.message, status: 0 };
    }
  }
  return { ok: false, error: 'exhausted retries', status: 0 };
}

async function getText(url, { timeout = 30000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'tool-web-performance/1.0 (+agentic-os)' },
    });
    clearTimeout(timer);
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true, text: await res.text() };
  } catch (err) {
    clearTimeout(timer);
    return { ok: false, error: err.message };
  }
}

// ---------------------------------------------------------------- sitemap

async function urlsFromSitemap(sitemapUrl, limit) {
  const seen = [];
  const queue = [sitemapUrl];
  const visited = new Set();

  while (queue.length && seen.length < limit) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);

    log(`Reading sitemap ${current}`);
    const res = await getText(current);
    if (!res.ok) {
      log(`  could not read: ${res.error}`);
      continue;
    }

    const isIndex = /<sitemapindex/i.test(res.text);
    const locs = [...res.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);

    if (isIndex) {
      for (const loc of locs) queue.push(loc);
    } else {
      for (const loc of locs) {
        if (seen.length >= limit) break;
        seen.push(loc);
      }
    }
  }
  return seen;
}

// ---------------------------------------------------------------- parsing

const FIELD_KEYS = {
  LARGEST_CONTENTFUL_PAINT_MS: 'LCP',
  INTERACTION_TO_NEXT_PAINT: 'INP',
  CUMULATIVE_LAYOUT_SHIFT_SCORE: 'CLS',
  EXPERIMENTAL_TIME_TO_FIRST_BYTE: 'TTFB',
  FIRST_CONTENTFUL_PAINT_MS: 'FCP',
};

function parseField(block) {
  if (!block || !block.metrics) return null;
  const out = { scope: block.id || null, overall: block.overall_category || null, metrics: {} };
  for (const [apiKey, short] of Object.entries(FIELD_KEYS)) {
    const m = block.metrics[apiKey];
    if (!m || typeof m.percentile !== 'number') continue;
    // CLS is delivered multiplied by 100 so it can travel as an integer.
    out.metrics[short] = short === 'CLS' ? m.percentile / 100 : m.percentile;
  }
  return out;
}

const LAB_AUDITS = {
  'largest-contentful-paint': 'LCP',
  'cumulative-layout-shift': 'CLS',
  'total-blocking-time': 'TBT',
  'server-response-time': 'TTFB',
  'first-contentful-paint': 'FCP',
  'speed-index': 'SI',
};

function parseLab(lh) {
  if (!lh) return null;
  const audits = lh.audits || {};
  const metrics = {};
  for (const [id, short] of Object.entries(LAB_AUDITS)) {
    const a = audits[id];
    if (!a || typeof a.numericValue !== 'number') continue;
    metrics[short] = a.numericValue;
  }

  const score = lh.categories?.performance?.score;

  // Lighthouse 12 shipped "opportunity" audits with details.overallSavingsMs.
  // Lighthouse 13 replaced most of them with "*-insight" audits that carry a
  // metricSavings map instead. Read both so the script survives either version.
  const METRIC_IDS = new Set(Object.keys(LAB_AUDITS).concat(['interactive', 'max-potential-fid', 'first-meaningful-paint']));
  const opportunities = [];
  for (const a of Object.values(audits)) {
    if (!a || typeof a !== 'object' || !a.id) continue;
    if (METRIC_IDS.has(a.id)) continue;
    const failing = a.score !== null && a.score !== undefined && a.score < 0.9;
    if (!failing) continue;

    const ms = a.metricSavings || {};
    const savingsMs = a.details?.overallSavingsMs ?? Math.max(ms.LCP || 0, ms.FCP || 0, ms.TBT || 0, ms.INP || 0);
    const affects = Object.entries(ms)
      .filter(([, v]) => typeof v === 'number' && v > 0)
      .map(([k]) => k);

    opportunities.push({
      id: a.id,
      title: a.title,
      savingsMs: typeof savingsMs === 'number' && savingsMs > 0 ? Math.round(savingsMs) : null,
      savingsBytes: a.details?.overallSavingsBytes ?? null,
      affects,
      displayValue: a.displayValue || null,
    });
  }
  opportunities.sort((a, b) => {
    const d = (b.savingsMs || 0) - (a.savingsMs || 0);
    if (d !== 0) return d;
    return (b.savingsBytes || 0) - (a.savingsBytes || 0);
  });

  // Diagnostics carry no savings number but name the cause behind a failing metric.
  const DIAGNOSTIC_IDS = [
    'mainthread-work-breakdown',
    'bootup-time',
    'long-tasks',
    'layout-shifts',
    'total-byte-weight',
    'dom-size',
    'network-server-latency',
    'forced-reflow-insight',
    'network-dependency-tree-insight',
    'cls-culprits-insight',
    'lcp-discovery-insight',
    'largest-contentful-paint-element',
  ];
  const diagnostics = [];
  for (const id of DIAGNOSTIC_IDS) {
    const a = audits[id];
    if (!a) continue;
    const failing = a.score !== null && a.score !== undefined && a.score < 0.9;
    if (!failing && !a.displayValue) continue;
    diagnostics.push({ id: a.id, title: a.title, displayValue: a.displayValue || null, score: a.score });
  }

  // Third-party entities, the usual INP and TBT culprits.
  const thirdParty = [];
  const tp = audits['third-parties-insight'] || audits['third-party-summary'];
  for (const item of tp?.details?.items || []) {
    const entity = typeof item.entity === 'string' ? item.entity : item.entity?.text;
    if (!entity) continue;
    thirdParty.push({
      entity,
      transferKb: Math.round((item.transferSize || 0) / 1024),
      mainThreadMs: Math.round(item.mainThreadTime || 0),
      blockingMs: Math.round(item.blockingTime || 0),
    });
  }
  thirdParty.sort((a, b) => b.mainThreadMs - a.mainThreadMs);

  let requests = null;
  const nr = audits['network-requests'];
  if (nr?.details?.items) requests = nr.details.items.length;

  return {
    score: typeof score === 'number' ? Math.round(score * 100) : null,
    metrics,
    opportunities,
    diagnostics,
    thirdParty: thirdParty.slice(0, 6),
    requests,
    finalUrl: lh.finalDisplayedUrl || lh.finalUrl || lh.requestedUrl || null,
    lighthouseVersion: lh.lighthouseVersion || null,
    fetchTime: lh.fetchTime || null,
  };
}

function resultFromLighthouseFile(file) {
  const abs = path.resolve(file);
  const lh = JSON.parse(fs.readFileSync(abs, 'utf8'));
  const strategy = (lh.configSettings?.formFactor || lh.configSettings?.emulatedFormFactor || 'unknown').toLowerCase();
  return {
    url: lh.finalDisplayedUrl || lh.finalUrl || lh.requestedUrl || abs,
    strategy,
    analysedAt: lh.fetchTime || null,
    source: 'local Lighthouse run',
    sourceFile: abs,
    field: null,
    origin: null,
    lab: parseLab(lh),
  };
}

// ---------------------------------------------------------------- run

async function auditOne(url, strategy) {
  const api = new URL('https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed');
  api.searchParams.set('url', url);
  api.searchParams.set('strategy', strategy);
  api.searchParams.set('category', 'performance');
  if (API_KEY) api.searchParams.set('key', API_KEY);

  const res = await getJson(api.toString());
  if (!res.ok) return { url, strategy, error: res.error, status: res.status };

  const d = res.data;
  return {
    url,
    strategy,
    analysedAt: d.analysisUTCTimestamp || null,
    field: parseField(d.loadingExperience),
    origin: parseField(d.originLoadingExperience),
    lab: parseLab(d.lighthouseResult),
  };
}

// ---------------------------------------------------------------- report

function pageAnchor(url) {
  try {
    const u = new URL(url);
    return u.pathname === '/' ? `${u.hostname} (home)` : u.pathname;
  } catch {
    return url;
  }
}

function metricRow(name, fieldVal, labVal) {
  const fv = fmt(name, fieldVal);
  const lv = fmt(name, labVal);
  const fverd = verdict(name, fieldVal);
  const lverd = verdict(name, labVal);
  return `| ${THRESHOLDS[name].label} | ${fv} | ${fverd} | ${lv} | ${lverd} |`;
}

function buildReport(results, meta) {
  const lines = [];
  const hosts = [...new Set(results.map((r) => { try { return new URL(r.url).hostname; } catch { return r.url; } }))];

  lines.push(`# Core Web Vitals audit: ${hosts.join(', ')}`);
  lines.push('');
  if (meta.mode) {
    lines.push(`Run ${meta.runAt}. Source: ${meta.mode}. No CrUX field data is available in this mode, so every figure below is a synthetic lab measurement.`);
  } else {
    lines.push(`Run ${meta.runAt}. Source: PageSpeed Insights API v5 (field data from CrUX, lab data from Lighthouse).`);
    lines.push(`API key: ${API_KEY ? `PAGESPEED_API_KEY loaded from ${KEY_SOURCE}` : 'none, so the keyless shared quota applies'}.`);
  }
  lines.push('');
  lines.push('**How to read this.** Field is real Chrome users at the 75th percentile over a rolling 28-day window. That is the number Google ranks on. Lab is one synthetic Lighthouse run on a throttled connection. Lab tells you what to fix, field tells you whether it worked. Lab has no INP figure at all, because INP needs real interactions. Total Blocking Time is the lab stand-in for it.');
  lines.push('');
  lines.push('**Thresholds.** LCP 2.5 s good and 4.0 s poor. INP 200 ms good and 500 ms poor. CLS 0.1 good and 0.25 poor. TTFB 800 ms good. TBT 200 ms good in the lab. PASS is inside good, WARN is between good and poor, FAIL is past poor.');
  lines.push('');

  // ---- summary table
  lines.push('## Summary');
  lines.push('');
  lines.push('| Page | Device | Perf score | Field LCP | Field INP | Field CLS | Field verdict | Lab LCP | Lab CLS | Lab TBT |');
  lines.push('|---|---|---|---|---|---|---|---|---|---|');
  for (const r of results) {
    if (r.error) {
      const brief = /quota/i.test(r.error) ? 'API quota exceeded' : String(r.error).slice(0, 60);
      lines.push(`| ${pageAnchor(r.url)} | ${r.strategy} | error | -- | -- | -- | ${brief} | -- | -- | -- |`);
      continue;
    }
    const f = (r.field && Object.keys(r.field.metrics).length ? r.field : r.origin) || { metrics: {} };
    const usedOrigin = !(r.field && Object.keys(r.field.metrics).length);
    const lcp = f.metrics.LCP ?? null;
    const inp = f.metrics.INP ?? null;
    const cls = f.metrics.CLS ?? null;
    const verdicts = [verdict('LCP', lcp), verdict('INP', inp), verdict('CLS', cls)];
    let overall = 'no field data';
    if (verdicts.some((v) => v !== 'n/a')) {
      overall = verdicts.includes('FAIL') ? 'FAIL' : verdicts.includes('WARN') ? 'WARN' : 'PASS';
      if (usedOrigin) overall += ' (origin)';
    }
    const lm = r.lab?.metrics || {};
    lines.push(
      `| ${pageAnchor(r.url)} | ${r.strategy} | ${r.lab?.score ?? '--'} | ${fmt('LCP', lcp)} | ${fmt('INP', inp)} | ${fmt('CLS', cls)} | ${overall} | ${fmt('LCP', lm.LCP ?? null)} | ${fmt('CLS', lm.CLS ?? null)} | ${fmt('TBT', lm.TBT ?? null)} |`,
    );
  }
  lines.push('');

  // ---- per page detail
  lines.push('## Per page');
  for (const r of results) {
    lines.push('');
    lines.push(`### ${pageAnchor(r.url)}, ${r.strategy}`);
    lines.push('');
    lines.push(`\`${r.url}\``);
    lines.push('');

    if (r.error) {
      lines.push(`Audit failed: ${r.error}`);
      continue;
    }

    const hasUrlField = r.field && Object.keys(r.field.metrics).length > 0;
    const f = hasUrlField ? r.field : r.origin;
    const scopeNote = hasUrlField
      ? 'Field data is URL-level, so it describes this page.'
      : r.origin && Object.keys(r.origin.metrics).length
        ? 'This page has too little Chrome traffic for URL-level CrUX. The field column is origin-level, which is the sitewide average and will hide a slow page.'
        : 'No CrUX field data at either URL or origin level. Lab only.';

    lines.push(scopeNote);
    lines.push('');
    lines.push(`Lighthouse performance score: **${r.lab?.score ?? '--'}/100**.`);
    lines.push('');
    lines.push('| Metric | Field (p75, 28 days) | Field verdict | Lab (single run) | Lab verdict |');
    lines.push('|---|---|---|---|---|');
    const fm = f?.metrics || {};
    const lm = r.lab?.metrics || {};
    lines.push(metricRow('LCP', fm.LCP ?? null, lm.LCP ?? null));
    lines.push(metricRow('INP', fm.INP ?? null, null));
    lines.push(metricRow('CLS', fm.CLS ?? null, lm.CLS ?? null));
    lines.push(metricRow('TTFB', fm.TTFB ?? null, lm.TTFB ?? null));
    lines.push(metricRow('FCP', fm.FCP ?? null, lm.FCP ?? null));
    lines.push(metricRow('TBT', null, lm.TBT ?? null));
    lines.push('');

    const opps = (r.lab?.opportunities || []).slice(0, TOP);
    if (opps.length) {
      lines.push('**Top Lighthouse opportunities**');
      lines.push('');
      lines.push('| Opportunity | Estimated saving | Metrics affected | Detail |');
      lines.push('|---|---|---|---|');
      for (const o of opps) {
        const saving = o.savingsMs !== null ? fmt('LCP', o.savingsMs) : '--';
        lines.push(`| ${o.title} | ${saving} | ${(o.affects || []).join(', ') || '--'} | ${o.displayValue || ''} |`);
      }
      lines.push('');
    }

    const tp = r.lab?.thirdParty || [];
    if (tp.length) {
      lines.push('**Third parties by main-thread time**');
      lines.push('');
      lines.push('| Entity | Main thread | Transfer |');
      lines.push('|---|---|---|');
      for (const t of tp) {
        lines.push(`| ${t.entity} | ${t.mainThreadMs} ms | ${t.transferKb} KiB |`);
      }
      lines.push('');
    }

    const diags = r.lab?.diagnostics || [];
    if (diags.length) {
      lines.push('**Diagnostics**');
      lines.push('');
      for (const d of diags) {
        lines.push(`- ${d.title}${d.displayValue ? `: ${d.displayValue}` : ''}`);
      }
      lines.push('');
    }

    if (r.lab?.requests) lines.push(`Network requests: ${r.lab.requests}.`);
    if (r.lab?.lighthouseVersion) lines.push(`Lighthouse ${r.lab.lighthouseVersion}${r.source ? `, ${r.source}` : ''}.`);
    lines.push('');
  }

  lines.push('');
  lines.push('## Re-measurement');
  lines.push('');
  lines.push('Lab re-runs answer immediately. Field data does not. CrUX reports the 75th percentile over a rolling 28-day window, so a fix shipped today starts entering the window tomorrow and is only fully reflected once 28 days of post-fix traffic have accumulated. Expect the field number to start moving after roughly a week of the new experience and to settle at the four-week mark. Judge a fix on lab and on a real-user-monitoring script first. Confirm it in CrUX after the window turns over.');
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------- main

async function main() {
  // ---- local Lighthouse JSON path (no API call)
  if (FROM_JSON.length) {
    const results = FROM_JSON.map(resultFromLighthouseFile);
    const meta = {
      runAt: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
      strategies: [...new Set(results.map((r) => r.strategy))],
      keyPresent: !!API_KEY,
      mode: 'local Lighthouse JSON, lab only',
    };
    const md = buildReport(results, meta);
    if (JSON_OUT && typeof JSON_OUT === 'string') {
      fs.mkdirSync(path.dirname(path.resolve(JSON_OUT)), { recursive: true });
      fs.writeFileSync(path.resolve(JSON_OUT), JSON.stringify({ meta, results }, null, 2), 'utf8');
      log(`JSON written to ${path.resolve(JSON_OUT)}`);
    }
    if (OUT && typeof OUT === 'string') {
      fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
      fs.writeFileSync(path.resolve(OUT), md, 'utf8');
      log(`Report written to ${path.resolve(OUT)}`);
    } else {
      process.stdout.write(md + '\n');
    }
    return;
  }

  let urls = POSITIONAL.slice();

  if (SITEMAP && typeof SITEMAP === 'string') {
    const found = await urlsFromSitemap(SITEMAP, LIMIT);
    urls = urls.concat(found);
  }

  urls = urls
    .map((u) => (/^https?:\/\//i.test(u) ? u : `https://${u}`))
    .filter((u, i, arr) => arr.indexOf(u) === i)
    .slice(0, SITEMAP ? LIMIT : urls.length);

  if (!urls.length) {
    die('Usage: node cwv-audit.mjs <url> [<url> ...] [--sitemap <url> --limit n] [--strategy mobile,desktop] [--out path] [--json path]');
  }

  log(`Auditing ${urls.length} URL(s) on ${STRATEGIES.join(' + ')}. Key: ${API_KEY ? 'PAGESPEED_API_KEY present' : 'none'}.`);

  const results = [];
  let n = 0;
  const total = urls.length * STRATEGIES.length;
  for (const url of urls) {
    for (const strategy of STRATEGIES) {
      n++;
      log(`[${n}/${total}] ${strategy} ${url}`);
      const r = await auditOne(url, strategy);
      if (r.error) log(`  failed: ${r.error}`);
      results.push(r);
      if (n < total && DELAY) await sleep(DELAY);
    }
  }

  const meta = { runAt: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC', strategies: STRATEGIES, keyPresent: !!API_KEY };
  const md = buildReport(results, meta);

  if (JSON_OUT && typeof JSON_OUT === 'string') {
    fs.mkdirSync(path.dirname(path.resolve(JSON_OUT)), { recursive: true });
    fs.writeFileSync(path.resolve(JSON_OUT), JSON.stringify({ meta, results }, null, 2), 'utf8');
    log(`JSON written to ${path.resolve(JSON_OUT)}`);
  }

  if (OUT && typeof OUT === 'string') {
    fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
    fs.writeFileSync(path.resolve(OUT), md, 'utf8');
    log(`Report written to ${path.resolve(OUT)}`);
  } else {
    process.stdout.write(md + '\n');
  }

  const failed = results.filter((r) => r.error).length;
  if (failed === results.length) process.exit(2);
}

main().catch((err) => {
  console.error(err.stack || String(err));
  process.exit(1);
});
