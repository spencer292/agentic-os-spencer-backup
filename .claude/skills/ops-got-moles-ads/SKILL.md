---
name: ops-got-moles-ads
description: Run the Got Moles live Google Ads account (customer 1665761172) with the account-specific script library in scripts/ — audit, campaign status, keyword research and clustering, campaign builds and restructures, negative-list management, RSA review, conversion and call-tracking checks, and pulse reporting. Triggers on "got moles ads", "gm ads", "ads status for got moles", "check the mole campaigns", "got moles keyword research", "got moles negatives", "got moles RSA", "got moles conversion check", "3-day pulse". Use this for anything touching the Got Moles account. Does NOT trigger for the reusable engine or another account — that is the root ops-google-ads skill. Does NOT trigger for organic SEO (str-ai-seo-local) or the website build (ops-blog-pipeline, ops-cms-content).
---

# ops-got-moles-ads — the Got Moles Google Ads account

Account-specific automation for a **live** account. Everything here writes to a real
advertiser spending real money. Read-only scripts are safe to run; anything named
`apply-`, `build-`, `pause-`, `enable-`, `fix-`, or `upload-` mutates the account and
needs the user's explicit go-ahead first.

- **Account ID:** `1665761172`, under the MCC in `GOOGLE_ADS_LOGIN_CUSTOMER_ID`.
- **Shared engine:** the reusable, SDK-free engine is the root `ops-google-ads` skill
  (Google Ads API **v24**). These client scripts are pinned to **v23** — move them toward
  v24 / the shared engine whenever you next touch one.

## Running the scripts

Run from the **client root** (`clients/got-moles/`), never from inside this skill folder.
Every script resolves `.env` and its data files relative to the current working directory:

```bash
cd clients/got-moles
node .claude/skills/ops-got-moles-ads/scripts/test-got-moles-ads-access.mjs   # connectivity first
node .claude/skills/ops-got-moles-ads/scripts/got-moles-campaign-status.mjs
```

Scripts that cache API pulls write them to `<client-root>/scripts/_got-moles-*.json`.
That folder is a disposable mirror of the root OS scripts (see below) — the caches are
regenerable, so losing them costs nothing. The committed baseline snapshots live in this
skill's `scripts/` folder.

## Why these scripts live in a skill folder

`scripts/update-clients.sh` runs `rm -rf clients/*/scripts` and re-copies the root OS
scripts on every update. On 2026-07-09 that silently destroyed 86 tracked scripts and 6
untracked ones that had been sitting in `clients/got-moles/scripts/`. **A client-only
skill folder is the one location the sync preserves** — shared skill folders (any name
that also exists in the root `.claude/skills/`) are overwritten from root, and everything
in `clients/*/scripts/` is deleted outright.

Never move these files back to `clients/got-moles/scripts/`.

## Policy framework (mandatory)

Posture-A silent-mechanism. **No** body-gripping, scissor, harpoon, spike, kill, or lethal
language in any ad copy. The ~120-keyword medical-cluster negative list in
`scripts/_got-moles-existing-negatives.json` is mandatory — "mole" is a homograph for a
skin mole, and without those negatives the account pays for dermatology traffic. LSA
wildlife-purge and eligible-limited safe-substitution rules apply. No Initiative 713
compliance claims.

## Untracked credential-bearing scripts

Six SEO utilities in `scripts/` (`_aio-baseline.mjs`, `_gsc-status.mjs`, `_gsc-today.mjs`,
`_push-flip-plan-to-notion.mjs`, `_push-indexing-priority-to-notion.mjs`,
`_update-flip-plan-notion.mjs`) carry **hardcoded Google OAuth and Notion tokens**,
inherited from the original repo. They are gitignored on purpose. Scrub the credentials
to `.env` before ever tracking them, and rotate the tokens when you do.
