# Image Direction Reference

> **CLIENT CONTEXT (added 2026-07-02):** This reference was written in the ATP era — worked examples use ATP personas (Mark/Mary), the All The Power brand, and atpbos.com. The METHOD is what you apply; map every persona mention to the personas in `brand_context/icp.md` (Got Moles: Jennifer & Mike Thompson, WA homeowners) and every brand example to Got Moles positioning. The Three-Gate Validation itself is brand-agnostic — run it against the CURRENT client's ICP and positioning.


Image selection is not decoration. Every image either builds trust or erodes it with the
specific person you are trying to reach. The wrong image at the wrong moment can undo
an entire page of good copy.

---

## ICP-Driven Image Selection

### What Mark and Mary Respond To

**Real photography of real people in real situations.**
- Mark is 47 and sceptical. He has seen every stock photo of a handshake, a standing
  meeting, and a laptop on a beach. Those images signal "generic coaching site" and
  trigger distrust immediately.
- Mary left corporate. Corporate photography (polished, staged, uniform lighting) reminds
  her of what she escaped. She responds to authenticity.

**The stock test:** Would Mark look at this image and think "that's a real person" or "that's
a stock photo"? If stock, it fails.

### The Three-Gate Image Validation

Every selected image must pass ALL THREE gates before it goes on a page. Failing any one
gate means the image is wrong, regardless of how strong it is on the other two.

**Gate 1: ICP Recognition — "Is this for someone like me?"**
Mark must see the image and feel "this person understands my world." The image must
communicate a reality Mark recognises or aspires to. A shirtless photo at a waterfall
is aspirational for an adventure seeker. It is alienating for a 47-year-old B2B services
owner who works 60 hours a week. He thinks "this person is nothing like me" and the
trust is broken before he reads a word.

Ask: "Would Mark see himself in this image, or feel the gap between his life and what's shown?"

**Gate 2: Positioning Match — "Does this reinforce the brand angle?"**
The image must support the positioning, not contradict it. If the positioning is
"Escaped Architect" (credible, experienced, grounded), the image must communicate
those qualities. An extreme sports image communicates "thrill-seeker" or "adventure
guru." That is a different positioning entirely.

Ask: "If someone saw only this image and nothing else, what would they assume this
person does for a living? Does that assumption match the positioning?"

Read `brand_context/positioning.md` summary before selecting any hero or about image.
The primary angle name and its psychology must inform image selection.

**Gate 3: Section Job Match — "Does this image serve THIS section's job?"**
Each section has one job. The image must serve that specific job, not just "look good."
The About section's job is "give reason to trust the person behind the offer." A cinematic
waterfall photo serves "impress" not "trust." A relaxed, confident photo of Roy in an
everyday setting serves "this person is grounded and approachable. I'd talk to them."

Ask: "Does this image help THIS section do ITS job? Or is it impressive for a different reason?"

### Validation in Practice

Before recommending any image, run it through the three gates explicitly:

```
Image: [filename]
Gate 1 (ICP): Would Mark feel "this is for someone like me"? [YES/NO + why]
Gate 2 (Positioning): Does this match the [primary angle name]? [YES/NO + why]
Gate 3 (Section Job): Does this serve [section job]? [YES/NO + why]
Result: [USE / REJECT / USE ELSEWHERE]
```

If an image fails Gate 1 or 2 but is genuinely strong, note it as "use elsewhere" with
the context where it WOULD pass all three gates. (Example: the waterfall image fails
for the homepage About section but passes all three gates on the full About page where
the adventure story is contextualised by the narrative around it.)

### Image Signals by ICP Trait

| ICP trait | Image signal that builds trust | Image signal that breaks trust |
|-----------|-------------------------------|-------------------------------|
| Sceptical (burned before) | Real photos, specific environments, imperfect is fine | Stock photography, overly polished, generic smiling |
| Time-poor (scanning) | Clean composition, single subject, immediate read | Busy compositions, multiple focal points, details that need studying |
| Established (40s-50s) | Quality without flash. Professional but not corporate. Outdoor, natural light. | Trendy filters, dark mode aesthetics, startup-vibe imagery |
| Values freedom | Open spaces, nature, expansive landscapes, solo figures | Closed offices, meeting rooms, desks, corporate environments |
| Values authenticity | Raw, cinematic, slightly moody. Emotion over perfection. | Over-edited, HDR, unnatural colors, lifestyle perfection |

### Brand Photography Guidelines (from weeknight.studio)

These are the canonical styles. Reference them in every image direction:

1. **Nature and landscapes** — mountains, forests, oceans, open skies
2. **Adventure and freedom** — solo figures on peaks, underwater diving, open water
3. **Stillness and mindfulness** — meditation, cold water, breathing practices
4. **Entrepreneurial life** — laptop in nature, relaxed working environments
5. **Emotion over perfection** — raw, cinematic, slightly moody tones

Feel: **liberating, aspirational, grounded**. Never corporate or staged.

---

## Image Direction Per Section Type

### Hero Image
- **ICP signal:** "This person is real. This place is real. This is not a template."
- **Best sources:** Roy outdoors (adventure, nature, standing on something high). Roy in a
  relaxed working environment. Never a headshot alone. Environment matters.
- **Treatment:** Full-bleed background. Dark overlay (night-900 at 50-60%) for text contrast.
  Image should have visual weight in the bottom half so text sits cleanly above.
- **Crop:** Landscape 16:9 desktop. Portrait or square crop for mobile.
- **Performance:** This is the LCP element. Preloaded. WebP. fetchpriority="high". Responsive
  srcset (400w, 800w, 1200w, 1600w minimum). NEVER lazy-loaded.
- **Alt text:** Decorative (alt="") since the headline carries the message.
- **What to avoid:** Headshot against white background (LinkedIn photo). Group photos (who
  is this?). Anything that looks like it was taken at a conference.

### Social Proof Section
- **ICP signal:** "These are real people who got real results."
- **Testimonial photos:** Real headshots of real clients. Circular crop, 64-80px.
  Professional quality but not studio-perfect. Candid is fine. Must be recognisable
  as a real person, not a stock face.
- **Logo bar:** Grayscale treatment. Consistent height (32-40px). Recognisable logos only.
  If the ICP won't recognise the logo, it adds noise not credibility.
- **What to avoid:** Stock headshots, AI-generated faces, placeholder silhouettes.

### About / Credibility Section
- **ICP signal:** "This is someone I could sit across from and trust."
- **Best sources:** Roy in a natural setting. Outdoor preferred (adventure, travel, nature).
  The extreme sports angle differentiates. A photo of Roy on a mountain or in the water
  says "this person pushes limits" without needing words.
- **Treatment:** Full color. No filters. Rounded corners (radius-lg). On dark backgrounds
  (night-500), the photo provides a warm counterpoint.
- **Crop:** Portrait or 3:4. Max-width 280px in layout. Full-width on mobile.
- **Alt text:** "Roy Castleman" — descriptive, not decorative.
- **What to avoid:** Speaking-from-stage photos (guru signal). Crossed-arms poses (corporate
  signal). Photos where Roy is in a suit (wrong audience signal).

### Problem / Pain Section
- **ICP signal:** This section is about empathy, not visuals. Less is more.
- **Best approach:** No hero image. Use subtle background treatment (neutral-50 or neutral-100).
  If images are used, abstract or atmospheric: a clock ticking, an empty chair, a phone
  screen at dawn. These should be felt, not studied.
- **Alternative:** No image at all. Let the words do the work. Whitespace IS the visual here.
  The absence of imagery in this section creates contrast with the image-rich hero and
  solution sections around it.
- **What to avoid:** Sad/stressed stock photos. Faces showing pain. Burnout stock imagery
  (head in hands at desk). These are cliches that undermine the authentic copy.

### Solution / Method Section
- **ICP signal:** "This is structured. This person has a system."
- **Best approach:** Icons or simple illustrations for each step/pillar. Clean, consistent
  style. Musk Green or Night Sky accent color. Alternatively, small photos showing
  each outcome (someone relaxed with family, someone working calmly, someone outdoors).
- **If using photos:** Real photos of transformation outcomes. Not "before/after" cliches.
  Someone present with their family. Someone working from a cafe. Someone doing something
  active outdoors. Each photo maps to a step in the method.
- **What to avoid:** Clipart. Generic icons from free libraries. Abstract "business" imagery.

### Book / Product Section
- **ICP signal:** "This is a real book. This person is a published author."
- **Best sources:** Professional book cover render with shadow. 3D mockup if available.
  Lifestyle shot of the book (on a desk, in someone's hands, next to coffee).
- **Treatment:** Shadow (shadow-lg) for depth. Max-width 200px in layout. High-resolution
  so text on cover is readable.
- **What to avoid:** Flat 2D cover without depth. Generic "book template" mockups.

### Blog Post Headers
- **ICP signal:** "This content is worth my time."
- **Best approach:** Generate with viz-nano-banana using brand colors and style. Topic-relevant
  but not literal. Abstract or conceptual imagery that hints at the topic.
- **Alternative:** Photography from Roy's library that relates to the topic.
- **Treatment:** 16:9 ratio. Optimised for social sharing (also used as og:image).
- **Performance:** Lazy-loaded (not above fold on blog index pages).

---

## Image Treatment Rules

### Overlay for Text on Images
- Dark overlay: `linear-gradient(rgba(17,18,19,0.5), rgba(17,18,19,0.6))`
- Light overlay: `linear-gradient(rgba(250,250,248,0.85), rgba(250,250,248,0.9))`
- Brand tint overlay: `linear-gradient(rgba(94,92,43,0.7), rgba(51,53,56,0.8))`
- Text on overlay must meet WCAG AA contrast (4.5:1 minimum)

### Color Grading
- Slightly desaturated. Not vivid. Not grey. The sweet spot between raw and polished.
- Warm tones preferred (align with Musk Green warmth). Cool blue-tint feels corporate.
- Consistent grading across all images on a page. Mixed treatments feel amateur.

### Responsive Image Strategy
```html
<img
  src="image-800.webp"
  srcset="image-400.webp 400w, image-800.webp 800w, image-1200.webp 1200w, image-1600.webp 1600w"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
  width="1200" height="675"
  alt="Descriptive text or empty for decorative"
  loading="lazy"
>
```
- Hero: remove `loading="lazy"`, add `fetchpriority="high"`
- All others: keep `loading="lazy"`
- Always include `width` and `height` (prevents CLS)

---

## Sourcing Decision Tree

For each section's image need:

1. **Check photo library** (`brand_context/Photography/photo-index.md`). Is there a real photo
   that matches the need? If yes, use it. Real always beats generated.

2. **No suitable photo?** Can Roy provide one? Add to the photography shot list for the
   photography audit (roadmap task 4.1c).

3. **Can't shoot and need it now?** Generate with `viz-nano-banana` using the brand's visual
   style (warm, slightly moody, cinematic). Use for blog headers, social graphics, and
   abstract/conceptual imagery. Never for hero sections or testimonials.

4. **Stock photography?** Last resort only. If used, it must pass the "would Mark think this
   is stock?" test. Unsplash/Pexels have real photography that can work if carefully
   selected. Never use stock for people (faces, hands, groups).

---

## Common Mistakes

### Using images because the section "needs one"
Not every section needs an image. The pain section works better without one. Whitespace is
a visual element. An image that doesn't serve the ICP is worse than no image at all.

### Choosing images the founder likes instead of what the ICP responds to
Roy might love a specific skydiving photo. If Mark sees it and thinks "extreme sports
person, not business coach," it fails. Every image must pass the ICP filter: does this
build trust with a 47-year-old sceptical business owner?

### Inconsistent treatment across a page
If the hero has warm, slightly desaturated grading and the about photo has cold, vivid
treatment, the page feels disjointed. Pick one treatment approach per page and apply it
consistently.

### Heavy images that kill performance
A single unoptimised 4MB hero image destroys everything. Every image must be:
- WebP format (25-35% smaller than JPEG)
- Responsive srcset (don't serve 4000px to a 375px phone)
- Appropriately compressed (quality 75-85 for photos)
- Under 200KB for above-fold images, under 100KB for below-fold
