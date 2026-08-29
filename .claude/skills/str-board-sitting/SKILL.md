---
name: str-board-sitting
description: Run an AI Board of Executives sitting - a meeting-format, interview-first advisory board (nine seats, consideration advice, two-column minutes). Triggers on "board sitting", "run the board", "take this to the board", "/board", "board meeting on". Any topic - marketing, sales, hiring, budgeting, pricing, direction. Does NOT trigger for general strategy work without the board framing.
---

# Board Sitting — the Boardroom Protocol

The board argues; the owner decides. A sitting is a six-item meeting run over file-based seats.
Board home: `board/` (seats.md, STATE.md, decision-log.md, brief.md, sittings/). If
`board/brief.md` does not exist yet, offer to build it first from `brand_context/` and the
owner's answers (see First Run at the end).

**Hard rules (do not relax):**
- Seats spawn FRESH and in PARALLEL. No seat-to-seat debate rounds, ever.
- The owner's lean, enthusiasm, and certainty are NEVER passed to the seats.
- Seats never contact the owner directly. All questions route through intake/clarification.
- Executive seats run as Claude **opus** subagents (never a cheaper model). Chair and NED also
  run as opus subagents; if the Codex CLI is installed on this machine, prefer
  `codex exec --sandbox read-only` for Chair and NED so they run on a different model family,
  and note which was used in the minutes.
- Output register everywhere: perspectives, questions, conditions, tests. Never verdicts.

## Agenda

### 1. Minutes and review
Read `board/STATE.md` + `board/decision-log.md`. If any entry's review date is due/past, read the
outcome back to the owner FIRST ("On {date} the board advised X; you decided Y; what happened?")
and record the outcome in the ledger before any new topic.

### 2. Intake interview
- Identify the **lead seat** for the topic (hiring→People, budget→Finance, campaign→Marketing...).
- Derive questions from the charters in `board/seats.md`: the lead seat's forcing questions go
  deep; other seats contribute only what `board/brief.md` and existing context cannot already
  answer. Never ask what is already known.
- ONE round, 5-7 questions max (AskUserQuestion where options fit, plain chat otherwise).
- Write the **Decision File** to `board/sittings/{YYYY-MM-DD}-{slug}/decision-file.md`:
  - THE QUESTION: the topic restated neutral, third-person, open ("Should the business X or Y?"),
    with the owner's preferences and certainty stripped out. If two decisions wear one coat,
    state both and run both.
  - OPTIONS: each live option including "do nothing".
  - FACTS: everything gathered, with figures.
  - ACCEPTED UNKNOWNS: what the owner could not answer, recorded openly.

### 3. Seat pass (parallel, fresh)
Spawn the seven executive seats (CEO, Finance, Operations, Marketing, Sales, People, Technology)
as parallel subagents, model **opus**, plus the NED. Each prompt contains ONLY: that seat's
section from `board/seats.md`, the SHARED RULES section, the Decision File, and its evidence
slice (named files where they exist — `board/brief.md` sections, relevant `brand_context/`
files). Each returns: read / forcing-question answers / sharpest concern / the thing the owner
won't want to hear / condition-or-test that would change its mind / at most one flagged question
if critically blocked. The NED includes its pre-mortem on contested topics.

### 4. Clarification round (optional, once, max 3 questions)
Collect flagged questions from the seat pass. Dedupe. If any survive: ask the owner in ONE round
(max 3). Update the Decision File. Re-spawn ONLY the flagged seats, fresh, against the updated
file. Never more than one clarification round; anything still missing falls to the both-ways rule.

### 5. The Chair closes
Feed the Chair charter + all seat outputs + Decision File to the Chair (Codex if installed, else
an opus subagent). The Chair produces consideration advice per its charter: disagreement named;
consensus (and independent convergence) named; per option the case for / case against / what
would have to be true / who backed and opposed; ONE recommendation for consideration + first
action + one no-regrets parallel step; the risk most worth watching. Ends: "This is the board's
thinking, not your decision. The call is yours."
Present the Chair's close to the owner in full. Follow-up questions reopen a specific seat against
the SAME Decision File - never a fresh opinion unmoored from the frozen facts, and never a verdict
however directly asked.

### 6. Minutes and write-back
- Save to the sitting folder: decision-file.md, seat outputs (`seats-output.md`), `close.md`.
- Append one row to `board/decision-log.md`: advice one-liner; **owner decision left blank until
  the owner states it** (the columns are never merged); review date (default +21 days, or the
  natural checkpoint the Chair named).
- Update `board/STATE.md` (keep under ~2,500 chars: consolidate before adding): new watches, open
  advice, any recurring theme.
- If the sitting produced a decision, it should leave as a to-do with an owner and a date, a
  quarterly goal, or a number to watch - say which.

## First Run — building board/brief.md
If `board/brief.md` does not exist: draft it from `brand_context/` and a short interview, in this
shape, then confirm with the owner before saving:
BUSINESS BRIEF for {business}, last updated {date}. THE BUSINESS / THE NUMBERS (monthly revenue
ballpark and trend, rough margin, monthly costs, cash cushion, money owed) / THE TEAM (who does
what, which jobs still land on the owner) / THIS QUARTER (goals and the number each moves) /
THE PROBLEMS (three, bluntly) / CONSTRAINTS / THE VISION.
Refresh it monthly; change the date every time.

## Learnings
Read `context/learnings.md` section `## str-board-sitting` if present; append intake-question
patterns that worked per topic type.
