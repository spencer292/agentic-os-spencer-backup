#!/usr/bin/env node
/**
 * Route Ready static site generator — zero dependencies.
 * Usage: node build.mjs [--test]
 *   --test  additionally treats site/_test/*.md as guide content (for build testing)
 *
 * Reads:  config.json, content/guides/*.md, content/pages/*.md, styles.css
 * Writes: dist/  (HTML pages, sitemap.xml, robots.txt, styles.css)
 *
 * Uses only Node built-ins (fs, path). Windows-safe paths, CRLF-tolerant.
 */

import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const SITE = path.dirname(path.resolve(process.argv[1]));
const DIST = path.join(SITE, 'dist');
const CONTENT = path.join(SITE, 'content');
const TEST_DIR = path.join(SITE, '_test');
const TEST_MODE = process.argv.includes('--test');

const config = JSON.parse(fs.readFileSync(path.join(SITE, 'config.json'), 'utf8'));
const ORIGIN = 'https://' + config.domain;
const BRAND = config.brand || 'Route Ready';

// Inline brand mark: a route pin whose inner dot doubles as a checkmark badge,
// with a dashed route line rising behind it. Inherits currentColor accents via CSS vars.
const LOGO_SVG = `<svg class="brand-mark" width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
<path d="M4 28c6-1 7-6 10-9" stroke="#1a7f4b" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="0.5 4.5"/>
<path d="M21 3C16 3 12 7 12 12c0 6.5 9 16 9 16s9-9.5 9-16c0-5-4-9-9-9z" fill="#1a7f4b"/>
<path d="M17.5 12.2l2.6 2.6 5-5.2" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;

// Same mark as a standalone SVG favicon (data URI).
const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M21 3C16 3 12 7 12 12c0 6.5 9 16 9 16s9-9.5 9-16c0-5-4-9-9-9z" fill="#1a7f4b"/><path d="M17.5 12.2l2.6 2.6 5-5.2" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
const FAVICON_LINK = `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encodeURIComponent(FAVICON_SVG)}">`;

// Ad-click attribution: store Google click ids (gclid/gbraid/wbraid) for 90 days
// and append them to any Gumroad link at click time, so purchases can be matched
// back to ad clicks and uploaded as conversions (see scripts/rr-upload-conversions.mjs).
const TRACK_SNIPPET = `<script>(function(){try{
var K=['gclid','gbraid','wbraid'],p=new URLSearchParams(location.search),
s=JSON.parse(localStorage.getItem('rr_click')||'{}'),f=false;
K.forEach(function(k){var v=p.get(k);if(v){s[k]=v;f=true}});
if(f){s.ts=Date.now();localStorage.setItem('rr_click',JSON.stringify(s))}
if(!s.ts||Date.now()-s.ts>90*864e5)return;
document.addEventListener('click',function(e){
var a=e.target&&e.target.closest&&e.target.closest('a[href*="gumroad.com"]');
if(!a)return;try{var u=new URL(a.href);
K.forEach(function(k){if(s[k])u.searchParams.set(k,s[k])});
a.href=u.href}catch(_){}} ,true);
}catch(_){}})();</script>`;

const failures = []; // { file, error }
const built = [];    // relative output paths

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function slugifyId(s) {
  return String(s).toLowerCase()
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80) || 'section';
}

function formatDate(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return String(iso || '');
  const months = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];
  return `${months[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`;
}

/** Strip markdown inline syntax down to plain text (for JSON-LD, meta). */
function plainText(s) {
  return String(s)
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\{\{[^}]*\}\}/g, '')
    .trim();
}

function writeOut(relPath, content) {
  const abs = path.join(DIST, ...relPath.split('/'));
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, 'utf8');
  built.push(relPath);
}

// ---------------------------------------------------------------------------
// Frontmatter
// ---------------------------------------------------------------------------

function parseFrontmatter(src) {
  src = src.replace(/^﻿/, '');
  const m = src.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/);
  if (!m) return { fm: {}, body: src };
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+)[ \t]*:[ \t]*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if ((v.startsWith('"') && v.endsWith('"') && v.length >= 2) ||
        (v.startsWith("'") && v.endsWith("'") && v.length >= 2)) {
      v = v.slice(1, -1);
    }
    fm[kv[1]] = v;
  }
  return { fm, body: src.slice(m[0].length) };
}

// ---------------------------------------------------------------------------
// Markdown → HTML (supported subset: h1-h3, p, bold, italic, links,
// ul/ol, pipe tables, blockquotes, fenced code, hr). Raw HTML is escaped.
// ---------------------------------------------------------------------------

function inline(text) {
  let s = escapeHtml(text);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  return s;
}

const TOKEN_LINE = /^\{\{(CTA|BUY_BUTTON|EMAIL_FORM|GUARANTEE)\}\}$/;

function isTableSeparator(line) {
  const t = line.trim();
  return /^[|\s:-]+$/.test(t) && t.includes('-') && t.includes('|');
}

function splitRow(line) {
  let t = line.trim();
  if (t.startsWith('|')) t = t.slice(1);
  if (t.endsWith('|')) t = t.slice(0, -1);
  return t.split('|').map((c) => c.trim());
}

function mdToHtml(md) {
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let i = 0;

  const startsNewBlock = (l) =>
    /^(#{1,3})\s/.test(l) || /^\s*>/.test(l) || /^\s*[-*]\s+/.test(l) ||
    /^\s*\d+\.\s+/.test(l) || /^```/.test(l.trim()) ||
    /^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(l) || TOKEN_LINE.test(l.trim());

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    // Fenced code block
    if (/^```/.test(line.trim())) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i].trim())) { buf.push(lines[i]); i++; }
      i++; // skip closing fence (or EOF)
      out.push(`<pre><code>${escapeHtml(buf.join('\n'))}</code></pre>`);
      continue;
    }

    // Horizontal rule
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { out.push('<hr>'); i++; continue; }

    // Headings
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      const lvl = h[1].length;
      const idAttr = lvl > 1 ? ` id="${slugifyId(plainText(h[2]))}"` : '';
      out.push(`<h${lvl}${idAttr}>${inline(h[2].trim())}</h${lvl}>`);
      i++;
      continue;
    }

    // Blockquote
    if (/^\s*>/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      const paras = buf.join('\n').split(/\n{2,}/)
        .map((p) => p.replace(/\n/g, ' ').trim())
        .filter(Boolean)
        .map((p) => `<p>${inline(p)}</p>`)
        .join('');
      out.push(`<blockquote>${paras}</blockquote>`);
      continue;
    }

    // Pipe table (header row + separator row)
    if (line.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const header = splitRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      const thead = `<thead><tr>${header.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead>`;
      const tbody = `<tbody>${rows.map((r) =>
        `<tr>${header.map((_, ci) => `<td>${inline(r[ci] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody>`;
      out.push(`<div class="table-wrap"><table>${thead}${tbody}</table></div>`);
      continue;
    }

    // Unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        i++;
      }
      out.push(`<ul>${items.map((it) => `<li>${inline(it)}</li>`).join('')}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      out.push(`<ol>${items.map((it) => `<li>${inline(it)}</li>`).join('')}</ol>`);
      continue;
    }

    // Token on its own line — emit raw, replaced later at block level
    if (TOKEN_LINE.test(line.trim())) {
      out.push(line.trim());
      i++;
      continue;
    }

    // Paragraph — gather until blank line or new block start
    const buf = [line.trim()];
    i++;
    while (i < lines.length && lines[i].trim() && !startsNewBlock(lines[i])) {
      buf.push(lines[i].trim());
      i++;
    }
    out.push(`<p>${inline(buf.join(' '))}</p>`);
  }

  return out.join('\n');
}

// ---------------------------------------------------------------------------
// FAQ extraction (best effort): H2 containing "FAQ", then H3 or bold-line
// questions with following paragraph(s) as answers.
// ---------------------------------------------------------------------------

function extractFaq(body) {
  const lines = body.replace(/\r\n?/g, '\n').split('\n');
  let inFaq = false;
  const faqs = [];
  let current = null;
  const flush = () => {
    if (current && current.q && current.a.trim()) faqs.push(current);
    current = null;
  };

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.*)$/);
    if (h2) {
      if (inFaq) break; // left the FAQ section
      inFaq = /faq/i.test(h2[1]);
      continue;
    }
    if (!inFaq) continue;

    const h3 = line.match(/^###\s+(.*)$/);
    const boldQ = line.match(/^\*\*(.+?)\*\*[:.]?\s*$/);
    if (h3 || boldQ) {
      flush();
      current = { q: plainText(h3 ? h3[1] : boldQ[1]), a: '' };
      continue;
    }
    if (current && line.trim() && !TOKEN_LINE.test(line.trim()) &&
        !/^```/.test(line.trim()) && !/^\s*(-{3,})\s*$/.test(line)) {
      const t = plainText(line.replace(/^\s*[->*]\s?/, '').replace(/^\d+\.\s+/, ''));
      if (t) current.a += (current.a ? ' ' : '') + t;
    }
  }
  flush();
  return faqs;
}

// ---------------------------------------------------------------------------
// Token replacement
// ---------------------------------------------------------------------------

const CTA_TEXT = {
  CTA_CLEANING: 'Get the Cleaning Business Starter Kit — $49',
  CTA_PW: 'Get the Pressure Washing Business Starter Kit — $49',
  CTA_LAWN: 'Get the Lawn Care Business Starter Kit — $49',
};

function ctaBlockHtml(ctaKey) {
  const key = config.tokens[ctaKey] !== undefined ? ctaKey : 'CTA_GENERIC';
  const href = config.tokens[key] || '/';
  const text = CTA_TEXT[key] || 'Get the free Pricing Cheat Sheet';
  return `<div class="cta-block"><a class="btn" href="${escapeHtml(href)}">${escapeHtml(text)}</a></div>`;
}

// Per-kit buy button: pages set `buy_token` (config.tokens key holding the
// Gumroad URL) and `buy_text` in frontmatter; defaults keep Kit 1 pages working.
function buyButtonHtml(fm = {}) {
  const url = config.tokens[fm.buy_token || 'GUMROAD_CLEANING_KIT_URL'] || '';
  const label = fm.buy_text || 'Get the Cleaning Business Starter Kit — $49';
  if (!url || url.startsWith('PENDING')) {
    return `<div class="cta-block"><button class="btn btn-disabled" disabled aria-disabled="true">Coming this week</button></div>`;
  }
  return `<div class="cta-block"><a class="btn" href="${escapeHtml(url)}">${escapeHtml(label)}</a></div>`;
}

function emailFormHtml() {
  const url = config.tokens.LEAD_MAGNET_URL || '';
  if (!url || url.startsWith('PENDING')) {
    return `<div class="email-form">
<p><strong>Free Pricing Cheat Sheet</strong> — email delivery opens this week.</p>
<form onsubmit="return false">
<input type="email" placeholder="you@example.com" disabled aria-disabled="true">
<button class="btn btn-disabled" type="button" disabled aria-disabled="true">Coming this week</button>
</form>
</div>`;
  }
  return `<div class="email-form">
<p><strong>Get the free Pricing Cheat Sheet</strong> — instant download, no spam, unsubscribe anytime.</p>
<div class="cta-block"><a class="btn" href="${escapeHtml(url)}">Get it free</a></div>
</div>`;
}

const GUARANTEE_HTML =
  `<div class="guarantee"><strong>30-day money-back guarantee</strong> — email us, get a refund, keep the files.</div>`;

function replaceTokens(html, fm = {}) {
  const cta = ctaBlockHtml(fm.cta || 'CTA_GENERIC');
  return html
    .replaceAll('<p>{{CTA}}</p>', cta).replaceAll('{{CTA}}', cta)
    .replaceAll('<p>{{BUY_BUTTON}}</p>', buyButtonHtml(fm)).replaceAll('{{BUY_BUTTON}}', buyButtonHtml(fm))
    .replaceAll('<p>{{EMAIL_FORM}}</p>', emailFormHtml()).replaceAll('{{EMAIL_FORM}}', emailFormHtml())
    .replaceAll('<p>{{GUARANTEE}}</p>', GUARANTEE_HTML).replaceAll('{{GUARANTEE}}', GUARANTEE_HTML);
}

// ---------------------------------------------------------------------------
// Page shell
// ---------------------------------------------------------------------------

function pageShell({ title, description, urlPath, bodyHtml, jsonld = [], ogType = 'website' }) {
  const canonical = ORIGIN + urlPath;
  const navHtml = (config.nav || [])
    .map((n) => `<a href="${escapeHtml(n.href)}">${escapeHtml(n.label)}</a>`)
    .join('\n      ');
  const jsonldHtml = jsonld
    .map((o) => `<script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n</script>`)
    .join('\n');
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${FAVICON_LINK}
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${escapeHtml(canonical)}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(canonical)}">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="${escapeHtml(BRAND)}">
<link rel="stylesheet" href="/styles.css">
${jsonldHtml}
</head>
<body>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="/" aria-label="${escapeHtml(BRAND)} — home">${LOGO_SVG}<span class="brand-name">${escapeHtml(BRAND)}</span></a>
    <nav class="site-nav">
      ${navHtml}
    </nav>
  </div>
</header>
<main class="wrap">
${bodyHtml}
</main>
<footer class="site-footer">
  <div class="wrap">
    <p class="footer-note">${escapeHtml(config.footer_note || '')}</p>
    <p>&copy; ${year} ${escapeHtml(BRAND)} &middot; <a href="/guides/">Guides</a> &middot; <a href="/kits/">Kits</a> &middot; <a href="/free-pricing-cheat-sheet/">Free Pricing Cheat Sheet</a></p>
  </div>
</footer>
${TRACK_SNIPPET}
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Content loading
// ---------------------------------------------------------------------------

function cleanSlug(raw, fallback) {
  let s = String(raw || fallback || '').trim().replace(/^\/+|\/+$/g, '');
  if (!s || s.split('/').some((p) => !p || p === '.' || p === '..')) {
    throw new Error(`invalid slug: "${raw}"`);
  }
  return s;
}

function loadDir(dir) {
  if (!fs.existsSync(dir)) return [];
  const items = [];
  for (const name of fs.readdirSync(dir).sort()) {
    if (!name.toLowerCase().endsWith('.md')) continue;
    const file = path.join(dir, name);
    try {
      const src = fs.readFileSync(file, 'utf8');
      const { fm, body } = parseFrontmatter(src);
      const slug = cleanSlug(fm.slug, name.replace(/\.md$/i, ''));
      if (!fm.title) throw new Error('missing frontmatter "title"');
      items.push({ file: name, fm, body, slug });
    } catch (err) {
      failures.push({ file, error: err.message });
    }
  }
  return items;
}

// ---------------------------------------------------------------------------
// Renderers
// ---------------------------------------------------------------------------

function articleJsonLd(item, urlPath) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: item.fm.title,
    description: item.fm.description || '',
    datePublished: item.fm.date || '',
    dateModified: item.fm.date || '',
    author: { '@type': 'Organization', name: BRAND, url: ORIGIN + '/' },
    publisher: { '@type': 'Organization', name: BRAND, url: ORIGIN + '/' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': ORIGIN + urlPath },
  };
}

function faqJsonLd(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

function renderGuide(item) {
  const urlPath = `/guides/${item.slug}/`;
  const contentHtml = replaceTokens(mdToHtml(item.body), item.fm);
  const jsonld = [articleJsonLd(item, urlPath)];
  const faqs = extractFaq(item.body);
  if (faqs.length > 0) jsonld.push(faqJsonLd(faqs));

  const bodyHtml = `<article>
<header class="article-header">
<h1>${escapeHtml(item.fm.title)}</h1>
<p class="byline">${escapeHtml(BRAND)}${item.fm.date ? ` &middot; <time datetime="${escapeHtml(item.fm.date)}">${escapeHtml(formatDate(item.fm.date))}</time>` : ''}</p>
</header>
${contentHtml}
</article>`;

  writeOut(`guides/${item.slug}/index.html`, pageShell({
    title: `${item.fm.title} — ${BRAND}`,
    description: item.fm.description || config.description,
    urlPath,
    bodyHtml,
    jsonld,
    ogType: 'article',
  }));
  return urlPath;
}

function renderPage(item) {
  const urlPath = `/${item.slug}/`;
  const contentHtml = replaceTokens(mdToHtml(item.body), item.fm);
  const bodyHtml = `<article>
<header class="article-header">
<h1>${escapeHtml(item.fm.title)}</h1>
</header>
${contentHtml}
</article>`;

  writeOut(`${item.slug}/index.html`, pageShell({
    title: `${item.fm.title} — ${BRAND}`,
    description: item.fm.description || config.description,
    urlPath,
    bodyHtml,
    ogType: 'website',
  }));
  return urlPath;
}

const CLUSTER_LABELS = {
  cleaning: 'Cleaning',
  'pressure-washing': 'Pressure Washing',
  'lawn-care': 'Lawn Care',
  operator: 'Running the Business',
};
const CLUSTER_ORDER = ['cleaning', 'pressure-washing', 'lawn-care', 'operator'];

function guideCardHtml(g) {
  return `<li class="guide-item">
<a href="/guides/${g.slug}/">${escapeHtml(g.fm.title)}</a>
${g.fm.description ? `<p>${escapeHtml(g.fm.description)}</p>` : ''}
</li>`;
}

function renderGuidesIndex(guides) {
  const byCluster = new Map();
  for (const g of guides) {
    const c = g.fm.cluster || 'operator';
    if (!byCluster.has(c)) byCluster.set(c, []);
    byCluster.get(c).push(g);
  }
  const order = [...CLUSTER_ORDER.filter((c) => byCluster.has(c)),
    ...[...byCluster.keys()].filter((c) => !CLUSTER_ORDER.includes(c))];

  const sections = order.map((c) => {
    const list = byCluster.get(c)
      .slice()
      .sort((a, b) => String(b.fm.date || '').localeCompare(String(a.fm.date || '')));
    const label = CLUSTER_LABELS[c] || c.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
    return `<section class="cluster">
<h2>${escapeHtml(label)}</h2>
<ul class="guide-list">
${list.map(guideCardHtml).join('\n')}
</ul>
</section>`;
  }).join('\n');

  const bodyHtml = `<header class="article-header">
<h1>Guides</h1>
<p>Practical, no-fluff guides for route-based service businesses — pricing, contracts, and operations.</p>
</header>
${sections || '<p>Guides are on the way. Check back shortly.</p>'}`;

  writeOut('guides/index.html', pageShell({
    title: `Guides — ${BRAND}`,
    description: 'Guides on pricing, contracts, and operations for cleaning, pressure washing, and lawn care businesses.',
    urlPath: '/guides/',
    bodyHtml,
  }));
}

function renderKitsIndex() {
  const bodyHtml = `<header class="article-header">
<h1>Kits</h1>
<p>Complete starter kits for route-based service businesses: contracts, pricing calculators, checklists, and scripts.</p>
</header>
<div class="cards">
<div class="card">
<h2><a href="/kits/cleaning-business-starter-kit/">Cleaning Business Starter Kit</a></h2>
<p>Everything you need to start and run a residential cleaning business: contract templates, pricing calculator, cleaning checklists, and client scripts.</p>
<p class="price">$49</p>
<p><a class="btn" href="/kits/cleaning-business-starter-kit/">See what&#39;s inside</a></p>
</div>
<div class="card">
<h2><a href="/kits/pressure-washing-business-starter-kit/">Pressure Washing Business Starter Kit</a></h2>
<p>Contracts, liability waiver, bid templates, pricing calculator, and job checklists for a pressure washing business — surface risks and overspray covered in writing.</p>
<p class="price">$49</p>
<p><a class="btn" href="/kits/pressure-washing-business-starter-kit/">See what&#39;s inside</a></p>
</div>
<div class="card">
<h2><a href="/kits/lawn-care-business-starter-kit/">Lawn Care Business Starter Kit</a></h2>
<p>Seasonal contracts, estimates, property waiver, pricing calculator, and route tools for a lawn care business — recurring mowing done as a business, not a side gig.</p>
<p class="price">$49</p>
<p><a class="btn" href="/kits/lawn-care-business-starter-kit/">See what&#39;s inside</a></p>
</div>
</div>`;

  writeOut('kits/index.html', pageShell({
    title: `Kits — ${BRAND}`,
    description: 'Starter kits for cleaning, pressure washing, and lawn care businesses — contracts, pricing tools, and checklists.',
    urlPath: '/kits/',
    bodyHtml,
  }));
}

function renderHome(guides) {
  const latest = guides
    .slice()
    .sort((a, b) => String(b.fm.date || '').localeCompare(String(a.fm.date || '')))
    .slice(0, 6);

  const latestHtml = latest.length
    ? `<section class="home-guides">
<h2>Latest guides</h2>
<ul class="guide-list">
${latest.map(guideCardHtml).join('\n')}
</ul>
<p><a href="/guides/">All guides &rarr;</a></p>
</section>`
    : '';

  const bodyHtml = `<section class="hero">
<h1>${escapeHtml(config.tagline || BRAND)}</h1>
<p>${escapeHtml(config.description || '')}</p>
<p><a class="btn" href="/kits/cleaning-business-starter-kit/">Get the Cleaning Business Starter Kit — $49</a>
<a class="btn btn-secondary" href="/free-pricing-cheat-sheet/">Free Pricing Cheat Sheet</a></p>
</section>
<div class="cards">
<div class="card">
<h2><a href="/kits/cleaning-business-starter-kit/">Cleaning Business Starter Kit</a></h2>
<p>Contracts, pricing calculator, checklists, and client scripts for residential cleaning. Available now — $49.</p>
</div>
<div class="card card-muted">
<h2>Pressure Washing &amp; Lawn Care</h2>
<p>Kits for pressure washing and lawn care are in the works. The guides are already live.</p>
</div>
<div class="card">
<h2><a href="/free-pricing-cheat-sheet/">Free Pricing Cheat Sheet</a></h2>
<p>Realistic price ranges for cleaning, pressure washing, and lawn care jobs — free, no fluff.</p>
</div>
<div class="card">
<h2><a href="/book">The Route — the book</a></h2>
<p>The founder's book on turning one-off customers into recurring revenue: <em>The Route: Stop Renting Your Customers and Start Owning Them</em>. Paperback on Amazon.</p>
</div>
</div>
${latestHtml}
<section class="credibility">
<h2>Built by an operator, not a template shop</h2>
<p>Route Ready templates come from someone who actually ran the routes. The founder grew a route-based service company to 5,000 clients — the contracts, pricing math, and checklists in these kits are the ones that survived contact with real customers, real cancellations, and real crews. No theory, no filler.</p>
<p>The full story — and the recurring-revenue playbook behind it — is in the founder's book, <a href="/book"><em>The Route: Stop Renting Your Customers and Start Owning Them</em></a>.</p>
</section>`;

  const jsonld = [{
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BRAND,
    url: ORIGIN + '/',
    description: config.description || '',
  }];

  writeOut('index.html', pageShell({
    title: `${BRAND} — Templates and Kits for Route-Based Service Businesses`,
    description: config.description || config.tagline || '',
    urlPath: '/',
    bodyHtml,
    jsonld,
  }));
}

// ---------------------------------------------------------------------------
// Sitemap + robots
// ---------------------------------------------------------------------------

function renderSitemap(urlPaths) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = urlPaths.map(({ path: p, lastmod }) => `  <url>
    <loc>${ORIGIN}${p}</loc>
    <lastmod>${lastmod || today}</lastmod>
  </url>`).join('\n');
  writeOut('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`);
}

function renderRobots() {
  writeOut('robots.txt', `User-agent: *
Allow: /

Sitemap: ${ORIGIN}/sitemap.xml
`);
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

function build() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  let guides = loadDir(path.join(CONTENT, 'guides'));
  const pages = loadDir(path.join(CONTENT, 'pages'));
  if (TEST_MODE) {
    guides = guides.concat(loadDir(TEST_DIR));
    console.log(`[test mode] including ${TEST_DIR}`);
  }

  const sitemapEntries = [
    { path: '/', lastmod: null },
    { path: '/guides/', lastmod: null },
    { path: '/kits/', lastmod: null },
  ];

  for (const g of guides) {
    const p = renderGuide(g);
    sitemapEntries.push({ path: p, lastmod: g.fm.date || null });
  }
  for (const pg of pages) {
    const p = renderPage(pg);
    sitemapEntries.push({ path: p, lastmod: pg.fm.date || null });
  }

  renderGuidesIndex(guides);
  renderKitsIndex();
  renderHome(guides);
  renderSitemap(sitemapEntries);
  renderRobots();

  // Copy stylesheet
  const cssSrc = path.join(SITE, 'styles.css');
  if (fs.existsSync(cssSrc)) {
    fs.copyFileSync(cssSrc, path.join(DIST, 'styles.css'));
    built.push('styles.css');
  } else {
    failures.push({ file: cssSrc, error: 'styles.css not found — dist has no stylesheet' });
  }

  // Report
  console.log(`Built ${built.length} files into ${DIST}`);
  console.log(`  guides: ${guides.length}, pages: ${pages.length}`);
  for (const f of built) console.log('  dist/' + f);
  if (failures.length) {
    console.error(`\n${failures.length} file(s) failed to parse:`);
    for (const f of failures) console.error(`  ${f.file}: ${f.error}`);
    process.exitCode = 1;
  }
}

build();
