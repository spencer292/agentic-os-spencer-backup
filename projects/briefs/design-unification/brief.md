---
project: design-unification
status: complete
level: 2
created: 2026-04-04
completed: 2026-05-10
---

> **COMPLETE 2026-05-10.** Both deliverables shipped (design-principles.md + design-system.md). Closed out during project audit.


# Design Unification — Moni's Design Principles

## Goal
Create a unified design spec from Moni's Figma prototype and WhatsApp feedback that applies across all website builds, blog, social media, and advertising — without compromising SEO/GEO content strategy.

## Source Materials
- `brand_context/moni-design-input/Moni notes/` — 21 WhatsApp screenshots with annotated feedback
- `brand_context/moni-design-input/Moni notes/FigmaScreeshots/` — 11 Figma prototype screens
- Figma prototype: `https://www.figma.com/proto/EHppSIO7VJF0WScAGYIhHT/GOT-MOLES-?node-id=294-3`

## Deliverables
- [x] `brand_context/design-principles.md` — Cross-client unified design principles (16 rules + platform guide)
- [x] `clients/got-moles/brand_context/design-system.md` — Updated with all session learnings
- [x] Notion page — Design Unification Spec pushed for Moni/team review
- [x] Test page: `/test/homepage` — full homepage with new design (deployed to Vercel)
- [x] Test page: `/test/how-it-works` — progressive disclosure demo (deployed)
- [x] Test page: `/test/city` — Sammamish city page template (deployed)
- [x] 6 Meta ad images regenerated with new design principles
- [x] Ad creative design rules locked into design-principles.md
- [ ] Moni reviews test pages and confirms design direction
- [ ] How-it-works test page updated with latest fixes (grass-dominant, trust-in-hero)
- [ ] Mobile viewport testing across all test pages
- [ ] Notion design spec page updated with final refined values
- [ ] Production components updated (after sign-off)
- [ ] Blog post template test page
- [ ] Social media template test

## Key Decisions (Confirmed Through Iteration)
1. **Button radius: 16px (rounded-2xl)** — 8px too subtle, pill too much
2. **Color ratio: ~90% Grass / ~5% Blue / ~5% Gold** — Blue only for trust strip accent + final CTA gradient
3. **Three grass shades:** #184241 (primary), #153635 (darker), #133634 (darkest)
4. **Section transitions: ~8% gradient bleed** — subtle, not aggressive
5. **Trust strip inside hero** — photo continues behind trust text
6. **Single hero CTA** — phone in header/sticky bar only
7. **Circle-chevron icon** on primary CTA buttons
8. **All body text: text-body-lg (18-20px)** — no mixing sizes
9. **Context-driven alignment** — centered above grids, left above prose, mx-auto on text containers
10. **Section padding: py-16 lg:py-32** (64px/128px)
11. **Empathy headings: text-display** for maximum impact
12. **Skull watermarks: DEFERRED** — needs Moni direction
13. **Progressive disclosure confirmed** — `<details>` elements, SEO/GEO safe
14. **No production changes without sign-off** — all test pages self-contained
15. **Ad creatives follow same principles** — grass bg, cream text, gold buttons, photo as atmosphere

## Acceptance Criteria
- [x] Design principles doc covers website, blog, social, advertising, email
- [x] Every principle has explicit SEO/GEO compatibility statement
- [x] Progressive disclosure patterns specified with technical implementation
- [x] Got Moles design-system.md updated to reference unified principles
- [x] Ad creative design rules specified and tested
- [ ] Moni confirms spec matches her intent
- [ ] Mobile viewport tested
- [ ] No SEO/GEO regressions verified (city links, content volume, schema preserved)
- [ ] Production components updated and deployed
