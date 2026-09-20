// Got Moles — LLM/answer-engine question harvest via SerpAPI.
// Pulls People-Also-Ask (related_questions), related_searches, discussions_and_forums,
// and any ai_overview block for a seed set blended from: str-question-harvester pillars,
// the ICP language bank (how Jennifer & Mike actually phrase it), and GEO first-mover angles.
// Purpose: surface CONVERSATIONAL, question-shaped queries (what people ask LLMs) that the
// transactional Google Ads head terms never capture. Never prints the API key.
import fs from 'node:fs'; import path from 'node:path';

// --- env (internal read; value never logged) ---
const env = {};
for (const l of fs.readFileSync(path.resolve('.env'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/); if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  env[m[1]] = v;
}
const KEY = env.SERPAPI_API_KEY;
if (!KEY) { console.error('SERPAPI_API_KEY missing'); process.exit(1); }

// --- seeds, tagged by pillar & intent stage ---
const SEEDS = [
  // Removal & Control (transactional-adjacent, but PAA reveals research questions around them)
  ['mole control', 'Removal & Control'],
  ['how to get rid of moles in yard', 'Removal & Control'],
  ['get rid of moles without killing them', 'Removal & Control'],
  ['moles keep coming back', 'Removal & Control'],
  // Signs & Damage (problem-aware, top of funnel)
  ['signs of moles in yard', 'Signs & Damage'],
  ['mole hills in lawn', 'Signs & Damage'],
  ['what attracts moles to your yard', 'Signs & Damage'],
  // DIY vs Professional
  ['do mole repellents work', 'DIY vs Pro'],
  ['how to trap a mole', 'DIY vs Pro'],
  ['when should i call a professional for moles', 'DIY vs Pro'],
  // Cost & Value
  ['mole removal cost', 'Cost & Value'],
  ['how much does mole control cost', 'Cost & Value'],
  // Safety (pets / kids / chemical-free)
  ['are moles dangerous to dogs', 'Safety'],
  ['pet safe mole control', 'Safety'],
  ['chemical free mole removal', 'Safety'],
  // Prevention & Seasonal
  ['how to prevent moles in yard', 'Prevention & Seasonal'],
  ['when are moles most active', 'Prevention & Seasonal'],
  // ICP language bank (conversational / LLM-shaped)
  ['is it a mole or a gopher', 'Identification (ICP language)'],
  ['what is digging up my yard', 'Identification (ICP language)'],
  ['mole vs vole damage', 'Identification (ICP language)'],
  // GEO first-mover (thin competition in AI answers)
  ['are moles protected in washington state', 'GEO first-mover'],
  ['do coffee grounds get rid of moles', 'GEO first-mover'],
  ['does juicy fruit gum kill moles', 'GEO first-mover'],
  ['do ultrasonic mole repellers work', 'GEO first-mover'],
];

async function serp(q) {
  const u = new URL('https://serpapi.com/search.json');
  u.searchParams.set('engine', 'google');
  u.searchParams.set('q', q);
  u.searchParams.set('location', 'Seattle, Washington, United States');
  u.searchParams.set('hl', 'en');
  u.searchParams.set('gl', 'us');
  u.searchParams.set('api_key', KEY);
  const r = await fetch(u);
  const j = await r.json();
  if (j.error) return { error: j.error };
  return {
    related_questions: (j.related_questions || []).map(x => ({ q: x.question, snippet: x.snippet || '', title: x.title || '', link: x.link || '' })),
    related_searches: (j.related_searches || []).map(x => x.query).filter(Boolean),
    discussions: (j.discussions_and_forums || []).map(x => ({ title: x.title, link: x.link, source: x.source })),
    ai_overview: j.ai_overview ? (j.ai_overview.text_blocks ? 'present' : (j.ai_overview.page_token ? 'present(token)' : 'present')) : null,
  };
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = {};
const failures = [];
let calls = 0;
for (const [q, pillar] of SEEDS) {
  try {
    const d = await serp(q);
    calls++;
    if (d.error) { failures.push([q, d.error]); results[q] = { pillar, error: d.error }; }
    else results[q] = { pillar, ...d };
    process.stderr.write('.');
  } catch (e) { failures.push([q, String(e.message || e)]); }
  await sleep(1200);
}
process.stderr.write('\n');

const out = { generated_utc_placeholder: true, market: 'Western WA (Seattle location, gl=us)', seedCount: SEEDS.length, calls, results, failures };
const dir = path.resolve('projects/str-question-harvester');
fs.mkdirSync(dir, { recursive: true });
const raw = path.join(dir, '_llm-question-harvest-raw.json');
fs.writeFileSync(raw, JSON.stringify(out, null, 2));

// --- console summary ---
const SKIN = /(skin|face|cancer|melanoma|cheek|nose|hair|beauty|body|dermat|remove a mole from (my|your) (skin|face|body)|mole on my)/i;
const seen = new Map(); // normalized question -> {q, pillars:Set, freq}
const norm = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
let paaTotal = 0, aiOverviews = 0;
const relatedAll = new Set();
for (const [q, d] of Object.entries(results)) {
  if (d.error) continue;
  if (d.ai_overview) aiOverviews++;
  for (const r of (d.related_questions || [])) {
    if (SKIN.test(r.q)) continue; // discard skin-mole homograph
    paaTotal++;
    const k = norm(r.q);
    if (!seen.has(k)) seen.set(k, { q: r.q, pillars: new Set(), freq: 0, snippet: r.snippet, source: r.link });
    const e = seen.get(k); e.pillars.add(d.pillar); e.freq++;
  }
  for (const rs of (d.related_searches || [])) if (!SKIN.test(rs)) relatedAll.add(rs);
}
const unique = [...seen.values()].sort((a, b) => b.freq - a.freq);
console.log('SEEDS:', SEEDS.length, '| CALLS:', calls, '| PAA raw:', paaTotal, '| unique Qs:', unique.length, '| AI Overviews seen:', aiOverviews, '| related_searches:', relatedAll.size);
if (failures.length) console.log('FAILURES:', failures.map(f => f[0]).join('; '));
console.log('\n=== TOP UNIQUE QUESTIONS (by cross-seed frequency) ===');
for (const e of unique.slice(0, 40)) {
  console.log(`  [${e.freq}] ${e.q}   {${[...e.pillars].join(', ')}}`);
}
console.log('\n=== RELATED SEARCHES (keyword expansion) ===');
console.log('  ' + [...relatedAll].slice(0, 50).join('\n  '));
console.log('\nRAW:', raw);
