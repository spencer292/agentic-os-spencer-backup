---
name: mkt-longform-article
version: 1.0.0
description: >
  Transform video transcripts into deeply-written magazine-style editorial articles. The writer
  interprets the video for someone who hasn't watched it — explaining jargon inline, adding editorial
  framing, connecting ideas across sections, and producing a piece that reads like a feature article.
  Use when: "write an article from this transcript", "turn this video into a long-form piece",
  "editorial from transcript", "magazine-style article". Also triggered in pipeline mode by
  00-youtube-to-ebook. Do NOT trigger for summaries, social posts, or short-form repurposing.
---

# Long-Form Article Writer

Transform raw video transcripts into polished editorial long-form articles. The writer acts as an interpreter — not a summarizer — producing magazine-quality prose that stands alone for readers who never watched the source video.


## Paths

Read `skill-pack/config/sys-config.md` → `## Paths` section before any path-dependent step. It resolves `{decoupled_base}`, `{env_file}`, `{brand_context}`, and `{projects_base}` to absolute paths set by the installer. Substitute these placeholders wherever they appear below.

## Outcome

A markdown article (2,000-5,000 words depending on source length) saved to `{projects_base}/mkt-longform-article/{YYYY-MM-DD}/{title}.md`. In pipeline mode, returns the markdown content directly to the calling skill.

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `{brand_context}/voice-profile.md` | tone only | Match brand voice if available |
| `context/learnings.md` | `## mkt-longform-article` | Past article feedback |

## Dependencies

| Skill | Required? | What it provides | Without it |
|-------|-----------|------------------|------------|
| `tool-youtube` | Optional | Transcript fetching | User pastes transcript manually |

## Step 1: Analyze the Transcript

Read the full transcript. Before writing anything, identify:

1. **Core thesis** — What is the speaker's main argument or insight?
2. **Key concepts** — List every technical term, acronym, or domain-specific idea that needs explaining
3. **Narrative arc** — How does the speaker build their argument? What's the logical flow?
4. **Quotable moments** — Direct quotes that capture the speaker's voice and should be preserved
5. **Structural sections** — Natural breakpoints where the topic shifts

## Step 2: Plan the Article Structure

Map the transcript's flow to an article structure. Read `references/editorial-methodology.md` for the full writing methodology.

The article does NOT follow the video's chronological order. Reorganize for reading clarity:

- **Opening hook** — A concrete, provocative statement that captures the core tension
- **Context setup** — Who is speaking, what have they built, why should the reader care
- **Body sections** — Each major idea gets its own section with smooth transitions
- **Jargon gates** — Every technical term explained inline on first use (naturally, not parenthetically)
- **Closing synthesis** — What does this all mean? The "so what" for the reader

## Step 3: Write the Article

Write in editorial long-form style. Key principles:

- **Interpret, don't transcribe** — The reader hasn't watched the video. You're their guide.
- **Preserve the speaker's voice** — Use direct quotes for their most distinctive statements
- **Explain everything** — If a term would confuse a smart non-expert, define it inline
- **Connect ideas** — Draw lines between sections that the speaker left implicit
- **No headers in the first ~500 words** — Let the opening breathe as continuous prose
- **Sections after that** — Use descriptive prose headers, not labels

If `{brand_context}/voice-profile.md` exists, match its tone. Otherwise, default to: authoritative but accessible, precise but not academic, direct but not blunt.

Read `context/learnings.md` section `## mkt-longform-article` before generating output.

## Step 4: Self-Review

Before delivering, check:

- [ ] Could a reader who never watched the video fully understand this piece?
- [ ] Is every technical term explained on first use?
- [ ] Are direct quotes used for the speaker's most distinctive moments?
- [ ] Does the article have a clear thesis and conclusion?
- [ ] Is the tone consistent throughout?
- [ ] Is the word count proportional to the source material (aim for 30-50% of transcript word count)?

## Step 5: Save Output

Always save output to disk. This is not optional.

- **Standalone mode:** Save to `{projects_base}/mkt-longform-article/{YYYY-MM-DD}/{slugified-title}.md`
- **Pipeline mode:** Return markdown content to the calling skill (it handles saving)

After saving, show the user the full absolute file path.

## Step 6: Collect Feedback

Ask: "How did this land? Any adjustments to tone, depth, or structure?"

Log feedback to `context/learnings.md` under `## mkt-longform-article` with date and context.

## Rules

- Never produce a transcript summary — this is editorial interpretation
- Always explain jargon inline, never in footnotes or parenthetical asides
- Preserve at least 3-5 direct quotes from the speaker per article
- Opening must hook without headers — continuous prose for the first ~500 words
- Default word count: 2,000-5,000 words depending on source length

## Self-Update

If the user flags an issue with the output — wrong tone, bad structure, missing context, too summary-like — update the `## Rules` section in this SKILL.md immediately with the correction.
