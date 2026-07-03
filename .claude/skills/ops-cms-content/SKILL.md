---
name: ops-cms-content
description: >
  Manage Payload CMS content for the Got Moles website. Add city pages
  (bulk or individual), update existing blog posts, update page blocks,
  seed testimonials, and run bulk content operations. Triggers on: "add
  a city page", "new city page", "bulk city pages", "update a blog post",
  "reseed blogs", "update page content", "seed CMS", "CMS content",
  "add testimonial", "update blocks", "content operation", "populate
  CMS", "add content to CMS", "manage CMS". Does NOT trigger for
  creating new blog posts from scratch (use ops-blog-pipeline — it
  handles the full pipeline: write, image, humanize, seed, review).
  Does NOT trigger for design system work (use viz-design-system),
  page architecture (use viz-page-architect), or copywriting (use
  mkt-copywriting). Does NOT write code — it writes data files and
  seed scripts.
---

# CMS Content Manager

Manage content in Payload CMS through data files and seed scripts. Every operation follows the same pattern: validate the data shape against the collection schema, check for duplicates, generate the TypeScript data/seed code, and run it against the database. Never overwrites existing content without explicit confirmation.

## Outcome

New or updated CMS content in the Payload database, created via TypeScript seed scripts that follow the established `seed.ts` pattern. Scripts are saved to `site/src/scripts/` within the project. Data files are saved to `site/src/lib/` when reusable across operations.

## Context Needs

| File | Load level | How it shapes this skill |
|------|-----------|--------------------------|
| `brand_context/voice-profile.md` | tone only | Match tone when generating city page intros, blog excerpts, FAQ answers |
| `brand_context/positioning.md` | summary | Ensure messaging aligns with positioning (chemical-free, safe, guaranteed) |
| `brand_context/icp.md` | summary | Write in homeowner language, match awareness level |
| `context/learnings.md` | `## ops-cms-content` section | Apply previous corrections |

Load if they exist. Proceed without them — this skill works standalone with the Got Moles house style.

## Dependencies

| Skill | Required? | What it provides | Without it |
|-------|-----------|-----------------|------------|
| `mkt-copywriting` | Optional | Polished copy for blog posts and page blocks | Write serviceable copy inline, flag for copywriting review |
| `str-ai-seo` | Optional | GEO-optimized definition blocks, keyword targets | Use basic SEO best practices |
| `tool-humanizer` | Required for generated copy | Natural language pass on any content this skill WRITES (city intros, FAQ answers, excerpts) — run before seeding, deep mode if voice-profile.md exists | Standard mode without voice profile; only skip for pure data ops (testimonials from real reviews, nav/globals) |

## Skill Relationships

- **Upstream:** `mkt-copywriting` (provides polished copy), `str-ai-seo` (provides keyword targets), `viz-page-architect` (provides page blueprints defining which blocks to populate)
- **Downstream:** Content populated by this skill is consumed by the Next.js frontend via `src/lib/payload.ts` fetch functions. City page data in `city-data.ts` feeds the `[citySlug]` route, sitemap, and service areas page.
- **No trigger conflicts** — this skill handles CMS data operations, not content creation strategy or page design

## Before You Start

Determine the operation type:

| Operation | What it does |
|-----------|-------------|
| **Add city pages** | Create city-pages documents with localized content, FAQs, and SEO |
| **Add blog posts** | Create blog-posts documents with Lexical richText body, FAQs, SEO |
| **Update page blocks** | Modify the block-based layout of an existing Pages document |
| **Add testimonials** | Create testimonial documents from Google review data |
| **Seed data** | Run or extend existing seed scripts for bulk operations |
| **Update globals** | Modify site-settings, header, or footer navigation |

## Step 1: Load Context

Read brand context per the table above. Read `context/learnings.md` section `## ops-cms-content`.

Confirm the site project path: `projects/briefs/website-rebuild-rebrand/site/`.

## Step 2: Validate Schema

Before writing any data, read the relevant collection definition from `site/src/collections/` to confirm field names, types, required fields, and select option values.

**Collection quick reference** (always verify against source):

| Collection | Slug | Key required fields |
|-----------|------|-------------------|
| Pages | `pages` | title, slug, layout (blocks array), status |
| BlogPosts | `blog-posts` | title, slug, publishDate, author (relation), status, excerpt, body (Lexical), seo |
| CityPages | `city-pages` | cityName, slug (unique), county (select), headline, introText, seo |
| Services | `services` | name, slug (unique), serviceType (select), summary |
| Testimonials | `testimonials` | name, quote |
| Authors | `authors` | name |
| Media | `media` | alt (text), file (upload) |

**Globals:** `site-settings`, `header`, `footer` — updated via `payload.updateGlobal()`.

## Step 3: Check for Duplicates

Before creating any document, query by slug (or name for testimonials/authors). Report what already exists:

- "Found 33 existing city pages. 5 new cities to add."
- "Blog post 'mole-removal-cost' already exists. Update or skip?"

**Never overwrite existing content without asking.** For updates, show what will change.

## Step 4: Prepare Content Data

### City pages (bulk or individual)

**FOOTGUN — read first:** the live `/mole-control-{slug}` city pages render from `site/src/lib/city-data.ts` directly, NOT from the CMS. Editing or seeding `city-pages` CMS records changes nothing on the rendered site. ALL city-page content work goes into `city-data.ts`; treat the CityPages collection as vestigial unless the frontend is rewired to read from it.

Each city page needs: `cityName`, `slug`, `county` (king|pierce|thurston|snohomish|kitsap), `priority`, `headline`, `introText` (2-3 sentences with local references), `localDetails`, `faqs` (3-5 Q&As), `seo.metaTitle` (max 60 chars), `seo.metaDescription` (max 160 chars), `seo.primaryKeyword`.

Add entries to `site/src/lib/city-data.ts` following the `CityData` interface.

### Blog posts

Each post needs: `title`, `slug`, `publishDate`, `author` (relation ID — look up first), `excerpt` (max 200 chars), `definitionBlock` (GEO-extractable), `body` (Lexical JSON via `sectionsToLexical()`), `faqs`, `keywordCluster`, `seo`.

### Page blocks

Read the target page's current layout. Each block has a `blockType` matching one of 13 slugs: `hero`, `richContent`, `cta`, `faq`, `featureGrid`, `imageText`, `trustBar`, `testimonial`, `stats`, `geoDefinition`, `painPoints`, `stepsProcess`, `serviceArea`. Read the block definition from `site/src/blocks/` to confirm fields.

### Testimonials

Each needs: `name`, `city`, `quote`, `rating` (1-5), `serviceType` (tmcp|one-time|commercial), `concern`, `gbpLocation`, `featured` (boolean), `status`, `sortOrder`.

## Step 5: Generate Seed Script

**Small operations (1-5 items):** Standalone script in `site/src/scripts/seed-{operation}.ts`.

**Bulk operations (6+ items):** Data file in `site/src/lib/` + seed script that iterates.

**Key pattern:**
```typescript
const payload = await getPayload({ config })
const existing = await payload.find({
  collection: 'collection-slug',
  where: { slug: { equals: itemSlug } },
  limit: 1,
})
if (existing.docs.length > 0) {
  console.log('Already exists, skipping.')
  continue
}
await payload.create({ collection: 'collection-slug', data: { ... } })
```

## Step 5b: Humanizer Gate

Any content this skill *wrote* (city intros, localDetails, FAQ answers, excerpts) goes through `tool-humanizer` before seeding — deep mode if `brand_context/voice-profile.md` exists, standard otherwise. Skip only for pure data operations that carry no generated prose (testimonials quoting real reviews, nav/global updates).

## Step 6: Run

Execute from the site directory (`projects/briefs/website-rebuild-rebrand/site/`): `npx tsx -r dotenv/config src/scripts/seed-{operation}.ts`

Monitor for validation errors. Fix and retry.

## Step 7: Verify

- Query collection to count documents
- Spot-check 1-2 documents by slug
- For city pages: confirm `/mole-control-{slug}` resolves
- For blog posts: confirm Lexical body renders

Report: "Created N documents. 0 errors."

## Step 8: Collect Feedback

Ask: "Content looks good? Any city details to adjust, FAQs to revise, or copy to tighten?"

Log feedback to `context/learnings.md` under `## ops-cms-content` with today's date. Include what was created, what worked, and what the user wanted changed. This makes the next bulk operation sharper.

---

## Rules

- **Never delete CMS content without explicit confirmation.**
- **Always query by slug before creating.** Never blindly `create()`.
- **County values must be lowercase select keys:** king, pierce, thurston, snohomish, kitsap.
- **Blog post body must be Lexical JSON**, not plain text. Use `sectionsToLexical()`.
- **Author relationship requires document ID**, not string name.
- **US English spelling in all content.**
- **Run scripts from the site directory** for Payload config resolution, with `-r dotenv/config` so env vars load.
- 2026-07-02: **City pages render from `city-data.ts`, NOT the CMS.** Never "update" a city page by seeding the CityPages collection — it does nothing visible. Edit `site/src/lib/city-data.ts`.
- 2026-07-02: Generated prose (intros, FAQs, excerpts) passes the humanizer gate (Step 5b) before seeding.

---

## Self-Update

If the user flags an issue — wrong field name, broken seed, missing validation, bad content — update the `## Rules` section immediately with the correction and today's date. Don't just log it to learnings; fix the skill so it doesn't repeat the mistake.

## Troubleshooting

- **"PAYLOAD_SECRET required" error:** The script needs `.env.local` in the site directory with `PAYLOAD_SECRET` and `DATABASE_URI`. Check the file exists.
- **Duplicate slug error:** The `find()` check should catch this. If it doesn't, the collection has a `unique: true` constraint on slug that will throw. Read the error and skip.
- **Lexical body renders blank:** The root node structure must match exactly. Compare against `sectionsToLexical()` output in the existing seed.ts.
- **Author ID not found:** Run the authors seed first, or look up the existing author by name before creating blog posts.
- **Block type not recognized:** Block slugs are camelCase in data (e.g., `richContent`, `featureGrid`) but Block definitions use PascalCase exports. Use the `slug` field value from the Block definition, not the export name.
