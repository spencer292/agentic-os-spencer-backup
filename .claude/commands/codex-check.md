---
description: Have OpenAI Codex independently review the current work, then triage its findings
argument-hint: "[nothing = uncommitted | --base <branch> | --commit <sha> | freeform focus]"
allowed-tools: Bash(codex review:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*), Read, Grep, Glob
---

# Codex cross-check

A second, independent reviewer (OpenAI Codex) looks at the work in this repo. The
point is **disagreement** — Codex has not been in this conversation, has no stake
in the code being right, and reads `AGENTS.md` plus its own global instructions at
`~/.codex/AGENTS.md` (which carry the Got Moles client rules).

## Scope

Read `$ARGUMENTS`:

- **Empty** → the uncommitted working tree (staged + unstaged + untracked). The
  default, and what a bare prompt already reviews.
- **`--base <branch>` or `--commit <sha>`** → pass that flag through, alone. See
  the tradeoff under **Run it**.
- **Anything else** → a *focus instruction* over the uncommitted tree. Fold the
  text into the review prompt.

First run `git status --short` so you know what is actually in scope. If the tree
is clean and no `--base`/`--commit` was given, say so and stop — do not burn a
review on an empty diff.

## Run it

**The CLI rejects a scope flag combined with a prompt** — `codex review
--uncommitted "..."` errors with *"the argument '--uncommitted' cannot be used with
[PROMPT]"*, despite its own usage line implying otherwise. Stdin (`-`) is the same
positional arg, so it collides too. There is no way to pass both. So:

- **Default / focus case → prompt only:** `codex review "<prompt>"`. This already
  scopes to the uncommitted working tree (verified — it picks up untracked files),
  so the `--uncommitted` flag is redundant anyway. Use this form almost always;
  the prompt is where the value is.
- **`--base <branch>` / `--commit <sha>` → flag alone, no prompt:** you lose the
  ability to state intent, so Codex reviews mechanically. Warn the user of that
  tradeoff when they ask for this scope, and offer the prompt-only form instead if
  the changes are still uncommitted.

Use a Bash timeout of 600000 (10 min) — reviews are slow. Build `<prompt>` from:

1. What the work was meant to do, in one or two sentences, from this session's
   context. Codex does not have it. Without this, Codex reviews syntax instead of
   intent, which is worthless.
2. Anything you are personally unsure about — say so explicitly and ask Codex to
   attack it. This is the highest-value part of the prompt.
3. The user's focus instruction, if they gave one.
4. Standing asks: does this violate the Got Moles content, pricing, or repo-safety
   rules in `~/.codex/AGENTS.md`? Does it edit a shipped file? Does it write to
   live Jobber/OptimoRoute state without the safety checks?

Do **not** tell Codex what you concluded. A primed reviewer agrees with you, which
defeats the purpose.

## Triage the findings — do not just relay them

For each finding, verify it against the actual code before repeating it. Then mark
one of:

- **Confirmed** — real. Give file:line and the failure case.
- **Already handled** — Codex missed a guard. Name the guard.
- **Wrong** — explain why in one line. Codex lacks session and business context and
  will sometimes flag correct code; say so plainly rather than deferring.
- **Style/preference** — not a defect. Group these at the end, briefly.

Then state your own verdict: ship, fix first, or needs Spencer's call. If Codex
found nothing and you agree, say that in one line — a clean review is a real
result, not a reason to manufacture findings.

## Fixes — out of scope for this command, by design

This command is **review-only**. Its `allowed-tools` deliberately grant no `Edit`
or `Write`. Report findings, recommend an action, and stop. If the user wants the
fixes applied, they say so in the next turn and you do it as ordinary work — that
keeps "what a second reviewer thinks" and "what we changed because of it" as two
separate, reviewable steps.

If `$ARGUMENTS` asks for fixes, run the review, then say plainly that you will
apply them next turn rather than silently skipping the request.
