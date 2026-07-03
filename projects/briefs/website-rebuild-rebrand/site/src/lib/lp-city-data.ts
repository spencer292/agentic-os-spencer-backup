/**
 * lp-city-data.ts
 *
 * Block data for paid-search city landing pages at /lp/[city]/.
 * 5 cities: Seattle, Tacoma, Kent, Bellevue, Kirkland.
 * See projects/briefs/paid-search-landing-pages/2026-05-15_lp-build-spec-merged.md
 *
 * These pages bypass the CMS and render directly from these block arrays —
 * no seed step required.
 *
 * Reviews are picked at build time from testimonial-data.ts by a keyword-
 * weighted scorer (see pickLpReviews below) — top 3 per city.
 */

import { testimonialData } from './testimonial-data'
import { cityData } from './city-data'

export interface LpCity {
  slug: string
  displayName: string
  heroImage: string // filename without .webp, must exist in public/images/
  neighborhoods: string
  uniqueParagraph: string
  defaultZip: string // city's main ZIP — hidden field default for quick LP form
  metaTail?: string // optional last sentence of the meta description; defaults to "Nearly 5,000 yards served."
}

export const LP_CITIES: Record<string, LpCity> = {
  seattle: {
    slug: 'seattle',
    displayName: 'Seattle',
    heroImage: 'hero-king-county',
    neighborhoods: 'Ballard, Beacon Hill, Magnolia',
    uniqueParagraph:
      'From Ballard to Beacon Hill — same 4-5 week program, same flat pricing. Pay $150 upfront. $300 balance only if we catch. Chemical-free. Safe for pets and kids.',
    defaultZip: '98101',
  },
  tacoma: {
    slug: 'tacoma',
    displayName: 'Tacoma',
    heroImage: 'hero-pierce-county',
    neighborhoods: 'North End, Proctor, University Place',
    uniqueParagraph:
      "Pierce County yards — North End, Proctor, University Place. Same 4-5 week program, same flat pricing. Pay $150 upfront. $300 balance only if we catch. Chemical-free.",
    metaTail: "Pierce County's mole specialists.",
    defaultZip: '98402',
  },
  kent: {
    slug: 'kent',
    displayName: 'Kent',
    heroImage: 'hero-king-county',
    neighborhoods: 'Kent, Covington, Maple Valley',
    uniqueParagraph:
      'South King County — Kent, Covington, Maple Valley. Moles in clay-heavy soil are our specialty. Pay $150 upfront. $300 balance only if we catch. $450 total max.',
    metaTail: 'South King County mole specialists.',
    defaultZip: '98031',
  },
  bellevue: {
    slug: 'bellevue',
    displayName: 'Bellevue',
    heroImage: 'hero-king-county',
    neighborhoods: 'Bellevue, Medina, Clyde Hill',
    uniqueParagraph:
      'Bellevue, Medina, Clyde Hill — discreet trapping, clean restoration, no chemicals. Pay $150 upfront. $300 balance only if we catch. $450 total max.',
    metaTail: 'Discreet Eastside service.',
    defaultZip: '98004',
  },
  kirkland: {
    slug: 'kirkland',
    displayName: 'Kirkland',
    heroImage: 'hero-king-county',
    neighborhoods: 'Kirkland, Juanita, Finn Hill',
    uniqueParagraph:
      'Kirkland, Juanita, Finn Hill — proven 4-5 week program. Pay $150 upfront. $300 balance only if we catch. $450 total max. Chemical-free.',
    metaTail: 'Eastside mole specialists.',
    defaultZip: '98033',
  },
  redmond: {
    slug: 'redmond',
    displayName: 'Redmond',
    heroImage: 'hero-king-county',
    neighborhoods: 'Education Hill, Grass Lawn, Idylwood',
    uniqueParagraph:
      'Education Hill, Grass Lawn, Idylwood — same 4-5 week program, same flat pricing. Pay $150 upfront. $300 balance only if we catch. $450 total max. Chemical-free, safe for pets and kids.',
    defaultZip: '98052',
  },
  renton: {
    slug: 'renton',
    displayName: 'Renton',
    heroImage: 'hero-king-county',
    neighborhoods: 'Kennydale, Renton Highlands',
    uniqueParagraph:
      'Kennydale to the Renton Highlands — same 4-5 week program, same flat pricing. Pay $150 upfront. $300 balance only if we catch. $450 total max. Chemical-free, safe for pets and kids.',
    defaultZip: '98057',
  },
  tukwila: {
    slug: 'tukwila',
    displayName: 'Tukwila',
    heroImage: 'hero-king-county',
    neighborhoods: 'Green River valley, Tukwila International Boulevard',
    uniqueParagraph:
      'From the Green River valley to Tukwila International Boulevard — same 4-5 week program, same flat pricing. Pay $150 upfront. $300 balance only if we catch. $450 max. Chemical-free, safe for pets and kids.',
    defaultZip: '98168',
  },
  woodinville: {
    slug: 'woodinville',
    displayName: 'Woodinville',
    heroImage: 'hero-king-county',
    neighborhoods: 'Hollywood Hill, the Woodinville wine district',
    uniqueParagraph:
      'Hollywood Hill to the wine district — same 4-5 week program, same flat pricing. Pay $150 upfront. $300 balance only if we catch. $450 total max. Chemical-free, safe for pets and kids.',
    defaultZip: '98072',
  },
  shoreline: {
    slug: 'shoreline',
    displayName: 'Shoreline',
    heroImage: 'hero-king-county',
    neighborhoods: 'Ridgecrest, Hillwood, Hamlin Park',
    uniqueParagraph:
      'Ridgecrest, Hillwood, and the streets near Hamlin Park — same 4-5 week program, same flat pricing. Pay $150 upfront. $300 balance only if we catch. $450 max. Chemical-free, safe for pets and kids.',
    defaultZip: '98133',
  },
  'maple-valley': {
    slug: 'maple-valley',
    displayName: 'Maple Valley',
    heroImage: 'hero-king-county',
    neighborhoods: 'Lake Wilderness, Rock Creek',
    uniqueParagraph:
      'Lake Wilderness to Rock Creek — same 4-5 week program, same flat pricing. Pay $150 upfront. $300 balance only if we catch. $450 total max. Chemical-free, safe for pets and kids.',
    defaultZip: '98038',
  },
  burien: {
    slug: 'burien',
    displayName: 'Burien',
    heroImage: 'hero-king-county',
    neighborhoods: 'Seahurst, Gregory Heights, Manhattan',
    uniqueParagraph:
      'Seahurst, Gregory Heights, Manhattan — same 4-5 week program, same flat pricing. Pay $150 upfront. $300 balance only if we catch. $450 total max. Chemical-free, safe for pets and kids.',
    defaultZip: '98146',
  },
  issaquah: {
    slug: 'issaquah',
    displayName: 'Issaquah',
    heroImage: 'hero-king-county',
    neighborhoods: 'the Issaquah Highlands, historic downtown',
    uniqueParagraph:
      'From the Issaquah Highlands to historic downtown — same 4-5 week program, same flat pricing. Pay $150 upfront. $300 balance only if we catch. $450 max. Chemical-free, safe for pets and kids.',
    defaultZip: '98027',
  },
  enumclaw: {
    slug: 'enumclaw',
    displayName: 'Enumclaw',
    heroImage: 'hero-king-county',
    neighborhoods: 'central Enumclaw, the Plateau',
    uniqueParagraph:
      'Right here on the Plateau — central Enumclaw out to the farmland edge. Same 4-5 week program, same flat pricing. Pay $150 upfront. $300 balance only if we catch. $450 max. Chemical-free.',
    defaultZip: '98022',
  },
  puyallup: {
    slug: 'puyallup',
    displayName: 'Puyallup',
    heroImage: 'hero-pierce-county',
    neighborhoods: 'Downtown, South Hill, Pioneer Park',
    uniqueParagraph:
      'Downtown valley to South Hill — same 4-5 week program, same flat pricing. Pay $150 upfront. $300 balance only if we catch. $450 total max. Chemical-free, safe for pets and kids.',
    defaultZip: '98371',
  },
  buckley: {
    slug: 'buckley',
    displayName: 'Buckley',
    heroImage: 'hero-pierce-county',
    neighborhoods: 'White River Estates, Elk Meadows',
    uniqueParagraph:
      'White River Estates to Elk Meadows — same 4-5 week program, same flat pricing. Pay $150 upfront. $300 balance only if we catch. $450 max. Chemical-free, safe for pets and kids.',
    defaultZip: '98321',
  },
  covington: {
    slug: 'covington',
    displayName: 'Covington',
    heroImage: 'hero-king-county',
    neighborhoods: 'Jenkins Creek, Covington',
    uniqueParagraph:
      "Across Covington's Jenkins Creek neighborhoods — same 4-5 week program, same flat pricing. Pay $150 upfront. $300 balance only if we catch. $450 max. Chemical-free, safe for pets and kids.",
    defaultZip: '98042',
  },
  fife: {
    slug: 'fife',
    displayName: 'Fife',
    heroImage: 'hero-pierce-county',
    neighborhoods: 'West Fife',
    uniqueParagraph:
      'West Fife and the older streets near the floodplain — same 4-5 week program, same flat pricing. Pay $150 upfront. $300 balance only if we catch. $450 max. Chemical-free, safe for pets and kids.',
    defaultZip: '98424',
  },
  'federal-way': {
    slug: 'federal-way',
    displayName: 'Federal Way',
    heroImage: 'hero-king-county',
    neighborhoods: 'Dash Point, Steel Lake',
    uniqueParagraph:
      'Dash Point to Steel Lake — same 4-5 week program, same flat pricing. Pay $150 upfront. $300 balance only if we catch. $450 total max. Chemical-free, safe for pets and kids.',
    defaultZip: '98003',
  },
  sammamish: {
    slug: 'sammamish',
    displayName: 'Sammamish',
    heroImage: 'hero-king-county',
    neighborhoods: 'Klahanie, Sahalee, Pine Lake',
    uniqueParagraph:
      'Klahanie, Sahalee, Pine Lake — same 4-5 week program, same flat pricing. Pay $150 upfront. $300 balance only if we catch. $450 total max. Chemical-free, safe for pets and kids.',
    defaultZip: '98074',
  },
  'south-hill': {
    slug: 'south-hill',
    displayName: 'South Hill',
    heroImage: 'hero-pierce-county',
    neighborhoods: 'Sunrise, Gem Heights',
    uniqueParagraph:
      'Sunrise to Gem Heights — same 4-5 week program, same flat pricing. Pay $150 upfront. $300 balance only if we catch. $450 total max. Chemical-free, safe for pets and kids.',
    defaultZip: '98374',
  },
  kenmore: {
    slug: 'kenmore',
    displayName: 'Kenmore',
    heroImage: 'hero-king-county',
    neighborhoods: 'Sammamish River corridor, above Bothell Way',
    uniqueParagraph:
      'Along the Sammamish River corridor and the hills above Bothell Way — same 4-5 week program, same flat pricing. Pay $150 upfront. $300 balance only if we catch. $450 max. Chemical-free.',
    defaultZip: '98028',
  },
  'des-moines': {
    slug: 'des-moines',
    displayName: 'Des Moines',
    heroImage: 'hero-king-county',
    neighborhoods: 'Marine View Drive, Zenith, Woodmont',
    uniqueParagraph:
      'Marine View Drive to Zenith and Woodmont — same 4-5 week program, same flat pricing. Pay $150 upfront. $300 balance only if we catch. $450 total max. Chemical-free, safe for pets and kids.',
    defaultZip: '98198',
  },
  bothell: {
    slug: 'bothell',
    displayName: 'Bothell',
    heroImage: 'hero-king-county',
    neighborhoods: 'Downtown, Canyon Park, North Creek',
    uniqueParagraph:
      'Downtown to Canyon Park — same 4-5 week program, same flat pricing. Pay $150 upfront. $300 balance only if we catch. $450 total max. Chemical-free, safe for pets and kids.',
    defaultZip: '98011',
  },
}

// ─── Review picker ────────────────────────────────────────────────────────
//
// Picks the top 3 reviews per LP city using keyword weighting + city match.
// Tiers (Tier 1 highest weight): results > speed > trust > safety.

const TIER_1 = ['caught', 'gone', 'worked', 'results', 'no more', 'effective', 'fixed', 'mole-free']

// Posture A banned terms — silent on trap mechanism + kill language, per
// projects/briefs/got-moles-paid-search/10-i713-mole-trap-legality.md.
// Applies even to customer quotes — page content must be clean.
const POSTURE_A_BANNED = [
  'lethal',
  'kill',
  'killed',
  'killing',
  'killer',
  'poison',
  'poisoned',
  'harpoon',
  'scissor',
  'body-gripping',
  'body gripping',
  'spear',
  'spike',
  'eradicate',
  'eradicating',
  'eradication',
  'eliminate', // (Tier 1 keyword 'eliminated' removed above)
  'eliminated',
  'eliminating',
]

function containsBannedTerm(quote: string): boolean {
  const q = quote.toLowerCase()
  return POSTURE_A_BANNED.some((term) => q.includes(term))
}
const TIER_2 = ['quickly', 'fast', 'responsive', 'same day', 'within a week', 'prompt', 'quick']
const TIER_3 = ['spencer', 'professional', 'communication', 'honest', 'fair', 'transparent', 'recommend', 'explained']
const TIER_4 = ['pets', 'kids', 'safe', 'chemical-free', 'children']

// Adjacent cities per LP — used for city-match scoring fallback.
const ADJACENT: Record<string, string[]> = {
  seattle: ['renton', 'burien', 'seatac', 'tukwila', 'shoreline', 'mercer island'],
  tacoma: ['lakewood', 'university place', 'fircrest', 'steilacoom', 'fife', 'puyallup'],
  kent: ['auburn', 'federal way', 'renton', 'maple valley', 'covington', 'des moines'],
  bellevue: ['kirkland', 'redmond', 'mercer island', 'medina', 'clyde hill', 'newcastle', 'sammamish'],
  kirkland: ['bellevue', 'redmond', 'sammamish', 'bothell', 'woodinville', 'juanita'],
  redmond: ['bellevue', 'kirkland', 'sammamish', 'woodinville', 'bothell'],
  renton: ['kent', 'tukwila', 'newcastle', 'seattle', 'skyway'],
  tukwila: ['renton', 'seatac', 'burien', 'kent', 'seattle'],
  woodinville: ['bothell', 'redmond', 'kirkland', 'kenmore', 'duvall'],
  shoreline: ['seattle', 'edmonds', 'lake forest park', 'mountlake terrace', 'kenmore'],
  'maple-valley': ['kent', 'covington', 'black diamond', 'renton', 'ravensdale'],
  burien: ['seatac', 'tukwila', 'des moines', 'normandy park', 'white center'],
  issaquah: ['sammamish', 'bellevue', 'newcastle', 'renton', 'snoqualmie'],
  enumclaw: ['buckley', 'black diamond', 'bonney lake', 'auburn', 'covington'],
  puyallup: ['south hill', 'sumner', 'tacoma', 'edgewood', 'fife'],
  buckley: ['enumclaw', 'bonney lake', 'south hill', 'sumner', 'orting'],
  covington: ['kent', 'maple valley', 'auburn', 'black diamond', 'fairwood'],
  fife: ['tacoma', 'milton', 'edgewood', 'puyallup', 'federal way'],
  'federal-way': ['kent', 'auburn', 'des moines', 'milton', 'tacoma'],
  sammamish: ['issaquah', 'redmond', 'bellevue', 'kirkland', 'newcastle'],
  'south-hill': ['puyallup', 'sumner', 'graham', 'frederickson', 'tacoma'],
  kenmore: ['bothell', 'woodinville', 'lake forest park', 'kirkland', 'shoreline'],
  'des-moines': ['seatac', 'burien', 'federal way', 'normandy park', 'kent'],
  bothell: ['kenmore', 'woodinville', 'kirkland', 'mill creek', 'lynnwood'],
}

function keywordScore(quote: string, featured: boolean): number {
  const q = quote.toLowerCase()
  let score = 0
  for (const kw of TIER_1) if (q.includes(kw)) score += 4
  for (const kw of TIER_2) if (q.includes(kw)) score += 3
  for (const kw of TIER_3) if (q.includes(kw)) score += 2
  for (const kw of TIER_4) if (q.includes(kw)) score += 1

  // Length sweet spot: 80-240 chars
  const len = quote.length
  if (len >= 80 && len <= 240) score += 2
  else if (len < 60 || len > 320) score -= 2

  if (featured) score += 2

  return score
}

function normalizeCity(c: string): string {
  return c.toLowerCase().replace(/, wa$/, '').trim()
}

// Stable offset per slug so each LP gets a different slice of the fallback pool.
const FALLBACK_OFFSET: Record<string, number> = {
  seattle: 0,
  tacoma: 0,
  kent: 3,
  bellevue: 6,
  kirkland: 9,
}

export interface LpReviewPick {
  reviews: { text: string; name: string; city: string; rating: number }[]
  cityMatched: boolean // true if any review came from exact city match
}

export function pickLpReviews(lpSlug: string): LpReviewPick {
  const scored = testimonialData
    .filter(
      (r) =>
        r.status === 'published' &&
        r.rating === 5 &&
        r.quote &&
        r.quote.length > 0 &&
        !containsBannedTerm(r.quote),
    )
    .map((r) => ({
      text: r.quote,
      name: r.name,
      city: r.city,
      cityNorm: normalizeCity(r.city),
      rating: r.rating,
      score: keywordScore(r.quote, r.featured === true),
    }))
    .sort((a, b) => b.score - a.score)

  const adjacent = ADJACENT[lpSlug] || []
  const seen = new Set<string>()
  const picks: typeof scored = []
  let cityMatched = false

  const tryAdd = (predicate: (r: (typeof scored)[number]) => boolean, markMatch = false) => {
    for (const r of scored) {
      if (picks.length >= 3) break
      if (seen.has(r.name)) continue
      if (!predicate(r)) continue
      picks.push(r)
      seen.add(r.name)
      if (markMatch) cityMatched = true
    }
  }

  tryAdd((r) => r.cityNorm === lpSlug, true)
  tryAdd((r) => adjacent.includes(r.cityNorm))

  // WA-general fallback — rotate by per-slug offset so each LP shows different reviews.
  if (picks.length < 3) {
    const offset = FALLBACK_OFFSET[lpSlug] ?? 0
    const remaining = scored.filter((r) => !seen.has(r.name))
    const rotated = [...remaining.slice(offset), ...remaining.slice(0, offset)]
    for (const r of rotated) {
      if (picks.length >= 3) break
      if (seen.has(r.name)) continue
      picks.push(r)
      seen.add(r.name)
    }
  }

  return {
    reviews: picks.slice(0, 3).map(({ text, name, city, rating }) => ({ text, name, city, rating })),
    cityMatched,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// ─── Lexical helpers (richText content for ImageText / richContent blocks) ──
function lxText(text: string) {
  return { type: 'text', text, version: 1, format: 0, detail: 0, mode: 'normal', style: '' }
}
function lxParagraph(text: string) {
  return { type: 'paragraph', version: 1, children: [lxText(text)], direction: 'ltr', format: '', indent: 0, textFormat: 0, textStyle: '' }
}
function lxParagraphs(...texts: string[]) {
  return { root: { type: 'root', version: 1, children: texts.map(lxParagraph), direction: 'ltr', format: '', indent: 0 } }
}

// Real "before" mole-damage hero photo per city (compressed WebP in public/images).
// 5 real yards distributed by look; swap to hi-res originals under the same names later.
const HERO_BEFORE: Record<string, string> = {
  enumclaw: 'hero-lp-before-1', buckley: 'hero-lp-before-1', woodinville: 'hero-lp-before-1',
  'maple-valley': 'hero-lp-before-1', fife: 'hero-lp-before-1',
  bellevue: 'hero-lp-before-2', kirkland: 'hero-lp-before-2', sammamish: 'hero-lp-before-2',
  redmond: 'hero-lp-before-2', issaquah: 'hero-lp-before-2',
  seattle: 'hero-lp-before-3', 'des-moines': 'hero-lp-before-3',
  puyallup: 'hero-lp-before-4', 'south-hill': 'hero-lp-before-4', tacoma: 'hero-lp-before-4',
  shoreline: 'hero-lp-before-4', kenmore: 'hero-lp-before-4',
  kent: 'hero-lp-before-5', renton: 'hero-lp-before-5', tukwila: 'hero-lp-before-5',
  covington: 'hero-lp-before-5', burien: 'hero-lp-before-5', 'federal-way': 'hero-lp-before-5',
  bothell: 'hero-lp-before-2',
}

// Standard, Posture-A-clean FAQ set — replaces the raw city-data.ts FAQs on LPs
// (those carried a "legal in Washington / wildlife regulations" line we stay silent on).
function lpFaqs(c: string) {
  return [
    { question: `How much does mole control in ${c} cost?`, answer: `$150 to start. If we catch moles during the 4-5 week program, the total is $450. If we don't catch any, you owe nothing beyond the $150 — $450 is the most you'll ever pay.` },
    { question: 'Is it safe for my pets and kids?', answer: 'Completely. No poisons and no chemicals — nothing that touches the grass your family and pets use. Our methods are professional and placed below the surface in the active runs.' },
    { question: 'Will the moles come back?', answer: `Once we clear the active moles, your yard is clear. Over time new moles can move in from neighboring property — which is why many ${c} homeowners choose our $100/month Total Mole Control Program for year-round protection.` },
    { question: 'How fast can you come out?', answer: 'Spencer calls you back the same business day, and first visits are usually within a few days of booking.' },
    { question: 'Do moles bite or carry disease?', answer: `Moles aren't aggressive and bites are extremely rare. The real problem is the damage their tunneling does to your lawn, beds, and irrigation lines.` },
    { question: `Do you service ${c}?`, answer: `Yes — we've protected yards across ${c} and the surrounding area since 2017, part of nearly 5,000 Western Washington properties served.` },
  ]
}

export function buildLpBlocks(city: LpCity): any[] {
  const C = city.displayName
  const cd = cityData[city.slug]
  const localProof = cd?.whyMolesThrive ? [{ blockType: 'geoDefinition', content: cd.whyMolesThrive }] : []

  return [
    {
      blockType: 'hero',
      heading: `Mole Removal in ${C}`,
      subheading: `Moles tearing up your ${C} lawn? Fresh mounds every morning, tunnels that collapse when you mow — and they don't stop on their own. We're ${C}'s mole specialists, and you only pay the balance if we actually catch them. $150 to start. $450 max.`,
      layout: 'left',
      heroHeight: '70vh',
      heroOverlay: 'strong',
      fallbackImage: HERO_BEFORE[city.slug] || 'hero-lp-before-1',
      cta: {
        text: 'CALL (253) 750-0211',
        url: 'tel:+12537500211',
        style: 'primary',
      },
      trustStrip: [
        '219+ 5-Star Reviews',
        'Nearly 5,000 Yards',
        'Since 2017',
        'Veteran-Owned',
        'Safe for Pets & Kids',
      ],
    },
    {
      blockType: 'painPoints',
      heading: `Not Sure It's Moles in Your ${C} Yard?`,
      showDivider: false,
      background: 'grass',
      body: `If you're seeing volcano-shaped mounds of fresh soil — often appearing overnight — it's moles. So are spongy, raised ridges that give underfoot, brown patches where roots have been cut, and damage that keeps spreading no matter what you try.\n\nMoles don't stop on their own. A single mole can work an entire ${C} yard, pushing up mound after mound and tunneling day after day. The longer it goes, the more lawn there is to repair.\n\nThat's all we deal with. Moles. Nothing else.`,
    },
    {
      blockType: 'stepsProcess',
      heading: `How Your ${C} Mole Service Works`,
      showDivider: false,
      background: 'grass-alt',
      steps: [
        {
          number: '01',
          title: 'Call or Request a Callback',
          summary: "Tell us what's happening. We quote your property over the phone.",
          description:
            "Phone (253) 750-0211 or fill out the form. Tell us where you're seeing damage and how long it's been going on. We'll ask a few questions, answer yours, and give you a clear price — all over the phone. No pressure, no upsell, no surprise quote visit.",
        },
        {
          number: '02',
          title: 'Book and Pay $150 to Start',
          summary: 'Confirm your service and pay the $150 setup. That is all you owe upfront.',
          description:
            "Once you're ready, we schedule your first visit and take the $150 setup fee. That fee is the only thing you pay upfront. The rest is only due if we catch moles.",
        },
        {
          number: '03',
          title: 'First Visit: We Inspect and Set Traps',
          summary: 'Tech walks your yard, identifies active runs, and sets professional equipment — all in one visit.',
          description:
            "Our technician arrives on your booked date and does the full property walk on arrival — active runs, fresh mounds, soil patterns, entry points. From that assessment we place professional equipment in the right spots. Inspection and trap-setting happen in the same visit. No separate pre-sales call-out, no charge for the assessment — it's part of your booked service.",
        },
        {
          number: '04',
          title: 'Weekly Checks for 4-5 Weeks. Balance Only If We Catch.',
          summary: '$300 balance after 4-5 weeks — only if moles caught. $450 total max.',
          description:
            "We return each week to check traps, document progress, adjust placement, and remove anything caught. You don't have to be home. If we catch moles, the $300 balance is due at the end. If we don't catch any, you owe nothing beyond the $150 setup. $450 is the maximum you'll ever pay.",
        },
      ],
      cta: {
        text: 'CALL (253) 750-0211',
        url: 'tel:+12537500211',
      },
    },
    {
      blockType: 'painPoints',
      heading: 'A Mole Specialist, Not a Pest Control Company',
      showDivider: false,
      background: 'grass',
      body: `You've probably stomped the mounds flat. Maybe bought traps from the hardware store, or tried castor oil, repellents, or sonic spikes. Maybe even called a pest control company that said they'd handle it. And the moles came back.\n\nIt's not your fault. General pest control companies chase every bug and rodent under the sun — moles are an afterthought. DIY remedies might shift a mole for a day or two, but they don't clear an active tunnel network; the mole just routes around them.\n\nWe do one thing: moles. Nearly 5,000 Western Washington yards since 2017. We read the active runs and work them every week until your yard is clear. That's the difference between chasing mounds and being done with them.`,
    },
    (() => {
      const { reviews, cityMatched } = pickLpReviews(city.slug)
      return {
        blockType: 'testimonial',
        heading: cityMatched
          ? `What ${city.displayName}-Area Homeowners Say`
          : 'What Got Moles Customers Say',
        background: 'grass-alt',
        quotes: reviews,
        moreLink: {
          text: 'See all 219+ reviews',
          url: '/reviews/',
        },
      }
    })(),
    ...localProof,
    {
      blockType: 'faq',
      heading: `Mole Control in ${C} — Common Questions`,
      items: lpFaqs(C),
      generateSchema: true,
      background: 'grass-alt',
    },
    {
      blockType: 'imageText',
      heading: 'You Deal With Spencer and His Crew',
      imagePosition: 'left',
      fallbackImage: 'team-spencer-crew',
      imageAlt: 'Spencer Hill and the Got Moles crew',
      background: 'grass',
      content: lxParagraphs(
        'No call center. No franchise. Got Moles is Spencer Hill and his team — veteran-owned, Washington-based, and focused on moles since 2017.',
        `When you call, you're talking to the people who will actually clear your ${C} yard. We live and work here too.`,
      ),
    },
    {
      blockType: 'cta',
      heading: 'Never Worry About Moles Again',
      body: 'Our Total Mole Control Program is $100/month with a 12-month contract. Unlimited visits. No other charges. Hundreds of yards already on year-round protection.',
      buttonText: 'CALL ABOUT YEAR-ROUND PROTECTION',
      buttonUrl: 'tel:+12537500211',
      buttonStyle: 'secondary',
      subtext: '$100/month · 12-month contract · Unlimited visits',
      showForm: false,
      background: 'grass-alt',
    },
    {
      blockType: 'cta',
      heading: `Ready to Get Started in ${city.displayName}?`,
      body: 'Call (253) 750-0211 or fill out the form below. Spencer calls you back same business day.',
      buttonText: 'CALL (253) 750-0211',
      buttonUrl: 'tel:+12537500211',
      buttonStyle: 'primary',
      subtext: '$150 to start. $450 max. Balance only if we catch.',
      showForm: true,
      background: 'gradient',
    },
  ]
}
