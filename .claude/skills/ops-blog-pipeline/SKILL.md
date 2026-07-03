---
name: ops-blog-pipeline
description: >
  End-to-end blog post creation — from topic to seeded-and-reviewable in one
  command. Writes the post (BLUF, knowledge-base-first, GEO-structured),
  generates a featured image (Gemini/nano-banana), runs the humanizer, adds to
  blog-data.ts, seeds to Payload CMS, and pushes to Notion for review.
  Deployment is a separate, gated step — see AGENTS.md "Website Deploy".
  Triggers on: "add a blog post", "new blog about", "blog post about",
  "publish a blog on", "write and publish a blog", "add blog to the site",
  "next blog post", "blog pipeline", "add content to the blog". Use this skill
  ANY time the user wants a blog post created and published — even if they just
  say "write a blog about moles" without mentioning publishing. This is the
  default blog skill. If the user only wants the markdown draft without
  publishing, they'll say so explicitly.
  Does NOT trigger for: updating existing CMS content or city pages (use
  ops-cms-content), sales copy or landing page copy (use mkt-copywriting),
  repurposing existing content into social posts (use mkt-content-repurposing),
  UGC video scripts (use mkt-ugc-scripts).
---

# Blog Pipeline

One command, one blog post, ready to ship. This skill orchestrates the chain: content writing, image generation, humanization, CMS seeding, and Notion review. Each step reports progress. If any step fails, the pipeline continues with what's possible — a post without an image is still worth publishing.

## Outcome

A blog post staged for the Got Moles website with:
- Rich text content in Payload CMS (via blog-data.ts seed)
- Featured image generated and saved to `projects/briefs/website-rebuild-rebrand/site/public/images/`
- Notion page for Spencer's review
- Markdown archive in `projects/mkt-authority-content/`

**Deployment is out of this skill's scope.** The live site currently deploys from the ORIGINAL `freeflyroy/agent-os` repo (see the client AGENTS.md "Website Deploy" section) — a rewire decision is pending. Until then, end the pipeline at "seeded + pushed to Notion" and tell the user the change is staged but not live.

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `brand_context/mole-knowledge-base.md` | full | Primary fact source. Every claim traces back here. |
| `brand_context/voice-profile.md` | tone + rhythm | Match Got Moles voice |
| `brand_context/positioning.md` | summary | Brand angle consistency |
| `brand_context/icp.md` | full | Know the reader: awareness level, pain points, language |
| `projects/briefs/mole-content-authority/content-plan.md` | scan for topic | Queue of planned posts with keywords and priorities |
| `projects/briefs/mole-content-authority/search-intent-map.md` | keyword lookup | 350+ mapped queries for secondary keyword selection |
| `context/learnings.md` | `## ops-blog-pipeline` | Apply previous feedback |

## Dependencies

| Skill | Required? | What it provides | Without it |
|-------|-----------|-----------------|------------|
| `mkt-authority-content` | Methodology | Content writing approach (BLUF, templates, GEO structure) — read its `references/` | Write using built-in approach |
| `viz-nano-banana` | Optional | Image generation via Gemini | Skip image — use placeholder or existing image |
| `tool-humanizer` | Required | Strips AI patterns from output | Output may read as AI-generated |
| `ops-cms-content` | Methodology | CMS schema knowledge, seed script patterns | Follow seed.ts conventions directly |
| Notion MCP | Required when pushing to Notion | Create the review page via `mcp__claude_ai_Notion__notion-create-pages` under the Got Moles project parent. Notion is the client review mechanism. | Save markdown archive locally only, flag it to the user |

## Skill Relationships

**Upstream:** `mkt-brand-voice` (voice-profile.md), `mkt-icp` (icp.md), `mkt-positioning` (positioning.md), `mkt-authority-content` (content writing methodology + references)
**Downstream:** `mkt-content-repurposing` (atomize published post into social), `str-ai-seo` (optional GEO overlay)
**Trigger boundary with `ops-cms-content`:** This skill handles blog post *creation* (the full pipeline from topic to live). `ops-cms-content` handles *lower-level CMS operations* — updating existing posts, city pages, page blocks, testimonials, globals. If the user says "add a blog post about X", use this skill. If they say "update the homepage hero block" or "add a city page", use `ops-cms-content`.

## Before You Start

Determine the mode:

**Single post:** User provides a topic. Run the full pipeline once.
**Batch mode:** User provides multiple topics (or says "run the next 3 from the content plan"). Run sequentially, reporting after each.
**Resume:** If a previous run was interrupted (e.g., image gen failed), pick up where it left off.

## Step 1: Gather Inputs

Determine what to write. The user provides some or all of:

- **Topic/title** (required)
- **Primary keyword** (optional — look up from content plan or search intent map)
- **Content type** (optional — infer: `guide` | `myth-bust` | `comparison` | `how-to` | `seasonal` | `local`)
- **Target word count** (optional — default 1500-2500)

If the user just says "next blog post", read the content plan and pick the next unwritten post from the highest-priority incomplete tier.

Report the plan before starting:
```
Blog: "Are Moles Blind? What Moles Can Actually See and Sense"
Keyword: are moles blind (M volume)
Type: guide
Steps: write → image → humanize → blog-data.ts → seed CMS → Notion → deploy
```

## Step 2: Load Context

Read in this order:
1. `context/learnings.md` → `## ops-blog-pipeline` section
2. `brand_context/mole-knowledge-base.md` — extract every relevant fact for the topic
3. `brand_context/voice-profile.md` — tone and rhythm
4. `brand_context/icp.md` — who the reader is
5. `brand_context/positioning.md` — brand angle (summary only)
6. Content plan + search intent map — get primary/secondary keywords

Also read `mkt-authority-content` references if needed:
- `references/content-type-templates.md` — structure template for the content type
- `references/geo-optimization.md` — GEO checklist

## Step 3: Write the Post

Follow the `mkt-authority-content` methodology:

**BLUF first.** The opening paragraph answers the searcher's question in 2-3 sentences with at least one specific fact. No throat-clearing.

**Knowledge base facts.** Every claim comes from `mole-knowledge-base.md`. Proprietary facts make the content uncopyable.

**GEO structure.** H2 headings that match real search queries. Comparison tables. Numbered lists. Clear definitions. FAQ section with 3-5 schema-ready Q&A pairs.

**Natural brand integration.** Got Moles appears as the knowledgeable authority, not a sales pitch.

**Content type template.** Match the structure from `references/content-type-templates.md`.

Save the draft to `projects/mkt-authority-content/{YYYY-MM-DD}_{slug}.md`.

Report: `✓ Post written — ~{word count} words, {N} sections, {N} FAQs`

## Step 4: Generate Featured Image

Use the `viz-nano-banana` script to generate a blog hero image.

**Check for GEMINI_API_KEY first.** If missing, skip this step and note: "No Gemini API key — skipping image generation. Post will use a placeholder."

**Image specs:**
- Size: 1200x800 (landscape, works for OG and hero)
- Brand colors in prompt: background `#184241` (grass), accents `#E68C04` (gold), light areas `#FFF1D9` (cream)
- Subject: match the blog topic — describe the scene visually

**Style decision — check existing blog images first.** Read the existing blog images in `site/public/images/blog-*.webp` to match the established visual style. The existing Got Moles blog uses photorealistic garden/lawn photography, NOT cartoon illustrations. Match what's already there. If the existing style is photo-realistic, prompt for "photorealistic photograph" not "warm illustrated style". Ask the user to confirm the style direction if unclear.

**Prompt patterns that work (from learnings):** specify background hex, say "no blue anywhere", "no borders, no boxes, no decorative lines", photography as backdrop with gradient overlay.

**Generation:**
```bash
source .env && export GEMINI_API_KEY && \
uv run .claude/skills/viz-nano-banana/scripts/generate_image.py \
  --prompt "CONSTRUCTED PROMPT" \
  --filename "projects/briefs/website-rebuild-rebrand/site/public/images/blog-{slug}.png" \
  --resolution 1K \
  --aspect-ratio 16:9
```

**Optimize immediately after generation — never commit raw PNGs:**
```python
from PIL import Image
img = Image.open("blog-{slug}.png")
if img.width > 1200:
    ratio = 1200 / img.width
    img = img.resize((1200, int(img.height * ratio)), Image.LANCZOS)
img.save("blog-{slug}.webp", "WEBP", quality=80)
```

Target: under 150KB per WebP. Delete the PNG after conversion. Only commit `.webp` files — PNGs are gitignored in the images folder.

**Update BOTH fallback maps** — the blog index page (`blog/page.tsx`) AND the detail page (`blog/[slug]/page.tsx`) each have their own `BLOG_FALLBACK_IMAGES` map. Add the new post to BOTH or images won't show on the listing.

Report: `✓ Image generated — blog-{slug}.webp ({size}KB)`

## Step 4b: Inject Internal Links

Before humanizer runs, inject 2-3 in-content internal links into the draft. This is the `str-internal-links` apply-fixes methodology applied at write-time so every new blog ships with link equity flowing to money pages on day one. Skipping this step creates the same "0 in-content links" backlog we had to retrofit on 19 existing blogs in April 2026.

**Link target priority (pick 2-3 per post):**

1. **Primary — most relevant service page.** Map the post topic to the service:
   - Ongoing / year-round / "moles keep coming back" / prevention → [Total Mole Control Program](/services/total-mole-control-program/)
   - Removal / cost / DIY vs pro / flat rate / one-time → [One-Time Mole Removal](/services/one-time-mole-removal/)
   - Commercial / HOA / property manager / sports fields / schools → [Commercial Mole Control](/services/commercial-mole-control/)

2. **Secondary — 1-2 related-cluster blog posts.** Use the `cluster` field to find siblings. Biology posts link to Biology posts (Mole vs Vole vs Gopher, What Do Moles Eat, Types of Moles in Washington, Are Moles Blind, How Long Do Moles Live, Are Moles Good for Your Yard). Mole Control posts link to Mole Control siblings (How to Get Rid of Moles, Best Mole Traps, Do Mole Repellents Work, Does Grub Control Stop Moles, Why Moles Keep Coming Back, How to Find Active Mole Tunnels, Humane Mole Removal).

3. **Tertiary — city page if the post mentions a specific Western WA city.** If the post references Sammamish, Bellevue, Seattle, Tacoma, etc., add a link like `[mole control in Sammamish](/mole-control-sammamish/)`.

**Syntax:** Use inline markdown `[anchor text](/path/)` in the `body` string of the relevant section. The `sectionsToLexical()` function in `src/scripts/seed.ts` parses these into Lexical link nodes at seed time (added 2026-04-20).

**Anchor text rules:**
- Keyword-rich. "See Year-Round Mole Protection" > "Learn More". "Mole Control in Bellevue" > "Bellevue".
- Natural in context. If the sentence reads worse with the link, find a better place.
- Per-post cap: 3 in-content links. More than that dilutes each one.

**Placement rules:**
- Put the link inside a sentence where the target is genuinely the most useful next step, not tacked-on.
- Don't link from the BLUF (it's a summary, not a navigation paragraph).
- Don't link from FAQs (keep them clean).
- Prefer the "What Actually Works" / "The Bottom Line" / closing sections — readers there are already primed for the next action.

Report: `✓ Injected {N} internal links — {count} service + {count} blog + {count} city`

## Step 5: Humanizer Pass

Run the post through `tool-humanizer` in deep mode (uses voice-profile.md).

Read the humanizer skill methodology. Apply it to the draft. Score before and after.

If the score delta is > 2 points, report the summary. Otherwise apply silently.

Report: `✓ Humanized — score {before} → {after}`

## Step 6: Add to blog-data.ts

Add the post to `projects/briefs/website-rebuild-rebrand/site/src/lib/blog-data.ts` as a new entry in the `blogPosts` array. (All `site/...` paths in this skill are relative to `projects/briefs/website-rebuild-rebrand/`.) Follow the exact `BlogPost` interface:

```typescript
{
  title: string,
  slug: string,
  excerpt: string,        // max 200 chars
  date: string,           // YYYY-MM-DD
  cluster: string,        // matches keywordCluster options
  image: string,          // /images/blog-{slug}.webp
  primaryKeyword: string,
  bluf: string,           // definitionBlock for GEO
  sections: { heading: string; body: string }[],
  faqs: { question: string; answer: string }[],
}
```

Update the `BLOG_FALLBACK_IMAGES` map in **BOTH** files:
1. `site/src/app/(frontend)/blog/page.tsx` (index page)
2. `site/src/app/(frontend)/blog/[slug]/page.tsx` (detail page)

Add: `'{slug}': '/images/blog-{slug}.webp',` to both maps. Missing either = no image on that view.

If a new `keywordCluster` value was added (e.g., "Biology"), also:
1. Add it to `site/src/collections/BlogPosts.ts` options
2. Add it to `site/src/scripts/seed.ts` `mapCluster()` function and return type
3. Regenerate and **commit** `site/src/payload-types.ts` — Vercel TypeScript check will fail without this

Report: `✓ Added to blog-data.ts — {N-1} → {N} total posts`

## Step 7: Test Build Locally

Run `npx next build` from the site directory before pushing. This catches TypeScript errors (payload-types.ts mismatches), missing imports, and schema issues before Vercel does.

```bash
cd projects/briefs/website-rebuild-rebrand/site && npx next build
```

If the build fails, fix the error before proceeding. Do not push broken code.

Report: `✓ Local build passes`

## Step 8: Seed to CMS

The seed script needs `.env.local` (or the client `.env`) with `PAYLOAD_SECRET` and `DATABASE_URI` already present in the site directory. If it's missing, stop and ask the user — do NOT pull it via the Vercel CLI (the CLI is banned for this project after the 2026-05-21 sitewide-404 incident).

Run the seed script to push the new post into Payload CMS:

```bash
cd projects/briefs/website-rebuild-rebrand/site && npx tsx -r dotenv/config src/scripts/seed.ts --all
```

The `-r dotenv/config` flag is required — bare `npx tsx` does not load `.env.local`. Without it, `PAYLOAD_SECRET` and `DATABASE_URI` are missing and the seed fails.

The seed script will skip existing posts and create the new one. Verify it reports the post as created.

If the seed fails (DB connection issue, schema mismatch), report the error and continue — the post is saved in blog-data.ts for manual seeding later.

Report: `✓ Seeded to CMS — "{title}" created`

## Step 9: Push to Notion

Create the review page with the Notion MCP (`mcp__claude_ai_Notion__notion-create-pages`) under the Got Moles Website Rebuild project page (parent page id: `32d3d42c4a9c8194a491f1de76439ecd`). Notion is the client review mechanism — Spencer and the team review there.

Page content:

```
# {title}

**Status:** Draft — ready for review
**Keyword:** {primaryKeyword}
**Words:** ~{wordCount}
**Humanizer score:** {score}/10

{excerpt}

---

{sections as markdown}

## FAQs

{faqs as markdown}
```

If the Notion push fails (integration not shared with the parent page, rate limit), capture the error and report: "Notion push failed: {reason}. Markdown archive at {path} — review locally until resolved."

Report: `✓ Pushed to Notion for Spencer's review — {page URL}`

## Step 9b: Commit (No Deploy)

Commit the changed site files to this repo so the work is backed up:

```bash
git add projects/briefs/website-rebuild-rebrand/site/src/lib/blog-data.ts \
       projects/briefs/website-rebuild-rebrand/site/public/images/blog-{slug}.webp \
       "projects/briefs/website-rebuild-rebrand/site/src/app/(frontend)/blog/page.tsx" \
       "projects/briefs/website-rebuild-rebrand/site/src/app/(frontend)/blog/[slug]/page.tsx" \
       projects/briefs/website-rebuild-rebrand/site/src/payload-types.ts
git commit -m "feat(got-moles): add blog {slug}"
git push origin main
```

**Do NOT deploy.** The live site deploys from the ORIGINAL `freeflyroy/agent-os` repo — this repo has no Vercel wiring (rewire pending; see the client AGENTS.md "Website Deploy" section). Tell the user plainly: the post is seeded to the CMS and staged in this repo, but the live blog listing won't show it until the site is shipped through the deploy repo.

Report: `✓ Committed + backed up — NOT deployed (deploy repo rewire pending)`

## Step 10: Summary & Next Steps

Show the full pipeline status:

```
Blog Pipeline Complete ✓

Post:    "{title}"
Keyword: {primary keyword} ({volume})
Words:   ~{count}
Image:   blog-{slug}.webp
Score:   {humanizer score}/10

Pipeline:
  ✓ Written (knowledge base + {content type} template)
  ✓ Image generated (Gemini, color style)
  ✓ Humanized ({before} → {after})
  ✓ Added to blog-data.ts ({N} total posts)
  ✓ Seeded to CMS
  ✓ Notion page created
  ✓ Deployed to Vercel

Files:
  Content:  projects/mkt-authority-content/{date}_{slug}.md
  Image:    site/public/images/blog-{slug}.webp
  CMS data: site/src/lib/blog-data.ts

Next: Want to atomize this into social posts? Or write the next one from the plan?
```

## Step 11: Collect Feedback

Ask: "How did this land?"

Log feedback to `context/learnings.md` under `## ops-blog-pipeline` with date and context.

If the user flags an issue, update `## Rules` in this SKILL.md immediately.

## Batch Mode

When the user provides multiple topics or says "run the next N from the content plan":

1. List all posts to be created with keywords and types
2. Confirm the batch before starting
3. Run Steps 3-9b for each post sequentially
4. Report a batch summary at the end
5. Do a single commit + push after all posts are added (not one per post)

## Rules

- 2026-04-07: US English spelling for all Got Moles content
- 2026-04-07: Never claim "WA's #1" — unsubstantiated
- 2026-04-07: Never mention Initiative 713 compliance
- 2026-04-07: "15+ years" = Spencer's personal experience, not company age (founded 2017)
- 2026-04-07: "219+ five-star Google reviews" — exact phrasing
- 2026-04-07: "Nearly 5,000 clients" — confirmed safe to publish
- 2026-04-07: Chemical-free positioning in every post
- 2026-04-07: Content is educational first — if it reads like a sales page, rewrite it
- 2026-04-07: Always git pull before push — work happens across two workstations
- 2026-07-02: NO deploys from this repo. The live site deploys from the ORIGINAL freeflyroy/agent-os repo (Vercel rewire pending — see client AGENTS.md "Website Deploy"). Never use the Vercel CLI. End the pipeline at seeded + Notion review + commit.
- 2026-07-02: Notion pushes go through the Notion MCP (`mcp__claude_ai_Notion__notion-create-pages`) — the old direct-API-with-.mcp.json-token flow is dead in this install.
- 2026-04-07: blog-data.ts is the seed source → seed.ts pushes to CMS. Never write directly to CMS API.
- 2026-04-07: Image prompt patterns: specify background hex (#184241), say "no blue anywhere", "no borders, no boxes, no decorative lines"
- 2026-04-07: NEVER commit raw PNGs. Always convert to WebP (quality 80, max 1200px wide, target <150KB). PNGs are gitignored.
- 2026-04-07: BOTH fallback maps must be updated — blog/page.tsx (index) AND blog/[slug]/page.tsx (detail). Missing either = no images on that view.
- 2026-04-07: Match existing blog image style. Existing Got Moles blogs use photorealistic lawn/garden photography. Illustrated cartoon moles don't match. Check existing images before generating. Spencer to review and approve image style for new posts.
- 2026-04-07: payload-types.ts must be committed when collection schemas change. Vercel TypeScript check will fail otherwise.
- 2026-04-07: Seed command must use `npx tsx -r dotenv/config src/scripts/seed.ts --all` — bare `npx tsx` does not load .env.local. Without the preload flag, PAYLOAD_SECRET and DATABASE_URI are missing.
- 2026-04-20: Every new blog must inject 2-3 in-content internal links BEFORE the humanizer pass. See Step 4b. Primary link to the most relevant service page; secondary links to 1-2 cluster-sibling blogs; tertiary to a city page if a specific city is mentioned. Markdown `[text](url)` syntax — the seed.ts `sectionsToLexical()` parses these into Lexical link nodes as of 2026-04-20. Skipping this recreates the 19-blog retrofit backlog.
- 2026-04-20: To refresh body content on existing blog posts, use `npx tsx -r dotenv/config src/scripts/seed.ts --reseed-blogs <all|slug1,slug2>`. The `--reseed-blogs` flag deletes matching blog-posts rows and recreates them from blog-data.ts, leaving authors/services/testimonials/cities/pages untouched.

## Self-Update

If the user flags an issue with the output — wrong approach, bad format, missing step, incorrect tone — update the `## Rules` section in this SKILL.md immediately with the correction. Don't just log it to learnings; fix the skill so it doesn't repeat the mistake. Date every new rule.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| No GEMINI_API_KEY | Skip image generation, continue pipeline. Post uses placeholder. |
| Seed script fails | Check DB connection string in .env. Verify collection schema matches. Post is saved in blog-data.ts for retry. |
| Notion MCP push fails (permission) | The Got Moles Website Rebuild page isn't shared with the Notion connection. Ask Roy to share it via Notion Settings → Connections. |
| Notion MCP rate limited | Wait 60 seconds and retry. If persistent, split the page into smaller content chunks. |
| Git push rejected | Run `git pull origin main` first, then push. Work happens across two workstations. |
| Humanizer not improving score | Post may already be well-written. If score > 8, skip humanizer changes. |
| Blog-data.ts TypeScript error | Verify the BlogPost interface — check for missing required fields or wrong types. |
| Image too dark/wrong colors | Update prompt to explicitly state "light background", remove dark gradients. Log to Rules. |
