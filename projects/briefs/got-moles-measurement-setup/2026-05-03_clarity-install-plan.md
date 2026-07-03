---
title: Microsoft Clarity Install Plan
date: 2026-05-03
status: ready-to-execute
parent_brief: brief.md
related: 2026-04-23_implementation-guide-from-atp.md (Section 3.4)
---

# Microsoft Clarity — install plan

Free heatmap / session replay / rage-click / dead-click / JS error tracking. Owned by Microsoft, GA4-integrated, GDPR/CCPA-compliant out of the box (auto-masks form fields), no session cap.

Specced in the 2026-04-23 implementation guide but never shipped. Picking up now.

## Why Clarity (not Hotjar / Crazy Egg / Mouseflow)

- Free, unlimited sessions (Hotjar free = 35/day cap)
- Native GA4 link — pair Clarity recordings with GA4 conversion events
- Microsoft Copilot AI auto-flags friction patterns
- One-script install, env-var-gated like CallRail
- ATP precedent shipped (commit `657bec2`, project `wg4e7jhmlx`)

## What we'll track on Got Moles

1. **CTA click-through** — Call button, Quote form, TMCP signup. Which get ignored.
2. **Scroll depth on cornerstones** — do visitors reach FAQ / Spencer founder block / pricing
3. **Rage clicks + dead clicks** — visitors clicking non-clickable elements (stat blocks that look like buttons, etc.)
4. **Contact form abandonment** — exact field where the Jobber form loses people

## Execution sequence

### 1. Spencer (5 min) — create the Clarity project

1. clarity.microsoft.com → "Sign in with Google" → pick Got Moles Google Workspace account
2. + New project
   - Name: `Got Moles site`
   - URL: `https://got-moles.com`
   - Industry: Home & Garden
3. Copy the 10-character Project ID
4. Settings → Team → invite `roy@allthepower.co.uk` as Admin
5. Send Project ID to Roy

**Identity rule (per implementation guide Section 1.1):** canonical Google identity = Spencer's Google Workspace account. Same identity already owns GBP and DNS. Do NOT create a separate Microsoft account — use Google OAuth (live since Feb 2026).

### 2. Roy (5 min) — add to Vercel

- Vercel → Got Moles → Settings → Environment Variables
- Add `NEXT_PUBLIC_CLARITY_PROJECT_ID = <10-char ID>`
- Tick Production + Preview, leave plain (not Sensitive — public anyway, ships in client JS)
- Tell Claude when done

### 3. Claude (one commit) — ship to code

- Extend `src/components/Analytics.tsx` with Clarity script block alongside existing GA4/Pixel/Bing UET (consolidated pattern — different from ATP per-tag-per-file)
- Commit + push to `mine/main` → Vercel auto-deploys staging
- Verify `clarity.ms` tag fires in Network tab on staging
- Wait 30-60 min, confirm sessions populate in Clarity dashboard

### 4. Spencer or Roy — wire GA4 integration

- Clarity dashboard → Settings → Integrations → Google Analytics → one-click OAuth to Got Moles GA4 property
- Enables: filter Clarity recordings by GA4 conversion events (e.g. "show me sessions where Call event fired", "show me sessions that bounced from /services/total-mole-control-program")

### 5. First-week review

After 5-7 days of data:
- Top 3 rage-click hotspots
- Top 3 dead-click hotspots
- Scroll depth on each P0 cornerstone (target: 60%+ reach pricing / FAQ)
- Contact form drop-off field
- Mobile vs desktop behavior split

Feeds into the Phase 4 measurement loop alongside the mid-June Pixelmojo re-baseline.

## Gotcha to avoid

When Bing UET is set up (already done), there's a checkbox "Enable Microsoft Clarity" in the UET wizard. **Don't tick it** — Clarity exists as its own project. Ticking it spins up a duplicate Clarity project under a different identity.

## Acceptance

- [x] Project created, Project ID `wndo291wli` (owner = `roy@atpbos.com`, Spencer added as Admin) — 2026-05-07
- [x] Roy added env var to Vercel — 2026-05-07
- [x] Clarity block in `src/app/(frontend)/layout.tsx:63-71`, committed (`6dc319d`), pushed — 2026-05-07
- [ ] `clarity.ms/tag/wndo291wli` fires on got-moles.com — **BLOCKED:** Production alias serving stale deploy `dpl_Es21krjyU7ad4JFncPBudz8KMYnv` that pre-dates env var. Need to promote latest `main` HEAD (`8de0e3e`) to Production via Vercel UI.
- [ ] Sessions appear in Clarity dashboard within 60 min of first visit
- [ ] GA4 integration wired (Clarity → Settings → Integrations → Google Analytics)
- [ ] First-week review notes captured to this folder
