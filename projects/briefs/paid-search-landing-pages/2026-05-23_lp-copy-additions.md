---
project: paid-search-landing-pages
type: copy-spec
created: 2026-05-23
status: ready for the Got Moles build window (copy to drop into buildLpBlocks)
pairs_with: 2026-05-23_lp-fixes-todo.md (structure) + 2026-05-23_no-video-lp-template-spec.md
rules: Posture A (no kill/poison/trap-mechanism — describe service + warranty, not biological outcome) · US English · humanizer ≥8.5 before commit · {City}/{neighborhoods} are template vars
---

# LP Copy Additions — make the pages human-useful + convert

Drop-in copy for the city LP template. `{City}` = `city.displayName`. Where city-specific facts
are needed, pull from `city-data.ts[slug]`. Keep question-format headers (readable + AEO), short
sentences, bold the offer/guarantee. **All copy below is Posture-A safe** — keep it that way.

## Where each piece goes (block stack)
| # | Copy piece | Block / position | blockType | City-specific? |
|---|-----------|------------------|-----------|----------------|
| A | Recognition lead | Hero subheading (lead line before the offer) | hero | yes ({City}) |
| B | "Is it moles?" signs | NEW short block after hero/form, before How-It-Works | richContent (`grass`) | no |
| C | "Why DIY didn't work" | NEW block after How-It-Works, before FAQ | richContent (`grass-alt`) | light ({City}) |
| D | Honest urgency line | subtext on the local-proof block or near final CTA | (existing block) | no |
| E | Standard FAQ set | FAQ block (merge with `city-data.ts` faqs) | faq (`generateSchema:true`) | some ({City}) |
| F | Spencer / trust line | intro line on the testimonial block | testimonial | no |

Keep the gradient CTA the LAST block; alternate grass/grass-alt; one primary CTA per viewport.

---

## A — Recognition lead (hero subheading)
> Fresh mounds across your {City} lawn? Tunnels that cave in when you step on them? You didn't do anything wrong — moles are relentless, and {City}'s soil is exactly what they look for. We remove them, and we don't get paid unless we do. **$150 to start. $450 max. Nothing more if we don't catch.**

## B — "Is it moles?" signs (new richContent block)
**Heading:** Not sure it's moles?
> If you're seeing any of these, it's almost certainly moles — and they won't stop on their own:
- Volcano-shaped mounds of fresh soil, often appearing overnight
- Raised ridges where the ground feels spongy underfoot
- Brown, dying patches where roots have been disturbed
- Damage that keeps spreading no matter what you try

## C — "Why DIY didn't work" (new richContent block)
**Heading:** Tried castor oil, repellents, or sonic spikes already?
> Most {City} homeowners call us after the home remedies. Repellents, ultrasonic spikes, and castor-oil treatments might move a mole for a day or two, but they don't clear an active tunnel network — the moles route around them and the mounds come back. Professional removal works because we read the active runs and place equipment where the moles actually travel, then check it every week until your yard is clear. That's the difference between chasing mounds and solving the problem.

## D — Honest urgency line (subtext near local-proof / final CTA)
> Moles are most active in spring and fall. Every week of tunneling is more lawn to repair — the sooner we start, the less damage there is to undo.

## E — Standard FAQ set (merge into the FAQ block, alongside city-data.ts faqs)
1. **How much does mole removal cost?** — $150 to start. If we catch moles within 4-5 weeks, the total is $450. If we don't, you owe nothing more — $450 is the most you'll ever pay.
2. **Is it safe for my pets and kids?** — Yes. No poisons, no chemicals — nothing that touches the grass your family and pets use. Our methods are professional and placed below the surface in active runs.
3. **Will the moles come back?** — Once we clear the active network, your yard is clear. New moles can move in from neighboring property over time, which is why we offer the $100/month year-round program for homes that border greenbelts or open land.
4. **How fast can you come out?** — Spencer calls you back the same business day, and first visits are usually within a few days of booking.
5. **Do moles bite or carry disease?** — Moles aren't aggressive and bites are extremely rare. The real problem is the damage their tunneling does to your lawn, beds, and irrigation lines.
6. **Do you service {City}?** — Yes — we've protected yards across {City} and the surrounding area since 2017. Nearly 5,000 Washington properties served.

## F — Spencer / trust line (testimonial block intro)
> You're dealing with Spencer and his team directly — veteran-owned, Washington-based, mole-focused since 2017. Not a call center, not a franchise.

---

## Keywords to weave naturally (readability + QS message-match)
mole control · mole removal · get rid of moles · mole damage · mole mounds · mole tunnels ·
professional mole control · mole exterminator · {City} · near me · chemical-free · pet-safe · same-day.
**Never:** kill, poison, or any trap-mechanism word (Posture A).

## Acceptance
Each page reads like a person talking to a worried homeowner: recognises the problem, answers the
real objections (cost / safety / recurrence / speed / area), and points to one clear call. Run
humanizer ≥8.5 on A-F before commit; Posture-A scan clean; re-run `_got-moles-lp-audit.mjs`.
