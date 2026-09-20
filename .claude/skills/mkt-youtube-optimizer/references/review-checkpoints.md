# Post-Publish Review Checkpoints

Pull with `node scripts/channel-context.mjs <videoId>` (public stats) + `mkt-content-analytics`
(Zernio) when available. Append each checkpoint to the video's scorecard file.

## 48 hours — "did the packaging work?"

- Views vs channel median (last 10 uploads) — above/below.
- Like ratio and comments as early engagement proxies.
- If Studio data available via the user: impressions source mix + CTR. Search CTR 8–15% is
  strong; browse 3–6% is normal. Below 2%: thumbnail/title problem — propose a Test & Compare
  variant NOW (first 48h impressions are the cheapest experiment).

## 7 days — "is it retaining?"

- View velocity: day 3–7 flat or compounding?
- Ask the user for the retention curve (Studio screenshot): 30s cliff depth (<55% remaining at
  0:30 = hook problem), mid-roll slope (steady fall = pacing, one cliff = a specific segment —
  name it from the chapter times).
- Comment sentiment: any "is this AI?" signals — flag for format strategy.

## 28 days — "was the prediction right?" (calibration, never skip)

1. Fill `actual` in the ledger entry; set verdict hit/over/under.
2. Search plays: check ranking movement for the target query (`fetch-ref-thumbs.mjs` search
   mode or channel-context competition list) — entered top 10?
3. If the miss is structural, write the dated correction into SKILL.md `## Rules` and log the
   pattern to `context/learnings.md ## mkt-youtube-optimizer`.
4. Report to the user against the original prediction verbatim — no goalpost moving.

## Verdict language

Hit = actuals inside the predicted range. Over/under = outside. Note WHY in one line
(traffic-source assumption wrong / CTR band wrong / retention different / external event).
Two same-direction misses on the same video type = mandatory Rules correction.
