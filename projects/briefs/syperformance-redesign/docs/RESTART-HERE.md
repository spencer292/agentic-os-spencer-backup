# Restart brief — SYPerformance rebuild

Paste the block below into a new session.

---

Continue the SYPerformance website rebuild.

**Read first:**
- `projects/briefs/syperformance-redesign/docs/checklist.md` — everything outstanding
- `projects/briefs/syperformance-redesign/docs/ia.md` §4 — the copy rule, before writing any customer-facing text
- `projects/briefs/syperformance-redesign/docs/copy-pilot.md` — three products written as a pilot, awaiting my sign-off
- `projects/briefs/syperformance-redesign/docs/competitors.md` — SpeedFactory / JackSpania / Ichiban analysis + catalogue plan

**Where things are:**
- Live review link: `https://syperformance-build.myshopify.com/` — storefront password `dadiat`. No preview parameter needed.
- Theme `157153820829` "SYPerformance Rebuild" is **published** on the build store. Stock Horizon (`156984213661`) is unpublished as one-click rollback.
- Credentials are in the repo-root `.env`: `SHOPIFY_BUILD_STORE`, `SHOPIFY_BUILD_ADMIN_TOKEN`, `SHOPIFY_BUILD_STORE_PASSWORD`. Verify with `node scripts/check-token.mjs`.
- **Run every script from `projects/briefs/syperformance-redesign/`.**

**Done:** Phases 0–8. Mobile Lighthouse 98/98/96 measured on the live theme against a Phase 0 baseline of 59/77/65 (`docs/performance.md`). Catalogue restructured — 12 new sub-collections, no page over 16 products, all in the nav. 10 brand pages added. Hover menu fixed. Favicon built and shipped.

**Next, in this order:**
1. I still owe answers on `docs/copy-pilot.md` — depth, voice, the `(SY to supply)` approach to specs, the eight compare-at prices on in-house parts.
2. Does SYPerformance actually stock **Competition Clutch**? One product and one brand page exist; if we don't sell it, both should go.
3. The **hub template** — `syp-billet` (110) and `honda` (104) have children now but still render every product instead of showing them as cards. That's the other half of the restructure.
4. Then the 198 product descriptions, 300–500 words each.
5. Then Phase 9 (pre-launch), plus the Phase 7 leftovers in `docs/seo.md` §6.

**Traps this project has already hit — don't repeat them:**
- **Claims.** SYPerformance IS the manufacturer — "we manufacture / we make / our parts" is fine. Never name a shop floor ("machined in our own shop", "cut here", "on our machines"). **Synchro Solutionz and Comp 1 Clutch are INDEPENDENT brands, not house brands** — never describe them as ours or count them as in-house. Don't publish a count of in-house parts; 52 products are still unclassified.
- **Verify against rendered pages and the storefront, never the admin or the theme source.** Saved section settings override schema defaults, and the admin happily displays unpublished collections that 404 for customers.
- **`shopify theme push` now needs `--allow-live`** — the theme is published, so without it the command prompts, does nothing, and reports success.
- **Never use `sed -i` on theme files.** Its Windows scratch files break a running `shopify theme dev` and the server does not recover on its own. Use Python or the editor.
- **`data/product-audit.json` is a Phase 0 scrape of the OLD live site.** Its product ids and its vendor/in-house flags do not match the build store. Resolve products by **handle**, and treat its ownership data as unverified.
- **A collection created via the Admin API is not published to any sales channel** — it 404s until `scripts/publish-collections.mjs` runs. `collectionAddProducts` (V1) also silently adds nothing; use V2.
- **Don't `git add -A`.** The repo has ~250 unrelated Got Moles changes. Stage explicit paths.

**Useful scripts** (all in `scripts/`): `check-token`, `fetch-page`, `screenshot`, `check-templates`, `list-collections`, `build-taxonomy`, `fix-collection-members` (reconciles, adds and removes), `publish-collections`, `test-menu-hover`, `perf-measure`, `perf-score`, `make-favicon`.

Six commits from the last session are on `main` and **not pushed** — `git push backup main` is 113 commits behind overall.

Start by telling me what you'd do first and why, then wait for me.
