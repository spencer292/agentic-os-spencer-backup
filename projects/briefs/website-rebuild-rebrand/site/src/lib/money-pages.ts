/**
 * Money-page registry — internal-linking-recovery R1.
 *
 * The three commercial "money" pages every blog + city page must funnel link
 * equity and visitors toward, in priority order:
 *   TMCP (highest LTV) → One-Time Removal → Commercial.
 *
 * Blog + city data declare a `primaryMoneyPage`; templates read it to render a
 * prominent contextual link (R2/R4). The flow is enforced at the template level
 * so current AND future pages comply by setting a single field.
 *
 * Canonical spec: projects/briefs/internal-linking-recovery/2026-05-24_internal-linking-architecture.md
 */
export type MoneyPage = 'tmcp' | 'one-time' | 'commercial'

export const MONEY_PAGE_URL: Record<MoneyPage, string> = {
  tmcp: '/services/total-mole-control-program/',
  'one-time': '/services/one-time-mole-removal/',
  commercial: '/services/commercial-mole-control/',
}

/**
 * Varied, descriptive offer anchors per money page (R7 — no identical anchor
 * used >5× sitewide). Rendered as: `{lead} Our {anchor} {tail}`. A template
 * picks one anchor deterministically by slug, so the same destination shows
 * diverse anchor text across pages.
 *
 * Claim discipline (feedback_got_moles_claim_discipline): permanence language
 * ("for good") only on TMCP; one-time clears CURRENT moles; "guarantee" = the
 * pay-only-if-we-catch payment promise, never biological eradication. Posture A:
 * no trap-mechanism detail.
 */
export const MONEY_LINK: Record<MoneyPage, { lead: string; anchors: string[]; tail: string }> = {
  tmcp: {
    lead: 'Want moles handled for good, not just for now?',
    anchors: [
      'year-round mole protection',
      'Total Mole Control Program',
      'ongoing mole protection',
      'continuous mole control',
      'monthly mole protection',
      'all-season mole protection',
      'recurring mole protection',
      'year-round mole defense',
    ],
    tail: 'keeps your Western Washington yard covered with regular visits and a written report after every check.',
  },
  'one-time': {
    lead: 'Got active moles right now?',
    anchors: [
      'one-time mole removal',
      'flat-rate mole removal',
      'focused mole removal program',
      'professional mole removal',
      'one-time removal service',
    ],
    tail: "clears the moles in your yard over 4–5 weekly visits — and if we don't catch one, you pay only the setup fee.",
  },
  commercial: {
    lead: 'Managing grounds or a commercial property?',
    anchors: [
      'commercial mole control',
      'commercial mole control service',
      'commercial mole management',
    ],
    tail: 'covers HOAs, sports fields, and managed properties with reliable scheduling and professional reporting.',
  },
}

/** Deterministic anchor pick by slug so a destination's anchor varies per page. */
export function pickMoneyAnchor(page: MoneyPage, slug: string): string {
  const anchors = MONEY_LINK[page].anchors
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0
  return anchors[h % anchors.length]
}
