---
name: Route Ready Content Publisher
time: '06:30'
days: mon,wed,fri
active: 'true'
model: sonnet
notify: on_finish
description: 'Route Ready (zero-touch-business): writes the next guide from the keyword backlog per STYLE.md, humanizes it, rebuilds the site, deploys. Created dormant 2026-07-19 — flip active at launch (needs deploy hook). Spencer pre-authorized publishing on this channel at launch sign-off.'
timeout: 30m
retry: '0'
---
You are running as a scheduled job for Agentic OS: the Route Ready content publisher.

Project context: `projects/briefs/zero-touch-business/brief.md`. All paths below are relative to that project folder unless rooted.

0. Readiness gate: run `node projects/briefs/zero-touch-business/scripts/ztb-readiness.mjs`.
   If `site_deploy_hook` is false, report "waiting on Phase 0 (deploy hook)" and STOP — do not write content that can't ship.

1. Pick the next topic: read `keyword-backlog.md` and `site/content/guides/` (ls). The next topic is the highest-priority keyword whose slug does not already exist as a guide. Priority order: remaining Priority 1 rows top-to-bottom, then Priority 2, then 3. If everything is written, report "backlog empty — needs refresh" and stop.

2. Write the guide to `site/content/guides/{slug}.md` following `site/STYLE.md` EXACTLY (frontmatter, answer box ≤80 words, question H2s, ≥1 table, checklist, FAQ, `{{CTA}}` token, 1,200–1,800 words, internal links to 2-3 existing sibling guides). Honesty rules are hard: no invented stats, no fake testimonials, prices as ranges, not-legal-advice line on contract/template topics. CTA token: CTA_CLEANING for cleaning-cluster topics, CTA_GENERIC otherwise. Never claim the pressure-washing or lawn-care kits exist unless `site/config.json` tokens contain a live URL for them.

3. Humanize: apply the tool-humanizer skill in standard mode to the new article only (read the skill's pattern-library and replacement-guide references). Preserve frontmatter, tables, tokens, links, dollar figures.

4. Build: from `site/`, run `node build.mjs`. If the build errors, report the error and stop — do not deploy a broken build.

5. Deploy: run `node projects/briefs/zero-touch-business/scripts/cf-deploy.mjs` (deploys site/dist to the Cloudflare Worker `route-ready-site`; attaches routereadykits.com automatically once the zone is active). Report its output lines.

6. Log: append one line to `projects/briefs/zero-touch-business/runs/content-log.md` — date, slug, word count, humanizer score, deploy status. Create the file with a header row if missing.

Rules:
- ONE article per run, ever.
- If the same slug already exists, do not overwrite — pick the next keyword.
- No edits to config.json, build.mjs, or existing articles.
- Keep the summary to ~5 lines: topic picked, scores, build result, deploy status, backlog remaining count.
