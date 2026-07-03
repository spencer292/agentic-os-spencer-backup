# Micro-Clip Selection — The One-Liner Model (10–20s)

A separate selection pass for **ultra-short clips** (10–20 seconds) aimed at
TikTok, Reels, and Shorts where the format rewards a single punch and a seamless
loop. This is **not** a shorter version of the 45–90s arc model in
`performance-scoring.md` — it hunts a different thing and scores it differently.

Run this pass **in addition to** the standard pass, over the **same transcript**.
Micro-clips may overlap with arc clips (a micro can be the single hottest line
*inside* a 55s clip you already picked) — that's fine. Different format, different
platform, different job.

---

## What changes vs the arc model

| | Arc clip (45–90s) | Micro clip (10–20s) |
|---|---|---|
| Unit | A coherent segment with a beginning and payoff | **One sentence** that lands on its own |
| Hook | Opens on the hottest beat, then develops | The hook **is** the whole clip |
| Open loop | Opens a gap, holds it, may leave it unresolved | No time — pure punch or pure provocation |
| Editing | Keep the runway and the wind-down | **Trim ruthlessly** to the single beat |
| Win condition | Makes someone watch to the end | Makes someone **re-watch and screenshot** |

The micro instinct: **find the line you'd put on a graphic.** Then cut everything
that isn't that line landing.

---

## Scoring — 5 dimensions, 100 points

The weights front-load *standalone punch* and *quotability* — the two things that
make a sub-20s clip work. Coherence is a strict gate here (one line must make
sense with zero context), not a scored axis.

### 1. Standalone Punch (0–30) — the dominant axis
Does ONE sentence hit at full force with no setup?
- **25–30**: A complete, self-contained gut-punch or hot take. Needs nothing before or after it.
- **18–24**: Strong line that lands, with maybe one word of context needed.
- **10–17**: Good thought but leans on the surrounding sentences.
- **0–9**: Only works as part of a longer passage — reject for micro.

### 2. Quotability (0–25)
Would someone screenshot, caption, or tattoo this exact line?
- **20–25**: Clean, punchy, standalone — "clarity before complexity, regulation before strategy."
- **14–19**: A memorable phrase with a clear shape.
- **7–13**: Coherent but nothing sticky.
- **0–6**: All connective tissue, no line.

### 3. Pattern Interrupt / Hook (0–20)
Does the first ~1 second stop the scroll?
- **16–20**: Opens on a number, a contradiction, a confession, or a "you're doing X wrong."
- **10–15**: A clear, intriguing opening.
- **4–9**: Warms up before it gets going (bad for micro — trim earlier or reject).
- **0–3**: No hook in the first beat.

### 4. Emotional or Contrarian Charge (0–15)
Does it provoke a feeling or a "wait, what?"
- **12–15**: Visceral — vulnerability, a named villain, a stake, or a genuine hot take.
- **7–11**: Some charge, a clear point of view.
- **0–6**: Neutral, informational, agreeable.

### 5. Loopability (0–10)
Does the last word flow back into the first for a seamless re-watch?
- **8–10**: Ends where it begins — the loop is invisible.
- **4–7**: Ends cleanly, no jarring cutoff.
- **0–3**: Ends mid-thought or trails off.

`micro_score` = sum of the five (max 100).

---

## Gate (strict)

- **Intelligibility:** the clip must make complete sense to someone who saw
  nothing else. A micro that needs the previous sentence is **rejected** — there's
  no room to carry context. This is stricter than the arc model's content floor.
- **Duration:** 10–22s. Below 10s reads as a glitch; above 22s it's an arc clip,
  not a micro. Target the 12–18s sweet spot.
- **Min score:** default 72 (see config). One-liners are abundant; keep the bar high.

---

## Selection instruction (how to hunt)

When scanning the transcript for micros, change the instinct from the arc pass:

- Hunt for the single hottest **sentence**, not a segment. Read for lines that
  would survive on a slide with no other words around them.
- **Trim to the beat.** Find the line, then set `start_sec`/`end_sec` to just the
  sentence landing — cut the "um, so what I think is…" runway and the "…you know?"
  wind-down. A 9-word line is often a 6-second clip.
- **Overlap is allowed.** A micro can sit inside an arc clip you already chose. If
  the arc clip "AI Won't Do The Work For You" contains the line "vanilla is a great
  flavour but nobody runs out the street for vanilla," that line is its own micro.
- Prefer **declarative, complete thoughts**: statements, not questions left hanging
  (a question only works as a micro if it's rhetorical and self-answering).
- Expect **more candidates than the arc pass** — a 38-minute episode might yield
  6–12 micros. Cap per config; rank by `micro_score`.

---

## Sensitivity

Same rule as the arc model: surface a `sensitivity` flag, never auto-suppress.
Podcast guests are pre-cleared (see the 00-longform-to-shortform local rules), so
guest one-liners on hard topics are in-bounds — but still tag them so a human can
see what's going out.

---

## Output (per micro-clip)

```json
{
  "id": 1,
  "title": "clarity-before-complexity",
  "start_sec": 612.40,
  "end_sec": 626.10,
  "duration_seconds": 13.7,
  "hook_line": "Clarity Before Complexity",
  "the_line": "Clarity before complexity, regulation before strategy. That's the whole job.",
  "format": "micro",
  "micro_scores": { "punch": 28, "quotability": 23, "hook": 18, "charge": 12, "loop": 8 },
  "micro_score": 89,
  "sensitivity": { "level": "none", "topic": "", "note": "" }
}
```

`format: "micro"` marks the lane so the renderer and the social system can route
it TikTok/Reels-first. `micro_score` is the authoritative ranking value for this
pass.
