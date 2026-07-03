// On-page audit scorer for got-moles.com
// Cross-references onpage-extract JSON against target-keywords.md mapping.
import fs from 'node:fs';

const ROOT = 'C:/Claude/agent-os/clients/got-moles';
const data = JSON.parse(fs.readFileSync(`${ROOT}/projects/str-ai-seo-local/onpage-extract-2026-05-07.json`, 'utf8'));

// Normalise URL to path with trailing slash
const norm = (u) => {
  let p = u.replace(/^https?:\/\/got-moles\.com/, '').split('?')[0].split('#')[0];
  if (!p) p = '/';
  if (!p.endsWith('/')) p += '/';
  return p.toLowerCase();
};

// Page → primary keyword map (from target-keywords.md). Lowercase keys.
const KEYWORD_MAP = {
  // Tier 1 authority
  '/': { kw: 'mole control western washington', recH1: 'Mole Control in Western Washington', cluster: 'mole-control', tier: 'authority' },
  '/services/total-mole-control-program/': { kw: 'year-round mole control program', recH1: 'Total Mole Control Program — Year-Round Mole Control in Western Washington', cluster: 'mole-control', tier: 'authority' },
  '/services/one-time-mole-removal/': { kw: 'professional mole removal washington', recH1: 'Professional Mole Removal in Western Washington', cluster: 'mole-control', tier: 'authority' },
  '/services/commercial-mole-control/': { kw: 'commercial mole control washington', recH1: 'Commercial Mole Control for Property Managers in Western Washington', cluster: 'mole-control', tier: 'authority' },
  '/how-to-get-rid-of-moles-in-your-yard/': { kw: 'how to get rid of moles in your yard', recH1: 'How to Get Rid of Moles in Your Yard: The Complete Guide', cluster: 'mole-control', tier: 'authority' },
  '/voles-vs-moles-whats-the-difference/': { kw: 'vole vs mole', recH1: "Voles vs Moles: How to Tell What's Tearing Up Your Lawn", cluster: 'biology', tier: 'authority' },
  '/how-it-works/': { kw: 'how mole trapping works', recH1: 'How We Get Moles Out of Your Yard', cluster: 'mole-control', tier: 'authority' },
  '/about/': { kw: 'got moles spencer hill mole specialist', recH1: "About Got Moles — Western Washington's Mole Specialists", cluster: 'brand', tier: 'authority' },
  // Tier 2 hubs
  '/reviews/': { kw: 'got moles reviews', recH1: 'Got Moles Reviews — 219+ Five-Star Google Reviews', cluster: 'brand', tier: 'hub' },
  '/reviews/commercial-case-studies/': { kw: 'commercial mole control case studies', recH1: 'Commercial Mole Control Case Studies', cluster: 'mole-control', tier: 'hub' },
  '/service-areas/': { kw: 'mole control service areas washington', recH1: 'Mole Control Service Areas in Western Washington', cluster: 'location-services', tier: 'hub' },
  '/faq/': { kw: 'mole control faq', recH1: 'Mole Control FAQ — Answers from Got Moles', cluster: 'brand', tier: 'hub' },
  '/contact/': { kw: 'contact mole control company washington', recH1: 'Contact Got Moles — Western Washington Mole Control', cluster: 'brand', tier: 'hub' },
  '/author/spencer/': { kw: 'spencer hill mole specialist washington', recH1: 'Spencer Hill — Western Washington Mole Specialist', cluster: 'brand', tier: 'hub' },
  '/blog/': { kw: 'mole control blog', recH1: 'Mole Control Blog — Got Moles', cluster: 'brand', tier: 'hub' },
  // Legacy biology / safety / seasonal posts
  '/how-many-eyes-do-moles-have/': { kw: 'do moles have eyes', recH1: 'Do Moles Have Eyes? How Many Eyes Moles Have', cluster: 'biology', tier: 'legacy' },
  '/how-deep-do-moles-dig/': { kw: 'how deep do moles dig', recH1: 'How Deep Do Moles Dig? Tunnel Depth Explained', cluster: 'biology', tier: 'legacy' },
  '/what-do-mole-holes-look-like/': { kw: 'what do mole holes look like', recH1: 'What Do Mole Holes Look Like? Identification Guide', cluster: 'biology', tier: 'legacy' },
  '/do-moles-bite/': { kw: 'do moles bite', recH1: 'Do Moles Bite? Risks to Humans and Pets', cluster: 'safety', tier: 'legacy' },
  '/when-are-moles-most-active/': { kw: 'when are moles most active', recH1: 'When Are Moles Most Active? Seasonal Activity Guide', cluster: 'seasonal', tier: 'legacy' },
  '/what-eats-moles/': { kw: 'what eats moles', recH1: 'What Eats Moles? Natural Predators of Lawn Moles', cluster: 'biology', tier: 'legacy' },
  '/how-to-get-rid-of-ground-moles-with-vinegar/': { kw: 'how to get rid of ground moles with vinegar', recH1: 'Does Vinegar Get Rid of Ground Moles? Honest Answer', cluster: 'diy-vs-pro', tier: 'legacy' },
  '/is-a-mole-a-rodent/': { kw: 'is a mole a rodent', recH1: 'Is a Mole a Rodent? What Moles Actually Are', cluster: 'biology', tier: 'legacy' },
  '/moles-vs-gopher-mounds/': { kw: 'mole vs gopher', recH1: 'Mole vs Gopher: Mound and Tunnel Differences', cluster: 'biology', tier: 'legacy' },
  '/do-moles-carry-diseases/': { kw: 'do moles carry diseases', recH1: 'Do Moles Carry Diseases? Health Risks Explained', cluster: 'safety', tier: 'legacy' },
  '/what-do-moles-eat/': { kw: 'what do moles eat', recH1: 'What Do Moles Eat? Lawn Mole Diet Explained', cluster: 'biology', tier: 'legacy' },
  '/are-moles-nocturnal/': { kw: 'are moles nocturnal', recH1: 'Are Moles Nocturnal? When Lawn Moles Are Active', cluster: 'biology', tier: 'legacy' },
  '/are-moles-venomous/': { kw: 'are moles venomous', recH1: 'Are Moles Venomous? Toxin Facts for Homeowners', cluster: 'safety', tier: 'legacy' },
  '/do-moles-hibernate/': { kw: 'do moles hibernate', recH1: 'Do Moles Hibernate? Winter Activity Explained', cluster: 'seasonal', tier: 'legacy' },
  '/do-moles-live-in-groups/': { kw: 'do moles live in groups', recH1: 'Do Moles Live in Groups? Solitary or Social', cluster: 'biology', tier: 'legacy' },
  '/how-many-babies-do-moles-have/': { kw: 'how many babies do moles have', recH1: 'How Many Babies Do Moles Have? Mole Reproduction', cluster: 'biology', tier: 'legacy' },
  '/why-do-moles-make-molehills/': { kw: 'why do moles make molehills', recH1: 'Why Do Moles Make Molehills? Mound Behaviour Explained', cluster: 'biology', tier: 'legacy' },
  '/are-moles-poisonous-or-venomous/': { kw: 'are moles poisonous', recH1: 'Are Moles Poisonous or Venomous? Safety Guide', cluster: 'safety', tier: 'legacy' },
  '/what-attracts-moles-to-your-yard/': { kw: 'what attracts moles to your yard', recH1: 'What Attracts Moles to Your Yard? Causes and Fixes', cluster: 'biology', tier: 'legacy' },
  '/what-species-of-moles-live-in-washington-state/': { kw: 'types of moles in washington state', recH1: 'Types of Moles in Washington State: Species Guide', cluster: 'biology', tier: 'legacy' },
  '/can-moles-swim/': { kw: 'can moles swim', recH1: 'Can Moles Swim? Mole Swimming Ability Explained', cluster: 'biology', tier: 'legacy' },
  // Blog posts (Tier 3)
  '/blog/how-to-choose-a-mole-control-company/': { kw: 'how to choose a mole control company', recH1: 'How to Choose a Mole Control Company in Washington', cluster: 'mole-control', tier: 'blog' },
  '/blog/diy-mole-removal-vs-professional/': { kw: 'diy mole control vs professional', recH1: 'DIY Mole Control vs Professional: What Actually Works', cluster: 'diy-vs-pro', tier: 'blog' },
  '/blog/mole-removal-cost-washington/': { kw: 'how much does mole removal cost in washington', recH1: 'How Much Does Mole Removal Cost in Washington?', cluster: 'cost-value', tier: 'blog', br: true, brNote: 'Pivot primary KW to "mole control cost in Washington" — derm hijack risk' },
  '/blog/mole-control-safe-for-pets/': { kw: 'is mole poison safe for dogs', recH1: 'Is Mole Poison Safe for Dogs? A Pet-Owner Guide', cluster: 'safety', tier: 'blog' },
  '/blog/monthly-vs-one-time-mole-control/': { kw: 'monthly mole control plan', recH1: 'Monthly Mole Control vs One-Time Treatment', cluster: 'cost-value', tier: 'blog' },
  '/blog/when-are-moles-most-active-washington/': { kw: 'when are moles most active', recH1: 'When Are Moles Most Active in Washington?', cluster: 'seasonal', tier: 'blog' },
  '/blog/do-moles-come-back-after-trapping/': { kw: 'do moles come back after trapping', recH1: 'Do Moles Come Back After Trapping?', cluster: 'diy-vs-pro', tier: 'blog' },
  '/blog/are-moles-blind/': { kw: 'are moles blind', recH1: 'Are Moles Blind? Mole Eyesight Explained', cluster: 'biology', tier: 'blog' },
  '/blog/best-mole-traps/': { kw: 'best mole traps', recH1: 'Best Mole Traps: What Actually Works in Lawns', cluster: 'diy-vs-pro', tier: 'blog' },
  '/blog/do-mole-repellents-work/': { kw: 'do mole repellents work', recH1: 'Do Mole Repellents Work? Sonic, Plants, Granules', cluster: 'diy-vs-pro', tier: 'blog' },
  '/blog/does-grub-control-stop-moles/': { kw: 'does grub control stop moles', recH1: 'Does Grub Control Stop Moles? The Honest Answer', cluster: 'diy-vs-pro', tier: 'blog' },
  '/blog/how-long-do-moles-live/': { kw: 'how long do moles live', recH1: 'How Long Do Moles Live? Mole Lifespan Facts', cluster: 'biology', tier: 'blog' },
  '/blog/how-to-find-active-mole-tunnels/': { kw: 'how to find active mole tunnels', recH1: 'How to Find Active Mole Tunnels in Your Yard', cluster: 'diy-vs-pro', tier: 'blog' },
  '/blog/humane-mole-removal/': { kw: 'how to get rid of moles humanely', recH1: 'How to Get Rid of Moles Humanely', cluster: 'diy-vs-pro', tier: 'blog' },
  '/blog/are-moles-good-for-your-yard/': { kw: 'are moles good for the garden', recH1: 'Are Moles Good for Your Yard? The Real Trade-Off', cluster: 'biology', tier: 'blog' },
  '/blog/mole-vs-vole-vs-gopher/': { kw: 'mole vs vole vs gopher', recH1: 'Mole vs Vole vs Gopher: How to Tell Them Apart', cluster: 'biology', tier: 'blog' },
  '/blog/types-of-moles-in-washington/': { kw: 'types of moles in washington state', recH1: 'Types of Moles in Washington State', cluster: 'biology', tier: 'blog' },
  '/blog/what-do-moles-eat/': { kw: 'what do moles eat', recH1: 'What Do Moles Eat? Lawn Mole Diet', cluster: 'biology', tier: 'blog' },
};

// City pattern target
function cityKeyword(path) {
  const m = path.match(/^\/mole-control-([a-z0-9-]+)\/$/);
  if (!m) return null;
  const city = m[1].split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
  return {
    kw: `mole control ${city.toLowerCase()}`,
    recH1: `Mole Control in ${city}, WA`,
    recTitle: `Mole Control in ${city}, WA | Got Moles`,
    cluster: 'location-services',
    tier: 'city',
    city
  };
}

// Token-based partial match. We accept either:
//  - exact substring of the full keyword phrase, OR
//  - >= 70% of the meaningful tokens present (length>=3, common stopwords removed),
//    AND the head noun "mole/moles" is present when the keyword is mole-related.
function tokensIn(text, kw) {
  if (!text) return { hit: false, score: 0 };
  const t = text.toLowerCase();
  const k = kw.toLowerCase();
  if (t.includes(k)) return { hit: true, score: 1, exact: true };
  const STOP = new Set(['the','a','an','of','for','and','or','to','in','on','at','with','from','is','are','do','does','can','vs']);
  const words = k.split(/\s+/).filter(w => w.length >= 3 && !STOP.has(w));
  if (words.length === 0) return { hit: false, score: 0 };
  const hits = words.filter(w => t.includes(w)).length;
  const ratio = hits / words.length;
  // Mole anchor — if kw contains "mole", text must too
  if (k.includes('mole') && !t.includes('mole')) return { hit: false, score: ratio };
  return { hit: ratio >= 0.7, score: ratio };
}

const rows = [];
for (const rec of data) {
  const path = norm(rec.url);
  const cityMap = cityKeyword(path);
  const map = KEYWORD_MAP[path] || cityMap;

  if (!map) {
    rows.push({ path, status: 'UNMAPPED', title: rec.title, h1: rec.h1List?.[0], score: null });
    continue;
  }

  const h1 = (rec.h1List || [])[0] || '';
  const h2s = rec.h2List || [];
  const title = rec.title || '';
  const meta = rec.metaDescription || '';

  const h1Check = tokensIn(h1, map.kw);
  const titleCheck = tokensIn(title, map.kw);
  const metaCheck = meta ? tokensIn(meta, map.kw) : { hit: false, score: 0 };
  const h2Check = h2s.some(h => tokensIn(h, map.kw).hit) ? { hit: true } : { hit: false };

  const score = [h1Check.hit, titleCheck.hit, metaCheck.hit, h2Check.hit].filter(Boolean).length;

  rows.push({
    path,
    tier: map.tier,
    cluster: map.cluster,
    primaryKw: map.kw,
    h1,
    h2s,
    title,
    meta,
    titleLen: title.length,
    metaLen: meta.length,
    canonical: rec.canonical,
    h1Hit: h1Check.hit,
    titleHit: titleCheck.hit,
    metaHit: metaCheck.hit,
    h2Hit: h2Check.hit,
    score,
    h1Multi: (rec.h1List || []).length > 1,
    metaMissing: !meta,
    titleLenIssue: title.length < 30 || title.length > 60,
    metaLenIssue: !meta || meta.length < 120 || meta.length > 165,
    br: !!map.br,
    brNote: map.brNote,
    recH1: map.recH1,
    recTitle: map.recTitle || `${map.recH1} | Got Moles`,
  });
}

fs.writeFileSync(`${ROOT}/projects/seo-foundation-recovery/_audit-rows.json`, JSON.stringify(rows, null, 2));

// Summary stats
const audited = rows.filter(r => r.score !== null);
const unmapped = rows.filter(r => r.score === null);
const byScore = { 0:0, 1:0, 2:0, 3:0, 4:0 };
audited.forEach(r => byScore[r.score]++);

const cityRows = audited.filter(r => r.tier === 'city');
const blogRows = audited.filter(r => r.tier === 'blog' || r.tier === 'legacy');
const authRows = audited.filter(r => r.tier === 'authority');
const hubRows = audited.filter(r => r.tier === 'hub');

console.log('Total in JSON:', data.length);
console.log('Mapped:', audited.length);
console.log('Unmapped:', unmapped.length, unmapped.map(u => u.path));
console.log('By score:', byScore);
console.log('Healthy (4):', byScore[4]);
console.log('Minor (3):', byScore[3]);
console.log('P1 (0-2):', byScore[0]+byScore[1]+byScore[2]);
console.log('Cities:', cityRows.length, '| Blogs+Legacy:', blogRows.length, '| Authority:', authRows.length, '| Hubs:', hubRows.length);
console.log('Missing meta:', audited.filter(r => r.metaMissing).length);
console.log('Title len issue:', audited.filter(r => r.titleLenIssue).length);
console.log('Meta len issue:', audited.filter(r => r.metaLenIssue).length);
console.log('Multi H1:', audited.filter(r => r.h1Multi).length);
console.log('BR flag:', audited.filter(r => r.br).length);
