---
project: wikidata-entity-strategy
doc: Spencer guide — keyword grounding, Google signals, correctness layer
status: supplement to brief-v2.md
created: 2026-05-25
---

# Wikidata Entity — Keyword Grounding, Google Signals & "How to Make It Right"

**Read `brief-v2.md` for the click-by-click mechanics** (account setup, the exact Wikidata properties,
deletion defense, Claude prompts). This supplement adds the three things that make the entity actually
*work for SEO*, which the mechanics alone don't cover:

- **A.** The verified facts to enter (so it's accurate)
- **B.** Keyword grounding — *which* topics/places to associate, so Google/AI link Got Moles to the
  queries that matter
- **C.** The Google Knowledge Graph signals + how to verify it's right

The core principle to hold the whole time: **an entity is only "right" when every source says the same
thing.** Google doesn't trust a single page — it triangulates Got Moles from Wikidata + your website
schema + GBP + directories + press. Your job is to make all of them agree, and to point them at each other.

---

## A. The verified facts to enter (use these exact values)

Use the canonical set — don't let Wikidata's examples drift from these:

| Fact | Verified value | Source for the Wikidata reference |
|---|---|---|
| Company | Got Moles | WA Secretary of State registry |
| Founded | **2017** | WA SOS registry |
| Founder | **Spencer Hill** | site /about/ + LinkedIn |
| HQ | **Enumclaw, Washington** | WA SOS registry |
| Service area | **6 counties — King, Pierce, Snohomish, Thurston, Kitsap, Lewis** (NOT 4) | site / service-areas page |
| Communities served | **92+ communities** | site /service-areas/ |
| Clients | **nearly 5,000 properties** | site |
| Founder service | **US Army veteran, 2011–2014** | DD-214 / VA |
| Pricing | TMCP $100/mo · One-Time $450 flat + $150 setup | site |
| Method | chemical-free professional trapping | site |

**Flag-before-entering (don't guess these — confirm or omit):** number of employees, exact TMCP
enrollment count, Spencer's place of birth. The brief-v2 examples include guessed numbers; an unsourced
or wrong number is a deletion trigger. Omit rather than guess.

**Posture A applies even here:** describe the *service* (trapping, chemical-free, professional), never
the mechanism (no body-gripping/scissor/kill language) — Wikidata statements are public.

---

## B. Keyword grounding — make the entity reinforce the SEO targets

This is the part the brief misses. The entity should teach Google/AI that **Got Moles is *the* authority
on mole control in Western Washington** — using the exact entities from `target-keywords.md`. Two places
you encode this:

### B1. On Wikidata (the statements that carry topical/geographic meaning)

| What to associate | Property | Value(s) — link to these existing Wikidata items | Why (keyword tie) |
|---|---|---|---|
| Industry | P452 | **pest control (Q9685)** | core category |
| Field of work | P101 | pest control / **mole** control | topical anchor |
| Service / product | P1056 (product or material produced → use "service") | mole control, mole removal **service** | ties to the head term ("mole control" — the cluster Rule 3 says to lead with) |
| **Service area** | P2541 | **Western Washington (Q-id)** + the **priority cities**: Seattle, Tacoma, Bellevue, Kent, Renton, Federal Way, Puyallup, Everett, Olympia, Kirkland (each has a Wikidata Q-id) | makes Got Moles surface when AI/Google look up *those* geos — the money queries |
| HQ | P159 | Enumclaw (Q985770) | local relevance |
| Related species (via the graph) | — | connect to **Townsend's mole (Q1374069)** | when AI looks up the WA mole species, it walks to Got Moles |

> **Why link the priority cities specifically (not all 92):** same logic as the internal-linking R6 rule
> — concentrate the entity's geographic signal on the cities you're fighting for. Add the rest over time.

### B2. On the website schema — STATUS verified LIVE 2026-05-25 (most of it is already done)

I checked the live JSON-LD (`src/lib/schema.tsx`) before recommending. **Most of this is already present and
correct — do NOT redo it.** Only the items marked ❌/⚠️ are real tasks.

| Element | Live status |
|---|---|
| `knowsAbout` (Organization + LocalBusiness) | ✅ **already present + keyword-grounded:** Mole control, Mole trapping, Townsend's mole, PNW mole species, Western Washington mole control, Year-round mole protection, Chemical-free mole control methods, Commercial mole control |
| `areaServed` (LocalBusiness) | ✅ **already 6-county canonical:** "Western Washington — King, Pierce, Snohomish, Thurston, Kitsap, Lewis (92+ communities)" |
| `foundingDate` 2017 · `founder` Spencer Hill (US Army veteran 2011-2014) · `hasOfferCatalog` | ✅ present |
| Organization `sameAs` | ⚠️ has Facebook, Instagram, LinkedIn, Yelp, Nextdoor + Google KG stick URLs — **MISSING: BBB, the 3 individual GBP place URLs, and (later) the Wikidata Q-id** |
| **Person (Spencer) `sameAs`** | ❌ **EMPTY** — his Person node has no external links at all. The real gap. |

**The only real schema tasks (small, in-house — `str-onpage-audit`/code):**
1. **Add Spencer's `sameAs`** in `personSchema()` → LinkedIn + `/author/spencer/` (+ Wikidata Q-id once it exists). Biggest gap — his Person entity is currently unlinked to anything.
2. **Extend Organization `sameAs`** (`BUSINESS.social`) → add BBB + the 3 GBP place URLs.
3. **Wikidata Q-id round-trip** → add to both `sameAs` arrays once the entity exists (this is the bridge that makes Google merge the site with the Wikidata entity).

`knowsAbout` + `areaServed` need **no change** — already done and well-grounded.

**Disambiguation discipline (from target-keywords Rule 1-3):** the entity's label/description/knowsAbout
should lead with **"mole control"** and **"Western Washington"**, and avoid bare **"mole removal"** (derm
overlap). This keeps Google from collapsing the entity toward the skin-mole/dermatology meaning — the
brand's specific citation leak.

---

## C. The Google Knowledge Graph signals (what Google looks for) + how to verify it's right

Wikidata is **one input** to Google's Knowledge Graph, not the whole thing. The signals Google weighs,
in order:

1. **Cross-source consistency / corroboration (the #1 signal).** Name, founding year, founder, HQ,
   phone, service area must be **identical** on the website, Wikidata, all 3 GBPs, BBB, LinkedIn, Yelp,
   and any press. Any conflict (e.g., "4 counties" on the site vs "6" on Wikidata, or NAP variations)
   weakens or blocks entity recognition. *Fix all conflicts before/while creating the entity.*
2. **Structured data on the site** — Organization + Person schema with `sameAs` (linking to Wikidata +
   profiles) and `knowsAbout` (topical). This is the explicit machine statement of the entity + its graph.
3. **Wikidata Q-id with referenced statements** (brief-v2).
4. **Authoritative third-party mentions** — citations/links from trusted sources (the digital-PR /
   off-page work; WSU/extension, local news). These corroborate the entity.
5. **Topical + geographic association** — knowsAbout + areaServed + Wikidata service-area/industry, all
   pointing at *mole control* and the *priority cities* (Section B).
6. **Entity disambiguation** — clear "company, not the question, not skin moles" signals.

### How to make sure it's right — verification checklist

Run this after each phase; the entity is "right" when all pass:

- [ ] **Facts match Section A** on every source (run a NAP + facts consistency audit across site / 3 GBPs / BBB / Yelp / LinkedIn).
- [ ] **Wikidata item**: correct `instance of` (business Q4830453), ≥1 external identifier, every factual statement has a **reference URL**, description is factual/non-promotional, **survives 30 days** without deletion.
- [ ] **Site schema updated**: Organization `sameAs` includes the Wikidata Q-id; `knowsAbout` carries the topical list; Person (Spencer) `sameAs` includes his Q-id. **Validate via Google Rich Results Test** (no errors).
- [ ] **The two-way link exists**: Wikidata `official website` → got-moles.com, AND site schema `sameAs` → Wikidata Q-id. (Round-trip = Google merges them.)
- [ ] **Google Knowledge Panel** appears for "Got Moles" within 60-90 days (then claim it; use "Suggest an edit").
- [ ] **AI-citation test** (brief-v2 Phase 8 prompt) shows Got Moles surfacing for the priority queries — re-run vs the pre-Wikidata baseline at 30/60/90 days.

If a check fails, the usual cause is **inconsistency** (signal #1) — find the source that disagrees and fix it.

---

## The honest sequence (what makes this "right," in order)

1. **Fix consistency first** — audit + align NAP/facts everywhere (Section A). *This is the foundation; do it before Wikidata.*
2. **Update the site schema** — add `knowsAbout` + prepare the `sameAs` array (Section B2). Cheap, in our control, and a strong standalone signal.
3. **Create the Wikidata entity** — brief-v2 mechanics, with Section A facts + Section B1 associations.
4. **Close the loop** — add the Q-id to the site `sameAs`; add official-website to Wikidata.
5. **Corroborate** — directories + press (the off-page/digital-PR track).
6. **Verify + measure** — the checklist above, at 30/60/90 days.

Steps 1-2 are ours (and the fastest wins). Steps 3-4 are Spencer's ~12 hrs (brief-v2). Step 5 is the
broader authority work. **Realistic: Knowledge Panel + measurable AI-citation lift in 60-90 days**, given
consistency is clean — consistent with the off-page timeline (off-page authority is slow + compounding).

---

*Companion to `brief-v2.md` (mechanics) + `brand_context/target-keywords.md` (the topical/geo entities) +
`reference_got_moles_canonical_facts` (the verified facts). The site-schema changes (B2) are a small
`str-onpage-audit`/code task we can do in-house anytime — they don't wait on Spencer.*
