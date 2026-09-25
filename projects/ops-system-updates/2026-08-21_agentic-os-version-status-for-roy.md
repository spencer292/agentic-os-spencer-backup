# Agentic OS version status — Got Moles install

**From:** Spencer (Got Moles)
**To:** Roy — All The Power
**Date:** 2026-08-21

---

## Short version

Our install is on **Agentic OS 0.3.4**. Simon's mainline is on **1.1.2** and has been since 2026-08-05. The Got Moles fork we pull from is also on 0.3.4, so there is nothing for us to pull — the fork itself is what's behind.

Can you rebase the Got Moles fork onto Simon's 1.1.x line, or tell us which parts of it you want to bring across?

---

## The numbers

| What | Version | Notes |
|------|---------|-------|
| This install (`VERSION`) | **0.3.4** | |
| `origin` — `Got-moles/Agentic-os-got-moles` | **0.3.4** | We are 0 commits behind, 91 ahead |
| Simon's mainline Agentic OS | **1.1.2** | Announced live 2026-08-05 |

Gap: **0.3.4 → 1.1.2**.

## Where the 1.1.2 number comes from

Simon Scrapes' Agentic Academy feed (Skool notifications + weekly digests to spencer@got-moles.com):

- **2026-08-05** — "Agentic OS 1.1.2 is live + a new direction for Team OS" — the most recent version announcement
- **2026-08-11 / 08-15** — knosy first look (team-knowledge product); no version bump
- **2026-08-14** — annual membership promo closed
- **2026-08-17 / 08-19** — support-session feedback, Community Hangout day poll

Nothing newer than 1.1.2 has been announced through 2026-08-19.

## State of our install

- **91 local commits**, 2026-07-04 → 2026-08-19, ~1,721 files changed. Almost all of it is our own work: session memory, project briefs, the Jobber/OptimoRoute route automation, the text-collection robot, call grading, Google Ads scripts.
- **Shipped core files are untouched.** The only files we've changed inside shipped paths are things we added ourselves:
  - `.claude/skills/ops-phone-roleplay/SKILL.md`, `.claude/skills/tool-browser/SKILL.md` — both locally built, not upstream skills
  - 16 files under `cron/jobs/` — all our own job definitions
  - 5 scripts under `scripts/` and `scripts/meetings/` — all ours
- No edits to `AGENTS.md`, `CLAUDE.md`, `brand_context/`, `docs/`, `CLIENT-SETUP.md`, `README.md`, or `command-centre/`. Personal rules all live in `CLAUDE.local.md`.

So a rebase onto 1.1.x should be low-conflict on the core. The risk sits in whatever 1.1.x changed structurally — memory store schema, skill registry format, cron runtime — not in us having edited shipped files.

## What we'd like to know

1. Can the Got Moles fork be rebased onto Simon's 1.1.2, or do you want to cherry-pick specific features?
2. What actually landed in 1.0 → 1.1.2? We haven't read the release notes yet — some of it may be things we've already built our own version of here (route automation, text robot, call grading), in which case a straight rebase could collide with working production tooling.
3. Anything in 1.1.x that touches the **memory store** (PGLite/pgvector) or the **cron runtime**? Those two are load-bearing on this install — we have live crons writing to Jobber, and a full memory index we don't want rebuilt from scratch.
4. Same question for the **Team OS "new direction"** mentioned in the same announcement — does that change anything for a single-business install like ours?

## Constraints on our side

- Split-direction git: we pull from `origin` (your repo), push to our own private `backup`. Origin's push URL is disabled here by design.
- Live production dependencies on this install: Jobber writes (cron jobs), OptimoRoute route planning, CallRail→Jobber sync, the Google Ads scripts. An upgrade that resets the cron runtime or the memory store needs a heads-up so we can stop crons first.
