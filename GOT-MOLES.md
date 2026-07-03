# GOT-MOLES.md — Client Operating Rules

Shared Got Moles operating rules for every install of this OS. This file is
**managed in the GitHub repository** (updates arrive via `git pull`) — do not
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

## Google Ads operations

Account-specific scripts are in `scripts/` (`got-moles-*.mjs` / `_gm-*.mjs`); they read `GOOGLE_ADS_*` from this install's `.env` plus the local `scripts/_got-moles-*.json` data.

- **Account ID:** `1665761172`. **Run from the repo root** so `.env` and `scripts/_got-moles-*.json` resolve. Start with `node scripts/test-got-moles-ads-access.mjs`.
- **Shared engine:** the `ops-google-ads` skill (Google Ads API v24). The imported client scripts are pinned to **v23** — refresh when next touched.
- **Policy (mandatory):** Posture-A silent-mechanism — no body-gripping/scissor/harpoon/spike/kill/lethal wording in ads. The ~120 medical-cluster negatives in `scripts/_got-moles-existing-negatives.json` are mandatory (mole = skin-mole homograph).
- **Creds are this install's own** — set up separately from any other install. The imported `_got-moles-*.json` data is a baseline snapshot; regenerate against the live account once creds are in `.env`.

## Website deploy (important)

The live got-moles.com site does NOT deploy from this install. Deployment is managed by Roy (All The Power) through a separate deploy repository. Skills that edit site code end at "build locally + staged for review" — never attempt to deploy, never use the Vercel CLI. Site changes go live through Roy.

## Staying up to date

This install updates by pulling from its GitHub repository: run `git pull` from the repo root (or ask Claude to "check for updates"). Your personal files — `.env`, `CLAUDE.local.md`, `context/` memory, `SKILL.local.md` files — are never touched by updates.
