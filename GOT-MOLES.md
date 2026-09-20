# GOT-MOLES.md — Client Operating Rules

Shared Got Moles operating rules for every install of this OS. This file is
**managed in the GitHub repository** (updates arrive via `bash scripts/gm-update.sh`) — do not
edit it locally. Personal additions belong in `CLAUDE.local.md` (user-owned,
never touched by updates).

This is the **dedicated Got Moles install** (US mole-control company, Washington
State; primary contact: Spencer). Brand context lives in `brand_context/`; the
work lives in `projects/`.

## Rules

- **US English spelling for ALL content** (color, customize, organize, neighborhood, etc.) — Got Moles is a US company. Applies to all copy, articles, page briefs, Notion pages, client-facing output.
- **Notion is the review mechanism.** Push deliverables to Notion when created/updated; Spencer and the team review there.
- **No Initiative 713 (I-713) compliance claims.** Got Moles uses professional body-gripping traps. Do not claim I-713 compliance. Message on: chemical-free, safe for pets/children, professional methods.
- **Claims guardrails:** 3 GBP locations, "219+ five-star Google reviews"; "5,000 clients" is safe to publish; "WA's #1" is unsubstantiated — do not use; "15+ years" = Spencer's personal experience (company founded 2017) — always clarify.
- **Website build:** read `projects/briefs/website-rebuild-rebrand/BUILD-METHODOLOGY.md` at the start of every build session. Stack: Next.js 16 + Payload CMS 3.80 + Supabase + Vercel + shadcn/Tailwind v4; design in Figma (Moni); lead gen via ScoreApp.

## SEO / AEO / GEO skill chain (rebuilt September 2026)

**SEO, AEO and GEO for got-moles.com is run by Roy (All The Power), not from this install.** The chain ships here so the methodology is on hand and consistent, but this install does not need the data-source keys. If someone asks for an SEO/AEO audit or keyword work here, say that Roy runs it and offer to note the request for him — do not ask for DataForSEO or GSC credentials.

`str-keyword-strategy` → `str-authority-strategy` → `str-onpage-audit` / `str-internal-links` / `str-ai-seo-local` / `str-question-harvester` → `mkt-authority-content` / `ops-blog-pipeline`. Before any SEO work read the landscape reference `.claude/skills/str-ai-seo/references/search-landscape-2026-09.md` — where a skill and that file disagree, the file wins.

- **DataForSEO** is the primary data source: `node .claude/skills/str-ai-seo/scripts/dataforseo.mjs <endpoint> '<json>' [--out f] [--dry]`, run from the repo root. Keys `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD` (Roy's install only). Pay-as-you-go: always set `limit`, use `--dry` first.
- **Google Search Console:** domain property `sc-domain:got-moles.com` only. The direct-API status scripts read `GSC_OAUTH_CLIENT_ID` / `GSC_OAUTH_CLIENT_SECRET` / `GSC_OAUTH_REFRESH_TOKEN` from `.env` — never hardcode tokens in scripts.
- Standing rules baked into the skills: surfaces are audited separately (Local Pack / AI Overviews / AI Mode / answer engines); the "mole" skin-mole homograph gate is blocking; FAQPage schema and llms.txt are no longer deliverables; Yelp is a tier-1 local asset alongside GBP; review-policy compliance (no quotas, no technician-naming, disclosed incentives) is a P0 check; city pages must pass the doorway-page gate.

## Google Ads operations

The Google Ads account is run through the **`ops-got-moles-ads`** skill. Its script library (the `got-moles-*.mjs` / `_gm-*.mjs` family, 80+ scripts) now lives in `.claude/skills/ops-got-moles-ads/scripts/` — it moved out of `scripts/` in the September 2026 update. Say "got moles ads status", "3-day pulse", "check the mole campaigns" and the skill routes to the right script.

- **Account ID:** `1665761172`. **Run from the repo root** so `.env` resolves. Start with `node .claude/skills/ops-got-moles-ads/scripts/test-got-moles-ads-access.mjs`.
- **Shared engine:** the `ops-google-ads` skill (Google Ads API v24). The client scripts are pinned to **v23** — refresh when next touched.
- **Policy (mandatory):** Posture-A silent-mechanism — no body-gripping/scissor/harpoon/spike/kill/lethal wording in ads. The ~120 medical-cluster negatives in `.claude/skills/ops-got-moles-ads/scripts/_got-moles-existing-negatives.json` are mandatory (mole = skin-mole homograph).
- **Creds are this install's own** — `GOOGLE_ADS_*` in `.env`, set up separately from any other install. The `_got-moles-*.json` data files are a baseline snapshot; regenerate against the live account.

## Website deploy (important)

The live got-moles.com site does NOT deploy from this install. Deployment is managed by Roy (All The Power) through a separate deploy repository. Skills that edit site code end at "build locally + staged for review" — never attempt to deploy, never use the Vercel CLI. Site changes go live through Roy. If you have edited files under `projects/briefs/website-rebuild-rebrand/site/`, tell Roy which ones so they can be carried into the deploy repo.

## Staying up to date

Run `bash scripts/gm-update.sh` from the repo root (or ask Claude: "update the Got Moles OS"). It fetches the shared repo, shows anything that could conflict with your own changes, merges the update on top of your commits, and refreshes dependencies and the memory index. `bash scripts/gm-update.sh --check` previews without changing anything.

Your personal files — `.env`, `CLAUDE.local.md`, your `context/` memory and daily logs, `SKILL.local.md` files, your own projects and cron jobs — are never in an update, so they are never overwritten. **Do not run `scripts/update.sh`** in this install: that script targets the public Agentic OS template, not the Got Moles repo.
