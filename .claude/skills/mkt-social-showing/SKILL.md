---
name: mkt-social-showing
version: 1.0.0
description: "Turns a clip or any content into an ICP-sharp, hook-first post package. Crafts the 3-layer hook, maps content to an ICP pain/aspiration, applies Hook-Retain-Reward + the 4 viral triggers, then writes and scores platform-native packages (LinkedIn, YouTube, Instagram, TikTok, X, Threads, Facebook). Triggers: 'social showing', 'make this post viral', 'optimize this post', 'post package for', 'viral package', 'write the hook for', 'make this travel', 'package this for social'. Not for long-form writing (mkt-copywriting) or cross-format repurposing (mkt-content-repurposing)."
argument-hint: path_to_clip_or_content (+ optional platform list)
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash(*)
  - Glob
  - Grep
  - WebSearch
  - mcp__claude_ai_Notion__*
dependencies:
  - mkt-short-form-posting
  - tool-humanizer
optional-dependencies:
  - str-trending-research
  - 00-video-studio
metadata:
  category: marketing
  phase: post-optimization
---

# Social Showing — make the post travel

A finished clip is only half the job. This skill makes the **showing** excellent: the right hook
in the right place, an angle the ICP actually cares about, the viral elements present, and a score
before anything posts. Grounded in researched 2025/26 short-form best practice (`references/viral-framework.md`).

## The one rule

**The first 3 seconds decide everything.** Top short-form holds 70-90% of viewers in second one;
clearing 60% retention past 3s is what triggers the algorithmic push. Every decision serves the hook
and the hold. If the hook is weak, nothing else matters — fix it first.

## Inputs

- A finished clip (from `00-video-studio` review) **or** any content (transcript, article, idea).
- Optional: target platforms (default: all connected — LinkedIn, YouTube, Instagram, TikTok, X, Threads, Facebook).

Load `brand_context/icp.md` (full), `voice-profile.md` (full), `positioning.md` (summary) before writing.

## Workflow

### 1. Core message + ICP angle
Read the transcript/content. Name the **ONE** thing this says. Then answer, explicitly:
**"Why does Mark or Mary care?"** (the ICP personas). Map it to a specific pain or aspiration from
`icp.md` — see `references/icp-angles.md`. A post with no ICP angle does not ship.

### 2. The hook (3 layers, one message)
Write the hook as three reinforcing layers (`references/hook-formulas.md`):
- **On-screen text** (frame 0, 4-8 words) — the scroll-stopper. *Feed this back to the video as a
  first-frame overlay via `00-video-studio` when the clip is ours.*
- **Spoken / caption first line** (10-14 words) — lands in 3s.
- **Visual** — the opening frame supports, never fights, the text.
Pick a formula (Contrarian Claim / Mistake Warning / Open Loop / Stakes / Question) and **stack ≥2
triggers** (curiosity, pattern-interrupt, self-relevance, emotional arousal).

### 3. Structure check — Hook → Retain → Reward
- **Retain:** one takeaway, no slow start, no filler. Cut anything before the hook pays off.
- **Reward:** the viewer must leave with more than they expected (insight, feeling, or a line they'll repeat).
- Confirm there's a **payoff** and a **shareability trigger** (relatable truth / identity / usefulness / emotion).

### 4. Platform packages
Per platform, write native copy (`references/platform-playbook.md`). Key moves:
- **LinkedIn:** no external link in the post (−60% reach) → **link in first comment**; native vertical
  <60s feel; lead with the human line; invite a reply (depth > likes).
- **TikTok / Reels / Shorts:** keyword-rich on-screen text + caption (search discoverability);
  optimise for **completion, saves, shares** — not likes; loop-friendly ending.
- Each platform: caption, 3-5 niche hashtags/keywords, a **first comment** (engagement question or the link).

### 5. Score before you ship
Run `references/scorecard.md` — rate Hook, ICP fit, Shareability, Clarity, Platform-fit (1-5 each).
**Anything below 4 on Hook or ICP fit → revise, don't post.** Show the user the score with the package.

### 6. Humanize + output
- Run captions through `tool-humanizer` (deep mode — `voice-profile.md` exists).
- Write `posts.json` (the `zernio_post.cjs` format) + `showing-brief.md` (hook rationale + score) to
  the clip's run dir.
- If a Video Studio Notion row exists, update its **Hook**, **ICP Angle**, **Platforms** fields.

## Output
- `posts.json` — per-platform packages, ready for `00-video-studio/scripts/zernio_post.cjs`
- `showing-brief.md` — the hook, the ICP angle, the score, and what to fix if weak
- (optional) first-frame hook text handed back to the video overlay pass

## Dependencies
| Skill | Required? | Provides | Without it |
|-------|-----------|----------|------------|
| `mkt-short-form-posting` | Reuse | Platform algorithm guides (TikTok/Shorts/Reels) | Use `references/platform-playbook.md` only |
| `tool-humanizer` | Required | De-AI the captions before posting | Captions risk sounding generated |
| `str-trending-research` | Optional | A current angle/keyword to ride | Package from evergreen angle |

## References
| File | Purpose |
|------|---------|
| `references/viral-framework.md` | The researched methodology (3s rule, Hook-Retain-Reward, 4 triggers, sources) |
| `references/hook-formulas.md` | Copy-paste hook templates by trigger + the 3-layer hook |
| `references/platform-playbook.md` | Per-platform 2025/26 rules (LinkedIn link-in-comment, TikTok search, etc.) |
| `references/icp-angles.md` | Map content → Mark/Mary pain or aspiration |
| `references/scorecard.md` | The pre-post rubric |
