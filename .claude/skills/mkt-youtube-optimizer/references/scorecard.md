# Pre-Publish Scorecard — dimensions, weights, evidence rules

Score each dimension 0–10, multiply by its weight, sum to /100. Every score line must cite
evidence (a measurement, an API result, a checklist item) — a score with no evidence is vibes.

## 1. Packaging-CTR — weight ×2.5 (25)

- Thumbnail against the pattern rules (`thumbnail-patterns.md`): face ≥35% frame height with
  a real expression (+3), ≤3 big words OR boxed-phrase quote (+2), one idea / no clutter (+1),
  visual cue (+1), legible in the 168px strip (+1), brand chip consistency (+1), no baked
  AI-lettering artifacts (+1).
- Title: ≤60 chars, keyword front-loaded, concrete promise, qualifier where useful.
- **Coherence:** title and thumbnail promise the same video. Split promise on a small channel
  = cap this dimension at 6 and name it as the fix.

## 2. Search & suggested fit — weight ×2.0 (20)

- A named target query exists and the title matches its intent.
- API evidence: top results for the query — their age, view counts, and angle. Score high when
  incumbents are old/misaligned (gap), low when fresh strong exact-match content dominates.
- Description first two lines contain the promise + query language (visible before "Show more").
- Chapters present (search "key moments" eligibility).

## 3. Hook & retention structure — weight ×2.0 (20)

- First 15s: pattern interrupt or sharpest story? (Scene-setting opens score ≤5.)
- Strongest material placement: is the thumbnail-promised moment inside the first third?
- Visual cadence: nothing static >12s (for produced videos); cut/beat rhythm for camera video.
- Runtime appropriate to intent (search how-to: 8–15 min sweet spot; don't pad).

## 4. ICP fit — weight ×1.5 (15)

- Pain named in the first two description lines, in the ICP's own words (`brand_context/icp.md`).
- Language register matches (UK owner-manager: no hustle-bro vocabulary).
- The promised outcome is one the ICP actually wants (check against ICP pains/aspirations list).

## 5. Funnel — weight ×1.0 (10)

- CTA destination URL RESOLVES (fetch it) and matches the video's promise (a video promising a
  worksheet must not land on a homepage).
- First comment CTA planned/posted; end-screen plan; pinned status.
- One CTA, not four.

## 6. Prediction calibration — weight ×1.0 (10)

This dimension scores the PLAN, not the video: are expectations set against channel reality?
- Channel baseline pulled (subs, median views of last 10 uploads).
- A falsifiable 28-day prediction written (view range + CTR band + AVD target).
- External traffic plan named if the channel is small (<1k subs): what drives the first 500
  views? "The algorithm" is not a plan — score 0–3 if there's no distribution plan.

## Output format

```markdown
# Scorecard — {title} — {date}
**Score: NN/100** {PASS ≥70 / FIX FIRST <70}

| Dimension | Score | Weighted | Evidence |
|---|---|---|---|
...one line each...

## Top 3 fixes (by leverage)
1. {fix} — {expected effect}
...

## Prediction (28 days from publish)
- Views: {low}–{high} · CTR: {x}–{y}% · AVD target: ≥{m:ss} ({%})
- Primary traffic: {search|shorts|external|browse} · Assumptions: {one line}
```

## Ledger entry (append to prediction-ledger.json)

```json
{ "videoId": "", "title": "", "scored": "YYYY-MM-DD", "score": 0,
  "predicted": { "views28d": [low, high], "ctr": [x, y], "avdPct": 40 },
  "actual": { "views28d": null, "checkedAt": null }, "verdict": null }
```

## Calibration protocol

At each 28-day review, fill `actual`, set `verdict` (hit/over/under), and if two consecutive
predictions miss in the same direction for the same video type, write a dated correction into
the skill's `## Rules`. Weights themselves only change with the user's sign-off.
