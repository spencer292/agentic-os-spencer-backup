# Production Flow Discipline and Apply-Fixes

Reference for `str-onpage-audit` Steps 6 and 7. Rules A to J are mandatory on any live site with rank equity at stake. They exist because each one records a real failure.

---

## Rule A. Three-layer source-of-truth check

Before scoring any pillar, verify state across every layer the site actually has. A pure static site collapses to one layer. A CMS-backed site has four.

| Layer | Where | What it represents |
|---|---|---|
| Live render | The public URL | What users, Googlebot and AI engines actually see |
| HEAD | `git show HEAD:{file}` | What is committed but may not be deployed |
| Working tree | Local edits | What is about to be committed, regressions included |
| CMS layer | The CMS database or API | The block-data source of truth on CMS-rendered pages. Diverges from the code data file until a publish or reseed runs |

If any layer diverges unexpectedly, stop and reconcile before scoring. An audit scored against the wrong layer is worthless. On CMS-backed routes the CMS render is authoritative: code changes to a page-data module do not affect the live page until the publish or reseed step runs.

## Rule B. The only flow, per fix

For every commit during apply-fixes on a live site:

1. **Edit** the code, whether that is page data, a route file, a schema builder or a component.
2. **Humanise** any new prose through `tool-humanizer`, deep mode where `brand_context/voice-profile.md` exists. **Zero em dashes.** Replace each with a full stop, a comma, or a restructure.
3. **Build.** The production build must pass. Never commit a broken build.
4. **Publish or reseed** if CMS-backed data changed. Skip only when nothing CMS-backed changed.
5. **Stage selectively.** Use Rule D when unrelated uncommitted work sits in the same file.
6. **Commit** with a message naming the audit, the page and the tier.
7. **Push,** and follow whatever deploy path the workspace documents in its `AGENTS.md`. Where the deploy path is not this repository, report the fixes as **staged**, not deployed.
8. **Verify once actually deployed,** against rendered HTML rather than a local preview.

Skipping any step means the fix does not reach production or breaks it. The common miss is committing without publishing, so the live site stays unchanged while git looks clean.

## Rule C. Verify live, not just source

After deploy, verify the rendered HTML.

- **Schema:** raw HTML extraction or the rendered-page endpoint. A text-summarising fetch strips JSON-LD.
- **Crawlability:** fetch `/robots.txt` directly, then diff a JavaScript-enabled render against a JavaScript-disabled one. Never infer crawler access from the site rendering in a browser.
- **Headings:** a summarising fetch is reliable.
- **Images:** alt text is reliable from a fetch. Priority, loading and dimension attributes emitted at runtime need the component source.
- **Internal links:** a summarising fetch undercounts dense grids and card clusters. Count from rendered HTML or component source.
- **Freshness:** a fetch is reliable for a visible "last updated" string.

**CDN cache awareness.** A cache hit can serve stale static HTML after a fresh deploy, and cache-busting query strings do not always invalidate a framework's static prerender cache. Before declaring a deploy broken, probe the data source directly. A small query against the CMS database confirms real state. CDN hits lie; the database does not. One recorded case: an extractor showed seven items after a deploy while the database held eleven the whole time, and the only fault was an edge cache.

## Rule D. Backup, checkout, reapply

When unrelated uncommitted work sits in a file your fix also touches:

```bash
cp src/lib/pages-data.ts /tmp/backup-{tier}.ts     # 1. back up the working tree
git checkout HEAD -- src/lib/pages-data.ts         # 2. reset to HEAD
# 3. re-apply only your fix's edits, not the unrelated work
git add src/lib/pages-data.ts && git commit -m "..."  # 4. commit clean
cp /tmp/backup-{tier}.ts src/lib/pages-data.ts     # 5. restore the working tree
```

This gives a clean per-fix commit and revert point without losing in-progress work.

## Rule E. Rich-text builder capability check

Before applying any fix that needs inline links inside rich-text blocks, check the project's rich-text builder helper. Many hand-rolled helpers support bold only.

Where the helper handles `**bold**` but not `[text](url)`, extend it with a combined pattern such as `/\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g`, emitting the editor's link node shape, and confirm the renderer already handles a link case. Without this, internal-link fixes either get skipped, leaving the pillar low, or get hand-written as raw editor JSON, which is brittle.

## Rule F. Foundation-doc keyword lookup, per page

Before scoring Pillars 2, 3, 4 and 5 for any page, perform an explicit lookup against `target-keywords.md` and emit it as a table in the audit. The lookup is the precondition for those pillars and the evidence base for Gate 1, so the gate result cites this table.

| Field | Source | Live state | Match? |
|---|---|---|---|
| Primary keyword | The tier row for this URL | Extracted from H1, title and body | yes / no |
| Recommended H1 | The tier row's recommended H1 | Live H1 text | exact / close variant / mismatch |
| Disambiguation signal | The brand-disambiguation rules | Present in the H1? | yes / no |
| Secondary cluster keywords, two or more | The cluster query table | Which H2 or H3 carries each | list each, or MISSING |
| Fan-out sub-queries | The fan-out set for this primary keyword | Which H2 answers each | list each covered, or MISSING |
| Queries to avoid | The queries-to-avoid list | Scan of title, H1 and Q&A | none, or list violations |

If the lookup table is absent from the audit output, the audit is incomplete and must be rerun. This rule exists because foundation-doc grounding is easy to skip silently under context pressure. Making the lookup an artefact makes skipping visible.

## Rule G. Output must carry evidence of execution

Every audited page carries three evidence sections, placed **before** the gate table and the pillar table.

| Section | What it proves | What goes in it |
|---|---|---|
| Foundation-doc lookup | The keyword map was actually consulted | The six-row table from Rule F |
| Live verification log | Raw HTML and component code were actually checked | The schema-extraction count and types, the component paths read for image checks, the raw-HTML link count where a summarising fetch would undercount |
| Three-layer reconciliation | Live, HEAD, working tree and CMS state were reconciled | One line per layer, or the divergence and how it was resolved |

**Self-check before saving.** Scan the report for the three section headers per page. Any page missing any of the three makes the report incomplete. Do not save or present it.

### Per-page report block

```markdown
## {Page URL}

### Foundation-doc lookup (Rule F)
| Field | target-keywords.md | Live | Match |
|---|---|---|---|

### Live verification (Rule C)
- Schema: {N} JSON-LD blocks parsed via raw HTML extraction: {types}
- Images: component source read: {paths}; priority, fill and aspect-ratio parent confirmed
- Internal links: {N} counted from rendered HTML

### Three-layer reconciliation (Rule A)
- Live render: {hash or last-deploy timestamp}
- HEAD: {commit short SHA}
- Working tree: clean or divergent ({files})
- CMS publish: {date} or not applicable

### Blocking gates
| Gate | Result | Evidence |
|---|---|---|
| Brand disambiguation | PASS / FAIL / N/A | the offending element and sentence, or the clean scan result |
| Location or variant page | PASS / FAIL / N/A | the stripped text and the closest-matching page |
| Incentivised review | PASS / FAIL / UNVERIFIED / N/A | nodes found and how provenance was confirmed |

### Pillar scores
| # | Pillar | Weight | Score | Notes |
|---|---|---|---|---|

### Surface targets
| Surface | Target | Current | Gap |
|---|---|---|---|
```

## Rule H. Post-fix re-audits run the full evidence chain

Re-scoring after fixes land runs the same evidence-bearing process as the original audit. Never project a pillar delta from "this commit shipped, therefore the pillar went up".

**Why.** On one recorded run, five commits landed and a post-fix score of 89.4 was reported. That number was projected, not measured. A real evidence-bearing re-audit landed at 89.5, close on the number, but it surfaced a misplaced outbound authority link that the projection could never have seen, because a projection counts what the code changed rather than what the page now says in context.

**How to apply.** Same artefacts as the original: the Rule F lookup, the Rule C verification log, the Rule A reconciliation. Pillar scores reference evidence captured during the re-audit. Save the re-audit under a distinct filename suffix such as `_re-audit.md`. Run the same self-check at save.

**Trigger phrases that should fire this rule:** "re-score after this commit", "estimated score lift", "projected pillar delta", "running estimate after these commits", "should clear 90 with these fixes". If any of these appear in your own reasoning, stop and run the extractor.

## Rule I. Visual verification, not just the extractor

Correct HTML is not correct visual output. An extractor can confirm two new H2s, five new list items and a schema node while missing a visible seam between two gradients, a broken image or a layout shift.

**Why.** One commit was declared verified live on extractor evidence alone. A screenshot then showed a visible horizontal line on the page, caused by an unrelated hero and overlay interaction. Without the screenshot the question would never have been asked.

**How to apply.** After every post-deploy extractor probe, open the page in a browser. Scan for section seams and hairlines, broken layout, missing images, unexpected whitespace, alignment shifts and mobile-versus-desktop divergence. Check anything that reads as a line but should not be one, and any sudden tonal break between adjacent sections. Where the site has route-level preview or test pages, use them. A commit is not verified until both the extractor and a visual check have run. Where browser access is not possible, ask the user to confirm visually before declaring it verified.

## Rule J. A design-system page-structure checklist is a gate

Where `brand_context/design-system.md` carries a page-structure checklist, run every rule of it before any insert or edit to page-block data. Treat it as a gate, not a reference.

**Why.** A component's background enum is not a menu of valid options. On one build, a section background was proposed to make a block stand out, and the design system explicitly banned that value. The enum offered five options and the checklist banned three of them.

**How to apply.** Write out the checklist inline in your plan before any block insert. Where a rule is violated, redesign before writing code rather than shipping and reverting. Where legal background alternation is impossible, the block design itself has to do the visual work through typography, whitespace and content density, not through a background swap.

---

## Apply-fixes mode

### A1. Find the audit

Read the newest `projects/str-onpage-audit/{YYYY-MM-DD}_*.md`. Where several exist, ask which one.

### A2. Confirm scope

Present the P1 list and confirm whether to apply all of it or filter to specific pages or pillars. Never silently apply the whole list.

### A3. Apply fixes by type

| Fix type | Where to edit | What changes |
|---|---|---|
| H1 mismatch | The page-block data module or the blog content module | The heading field |
| Meta title or description | The page metadata export or the route's metadata function | Title and description |
| Canonical | The route file | The canonical entry in metadata |
| Crawler block | `public/robots.txt`, hosting firewall config | Allow a blocked agent, remove a WAF or rate-limit rule catching a named crawler |
| JavaScript-render dependence | Component or route | Move primary content into the server-rendered output |
| Schema gap | The schema builder plus the route | Add BreadcrumbList, the `sameAs` spine, `knowsAbout`, `dateModified`, or convert an embedded entity to an `@id` reference. **Never add FAQPage or Speakable as a fix** |
| Answer-first block | Page-block content | Add or rewrite the 40 to 60-word self-contained answer under the H1 and the 40 to 80-word opener under each H2 |
| Fan-out gap | Page or blog content | Add the missing sub-answer section, or link to the page that carries it |
| Disambiguation gate failure | Title, H1, H2 or first paragraph | Add a disambiguating token in the same sentence |
| Freshness | The Article schema builder, block data, sitemap | Make a substantive content change first, then update `dateModified` and `lastmod` |
| Internal-link rewrite | Page-block bodies and blog section bodies | Rewrite the links and their anchors |
| Image alt or dimensions | Component or block level | Alt, width, height, priority props |
| Author byline | The post template | Person schema plus a byline component |

For schema changes: update the shared builder where the change is pattern-level, update the route where it is per-page, and validate before committing.

### A4. Publish CMS content

Run the project's publish or reseed command for the affected slugs. Verify on staging before claiming completion.

### A5. Build and deploy

The production build must pass. Commit per fix cluster rather than per edit, referencing the audit and the page list. Push, then follow the workspace's documented deploy path. Spot-check the staging URL.

### A6. Update audit status

Set the audit frontmatter `status` to `partially-applied` or `complete`, add `applied_at`, and append an applied-commits log at the bottom of the audit.

### Apply-fixes rules

- Confirm scope before applying.
- **Gate failures are cleared before score-lift work.** A blocked page gets its gate fixed first, whatever its number.
- **Never add FAQPage schema, Speakable, an llms.txt file, an AI-markup file or an AI-specific content rewrite as a fix.** None are scored or recommended. Existing markup stays where it is.
- Build before publishing CMS content. Broken code plus updated data is the worst recovery case.
- Respect the site's existing block alternation and page-structure rules, per Rule J.
- Never quote a time or effort estimate on a fix. Rank by impact, risk, dependency order and reversibility.
