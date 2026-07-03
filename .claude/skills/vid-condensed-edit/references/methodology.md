# Condensed Edit Methodology

Evidence base: YouTube strategy research 2026-06-11 (`projects/briefs/podcast-system-rebuild/research/2026-06-11_youtube-strategy.md`). Length/pacing rules are creator-practice heuristics, not official YouTube guidance — let retention graphs override them over time.

## Targets

- **Duration:** 10–15 minutes total (8 min floor for mid-roll eligibility, 20 min ceiling). Start at the lower end for a low-subscriber channel.
- **Cold open:** 20–40 s, the single strongest moment in the episode. Starting mid-sentence is fine — momentum beats context. The same moment MAY reappear later in its natural position (standard practice; viewers expect the payoff).
- **First 30 s structure:** 0–5 s attention grab (the cold open's peak line first), 5–15 s implicit promise, by 30 s the viewer knows what they're getting. No branded intro. No "welcome back".

## Segmentation

- Candidate segments are **self-contained beats**: one question + its answer, one story, one exchange. 60 s – 4 min each.
- Boundaries land where the conversation naturally turns: a new question, a topic pivot, "so", "let me ask you".
- A beat that needs prior context to make sense either includes that context or gets cut.

## Scoring (adapted from the edge-first shorts model)

`score = hook*0.35 + insight*0.35 + continuity*0.20 + energy*0.10`

- **hook** — would the first 10 s of this segment stop a scroller? Tension, claim, story stakes.
- **insight** — density of genuinely useful/contrarian/specific content for the ICP (UK owner-managers; "trapped in the business", "bottleneck", delegation, AI applied practically). Generic platitudes score low.
- **continuity** — does it flow from what precedes it in the selection? Penalise selections that produce non-sequiturs back to back.
- **energy** — vocal energy, laughter, interruptions, pace.

**Content gates (hard):** third-party sensitive content routes to human review; private/identifying client details cut; long monologue intros, housekeeping, "tell us about yourself" preamble cut by default. Roy's own personal stories (incl. the tower/breaking-point story) are pre-cleared — never gate them.

## Selection

1. Score all segments. Pick the highest-scoring set that fits 9–14 min **in original chronological order**.
2. Prefer 5–8 segments over 12 fragments — fewer, longer beats hold retention better than choppy montage.
3. Pick the cold open LAST, from the already-selected material (so the promise is kept).
4. The final segment should land an ending — a takeaway, a strong quote, the guest's best line. Never end mid-theme.

## Cut hygiene

- Snap starts to sentence starts: `word.start - 0.15 s`. Snap ends to sentence ends: `word.end + 0.25 s`.
- Prefer boundaries with a ≥300 ms gap to the next word (natural pause = invisible cut).
- Merge selected ranges that sit <2 s apart.
- Re-encode (`libx264 -crf 18 -preset fast`); never `-c copy` across cut points.

## Chapters (mandatory)

- First chapter `00:00` — name it after the hook, not "Intro".
- One chapter per segment, title ≤40 chars, benefit/tension-led.
- ≥10 s per chapter (YouTube requirement); ≥3 chapters total.

## Titles & thumbnail

- 5 title candidates, ≤60 chars, front-load the payoff/claim. Never "Ep N with Guest".
- Thumbnail text: 3–4 words ALL CAPS that do NOT repeat the title.
- Contact sheet for frame choice — **never auto-pick** (blink/mid-word risk); the user selects the timestamp. One expressive face usually beats two heads.

## Description opening

First 150 characters = hook + topic keyword (visible before "Show more", feeds AI search surfaces). Then a natural-language paragraph naming the guest and 2–3 concrete takeaways.
