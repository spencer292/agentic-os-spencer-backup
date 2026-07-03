# Got Moles Blog — How It Works

Last updated: 2026-04-07

---

## Architecture

```
Supabase (PostgreSQL)     ← The database. All content lives here.
       ↑
Payload CMS (API layer)   ← Reads/writes Supabase. Provides admin UI + REST API.
       ↑                     Collections: BlogPosts, Pages, CityPages, Media, etc.
       |
  Two ways in:
       |
  ┌────┴────┐
  |         |
seed.ts   Payload Admin UI
  |         (manual editing at /admin)
  |
  reads from:
  |
blog-data.ts              ← Source of truth for seed data. All blog content lives here.
                             Title, slug, excerpt, BLUF, sections, FAQs, keywords.
```

**The site reads from Payload CMS, not from blog-data.ts directly.**

```
Next.js pages             ← Server-side rendered at build time (SSG)
       |
  calls:
       |
payload.ts functions      ← getBlogPostBySlug(), getAllBlogPosts()
       |                     Filters: status = 'published'
  queries:
       |
Payload CMS → Supabase    ← Returns blog post data as JSON
```

---

## Where Things Live

| Thing | Location | Purpose |
|-------|----------|---------|
| Blog content (seed source) | `site/src/lib/blog-data.ts` | TypeScript array of all blog posts. Seed script reads this. |
| Blog CMS collection | `site/src/collections/BlogPosts.ts` | Defines the schema: fields, types, select options |
| Blog seed logic | `site/src/scripts/seed.ts` | Reads blog-data.ts, converts sections to Lexical JSON, pushes to Payload |
| Blog data queries | `site/src/lib/payload.ts` | `getAllBlogPosts()` and `getBlogPostBySlug()` — what the site calls |
| Blog index page | `site/src/app/(frontend)/blog/page.tsx` | Lists all published posts with images |
| Blog detail page | `site/src/app/(frontend)/blog/[slug]/page.tsx` | Single post view with rich text, FAQs, related posts |
| Generated TypeScript types | `site/src/payload-types.ts` | Auto-generated from collection schemas. Must match. |
| Blog images (current) | `site/public/images/blog-*.webp` | Static fallback images. Both pages have hardcoded fallback maps. |
| Blog images (proper) | Payload Media collection → Vercel Blob | Where images SHOULD go. `featuredImage` field on BlogPosts. |
| Knowledge base | `brand_context/mole-knowledge-base.md` | Fact source for all content. 11 sections from field guide. |
| Content plan | `projects/briefs/mole-content-authority/content-plan.md` | 33 planned posts with keywords, priorities, clusters |
| Search intent map | `projects/briefs/mole-content-authority/search-intent-map.md` | 350+ mapped search queries |
| Notion review | Under "Got Moles Website Rebuild" page | Spencer reviews blog drafts here |

---

## The Blog Pipeline — Step by Step

This is what must happen every time a blog post is created. The `ops-blog-pipeline` skill follows this process.

### Step 1: Write the Content

- **Input:** Topic + primary keyword (from content plan or user request)
- **Source:** `brand_context/mole-knowledge-base.md` for facts
- **Method:** BLUF format, GEO-structured, content type template (guide/myth-bust/comparison/how-to/seasonal/local)
- **Voice:** `brand_context/voice-profile.md`
- **Output:** Markdown draft saved to `projects/mkt-authority-content/{date}_{slug}.md`

### Step 2: Humanizer Pass

- Run draft through `tool-humanizer` in deep mode
- Target score: 8+/10
- Fixes AI patterns: contractions, varied rhythm, removed hedging

### Step 3: Generate Featured Image

- Generate via `viz-nano-banana` (Gemini API)
- **IMPORTANT: Match existing blog image style** — currently photorealistic gardens, NOT cartoon illustrations
- Output: PNG from Gemini
- **Immediately convert to WebP:**
  ```python
  from PIL import Image
  img = Image.open("blog-{slug}.png")
  if img.width > 1200:
      ratio = 1200 / img.width
      img = img.resize((1200, int(img.height * ratio)), Image.LANCZOS)
  img.save("blog-{slug}.webp", "WEBP", quality=80)
  ```
- Target: under 150KB per WebP
- Delete the PNG. Never commit PNGs.
- Save WebP to: `site/public/images/blog-{slug}.webp`

### Step 4: Add to blog-data.ts

Add a new entry to the `blogPosts` array in `site/src/lib/blog-data.ts`. Must match the `BlogPost` interface exactly:

```typescript
{
  title: string,          // Post title
  slug: string,           // URL slug (e.g., 'are-moles-blind')
  excerpt: string,        // Max 200 chars, used in cards + meta
  date: string,           // 'YYYY-MM-DD'
  cluster: string,        // Matches keywordCluster select options
  image: string,          // '/images/blog-{slug}.webp'
  primaryKeyword: string, // Main search query this targets
  bluf: string,           // BLUF paragraph — becomes definitionBlock in CMS (GEO)
  sections: { heading: string; body: string }[],
  faqs: { question: string; answer: string }[],
}
```

**If you add a new cluster value** (e.g., "Biology"), you must also:
1. Add it to `BlogPosts.ts` collection `keywordCluster` options
2. Add it to `seed.ts` `mapCluster()` function
3. Regenerate and **commit** `payload-types.ts`

### Step 5: Update BOTH Fallback Image Maps

Two separate files have hardcoded fallback image maps. Update **BOTH**:

1. **Blog index page:** `site/src/app/(frontend)/blog/page.tsx` → `BLOG_FALLBACK_IMAGES`
2. **Blog detail page:** `site/src/app/(frontend)/blog/[slug]/page.tsx` → `BLOG_FALLBACK_IMAGES`

Add: `'{slug}': '/images/blog-{slug}.webp',`

Missing either = no image on that view.

### Step 6: Test Build Locally

```bash
cd site && npx next build
```

This catches:
- TypeScript errors (payload-types.ts mismatches)
- Missing imports
- Schema validation issues

**Do not push until this passes.**

### Step 7: Seed to CMS

```bash
cd site && npx tsx src/scripts/seed.ts --all
```

This requires `.env.local` with `PAYLOAD_SECRET` and `DATABASE_URI`. Pull from Vercel if missing:
```bash
npx vercel env pull .env.local
```

The seed script:
- Reads `blog-data.ts`
- Converts sections to Lexical JSON (Payload's rich text format)
- Creates blog-posts documents in Supabase via Payload API
- Skips posts that already exist (checks by slug)
- Sets status to 'published'

### Step 8: Push to Notion

Create a page under Got Moles Website Rebuild (ID: `32d3d42c4a9c8194a491f1de76439ecd`) with:
- Title, status, keyword, word count
- Condensed content for Spencer's review
- "Draft — ready for review" status

### Step 9: Commit and Deploy

```bash
git add site/src/lib/blog-data.ts \
       site/public/images/blog-{slug}.webp \
       site/src/app/\(frontend\)/blog/page.tsx \
       site/src/app/\(frontend\)/blog/\[slug\]/page.tsx \
       site/src/payload-types.ts  # if schema changed
git pull mine main  # always pull first
git commit -m "Add blog: {title}"
git push mine main
```

Vercel auto-deploys from `mine` remote. The build:
1. Installs dependencies
2. Runs `next build`
3. Queries Payload CMS (Supabase) for all published blog posts
4. Pre-renders static HTML for each post
5. Deploys to Vercel CDN

---

## What Happens When You Edit a Post

**Option A: Edit in Payload Admin UI** (`/admin` → Blog Posts)
- Changes go directly to Supabase
- Site rebuilds on next deploy (or with ISR if configured)
- Does NOT update blog-data.ts — the seed source diverges

**Option B: Edit blog-data.ts and re-seed**
- Update the entry in blog-data.ts
- Re-seed: `npx tsx src/scripts/seed.ts --all`
- Seed script skips existing posts by default. To update, either:
  - Delete the post in Payload admin first, then re-seed
  - Or use the Payload API directly to update

**Recommendation:** For content edits (typos, updated facts), use Payload admin. For structural changes (new sections, new FAQs, keyword changes), update blog-data.ts and re-seed. blog-data.ts should stay the source of truth.

---

## Image Pipeline (Current vs Proper)

### Current (workaround)
- Images in `site/public/images/blog-*.webp` (static files in git)
- Two hardcoded fallback maps in blog pages
- If CMS `featuredImage` field is empty, falls back to static file

### Proper (to migrate to)
- Generate image → upload to Payload Media collection → stored in Vercel Blob
- Link Media record to blog post `featuredImage` field
- No static files, no fallback maps needed
- CMS is the single source for images

---

## Checklist for Every New Blog Post

- [ ] Content written from knowledge base, BLUF format, GEO-structured
- [ ] Humanizer pass run (target 8+/10)
- [ ] Image generated matching existing visual style
- [ ] Image converted to WebP (<150KB), PNG deleted
- [ ] Added to `blog-data.ts` with all required fields
- [ ] BOTH fallback image maps updated (index + detail pages)
- [ ] Schema changes committed if new cluster/field added (payload-types.ts)
- [ ] Local build passes (`npx next build`)
- [ ] Seeded to CMS (`npx tsx src/scripts/seed.ts --all`)
- [ ] Pushed to Notion for Spencer's review
- [ ] `git pull mine main` before push
- [ ] Committed and pushed to `mine`
- [ ] Vercel deploy confirmed green
