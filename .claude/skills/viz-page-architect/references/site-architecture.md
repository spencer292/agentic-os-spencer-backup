# Site Architecture Reference

> **CLIENT CONTEXT (added 2026-07-02):** This reference was written in the ATP era — worked examples use ATP personas (Mark/Mary), the All The Power brand, and atpbos.com. The METHOD is what you apply; map every persona mention to the personas in `brand_context/icp.md` (Got Moles: Jennifer & Mike Thompson, WA homeowners) and every brand example to Got Moles positioning. URL examples below use allthepower.co.uk — for Got Moles the real architecture is got-moles.com with /mole-control-{city} city pages and /blog/{slug} posts.


Navigation structure, page hierarchy, content architecture, and URL conventions.
These patterns apply to any brand site built with the page architect skill.

---

## Navigation Best Practices

### Primary Navigation

**5 items maximum.** For time-poor, sceptical audiences (Mark and Mary), more than
5 nav items creates decision paralysis. Every additional nav item reduces the
click-through rate of all other items.

**Recommended structure for a coaching/consulting site:**

| Nav item | What it covers | Why it's primary |
|----------|---------------|-----------------|
| Method | The approach, programme, how it works | This is what they're buying |
| About | Founder story, credibility, team | Trust is the conversion bottleneck |
| Book | Book landing page or resources hub | Content-first entry for Mary's journey |
| Blog | Content hub, guides, insights | SEO entry point, ongoing value |
| Contact | Form, booking, ways to reach out | Always accessible |

**What does NOT go in primary nav:**
- Pricing (lives on the programme/service page, not standalone in nav)
- Testimonials (embedded throughout pages, not a separate nav destination)
- FAQ (lives on relevant pages or as a footer link)
- Podcast (sub-item under Book/Resources, or footer link)

### Sticky Navigation

- Sticky on scroll. Always visible. Reduces to compact height after scrolling past the hero.
- Logo (left) + nav items (centre or right) + primary CTA button (far right).
- Primary CTA in the nav bar: "Take the quiz" or "Book a call". Always visible.
  This is the most valuable real estate on the page.
- On scroll-down: nav hides. On scroll-up: nav reappears. This preserves reading
  flow while keeping navigation accessible.

### Mobile Navigation

- Hamburger menu (top right). Three horizontal lines. No custom icons.
- Full-screen overlay when open. Dark background, light text. Large tap targets.
- Nav items stacked vertically. 48px minimum touch target height.
- Primary CTA as a separate floating button (bottom right, thumb zone).
  This button is ALWAYS visible, even when the hamburger menu is closed.
- Close button (X) in the same position as the hamburger icon for spatial consistency.

### Navigation Anti-Patterns

- Dropdown menus on hover (broken on mobile, frustrating on desktop)
- Mega-menus (too much choice for this audience)
- More than one level of nesting (3-click rule violation)
- "Home" as a nav item (logo handles this)
- "Services" as a catch-all with 6+ sub-items (consolidate into one method page)

---

## Pillar-Cluster Content Architecture

Pillar-cluster architecture generates 30% more organic traffic and pages rank 2.5x
longer than standalone content. This is the foundation of the blog/content strategy.

### How It Works

**Pillar page:** A comprehensive guide on a broad topic (2000-4000 words). Targets a
high-volume keyword. Links to all cluster pages within the topic.

**Cluster pages:** Focused articles on subtopics (800-1500 words each). Each targets a
long-tail keyword. Each links back to the pillar page and to 1-2 sibling cluster pages.

### Example Structure

```
Pillar: "The Complete Guide to Business Owner Burnout"
├── Cluster: "Signs You're the Bottleneck in Your Business"
├── Cluster: "How to Delegate When Nobody Meets Your Standards"
├── Cluster: "AI for Business Owners: Beyond ChatGPT"
├── Cluster: "The Real Cost of Working 60+ Hours a Week"
└── Cluster: "Building Systems That Scale Without You"
```

### Architecture Rules

- Each pillar page links to every cluster page in its topic
- Each cluster page links back to its pillar with the pillar keyword as anchor text
- Cluster pages link to 1-2 sibling clusters for horizontal navigation
- Pillar pages are accessible from the blog hub and from primary navigation
- New cluster pages are added over time without restructuring

### Internal Linking Within Clusters

- Contextual links within body copy (not just "related posts" at the bottom)
- Anchor text uses the target page's primary keyword, not "click here"
- Each cluster page has 2-3 internal links minimum
- Links placed where the reader's curiosity naturally peaks

---

## Page Hierarchy

### Flat vs Deep Architecture

**Flat (recommended for sites under 30 pages):**
- All major pages accessible from primary nav (1 click)
- Blog posts and sub-pages accessible from hub pages (2 clicks)
- Maximum depth: 3 levels

```
Level 0: Homepage
Level 1: Method, About, Book, Blog, Contact (5 pages)
Level 2: Individual blog posts, sub-pages, podcast episodes (N pages)
Level 3: Deep content (archived posts, legal pages)
```

**Deep (for sites with 50+ pages):**
- Category sections with sub-navigation
- Breadcrumbs essential for orientation
- Sidebar navigation within sections
- Maximum depth: 4 levels

**Decision rule:** If the site has fewer than 30 pages, use flat architecture.
The three-click rule is easier to maintain with flat structures.

### Page Types by Hierarchy Level

| Level | Pages | Nav treatment |
|-------|-------|--------------|
| 0 | Homepage | Logo click |
| 1 | Method, About, Book, Blog, Contact | Primary nav |
| 1 | Quiz, Podcast hub | Primary nav CTA or secondary nav |
| 2 | Individual blog posts | Linked from blog hub |
| 2 | Case studies | Linked from method/about pages |
| 3 | Legal (privacy, terms, cookies) | Footer only |
| 3 | Thank-you/confirmation pages | No nav link, reached via form submission |

---

## Breadcrumb Strategy

Breadcrumbs help visitors understand where they are and navigate back without using
the browser button. They also provide structured data for search engines.

### Rules

- Display on all pages except the homepage
- Format: Home > Section > Current Page
- Use BreadcrumbList schema markup (JSON-LD)
- Last item (current page) is plain text, not a link
- Separator: ">" or "/" (consistent across the site)
- Position: below the sticky nav, above the page hero
- Font size: small (body text -1 or -2 on the type scale)
- Colour: muted (secondary text colour, not primary)

### Examples

```
Home > Blog > Signs You're the Bottleneck
Home > Method > How It Works
Home > About
Home > Book > Chapter 1 Preview
```

### When to Skip Breadcrumbs

- Homepage (you're already at the top)
- Landing pages (paid traffic, no navigation)
- Thank-you/confirmation pages (no need to navigate back)
- Quiz pages (full-screen experience, no chrome)

---

## Footer Architecture

The footer is utility, not marketing. It provides navigation, legal compliance,
and contact information without visual clutter.

### Recommended Structure

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  [Logo]              [Nav Col 1]    [Nav Col 2]   [CTA] │
│                      Method         Blog          │     │
│  Brief tagline       About          Podcast       │Book │
│  or description      Book           FAQ           │a    │
│                      Contact        Case Studies  │Call │
│                                                   │     │
│  ─────────────────────────────────────────────────────── │
│                                                         │
│  © 2026 [Brand]  |  Privacy  |  Terms  |  Cookies       │
│                                                         │
│  [Social icons: LinkedIn, Instagram, YouTube, Podcast]  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Footer Rules

- Maximum 2 columns of navigation links (plus logo column and CTA column)
- Include all Level 1 and key Level 2 pages
- Legal links (privacy, terms, cookies) in a separate bottom row
- Social media icons: 4-6 maximum. Only active platforms.
- One CTA in the footer (same as primary site CTA)
- Newsletter signup optional. Only if it adds value and is not already prominent
  on the page.

### Mobile Footer

- Single column. All sections stacked.
- Collapsible nav sections (tap to expand) to save vertical space
- Social icons in a horizontal row
- Legal links as a text block at the very bottom
- CTA button full-width

---

## 404 Page Strategy

The 404 page is an opportunity, not an apology. Most 404 pages are dead ends.
A well-designed one redirects visitors back into the site.

### Required Elements

1. **Friendly headline.** Not "404 Error." Try: "This page wandered off." or
   "Nothing here. Let's get you back on track."
2. **Search bar.** Let them find what they were looking for.
3. **3-4 popular page links.** Homepage, method, blog, contact.
4. **Primary CTA.** The same CTA from the rest of the site.
5. **No blame.** Never imply the visitor did something wrong.

### Technical Notes

- Return proper 404 HTTP status code (not a soft 404 that returns 200)
- Log 404 hits to identify broken links and redirect opportunities
- Set up redirects for any page that previously existed at a different URL

---

## URL Structure Conventions

Clean, readable URLs that describe the content and support SEO.

### Rules

- Lowercase only. No capital letters.
- Hyphens between words. No underscores, no spaces.
- No dates in URLs (dates change, URLs should not)
- No file extensions (.html, .php)
- Short as possible while remaining descriptive

### Structure by Page Type

| Page type | URL pattern | Example |
|-----------|------------|---------|
| Homepage | `/` | `allthepower.co.uk/` |
| Method/service | `/method/` or `/programme/` | `allthepower.co.uk/method/` |
| About | `/about/` | `allthepower.co.uk/about/` |
| Book | `/book/` | `allthepower.co.uk/book/` |
| Blog hub | `/blog/` | `allthepower.co.uk/blog/` |
| Blog post | `/blog/{slug}/` | `allthepower.co.uk/blog/ai-for-business-owners/` |
| Podcast hub | `/podcast/` | `allthepower.co.uk/podcast/` |
| Podcast episode | `/podcast/{slug}/` | `allthepower.co.uk/podcast/episode-42-burnout/` |
| Contact | `/contact/` | `allthepower.co.uk/contact/` |
| Quiz | `/quiz/` or `/assessment/` | `allthepower.co.uk/quiz/` |
| Pillar guide | `/guides/{slug}/` | `allthepower.co.uk/guides/business-owner-burnout/` |
| Case study | `/results/{slug}/` | `allthepower.co.uk/results/mark-manufacturing/` |
| Legal | `/privacy/`, `/terms/` | `allthepower.co.uk/privacy/` |
| Landing page | `/go/{slug}/` | `allthepower.co.uk/go/free-assessment/` |

### Trailing Slashes

Pick one convention and enforce it site-wide. Recommended: trailing slash (`/about/`).
Set up server-side redirects so both versions resolve to the canonical.

### Canonical URLs

Every page must have a `<link rel="canonical">` tag pointing to its preferred URL.
This prevents duplicate content issues from trailing slashes, query parameters,
or www/non-www variations.
