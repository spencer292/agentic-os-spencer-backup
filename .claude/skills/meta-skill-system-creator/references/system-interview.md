# System Interview

Relentless interview methodology for extracting a complete system specification before any building begins.

## Goal

Shared understanding of: what the system does, what already exists to support it, and what needs building from scratch. By the end, both sides could independently describe the same system and arrive at the same architecture.

## Phase 1: The Big Picture (2-4 questions)

Start by understanding what the user is trying to accomplish end-to-end.

**Opening:** "Before we build anything, I want to make sure we get this right. Let me interview you on this so we don't miss anything."

Establish:
- What problem does this system solve? (not "what do you want to build" but "what outcome do you need")
- What triggers a run? (user command, cron, event, another system's output)
- What goes in? (URL, file, text, API response — be specific about format)
- What comes out? (files, posts, notifications — where does output land)
- Who is this for? (just the user, a team, automated)

**Rules:**
- ONE question at a time
- Recommend an answer based on what you already know from their workspace
- Acknowledge before advancing ("Got it, so the input is always...")
- Don't accept vague answers — push for specifics

## Phase 2: Process Deep-Dive (5-12 questions)

Walk through the system's workflow step by step. For each phase:
- "What exactly happens here?"
- "What decisions need to be made at this point?"
- "Does the user need to approve/review here, or is it fully automatic?"
- "What could go wrong, and what should happen when it does?"
- "Show me an example of what this looks like in practice"

**The Relentless Pattern:** For every answer, ask: "Is this specific enough that I could hand it to a stranger and they'd know exactly what to do?" If not, push deeper.

**Map human-in-the-loop checkpoints explicitly:**
- Which steps pause for user input?
- What are they choosing between?
- Can they skip/override?
- What's the default if they don't respond?

## Phase 3: Ecosystem Scan (automatic, not interview)

Before asking what to build, scan what already exists. This happens SILENTLY between Phase 2 and Phase 4.

### 3a: Scan installed skills
Read `.claude/skills/` — for each skill, read YAML frontmatter. Map:
- **Direct reuse** — does an existing skill already do one of the phases? (e.g., `tool-transcription` for a video system)
- **Partial overlap** — does an existing skill do 80% of what's needed? Can it be extended?
- **Upstream providers** — which skills produce context this system should consume?
- **Downstream consumers** — which skills would benefit from this system's output?

### 3b: Scan brand_context
Read `brand_context/` files. Map:
- What identity info already exists (voice, ICP, positioning, assets)?
- What can be inherited into sys-config without asking?
- What creative prefs are already captured?

### 3c: Scan existing skill-pack configs
Check `skills/{entry-skill}/skill-pack/config/` for existing operational configs that overlap.

### 3d: Present the reuse map
Show the user:
```
EXISTING SKILLS THAT CAN BE REUSED:
- tool-transcription → covers Phase 2 (Transcribe)
- vid-clip-selection → covers Phase 4 (Score & Select)
- mkt-short-form-posting → covers Phase 8 (Publish)

PARTIAL MATCHES (may need extending):
- vid-editing-router → handles format detection, but needs X added

NEEDS BUILDING FROM SCRATCH:
- The orchestrator (entry skill)
- Phase 5 (Reframe) — nothing exists for face-tracking crop

BRAND CONTEXT ALREADY AVAILABLE:
- Voice profile: (won't ask about tone)
- Platform prefs: (inheriting default_platform=linkedin)
- Visual assets: (colors, logo)
```

## Phase 4: Edge Cases & Failure Modes (3-5 questions)

- "What happens when the input is incomplete?"
- "What if a phase fails halfway through — retry, skip, or abort?"
- "What's the minimum viable input?"
- "Are there cases where the system should refuse to proceed?"

## Phase 5: Confirmation (1-2 questions)

Summarize the full system as understood:

```
SYSTEM: {name}
TRIGGER: {how it starts}
INPUT: {what goes in}
PROCESS:
  1. {phase} — {description} [REUSE: existing-skill / BUILD: new]
  2. {phase} — {description} [REUSE / BUILD]
  ...
OUTPUT: {what comes out, where it goes}
HUMAN CHECKPOINTS: {where user intervenes}
EDGE CASES: {how failures are handled}
```

Then: "What did I get wrong? What's missing?"

## Interview Rules

1. ONE question at a time. Never 2+ in a single message.
2. Answer your own questions from context first. Scan workspace, existing skills, brand_context before asking.
3. Recommend an answer. Give your best guess for the user to react to.
4. Acknowledge before advancing. Confirm what you heard before the next question.
5. Don't accept vague answers. "It depends" → "Pick one default, we add flexibility later."
6. Use concrete examples. Ask for real inputs and ideal outputs.
7. Track unresolved items. Come back to "I'll figure that out later" before Phase 5.
8. Be conversational. Collaborative whiteboarding, not interrogation.
9. Know when to stop. Done when: every phase is specific, edge cases handled, user confirms summary.
10. Adapt depth to complexity. Simple systems (3-4 phases): 8-10 questions. Complex (10+ phases): 15-20.
11. REUSE FIRST. Never suggest building from scratch when an existing skill does the job.
