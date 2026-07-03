---
project: paid-search-landing-pages
type: review
created: 2026-05-24
status: Phase 1 complete (QS-readiness). Phases 2-4 pending.
scope: 23 live /lp/{city}/ pages — Quality Score readiness + conversion likelihood
method: live production reads only (raw node fetch of https://got-moles.com/lp/{city}/), not local source
source_template: site/src/lib/lp-city-data.ts (buildLpBlocks) + lp/[city]/page.tsx + LpQuickForm.tsx
---

# Got Moles LP — Quality Score + Conversion Review

Two questions: **(1) will the 23 LPs hit Google Ads Quality Score requirements? (2) will they convert?**
All 23 render from one `buildLpBlocks()` — so this reviews the template + per-city variance.

> **All findings below verified against LIVE production** (got-moles.com, raw fetch, 2026-05-24),
> not local source. Where the audit script disagreed with live, live wins.

---

## Phase 1 — Quality Score readiness ✅

### What's strong (verified live, all 23)
- **HTTP 200**, served from Vercel, real WebP hero.
- **`noindex, nofollow`** present on every page → paid-only; **organic duplicate-content penalties do not apply** (key reframe — see thin-content note).
- **Click-to-call** `tel:+12537500211` in hero + final CTA on all 23.
- **Schema rich:** 8 JSON-LD blocks live per page (BreadcrumbList + FAQPage + Organization + more from the AEO commits). FAQPage validates the city FAQ.
- **LCP hint:** hero image carries `fetchpriority="high"` + `priority` preload on all 23.
- **HTML weight light:** ~116–117 KB/page, no video → favorable for CWV.
- **Per-page unique local content DOES render:** each LP has a unique ~80–100-word geology paragraph
  (`whyMolesThrive` — soil series, rivers, rainfall), confirmed live on 11/12 sampled cities
  (Bellevue "Somerset/Coal Creek", Renton "Cedar River/Benson Hill", Redmond "Marymoor", Enumclaw
  "Osceola", etc.). Plus city-matched reviews + a city-named FAQ. So pages are **not** pure name-swaps.

### What needs a decision / fix (the real QS levers)

**1. H1 has no keyword — message-match lives only in title + H2 (ALL 23).** ⚠ HEADLINE ISSUE
- Live H1 on every page: *"Moles Tearing Up Your {City} Lawn? We'll End It."* — **zero** instances of
  "mole removal" / "mole control" in any H1 (verified: `kwInH1 = n` on all 23).
- The exact ad term DOES appear in: the `<title>` (`Mole Removal in {City} — $150 to Start`) and two
  H2s (`How Your {City} Mole Service Works`, `Mole Control in {City} — Common Questions`).
- **QS read:** Google's ad-relevance + landing-page-experience reward the searched term being
  prominent. Title + H2 give partial match; an emotional H1 with no keyword is a weaker first signal
  than the prior spec's `Mole Removal in {City} — $150 to Start` H1. **This is the core call Roy
  flagged.** Recommendation to weigh in Phase 4: a hybrid H1 that keeps the emotional pull *and*
  carries the term (e.g. an eyebrow/kicker "Mole Removal in {City}" above the emotional H1, or a
  keyworded H1 with emotional subhead). Decision, not a silent change.

**2. Duplicate title suffix (ALL 23).** ⚠ Real defect
- Live `<title>`: `Mole Removal in Redmond — $150 to Start | Got Moles | Got Moles` — **"| Got Moles"
  twice.** The page metadata appends it and a global layout appends it again. One template fix clears
  all 23. Looks sloppy anywhere the title shows; minor trust/QS ding.

**3. Templated body (the "thin content" question — reframed).**
- After removing the city name, pages are **73–87% identical** to each other (word-trigram overlap).
  The unique slice per page = the geology paragraph + neighborhoods + city name + city FAQ; the offer,
  steps, pain-points, and trust copy are shared verbatim.
- **Because every LP is `noindex`, this is NOT an organic duplicate-content problem.** For paid QS,
  templated offer copy is normal and acceptable; the unique local paragraph + city reviews + city FAQ
  give enough relevance signal. **Verdict: acceptable for QS as-is** — but it's the lever if we want
  to push landing-page-experience higher later.

**4. Orphaned fields (code hygiene, low priority).**
- `LP_CITIES[*].uniqueParagraph` and `.neighborhoods` are defined per city but **no longer rendered**
  by `buildLpBlocks` (the conversion rework replaced them with the shared emotional hero). Dead data —
  either wire back in (a cheap uniqueness boost) or delete to avoid confusion. Non-blocking.

**5. CWV — pending a keyed PageSpeed run.** ⏳
- Keyless PSI rate-limited (429). Pages are light (≈117 KB, prioritized WebP hero, no video, below-fold
  lazy) so mobile LCP is *expected* green — but **confirm with a keyed PSI mobile run** on a King
  (redmond) + Pierce (puyallup) sample before calling LPE done. Only open Phase-1 data point.

### Phase 1 verdict
**QS foundation is strong; one headline decision (H1 keyword) + one quick fix (double title) stand between
"good" and "tuned."** Technically these will serve and score acceptably. The H1 message-match call is the
highest-leverage QS item. CWV to be confirmed.

| Check | Result (live, all 23) |
|---|---|
| HTTP 200 / noindex / tel | ✅ |
| BreadcrumbList + FAQPage schema | ✅ (8 LD blocks) |
| Hero fetchpriority=high | ✅ |
| Keyword in title | ✅ |
| Keyword in H2 | ✅ (2 H2s) |
| **Keyword in H1** | ❌ none (emotional) — decision |
| **Title not duplicated** | ❌ "\| Got Moles" ×2 — fix |
| Unique local content renders | ✅ geology para + city reviews + city FAQ |
| CWV mobile | ⏳ pending keyed PSI |

---

## Phase 2 — Conversion review (LIFT / str-cro-audit) — PENDING

## Phase 3 — Tie to live account (ad-group ↔ LP message-match) — PENDING

## Phase 4 — Consolidated findings + ranked fix list — PENDING
