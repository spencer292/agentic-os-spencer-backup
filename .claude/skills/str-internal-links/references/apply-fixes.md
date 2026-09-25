# Apply-Fixes Mode

Reference for `str-internal-links` Step 11. This mode does not re-audit. It executes a fix list that already exists.

## A1. Find the audit

Read the most recent `projects/str-internal-links/{YYYY-MM-DD}_{site-name}-audit.md`, sorted newest first. Where several exist, ask which one to apply from. Where none exists, tell the user to run the audit first.

## A2. Confirm scope

Present the P1 list and propose a scope, separating the small batches from the large ones. A sitewide in-content link pass across every post is its own run, not a rider on a handful of block edits. Wait for confirmation. Never silently apply the whole list.

## A3. Block-level fixes: cross-links, hub navigation, variant-page links

For each confirmed fix:

1. Read the files named in the audit's "files to edit" column.
2. Insert the block at a position that preserves the site's section background alternation rule. Where the design system defines one, follow it exactly. Where in doubt, add two blocks rather than one so downstream backgrounds do not flip. The design system's page-structure checklist is a gate, not a reference, and its component background options are not a menu when the checklist bans some of them.
3. Use existing block types rather than inventing new ones. A feature-grid block usually supports a link and link text per item, and a service-area block usually supports arbitrary name and URL pairs.
4. Prefer descriptive, disambiguated anchor text. "Gutter cleaning in {town}" beats "{town}". "See the year-round plan" beats "learn more". Every anchor passes the Step 5 disambiguation guard, and a meaningful share across the batch carries the brand.
5. The block type that most easily creates a mesh is the one that lists sibling locations. Before adding one to a location or variant page, re-read Step 6b. These pages link up to hubs and out to specific proof. Do not use that block to add a ring of neighbouring pages.

## A4. In-content body links

For each post in the target list:

1. Read the content sections in the blog or content data source.
2. Identify two to three natural sentences per post where a link helps rather than interrupts. Priority order: the single most relevant service or product page, then one or two related posts in the same cluster, then a location page where the post genuinely names that place.
3. Edit the body string to an inline markdown link.
4. Link rendering depends on the target framework's rich-text renderer parsing markdown links. **Confirm the parser handles them before running a batch.** Where it does not, extend the builder first, per the rich-text builder rule in `str-onpage-audit`'s production-flow reference. Skipping leaves the pillar low, and hand-writing editor JSON is brittle.

## A5. Publish the affected content

Run the project's publish or reseed command for the affected slugs. Content-body changes usually need the flag that deletes and recreates entries so body-level changes propagate, while leaving other collections untouched.

Where the project's publish script has no such flag yet, add it first, following the existing pattern: parse the flag, find existing entries by slug, delete the targeted ones, recreate them with the updated body. Never hand-edit the CMS database.

## A6. Verify and deploy

1. Run the production build to catch type errors before pushing.
2. Smoke-test on staging. Spot-check one post and one service page to confirm links render as real anchors rather than literal markdown.
3. Commit per fix cluster rather than per edit, with messages referencing the audit.
4. Push, then follow whatever deploy path the workspace documents in its `AGENTS.md`. Where the deploy path is not this repository, report the fixes as **staged**, not deployed.

## A7. Update audit status

- Set the frontmatter `status` from `draft` to `partially-applied` or `complete`.
- Add an `applied_at` field.
- Append a note at the bottom listing the applied commits and the date.

## Apply-fixes rules

- Never apply fixes silently. Confirm scope first and show what was done after.
- Where a fix list names infrastructure that does not exist yet, build the infrastructure first, test it on one item, then roll out.
- Run the build **before** publishing content. Broken code plus updated data is the worst recovery case.
- Any new prose runs through `tool-humanizer`, deep mode where `brand_context/voice-profile.md` exists. Zero em dashes.
- Never quote a time or effort estimate. Rank by impact, risk, dependency order and reversibility.
- Never add a blanket template-level location-link block. Per-page topical mapping only. Anchor diversity beats link volume.
