# User Journey Patterns

> **CLIENT CONTEXT (added 2026-07-02):** This reference was written in the ATP era — worked examples use ATP personas (Mark/Mary), the All The Power brand, and atpbos.com. The METHOD is what you apply; map every persona mention to the personas in `brand_context/icp.md` (Got Moles: Jennifer & Mike Thompson, WA homeowners) and every brand example to Got Moles positioning. The dual-domain (allthepower.co.uk + atpbos.com/ClickFunnels) architecture section below is ATP-SPECIFIC and does NOT apply to Got Moles — got-moles.com is a single Next.js/Vercel site; ignore that section's structure entirely for this client.


How Mark and Mary move through the website. Every page architecture decision must
account for where visitors come from, what they need at that moment, and where they
should go next.

---

## Mark's Typical Journey

Mark is 47, time-poor, sceptical, and pragmatic. He needs proof before he invests
attention. His journey is evidence-driven and direct.

**Discovery path:**
1. Sees a LinkedIn post or gets forwarded an article by a peer
2. Clicks through to the website (lands on blog post, landing page, or homepage)
3. Scans the homepage in 5 seconds. If it passes the "is this for me?" test, scrolls
4. Checks the About page. Needs to trust the person before the method
5. Reads the method/programme page. Needs to understand the process
6. Takes the quiz or assessment (lower commitment than booking a call)
7. Gets email results. Reads 2-3 follow-up emails
8. Books a call when ready

**Key behaviours:**
- Scans, does not read. Headlines and bullets do the work.
- Checks credentials early. "Who is this person and why should I listen?"
- Compares mentally to other things he's tried. The "how it works" section must
  differentiate from consultants, courses, and tools he's already used.
- Will not fill out a long form. Quiz or email capture only.
- Desktop-first during work hours. Mobile in the evening.

**Page implications:**
- Homepage hero must pass the 5-second test for a sceptical business owner
- About page must lead with credibility, not warm storytelling
- Method page needs a "how it works" section that feels different from coaching cliches
- Quiz is the primary conversion mechanism. Book-a-call is secondary.

---

## Mary's Typical Journey

Mary is 44, articulate, open to personal development, and time-starved. She is more
willing to engage with content if it respects her intelligence.

**Discovery path:**
1. Discovers the podcast (recommended by a peer, appears in search, or shared on social)
2. Listens to 2-3 episodes. Builds trust through the content.
3. Visits the website from podcast show notes
4. Reads the book page. Buys or downloads the book.
5. Reads the About page. Connects with the origin story.
6. Explores the method/programme page
7. Takes the quiz or books a call directly (higher commitment tolerance than Mark)
8. Joins email list for ongoing insights

**Key behaviours:**
- Reads more deeply than Mark. Willing to engage with longer content if it's sharp.
- Values emotional intelligence and authenticity. Origin story resonates.
- The book is a trust accelerator. Reading it before visiting the site means she
  arrives warmer than Mark.
- Comfortable booking a call without a quiz intermediary.
- Mobile-first. Listens to podcasts on the move, browses the site on her phone.

**Page implications:**
- Podcast hub must link clearly to the website and book
- Book landing page is a key entry point. Must be optimised for conversion.
- About page origin story can be longer and more personal for Mary's journey
- Mobile experience is critical. Every CTA in the thumb zone.

---

## Entry Point Strategy

Different traffic sources deliver visitors in different emotional states. The page
they land on must match that state.

| Source | Likely landing page | Emotional state | What they need first |
|--------|-------------------|-----------------|---------------------|
| LinkedIn (organic post) | Blog post or homepage | Curious, mildly interested | Relevance. "Is this for me?" |
| LinkedIn (ad) | Landing page (paid) | Sceptical, ad-aware | Message match. Mirror the ad promise exactly. |
| Google (branded search) | Homepage | Intent-rich, already aware | Confirmation. "Yes, this is what I was looking for." |
| Google (non-branded) | Blog post or SEO landing page | Problem-aware, not brand-aware | Value. Solve their problem first, brand second. |
| Podcast show notes | Book page or homepage | Warm, trust partially built | Deepen the relationship. Offer next step. |
| Referral (peer forwarded link) | Whatever was shared | High trust (transferred from referrer) | Confirmation of what the referrer said. |
| Email (newsletter) | Blog post or programme page | Engaged, existing relationship | New value. Don't re-sell what they already know. |
| Direct (typed URL) | Homepage | High intent, returning or referred | Clear navigation. Let them find what they came for. |

**Architecture rule:** Every page must work as a potential entry point. Visitors do not
always start at the homepage. Each page must establish enough context to orient a
first-time visitor without being redundant for returning ones.

---

## Micro-Conversion Sequence

The full conversion journey is a sequence of small commitments, each one slightly
larger than the last. Never ask for a big commitment before earning small ones.

```
Scroll (free) → Click (free) → Quiz (email) → Email course (attention) →
Book purchase (small $) → Trial/assessment (time) → Call (commitment) →
Programme enrollment (investment)
```

**Per-stage architecture needs:**

1. **Scroll** — Hero earns this. If the hero fails, nothing else matters.
2. **Click** — Internal links, "read more", "see how it works". Low friction.
3. **Quiz/assessment** — The primary lead capture mechanism. Email required for results.
4. **Email sequence** — Automated. Builds trust over 5-7 touches.
5. **Book purchase** — Small financial commitment. Proves willingness to invest.
6. **Trial/assessment call** — Time investment. Demonstrates seriousness.
7. **Programme enrollment** — The full conversion.

**Page blueprint rule:** Every page blueprint must specify which micro-conversion stage
it serves. A homepage serves stages 1-3. A programme page serves stages 5-7.

---

## Internal Linking Strategy

Every page links forward. No dead ends. The visitor always has a clear next step.

**Linking principles:**

1. **Forward momentum.** Every page must have at least one link to a page deeper in the
   conversion funnel. Homepage links to method. Method links to quiz. Quiz links to call.
2. **Contextual links.** Links within body copy that connect related concepts. "Learn more
   about [topic]" placed where the visitor's curiosity naturally peaks.
3. **Breadcrumbs.** On all pages except the homepage. Help visitors understand where they
   are and navigate back without using the browser button.
4. **Related content.** Blog posts link to 2-3 related posts at the bottom. Service pages
   link to relevant case studies or testimonials.
5. **CTA consistency.** The primary CTA on every page points to the same destination
   (quiz or call booking). Secondary CTAs can vary.

**Dead-end audit:** After generating any page blueprint, verify that no section ends
without a forward path. If the last section on a page is pure content with no link
or CTA, add one.

---

## Cross-Platform Journey

Two domains serve different functions. The architecture must account for visitors
moving between them.

**allthepower.co.uk** — The brand home. Content, story, method, book, podcast, blog.
All organic traffic and brand-building lives here.

**atpbos.com (ClickFunnels 2)** — The conversion platform. Sales funnels, checkout,
programme delivery, member areas. Paid traffic landing pages live here.

**Handoff points:**
- allthepower.co.uk "Enrol now" buttons link to atpbos.com checkout pages
- atpbos.com thank-you pages link back to allthepower.co.uk resources
- Email sequences reference both domains depending on the content type
- Podcast show notes on allthepower.co.uk link to atpbos.com for specific offers

**Architecture rule:** The visitor should never feel like they've left the brand.
Visual consistency (colours, typography, voice) must carry across both domains.
The blueprint should note when a CTA links to the other domain.

---

## The Three-Click Rule

Any page on the site should be reachable within 3 clicks from the homepage.
This constrains the site hierarchy depth.

**For a site with 15-25 pages:**
- Click 1: Primary nav items (5 maximum)
- Click 2: Sub-pages within each nav section
- Click 3: Deepest content (individual blog posts, specific case studies)

**Verification method:** After generating a full site architecture, create a click-depth
map. If any page is 4+ clicks from the homepage, restructure the navigation or add
direct links from higher-level pages.

**Exceptions:** Blog archive pages beyond page 1 may be 4+ clicks deep. This is
acceptable because visitors use search or filters, not sequential clicking, to find
archived content.
