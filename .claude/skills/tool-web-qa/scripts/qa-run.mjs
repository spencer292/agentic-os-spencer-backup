#!/usr/bin/env node
/**
 * tool-web-qa / qa-run.mjs
 *
 * Pre-launch and post-change QA for a website.
 *
 * For every page, at three viewports, it captures a full-page screenshot, records console
 * errors and failed requests, reads the head tags (title, description, canonical, robots,
 * Open Graph, Twitter, favicon, hreflang), counts h1s and collects internal links.
 * It then link-checks every internal link with redirect chains, compares robots.txt against
 * the sitemap, probes the 404 handler, and writes a markdown report next to a screenshots
 * folder. With --baseline it pixel-diffs against a previous run.
 *
 * Dependencies live in this folder only (see package.json + setup.sh). Never at the repo root.
 *
 * Usage:
 *   node qa-run.mjs --base https://example.com
 *   node qa-run.mjs --base http://localhost:3020 --paths /,/score/take,/book
 *   node qa-run.mjs --base https://example.com --limit 5 --out ./out
 *   node qa-run.mjs --base https://example.com --baseline ./previous-run
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/* ----------------------------------------------------------------------- args */

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq > -1) {
        out[a.slice(2, eq)] = a.slice(eq + 1);
      } else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
        out[a.slice(2)] = argv[++i];
      } else {
        out[a.slice(2)] = true;
      }
    } else {
      out._.push(a);
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));

if (args.help || args.h || (!args.base && args._.length === 0)) {
  console.log(`
tool-web-qa

  --base <url>            Base URL. Required. Example: https://example.com
  --paths <list>          Comma separated paths to test. Skips sitemap discovery.
  --sitemap <url>         Sitemap URL override.
  --limit <n>             Max pages when crawling the sitemap. Default 10.
  --out <dir>             Output directory. Default projects/tool-web-qa/{date}_{host}/
  --baseline <dir>        Previous run directory (or its screenshots folder) to diff against.
  --diff-threshold <n>    Changed-pixel ratio that flags a page. Default 0.01 (1%).
  --viewports <list>      Override viewports. Default 390x844,820x1180,1440x900
  --timeout <ms>          Per navigation timeout. Default 30000.
  --link-limit <n>        Max distinct internal links to check. Default 300.
  --user-agent <string>   Override the browser user agent.
  --keep-open             Do not close the browser between pages (slower to recover, faster runs).
  --strict                Exit 1 when any blocker is found.
`);
  process.exit(0);
}

const BASE_RAW = String(args.base || args._[0] || '').trim();
if (!BASE_RAW) {
  console.error('FAIL: --base is required.');
  process.exit(2);
}

let BASE;
try {
  BASE = new URL(BASE_RAW.includes('://') ? BASE_RAW : `https://${BASE_RAW}`);
} catch {
  console.error(`FAIL: --base is not a valid URL: ${BASE_RAW}`);
  process.exit(2);
}
const ORIGIN = BASE.origin;
const IS_HTTPS = BASE.protocol === 'https:';

const VIEWPORTS = String(args.viewports || '390x844,820x1180,1440x900')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean)
  .map((v) => {
    const [w, h] = v.split('x').map(Number);
    return { label: v, width: w, height: h };
  });
const PRIMARY_VIEWPORT = VIEWPORTS[VIEWPORTS.length - 1].label;

const TIMEOUT = Number(args.timeout || 30000);
const PAGE_LIMIT = Number(args.limit || 10);
const LINK_LIMIT = Number(args['link-limit'] || 300);
const DIFF_THRESHOLD = Number(args['diff-threshold'] || 0.01);
const STRICT = Boolean(args.strict);
const UA = args['user-agent'] ? String(args['user-agent']) : undefined;

const TODAY = new Date().toISOString().slice(0, 10);
const HOST_SLUG = BASE.host.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
const OUT_DIR = path.resolve(
  args.out ? String(args.out) : path.join(process.cwd(), 'projects', 'tool-web-qa', `${TODAY}_${HOST_SLUG}`)
);
const SHOTS_DIR = path.join(OUT_DIR, 'screenshots');
const DIFF_DIR = path.join(OUT_DIR, 'diffs');

/* ------------------------------------------------------------------- findings */

const findings = [];
const SEV = { blocker: 'BLOCKER', warn: 'WARN', note: 'NOTE' };
function add(severity, area, message, where = '') {
  findings.push({ severity, area, message, where });
}
function log(msg) {
  process.stdout.write(`${msg}\n`);
}

/* ------------------------------------------------------------------- helpers */

function slugFor(u) {
  const p = new URL(u).pathname.replace(/\/+$/, '');
  if (!p || p === '') return 'home';
  return p.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '').toLowerCase() || 'home';
}

function sameOrigin(u) {
  try {
    return new URL(u).origin === ORIGIN;
  } catch {
    return false;
  }
}

function normaliseUrl(u) {
  try {
    const x = new URL(u);
    x.hash = '';
    if (x.pathname.length > 1 && x.pathname.endsWith('/')) x.pathname = x.pathname.replace(/\/+$/, '');
    return x.toString();
  } catch {
    return null;
  }
}

async function safeFetch(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    return await fetch(url, { redirect: 'manual', signal: ctrl.signal, headers: UA ? { 'user-agent': UA } : {}, ...opts });
  } finally {
    clearTimeout(t);
  }
}

async function fetchText(url) {
  try {
    const res = await fetch(url, { redirect: 'follow', headers: UA ? { 'user-agent': UA } : {} });
    if (!res.ok) return { ok: false, status: res.status, body: '' };
    return { ok: true, status: res.status, body: await res.text() };
  } catch (e) {
    return { ok: false, status: 0, body: '', error: e.message };
  }
}

function mdEscape(s) {
  return String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}

function truncate(s, n) {
  const t = String(s == null ? '' : s);
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}

/* ---------------------------------------------------------- robots + sitemap */

async function readRobots() {
  const url = new URL('/robots.txt', ORIGIN).toString();
  const r = await fetchText(url);
  const out = { url, found: r.ok, status: r.status, body: r.body, sitemaps: [], disallow: [], allow: [] };
  if (!r.ok) return out;
  let inStar = false;
  for (const rawLine of r.body.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    if (key === 'sitemap') out.sitemaps.push(val);
    else if (key === 'user-agent') inStar = val === '*';
    else if (key === 'disallow' && inStar && val) out.disallow.push(val);
    else if (key === 'allow' && inStar && val) out.allow.push(val);
  }
  return out;
}

function locsFrom(xml) {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);
}

async function readSitemap(sitemapUrls) {
  const tried = [];
  const urls = [];
  const queue = [...sitemapUrls];
  let indexed = false;
  while (queue.length && urls.length < 5000) {
    const sm = queue.shift();
    if (tried.includes(sm)) continue;
    tried.push(sm);
    const r = await fetchText(sm);
    if (!r.ok) continue;
    const isIndex = /<sitemapindex/i.test(r.body);
    const locs = locsFrom(r.body);
    if (isIndex) {
      indexed = true;
      for (const l of locs.slice(0, 20)) queue.push(l);
    } else {
      urls.push(...locs);
    }
  }
  return { tried, urls: [...new Set(urls)], indexed };
}

function blockedByRobots(u, robots) {
  let p;
  try {
    p = new URL(u).pathname;
  } catch {
    return false;
  }
  const hit = robots.disallow.find((d) => d === '/' || p.startsWith(d.replace(/\*$/, '')));
  if (!hit) return false;
  const allowed = robots.allow.find((a) => p.startsWith(a.replace(/\*$/, '')));
  return !allowed;
}

/* ----------------------------------------------------------------- link check */

async function checkLink(url) {
  const chain = [];
  let current = url;
  for (let hop = 0; hop < 6; hop++) {
    let res;
    try {
      res = await safeFetch(current, { method: 'HEAD' });
      if (res.status === 405 || res.status === 501 || res.status === 403) {
        res = await safeFetch(current, { method: 'GET' });
      }
    } catch (e) {
      return { url, status: 0, chain, error: e.name === 'AbortError' ? 'timeout' : e.message };
    }
    chain.push({ url: current, status: res.status });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (!loc) return { url, status: res.status, chain, error: 'redirect with no location header' };
      let next;
      try {
        next = new URL(loc, current).toString();
      } catch {
        return { url, status: res.status, chain, error: `bad location header: ${loc}` };
      }
      if (chain.some((c) => c.url === next)) {
        return { url, status: res.status, chain, error: 'redirect loop' };
      }
      current = next;
      continue;
    }
    return { url, status: res.status, chain, finalUrl: current };
  }
  return { url, status: 310, chain, error: 'more than 5 redirect hops' };
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  const workers = new Array(Math.min(limit, items.length || 1)).fill(0).map(async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return results;
}

/* ------------------------------------------------------------- page extractor */

const EXTRACT = () => {
  const q = (s) => document.querySelector(s);
  const attr = (s, a) => (q(s) ? q(s).getAttribute(a) : null);
  const metas = {};
  for (const m of document.querySelectorAll('meta[name], meta[property]')) {
    const k = (m.getAttribute('name') || m.getAttribute('property') || '').toLowerCase();
    if (k && !(k in metas)) metas[k] = m.getAttribute('content');
  }
  const links = [];
  for (const a of document.querySelectorAll('a[href]')) {
    links.push({ href: a.href, raw: a.getAttribute('href'), text: (a.textContent || '').trim().slice(0, 80) });
  }
  const h1s = [...document.querySelectorAll('h1')].map((h) => (h.textContent || '').trim().slice(0, 120));
  const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => Number(h.tagName[1]));
  const imgs = [...document.querySelectorAll('img')];
  const forms = [...document.querySelectorAll('form')].map((f) => ({
    action: f.getAttribute('action') || '',
    method: (f.getAttribute('method') || 'get').toLowerCase(),
    fields: [...f.querySelectorAll('input,select,textarea')]
      .filter((el) => !['submit', 'button', 'image'].includes((el.getAttribute('type') || '').toLowerCase()))
      .map((el) => ({
        name: el.getAttribute('name') || '',
        type: (el.getAttribute('type') || el.tagName).toLowerCase(),
        required: el.hasAttribute('required'),
        hasLabel: Boolean(
          (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) ||
            el.closest('label') ||
            el.getAttribute('aria-label') ||
            el.getAttribute('aria-labelledby')
        ),
        hidden: el.type === 'hidden' || getComputedStyle(el).display === 'none',
      })),
  }));
  return {
    title: document.title || '',
    lang: document.documentElement.getAttribute('lang') || '',
    description: metas['description'] || null,
    robots: metas['robots'] || null,
    canonical: attr('link[rel="canonical"]', 'href'),
    favicon: attr('link[rel~="icon"]', 'href'),
    manifest: attr('link[rel="manifest"]', 'href'),
    hreflang: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => l.getAttribute('hreflang')),
    og: {
      title: metas['og:title'] || null,
      description: metas['og:description'] || null,
      image: metas['og:image'] || null,
      url: metas['og:url'] || null,
      type: metas['og:type'] || null,
    },
    twitter: { card: metas['twitter:card'] || null, image: metas['twitter:image'] || null },
    viewportMeta: metas['viewport'] || null,
    jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].length,
    h1s,
    headingSequence: headings,
    imgCount: imgs.length,
    imgMissingAlt: imgs.filter((i) => !i.hasAttribute('alt')).length,
    imgNoDimensions: imgs.filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).length,
    forms,
    links,
    docHeight: document.documentElement.scrollHeight,
    hScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  };
};

/* -------------------------------------------------------------------- runner */

async function main() {
  let chromium, PNG, pixelmatch;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    try {
      ({ chromium } = await import(pathToFileURL(path.join(HERE, 'node_modules', 'playwright', 'index.js')).href));
    } catch (e) {
      console.error('FAIL: playwright is not installed. Run scripts/setup.sh first.');
      console.error(e.message);
      process.exit(2);
    }
  }

  const wantBaseline = Boolean(args.baseline);
  if (wantBaseline) {
    try {
      ({ PNG } = await import('pngjs'));
      pixelmatch = (await import('pixelmatch')).default;
    } catch (e) {
      add(SEV.warn, 'visual', `Baseline diff skipped, pixelmatch or pngjs missing: ${e.message}`);
    }
  }

  fs.mkdirSync(SHOTS_DIR, { recursive: true });

  /* --- 1. discover pages ------------------------------------------------- */
  const robots = await readRobots();
  if (!robots.found) add(SEV.warn, 'crawl', `No robots.txt at ${robots.url} (status ${robots.status}).`);
  if (robots.found && robots.disallow.includes('/')) {
    add(SEV.blocker, 'crawl', 'robots.txt disallows the whole site for all user agents (Disallow: /).', robots.url);
  }

  let sitemapCandidates = [];
  if (args.sitemap) sitemapCandidates = [String(args.sitemap)];
  else sitemapCandidates = [...robots.sitemaps, new URL('/sitemap.xml', ORIGIN).toString(), new URL('/sitemap_index.xml', ORIGIN).toString()];
  const sitemap = await readSitemap(sitemapCandidates);

  if (robots.found && robots.sitemaps.length === 0) {
    add(SEV.warn, 'crawl', 'robots.txt does not declare a Sitemap: line.', robots.url);
  }
  if (sitemap.urls.length === 0) {
    add(SEV.warn, 'crawl', `No sitemap URLs found. Tried: ${sitemapCandidates.join(', ')}`);
  }

  let pageUrls;
  if (args.paths) {
    pageUrls = String(args.paths)
      .split(',')
      .map((p) => p.trim())
      .map((p) => {
        // Git Bash rewrites a bare "/" argument into the MSYS install root. Catch it.
        if (/^[a-zA-Z]:[\\/]/.test(p) || /Program%20Files|MinGW|msys/i.test(p)) {
          console.error(
            `FAIL: --paths contains "${p}", which is a shell-rewritten path, not a site path.\n` +
              '      Git Bash converts a leading "/" into the MSYS root. Re-run one of these ways:\n' +
              '        MSYS_NO_PATHCONV=1 node qa-run.mjs --base ... --paths "/,/a,/b"\n' +
              '        node qa-run.mjs --base ... --paths ",/a,/b"   (an empty entry means the home page)'
          );
          process.exit(2);
        }
        if (p === '') return new URL('/', ORIGIN).toString();
        return new URL(p, ORIGIN).toString();
      });
  } else if (sitemap.urls.length) {
    pageUrls = sitemap.urls.filter(sameOrigin).slice(0, PAGE_LIMIT);
    if (!pageUrls.length) pageUrls = sitemap.urls.slice(0, PAGE_LIMIT);
  } else {
    pageUrls = [BASE.toString()];
    add(SEV.note, 'crawl', 'Fell back to the base URL alone. Pass --paths to widen the run.');
  }
  pageUrls = [...new Set(pageUrls.map((u) => normaliseUrl(u) || u))];

  log(`base:      ${ORIGIN}`);
  log(`pages:     ${pageUrls.length}`);
  log(`viewports: ${VIEWPORTS.map((v) => v.label).join(', ')}`);
  log(`output:    ${OUT_DIR}`);

  /* --- 2. capture -------------------------------------------------------- */
  const browser = await chromium.launch();
  const pages = [];
  const allInternalLinks = new Set();
  let externalLinkCount = 0;
  const telLinks = new Set();
  const mailtoLinks = new Set();

  for (const url of pageUrls) {
    const slug = slugFor(url);
    const record = { url, slug, viewports: {}, meta: null, status: null, redirectedTo: null };
    log(`\n> ${url}`);

    for (const vp of VIEWPORTS) {
      const consoleErrors = [];
      const pageErrors = [];
      const failedRequests = [];
      const badResponses = [];
      const insecureRequests = [];
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
        userAgent: UA,
        ignoreHTTPSErrors: false,
      });
      const page = await ctx.newPage();

      page.on('console', (m) => {
        if (m.type() === 'error') consoleErrors.push(truncate(m.text(), 300));
      });
      page.on('pageerror', (e) => pageErrors.push(truncate(e.message, 300)));
      page.on('requestfailed', (r) => {
        const f = r.failure();
        failedRequests.push({ url: truncate(r.url(), 160), reason: f ? f.errorText : 'unknown' });
      });
      page.on('response', (r) => {
        if (r.status() >= 400) badResponses.push({ url: truncate(r.url(), 160), status: r.status() });
      });
      page.on('request', (r) => {
        if (IS_HTTPS && r.url().startsWith('http://') && !r.url().startsWith('http://localhost')) {
          insecureRequests.push({ url: truncate(r.url(), 160), type: r.resourceType() });
        }
      });

      let nav = null;
      let navError = null;
      try {
        nav = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
        try {
          await page.waitForLoadState('networkidle', { timeout: 8000 });
        } catch {
          /* networkidle is best effort, long-poll sites never reach it */
        }
      } catch (e) {
        navError = e.message;
      }

      let extracted = null;
      if (!navError) {
        try {
          extracted = await page.evaluate(EXTRACT);
        } catch (e) {
          navError = `extract failed: ${e.message}`;
        }
      }

      const shotDir = path.join(SHOTS_DIR, vp.label);
      fs.mkdirSync(shotDir, { recursive: true });
      const shotPath = path.join(shotDir, `${slug}.png`);
      let shotOk = false;
      if (!navError) {
        try {
          await page.screenshot({ path: shotPath, fullPage: true, animations: 'disabled' });
          shotOk = true;
        } catch (e) {
          add(SEV.warn, 'capture', `Screenshot failed at ${vp.label}: ${e.message}`, url);
        }
      }

      record.viewports[vp.label] = {
        status: nav ? nav.status() : null,
        navError,
        consoleErrors,
        pageErrors,
        failedRequests,
        badResponses,
        insecureRequests,
        shot: shotOk ? path.relative(OUT_DIR, shotPath).replace(/\\/g, '/') : null,
        h1Count: extracted ? extracted.h1s.length : null,
        hScroll: extracted ? extracted.hScroll : null,
        docHeight: extracted ? extracted.docHeight : null,
      };

      if (vp.label === PRIMARY_VIEWPORT) {
        record.meta = extracted;
        record.status = nav ? nav.status() : null;
        if (nav && nav.url() !== url) record.redirectedTo = nav.url();
      }

      if (extracted) {
        for (const l of extracted.links) {
          const href = l.raw || '';
          if (href.startsWith('mailto:')) mailtoLinks.add(href);
          else if (href.startsWith('tel:')) telLinks.add(href);
          else if (href.startsWith('javascript:')) continue;
          else if (sameOrigin(l.href)) {
            const n = normaliseUrl(l.href);
            if (n) allInternalLinks.add(n);
          } else if (/^https?:/i.test(l.href)) externalLinkCount++;
        }
      }

      log(
        `  ${vp.label.padEnd(9)} status ${String(record.viewports[vp.label].status ?? 'ERR').padEnd(4)}` +
          ` console ${String(consoleErrors.length + pageErrors.length).padEnd(3)}` +
          ` failed ${String(failedRequests.length + badResponses.length).padEnd(3)}` +
          (navError ? ` navError: ${truncate(navError, 80)}` : '')
      );

      await ctx.close();
    }
    pages.push(record);
  }

  await browser.close();

  /* --- 3. per page checks ------------------------------------------------ */
  const seenTitles = new Map();
  const seenDescriptions = new Map();

  for (const p of pages) {
    const where = p.url;
    const primary = p.viewports[PRIMARY_VIEWPORT];
    if (primary && primary.navError) {
      add(SEV.blocker, 'page', `Navigation failed: ${primary.navError}`, where);
      continue;
    }
    if (p.status && p.status >= 400) add(SEV.blocker, 'page', `Page returned HTTP ${p.status}.`, where);
    if (p.redirectedTo) add(SEV.warn, 'page', `Redirects to ${p.redirectedTo}. A sitemap or nav URL should be the final URL.`, where);

    const m = p.meta;
    if (!m) continue;

    if (!m.title) add(SEV.blocker, 'seo', 'No title tag.', where);
    else {
      if (m.title.length > 65) add(SEV.note, 'seo', `Title is ${m.title.length} characters and will truncate in most SERPs.`, where);
      const prev = seenTitles.get(m.title);
      if (prev) add(SEV.warn, 'seo', `Duplicate title, also on ${prev}.`, where);
      else seenTitles.set(m.title, where);
    }

    if (!m.description) add(SEV.warn, 'seo', 'No meta description.', where);
    else {
      const prev = seenDescriptions.get(m.description);
      if (prev) add(SEV.warn, 'seo', `Duplicate meta description, also on ${prev}.`, where);
      else seenDescriptions.set(m.description, where);
      if (m.description.length > 165) add(SEV.note, 'seo', `Meta description is ${m.description.length} characters.`, where);
    }

    const robotsMeta = (m.robots || '').toLowerCase();
    if (robotsMeta.includes('noindex')) {
      add(SEV.blocker, 'seo', `meta robots contains noindex ("${m.robots}"). Staging flag left on is the most common launch failure.`, where);
    }
    if (robotsMeta.includes('nofollow')) add(SEV.warn, 'seo', `meta robots contains nofollow ("${m.robots}").`, where);

    if (!m.canonical) {
      add(SEV.warn, 'seo', 'No canonical link.', where);
    } else {
      const canon = normaliseUrl(new URL(m.canonical, where).toString());
      if (canon !== normaliseUrl(where)) {
        add(SEV.warn, 'seo', `Canonical points elsewhere: ${canon}. Confirm that is intended.`, where);
      }
      if (IS_HTTPS && m.canonical.startsWith('http://')) add(SEV.blocker, 'seo', 'Canonical uses http:// on an https:// site.', where);
    }

    if (!m.og.title) add(SEV.warn, 'social', 'No og:title.', where);
    if (!m.og.description) add(SEV.warn, 'social', 'No og:description.', where);
    if (!m.og.image) add(SEV.warn, 'social', 'No og:image. Shared links render as a bare text card.', where);
    if (!m.twitter.card) add(SEV.note, 'social', 'No twitter:card.', where);

    const h1 = m.h1s.length;
    if (h1 === 0) add(SEV.warn, 'structure', 'No h1 on the page.', where);
    else if (h1 > 1) add(SEV.warn, 'structure', `${h1} h1 elements: ${m.h1s.map((t) => `"${truncate(t, 40)}"`).join(', ')}.`, where);

    let prevLevel = 0;
    for (const lvl of m.headingSequence) {
      if (prevLevel && lvl > prevLevel + 1) {
        add(SEV.note, 'a11y', `Heading level jumps from h${prevLevel} to h${lvl}.`, where);
        break;
      }
      prevLevel = lvl;
    }

    if (!m.lang) add(SEV.warn, 'a11y', 'No lang attribute on the html element.', where);
    if (!m.viewportMeta) add(SEV.warn, 'mobile', 'No viewport meta tag.', where);
    if (m.imgMissingAlt > 0) add(SEV.warn, 'a11y', `${m.imgMissingAlt} of ${m.imgCount} images have no alt attribute.`, where);
    if (m.imgNoDimensions > 0) add(SEV.note, 'performance', `${m.imgNoDimensions} of ${m.imgCount} images have no width and height, a layout shift risk.`, where);
    if (!m.favicon) add(SEV.warn, 'brand', 'No favicon link in the head.', where);

    for (const f of m.forms) {
      const visible = f.fields.filter((x) => !x.hidden);
      const unlabelled = visible.filter((x) => !x.hasLabel);
      if (unlabelled.length) {
        add(SEV.warn, 'forms', `Form to "${f.action || '(same page)'}" has ${unlabelled.length} field(s) with no label: ${unlabelled.map((x) => x.name || x.type).join(', ')}.`, where);
      }
      if (visible.length > 5) {
        add(SEV.note, 'forms', `Form to "${f.action || '(same page)'}" has ${visible.length} visible fields. Every field past five costs completion.`, where);
      }
      const honeypot = f.fields.some((x) => x.hidden && /hp|honey|website|url|company_name|bot/i.test(x.name));
      if (!honeypot) add(SEV.note, 'forms', `Form to "${f.action || '(same page)'}" has no obvious honeypot field. See references/form-test-protocol.md.`, where);
    }

    for (const [label, v] of Object.entries(p.viewports)) {
      if (v.hScroll) add(SEV.warn, 'mobile', `Horizontal scroll at ${label}.`, where);
      if (v.consoleErrors.length) add(SEV.warn, 'console', `${v.consoleErrors.length} console error(s) at ${label}: ${truncate(v.consoleErrors[0], 120)}`, where);
      if (v.pageErrors.length) add(SEV.blocker, 'console', `${v.pageErrors.length} uncaught JS exception(s) at ${label}: ${truncate(v.pageErrors[0], 120)}`, where);
      const failFirst = v.failedRequests.filter((r) => sameOrigin(r.url));
      const failThird = v.failedRequests.filter((r) => !sameOrigin(r.url));
      if (failFirst.length) add(SEV.warn, 'network', `${failFirst.length} first-party request(s) failed at ${label}: ${truncate(failFirst[0].url, 100)} (${failFirst[0].reason})`, where);
      if (failThird.length) add(SEV.note, 'network', `${failThird.length} third-party request(s) failed at ${label}, usually ad or analytics beacons blocked by the browser: ${truncate(failThird[0].url, 90)} (${failThird[0].reason})`, where);
      const badFirst = v.badResponses.filter((r) => sameOrigin(r.url));
      const badThird = v.badResponses.filter((r) => !sameOrigin(r.url));
      if (badFirst.length) add(SEV.warn, 'network', `${badFirst.length} first-party request(s) returned 4xx or 5xx at ${label}: ${truncate(badFirst[0].url, 100)} (${badFirst[0].status})`, where);
      if (badThird.length) add(SEV.note, 'network', `${badThird.length} third-party request(s) returned 4xx or 5xx at ${label}: ${truncate(badThird[0].url, 90)} (${badThird[0].status})`, where);
      if (v.insecureRequests.length) {
        const active = v.insecureRequests.filter((r) => ['script', 'stylesheet', 'xhr', 'fetch'].includes(r.type));
        add(active.length ? SEV.blocker : SEV.warn, 'security', `Mixed content at ${label}: ${v.insecureRequests.length} http:// request(s), ${active.length} active. First: ${truncate(v.insecureRequests[0].url, 100)}`, where);
      }
    }

    const h1Counts = new Set(Object.values(p.viewports).map((v) => v.h1Count).filter((x) => x != null));
    if (h1Counts.size > 1) add(SEV.note, 'structure', `h1 count differs by viewport: ${[...h1Counts].join(' vs ')}. Usually a duplicated mobile header.`, where);
  }

  /* --- 4. link check ----------------------------------------------------- */
  const linkList = [...allInternalLinks].sort().slice(0, LINK_LIMIT);
  if (allInternalLinks.size > LINK_LIMIT) {
    add(SEV.note, 'links', `${allInternalLinks.size} distinct internal links found, checking the first ${LINK_LIMIT}. Raise --link-limit to cover the rest.`);
  }
  log(`\nlink check: ${linkList.length} internal links`);
  const linkResults = await mapWithConcurrency(linkList, 6, (u) => checkLink(u));

  for (const r of linkResults) {
    if (!r) continue;
    if (r.error === 'redirect loop') add(SEV.blocker, 'links', 'Redirect loop.', r.url);
    else if (r.status === 0) add(SEV.blocker, 'links', `Request failed: ${r.error}.`, r.url);
    else if (r.status >= 400) add(SEV.blocker, 'links', `Broken internal link, HTTP ${r.status}.`, r.url);
    else if (r.chain.length > 2) add(SEV.warn, 'links', `Redirect chain of ${r.chain.length - 1} hops: ${r.chain.map((c) => c.status).join(' > ')}.`, r.url);
    else if (r.chain.length === 2 && r.chain[0].status === 302) add(SEV.warn, 'links', 'Temporary 302 redirect. Permanent moves should be 301.', r.url);
  }

  /* --- 5. robots vs sitemap --------------------------------------------- */
  const sitemapChecks = [];
  if (sitemap.urls.length) {
    const sample = sitemap.urls.slice(0, Math.min(sitemap.urls.length, Math.max(PAGE_LIMIT, 25)));
    for (const u of sample) {
      if (blockedByRobots(u, robots)) {
        add(SEV.blocker, 'crawl', 'URL is listed in the sitemap and blocked by robots.txt.', u);
      }
      if (IS_HTTPS && u.startsWith('http://')) add(SEV.warn, 'crawl', 'Sitemap lists an http:// URL on an https:// site.', u);
      if (!sameOrigin(u)) add(SEV.warn, 'crawl', `Sitemap lists a URL on another origin (${new URL(u).origin}).`, u);
    }
    const smStatuses = await mapWithConcurrency(sample.slice(0, 25), 6, (u) => checkLink(u));
    for (const r of smStatuses) {
      if (!r) continue;
      if (r.status >= 400 || r.status === 0) add(SEV.blocker, 'crawl', `Sitemap URL returns HTTP ${r.status || 'error'}.`, r.url);
      else if (r.chain.length > 1) add(SEV.warn, 'crawl', `Sitemap URL redirects (${r.chain.map((c) => c.status).join(' > ')}). Sitemaps should list final URLs.`, r.url);
      sitemapChecks.push(r);
    }
    for (const p of pages) {
      if (!p.meta) continue;
      const noindex = (p.meta.robots || '').toLowerCase().includes('noindex');
      const inSitemap = sitemap.urls.some((u) => normaliseUrl(u) === normaliseUrl(p.url));
      if (noindex && inSitemap) add(SEV.blocker, 'crawl', 'Page is noindex and listed in the sitemap.', p.url);
    }
  }

  /* --- 6. 404 handling and TLS ------------------------------------------ */
  const probeUrl = new URL(`/qa-probe-404-${Date.now().toString(36)}`, ORIGIN).toString();
  const probe = await checkLink(probeUrl);
  if (probe.status === 200) add(SEV.warn, 'errors', 'A URL that does not exist returned HTTP 200. That is a soft 404.', probeUrl);
  else if (probe.status !== 404) add(SEV.note, 'errors', `Missing URL returned HTTP ${probe.status} rather than 404.`, probeUrl);

  if (IS_HTTPS) {
    const httpEquivalent = `http://${BASE.host}${BASE.pathname}`;
    const httpRes = await checkLink(httpEquivalent);
    if (httpRes.status >= 200 && httpRes.status < 300 && httpRes.chain.length === 1) {
      add(SEV.blocker, 'security', 'The http:// version serves content directly rather than redirecting to https://.', httpEquivalent);
    } else if (httpRes.chain.length > 1 && httpRes.chain[0].status !== 301) {
      add(SEV.warn, 'security', `http:// redirects with ${httpRes.chain[0].status}. Use a 301.`, httpEquivalent);
    }
    const hstsRes = await safeFetch(BASE.toString(), { method: 'GET', redirect: 'follow' }).catch(() => null);
    if (hstsRes && !hstsRes.headers.get('strict-transport-security')) {
      add(SEV.warn, 'security', 'No Strict-Transport-Security header on the base URL.', ORIGIN);
    }
  } else {
    add(SEV.note, 'security', 'Base URL is http://. Security header and TLS checks are skipped for a local run.');
  }

  /* --- 7. visual regression --------------------------------------------- */
  const diffs = [];
  if (wantBaseline && PNG && pixelmatch) {
    let baseRoot = path.resolve(String(args.baseline));
    if (fs.existsSync(path.join(baseRoot, 'screenshots'))) baseRoot = path.join(baseRoot, 'screenshots');
    fs.mkdirSync(DIFF_DIR, { recursive: true });
    log(`\nvisual diff against ${baseRoot}`);
    for (const p of pages) {
      for (const vp of VIEWPORTS) {
        const rel = path.join(vp.label, `${p.slug}.png`);
        const current = path.join(SHOTS_DIR, rel);
        const before = path.join(baseRoot, rel);
        if (!fs.existsSync(current)) continue;
        if (!fs.existsSync(before)) {
          diffs.push({ page: p.url, viewport: vp.label, state: 'new', ratio: null });
          add(SEV.note, 'visual', `No baseline screenshot at ${vp.label}, treated as a new page.`, p.url);
          continue;
        }
        try {
          const a = PNG.sync.read(fs.readFileSync(before));
          const b = PNG.sync.read(fs.readFileSync(current));
          if (a.width !== b.width) {
            diffs.push({ page: p.url, viewport: vp.label, state: 'width-changed', ratio: null, note: `${a.width}px vs ${b.width}px` });
            add(SEV.warn, 'visual', `Screenshot width changed at ${vp.label}: ${a.width}px vs ${b.width}px.`, p.url);
            continue;
          }
          const h = Math.min(a.height, b.height);
          const heightDelta = Math.abs(a.height - b.height);
          const diff = new PNG({ width: a.width, height: h });
          const changed = pixelmatch(
            cropTo(a, h, PNG).data,
            cropTo(b, h, PNG).data,
            diff.data,
            a.width,
            h,
            { threshold: 0.1 }
          );
          const ratio = changed / (a.width * h);
          const diffPath = path.join(DIFF_DIR, vp.label, `${p.slug}.png`);
          fs.mkdirSync(path.dirname(diffPath), { recursive: true });
          fs.writeFileSync(diffPath, PNG.sync.write(diff));
          const entry = {
            page: p.url,
            viewport: vp.label,
            state: ratio > DIFF_THRESHOLD ? 'changed' : 'same',
            ratio,
            heightDelta,
            diff: path.relative(OUT_DIR, diffPath).replace(/\\/g, '/'),
          };
          diffs.push(entry);
          if (ratio > DIFF_THRESHOLD) {
            add(SEV.warn, 'visual', `${(ratio * 100).toFixed(2)}% of pixels changed at ${vp.label}, over the ${(DIFF_THRESHOLD * 100).toFixed(2)}% threshold.`, p.url);
          }
          if (heightDelta > 100) {
            add(SEV.note, 'visual', `Page height changed by ${heightDelta}px at ${vp.label}.`, p.url);
          }
        } catch (e) {
          add(SEV.note, 'visual', `Diff failed at ${vp.label}: ${e.message}`, p.url);
        }
      }
    }
  }

  /* --- 8. report --------------------------------------------------------- */
  const counts = {
    blocker: findings.filter((f) => f.severity === SEV.blocker).length,
    warn: findings.filter((f) => f.severity === SEV.warn).length,
    note: findings.filter((f) => f.severity === SEV.note).length,
  };
  const verdict = counts.blocker > 0 ? 'DO NOT LAUNCH' : counts.warn > 0 ? 'LAUNCH WITH FIXES' : 'CLEAR';

  const md = buildReport({ pages, findings, counts, verdict, robots, sitemap, linkResults, diffs, externalLinkCount, telLinks, mailtoLinks, probe });
  const reportPath = path.join(OUT_DIR, 'report.md');
  fs.writeFileSync(reportPath, md, 'utf8');
  fs.writeFileSync(
    path.join(OUT_DIR, 'manifest.json'),
    JSON.stringify({ base: ORIGIN, date: TODAY, viewports: VIEWPORTS.map((v) => v.label), pages, findings, counts, verdict, linkResults, diffs }, null, 2),
    'utf8'
  );

  log(`\nverdict:  ${verdict}`);
  log(`blockers: ${counts.blocker}  warnings: ${counts.warn}  notes: ${counts.note}`);
  log(`report:   ${reportPath}`);
  log(`shots:    ${SHOTS_DIR}`);

  if (STRICT && counts.blocker > 0) process.exit(1);
}

function cropTo(png, height, PNG) {
  if (png.height === height) return png;
  const out = new PNG({ width: png.width, height });
  png.bitblt(out, 0, 0, png.width, height, 0, 0);
  return out;
}

/* -------------------------------------------------------------------- report */

function buildReport(d) {
  const L = [];
  const bySeverity = (s) => d.findings.filter((f) => f.severity === s);
  const groupByArea = (list) => {
    const m = new Map();
    for (const f of list) {
      if (!m.has(f.area)) m.set(f.area, []);
      m.get(f.area).push(f);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  };

  L.push(`---`);
  L.push(`site: ${ORIGIN}`);
  L.push(`date: ${TODAY}`);
  L.push(`pages_tested: ${d.pages.length}`);
  L.push(`viewports: ${VIEWPORTS.map((v) => v.label).join(', ')}`);
  L.push(`verdict: ${d.verdict}`);
  L.push(`---`);
  L.push('');
  L.push(`# Web QA report: ${BASE.host}`);
  L.push('');
  L.push(`**Verdict: ${d.verdict}.** ${d.counts.blocker} blocker(s), ${d.counts.warn} warning(s), ${d.counts.note} note(s).`);
  L.push('');
  L.push('| Severity | Count | Meaning |');
  L.push('|---|---|---|');
  L.push(`| Blocker | ${d.counts.blocker} | Fix before the site goes live or the change ships. |`);
  L.push(`| Warning | ${d.counts.warn} | Fix before launch unless a named owner accepts the risk. |`);
  L.push(`| Note | ${d.counts.note} | Log it, schedule it, do not hold the launch for it. |`);
  L.push('');

  for (const [label, sev] of [['Blockers', SEV.blocker], ['Warnings', SEV.warn], ['Notes', SEV.note]]) {
    const list = bySeverity(sev);
    L.push(`## ${label} (${list.length})`);
    L.push('');
    if (!list.length) {
      L.push('None.');
      L.push('');
      continue;
    }
    for (const [area, items] of groupByArea(list)) {
      L.push(`### ${area}`);
      L.push('');
      for (const f of items) {
        L.push(`- ${mdEscape(f.message)}${f.where ? ` \`${f.where}\`` : ''}`);
      }
      L.push('');
    }
  }

  L.push('## Pages');
  L.push('');
  L.push('| Page | Status | Title | Description | Canonical | Robots | h1 | OG image | Console | Failed req |');
  L.push('|---|---|---|---|---|---|---|---|---|---|');
  for (const p of d.pages) {
    const m = p.meta;
    const vsum = Object.values(p.viewports);
    const con = vsum.reduce((n, v) => n + v.consoleErrors.length + v.pageErrors.length, 0);
    const fail = vsum.reduce((n, v) => n + v.failedRequests.length + v.badResponses.length, 0);
    L.push(
      `| \`${new URL(p.url).pathname}\` | ${p.status ?? 'ERR'} | ${m && m.title ? 'yes' : 'MISSING'} | ${m && m.description ? 'yes' : 'MISSING'} | ${m && m.canonical ? 'yes' : 'MISSING'} | ${m && m.robots ? mdEscape(m.robots) : '-'} | ${m ? m.h1s.length : '-'} | ${m && m.og.image ? 'yes' : 'MISSING'} | ${con} | ${fail} |`
    );
  }
  L.push('');

  L.push('### Page detail');
  L.push('');
  for (const p of d.pages) {
    const m = p.meta;
    L.push(`#### ${new URL(p.url).pathname} — ${p.url}`);
    L.push('');
    if (!m) {
      L.push('Page could not be read. See the blockers above.');
      L.push('');
      continue;
    }
    L.push(`- Title: ${m.title ? `"${mdEscape(truncate(m.title, 120))}" (${m.title.length} chars)` : 'MISSING'}`);
    L.push(`- Meta description: ${m.description ? `${m.description.length} chars` : 'MISSING'}`);
    L.push(`- Canonical: ${m.canonical || 'MISSING'}`);
    L.push(`- Meta robots: ${m.robots || 'not set (indexable)'}`);
    L.push(`- h1: ${m.h1s.length}${m.h1s.length ? ` — ${m.h1s.map((t) => `"${mdEscape(truncate(t, 60))}"`).join(', ')}` : ''}`);
    L.push(`- Open Graph: title ${m.og.title ? 'yes' : 'no'}, description ${m.og.description ? 'yes' : 'no'}, image ${m.og.image ? 'yes' : 'no'}`);
    L.push(`- Favicon: ${m.favicon || 'MISSING'}`);
    L.push(`- Images: ${m.imgCount}, ${m.imgMissingAlt} without alt, ${m.imgNoDimensions} without width and height`);
    L.push(`- Forms: ${m.forms.length}${m.forms.length ? ` (${m.forms.map((f) => `${f.fields.filter((x) => !x.hidden).length} visible fields`).join('; ')})` : ''}`);
    L.push(`- JSON-LD blocks: ${m.jsonLd}`);
    L.push('');
    L.push('| Viewport | Status | Console errors | JS exceptions | Failed requests | 4xx/5xx | Horizontal scroll | Screenshot |');
    L.push('|---|---|---|---|---|---|---|---|');
    for (const vp of VIEWPORTS) {
      const v = p.viewports[vp.label];
      if (!v) continue;
      L.push(
        `| ${vp.label} | ${v.status ?? 'ERR'} | ${v.consoleErrors.length} | ${v.pageErrors.length} | ${v.failedRequests.length} | ${v.badResponses.length} | ${v.hScroll ? 'YES' : 'no'} | ${v.shot ? `[png](${v.shot})` : '-'} |`
      );
    }
    L.push('');
    const msgs = [];
    for (const vp of VIEWPORTS) {
      const v = p.viewports[vp.label];
      if (!v) continue;
      for (const c of v.consoleErrors.slice(0, 5)) msgs.push(`${vp.label} console: ${mdEscape(c)}`);
      for (const c of v.pageErrors.slice(0, 5)) msgs.push(`${vp.label} exception: ${mdEscape(c)}`);
      for (const c of v.failedRequests.slice(0, 5)) msgs.push(`${vp.label} failed: ${mdEscape(c.url)} (${c.reason})`);
      for (const c of v.badResponses.slice(0, 5)) msgs.push(`${vp.label} ${c.status}: ${mdEscape(c.url)}`);
    }
    if (msgs.length) {
      L.push('Messages:');
      L.push('');
      for (const s of [...new Set(msgs)].slice(0, 20)) L.push(`- ${s}`);
      L.push('');
    }
  }

  L.push('## Internal link check');
  L.push('');
  const broken = d.linkResults.filter((r) => r && (r.status >= 400 || r.status === 0));
  const redirected = d.linkResults.filter((r) => r && r.chain && r.chain.length > 1 && r.status < 400 && r.status !== 0);
  L.push(`${d.linkResults.length} distinct internal links checked. ${broken.length} broken, ${redirected.length} redirecting, ${d.externalLinkCount} external links found but not checked.`);
  L.push('');
  if (broken.length) {
    L.push('| Broken link | Status | Detail |');
    L.push('|---|---|---|');
    for (const r of broken) L.push(`| \`${r.url}\` | ${r.status || 'error'} | ${mdEscape(r.error || '')} |`);
    L.push('');
  }
  if (redirected.length) {
    L.push('| Redirecting link | Chain | Final |');
    L.push('|---|---|---|');
    for (const r of redirected.slice(0, 60)) {
      L.push(`| \`${r.url}\` | ${r.chain.map((c) => c.status).join(' > ')} | \`${r.finalUrl || ''}\` |`);
    }
    L.push('');
  }
  if (!broken.length && !redirected.length) {
    L.push('No broken links and no redirect chains.');
    L.push('');
  }
  if (d.telLinks.size || d.mailtoLinks.size) {
    L.push(`Contact links found: ${[...d.telLinks].join(', ') || 'no tel: links'} / ${[...d.mailtoLinks].join(', ') || 'no mailto: links'}`);
    L.push('');
  }

  L.push('## robots.txt and sitemap');
  L.push('');
  L.push(`- robots.txt: ${d.robots.found ? `found at ${d.robots.url}` : `NOT FOUND (HTTP ${d.robots.status})`}`);
  L.push(`- Sitemap declared in robots.txt: ${d.robots.sitemaps.length ? d.robots.sitemaps.join(', ') : 'no'}`);
  L.push(`- Disallow rules for all agents: ${d.robots.disallow.length ? d.robots.disallow.map((x) => `\`${x}\``).join(', ') : 'none'}`);
  L.push(`- Sitemap URLs found: ${d.sitemap.urls.length}${d.sitemap.indexed ? ' (via a sitemap index)' : ''}`);
  L.push(`- Sitemap files read: ${d.sitemap.tried.join(', ') || 'none'}`);
  L.push(`- 404 probe: HTTP ${d.probe.status} for a URL that does not exist`);
  L.push('');

  if (d.diffs.length) {
    L.push('## Visual regression');
    L.push('');
    L.push(`Threshold: ${(DIFF_THRESHOLD * 100).toFixed(2)}% of pixels.`);
    L.push('');
    L.push('| Page | Viewport | State | Changed pixels | Height delta | Diff image |');
    L.push('|---|---|---|---|---|---|');
    for (const x of d.diffs) {
      L.push(
        `| \`${new URL(x.page).pathname}\` | ${x.viewport} | ${x.state} | ${x.ratio == null ? '-' : `${(x.ratio * 100).toFixed(2)}%`} | ${x.heightDelta == null ? '-' : `${x.heightDelta}px`} | ${x.diff ? `[png](${x.diff})` : '-'} |`
      );
    }
    L.push('');
  }

  L.push('## Screenshots');
  L.push('');
  L.push('| Page | ' + VIEWPORTS.map((v) => v.label).join(' | ') + ' |');
  L.push('|---|' + VIEWPORTS.map(() => '---').join('|') + '|');
  for (const p of d.pages) {
    L.push(
      `| \`${new URL(p.url).pathname}\` | ` +
        VIEWPORTS.map((v) => {
          const s = p.viewports[v.label];
          return s && s.shot ? `[png](${s.shot})` : '-';
        }).join(' | ') +
        ' |'
    );
  }
  L.push('');
  L.push('## Next');
  L.push('');
  L.push('- Work the blockers first, then the warnings, then re-run this script and diff against this run with `--baseline`.');
  L.push('- Forms are not submitted by this script. Run `references/form-test-protocol.md` by hand for every form listed above.');
  L.push('- Track the wider launch sequence in `references/launch-checklist.md`.');
  L.push('');

  return L.join('\n');
}

main().catch((e) => {
  console.error('FAIL:', e.stack || e.message);
  process.exit(2);
});
