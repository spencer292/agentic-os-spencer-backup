# Page Build Reference — Got Moles Website

Read this file before building, updating, or seeding any page. Follow every step in order. Do not skip steps.

---

## Quick Reference

```
BUILD:     npx next build                    (from site/ directory)
SEED ALL:  npm run seed:all                  (pages + blog + cities + testimonials)
RESEED:    npm run seed -- --reseed {slug}   (delete + recreate one page)
MEDIA:     npm run seed:media                (upload images + link to CMS blocks)
PUSH:      git push mine main                (triggers Vercel staging deploy)
STAGING:   project-pf8c6.vercel.app          (verify here, never localhost)
```

---

## Architecture: How Pages Actually Work

### The Two-Layer System

Every page has TWO data sources. Understanding this prevents most bugs.

1. **CMS layer** (Supabase via Payload) — the page stored in the Pages collection
2. **Code layer** (pages-data.ts) — the hardcoded fallback block data

**The page route decides which to use:**

```typescript
const page = await getCmsPageContent(SLUG)
const blocks = page
  ? ((page.layout as unknown[]) || [])    // CMS wins if page exists
  : fallbackBlocks                         // Code fallback if CMS is empty
```

**Critical rule:** Once a page is seeded to CMS, the CMS version is what renders. Changes to `pages-data.ts` alone will NOT appear on staging. You must either:
- Re-seed the page: `npm run seed -- --reseed {slug}`
- OR delete the CMS page so the fallback kicks in

### Source-of-truth per route — what reads from where

| Route | Source of truth | CMS collection used? |
|-------|-----------------|---------------------|
| `/` (home), `/services/*`, `/how-it-works`, `/about`, `/faq`, `/contact`, `/reviews` | Payload CMS `pages` collection (with `pages-data.ts` as fallback if CMS empty) | ✅ `pages` |
| `/blog/{slug}/` | Payload CMS `blog-posts` collection | ✅ `blog-posts` |
| `/{legacy-root-slug}/` (e.g. `/do-moles-bite/`) | Payload CMS `blog-posts` collection (where `urlPattern: 'legacy-root'`) | ✅ `blog-posts` |
| `/mole-control-{citySlug}/` | **`src/lib/city-data.ts` directly — NOT CMS** | ❌ none |
| `/service-areas/` | `src/app/(frontend)/service-areas/page.tsx` (hardcoded JSX) | ❌ none |

**⚠ FOOTGUN: `city-pages` Payload collection is UNUSED for rendering.** It exists in `src/collections/CityPages.ts` and has 92+ records seeded, but the public route `[citySlug]/page.tsx` reads from `cityData` in `src/lib/city-data.ts` directly (line 4 + 50). Editing the `city-pages` CMS records via Payload admin or any patch script does **NOTHING** to the live site. To change a city page's content, edit `src/lib/city-data.ts` and push — the static page rebuilds from source. The `city-pages` collection should either be wired into the render path or deleted to remove the footgun.

### Block Types (16 total)

| Block | Slug | Key Fields | Image? |
|-------|------|-----------|--------|
| Hero | `hero` | heading, subheading, backgroundImage (upload), fallbackImage (text), cta, trustStrip, heroHeight | Yes — upload + fallbackImage |
| Image + Text | `imageText` | heading, content (richText), image (upload), fallbackImage (text), imageAlt, imagePosition, background | Yes — upload + fallbackImage |
| Rich Content | `richContent` | heading, content (richText), showDivider, background | No |
| CTA | `cta` | heading, body, buttonText, buttonUrl, showForm, background | No |
| FAQ | `faq` | heading, items (question + answer), generateSchema, background | No |
| Feature Grid | `featureGrid` | heading, items (title, description, icon), columns, background | Icon upload only |
| Testimonial | `testimonial` | heading, quotes (text, name, city, rating), background | No |
| Stats | `stats` | heading, items (number, label, description), background | No |
| Trust Bar | `trustBar` | metrics (number, label), background | No |
| Pain Points | `painPoints` | heading, body, points, background | No |
| Steps/Process | `stepsProcess` | heading, steps (number, title, description), cta, background | No |
| Service Area | `serviceArea` | heading, cities (name, url), countyText, background | No |
| GEO Definition | `geoDefinition` | content (textarea) — AI-extractable entity text | No |
| Team Cards | `teamCards` | heading, members (name, role, bio, photoKey), background | photoKey (text) |
| Table | `table` | rows (cells[]), hasHeader, caption, background | No |
| TLDR | `tldr` | content (textarea) — renders with id="blog-definition-block" for speakable schema | No |

### Background Options (all blocks that have them)

- `cream` — light background (dark text)
- `grass` — #184241 dark green (light text)
- `grass-alt` — slightly lighter variant (light text)
- `blue` — #182034 dark blue (light text)
- `gradient` — CTA gradient

---

## Image Pipeline

### Current State: No Payload Media Storage

Vercel Blob storage is configured but `BLOB_READ_WRITE_TOKEN` is NOT in the local `.env`. This means:
- `seed-media.ts` uploads go to local disk, not Vercel Blob
- Those local files don't exist on Vercel's deployed instance
- **ALL images must use the fallbackImage pattern or static paths**

### The fallbackImage Pattern

Blocks with images (Hero, ImageText) have TWO image fields:

| Field | Payload Type | Purpose |
|-------|-------------|---------|
| `image` / `backgroundImage` | `upload` (media relation) | CMS media — works when Blob storage is configured |
| `fallbackImage` | `text` | Static filename in `/public/images/` — always works |

**Component rendering priority:**

```
1. CMS upload object (block.image is object with .url)  → use .url
2. String path (block.image is string like "/images/x.webp") → use directly
3. fallbackImage field → resolve to /images/{fallbackImage}
4. null → empty placeholder div (broken state — avoid this)
```

### Rules for Images

1. **Every imageText and hero block MUST have a `fallbackImage` field** in pages-data.ts
2. The `image` string path in pages-data.ts works for the code fallback layer
3. The `fallbackImage` text field passes through to CMS on seed (it's a plain text field, not an upload)
4. When seeding, strip `image` from imageText blocks (upload fields can't take strings): `{ ...b, image: undefined }`
5. Do NOT strip `fallbackImage` — it's a text field that Payload accepts
6. Static images go in `site/public/images/` with descriptive filenames

### Naming Convention

```
hero-{descriptor}.webp          — Hero backgrounds (hero-lawn, hero-team-line)
blog-{slug-keyword}.webp        — Blog featured images
case-study-{descriptor}.webp    — Case study images
team-{name}.webp                — Team member photos
spencer-{action}.webp           — Spencer action shots
{descriptor}.webp               — General images (inspection, results, mole-damage)
```

### seed-media.ts (When Media IS Set Up)

Run after `seed.ts`. Four steps:

1. Upload all WebPs from `public/images/` to Media collection
2. Link hero `backgroundImage` on 6 pages
3. Link `featuredImage` on 7 blog posts
4. Link imageText block `image` on pages with imageText blocks

The linking maps are defined in the script:
- `PAGE_HERO_IMAGES` — slug → hero image filename
- `BLOG_FEATURED_IMAGES` — slug → featured image filename
- `PAGE_IMAGETEXT_IMAGES` — slug → ordered array of imageText image filenames

To add a new page with imageText images, add an entry to `PAGE_IMAGETEXT_IMAGES`.

---

## Lexical JSON (richText Content)

Payload uses Lexical editor for richText. All richText content in pages-data.ts must be valid Lexical JSON.

### Builders (defined in pages-data.ts)

```typescript
makeParagraph(text)              // Single paragraph
makeHeading(text, 'h2'|'h3')    // Heading node (default h2)
makeLexical(...nodes)            // Wrap nodes in Lexical root

// Usage:
content: makeLexical(
  makeHeading('Section Title', 'h3'),
  makeParagraph('First paragraph of body text.'),
  makeParagraph('Second paragraph.'),
)
```

### Bold/Italic Text

The `makeParagraph` helper creates plain text. For bold or italic, you need format flags on text nodes:

```typescript
// format: 0 = normal, 1 = bold, 2 = italic, 3 = bold+italic
{ type: 'text', text: 'bold text', format: 1, ... }
```

### Common Mistake

Do NOT pass HTML strings to makeParagraph. It takes plain text. Do NOT nest makeLexical calls.

---

## Page Route Pattern

Every page follows this pattern. Copy from an existing page when creating new ones.

```typescript
// src/app/(frontend)/{path}/page.tsx
import { getCmsPageContent, buildMetadata } from '@/lib/cms-page'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { JsonLd, breadcrumbSchema, faqSchema } from '@/lib/schema'
import { myPageBlocks, myPageMeta } from '@/lib/pages-data'

const SLUG = 'my-page-slug'           // Must match CMS slug exactly
const FALLBACK = myPageMeta            // { title, description } for metadata

export async function generateMetadata() {
  const page = await getCmsPageContent(SLUG)
  return buildMetadata(page, FALLBACK)  // Handles og:image automatically
}

export default async function MyPage() {
  const page = await getCmsPageContent(SLUG)
  const blocks = page
    ? ((page.layout as unknown[]) || [])
    : myPageBlocks

  if (!page && myPageBlocks.length === 0) notFound()

  return (
    <>
      <JsonLd data={breadcrumbSchema([
        { name: 'My Page', url: '/my-page/' },
      ])} />
      {/* Add faqSchema if page has FAQ block — generateSchema must be false on the block itself */}
      <RenderBlocks blocks={blocks} />
    </>
  )
}
```

### og:image (buildMetadata)

buildMetadata always includes `openGraph.images`. Priority:
1. Per-page CMS `meta.ogImage` upload
2. Fallback: `/images/og-default.webp` (1200x630)

Do NOT override openGraph in child page metadata without including images — Next.js replaces the entire openGraph object, it doesn't merge.

---

## Schema (JSON-LD)

### Available Schema Builders (src/lib/schema.tsx)

| Builder | Returns | Use On |
|---------|---------|--------|
| `organizationSchema()` | Organization | Sitewide (layout) |
| `localBusinessSchema()` | LocalBusiness + AggregateRating | Homepage |
| `breadcrumbSchema(items)` | BreadcrumbList | Every page |
| `serviceSchema(service)` | Service + Offer | Service pages |
| `faqSchema(items)` | FAQPage | Any page with FAQ block |
| `articleSchema(post)` | Article | Blog posts, case studies |
| `reviewsSchema(reviews)` | LocalBusiness + Review[] | Reviews page |
| `personSchema()` | Person (Spencer) | About page |
| `teamSchema()` | Person[] graph | About page |
| `howToSchema(steps)` | HowTo | How It Works |
| `cityLocalBusinessSchema(city)` | LocalBusiness + geo | City pages |

### articleSchema — Non-Blog Pages

For pages that aren't blog posts but need Article schema (e.g., case studies):

```typescript
articleSchema({
  title: 'Page Title',
  slug: 'page-slug',
  date: '2026-04-16',
  excerpt: 'Description for schema',
  url: 'https://got-moles.com/reviews/commercial-case-studies/',  // Optional, overrides /blog/ prefix
})
```

### Pages Collection schemaType

The Pages collection `schema.type` field only accepts these values:
- `WebPage`, `AboutPage`, `ContactPage`, `FAQPage`, `CollectionPage`, `Service`

Do NOT use `Article` — it's not in the allowed list. Use `WebPage` as the default.

### Schema Discipline Rules

These rules prevent the duplicate schema bugs fixed in the AEO Schema Integrity project (Phases 1-4). Follow them on every page build.

1. **One primary page-type per URL.** page.tsx decides which type (LocalBusiness, Service, FAQPage, Article, etc.). Never emit two page-type schemas on the same URL.
2. **page.tsx owns all schema emission.** All `<JsonLd>` components go in the page route file. Block renderers do NOT emit schema — blocks provide data, the page route emits schema from that data.
3. **Supplementary schemas are additive.** BreadcrumbList, Person, Organization — these do not conflict with the primary page-type and can coexist.
4. **generateSchema: false on all FAQ blocks.** The page route calls `faqSchema(items)` directly. The block's `generateSchema` flag must be `false` to prevent the block renderer from emitting a duplicate FAQPage node.
5. **Validate with Google Rich Results Test.** After any schema change, run https://search.google.com/test/rich-results on the affected URL. Confirm the correct schema type is detected, no errors, no duplicates.

---

## Seed Process

### Command Reference

```bash
# From site/ directory:
npm run seed              # Default: --test mode (Sammamish city only, fast verify)
npm run seed:test         # Explicit test mode
npm run seed:all          # Full seed: all pages + blog + cities + testimonials
npm run seed -- --reseed home           # Re-seed homepage only
npm run seed -- --reseed home,about     # Re-seed multiple pages
npm run seed -- --reseed case-studies   # Uses friendly name map
npm run seed:media        # Upload images + link to CMS blocks (separate step)
```

### Friendly Name Map (--reseed)

| You Type | CMS Slug |
|----------|----------|
| `home` | `/` |
| `tmcp` | `total-mole-control-program` |
| `one-time` | `one-time-mole-removal` |
| `commercial` | `commercial-mole-control` |
| `how-it-works` | `how-it-works` |
| `about` | `about` |
| `faq` | `faq` |
| `contact` | `contact` |
| `reviews` | `reviews` |
| `case-studies` | `commercial-case-studies` |

### Seed Order

1. Authors (Spencer Hill, Cory Ventura) — skips if exist
2. Services (3) — skips if exist
3. Testimonials (183) — skips if exist
4. City Pages (1 in test, 33 in all)
5. Blog Posts (all mode only, 7 posts)
6. Pages (all block-based pages)
7. Globals (site-settings, header, footer — always runs)

### Reseed Behavior

`--reseed` DELETES the page then recreates it. This means:
- Any CMS edits to that page are lost
- The page gets fresh data from pages-data.ts
- Globals are always updated regardless

### Adding a New Page to Seed

1. Create block data in `pages-data.ts`: export `myPageBlocks` and `myPageMeta`
2. Add to `allPages` array in `seed.ts`:
   ```typescript
   { title: 'My Page', slug: 'my-slug', layout: myPageBlocks, meta: myPageMeta, schemaType: 'WebPage' },
   ```
3. If page has imageText blocks, strip `image` but keep `fallbackImage`:
   ```typescript
   layout: myPageBlocks.map((b: any) => b.blockType === 'imageText' ? { ...b, image: undefined } : b)
   ```
4. Add friendly name to slug map if needed
5. If page has images to link via seed-media, add to `PAGE_IMAGETEXT_IMAGES` in seed-media.ts

### Env Vars for Seeding

The seed scripts load env via `node --env-file=.env.local --env-file=.env`. Required:

| Var | Where | Purpose |
|-----|-------|---------|
| `DATABASE_URI` | `.env` | Supabase PostgreSQL connection string |
| `PAYLOAD_SECRET` | `.env` | Payload CMS encryption key |
| `BLOB_READ_WRITE_TOKEN` | Not set locally yet | Vercel Blob uploads (when media is configured) |

---

## Deploy Process

### The Only Flow

```
1. Edit code (pages-data.ts, page routes, components, block definitions)
2. npx next build                    ← Must pass. Fix errors before proceeding.
3. npm run seed -- --reseed {slug}   ← If block data changed in pages-data.ts
4. git add {specific files}
5. git commit -m "descriptive message"
6. git push mine main                ← Triggers Vercel build
7. Wait ~2 minutes for Vercel deploy
8. Verify on got-moles.com/{path}    ← Check the LIVE page, not just build logs
```

**CRITICAL: Steps 3 and 6 are BOTH required.** Reseeding updates Supabase (the CMS database). But Vercel caches rendered pages at build time. If you reseed without pushing, the live site still shows the OLD cached data. The push triggers a Vercel rebuild which reads the fresh CMS data.

### Pre-Deploy Checklist (answer every question before pushing)

Run through these questions before every `git push mine main`. If any answer is "no" or "not sure", stop and fix before pushing.

| # | Question | If NO |
|---|----------|-------|
| 1 | **Did I reseed any pages whose CMS data changed?** | Run `npm run seed -- --reseed {slug}` |
| 2 | **Are all new block types registered?** (blocks/index.ts, RenderBlocks.tsx, payload-types.ts) | Add to registry and renderer map |
| 3 | **Do new block types have their DB tables in Supabase?** | Run local dev server first (`npm run dev`) — Payload auto-syncs schema to Supabase. Or run `npx payload migrate:create` + `npx payload migrate`. |
| 4 | **Did I leave payload.config.ts and importMap.js untouched?** | Revert with `git checkout`. OrderedListFeature is a Payload default — never add it explicitly. importMap.js is auto-generated — dev mode changes must be reverted before commit. |
| 5 | **Are there any test/temp blocks in the CMS?** | Reseed the affected page to reset to pages-data.ts content |
| 6 | **Are there any temp scripts to delete?** | Remove before committing |
| 7 | **Did `npx next build` pass clean?** | Fix errors first. A clean build does NOT guarantee runtime success — but a failed build guarantees failure. |
| 8 | **Am I pushing to `mine`, not `origin`?** | Always `git push mine main` |

### Never Do

- `git push origin main` — origin is Simon's upstream, read-only
- `vercel deploy` or any Vercel CLI deploy — caused site-wide 404 (2026-05-21)
- Test on localhost — always verify on the live site after deploy
- Skip the build step — broken builds still deploy and show errors
- Reseed without pushing — CMS data updates but cached pages don't refresh
- Push without reseeding — code changes deploy but CMS still has old block data

---

## Gotchas (Learned the Hard Way)

### 1. CMS Page Exists = Code Fallback Ignored

If you seed a page, then change `pages-data.ts`, your changes won't show up. The CMS version takes priority. You must re-seed.

### 2. Upload Fields Can't Take Strings

Payload's `type: 'upload'` fields expect a media document ID (number) or null. You cannot pass a string path like `/images/hero.webp`. This is why we strip `image: undefined` when seeding imageText blocks.

### 3. fallbackImage is the Safety Net

The `fallbackImage` text field bypasses Payload's upload system entirely. It's a plain string that gets stored in the CMS and used by the component to build a static `/images/` path. Always include it on imageText and hero blocks.

### 4. og:image on Child Pages

Next.js `openGraph` in metadata doesn't merge with parent — it replaces. So every page's `buildMetadata` must include `images`. This is handled by `buildMetadata` automatically. Don't override metadata manually without including images.

### 5. schemaType: No "Article"

The Pages collection schema type field allows: WebPage, AboutPage, ContactPage, FAQPage, CollectionPage, Service. NOT Article. Use `WebPage` as default. Article schema is added via `articleSchema()` in the page route's JsonLd, not in the CMS field.

### 6. Seed-Media Requires Blob Token

`seed-media.ts` uploads to Payload Media, which uses Vercel Blob. Without `BLOB_READ_WRITE_TOKEN`, uploads go to local disk and won't exist on the deployed Vercel instance. Until Blob is configured, rely on `fallbackImage` for all images.

### 7. FAQ Schema: generateSchema Must Be FALSE on Blocks

page.tsx is the SOLE owner of schema emission. The page route calls `faqSchema()` and emits `<JsonLd>` directly. FAQ blocks in pages-data.ts must have `generateSchema: false` to PREVENT the FAQ block renderer from emitting its own duplicate FAQPage schema.

The bug (fixed in Phase 1): /about/ and /commercial-case-studies/ had FAQ blocks with `generateSchema: true` while page.tsx ALSO emitted FAQPage schema — producing duplicate FAQPage nodes that confused AI engines and failed Google Rich Results Test.

The fix: set `generateSchema: false` on all CMS FAQ blocks via Payload Local API fix scripts, leaving page.tsx as the single emitter.

**Pattern:**

```typescript
// page.tsx — the SOLE schema emitter
const faqBlock = blocks.find(b => b.blockType === 'faq')
const faqItems = faqBlock?.items || []

return (
  <>
    <JsonLd data={breadcrumbSchema([...])} />
    <JsonLd data={pageTypeSchema()} />
    {faqItems.length > 0 && <JsonLd data={faqSchema(faqItems)} />}
    <RenderBlocks blocks={blocks} />
  </>
)

// pages-data.ts — generateSchema MUST be false
{
  blockType: 'faq',
  heading: 'Common Questions',
  items: [...],
  generateSchema: false,   // REQUIRED — prevents duplicate FAQPage emission
}
```

**Rule:** Never set `generateSchema: true` on FAQ blocks. If you need FAQPage schema on a page, add `<JsonLd data={faqSchema(items)} />` in the page route file.

### 8. Lexical JSON is Strict

richText fields require exact Lexical JSON structure. Use the builders (`makeLexical`, `makeParagraph`, `makeHeading`). Don't hand-write Lexical JSON. Don't pass HTML. Don't nest `makeLexical` inside `makeLexical`.

### 9. One Primary CTA per Page

Design system rule: one primary CTA per viewport. CTA blocks use `background: 'gradient'` for primary. Don't stack multiple gradient CTAs.

### 10. Humanizer Pass is Mandatory

All publishable text must go through `tool-humanizer` (deep mode). Target score 8.0+. Run AFTER the build, not before — humanize the final copy that's in the code.

### 11. Reseed Without Push = Invisible Change

Reseeding updates Supabase directly, but Vercel caches rendered pages at build time. A reseed without `git push mine main` means the live site still shows the old cached version. Always push after reseeding — even if the only code change is a trivial one to trigger the rebuild. Learned: 2026-05-22, test blocks persisted on how-it-works after reseed because no rebuild was triggered.

### 12. New Block Types Need DB Tables Before Deploy

Payload CMS stores each block type in its own PostgreSQL table. Adding a new block to `allBlocks` in `blocks/index.ts` means Payload expects those tables to exist. If they don't, the build succeeds (SSG reads existing data) but the runtime crashes on serverless cold start (Payload validates all registered blocks against the DB schema). Two ways to create tables: (a) run local dev server — Payload auto-syncs schema to Supabase, or (b) run `npx payload migrate:create` + `npx payload migrate`. Learned: 2026-05-22, three consecutive deploys 404'd because Table and TLDR block tables didn't exist.

### 13. Never Modify payload.config.ts or importMap.js for OrderedListFeature

OrderedListFeature is a Payload default — it's included automatically. Adding it explicitly in payload.config.ts duplicates it and can cause runtime errors. importMap.js is auto-generated by Payload dev mode — any changes from running `npm run dev` locally must be reverted before committing. Learned: 2026-05-22, initially misdiagnosed as root cause of 404s.

### 14. pages-data.ts Changes Alone Do NOT Fix Seeded Pages

Editing block data in `pages-data.ts` only changes the code fallback. Once a page is seeded to CMS (Supabase), the CMS version is what renders. To fix block-level data on seeded pages, you need BOTH:

1. **Code change** — update `pages-data.ts` (so future seeds are correct)
2. **CMS fix script** — write a Payload Local API PATCH script to update the specific field on the existing CMS record

A full reseed (`npm run seed -- --reseed {slug}`) works too, but destroys any CMS edits made since the last seed. Use targeted fix scripts (e.g., `fix-about-faq-schema.ts`) when you only need to change one field.

Example from Phase 1: fixing `generateSchema` on /about/ required both a pages-data.ts change AND a fix script that PATCHed the FAQ block's `generateSchema` field from `true` to `false` in the CMS record.

---

## Checklist: Adding a New Page

Use this every time. Check each box.

- [ ] **1. Block data** — Create `myPageBlocks` and `myPageMeta` in `pages-data.ts`
- [ ] **2. Images** — Place WebPs in `public/images/`. Add `fallbackImage` field to every imageText/hero block.
- [ ] **3. Page route** — Create `src/app/(frontend)/{path}/page.tsx` following the pattern above
- [ ] **4. Schema** — Add appropriate JsonLd components (breadcrumb + page-type + FAQ if applicable)
- [ ] **5. Build** — `npx next build` passes clean
- [ ] **6. Seed entry** — Add to `allPages` in `seed.ts`. Strip `image` from imageText blocks.
- [ ] **7. Seed** — Run `npm run seed -- --reseed {slug}`
- [ ] **8. Friendly name** — Add to slug map in seed.ts if needed
- [ ] **9. Cross-links** — Add links from related pages (navigation, CTAs, inline links)
- [ ] **10. Humanizer** — Run deep pass on all copy. Target 8.0+.
- [ ] **11. Commit** — `git add` specific files, descriptive commit message
- [ ] **12. Push** — `git push mine main`
- [ ] **13. Verify** — Check staging URL. Images load. Schema correct. Links work. Mobile responsive.

---

## File Map

```
site/
├── src/
│   ├── app/(frontend)/          ← Page routes
│   │   ├── page.tsx             ← Homepage
│   │   ├── reviews/
│   │   │   ├── page.tsx         ← Reviews hub
│   │   │   └── commercial-case-studies/
│   │   │       └── page.tsx     ← Case studies
│   │   ├── services/
│   │   │   ├── total-mole-control-program/page.tsx
│   │   │   ├── one-time-mole-removal/page.tsx
│   │   │   └── commercial-mole-control/page.tsx
│   │   ├── about/page.tsx
│   │   ├── contact/page.tsx
│   │   ├── faq/page.tsx
│   │   ├── how-it-works/page.tsx
│   │   ├── blog/[slug]/page.tsx
│   │   └── [citySlug]/page.tsx  ← Dynamic city pages
│   ├── blocks/                  ← Payload block definitions (CMS schema)
│   ├── components/blocks/       ← React block components (rendering)
│   ├── lib/
│   │   ├── pages-data.ts       ← All block data + metadata exports
│   │   ├── cms-page.tsx        ← getCmsPageContent, buildMetadata
│   │   ├── schema.tsx          ← JSON-LD schema builders
│   │   └── testimonial-data.ts ← 183 enriched reviews
│   └── scripts/
│       ├── seed.ts             ← Main seed script
│       └── seed-media.ts       ← Image upload + linking
├── public/images/               ← Static images (fallback source)
├── next.config.ts               ← Image config, headers, redirects
├── payload.config.ts            ← CMS config, collections, storage
└── .env                         ← DATABASE_URI, PAYLOAD_SECRET
```
