# Performance Rules Reference

Performance is not a development concern bolted on after design. It is a design decision.
Every visual choice has a performance cost, and performance directly impacts conversion.

## The Business Case

| Speed change | Conversion impact |
|-------------|-------------------|
| 1-second delay | 7% conversion drop |
| 2-second delay | 30%+ conversion drop |
| 3+ seconds | Over half of visitors bounce |
| 0.1s improvement | 8-10% conversion increase |

47% of users expect a page to load in under 2 seconds. A slow site tells a sceptical business
owner that you don't have your operation sorted. Speed IS a trust signal.

Walmart achieved a 20% conversion boost partly through 35% page speed improvement.
This is not theoretical — speed is money.

## Core Web Vitals (2025-2026)

### LCP — Largest Contentful Paint (target: under 2.5s)
**What it measures:** How fast the main content appears.
**Why it matters:** This is usually the hero image or heading. If it's slow, the visitor's first
impression is "waiting."

**The hero image is the LCP element on 85% of pages.** Design decisions that affect LCP:

DO:
- Preload the hero image: `<link rel="preload" as="image" href="hero.webp" fetchpriority="high">`
- Use WebP format (25-35% smaller than JPEG at same quality)
- Use AVIF where supported (50% smaller than JPEG — but slower to encode)
- Set explicit width and height attributes on the image element
- Serve appropriately sized images (don't serve 4000px to a 375px phone)
- Use `srcset` and `sizes` for responsive image serving
- Consider CSS background images for heroes (can be preloaded)
- Inline critical CSS (above-fold styles in the `<head>`)

NEVER:
- Lazy-load the hero/LCP image (16% of sites make this mistake; lazy-loaded LCP images are among the slowest at 720ms)
- Use JavaScript to load the hero image
- Put the hero behind a carousel/slider (the active slide is hidden from preload)
- Use uncompressed PNG for photographic hero images
- Serve the same image size to all screen sizes

### INP — Interaction to Next Paint (target: under 200ms)
**What it measures:** How fast the page responds to user interaction (clicks, taps, key presses).

Design decisions that affect INP:
- Only animate `transform`, `opacity`, `filter`, `clip-path` (GPU-accelerated, don't trigger layout)
- Avoid animating `width`, `height`, `top`, `left`, `margin`, `padding` (trigger layout recalculation)
- Break up long JavaScript tasks (heavy scripts block the main thread)
- Defer non-critical JavaScript with `defer` or `async`
- Don't load animation libraries (GSAP, Framer Motion) for simple transitions — CSS transitions suffice

### CLS — Cumulative Layout Shift (target: under 0.1)
**What it measures:** How much the layout jumps around while loading.

Design decisions that prevent CLS:
- ALWAYS set explicit `width` and `height` on images and videos (or use `aspect-ratio` CSS)
- Images without dimensions cause ~60% of layout shifts
- Reserve space for dynamically loaded content (ads, embeds, cookie banners)
- Web fonts cause ~25% of shifts (text reflows when custom font loads)
- Use `font-display: swap` PLUS `size-adjust`, `ascent-override`, `descent-override` on fallback fonts (reduces CLS by up to 70%)
- Never inject content above existing content after page load (push-down effect)
- Set dimensions on iframes and embeds

## Font Loading Strategy

Fonts are the #2 performance concern after images.

### Rules
1. Maximum 3 font files (e.g., regular, medium, bold — or one variable font file)
2. WOFF2 format only (best compression, universal browser support)
3. Self-host fonts — eliminates DNS lookup to Google Fonts CDN
4. Preload the primary body weight (it's needed immediately):
   `<link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>`
5. Use `font-display: swap` to show fallback text immediately, swap when custom font loads
6. Subset fonts to remove unused character sets (Latin-only sites don't need Cyrillic)
7. Variable fonts: ONE file covers all weights. Eliminates multiple file downloads.

### CLS Prevention for Fonts
When the custom font loads and replaces the fallback, text reflows (lines wrap differently, paragraphs change height). Prevent this:
```css
@font-face {
  font-family: 'Fallback';
  src: local('Arial');
  size-adjust: 100.06%;
  ascent-override: 96%;
  descent-override: 23%;
}
```
Tune these values to match your custom font's metrics against the fallback. This keeps text the same size during the swap, preventing layout shift.

## Image Strategy

### Format Selection
| Format | Best for | Savings vs JPEG |
|--------|---------|----------------|
| WebP | Photos, complex images (primary format) | 25-35% smaller |
| AVIF | Photos when max compression needed | 50% smaller |
| SVG | Icons, logos, simple illustrations | Resolution-independent |
| PNG | Images requiring transparency, screenshots | Larger but lossless |

### Responsive Images
```html
<img
  src="hero-800.webp"
  srcset="hero-400.webp 400w, hero-800.webp 800w, hero-1200.webp 1200w, hero-1600.webp 1600w"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
  width="1200" height="600"
  alt="Descriptive alt text"
  loading="lazy"
>
```
- Hero image: NO `loading="lazy"`, ADD `fetchpriority="high"`
- All other images: ADD `loading="lazy"` (native browser lazy loading)
- Always include `width` and `height` (prevents CLS)
- Always include meaningful `alt` text (accessibility)

## The Performance Budget

### Suggested targets for a high-converting site
| Metric | Target |
|--------|--------|
| Total page weight | Under 1.5MB (ideally under 1MB) |
| JavaScript | Under 200KB (compressed) |
| CSS | Under 50KB (compressed) |
| Fonts | Under 150KB (2-3 files or 1 variable font) |
| Images (above fold) | Under 200KB total |
| LCP | Under 2.5s (aim for under 2s) |
| INP | Under 200ms |
| CLS | Under 0.1 |
| Time to Interactive | Under 3.8s |

### What breaks budgets
- Hero video backgrounds (huge files, delay LCP)
- Multiple font families (each family x each weight = separate downloads)
- Animation libraries loaded for simple transitions
- Unoptimised images (a single 4MB hero image destroys everything)
- Third-party scripts (analytics, chat widgets, social embeds — each adds weight and blocks main thread)
- Carousel/slider libraries (heavy JS, hidden images still download)

## Design Decisions That Improve Performance (Free)
- Use system font stacks where appropriate (zero download cost)
- Use CSS for visual effects instead of images (gradients, shadows, borders)
- Use SVG for icons instead of icon fonts (smaller, more accessible, cacheable)
- Limit above-fold images to hero + logo (everything else lazy-loads)
- Keep animations CSS-only (no JavaScript animation libraries for micro-interactions)
- Use `content-visibility: auto` on below-fold sections (browser skips rendering until needed)
