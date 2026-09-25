#!/usr/bin/env node
/**
 * a11y-audit.mjs — WCAG 2.2 AA automated pass.
 *
 * Runs axe-core through Playwright at a desktop and a mobile viewport, then adds
 * three checks axe does not run by default and that WCAG 2.2 made load-bearing:
 * reflow at 320 CSS px (1.4.10), target size under 24x24 (2.5.8), and whether the
 * stylesheets answer prefers-reduced-motion at all (2.3.3 / 2.2.2 signal).
 *
 * Automation covers roughly a third of the WCAG 2.2 AA criteria. Everything this
 * script cannot see is in references/manual-checklist.md. A clean run is not a
 * conformance claim.
 *
 * Dependencies live in this folder, never the repo root. Run scripts/setup.sh first.
 *
 * Usage:
 *   node a11y-audit.mjs <url> [more urls...] [flags]
 *   node a11y-audit.mjs --sitemap https://example.com/sitemap.xml --limit 10
 *
 * Flags:
 *   --sitemap <url>     Pull page URLs from a sitemap (follows sitemap indexes)
 *   --limit <n>         Max pages from the sitemap (default 10)
 *   --out <path>        Write the markdown report here (default: stdout)
 *   --json <path>       Write the raw JSON result here
 *   --viewport <v>      desktop | mobile | both (default both)
 *   --timeout <ms>      Per-page navigation timeout (default 45000)
 *   --quiet             Suppress progress logging
 *
 * Exit code 2 when any critical or serious violation is found.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

/* ------------------------------------------------------------------ */
/* WCAG 2.2 criterion names. Level A and AA in full, plus the AAA and  */
/* best-practice criteria axe rules occasionally tag.                   */
/* ------------------------------------------------------------------ */

const CRITERIA = {
  '1.1.1': ['Non-text Content', 'A'],
  '1.2.1': ['Audio-only and Video-only (Prerecorded)', 'A'],
  '1.2.2': ['Captions (Prerecorded)', 'A'],
  '1.2.3': ['Audio Description or Media Alternative (Prerecorded)', 'A'],
  '1.2.4': ['Captions (Live)', 'AA'],
  '1.2.5': ['Audio Description (Prerecorded)', 'AA'],
  '1.3.1': ['Info and Relationships', 'A'],
  '1.3.2': ['Meaningful Sequence', 'A'],
  '1.3.3': ['Sensory Characteristics', 'A'],
  '1.3.4': ['Orientation', 'AA'],
  '1.3.5': ['Identify Input Purpose', 'AA'],
  '1.4.1': ['Use of Color', 'A'],
  '1.4.2': ['Audio Control', 'A'],
  '1.4.3': ['Contrast (Minimum)', 'AA'],
  '1.4.4': ['Resize Text', 'AA'],
  '1.4.5': ['Images of Text', 'AA'],
  '1.4.6': ['Contrast (Enhanced)', 'AAA'],
  '1.4.10': ['Reflow', 'AA'],
  '1.4.11': ['Non-text Contrast', 'AA'],
  '1.4.12': ['Text Spacing', 'AA'],
  '1.4.13': ['Content on Hover or Focus', 'AA'],
  '2.1.1': ['Keyboard', 'A'],
  '2.1.2': ['No Keyboard Trap', 'A'],
  '2.1.4': ['Character Key Shortcuts', 'A'],
  '2.2.1': ['Timing Adjustable', 'A'],
  '2.2.2': ['Pause, Stop, Hide', 'A'],
  '2.3.1': ['Three Flashes or Below Threshold', 'A'],
  '2.3.3': ['Animation from Interactions', 'AAA'],
  '2.4.1': ['Bypass Blocks', 'A'],
  '2.4.2': ['Page Titled', 'A'],
  '2.4.3': ['Focus Order', 'A'],
  '2.4.4': ['Link Purpose (In Context)', 'A'],
  '2.4.5': ['Multiple Ways', 'AA'],
  '2.4.6': ['Headings and Labels', 'AA'],
  '2.4.7': ['Focus Visible', 'AA'],
  '2.4.11': ['Focus Not Obscured (Minimum)', 'AA'],
  '2.5.1': ['Pointer Gestures', 'A'],
  '2.5.2': ['Pointer Cancellation', 'A'],
  '2.5.3': ['Label in Name', 'A'],
  '2.5.4': ['Motion Actuation', 'A'],
  '2.5.7': ['Dragging Movements', 'AA'],
  '2.5.8': ['Target Size (Minimum)', 'AA'],
  '3.1.1': ['Language of Page', 'A'],
  '3.1.2': ['Language of Parts', 'AA'],
  '3.2.1': ['On Focus', 'A'],
  '3.2.2': ['On Input', 'A'],
  '3.2.3': ['Consistent Navigation', 'AA'],
  '3.2.4': ['Consistent Identification', 'AA'],
  '3.2.5': ['Change on Request', 'AA'],
  '3.2.6': ['Consistent Help', 'A'],
  '3.3.1': ['Error Identification', 'A'],
  '3.3.2': ['Labels or Instructions', 'A'],
  '3.3.3': ['Error Suggestion', 'AA'],
  '3.3.4': ['Error Prevention (Legal, Financial, Data)', 'AA'],
  '3.3.7': ['Redundant Entry', 'A'],
  '3.3.8': ['Accessible Authentication (Minimum)', 'AA'],
  '4.1.2': ['Name, Role, Value', 'A'],
  '4.1.3': ['Status Messages', 'AA'],
};

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const IMPACT_ORDER = ['critical', 'serious', 'moderate', 'minor', 'unknown'];

const VIEWPORTS = {
  desktop: { name: 'desktop', viewport: { width: 1440, height: 900 } },
  mobile: {
    name: 'mobile',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
};

/* ------------------------------------------------------------------ */
/* Argument parsing                                                    */
/* ------------------------------------------------------------------ */

function parseArgs(argv) {
  const opts = {
    urls: [],
    sitemap: null,
    limit: 10,
    out: null,
    json: null,
    viewport: 'both',
    timeout: 45000,
    quiet: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--sitemap') opts.sitemap = argv[++i];
    else if (a === '--limit') opts.limit = Number(argv[++i]) || 10;
    else if (a === '--out') opts.out = argv[++i];
    else if (a === '--json') opts.json = argv[++i];
    else if (a === '--viewport') opts.viewport = argv[++i];
    else if (a === '--timeout') opts.timeout = Number(argv[++i]) || 45000;
    else if (a === '--quiet') opts.quiet = true;
    else if (a === '--help' || a === '-h') opts.help = true;
    else if (a.startsWith('--')) throw new Error(`Unknown flag: ${a}`);
    else opts.urls.push(normaliseUrl(a));
  }
  return opts;
}

function normaliseUrl(u) {
  if (!/^https?:\/\//i.test(u)) return `https://${u}`;
  return u;
}

/* ------------------------------------------------------------------ */
/* Sitemap                                                             */
/* ------------------------------------------------------------------ */

async function urlsFromSitemap(sitemapUrl, limit, log) {
  const seen = new Set();
  const pages = [];
  const queue = [sitemapUrl];
  let fetched = 0;

  while (queue.length && pages.length < limit && fetched < 20) {
    const current = queue.shift();
    if (seen.has(current)) continue;
    seen.add(current);
    fetched++;
    log(`  fetching sitemap ${current}`);
    let xml;
    try {
      const res = await fetch(current, { headers: { 'user-agent': 'a11y-audit/1.0' } });
      if (!res.ok) {
        log(`  sitemap returned ${res.status}, skipping`);
        continue;
      }
      xml = await res.text();
    } catch (e) {
      log(`  sitemap fetch failed: ${e.message}`);
      continue;
    }
    const isIndex = /<sitemapindex/i.test(xml);
    const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => decodeEntities(m[1]));
    if (isIndex) queue.push(...locs);
    else for (const loc of locs) {
      if (pages.length >= limit) break;
      if (!pages.includes(loc)) pages.push(loc);
    }
  }
  return pages;
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/* ------------------------------------------------------------------ */
/* Criterion mapping                                                   */
/* ------------------------------------------------------------------ */

function criteriaFromTags(tags = []) {
  const out = [];
  for (const t of tags) {
    const m = /^wcag(\d)(\d)(\d{1,2})$/.exec(t);
    if (!m) continue;
    const id = `${m[1]}.${m[2]}.${Number(m[3])}`;
    if (!out.includes(id)) out.push(id);
  }
  return out;
}

function criterionLabel(id) {
  const c = CRITERIA[id];
  return c ? `${id} ${c[0]} (${c[1]})` : id;
}

function criteriaLabelList(ids) {
  if (!ids.length) return 'best practice, no criterion';
  return ids.map(criterionLabel).join('; ');
}

/* ------------------------------------------------------------------ */
/* Supplementary in-page checks                                        */
/* ------------------------------------------------------------------ */

const TARGET_SIZE_JS = () => {
  const cssPath = (el) => {
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && parts.length < 4) {
      let part = node.tagName.toLowerCase();
      if (node.id) {
        parts.unshift(`${part}#${node.id}`);
        break;
      }
      const cls = (node.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean)[0];
      if (cls) part += `.${cls}`;
      parts.unshift(part);
      node = node.parentElement;
    }
    return parts.join(' > ');
  };
  const sel = [
    'a[href]', 'button', 'input:not([type="hidden"])', 'select', 'textarea', 'summary',
    '[role="button"]', '[role="link"]', '[role="checkbox"]', '[role="radio"]',
    '[role="tab"]', '[role="menuitem"]', '[role="switch"]', '[tabindex]:not([tabindex="-1"])',
  ].join(',');
  const out = [];
  for (const el of document.querySelectorAll(sel)) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') continue;
    // 2.5.8 exempts targets inline in a sentence or block of text.
    if (cs.display.startsWith('inline') && el.closest('p, li, td, dd, blockquote, h1, h2, h3, h4, h5, h6')) continue;
    if (r.width < 24 || r.height < 24) {
      out.push({
        width: Math.round(r.width),
        height: Math.round(r.height),
        tag: el.tagName.toLowerCase(),
        label: (el.getAttribute('aria-label') || el.textContent || el.getAttribute('title') || '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 60),
        selector: cssPath(el),
      });
    }
  }
  return out.slice(0, 40);
};

const MOTION_JS = () => {
  let honoursReducedMotion = false;
  let readableSheets = 0;
  let blockedSheets = 0;
  for (const sheet of Array.from(document.styleSheets)) {
    let rules;
    try {
      rules = sheet.cssRules;
      readableSheets++;
    } catch {
      blockedSheets++;
      continue;
    }
    const walk = (list) => {
      for (const rule of Array.from(list || [])) {
        const cond = rule.conditionText || (rule.media && rule.media.mediaText) || '';
        if (/prefers-reduced-motion/i.test(cond)) honoursReducedMotion = true;
        if (rule.cssRules) walk(rule.cssRules);
      }
    };
    walk(rules);
  }
  let animated = 0;
  for (const el of document.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if ((cs.animationName && cs.animationName !== 'none') || parseFloat(cs.transitionDuration) > 0) animated++;
    if (animated > 200) break;
  }
  return { honoursReducedMotion, animatedElements: animated, readableSheets, blockedSheets };
};

const STRUCTURE_JS = () => {
  const h = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((el) => Number(el.tagName[1]));
  return {
    title: document.title || '',
    lang: document.documentElement.getAttribute('lang') || '',
    h1Count: document.querySelectorAll('h1').length,
    headingLevels: h,
    landmarks: {
      main: document.querySelectorAll('main, [role="main"]').length,
      nav: document.querySelectorAll('nav, [role="navigation"]').length,
      header: document.querySelectorAll('header, [role="banner"]').length,
      footer: document.querySelectorAll('footer, [role="contentinfo"]').length,
    },
    forms: document.querySelectorAll('form').length,
    inputs: document.querySelectorAll('input:not([type="hidden"]), select, textarea').length,
    inputsWithAutocomplete: document.querySelectorAll('input[autocomplete]:not([autocomplete="off"])').length,
    videos: document.querySelectorAll('video').length,
    videosWithTrack: document.querySelectorAll('video track[kind="captions"], video track[kind="subtitles"]').length,
    iframes: document.querySelectorAll('iframe').length,
    pdfLinks: [...document.querySelectorAll('a[href$=".pdf"], a[href*=".pdf?"]')].length,
  };
};

/* ------------------------------------------------------------------ */
/* Audit one page                                                      */
/* ------------------------------------------------------------------ */

async function auditPage(browser, AxeBuilder, url, viewportKeys, timeout, log) {
  const result = { url, viewports: {}, errors: [] };

  for (const key of viewportKeys) {
    const cfg = VIEWPORTS[key];
    log(`  ${key} viewport`);
    const context = await browser.newContext({
      viewport: cfg.viewport,
      deviceScaleFactor: cfg.deviceScaleFactor,
      isMobile: cfg.isMobile,
      hasTouch: cfg.hasTouch,
      ignoreHTTPSErrors: true,
      reducedMotion: 'no-preference',
    });
    const page = await context.newPage();
    try {
      const response = await page.goto(url, { waitUntil: 'load', timeout });
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
      const axe = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();

      const view = {
        status: response ? response.status() : null,
        violations: axe.violations.map(summariseRule),
        incomplete: axe.incomplete.map(summariseRule),
        passCount: axe.passes.length,
        inapplicableCount: axe.inapplicable.length,
        structure: await page.evaluate(STRUCTURE_JS),
        motion: await page.evaluate(MOTION_JS),
      };

      if (key === 'mobile') {
        view.smallTargets = await page.evaluate(TARGET_SIZE_JS);
        await page.setViewportSize({ width: 320, height: 640 });
        await page.waitForTimeout(400);
        view.reflow = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        view.reflow.horizontalScroll = view.reflow.scrollWidth > view.reflow.clientWidth + 2;
      }

      result.viewports[key] = view;
    } catch (e) {
      result.errors.push(`${key}: ${e.message.split('\n')[0]}`);
      log(`  ${key} failed: ${e.message.split('\n')[0]}`);
    } finally {
      await context.close();
    }
  }
  return result;
}

function summariseRule(v) {
  const criteria = criteriaFromTags(v.tags);
  return {
    id: v.id,
    impact: v.impact || 'unknown',
    help: v.help,
    description: v.description,
    helpUrl: v.helpUrl,
    criteria,
    nodeCount: v.nodes.length,
    nodes: v.nodes.slice(0, 5).map((n) => ({
      target: Array.isArray(n.target) ? n.target.join(' ') : String(n.target),
      html: (n.html || '').replace(/\s+/g, ' ').slice(0, 200),
      summary: (n.failureSummary || '').replace(/\s+/g, ' ').slice(0, 300),
    })),
  };
}

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

/**
 * Roll rule failures up across pages and viewports.
 *
 * The same element fails at both viewports, so node counts must not be summed
 * across viewports. Per page the count is the worst single viewport, and the
 * page counts are then added. `key` picks violations or incomplete results.
 */
function rollUp(pages, key) {
  const byRule = new Map();
  for (const p of pages) {
    for (const [vk, view] of Object.entries(p.viewports)) {
      for (const v of view[key]) {
        let entry = byRule.get(v.id);
        if (!entry) {
          entry = { ...v, pages: new Set(), viewports: new Set(), perPage: new Map(), example: v.nodes[0] };
          byRule.set(v.id, entry);
        }
        entry.pages.add(p.url);
        entry.viewports.add(vk);
        entry.perPage.set(p.url, Math.max(entry.perPage.get(p.url) || 0, v.nodeCount));
        if (!entry.example && v.nodes[0]) entry.example = v.nodes[0];
        // Keep the worst impact axe reported for the rule at any viewport.
        if (IMPACT_ORDER.indexOf(v.impact) < IMPACT_ORDER.indexOf(entry.impact)) entry.impact = v.impact;
      }
    }
  }
  for (const entry of byRule.values()) {
    entry.totalNodes = [...entry.perPage.values()].reduce((a, b) => a + b, 0);
  }
  return [...byRule.values()].sort(
    (a, b) => IMPACT_ORDER.indexOf(a.impact) - IMPACT_ORDER.indexOf(b.impact) || b.totalNodes - a.totalNodes,
  );
}

function collectFindings(pages) {
  return rollUp(pages, 'violations');
}

function collectIncomplete(pages) {
  return rollUp(pages, 'incomplete');
}

function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}

function failedCriteria(findings) {
  const map = new Map();
  for (const f of findings) {
    for (const id of f.criteria) {
      const e = map.get(id) || { id, rules: new Set(), worst: 'unknown' };
      e.rules.add(f.id);
      if (IMPACT_ORDER.indexOf(f.impact) < IMPACT_ORDER.indexOf(e.worst)) e.worst = f.impact;
      map.set(id, e);
    }
  }
  return [...map.values()].sort((a, b) => cmpCriterion(a.id, b.id));
}

function cmpCriterion(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  return 0;
}

function escapePipes(s) {
  return String(s).replace(/\|/g, '\\|');
}

function buildMarkdown(pages, opts, meta) {
  const findings = collectFindings(pages);
  const incomplete = collectIncomplete(pages);
  const failed = failedCriteria(findings);
  const counts = Object.fromEntries(IMPACT_ORDER.map((i) => [i, findings.filter((f) => f.impact === i).length]));

  const reflowFails = pages.filter((p) => p.viewports.mobile?.reflow?.horizontalScroll);
  const targetFails = pages.filter((p) => (p.viewports.mobile?.smallTargets || []).length > 0);
  const noReducedMotion = pages.filter((p) => {
    const m = p.viewports.desktop?.motion || p.viewports.mobile?.motion;
    return m && !m.honoursReducedMotion && m.animatedElements > 0;
  });

  const L = [];
  L.push('---');
  L.push(`standard: WCAG 2.2 AA`);
  L.push(`date: ${meta.date}`);
  L.push(`pages_audited: ${pages.length}`);
  L.push(`viewports: ${meta.viewports.join(', ')}`);
  L.push(`automated_violations: ${findings.length}`);
  L.push(`status: automated pass only, manual checks outstanding`);
  L.push('---');
  L.push('');
  L.push(`# Accessibility audit: ${meta.site}`);
  L.push('');
  L.push(`Automated WCAG 2.2 AA pass using axe-core ${meta.axeVersion} through Playwright, at ${meta.viewports.join(' and ')} viewports.`);
  L.push('');
  L.push('Automation reaches roughly a third of the WCAG 2.2 AA criteria. A clean automated run is not a conformance claim. The manual checks in `references/manual-checklist.md` have to be worked through before any claim is made.');
  L.push('');

  L.push('## Summary');
  L.push('');
  L.push('| Measure | Value |');
  L.push('|---|---|');
  L.push(`| Pages audited | ${pages.length} |`);
  L.push(`| Distinct rule failures | ${findings.length} |`);
  L.push(`| Critical | ${counts.critical} |`);
  L.push(`| Serious | ${counts.serious} |`);
  L.push(`| Moderate | ${counts.moderate} |`);
  L.push(`| Minor | ${counts.minor} |`);
  L.push(`| Needs manual review (axe incomplete) | ${incomplete.length} |`);
  L.push(`| WCAG criteria with an automated failure | ${failed.length} |`);
  L.push('');

  L.push('## Criteria with an automated failure');
  L.push('');
  if (!failed.length) {
    L.push('No WCAG criterion failed the automated pass. Every criterion is still unverified until the manual checklist is run.');
  } else {
    L.push('| Criterion | Level | Worst impact | Failing rules |');
    L.push('|---|---|---|---|');
    for (const f of failed) {
      const c = CRITERIA[f.id];
      L.push(`| ${f.id} ${escapePipes(c ? c[0] : '')} | ${c ? c[1] : '?'} | ${f.worst} | ${[...f.rules].join(', ')} |`);
    }
  }
  L.push('');

  L.push('## Findings by impact');
  L.push('');
  if (!findings.length) {
    L.push('No axe-core violations at either viewport.');
    L.push('');
  }
  for (const impact of IMPACT_ORDER) {
    const group = findings.filter((f) => f.impact === impact);
    if (!group.length) continue;
    L.push(`### ${impact[0].toUpperCase()}${impact.slice(1)}`);
    L.push('');
    for (const f of group) {
      L.push(`#### ${f.id}`);
      L.push('');
      L.push(`- **What fails.** ${f.help}.`);
      L.push(`- **WCAG criterion.** ${criteriaLabelList(f.criteria)}`);
      L.push(`- **Reach.** ${plural(f.totalNodes, 'element', 'elements')} across ${plural(f.pages.size, 'page', 'pages')}, seen at ${[...f.viewports].join(' and ')}.`);
      if (f.example) {
        L.push(`- **Example.** \`${escapePipes(f.example.target)}\``);
        if (f.example.html) L.push(`  \`\`\`html\n  ${f.example.html}\n  \`\`\``);
      }
      L.push(`- **Reference.** ${f.helpUrl}`);
      L.push('');
    }
  }

  L.push('## WCAG 2.2 checks axe does not run by default');
  L.push('');
  L.push('| Check | Criterion | Result |');
  L.push('|---|---|---|');
  L.push(`| Reflow, no horizontal scroll at 320 CSS px | 1.4.10 Reflow (AA) | ${reflowFails.length ? `${reflowFails.length} of ${pages.length} pages scroll horizontally` : 'pass on every page audited'} |`);
  L.push(`| Target size, 24 by 24 CSS px minimum at mobile | 2.5.8 Target Size (Minimum) (AA) | ${targetFails.length ? `${targetFails.length} of ${pages.length} pages have undersized targets` : 'pass on every page audited'} |`);
  L.push(`| Stylesheets answer prefers-reduced-motion | 2.3.3 and 2.2.2 signal | ${noReducedMotion.length ? `${noReducedMotion.length} of ${pages.length} pages animate without a reduced-motion query` : 'query present, or nothing animates'} |`);
  L.push('');

  if (reflowFails.length) {
    L.push('**Pages that scroll horizontally at 320 px**');
    L.push('');
    for (const p of reflowFails) {
      const r = p.viewports.mobile.reflow;
      L.push(`- ${p.url} — content is ${r.scrollWidth} px wide in a ${r.clientWidth} px viewport`);
    }
    L.push('');
  }

  if (targetFails.length) {
    L.push('**Targets under 24 by 24 CSS px**');
    L.push('');
    L.push('Inline links inside body text are exempt and excluded here.');
    L.push('');
    L.push('| Page | Target | Size | Label |');
    L.push('|---|---|---|---|');
    for (const p of targetFails) {
      for (const t of p.viewports.mobile.smallTargets.slice(0, 8)) {
        L.push(`| ${shortUrl(p.url)} | \`${escapePipes(t.selector)}\` | ${t.width} x ${t.height} | ${escapePipes(t.label) || '(no text)'} |`);
      }
    }
    L.push('');
  }

  L.push('## Structure snapshot');
  L.push('');
  L.push('| Page | Title | lang | h1 | Landmarks (main/nav/header/footer) | Inputs (with autocomplete) | Video (with captions track) | PDF links |');
  L.push('|---|---|---|---|---|---|---|---|');
  for (const p of pages) {
    const s = (p.viewports.desktop || p.viewports.mobile)?.structure;
    if (!s) {
      L.push(`| ${shortUrl(p.url)} | not captured | | | | | | |`);
      continue;
    }
    const lm = s.landmarks;
    L.push(
      `| ${shortUrl(p.url)} | ${escapePipes(s.title.slice(0, 50)) || '**missing**'} | ${s.lang || '**missing**'} | ${s.h1Count} | ${lm.main}/${lm.nav}/${lm.header}/${lm.footer} | ${s.inputs} (${s.inputsWithAutocomplete}) | ${s.videos} (${s.videosWithTrack}) | ${s.pdfLinks} |`,
    );
  }
  L.push('');

  if (incomplete.length) {
    L.push('## Needs a human decision (axe could not be certain)');
    L.push('');
    L.push('| Rule | Criterion | Elements | What to check |');
    L.push('|---|---|---|---|');
    for (const i of incomplete) {
      L.push(`| ${i.id} | ${escapePipes(criteriaLabelList(i.criteria))} | ${i.totalNodes} | ${escapePipes(i.help)} |`);
    }
    L.push('');
  }

  L.push('## Fix list, ordered by impact then dependency');
  L.push('');
  L.push('Ordering rule: user-blocking failures before hardening, sitewide template fixes before single-page fixes, and anything a later fix depends on first. No effort estimates.');
  L.push('');
  const ordered = [
    ...findings.filter((f) => f.impact === 'critical'),
    ...findings.filter((f) => f.impact === 'serious'),
  ];
  const structural = [];
  if (reflowFails.length) structural.push({ label: 'Reflow at 320 px', detail: `${plural(reflowFails.length, 'page forces', 'pages force')} horizontal scrolling. Structural, fix in the layout before chasing component-level issues.`, crit: '1.4.10' });
  if (targetFails.length) structural.push({ label: 'Target size', detail: `Undersized tap targets on ${plural(targetFails.length, 'page', 'pages')}. Usually a shared component, so one fix clears many pages.`, crit: '2.5.8' });
  if (noReducedMotion.length) structural.push({ label: 'Reduced motion', detail: 'Animation runs with no prefers-reduced-motion query. Add the query at the stylesheet root.', crit: '2.3.3' });

  let n = 1;
  for (const f of ordered) {
    const scope = f.pages.size > 1 ? 'sitewide, likely a shared template or component' : 'single page';
    L.push(`${n++}. **${f.help}** — ${f.impact}, ${scope}. ${criteriaLabelList(f.criteria)}. ${plural(f.totalNodes, 'element', 'elements')}. Rule \`${f.id}\`.`);
  }
  for (const s of structural) {
    L.push(`${n++}. **${s.label}** — structural, do before component polish. ${criterionLabel(s.crit)}. ${s.detail}`);
  }
  for (const f of findings.filter((f) => f.impact === 'moderate' || f.impact === 'minor')) {
    L.push(`${n++}. **${f.help}** — ${f.impact}, hardening. ${criteriaLabelList(f.criteria)}. Rule \`${f.id}\`.`);
  }
  if (n === 1) L.push('Nothing to fix from the automated pass. Move to the manual checklist.');
  L.push('');

  L.push('## Conformance claim you can make today');
  L.push('');
  const blockers = counts.critical + counts.serious;
  if (blockers > 0) {
    L.push(`**Not compliant with WCAG 2.2 AA.** ${plural(blockers, 'critical or serious automated failure stands', 'critical or serious automated failures stand')}, across ${plural(failed.length, 'criterion', 'criteria')}. Automated evidence alone is enough to rule out a full-compliance claim.`);
  } else if (findings.length > 0) {
    L.push(`**Partially compliant with WCAG 2.2 AA, at best.** No critical or serious automated failures, but ${plural(findings.length, 'moderate or minor failure remains', 'moderate or minor failures remain')} and the manual checks are unrun. State partial compliance and list the known failures.`);
  } else {
    L.push('**No claim yet.** The automated pass is clean, which rules out the mechanical failures and nothing else. Automation reaches roughly a third of the criteria, so a full-compliance claim needs the manual checklist, a screen-reader pass, and a keyboard-only walk completed and recorded first.');
  }
  L.push('');
  L.push('Whatever the outcome, the published statement has to name the criteria that fail and the reason, per `references/accessibility-statement-template.md`.');
  L.push('');

  L.push('## What this run did not check');
  L.push('');
  L.push('Automation cannot judge whether alt text is accurate, whether focus order matches reading order, whether captions match the audio, whether an error message helps, whether colour is the only carrier of meaning, or whether a screen reader announces a component sensibly. Those are in `references/manual-checklist.md` and none of them are optional.');
  L.push('');

  if (pages.some((p) => p.errors.length)) {
    L.push('## Pages that errored');
    L.push('');
    for (const p of pages.filter((x) => x.errors.length)) L.push(`- ${p.url}: ${p.errors.join('; ')}`);
    L.push('');
  }

  L.push('---');
  L.push('');
  L.push(`Generated by \`tool-accessibility-audit\` on ${meta.date}. axe-core ${meta.axeVersion}.`);
  return L.join('\n');
}

function shortUrl(u) {
  try {
    const p = new URL(u);
    return p.pathname === '/' ? '/' : p.pathname;
  } catch {
    return u;
  }
}

/* ------------------------------------------------------------------ */
/* Main                                                               */
/* ------------------------------------------------------------------ */

const HELP = `a11y-audit.mjs — WCAG 2.2 AA automated pass

  node a11y-audit.mjs <url> [more urls...] [flags]
  node a11y-audit.mjs --sitemap https://example.com/sitemap.xml --limit 10

  --sitemap <url>   pull pages from a sitemap (follows sitemap indexes)
  --limit <n>       max pages from the sitemap (default 10)
  --out <path>      write the markdown report here
  --json <path>     write the raw JSON result here
  --viewport <v>    desktop | mobile | both (default both)
  --timeout <ms>    per-page navigation timeout (default 45000)
  --quiet           no progress logging

Run scripts/setup.sh once before the first use.
Exit code 2 when any critical or serious violation is found.`;

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    console.error(HELP);
    process.exit(1);
  }
  if (opts.help || (!opts.urls.length && !opts.sitemap)) {
    console.log(HELP);
    process.exit(opts.help ? 0 : 1);
  }

  const log = opts.quiet ? () => {} : (m) => console.error(m);

  let playwright;
  let AxeBuilder;
  try {
    playwright = await import('playwright');
    const axeMod = await import('@axe-core/playwright');
    AxeBuilder = axeMod.default?.default ?? axeMod.default ?? axeMod.AxeBuilder;
    if (typeof AxeBuilder !== 'function') throw new Error('AxeBuilder export not found');
  } catch (e) {
    console.error('Dependencies are missing. Run:');
    console.error('  bash .claude/skills/tool-accessibility-audit/scripts/setup.sh');
    console.error(`(${e.message})`);
    process.exit(1);
  }

  let axeVersion = 'unknown';
  try {
    const axeCore = await import('axe-core');
    axeVersion = (axeCore.default ?? axeCore).version ?? 'unknown';
  } catch { /* version is cosmetic */ }

  let urls = [...opts.urls];
  if (opts.sitemap) {
    log(`Reading sitemap ${opts.sitemap}`);
    const found = await urlsFromSitemap(normaliseUrl(opts.sitemap), opts.limit, log);
    log(`  ${found.length} page URL(s) found`);
    urls = [...urls, ...found];
  }
  urls = [...new Set(urls)].slice(0, Math.max(opts.limit, opts.urls.length));
  if (!urls.length) {
    console.error('No URLs to audit.');
    process.exit(1);
  }

  const viewportKeys =
    opts.viewport === 'both' ? ['desktop', 'mobile'] : [opts.viewport];
  for (const k of viewportKeys) {
    if (!VIEWPORTS[k]) {
      console.error(`Unknown viewport "${k}". Use desktop, mobile, or both.`);
      process.exit(1);
    }
  }

  log(`Auditing ${urls.length} page(s) at ${viewportKeys.join(' and ')}`);
  const browser = await playwright.chromium.launch({ headless: true });
  const pages = [];
  try {
    for (const url of urls) {
      log(`- ${url}`);
      pages.push(await auditPage(browser, AxeBuilder, url, viewportKeys, opts.timeout, log));
    }
  } finally {
    await browser.close();
  }

  const meta = {
    date: new Date().toISOString().slice(0, 10),
    site: (() => {
      try {
        return new URL(urls[0]).host;
      } catch {
        return urls[0];
      }
    })(),
    viewports: viewportKeys,
    axeVersion,
  };

  const md = buildMarkdown(pages, opts, meta);

  if (opts.out) {
    const p = resolve(opts.out);
    await mkdir(dirname(p), { recursive: true });
    await writeFile(p, md, 'utf8');
    log(`Report written to ${p}`);
  } else {
    process.stdout.write(`${md}\n`);
  }

  if (opts.json) {
    const p = resolve(opts.json);
    await mkdir(dirname(p), { recursive: true });
    await writeFile(p, `${JSON.stringify({ meta, pages }, replacer, 2)}\n`, 'utf8');
    log(`JSON written to ${p}`);
  }

  const findings = collectFindings(pages);
  const blocking = findings.filter((f) => f.impact === 'critical' || f.impact === 'serious').length;
  process.exit(blocking > 0 ? 2 : 0);
}

function replacer(_key, value) {
  return value instanceof Set ? [...value] : value;
}

main().catch((e) => {
  console.error(e.stack || e.message);
  process.exit(1);
});
