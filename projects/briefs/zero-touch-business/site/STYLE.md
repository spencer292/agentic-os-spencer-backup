# Route Ready — Article Conventions (STYLE.md)

_Read by every content-writing agent and the site build script. v1 2026-07-19._

## Brand
Route Ready (routereadykits.com). Voice: plain-spoken operator who grew a route-based service company to 5,000 clients. Direct, practical, a little dry-humored. Never corporate, never listicle-fluffy. US English only.

## File format
Markdown in `site/content/guides/{slug}.md` with frontmatter:

```yaml
---
title: "..."            # ≤60 chars, includes target keyword naturally
slug: "..."             # kebab-case, matches filename
description: "..."      # ≤155 chars meta description, front-loads the answer
date: 2026-07-19
cluster: cleaning | pressure-washing | lawn-care | operator
keyword: "exact target keyword"
cta: CTA_CLEANING | CTA_GENERIC   # token; build script resolves from config.json
---
```

## Structure (GEO/AEO — non-negotiable)
1. **Answer box first**: opening ≤80-word paragraph that directly answers the query (a price range, a definition, a verdict). No throat-clearing.
2. H2s phrased as the questions people actually ask; each H2's first sentence answers it.
3. At least one **table** (pricing tables strongly preferred) and one **bulleted checklist**.
4. A short **FAQ section** (3-5 Q&As) near the end.
5. End with a 2-3 sentence CTA block: `{{CTA}}` on its own line where the build script injects the branded CTA linking to the `cta` token target.
6. 1,200–1,800 words. Internal links to sibling guides as relative links `/guides/{slug}/` — link 2-3 siblings where natural.

## Honesty rules (hard)
- No invented statistics, no fake case studies, no "our customers say". Operator experience framed as operator experience.
- Price figures: realistic 2026 US suburban ranges, stated as ranges with "varies by market."
- Legal/regulatory: "varies by state/county — verify locally." Never claim compliance.
- Template/contract guides must include the not-legal-advice line.

## Product references
- Cleaning articles → Cleaning Business Starter Kit ($49) via CTA_CLEANING.
- Pressure washing / lawn care articles → CTA_GENERIC (free cheat sheet; their kits ship later — never claim those kits exist yet).
- Mentioning *The Route* (the founder's book on recurring-revenue service businesses) is allowed once per article max, where genuinely relevant.
