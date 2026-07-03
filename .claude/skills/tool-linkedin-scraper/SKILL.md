---
name: tool-linkedin-scraper
version: 1.0.1
description: >
  Fetch recent posts from LinkedIn profiles via the Apify API.
  Accepts one or more profile URLs, returns each post as markdown with
  frontmatter (author, url, posted_at, likes, text). Maintains a seen-file
  to avoid reprocessing posts across runs. Requires APIFY_API_KEY.
  Triggers on: "scrape linkedin", "linkedin posts", "get linkedin content",
  "fetch linkedin profile", "linkedin inspiration".
  Does NOT trigger for content creation, repurposing, or publishing.
---

# LinkedIn Scraper Tool

Utility skill for pulling recent posts from LinkedIn profiles. Uses the Apify `harvestapi~linkedin-profile-posts` actor — same API used by the n8n workflow.

## Outcome

Each new post saved as a markdown file with frontmatter. Used by `linkedin-posts-creator` cron as an inspiration source.

## Context Needs

None. This skill doesn't read brand context.

| File | Load level | Purpose |
|------|-----------|---------|

## Dependencies

None — base utility skill.

| Service | Key | Required For | Without It |
|---------|-----|-------------|------------|
| Apify | `APIFY_API_KEY` | All scraping | No fallback — ask user to paste posts manually |

Get a key at https://apify.com — free tier includes 2,500 scrapes. Use code `25SIMON` for 25% off paid plans. Cost: ~$2 per 1,000 posts.

## Step 0: Auto-Setup (runs once)

Check if `uv` is available. If not, run the setup script.

```bash
bash .claude/skills/tool-linkedin-scraper/scripts/setup.sh
```

## Step 1: Check credentials

If `APIFY_API_KEY` is not set, tell the user what it does, where to sign up, and that they can paste posts manually as a fallback. Do not proceed.

## Step 2: Run the scraper

```bash
uv run --env-file {env_file} .claude/skills/tool-linkedin-scraper/scripts/scrape.py \
  --profiles "https://linkedin.com/in/profile-1/,https://linkedin.com/in/profile-2/" \
  --max-posts 5 \
  --days 7 \
  --seen-file cron/status/linkedin-inspiration-seen.txt
```

Each new post is printed to stdout as a markdown block with frontmatter.

**Script options:**

| Option | Default | What it does |
|--------|---------|-------------|
| `--profiles` | — | Comma-separated LinkedIn profile URLs |
| `--max-posts` | 5 | Max posts per profile |
| `--days` | 7 | How far back to look |
| `--seen-file` | — | Path to seen-posts tracking file |
| `--api-key` | env var | Override APIFY_API_KEY |

## Step 3: Save output

The script prints each new post to stdout. Read `.claude/skills/tool-linkedin-scraper/skill-pack/config/sys-config.md` → `## Paths` → `projects_base`. Save each to `{projects_base}/00-social-content/{YYYY-MM-DD}/logs/inspiration/{slug}.md` where `{YYYY-MM-DD}` is the run date (caller-supplied when invoked by an orchestrator) and `slug` is derived from the author name and post date.

## Step 4: Collect Feedback

If used standalone, ask: "Got the posts. Anything else you need from these profiles?"

If the user flags an issue, update the relevant instruction in this file directly — edit the step or option that caused the problem rather than appending a note elsewhere.

---

## Rules

*Updated automatically when the user flags issues.*

---

## Troubleshooting

- **No API key**: Scraping won't work. Offer to let user paste posts manually.
- **Apify timeout**: The actor runs sync — if it times out (>60s), retry once. If it fails again, skip the profile and continue.
- **Profile not found**: URL might be wrong or the profile might be private. Log a warning and skip.
- **Rate limits**: Apify's free tier allows 2,500 scrapes. Each post counts as ~1 scrape. Monitor usage at apify.com/billing.
