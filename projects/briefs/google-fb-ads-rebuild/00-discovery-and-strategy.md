---
project: google-fb-ads-rebuild
status: active
level: 2
created: 2026-05-04
client: got-moles
owner: Roy
---

# Got Moles — Google + Facebook Ads Rebuild

**Discovery + strategy document. Session of 2026-05-04.**

Built before account access is available. Goal: a policy-clean, ground-up Google Ads + Meta Ads plan that can be imported the day Spencer grants access, rather than inheriting (and debugging) the previous agency's silently throttled account.

---

## 1. Why we're rebuilding from scratch

The previous agency ran campaigns on keywords that Google now flags as non-usable. Google did not disapprove the campaigns outright — instead, many keywords are sitting in **"Eligible (limited)"** status, which throttles serving without showing as disapproved. The dashboard says "Eligible," delivery quietly tanks, and nobody flags it because the UI looks fine.

Two structural changes between 2024-2026 sit behind most of the damage:

1. **June 14, 2024 — LSA wildlife purge.** Google removed the "Wildlife Removal" job type from the Local Services Ads Pest Control vertical ([source](https://animalcontrolmarketing.com/local-service-ads-for-wildlife-removal-are-gone-for-now/), [Coalmarch July 2024](https://www.coalmarch.com/resources/blog/google-local-service-ads-updates-july-2024)). Moles now have to be classed under **rodent**. If the previous agency had moles tagged under wildlife — or LP language reads "wildlife" — LSA went silently dark.

2. **Tightening of the animal-cruelty + dangerous-products policies** with NLP-based enforcement on landing-page copy. Words like *kill*, *poison*, *bait*, *exterminate*, *eradication* now trigger limited-serving flags even in legitimate pest-control contexts.

The fix is not to argue with Google. The fix is to design the account so it never trips the filters in the first place.

---

## 2. What we have to work with

### 2.1 PPC actuals (the previous agency's spend)

Source: `projects/briefs/website-rebuild-rebrand/Got Moles - PPC Growth YoY + SEO Progress and Fruits.xlsx` → Sheet5

| Metric | 2024 (full year) | Jan 1 – Nov 30 2025 |
|---|---|---|
| Google spend | $6,780.69 | $6,127.14 |
| Bing spend | $1,978.60 | $3,159.22 |
| **Total spend** | **$8,759.29** | **$9,286.36** |
| Total leads | 874 | 903 |
| **CPL** | **$10.02** | **$10.28** |

Sub-$11 CPL is far below US pest-control benchmarks ($40-$120). Two possible explanations: (a) the lead definition is loose (form fills, not qualified jobs booked), or (b) the campaigns are running purely on hyper-local long-tail with low competitive density. Needs Spencer to confirm lead quality before we anchor any benchmark to this.

### 2.2 SEO baseline (organic, not paid)

Source: same workbook → Overview tab + Rankings tab → exported to `projects/briefs/website-rebuild-rebrand/rankings-export.csv` (2,668 keywords × 14 historical rank columns).

| Metric | 6/1/2025 | 12/1/2025 | Delta |
|---|---|---|---|
| Total keywords ranked | 1,012 | 1,057 | +45 |
| First page | 806 | 889 | +83 |
| Top 3 | 620 | 698 | +78 |

Latest ranking distribution (04.12.2025 column, 2,668 tracked keywords):

| Bucket | Count | % |
|---|---|---|
| #1 | 635 | 23.8% |
| Top 3 | 1,409 | 52.8% |
| Top 10 | 1,799 | 67.4% |
| Top 20 | 1,963 | 73.6% |
| 21-100 | 442 | 16.6% |
| >100 | 252 | 9.4% |

This is the organic moat. Paid strategy should defend, not duplicate, the 635 #1s.

### 2.3 Keyword universe by intent cluster

| Cluster | Keywords |
|---|---|
| mole removal | 399 |
| mole pest removal / service | 336 |
| mole control | 314 |
| moles in yard / ground moles | 294 |
| identification / damage / signs | 213 |
| mole exterminator / extermination | 159 |
| mole trapper / trapping / catcher | 147 |
| mole repellent / deterrent | 114 |
| mole problem | 106 |
| biology (blind, diet, nocturnal, rabies) | 101 |
| near me | 58 |
| vole / gopher (adjacent) | 45 |
| how-to / DIY | 11 |
| pet / garden safety | 6 |
| cost / price | 6 |
| commercial / HOA / golf | 1 |

Two flags from this distribution:

- **Commercial / HOA / golf has 1 tracked keyword** but Got Moles has a `/lp/commercial/` LP and a `/services/commercial-mole-control/` page. Either commercial demand isn't being searched (commercial buyers go direct), or it's a tracking gap. Investigate.
- **"Cost" (6) and "near me" (58) are barely tracked.** These are the highest-intent commercial heads. Current campaigns may be over-indexed on city+verb long-tail and under-exposed to high-intent commercial heads.

### 2.4 Top cities by keyword coverage (top 20)

Tacoma 108 · Seattle 97 · Redmond 94 · Puyallup 91 · Renton 78 · Woodinville 71 · Bellevue 69 · Shoreline 67 · Tukwila 67 · SeaTac 64 · Burien 58 · Issaquah 56 · Maple Valley 56 · Kent 54 · Kirkland 53 · Sammamish 53 · Enumclaw 51 · Federal Way 51 · Fife 44 · Des Moines 41

### 2.5 Existing landing pages

**Site root:** `projects/briefs/website-rebuild-rebrand/site/src/app/(frontend)/`

**Campaign LPs (noindex, ad-only)** — `/lp/`:

| Route | Intended campaigns | CTA |
|---|---|---|
| `/lp/mole-removal/` | "{city} mole removal", "mole removal near me" | $450 flat-rate |
| `/lp/mole-trapper/` | "mole trapper near me", "mole catcher near me" | Chemical-free specialist |
| `/lp/mole-protection-plan/` | "mole control program", "monthly mole control" | TMCP $100/mo |
| `/lp/commercial/` | "commercial mole control", "property management mole control" | HOA / annual contracts |

**Service pages** — `/services/`:
- `/services/one-time-mole-removal/` — $450 service
- `/services/total-mole-control-program/` — TMCP $100/mo + $150 setup
- `/services/commercial-mole-control/` — annual contracts

**City pages** — `/[citySlug]/` dynamic, ~90 cities

**Other:** `/`, `/blog/` (7 live, 26 planned), `/about`, `/how-it-works`, `/faq`, `/reviews`, `/reviews/commercial-case-studies`, `/service-areas`, `/contact`

LP copy templates: `projects/briefs/website-rebuild-rebrand/copy-adwords-lps.md`
Full URL inventory: `projects/briefs/website-rebuild-rebrand/url-inventory.md`

---

## 3. Google Ads policy investigation

### 3.1 The policies that hit pest control

| Policy | What it covers | Source |
|---|---|---|
| Animal cruelty | NLP enforcement on language describing harm to animals — even in legitimate pest contexts | [support.google.com/adspolicy/answer/16490052](https://support.google.com/adspolicy/answer/16490052) |
| Dangerous products or services | Poisons, baits, unregulated pesticides | [support.google.com/adspolicy/answer/6014299](https://support.google.com/adspolicy/answer/6014299) |
| Inappropriate / shocking content | Violent language, graphic descriptions | [support.google.com/adspolicy/answer/6015406](https://support.google.com/adspolicy/answer/6015406) |
| Misrepresentation | Absolute claims, guarantees of biological outcomes | [support.google.com/adspolicy/answer/6020955](https://support.google.com/adspolicy/answer/6020955) |
| Eligible (limited) status | Silent throttling — UI shows Eligible, serving is capped | [support.google.com/adspolicy/answer/2684542](https://support.google.com/adspolicy/answer/2684542) |
| LSA Pest Control vertical | Job-type taxonomy that excludes wildlife (since June 2024) | [Coalmarch summary](https://www.coalmarch.com/resources/blog/google-local-service-ads-updates-july-2024) |

Hunting/trapping is in principle allowed ([Google's 2019 clarification on hunting ads](https://www.spokesman.com/stories/2019/may/09/google-clarifies-hunting-ads-ok/)). Enforcement has tightened. NLP filters now flag descriptions that would have passed three years ago.

### 3.2 Microsoft Advertising parity

Microsoft Advertising's policies ([about.ads.microsoft.com/en-us/policies/home](https://about.ads.microsoft.com/en-us/policies/home)) mirror Google on dangerous products and animal cruelty but enforce far less aggressively via NLP. This is why the same keywords often run on Bing untouched. Treat Bing as a control group: if a term works on Bing but is throttled on Google, the issue is Google's NLP, not the term itself. Got Moles already spends $3K/yr on Bing — useful signal.

---

## 4. Red / Amber / Green keyword framework

| Risk | Terms | Policy hit | Action |
|---|---|---|---|
| 🔴 RED | `mole poison`, `mole bait`, `mole killer`, `kill moles` | Dangerous products + Shocking content | Drop entirely. Negative-keyword them. |
| 🔴 RED | `mole exterminator`, `extermination`, "guaranteed eradication", "100% mole removal", "permanent solution" | Misrepresentation (absolute biological claims) | Rewrite in service language. Audit LPs for these terms. |
| 🟠 AMBER | `mole trapper`, `mole trapping`, `body-gripping trap` | Animal cruelty NLP false-positives | Allowed in principle, throttled in practice. Test on Bing first. Pair with humane/professional framing on LP. |
| 🟠 AMBER | `mole catcher`, `get rid of moles`, `mole problem` | Policy-fine; "get rid of moles" pulls DIY-product searchers | Negative-keyword qualifier ("home depot", "diy", etc.) rather than killing the term |
| 🟢 GREEN | `mole removal`, `mole control`, `professional mole control`, `humane mole removal`, `lawn mole specialist`, `mole control program` | Service-framed, no kill verbs, no absolute claims | Build the account on these. ~820 KWs in our universe sit here. |

### Policy-safe substitutions (for ad copy + LP rewrites)

| Replace this | With this |
|---|---|
| Exterminator, extermination | Removal specialists, mole control specialists |
| Kill, killing moles | Remove, professional removal |
| Eradicate, eradication, get rid of permanently | Resolve, remove, clear |
| Guaranteed 100% mole removal | 60-day callback warranty / we return free if moles return within X days |
| Mole poison, mole bait | Chemical-free professional service |
| Mole killer | Lawn-safe mole control |

The rewrite rule: describe the **service and warranty**, not the **biological outcome**.

---

## 5. Negative keyword strategy

Google Ads' NLP doesn't care about ambiguity — but the auction does. "Mole" without qualifiers pulls dermatology, cosmetic, recipe, and pop-culture searchers at scale. This is probably where a chunk of the previous agency's spend disappeared.

All of the below applied as **broad-match negatives at the account level** so they apply to every campaign, every ad group.

### 5.1 Skin / body / face moles (medical) — the big one
skin, face, body, neck, arm, leg, back, scalp, eye, eyelid, lip, nose, chin, breast, chest, foot, hand, finger, toe, baby, child, kids, on dog, on cat, on horse, pet skin

### 5.2 Dermatology + medical intent
removal cream, removal kit, removal pen, removal patch, freeze, cauterize, cauterise, laser, mole laser, surgical, surgery, biopsy, dermatologist, dermatology, doctor, clinic, hospital, NHS, Medicare, insurance, cancer, cancerous, melanoma, atypical, dysplastic, benign, malignant, ABCDE, itchy, bleeding, raised, flat, hairy, dark, black, brown, red, new mole, growing, changing, mole check, mole map, mole screening, mole scan

### 5.3 Cosmetic / DIY skin remedies
beauty mark, beauty spot, birthmark, freckle, wart, skin tag, tag remover, apple cider vinegar, tea tree, iodine, banana peel, garlic, home remedy mole, get rid of mole on, how to remove a mole, remove mole at home

### 5.4 Pop culture / other meanings
mole the movie, mole tv show, the mole netflix, mole rat, naked mole rat, star nose mole, mole sauce, mole recipe, mole poblano, chemistry mole, avogadro, mol, molar, spy, undercover, whack a mole game

### 5.5 Animals that aren't lawn moles (separate or exclude)
gopher (separate campaign if targeted), vole (separate), shrew, rat, mouse, rabbit, raccoon, squirrel, possum

### 5.6 DIY-product intent
home depot, lowes, amazon, walmart, costco, best mole trap to buy, buy mole trap, mole trap reviews, diy mole removal, diy mole trap, sonic repeller, ultrasonic, castor oil

**First-pass total:** ~120+ negatives. Account-level. This list will grow as we monitor search-terms reports post-launch.

---

## 6. The build plan (7 phases)

Each phase gates the next.

| # | Phase | Output | Status |
|---|---|---|---|
| 1 | LP policy audit — review all 4 `/lp/` pages + 3 service pages against Google's animal-cruelty / misrepresentation / dangerous-products policies. LP language is what triggers Eligible (limited). | `01-lp-policy-audit.md` (R/A/G per page + rewrite list) | **Next** |
| 2 | Policy-safe keyword universe — filter the 2,668 keywords through R/A/G; ringfence ~820 GREEN as launchable base | `02-keyword-universe.md` + filtered CSV | Pending |
| 3 | Negative keyword list — formalize the ~120 above + DIY/product/dermatology clusters | `03-negative-keywords.md` | Drafted (Section 5 above) |
| 4 | Campaign structure + ad-group architecture — match keywords to LPs, match types, conversion model | `04-campaign-structure.md` | Pending |
| 5 | Ad copy templates — RSAs that pass policy NLP, in Got Moles voice, mapped to each LP | `05-ad-copy.md` | Pending |
| 6 | Facebook / Meta Ads parallel track — different policy regime (Meta looser on language, stricter on imagery) | `06-meta-ads-plan.md` | Pending |
| 7 | Account-access audit kit — pre-built checklist for the day access lands | `07-account-audit-kit.md` | Pending |

### Why this order

**LP audit first** because LP language can throttle every campaign that points to it. Fixing keywords with broken LPs is fixing the wrong thing.

**Negatives before structure** because the negative list shapes the match-type strategy in Phase 4 (broad match becomes safer when negatives are heavy).

**Meta last** because it's a different system, not a Google clone. Building it as a fork of the Google plan would replicate Google's structural assumptions in a place they don't apply.

---

## 7. Open questions / blockers

| # | Question | Owner | Why it matters |
|---|---|---|---|
| 1 | Google Ads + Bing Ads account access | Roy → Spencer | Without this we can't run the `Eligible (limited)` audit, can't pull the previous agency's actual keyword list, can't see historical disapprovals. ETA 1-2 weeks. Plan progresses in parallel. |
| 2 | Lead-quality definition behind the $10.28 CPL | Roy → Spencer | Are these qualified booked jobs, or form fills? Anchors all future CPL targets. |
| 3 | Existing Google Ads account ID + LSA listing | Spencer | Needed for the day-1 audit; also needed to request LSA re-categorization from "wildlife" to "rodent" if mis-tagged |
| 4 | Whether Spencer wants to keep the previous agency relationship or cold-start cleanly | Roy → Spencer | Memory: feedback_cold_start_over_handover.md — public recon often shows handover effort is wasted; cold-start is faster |

---

## 8. References

### Internal files (clickable)
- **Keyword research / intent map:** `projects/briefs/mole-content-authority/search-intent-map.md`
- **Keyword gap analysis:** `projects/briefs/mole-content-authority/keyword-gap-analysis.md`
- **Pre-launch keyword corpus brief:** `projects/briefs/website-launch-readiness/keyword-corpus-brief.md`
- **PPC + SEO spreadsheet (raw):** `projects/briefs/website-rebuild-rebrand/Got Moles - PPC Growth YoY + SEO Progress and Fruits.xlsx`
- **Rankings export (extracted today):** `projects/briefs/website-rebuild-rebrand/rankings-export.csv`
- **Redirect matrix (URL history):** `projects/briefs/seo-geo-reinforcement/reports/redirect-matrix.csv`
- **AdWords LP copy templates:** `projects/briefs/website-rebuild-rebrand/copy-adwords-lps.md`
- **URL inventory:** `projects/briefs/website-rebuild-rebrand/url-inventory.md`
- **Site code:** `projects/briefs/website-rebuild-rebrand/site/src/app/(frontend)/`

### External sources

**Google Ads policies (primary):**
- Animal cruelty — https://support.google.com/adspolicy/answer/16490052
- Dangerous products or services — https://support.google.com/adspolicy/answer/6014299
- Inappropriate / shocking content — https://support.google.com/adspolicy/answer/6015406
- Misrepresentation — https://support.google.com/adspolicy/answer/6020955
- Eligible (limited) status definition — https://support.google.com/adspolicy/answer/2684542

**LSA wildlife purge (June 2024):**
- LeadSquirrel — https://animalcontrolmarketing.com/local-service-ads-for-wildlife-removal-are-gone-for-now/
- Coalmarch — https://www.coalmarch.com/resources/blog/google-local-service-ads-updates-july-2024

**Industry context:**
- PCT Online — Google Ads mistakes that cost PCOs thousands — https://www.pctonline.com/news/google-ads-mistakes-that-cost-pcos-thousands/
- Spokesman (2019, hunting ads precedent) — https://www.spokesman.com/stories/2019/may/09/google-clarifies-hunting-ads-ok/
- Microsoft Advertising policies — https://about.ads.microsoft.com/en-us/policies/home

### Memory entries that govern this work
- `feedback_no_unauthorized_build_actions.md` — audit freely, never edit/commit/push without go-ahead
- `feedback_cold_start_over_handover.md` — when previous-agency equity is thin, cold-start beats handover fight
- `feedback_public_ads_recon_first.md` — recon before any PPC scoping
- `feedback_customer_id_is_not_tag_id.md` — verify all account/conversion IDs from Google's snippet, not derived
- `feedback_one_recommendation_not_menu.md` — pick best path and execute, no menus
- `feedback_distil_dont_dump.md` — short answers + one next step in chat; reports can be long
- `feedback_no_time_estimates.md` — no "~45 min" framing
- Got Moles client CLAUDE.md — US English, no Initiative 713 claims, "WA's #1" unsubstantiated, no "only mole-exclusive" claim, 219+ Google reviews, 5,000 clients confirmed

---

## 9. Next move

Phase 1: LP policy audit. Review all 4 `/lp/` pages + 3 service pages against the Google Ads policies above. Output the R/A/G per page + a rewrite list with policy-safe substitutions for each problem phrase.

Awaiting Roy's go-ahead.
