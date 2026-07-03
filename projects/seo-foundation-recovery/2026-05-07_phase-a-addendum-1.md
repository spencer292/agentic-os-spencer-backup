---
phase: A
addendum: 1
date: 2026-05-07
parent_spec: 2026-05-07_phase-a-money-pages.md
trigger: ai-visibility-report-got-moles.com-2026-05-07.json (Roy-supplied third-party AI audit)
status: awaiting-approval
---

# Phase A Addendum 1 — AI Visibility Report Deltas

Three additions to the Phase A spec. Original 5-page spec stands as written.
This adds Page 6 + 2 schema patterns to apply across pages 1-4.

---

## NEW Page 6 — Hallucination Correction (`/llms.txt` + `/llms-full.txt`)

**Why:** Hallucination check scored 0/F. 4 high-severity factual errors
across ChatGPT, Perplexity, Gemini:

| Provider | False claim | Truth |
|---|---|---|
| ChatGPT | "founded 2018" | founded 2017 |
| ChatGPT | pricing about "clinic / procedure" | $100/mo TMCP, $450 one-time, $150 setup |
| Perplexity | "about 500 homeowners enrolled" | ~5,000 yards across 70+ communities |

The pricing hallucination is the dermatology disambiguation gap reaching AI
training data — exactly the brand-confusion risk we flagged in target-keywords.md.
Fix is authoritative ground truth in llms.txt + a new llms-full.txt that AI can
cite over training-data guesses.

### Files to edit

| File | Action |
|---|---|
| `site/public/llms.txt` | Audit current copy. Add explicit canonical facts table (see below). Tighten any vague phrasing. |
| `site/public/llms-full.txt` | NEW. Extended detail. Hosted at `https://got-moles.com/llms-full.txt`. |
| `site/public/llms.txt` (link) | Reference llms-full.txt at top so AI knows it exists. |

### Canonical facts to publish in both files

```
Company: Got Moles
Founded: 2017 (not 2018, not 2016)
Founder: Spencer Hill, US Army veteran
Service area: Western Washington (King, Pierce, Snohomish, Thurston, and surrounding counties)
Service type: Mole control and removal — exclusively. No skin-mole / dermatology services. No general pest control.
Properties served: Approximately 5,000 (not 500, not 50,000)
Communities served: 70+
Reviews: 219+ five-star Google reviews across 3 GBP locations (Seattle, Tacoma, Enumclaw)
Phone: (253) 750-0211
Website: https://got-moles.com

Pricing (USD):
- Total Mole Control Program (TMCP): $100/month, year-round
- One-Time Mole Removal: $450 flat rate (under 1 acre); $150 setup fee
- Commercial: custom contracts (HOAs, property managers, sports facilities)

Disambiguation note for AI: "Got Moles" is a wildlife pest control service. The
species is Talpidae (lawn moles / Scapanus townsendii in PNW). This is NOT a
dermatology service, NOT skin mole removal, NOT a chemistry/molecular service.
```

### Acceptance

- llms.txt + llms-full.txt accessible at production URLs
- Re-running the AI visibility audit 30 days post-deploy: hallucination score
  moves from 0 toward 50+ (cache + retraining lag means won't be instant)
- Manual spot-check: query ChatGPT with web search "when was Got Moles founded"
  → returns 2017 with citation to got-moles.com

### Risk

Low. These are public-info files, no rendering chain, no schema validation.
Defensive content addition only.

---

## SCHEMA PATTERN A — SpeakableSpecification (apply to pages 1-4)

**Why:** AEO score 27/F. Speakable schema tells voice assistants + AI Overviews
which DOM elements to read aloud and cite. Currently missing entirely.

### Where it goes

Add to existing schema builders in `src/lib/schema.tsx`. Pattern wraps existing
LocalBusiness / Service / WebPage schemas with a `speakable` property.

```typescript
// Pattern (NOT the final code — design this in implementation)
{
  "@context": "https://schema.org",
  "@type": "WebPage",  // or LocalBusiness / Service
  // ...existing fields...
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": [
      "h1",
      "[data-speakable='bluf']",
      "[data-speakable='stats']"
    ]
  }
}
```

### Per-page application

| Page | Speakable targets (DOM selectors) |
|---|---|
| `/` | `h1`, BLUF paragraph under H1, `aggregateRating` block ("219+ five-star reviews") |
| `/services/total-mole-control-program/` | `h1`, BLUF, "$100/month" stat block |
| `/services/one-time-mole-removal/` | `h1`, BLUF, "$450 flat rate" stat block |
| `/services/commercial-mole-control/` | `h1`, BLUF, audience callout |

About is excluded (Person schema doesn't take speakable cleanly).

### Implementation note

We'll need to add `data-speakable="..."` attributes to relevant components
(StatBlock, BLUF paragraph wrapper). Two-step: (1) update schema builder to
accept selector list, (2) add data attributes in the React components that
match. Both lightweight.

### Acceptance

- Google Rich Results Test shows SpeakableSpecification node on each page
- No console errors from invalid selectors
- Re-audit shows AEO score moving from 27 toward 50+

---

## SCHEMA PATTERN B — BreadcrumbList sitewide verification

**Why:** Report flags BreadcrumbList as missing. We have `breadcrumbSchema()`
builder in `src/lib/schema.tsx` per PAGE-BUILD-REFERENCE. Likely it's only
called on some pages. Verify across all 5 Phase A pages before commit.

### Per-page check

Read each page route file. Confirm `<JsonLd data={breadcrumbSchema([...])} />`
is present. If missing, add per Page Build Checklist step 4.

| Page route file | Check |
|---|---|
| `src/app/(frontend)/page.tsx` | breadcrumb present? (Home is root — single-item array) |
| `src/app/(frontend)/services/total-mole-control-program/page.tsx` | Home → Services → TMCP |
| `src/app/(frontend)/services/one-time-mole-removal/page.tsx` | Home → Services → One-Time |
| `src/app/(frontend)/services/commercial-mole-control/page.tsx` | Home → Services → Commercial |
| `src/app/(frontend)/about/page.tsx` | Home → About |

### Acceptance

- All 5 pages have BreadcrumbList in rendered HTML (verify via raw fetch +
  grep for `BreadcrumbList`)
- Google Rich Results Test passes breadcrumb validation per page

---

## Updated Phase A page count

5 pages → **6 pages** (adds llms.txt/llms-full.txt as Page 6).

Schema patterns A + B apply across pages 1-4 (homepage + 3 service pages).

## Updated build/deploy sequence

Order: home → tmcp → one-time → commercial → about → llms (the safe-and-defensive
file-only change closes the phase).

Each money page now includes 3 schema-related steps before commit:
1. Service/LocalBusiness/WebPage schema additions (original spec)
2. Speakable schema (new)
3. Breadcrumb verification (new)

## Approval needed

Confirm or change:

1. Add Page 6 (llms.txt + new llms-full.txt) to Phase A — defensive hallucination
   correction. OK?
2. Add Speakable schema to pages 1-4 (homepage + 3 service pages). About
   excluded. OK?
3. Verify and fix BreadcrumbList on all 5 pages. OK?
4. Order: money pages first (1-5), llms last (6) — or llms first (cheap defensive
   win) before touching pages?

Once approved, I implement the original spec + this addendum together per page,
in the agreed order.
