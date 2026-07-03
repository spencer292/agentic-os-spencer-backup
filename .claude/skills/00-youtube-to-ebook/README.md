# YouTube to Ebook

Transform YouTube videos into fact-checked, long-form editorial PDFs.

## About

YouTube to Ebook takes a single YouTube video URL and produces a polished PDF article. The article is editorial — not a transcript summary — written in a magazine-feature style that interprets the video for readers who haven't watched it. Every factual claim is verified before the final output, and the writing is humanized to remove AI patterns.

## Key Features

- Editorial article writing that interprets rather than summarizes
- Inline jargon explanation — technical terms defined naturally on first use
- Evidence-based fact-checking with structured verdicts per claim
- Human review checkpoint — you approve the draft and fact-check results before final output
- AI pattern removal via humanizer (deep mode when brand voice exists)
- Clean, minimal PDF output — serif typography, generous margins, optimized for long-form reading
- Full pipeline audit trail with timestamped logs per run

## Use Cases

- Turning conference talks and tutorials into shareable written content
- Creating readable articles from podcast-style YouTube interviews
- Building a content library from video course material
- Repurposing thought-leadership videos into downloadable PDFs
- Archiving video knowledge in a portable, searchable format

## Pipeline Flow

```
┌──────────────────────────────────────────────┐
│  INPUT: YouTube video URL                     │
└──────────────────────┬───────────────────────┘
                       │
                       v
┌──────────────────────────────────────────────┐
│  1. FETCH TRANSCRIPT                         │  IN:  YouTube URL
│  Extracts captions from the video. The       │  OUT: {date}/logs/transcript.txt
│  entire pipeline depends on text input —     │
│  if no captions exist, the pipeline stops.   │
└──────────────────────┬───────────────────────┘
                       │
                       v
┌──────────────────────────────────────────────┐
│  2. WRITE ARTICLE                            │  IN:  transcript.txt + voice-profile
│  Transforms the raw transcript into a        │  OUT: {date}/logs/draft-article.md
│  magazine-style editorial. Reorganizes for   │
│  reading clarity, explains jargon inline,    │
│  and preserves direct quotes.                │
└──────────────────────┬───────────────────────┘
                       │
                       v
┌──────────────────────────────────────────────┐
│  3. FACT-CHECK                               │  IN:  draft-article.md
│  Extracts every factual claim and verifies   │  OUT: {date}/logs/fact-check-report.md
│  it against authoritative sources. Returns   │
│  structured verdicts with evidence and       │
│  suggested corrections.                      │
└──────────────────────┬───────────────────────┘
                       │
                       v
┌──────────────────────────────────────────────┐
│  4. HUMAN REVIEW  [CHECKPOINT]               │
│  You see the draft + fact-check results.     │  IN:  draft + report
│  Approve, request edits, or stop.            │  OUT: {date}/logs/reviewed-article.md
│  This is the only pause in the pipeline.     │
└──────────────────────┬───────────────────────┘
                       │
                       v
┌──────────────────────────────────────────────┐
│  5. HUMANIZE                                 │  IN:  reviewed-article.md
│  Removes AI writing patterns. Uses deep      │  OUT: {date}/logs/final-article.md
│  mode if brand voice exists, standard        │
│  otherwise.                                  │
└──────────────────────┬───────────────────────┘
                       │
                       v
┌──────────────────────────────────────────────┐
│  6. GENERATE PDF                             │  IN:  final-article.md
│  Renders clean, minimal PDF with serif       │  OUT: {date}/{ebook-slug}/{title}.pdf
│  typography and generous margins.            │       + ~/Downloads/{title}.pdf
│  Copies to Downloads for quick access.       │
└──────────────────────┬───────────────────────┘
                       │
                       v
┌──────────────────────────────────────────────┐
│  OUTPUT                                       │
│  Finished PDF in {date}/{ebook-slug}/        │
│  Working files in {date}/logs/                │
└──────────────────────────────────────────────┘

All paths relative to projects/00-youtube-to-ebook/
{date} = YYYY-MM-DD · {ebook-slug} = sanitized video title
```

## Output Structure

```
projects/00-youtube-to-ebook/
└── {YYYY-MM-DD}/
    ├── logs/                              <- Working data from the pipeline run
    │   ├── transcript.txt                     Raw transcript from YouTube
    │   ├── draft-article.md                   First draft before fact-checking
    │   ├── fact-check-report.md               Claim verdicts and evidence
    │   ├── reviewed-article.md                After human review and corrections
    │   ├── final-article.md                   After humanizer pass
    │   └── pipeline-log.md                    Timestamped record of every phase
    └── {ebook-slug}/                      <- The finished PDF, ready to share
        └── {ebook-slug}.pdf                   Clean editorial article
```

## Approximate Timings

_Populated after first successful run._

## Prerequisites

- Python 3
- `markdown` and `weasyprint` Python packages
- `tool-youtube` skill (for transcript fetching)
- Optional: `YOUTUBE_API_KEY` in `.env` for channel features (direct URL works without it)
