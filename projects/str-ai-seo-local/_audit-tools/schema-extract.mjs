// Schema/render audit — fetches with GPTBot UA, parses JSON-LD, reports patterns.
const UA = 'Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)';

const TARGETS = [
  'https://got-moles.com/',
  'https://got-moles.com/about/',
  'https://got-moles.com/services/',
  'https://got-moles.com/services/one-time-mole-removal/',
  'https://got-moles.com/services/total-mole-control-program/',
  'https://got-moles.com/mole-control-seattle/',
  'https://got-moles.com/mole-control-bellevue/',
  'https://got-moles.com/mole-control-tacoma/',
  'https://got-moles.com/blog/',
  'https://got-moles.com/blog/types-of-moles-in-washington/',
  'https://got-moles.com/blog/best-mole-traps/',
  'https://got-moles.com/blog/how-to-get-rid-of-moles/',
  'https://got-moles.com/llms.txt',
  'https://got-moles.com/llms-full.txt',
  'https://got-moles.com/robots.txt',
];

function summarizeLD(json) {
  const types = [];
  const walk = (n) => {
    if (!n) return;
    if (Array.isArray(n)) return n.forEach(walk);
    if (typeof n !== 'object') return;
    if (n['@type']) types.push(Array.isArray(n['@type']) ? n['@type'].join('+') : n['@type']);
    if (n['@graph']) walk(n['@graph']);
  };
  walk(json);
  return types;
}

const results = [];

for (const url of TARGETS) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
    const text = await r.text();
    const row = {
      url,
      status: r.status,
      bytes: text.length,
      contentType: r.headers.get('content-type'),
      lastModified: r.headers.get('last-modified') || null,
    };
    if (url.endsWith('.txt')) {
      row.preview = text.slice(0, 500);
      row.totalBytes = text.length;
      results.push(row);
      continue;
    }
    const ldMatches = [...text.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
    const allTypes = [];
    let parseErrors = 0;
    let speakable = false;
    let dateModified = false;
    let articleSchema = false;
    let faqPageCount = 0;
    let aggregateRating = false;
    let knowsAbout = false;
    let offerCatalog = false;
    let foundingDate = null;
    for (const m of ldMatches) {
      try {
        const j = JSON.parse(m[1]);
        const types = summarizeLD(j);
        allTypes.push(...types);
        const blob = JSON.stringify(j);
        if (blob.includes('SpeakableSpecification') || blob.includes('"speakable"')) speakable = true;
        if (blob.includes('dateModified')) dateModified = true;
        if (/"@type":"Article"|"@type":"BlogPosting"/.test(blob)) articleSchema = true;
        if (blob.includes('FAQPage')) faqPageCount++;
        if (blob.includes('AggregateRating')) aggregateRating = true;
        if (blob.includes('knowsAbout')) knowsAbout = true;
        if (blob.includes('OfferCatalog') || blob.includes('hasOfferCatalog')) offerCatalog = true;
        const fd = blob.match(/"foundingDate"\s*:\s*"([^"]+)"/);
        if (fd) foundingDate = fd[1];
      } catch (e) { parseErrors++; }
    }
    const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/);
    const h1Match = text.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    const canonicalMatch = text.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/);
    const robotsMatch = text.match(/<meta[^>]+name="robots"[^>]+content="([^"]+)"/);
    row.title = titleMatch ? titleMatch[1].trim() : null;
    row.titleLen = titleMatch ? titleMatch[1].trim().length : null;
    row.h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim().slice(0, 200) : null;
    row.canonical = canonicalMatch ? canonicalMatch[1] : null;
    row.metaRobots = robotsMatch ? robotsMatch[1] : null;
    row.ldBlocks = ldMatches.length;
    row.ldTypes = allTypes;
    row.parseErrors = parseErrors;
    row.speakable = speakable;
    row.dateModified = dateModified;
    row.articleSchema = articleSchema;
    row.faqPageCount = faqPageCount;
    row.aggregateRating = aggregateRating;
    row.knowsAbout = knowsAbout;
    row.offerCatalog = offerCatalog;
    row.foundingDate = foundingDate;
    // table/list extractability
    row.htmlTables = (text.match(/<table/g) || []).length;
    row.orderedLists = (text.match(/<ol[\s>]/g) || []).length;
    row.unorderedLists = (text.match(/<ul[\s>]/g) || []).length;
    results.push(row);
  } catch (e) {
    results.push({ url, error: e.message });
  }
}

console.log(JSON.stringify(results, null, 2));
