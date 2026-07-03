# Performance Scoring — Edge-First Selection (v2)

The default 5-category content score optimises for *clear, complete, valuable*
clips. That reliably surfaces competent but forgettable content — the "good
LinkedIn post" detector. High-performing short-form is driven by **tension**,
not tidiness. This model leads with edge and resonance, uses viral mechanics as
the second signal, and treats content quality as a **floor, not the driver**.

Works for any content type (podcast, talking-head, webinar, demo, vlog) — the
signals are about *what makes a human stop and share*, not the format.

---

## The three layers

```
performance_score = (edge_total * 0.45) + (viral_total * 0.35) + (content_total * 0.20)
```

| Layer | Weight | Question it answers |
|-------|:--:|---------------------|
| **Edge & Resonance** | 0.45 | Will this make someone stop, feel something, and share to signal who they are? |
| **Viral Mechanics** (VPS) | 0.35 | Does the structure fit how the algorithm and attention actually work? (`viral-scoring-framework.md`) |
| **Content Floor** | 0.20 | Is it coherent and standalone? (the old 5-category score — now a minor term + a gate) |

**The Content Floor is also a GATE.** If a clip is incoherent or unintelligible
without external context (content_total < 45), discard it regardless of edge.
But a *high* content score must never let a bland clip outrank an edgy one —
that's the failure mode of v1. Clarity buys you a pass, not a win.

---

## Layer 1 — Edge & Resonance (0–100)

Five sub-scores, 0–20 each. This is the layer that was missing.

### 1. Tension / Contrarian (0–20)
Does it take a side, challenge a held belief, or name a villain?
- **18–20**: A genuine hot take — "[common belief] is wrong," names what everyone does badly, picks a fight worth having
- **14–17**: Has a clear point of view that some would push back on
- **10–13**: Mild opinion, mostly agreeable
- **0–9**: Neutral, balanced, "it depends" — nothing to argue with

### 2. Emotional Spike (0–20)
Vulnerability, stakes, confession, a real cost. The opposite of explaining.
- **18–20**: Raw — a real cost paid, a fear named, a confession. The viewer *feels* it
- **14–17**: Genuine emotion, some stakes
- **10–13**: Warm or pleasant but low-stakes
- **0–9**: Purely cerebral / informational

### 3. Identity Resonance (0–20)
"This is *so* me / so true" — the share-to-signal trigger.
- **18–20**: A whole in-group will tag each other — "this is exactly us"
- **14–17**: A clear niche sees themselves in it
- **10–13**: Relatable but generic
- **0–9**: No mirror — viewer doesn't see themselves

### 4. Open Loop / Curiosity (0–20)
Does it open a gap that's uncomfortable to leave unclosed?
- **18–20**: A "wait, what happened?" or "where is this going?" you must resolve
- **14–17**: A real question is posed and held
- **10–13**: Mild interest
- **0–9**: Everything resolved up front; no reason to stay

### 5. Quotability (0–20)
Is there one line you'd screenshot, caption, or put on a graphic?
- **18–20**: A clean, punchy, standalone line — "bulging veins in Silicon Valley, seen as a badge of honour"
- **14–17**: A good memorable phrase
- **10–13**: Nothing sticky but coherent
- **0–9**: All connective tissue, no line

`edge_total` = sum of the five (max 100).

---

## Sensitivity flag (surface, never auto-cut)

Edge lives next door to sensitivity. The highest-resonance moments often touch
mental health, money/failure, conflict, identity, politics. Do **not** suppress
them in scoring and do **not** auto-publish them. Add a flag and let a human
decide:

```json
"sensitivity": { "level": "none|low|high", "topic": "...", "note": "why it needs a human call" }
```

`high` → never auto-post; always route to human review even in auto mode.

---

## Output (added per clip)

```json
{
  "edge_scores": { "tension": 18, "emotional_spike": 20, "identity": 16, "open_loop": 15, "quotability": 18 },
  "edge_total": 87,
  "viral_total": 83,
  "content_total": 74,
  "performance_score": 83.0,
  "sensitivity": { "level": "high", "topic": "mental health", "note": "references suicidal ideation — brand call" }
}
```

`performance_score` is the authoritative ranking value — replaces `combined_score`.

---

## Selection instruction change (critical)

When scanning a transcript for candidates, **hunt for the spikes, not the
summaries.** Old instinct: find complete, self-contained explanations. New
instinct:

- Grab the **emotional peaks** and **contrarian lines** even if they start
  mid-thought — a clean "complete arc" is worth less than a gut-punch.
- Prefer a clip that **opens on the hottest beat** over one that warms up to it.
- A clip can end on an **unresolved provocation** — that drives comments.
- When two candidates overlap, keep the one with the higher `edge_total`, not
  the more "complete" one.

The floor still applies: the clip must make sense to someone who didn't see the
rest. But coherence is the *bar to clear*, not the thing to maximise.
