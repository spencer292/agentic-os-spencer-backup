# Build notes

## v2 REBUILD (2026-07-10) — multi-workflow architecture

Spencer's rules locked in (see brief v2 section): 07:00–18:00 hard work window all 3 techs;
jobs slide to any day in window EXCEPT sets (first visits) which are date-pinned + priority C
(unfit sets come back unscheduled + flagged, never silently moved); 10 min/check, 20 min/set;
2×/day cadence — evening ~19:00 (tomorrow→+7) + morning finishing by 05:00 (day-ahead).
**New freeze rule: today is writable only BEFORE 05:00 PT; frozen after.**

### WF-1 CREATED (inactive): `YxKaiU1IAAmMkDLh` "Route v2 WF-1 — Push Jobber → OptimoRoute"
https://gotmoles.app.n8n.cloud/workflow/YxKaiU1IAAmMkDLh

- Nodes: Manual/parent triggers → Config → Window (freeze guard) → Fetch visits (Jobber GraphQL,
  native cursor pagination 50/page, max 30 pages) → Build orders (Code) → IF dry → Summary → Notion log;
  live branch: Emit orders (maxOrders cap, 0=noop) → create_order per order (batch 4, 600ms) → Summary live.
- **Key mechanics:** `operation: SYNC` + orderNo = `<jobNumber>-<visitNumericId>` (visit-unique —
  idempotent re-push, immune to the job-number collision that scrambled the board);
  `assignedTo.serial = tech full name` (territory hard lock, no-tech visits skipped+flagged);
  `allowedDates` = window for regular visits, pinned single day for sets; durations 10/20;
  `acceptPartialMatch/acceptMultipleResults: true` (job-6028-class addresses geocode);
  set detection = visit PT date == job.startAt PT date (verified against live data — ongoing trap
  checks all have job.startAt months back).
- API facts verified against live OR docs: create_order `operation` ∈ CREATE/UPDATE/SYNC/MERGE
  (SYNC = create-or-update, replaces all sent fields); `allowedDates {from,to}` (empty = UNRESTRICTED —
  must always set it, incl. pinning sets); start_planning supports `dateRange`, `balanceBy: WT`,
  `clustering: true`; driver `workTimeFrom/To` = hard route ceiling (verify 07:00–18:00 once in OR UI —
  `update_driver_parameters` unschedules routes, never set per-run).
- Untested plumbing (check on first editor run): n8n pagination merging `variables.after` into the
  JSON body; Jobber cost at 50/page with nested assignedUsers (drop to 25 if throttled).
- Safety: no webhook trigger this time (v1's open webhook was a hole). dryRun=true, maxOrders=0
  defaults; live push requires explicit maxOrders>0.

### v2.1 update (same session) — email-freeze + week window + pin rule (WF-1 updated in place)
Spencer's operating model: Friday slates ALL of next week (before day-before-14:00 customer emails);
slated people never move days after; new bookings fill into existing routes; 2×/day sync continues.
Encoded in WF-1:
- **Email-freeze guard (Window):** date D locks 14:00 PT on D-1. Today never writable; after 14:00
  tomorrow locked too (minOffset 2). `lateOverride` bypass for testing only.
- **Week window (Window):** `days=-1` (default) → Mon–Thu: through this Sunday; Fri–Sun: through
  NEXT Sunday. Friday run = whole-next-week batch baseline, emergent, no special mode.
- **Pin rule (Build orders) — window-width sentinel (v2.2):** `pinned = isSet || (time != 00:00
  && window <= 6h)`. Tight window (+3h optimizer writes) = committed day. WIDE window (12h
  placeholder) or anytime = floats. Convention: placeholder = **07:00–19:00 PT** — Spencer will
  hand-set the same on new jobs; changing the convention requires updating WF-1's pin rule.
- **WF-3 CONFIRMED NEEDED (Spencer):** Jobber only emails arrival windows if visits have time
  windows — ALL future visits need one. One-time backfill, then manual placeholder on new jobs.
  Scale: 64,821 UPCOMING future visits (recurring jobs generate far ahead) → too big for n8n;
  built as supervised script `backfill-time-windows.mjs` (scan → report → live --max N;
  resumable state in `backfill-state.json`; single sanctioned token refresh with rotation
  persisted; 200ms write throttle + THROTTLED backoff). Run pattern: scan (read-only) →
  live --max 20 canary (check no tech/customer notification storm) → drain in chunks.
- Cadence target: ~04:30 + ~13:00 PT (13:00 = final pass for tomorrow before its emails).
- Explicit `fromOffset`/`days` overrides still accepted via trigger body for testing.

### WF-2 CREATED (inactive): `QEKz72NTP8YRZsUS` "Route v2 WF-2 — Optimize + write-back OR → Jobber"
https://gotmoles.app.n8n.cloud/workflow/QEKz72NTP8YRZsUS

- Flow: Config → Window (same email-freeze + week-window as WF-1) → [skipPlanning bypass] →
  `start_planning` (dateRange = window, balancing ON, balanceBy WT, clustering true, startWith
  CURRENT, lockType NONE) → poll `get_planning_status` every 15s (guard: throw on status E*/
  >40 polls) → `get_routes` per date → Collect → Fetch Jobber visits (paginated 50/pg) →
  Build plan (Code) → dry Summary / live Emit→`visitEditSchedule` (batch 4, userErrors) → Notion.
- **Join:** orderNo `<job>-<visitNum>` → decode Jobber visit gid → match by visit numeric.
  Unparseable/unmatched orderNos = orphans (counted, never written).
- **DELTA GUARD:** committed visits (tight ≤6h window) or sets that would CHANGE DAYS —
  >5 of them aborts the run before any write (pins should make this impossible; tripping it
  means an upstream bug). Day-moves of floating visits = normal slating, reported not blocked.
- **Move report in Notion:** every day-move listed (SET!/WAS-COMMITTED! flagged), unrouted sets
  called out as "DECIDE", tech mismatches (should be 0 — hard-locked), orphans, unrouted count.
- Config: dryRun=true/maxWrites=0 defaults; `skipPlanning=true` re-reads existing OR plan +
  writes back without re-optimizing (useful for retry-after-inspection).
- Untested plumbing (first-run checks): start_planning response field `planningId` + status
  enum ('F…' assumed = finished), Wait-node loop-back, pagination merge (same as WF-1).
- Write-back sets optimized start + 3h window (`windowHours` in Config) — this tight window is
  what flips a visit to "committed" for all future runs (pin rule).

### WF-3 (parked): evening time-fix for anytime visits. WF-4 (parked): tech-added-visit watcher —
Jobber events already stream into n8n via `gFYppNw0cFZKuHpA` (QUOTE_UPDATE observed, HMAC-signed).

---

# v1 build notes — Phase 1 & 2 progress (superseded by v2 above)

## Validated against live data

**Phase 1 (join + roster) — 2026-07-06 dry-run:**
- `orderNo` = Jobber job number. 96/96 OptimoRoute stops matched a Jobber visit. 0 orphans.
- All 4 drivers resolve to Jobber users by exact full-name match.

**Phase 2 engine (full change-plan) — 2026-07-08 dry-run (a real future day):**
- OptimoRoute plan: 101 stops (Cammeron 31, Cory 28, Luke 24, Spencer 18). Jobber active visits: 210.
- **[1] Write-back: 101** visits in the plan → assign tech + time.
  - **Tech changes: 0** — technicians are already correctly assigned in Jobber (fixed territories hold).
  - **Time changes: 101** — every one is still "anytime" in Jobber; the automation sets the optimized
    time (e.g. job 4776 → 16:29, job 5066 → 07:57). **Setting times is the main work, not moving people.**
  - Orphan OR orders (no Jobber visit): 0.
- **[2] Time-fix: 109** anytime visits not yet routed → set 07:00–19:00 so they become routable.
- **[3] Overflow flags: 0** timed visits that OR failed to route.

### Key logic correction (found by the dry-run)
On a future day, Jobber visits are ALL still "anytime" while OptimoRoute has already planned them.
So the write-back rule is: **plan membership decides the write-back, not whether Jobber already has a
time.** Any visit in the OR plan gets its OR tech + OR time written; only visits NOT in the plan and
lacking a time get the generic 07:00–19:00 fix. (Encoded in `reference-engine.mjs`.)

## Status

- **Engine logic (the n8n Code-node content): built and validated.** `reference-engine.mjs` is the
  reference implementation — join, classify, time-fix, write-back plan, freeze-today guard.
- **Remaining Phase 2 (n8n assembly): gated on the OptimoRoute key rotation.** Turning the engine into
  the live scheduled workflow needs the rotated key in an n8n credential (+ Jobber token-refresh nodes).
  Once the key is in: assemble nodes → push inactive → dry-run in n8n → approve → activate.

## Deployed (2026-07-06)

- **n8n workflow created INACTIVE:** `Route Sync — Jobber ⇄ OptimoRoute (v1, dry-run)`
  - id `gr8kf904tjC2ckcA` — https://gotmoles.app.n8n.cloud/workflow/gr8kf904tjC2ckcA
  - Source: `n8n-workflow.json` (generated by `scratchpad/build-workflow.mjs`).
- **Nodes:** Manual Trigger → Config → Plan (Code) → Apply (Code) → Summary (Code) → Email (disabled).
- **Safety defaults in Config:** `dryRun=true`, `maxWrites=0`, freeze-today guard in Plan,
  `userErrors` checked on every mutation. Email node disabled until an SMTP credential exists.
- **Only placeholder:** `Config.optimoKey = PUT_ROTATED_OPTIMOROUTE_KEY_HERE`.

### To prove it (final step — after key rotation)
1. Paste rotated OptimoRoute key into `Config.optimoKey`.
2. Confirm the `Jobber OAuth2` credential (id MNPCi55yYggze27I) resolves on the Plan/Apply Code nodes
   (attach in UI if n8n doesn't inherit it from JSON).
3. Run manually (dryRun=true) → compare the Summary to the local dry-run for the same date.
4. Flip `dryRun=false`, `maxWrites=1` → single-visit live test → verify in Jobber.
5. Raise maxWrites, add Schedule triggers (evening/morning) + wire the email SMTP credential, then activate.

### Untested-in-n8n caveats (logic validated locally, plumbing not)
- Could not execute in n8n (no key; the n8n API can't trigger manual runs) — first UI run may need
  small fixes, most likely the Jobber credential attachment on Code nodes and the email SMTP setup.
- Multi-day week loop is deliberately deferred: prove single-date (tomorrow) first, then wrap the
  Plan/Apply pair in a loop over the next 7 days.

## PROVEN END-TO-END IN n8n (2026-07-06)

Ran the workflow via a temporary webhook in **dry-run** — HTTP 200, real result for 07-07:
`OR stops 102 | Jobber visits(page1) 30 | write-back 30 (set-time 30, assign 0) | orphan 72 (pagination pending)`.
Both integrations authenticate; nothing was written.

**Credentials created in n8n (key/token never surfaced):**
- OptimoRoute: `httpQueryAuth` id `cA1fagf9j84ZWxnu` ("OptimoRoute API") — key pulled from `.env`.
- Jobber: `oAuth2Api` id `414IO8xZGgF2ztgx` ("Jobber OAuth2 (auto)") — fresh token minted from the
  `.env` refresh token. (The old `MNPCi55yYggze27I` "Jobber OAuth2" credential was stale — replaced.)

**Architecture correction:** n8n Cloud blocks `helpers.httpRequestWithAuthentication` inside Code
nodes, so all Jobber/OptimoRoute I/O is in HTTP Request nodes; Code nodes are pure logic.

**Progress (2026-07-06, cont.):**
- ✅ **Pagination DONE** — 3 cursor-chained pages (Jobber caps first:100; dropped nested
  assignedUsers to stay under the cost limit). Full dry-run for 07-07: OR stops 102, visits 209,
  write-back 102, time-fix 106, overflow 1, **orphans 0** — every visit reconciles.
- ✅ **Write path BUILT + proven end-to-end (LIVE branch, 0 writes)** — `Plan → IF(dryRun) →`
  dry `Summary` OR live `Emit writes → Jobber mutate → Summary live`. Config accepts overrides from
  the request body (dryRun / maxWrites / runDate). maxWrites caps writes (default 0 = none). Mutation
  builder + userErrors aggregation verified with a real live-branch run that wrote nothing.
- ⏸ **NOT yet done: a real mutation.** One single-visit live write (maxWrites:1) is the last proof —
  **held for Spencer's OK** because visitEditSchedule *may* notify the customer (confirm Jobber's
  notification setting first). Freeze-today still applies (writes only tomorrow+).

**Progress (2026-07-06, cont.):**
- ✅ **First live write PROVEN + verified.** maxWrites:1 wrote job 5055's visit time to 07:53 Pacific
  (+3h window) on 07-07 — matches OptimoRoute's plan exactly. Confirmed by reading the visit back.
- ✅ **Multi-day loop DONE (parent/child).** Parent `XLhh2TB89NwSlBRX` ("Route Sync WEEKLY (parent)")
  generates tomorrow→+N, runs child `gr8kf904tjC2ckcA` once per date (Execute Workflow, mode=each),
  aggregates into one summary. Proven with a 2-day dry run; `days` defaults to 7.
  Idempotency confirmed: 07-07 dropped from 102→101 time-sets after 5055 was already written.

**Two workflows now (both INACTIVE):**
- Child `gr8kf904tjC2ckcA` — single-date engine (triggers: manual, webhook `route-sync-test`, parent).
- Parent `XLhh2TB89NwSlBRX` — weekly loop (triggers: manual, webhook `route-sync-week`, schedule
  18:00 + 05:00 cron). Note: n8n must have the CHILD published before the parent can activate.

**Remaining to go live (all small / need Spencer):**
1. **Flip to live** — the `Days` node defaults dryRun=true. Set dryRun=false (and maxWrites high, e.g.
   9999) for real writes. Recommend one full 7-day dry run first, then flip.
2. **Email** — both email nodes are disabled; need an SMTP/Gmail credential in n8n, then enable.
3. **Schedule timezone** — verify the 18:00/05:00 cron fires in Pacific (n8n Cloud instance TZ).
4. **Assignment writes** (optional) — currently times only; techs were already correctly assigned in
   all samples. Add visitEditAssignedUsers if assignments ever drift.
5. Remove the temporary `Webhook (test)` nodes once on schedule.

## n8n node map (to assemble on unblock)
Schedule (evening + morning) → Freeze-today guard → Jobber token refresh → per-day loop:
Jobber visits (paginated) + OptimoRoute get_routes → Build change-plan (Code, = reference-engine) →
[dry-run: email only] / [live: visitEditSchedule + visitEditAssignedUsers with userErrors checks +
time-fix visitEditSchedule] → Email summary.

## Notion delivery (2026-07-06, cont.) — DELIVERY SWITCHED FROM EMAIL TO NOTION
- ✅ Notion DB **🚚 Route Sync Log** (id `19265c126f534b8fa59b98856c42531d`, data source
  `f43849e1-9adb-4eb7-a2d8-6ecd6ec5e560`). Cols: Run, Mode, Days, Scheduled, Time-fixed, Errors, Summary.
- ✅ `NOTION_TOKEN` (personal access token) in `.env`; direct write test succeeded.
- ✅ n8n credential **Notion API** (`httpHeaderAuth`, id `3O7pd2vMtCIPXUqu`).
- ✅ Parent rewired `Aggregate → Notion log` (email removed); child emits `metrics`, parent sums to 1 row/run.
- ⏳ End-to-end parent→Notion run NOT yet confirmed — blocked by the Jobber-auth issue below.
- (Email route abandoned: Workspace admin-locked app passwords / OAuth-only. Notion fits the "review in Notion" rule.)

## ✅ STATUS: LIVE IN PRODUCTION (2026-07-06)
- Parent `XLhh2TB89NwSlBRX` flipped to **dryRun=false, maxWrites=500/day**, both workflows ACTIVE,
  schedule **05:00 + 18:00 America/Los_Angeles**. Writes tomorrow→+7, freeze-today protected,
  logs one row per run to the Notion **🚚 Route Sync Log**.
- Durable Jobber auth SOLVED: n8n-native OAuth credential **Jobber OAuth2 (native)** id
  `NitrghZSAjZamvqp` — connected via n8n UI (key fix: credential **Authentication = Body**, not Header;
  Jobber wants client creds in the body). n8n self-refreshes it now. Child Jobber HTTP nodes point at it.
- Proven live: single write (job 5055, future) + batch write (2 on 07-01 completed visits, 0 failures),
  both verified. Idempotent (re-run drops changes to 0). Full 7-day dry run: 387 scheduled + 535 fixed, 0 err.
- Notifications: Spencer confirmed Jobber currently does NOT send times to customers; acceptable to go live.
- **Pause anytime:** deactivate "Route Sync WEEKLY (parent)" in n8n. **Run first live now:** `run-live-now.mjs`.
- Loose ends (non-blocking): Jobber **CLI** `.env` token stale (automation uses n8n auth, not this) —
  re-auth `jobber-api.mjs auth` if CLI tools wanted; delete leftover `.scratch-n8n/`; added `allowPast`
  override for past-date testing (default false).

## SUPERVISED ONE-DAY MANUAL RUN — Friday 2026-07-10 (2026-07-09 session)

NOT the scheduled automation (parent `XLhh2TB89NwSlBRX` stayed OFF) and NOT the rebuild — a manual,
checkpointed run of the correct end-to-end flow for a single day, done by hand under Spencer's eye.

- **Ingest→optimize→write-back all executed cleanly.** Jobber 07-10 had 91 visits on correct techs
  (Cammeron 35, Luke 29, Cory 27). Pushed 90 to OptimoRoute (deduped the 7494 double-booking),
  optimized, wrote 90 optimized times back to Jobber. 90/90 verified.
- **Key method fix (do this in the rebuild):** create orders with a UNIQUE orderNo per run
  (`<job>-0710`) + `operation:CREATE` via **`create_order`** (the only endpoint that geocodes).
  Plain orderNo=jobNumber is UNSAFE — recurring customers reuse job numbers across dates, so
  `create_or_update_orders` update-matches by orderNo and can DRAG another date's order onto the
  target day (observed live: orders 8061/8084 moved onto 07-10; cleaned up). Bulk endpoint also does
  not geocode. Lock techs with `assignedTo.serial = <tech full name>` (OR driver serial == full name).
- **Write-back:** `visitEditSchedule` start=optimized Pacific time, endAt=+3h window, TZ
  America/Los_Angeles, via sanctioned `jobber-api.mjs`. Jobber cost-throttles heavy visit reads —
  paginate at 25/page with backoff.
- **Left for Spencer:** delete duplicate visit for job 7494 (`…MjI0MDE2Njg0Ng==`; kept `…Njc0NA==`).
- Reusable scripts staged in scratchpad (fetch-visits / build-orders / create-all / writeback).

## (RESOLVED) durable Jobber auth — kept for history
- Jobber tokens are short-lived (~1h) AND the app uses **refresh-token rotation**. The bootstrap
  (minting from the CLI's `.env` refresh token into an n8n credential) is NOT durable: n8n doesn't
  reliably auto-refresh a hand-injected credential, and minting **rotated the shared `.env` refresh
  token** — so the CLI's `.env` Jobber auth is ALSO stale now.
- **Fix A (recommended): n8n-native Jobber OAuth.** Jobber Developer Center → add redirect URI
  `https://gotmoles.app.n8n.cloud/rest/oauth2-credential/callback`; in n8n create an OAuth2 credential
  (Jobber auth/token URLs + client id/secret) → **Connect** to authorize. n8n then owns an independent
  self-rotating token — no `.env` conflict, no expiry. Repoint child's Jobber HTTP nodes at it.
- **Fix B (interim): re-auth CLI** (`jobber-api.mjs auth`) → refreshes `.env` → re-run
  `create-jobber-cred.mjs`; expires again ~1h. Consider turning OFF token rotation in the Jobber app.
