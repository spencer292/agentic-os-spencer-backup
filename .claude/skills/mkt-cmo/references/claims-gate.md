# Claims Gate

Read this before writing any ad, email, landing brief, post, script or listing description.
Every customer-facing sentence Got Moles publishes passes through here first.

Marketing is where a wrong claim gets *amplified*. A false line in an internal doc is a mistake;
the same line in an ad is a false advertisement served to Western Washington a hundred thousand
times. This gate exists because several Got Moles claims are wrong, several are stale, and two are
actively dangerous to the ad accounts.

---

## 1. Forbidden — never publish these

| Claim | Why |
|---|---|
| **Initiative 713 / I-713 compliance** | Got Moles uses professional body-gripping traps. Do not claim I-713 compliance in any form, including "legal under I-713", "I-713 approved", or implying it |
| **"Washington's #1"** — or any unqualified #1 / best / largest | Unsubstantiated. It is also the exact shape of claim that draws competitor complaints and platform ad review |
| **"15 years"** stated bare | 15+ years is **Spencer's personal experience**. The company was founded in **2017**. Always clarify which. "Founded 2017, built on 15+ years of Spencer's hands-on experience" is fine; "15 years in business" is false |
| **"Moles are hauled away"** as the default | Dead moles are **double-bagged into the customer's own garbage can**. Taken along only on special request. Never write haul-away as the standard service |
| **Any mechanism language in a paid ad** | See §4. `kill`, `lethal`, `body-gripping`, `scissor`, `harpoon`, `spike`, `poison`, `bait`, `exterminate`, `eradicate`. These throttle Google and Meta accounts silently |

## 2. Numbers — the current, verified values

| Claim | Publish this | Never publish |
|---|---|---|
| **Reviews** | "283+ five-star reviews", "289 Google reviews", "5.0 across three locations". Measured live 2026-08-21 across all three GBP listings: 283×5★, 4×4★, 1×3★, 1×1★ | **"219+ five-star reviews"** — stale, superseded. And never state the *total* (289) as a *five-star* count. They are different numbers and the gap is the whole point |
| **Locations** | 3 Google Business Profile locations | — |
| **Clients served** | See the conflict in §3 before publishing any client count | "Nearly 5,000 clients" — not until §3 resolves |
| **Veteran-owned** | True and usable. Spencer served in the Army 2011–2014. Strong E-E-A-T signal, safe to lead with | — |
| **The guarantee** | $150 setup fee. If no moles are caught and the problem resolves on its own, the client pays only the setup fee | Do not describe it as "money-back" or "free if it doesn't work" — it is not |

**Review count grows ~7/week.** Re-measure before publishing it anywhere new:
`node scripts/gbp-scrape-reviews.mjs`. Caveat: the scraper writes to a filename carrying a stale
date (`2026-07-31_google-reviews.json`) regardless of run date — trust the `scrapedAt` field
inside the file, never the filename.

## 3. Known conflicts — resolve before publishing, do not pick a side quietly

**Client count.** `brand_context/positioning.md` claims *"nearly 5,000 clients served"* and
*"4,973 clients"*. The 2026-08-06 Jobber pull behind `projects/briefs/tmcp-conversion/` counts
**2,907 client records** across 6,968 jobs. The gap is ~2,000. Plausible explanations: the 4,973
figure is cumulative including pre-Jobber years, or the Jobber pull was scoped in a way that
dropped records. **Unresolved.** Until it resolves, publish no client count. Tracked as **F-02**.

**Active program count.** `positioning.md` says *"~500 active TMCP subscribers"*; the 2026-08-06
Jobber segmentation says **642 on an active program**. The positioning file is the stale one.

**`brand_context/positioning.md` is a shipped file and cannot be edited on this install.** It
carries the retired "219+" review figure and an unclarified "refined over 15 years". Use its
strategy and its angles; take its *numbers* from this gate instead. When a conflict appears
between a brand_context file and this gate, **this gate wins** and the conflict gets logged.

## 4. Ad-platform posture — mandatory, both networks

**Posture A — silent mechanism.** Never describe *how* a mole is caught in a paid ad, on a landing
page an ad points at, or in ad extensions. Google tightened its animal-cruelty and
dangerous-products policies with NLP enforcement over 2024–2026, and the failure mode is not a
disapproval — it is **"Eligible (limited)"**, which throttles delivery while the dashboard still
reads healthy. Nobody notices for months.

Say instead: professional mole control, chemical-free, safe around pets and children, trained
technicians, proven methods, guaranteed results.

**Medical-cluster negatives are mandatory on every search campaign.** "Mole" is a homograph — skin
moles, mole removal surgery, dermatology. The ~120 negatives in
`scripts/_got-moles-existing-negatives.json` go on every campaign, no exceptions.

**LSA:** Google removed the Wildlife Removal job type from the Pest Control vertical in June 2024.
Moles must be classed under **rodent**. Wildlife language on the landing page can take LSA dark
silently. `ESTIMATE`, sourced 2026-05-04 — re-verify against the live LSA vertical before relying
on it.

## 5. Positioning language

- **Lead with "chemical-free and safe mole control", not "mole trapping"** in any headline,
  greeting, tagline or description. Trapping is the *method* explanation for a "how does it work"
  answer — it is not the identity.
- The three pillars that carry every message: **chemical-free · safe for pets and children ·
  professional methods**.
- **US English everywhere.** color, customize, organize, neighborhood, program. Got Moles is a
  US company and British spellings read as offshore.

## 6. Pricing in public

Publishable residential pricing, Spencer-confirmed:

| Property | Quick Fix (one-month) | Total Mole Control (monthly) |
|---|---|---|
| ≤ 1 acre | $450 | $100 |
| 1–3 acres | $500 | $125 |
| 3–5 acres | $600 | $150 |

$150 setup fee and the no-catch guarantee apply at all sizes.

**Never quote by phone, in an ad, or in an email:** commercial of any size, and residential over
5 acres. Those require an in-person bid. Bid requests route to **Cory** (Tavis when he returns) —
never to Spencer, who does no bids.

Any campaign aimed at commercial or large-acreage prospects sells *the visit*, not a price.

## 7. Legal entity

The legal entity is **Rainier Power Wash LLC**; "Got Moles" is a DBA. Use the legal name anywhere a
platform verifies a business against tax records — Meta business verification, A2P 10DLC / SMS
brand registration, EIN fields, carrier registration. Use "Got Moles" everywhere a customer reads it.

---

## The gate itself

Before any customer-facing copy ships, confirm in one line each:

1. No forbidden claim from §1.
2. Every number traced to §2, with its measurement date — or removed.
3. No unresolved §3 conflict is being asserted as fact.
4. If paid: Posture A holds, negatives attached, mechanism language absent.
5. Positioning leads chemical-free/safe, not trapping. US English.
6. Any price shown is residential and inside the published tiers; anything else routes to a bid.

If a claim cannot clear the gate, the answer is not to soften it into vagueness — it is to find the
true claim that is just as strong. Got Moles has plenty: 283 five-star reviews, 5.0 across three
locations, veteran-owned, mole-exclusive, chemical-free, and a guarantee competitors do not offer.
