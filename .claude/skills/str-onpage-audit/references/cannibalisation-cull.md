# Cannibalisation Cull: the apply-fixes procedure

Reference for `str-onpage-audit` Step 8. **This skill owns execution.** Detection happens in the keyword-strategy skill, in `str-internal-links`, and in the cannibalisation notes of `target-keywords.md`. Until this procedure existed, nothing owned the merge, the redirect or the cull.

It sits here because a cull is an apply-fixes operation on live URLs, and Rule B in `production-flow.md` already governs those. This is the highest-risk procedure in the skill. Everything below is written to make the operation reversible.

## C1. Evidence gate, all three required

No URL is touched until all three sources agree the pair is genuinely cannibalising. One source alone is not evidence.

**Candidate versus confirmed.** `str-internal-links` labels every pair it detects. Keyword overlap or near-duplication alone is a **candidate pair** and is never actionable here. All three evidence sets agreeing makes a **confirmed pair**, and only a confirmed pair enters C2. A candidate pair arriving from upstream goes back for the missing evidence. It is never promoted on judgement.

1. **Overlapping ranked keywords.** Pull `dataforseo_labs/google/ranked_keywords/live` for the domain with an explicit `limit`, group by URL, and find keyword sets held by two or more URLs. Record the overlapping keywords, each URL's position, and which URL Google prefers per keyword.
2. **Search Console page-level clicks over a 16-month window.** Pull per-page clicks and impressions for the overlapping queries from the site's verified Search Console property, using whatever access the workspace has configured and resolving credentials from `.env` by name. A loser that still earns clicks is not a loser. Sixteen months covers seasonality and the last two core updates. Where this step cannot be run, the pair stays a candidate. It never becomes confirmed on two sources.
3. **Internal-link inventory for both URLs.** Every inbound internal link to each URL with its anchor text, from the `str-internal-links` audit or a fresh crawl. This is the rewrite list, and its size is part of the risk assessment.

Write all three evidence sets into the audit before proposing a decision. A proposal without all three is not actionable.

## C2. Decision

Pick exactly one per pair and record the reason.

| Decision | When | What happens |
|---|---|---|
| **Merge** | Both URLs answer the same query and neither is clearly stronger | Fold the loser's unique content into the canonical URL, then 301 the loser |
| **Differentiate** | The two URLs should answer different sub-queries in the fan-out | Rewrite headings, answer blocks and internal anchors so each owns a distinct sub-query. No URL changes |
| **301** | The loser has no unique content worth keeping but holds equity or links | Redirect the loser to the canonical URL |
| **Noindex** | The page has a genuine user purpose but should not compete in search | `noindex, follow`. Keep the URL live and linked |

**Prefer differentiate over deletion wherever the fan-out has room for both.** A fan-out set usually holds more sub-queries than the site has pages, so two competing pages are often two under-specified pages rather than one surplus page.

## C3. Execution sequence, one cluster at a time

Run inside Rule B's only flow. Each step is a separate commit.

1. **Snapshot.** Record current rankings and clicks for both URLs, and copy the current redirect map to a dated backup. The diff between old and new redirect maps is the revert instruction.
2. **Content move.** Fold the loser's unique content into the canonical page. Run new prose through `tool-humanizer`. Zero em dashes.
3. **Redirect-map update.** Add the 301 to the project's redirect configuration. Never leave a chain. Where the loser was already a redirect target, repoint the original source directly at the final canonical URL.
4. **Sitemap update.** Remove the retired URL and confirm the canonical URL's `lastmod` reflects the substantive change made in step 2.
5. **Internal-link rewrite.** Rewrite every internal link from the C1 inventory to point at the canonical URL with a compliant anchor. **No internal link may point at a redirect.** Anchors follow the anchor rules and the disambiguation guard.
6. **Build and publish.** The production build must pass. Publish or reseed where block data changed.
7. **Ship and verify live.** Confirm the 301 actually returns 301 and lands on the canonical URL, and that no internal link still resolves through a hop.

## C4. Post-change monitoring checkpoints

Record all four in the audit file. Do not start the next cluster until checkpoint 2 is clean.

| Checkpoint | What to check | Rollback trigger |
|---|---|---|
| Immediately after deploy | The 301 returns 301 to the canonical URL, the canonical page renders, no internal link resolves through a hop, no build regression | Any failure. Revert the commit |
| After the next full crawl of both URLs, confirmed through URL inspection rather than assumed from a date | The canonical URL is indexed, the retired URL is dropping out, no soft-404 or duplicate-canonical flags | The retired URL is still indexed and outranking the canonical one |
| Two Search Console reporting periods after the crawl checkpoint | Combined clicks and impressions for the merged pair against the pre-change baseline from C1 | Combined clicks materially below baseline |
| Next monthly re-audit | The overlapping-keyword set is no longer split, and the canonical URL holds the positions both URLs used to share | Positions worse than the better of the two originals |

## C5. Hard rules

- **Staged, one cluster at a time.** Never batch multiple clusters into one change set. A batched cull cannot be attributed when traffic moves.
- **Never touch a URL holding a number-one keyword without explicit approval from the user**, named in the audit and confirmed in the session. This is a hard stop, not a preference. Check the ranked-keyword pull for position 1 before proposing anything.
- **Always reversible.** Keep the redirect-map diff, the pre-change content of the retired page, and the C1 baseline. Every cull has a written revert path before it ships.
- **No time or effort estimates** on any cull item. Rank by impact, risk, dependency order and reversibility.
- **Location and variant pages go through their blocking gate first.** A thin location page failing the gate is a substance problem, not automatically a cull candidate. Fix the substance or cull deliberately, and never mass-delete a page set off the back of one audit.
- **The cull queue is a proposal until the user approves it.** Present decisions and evidence. Do not begin C3 unprompted.
