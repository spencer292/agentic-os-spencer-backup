# Methodology Library — the module contract

`writ-review` is a generic engine. The *craft* it scores against lives in **methodology modules**, kept in a shared library so every writing skill (this one, `writ-draft`, `mkt-copywriting`, `mkt-longform-article`, `mkt-social-showing`) can load the same file. Update a module once → every skill that uses it gets sharper.

## Where modules live

Current (pilot) location: `projects/briefs/writing-os/methodologies/`.
Seed module: `dennis-ross.md`.

> Open decision: the final home of the shared library (e.g. a top-level `methodologies/` or `.claude/skills/_methodologies/`) is part of the writing-os build. Until then, point at the path above. If the library moves, update only this file.

## What every module MUST contain (so this skill can score it)

A module is a markdown file with these elements. The section numbers below mirror `dennis-ross.md`; new modules should keep the same shape so the engine finds the rubric in the same place.

1. **Frontmatter** — `methodology`, `title`, `type` (`storytelling` | `structural` | `style` | …), `applies_to` (list of formats), `version`.
2. **The technique set** — each device/posture explained, ideally with the *why* and a worked example.
3. **§7.1 Postures vs devices** — which elements are always-on whole-piece *postures* (scored as one read) vs *devices* that are placed and dosed.
4. **§7.2 Dosage & interaction table** — one row per device: `Role | Target dose | Home | Overuse looks like | Interacts with`. This is the heart of effectiveness scoring; without it the engine can only check presence.
5. **§7.3 Scorecard** — the lines to score, each tagged posture/device and (for devices) the placement × dosage × execution axes.
6. **§7.4 Diagnostic questions** — the questions the engine must answer *before* scoring (job / reader / peaks / baseline / format, or the module's equivalent).
7. **§8 Application protocol** — per-format device budgets and the gate threshold.
8. **Worked examples** — a few-shot library the engine (and `writ-draft`) can study.

## How this skill consumes a module

1. Load the module in full.
2. Read §7.4 → run the diagnostic questions → build the Map.
3. Read §7.1–7.3 → score postures whole-piece, devices on placement × dosage × execution.
4. Read §7.2 interaction notes → run the interaction & contrast checks.
5. Read §8 → apply the right device budget and gate for the piece's format.

## Adding a new methodology

Drop a new `{name}.md` into the library following the contract above, then name it when invoking the skill ("review this against Save-the-Cat"). No change to `writ-review` itself — that's the point of the registry. If a module is missing the §7.2 dosage table, the engine will warn that it can only score presence until the table is added.

## Optional machine-readable companion

A module may ship a `{name}.scorecard.json` so the rubric can be built programmatically rather than parsed from the markdown tables. Not required for the pilot — the engine reads the §7 tables directly.
