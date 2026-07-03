# 6-City Ranking Evidence — Pre-Launch Decision Data

**Source:** Rankings sheet of `Got Moles - PPC Growth YoY + SEO Progress and Fruits.xlsx` (previous agency)
**Parsed:** 2026-04-20
**Scope:** Historical SERP position per keyword per city from July 2022 → December 2025 (42 timestamp columns)

## TL;DR

**All 6 cities should be kept, not just the 4 confirmed yesterday.** Centralia and Eatonville — which we framed as "rural, unknown coverage, possibly drop to /service-areas" — are actually the **strongest** old-site city rankings in the entire dataset. Dropping them would forfeit the most compounded ranking equity on the domain.

**Data limitation:** The spreadsheet provides rank positions only — no click-through data, impression volume, call counts, or form submissions. To confirm rank → traffic conversion, we need GSC + GA4 handoff from the previous agency (Spencer-blocked). Until then, multi-year #1 rankings are the strongest available proxy for "this URL was generating business."

---

## Per-City Evidence

### Centralia (Thurston County, WA) — **STRONGEST**

18 keyword hits in the Rankings sheet. Held multiple #1 rankings **continuously for 3+ years**.

| Keyword | Current (Dec 2025) | July 2022 | Years at #1/#2 |
|---------|-------------------|-----------|-----------------|
| `mole catcher centralia` | **1** | 6 | 3+ |
| `mole control centralia` | **1** | — | 3+ (since Feb 2024) |
| `mole exterminator centralia` | **1** | >100 | 2+ |
| `moles in yard centralia` | **1** | — | 3+ |
| `mole trapping centralia` | **1** | — | 2+ |
| `yard mole removal centralia` | **1** | >100 | 2+ |
| `pest control centralia wa` | 17 | >100 | Climbing — page 2 now |

Compounding Quality Score here is massive. The old site held page 1 and #1 simultaneously across 6+ commercial-intent keywords. Even if Spencer doesn't actively market Centralia, the page has been sending qualified traffic for years. **Do not drop.**

### Eatonville (Pierce County, WA) — **STRONG**

1 hit, but it's been **#1 continuously for 2.5 years** (Feb 2023 → present).

| Keyword | Current (Dec 2025) | Oldest entry | Status |
|---------|-------------------|--------------|--------|
| `mole control eatonville` | **1** | Sep 2022 (ranked 6) | #1 continuously since Mar 2023 |

Single keyword but perfect ranking history. Likely generates consistent (if low-volume) local leads.

### Algona (King County, WA) — **MODERATE-STRONG**

2 hits. Currently #3; has deep history including multi-month #1-#2 runs.

| Keyword | Current (Dec 2025) | Best historical | Status |
|---------|-------------------|-----------------|--------|
| `algona mole control` | 3 | 2 (Oct 2025) | Climbing back — was #2 recently |
| `mole control algona` | 3 | 1 (Aug 2022 → Mar 2023) | Was dominant, dropped off mid-2023, now recovering |

### Fairwood (King County, WA) — **STRONG**

1 hit, currently **#1**, held page 1 for ~3 years.

| Keyword | Current (Dec 2025) | History |
|---------|-------------------|---------|
| `mole control fairwood` | **1** | #1 most of 2023, brief drop, back to #1-#2 since May 2023 |

### Lake Tapps (Pierce County, WA) — **MODERATE-STRONG**

2 hits. Currently #2-#3; history starts May 2023 (newer to the tracked set).

| Keyword | Current (Dec 2025) | Best historical |
|---------|-------------------|-----------------|
| `lake tapps mole control` | 2 | 2 (stable) |
| `mole control lake tapps` | 2 | 6 (climbed from 21→2) |

### Medina (King County, WA) — **EMERGING**

3 hits, all **recent entries** (since May 2025). No multi-year history, but current positions are all #2-#3 and climbing.

| Keyword | Current (Dec 2025) | First tracked |
|---------|-------------------|----------------|
| `medina mole control` | 3 | June 2025 (first ranked) |
| `medina mole extermination` | 2 | Mar 2025 |
| `mole control medina` | 2 | Oct 2025 |

Fresh rankings in a high-HHI Eastside zip code (Bill Gates / Jeff Bezos neighborhood). Lead economics likely better-than-average.

---

## Revised Decision Matrix

| City | Yesterday's proposal | Evidence-based verdict |
|------|---------------------|------------------------|
| Algona | Add (probable) | **Add — confirmed, deep history** |
| Fairwood | Add (probable) | **Add — confirmed, #1 now** |
| Lake Tapps | Add (probable) | **Add — confirmed, stable #2-#3** |
| Medina | Add (probable) | **Add — emerging but high-value geo** |
| Centralia | Redirect to /service-areas (possibly) | **Add — strongest footprint in the entire dataset** |
| Eatonville | Redirect to /service-areas (possibly) | **Add — #1 continuously since 2023** |

**Net effect on Track C:** city-data.ts grows from 90 → 96 cities. `citySlugs` alignment becomes 77 → 96. All 6 redirects preserve 25+ ranked keywords instead of sending them to a generic service-areas page.

---

## Open question for Spencer

The only remaining question is **service coverage**: does Spencer actually run traps in Centralia (Thurston, ~60 mi south of Enumclaw HQ) and Eatonville (Pierce, ~30 mi south of Puyallup)? The old site ranked these pages #1 for years, so either:

1. Spencer does travel there (rare / high-ticket only), or
2. The old agency built these pages purely for keyword capture and Spencer refers these leads out.

Either way, the content exists, the rankings exist, and the user intent is real. The answer determines whether the city pages lead with "We serve Centralia" vs "Need mole control near Centralia? Here's what's available" — but the page should exist either way.

---

## What we'd need to close the evidence gap

The Rankings sheet doesn't include impression or click data. To confirm rank → calls/leads conversion we need:

1. **Google Search Console handoff** — impression + click data per URL per keyword (13-month window)
2. **GA4 handoff** — session + conversion data per landing page
3. **Previous agency's Google Ads call/form data** — conversion volume per city page

All three are Spencer-blocked per the Ads brief. This is the single biggest information asymmetry in the launch — rank data alone can't tell us which pages Spencer should prioritise staffing for.
