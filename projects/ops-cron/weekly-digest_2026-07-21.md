## Week of 2026-07-20 — 2026-07-21

*(Only 2 days of session logs exist this week — Monday 07-20 had 6 interactive sessions; 07-21 so far is entirely cron-driven with no interactive session log yet.)*

### Sessions
- 2026-07-20 #1 (zero-touch-business): Route Ready blind-spot fixes — found the Gumroad kit had been silently UNPUBLISHED since launch night (republished, verified buyable), payouts un-paused, dup PDF removed, GSC domain property verified + sitemap submitted, DNSSEC live via Squarespace DS records, `/book`→Amazon redirect shipped with KV click tracking, Google Ads account + MCC + GCP project created and Basic Access application submitted (~5 business day review, expected ~07-27).
- 2026-07-20 #2 (callrail-faq): Mined a year of CallRail transcripts into an FAQ/scenario training doc for new hire Muhammad; built the `ops-phone-roleplay` skill; rewrote the CallRail Voice Assist AI receptionist (wrong pricing/services/counties fixed, persona rewritten, pricing tiers applied after Spencer confirmation).
- 2026-07-20 #3: Fixed confusing Jobber arrival-time client texts — 3-hour arrival windows set on ~570 upcoming jobs, all 6 client message templates rewritten, weekly safety-net cron shipped.
- 2026-07-20 #4 (technician-route-automation): Synced Jobber↔OptimoRoute for the rest of the week (11 new visits + 2 late finds), load-shed Luke's overloaded Tuesday onto Spencer, hand-shaped Tuesday's routes to Spencer's spec.
- 2026-07-20 #5 (callrail-faq): First live phone role-play sessions with Spencer (91/100, 82/100), packaged a self-contained "muhammad-portable" training bundle + zip for email delivery.
- 2026-07-20 #6: Planned an audiobook path for *The Route* — ElevenLabs voice clone for Spotify/Google/direct, KDP Virtual Voice for Audible.
- 2026-07-21: No interactive session — 20 cron-driven auto-captures only (arrival-window sweep, CallRail sync ×9, drift-check ×5, content publisher, ztb digest, skill-update-check, learnings-health skip, memory-gap analysis, memory curator, and 3 blocked jobs — see below).

### Deliverables
- `projects/briefs/zero-touch-business/scripts/gsc-verify-txt.mjs`, `phase0-checklist.md`, `api-access/route-ready-ads-api-design.pdf` — GSC + Ads bootstrap
- `projects/briefs/callrail-faq/data/calls.jsonl`, `2026-07-20_muhammad-faq-training.md`, `2026-07-20_roleplay-scenarios.md`, `2026-07-20_ai-receptionist-answer-bank.md`, `muhammad-portable/` bundle
- `.claude/skills/ops-phone-roleplay/SKILL.md` — new skill, registered in CLAUDE.local.md
- `projects/tool-jobber/scripts/arrival-window-sweep.mjs` + `cron/jobs/jobber-arrival-window-sweep.md` — new weekly safety-net cron
- `projects/briefs/callrail-faq/roleplay-log.md` — training progress log (2 reps scored)
- `projects/briefs/zero-touch-business/site/content/guides/commercial-cleaning-contract-template.md` — 13th guide published to routereadykits.com (07-21, via ztb-content-publisher cron)
- `projects/briefs/zero-touch-business/runs/digest-2026-07-21.md` — Route Ready readiness/sales/ads digest (07-21)
- `projects/briefs/technician-route-automation/drift-runs/*.json` (×5, 07-21) — route sync audit trail
- `context/memory/2026-07-21_gap-analysis.md` — this week's memory-coverage gap report

### Scheduled Jobs
- 98 runs this week (07-15–07-21), 0 failures
- Two FAILURE entries in the logs (`daily-memory-distill` 07-11, `weekly-cash-flow-projection` 07-07) both predate this week's window — no new failures.
- **`weekly-cash-flow-projection` looks stuck:** last run was 07-07 (spawn `ENOENT` failure) — it has not run again since, including this week. Worth checking the cron schedule/registration; it's the only status file with `run_count: 1`.
- Three jobs completed "successfully" but are structurally blocked on missing credentials — confirmed again today, not new: `gmail-daily-triage` (Roy's inbox needs `GMAIL_CLIENT_ID`/`SECRET`/`REFRESH_TOKEN`, not this install's), `meeting-video-archive` (needs `ZOOM_ACCOUNT_ID`/`CLIENT_ID`/`SECRET`, unresolved since 06-25), `meeting-clips-lane` (needs Notion access to Roy's Elevate 360 Meetings DB — no token on this install).

### Learnings Added
- `technician-route-automation`: `update_drivers_parameters` payload shape confirmed; "first job AT hh:mm" and "start driver in area X" route-shaping patterns; verify-abort-loop pattern for owner route edits.
- `tool-browser`: Jobber settings SPA async-save gotcha (template edits landed in the wrong modal until a poll-for-dialog-close guard was added); CallRail settings pages don't auto-save (need explicit per-section Save + reload verify); Google Ads signup wizard skip-to-campaignless-account flow; classifier "human-only zone" map (publish/delete clicks, payout toggles, API-token edits, DNSSEC form fills — batch these as click-lists for Spencer).

### Open Threads
- **Ads:** Basic Access application pending (~07-27); once cleared — create OAuth client/refresh token in the `route-ready-ads` GCP project, add `GOOGLE_ADS_*` creds to `.env`, build the launch Search campaign via browser UI (don't wait on API), link MCC↔client account.
- **Route automation (recurring across all 5 drift-check runs this week):** 4 existing jobs still day-drifted between Jobber/OptimoRoute (#8202, #7857, #7813, #8185) — flagged, not auto-fixed, needs Spencer review. Orphan OR stop `8190-2259447195` (likely stale). Known bug: `drift-check.mjs:420` still uses the wrong `visitEditAssignedUsers` shape (only fires on unassigned-tech visits) — fix next time it's touched.
- **Muhammad onboarding:** training zip/email drafted but not confirmed sent; Spencer to decide his claude.ai account setup; his scorecards still to be folded into `roleplay-log.md`.
- **Audiobook:** confirm a Kindle edition of *The Route* exists (Virtual Voice prerequisite); write the 30-min recording script/spec for Spencer.
- **Memory:** gap-analysis flagged 2 stale Active Threads (cash-flow n8n cred, 15 days idle) and 1 orphaned decision (LinkedIn growth, 15 days, no recorded outcome) — both retained per curator's strict-removal rule, still unresolved.
- **CallRail:** "Text messages" card left Inactive pending a Spencer decision on post-call SMS.

### Freshness Check
- All 11 `brand_context/` files last modified 2026-07-04 (17 days ago) — not yet over the 30-day staleness threshold, but the oldest is now roughly a third of the way there. Nothing to flag yet.
