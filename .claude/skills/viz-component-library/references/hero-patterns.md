# Hero Section Patterns

Reference material for hero component specifications. Each pattern includes layout structure,
content slots, responsive behavior, performance requirements, and conversion principles.

---

## Split-Screen Hero

**Layout:** Image or visual on one side, copy on the other. Typically 50/50 or 60/40 split.
The copy side carries the message. The image side carries the proof.

**Best for:** Service pages, about pages, pages with strong photography, pages where the
person IS the brand. Works well when you have a real photo that builds trust.

**Content slots:**
- Headline: under 10 words. Must pass the 5-second test. Set in display typography token.
- Subheadline: under 25 words. Expands the headline with specificity. Body typography, larger weight.
- Primary CTA: single action button using primary CTA token styling.
- Trust signal: one line beneath CTA. "Join 300+ leaders" or a single credential. Small text, muted color.

**Image requirements:**
- Real photography, not stock. The audience can tell.
- Preloaded, never lazy-loaded. This is the LCP element.
- Use `fetchpriority="high"` and explicit width/height attributes.
- Serve WebP with AVIF fallback. Size for 2x displays, compress aggressively.
- Aspect ratio: portrait works for people, landscape for scenes. Define with CSS aspect-ratio
  to prevent layout shift.

**Responsive behavior:**
- **Mobile (default):** Single column. Image above or below copy depending on content priority.
  If the person is recognisable (personal brand), image above. If the message matters more,
  copy above. Full-width image, edge-to-edge or with minimal padding.
- **Tablet (md breakpoint):** Can maintain stack or begin side-by-side at 60/40.
- **Desktop (lg breakpoint):** Full split layout. Image fills its column. Copy vertically
  centered in its column with generous padding.

**Conversion data:** Outperforms centered hero for pages with longer copy. The split gives
the eye a resting point (image) and a reading point (copy). Reduces cognitive load compared
to text overlaid on images.

**Psychology for sceptical audiences:** The split-screen format feels honest. No tricks, no
overlay effects. The image is the image. The words are the words. This directness builds
trust with audiences who have seen too many flashy landing pages.

**When to use:** The person or product has strong visual presence. The copy needs room to
breathe without competing with the image. Service pages, coaching pages, about pages.

**When to avoid:** When you don't have strong photography. A weak image in a split-screen
hero actively damages credibility. Use centered or minimal instead.

**Accessibility:**
- Image must have descriptive alt text (not "hero image" or "banner").
- Heading must be the first h1 on the page.
- CTA must be a button or link with clear accessible name.
- Sufficient contrast between text and background on the copy side.

---

## Centered Hero

**Layout:** Centered headline + subheadline + CTA, with optional background image or
subtle gradient. Everything stacks on the vertical center axis.

**Best for:** Homepages, landing pages, minimal-content heroes, pages where the headline
IS the experience. Works when the words are strong enough to stand alone.

**Content slots:**
- Display headline: set in display/title typography (e.g., BN Dime Display for brand work).
  Under 8 words. This is the largest text on the page.
- Subheadline: under 20 words. Body typography at a larger size. Provides context for the
  display headline.
- Single CTA: centered, primary button styling. One action only.
- Optional logo bar: 5-7 logos directly below the hero section as immediate social proof.
  Grayscale, consistent height.

**Responsive behavior:**
- **Mobile (default):** Natural stacking. Reduce headline size using clamp(). Maintain
  generous top/bottom padding (space-16 minimum). CTA should be full-width or near
  full-width for easy thumb access.
- **Tablet (md breakpoint):** Headline can grow. CTA returns to auto-width.
- **Desktop (lg breakpoint):** Full display size. Max-width constraint on the text block
  (600-700px) to maintain readable line lengths.

**Conversion data:** Strongest when the headline passes the 5-second test. If a visitor
can understand what you do and who it's for within 5 seconds, this format outperforms
all others. Weak headlines get exposed by this format. There is nowhere to hide.

**Background treatment:**
- Solid color (surface token) is safest. No distraction.
- Subtle gradient: only if it uses brand palette tokens. Never generic blue-purple.
- Background image: must be darkened/lightened enough for text contrast. Add a semi-transparent
  overlay. Test contrast ratios on the actual image, not the overlay alone.
- No background video in centered heroes. The headline needs attention, not competition.

**When to use:** Strong headline, confident brand, homepage or primary landing page.

**When to avoid:** When the headline is weak or generic. This format exposes bad copy.

---

## Video Hero

**Layout:** Background video (muted, autoplay, looping) with overlay text and CTA.
The video sets mood. The text delivers the message.

**Best for:** Brand pages where motion adds meaning. Event pages. Pages where the
product/service IS a visual experience.

**CAUTION: Heavy performance cost.** Every video hero is a gamble against page speed.

**Technical requirements:**
- Video must be under 5MB. Compress aggressively.
- Maximum 720p resolution. Higher adds file size without visible benefit on most screens.
- Poster image required. This loads first while video buffers. The poster image IS the LCP
  element. Preload it with `fetchpriority="high"`.
- Muted and autoplay. Never start with sound.
- Loop seamlessly. The cut between end and start must be invisible.
- Format: MP4 with H.264 for broadest support. WebM as progressive enhancement.

**Content slots:**
- Headline: under 8 words. White text with text-shadow or dark overlay for contrast.
- Subheadline: under 15 words. Keep shorter than other hero types because the video
  is doing some of the communication.
- CTA: primary button styling. Must have sufficient contrast against ALL frames of the video.
  Test against the lightest frame.

**Responsive behavior:**
- **Mobile (default):** Replace video with the poster image. Mobile bandwidth and battery
  make video heroes irresponsible. Show the static image with the same text overlay.
- **Tablet (md breakpoint):** Can show video if on Wi-Fi. Consider using
  `prefers-reduced-data` media query.
- **Desktop (lg breakpoint):** Full video experience.

**For sceptical, time-poor audiences:** Generally avoid unless the video IS the product.
Sceptical audiences interpret flashy video heroes as compensating for weak substance.
If the content is strong, a minimal or split-screen hero works harder.

**When to use:** The business is inherently visual (events, venues, physical products).
The video shows real footage, not stock.

**When to avoid:** Service businesses, coaching, consulting, B2B SaaS. If what you sell
is invisible (transformation, knowledge, software), video heroes distract more than
they help.

---

## Minimal Hero

**Layout:** Text-only. Generous whitespace. No image, no video, no background effects.
Just the headline, subheadline, and CTA floating in confident space.

**Best for:** Blog posts, resource pages, content-first pages, authority-driven brands.
Signals: "we don't need to impress you with visuals. The content speaks."

**Content slots:**
- Headline: can be longer here (up to 15 words) because there are no competing elements.
  Set in the heading typography scale (h1 token).
- Subheadline: up to 30 words. This format gives copy room to work.
- CTA: optional in minimal heroes. If present, use secondary or ghost styling. The content
  below IS the call to action.
- Category/date: for blog posts, show category tag and publication date above the headline
  in small, muted text.

**Responsive behavior:**
- **Mobile (default):** Nearly identical to desktop. The minimal format is naturally
  responsive. Adjust headline size with clamp(). Generous padding (space-12 to space-16).
- **Desktop (lg breakpoint):** Max-width on text container (650-750px). Center it.
  The whitespace on either side IS the design.

**Psychology for sceptical audiences:** Works exceptionally well. Sceptical audiences
distrust flashy design. Minimal heroes signal confidence and substance. The absence of
decoration communicates "we trust our message." This is the design equivalent of speaking
quietly in a room full of shouters.

**When to use:** Blog posts, thought leadership pages, resource hubs, any page where the
written content is the primary value.

**When to avoid:** When you need to show a person, product, or visual result. Minimal
heroes can feel cold for personal brands where warmth and connection matter.

**Accessibility:** Simplest hero to make accessible. No image alt text needed, no video
captions, no overlay contrast issues. Just semantic heading hierarchy and sufficient
text contrast against the background.
