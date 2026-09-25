# Marketing — Open Findings

Live register. **Read at the start of every `mkt-cmo` session.** One row per finding, newest
first within severity. Close a finding by moving it to the Closed section with the date and what
fixed it — never delete.

Severity: **HIGH** = money or measurement is actively wrong · **MEDIUM** = a decision is blocked
or an asset is at risk · **LOW** = worth fixing, not urgent.

| ID | Finding | Severity | Status | Source |
|---|---|---|---|---|
| **F-01** | **85% of Jobber client records carry `leadSource: unknown`.** Channel CAC and cost-per-booked-job are not computable for most of the book, so no channel — vendor-run or in-house — can be honestly evaluated. Fix is at intake, not in a campaign: make source required for office and Voice Assist bookings, land CallRail source on the Jobber client record, and close the ScoreApp quiz-completion loop. Highest-leverage item on this seat | **HIGH** | OPEN | `acc-cfo` SKILL.md, model-cac section |
| **F-02** | **Client-count claim conflict.** `brand_context/positioning.md` publishes "nearly 5,000 clients served" / "4,973 clients"; the 2026-08-06 Jobber pull behind `tmcp-conversion` counts **2,907 client records**. Gap ~2,000. Possibly cumulative-vs-current, possibly a scoped pull. Until resolved, publish no client count anywhere | **HIGH** | OPEN | This build, 2026-08-26 |
| **F-03** | **Meta pixel, audiences, contact list and sending-domain DNS ownership all unknown.** Each is permanently lost in a bad vendor exit. Must be established before any conversation with DigiHammer about the future of the retainer | **HIGH** | OPEN — Phase 0 | This build, 2026-08-26 |
| **F-04** | **Revenue baseline conflict, inherited from `acc-cfo`.** Trailing-12 revenue reads $857,312 (2026-07-21, 8,716 Jobber invoices) while `context/MEMORY.md` reports TMCP MRR $74.2K (2026-08-11) — ~$890K annualized from the recurring program alone, more than the whole company's trailing 12. Roughly $400K apart. Any marketing-spend-as-%-of-revenue argument is unreliable until it resolves | **HIGH** | OPEN — owned by `acc-cfo` | `acc-cfo` SKILL.md |
| **F-05** | **`brand_context/positioning.md` carries retired claims** — "219+ five-star reviews" (superseded 2026-08-21 by 283 five-star / 289 total) and an unclarified "refined over 15 years" (15+ years is Spencer's personal experience; the company was founded 2017). The file is shipped and cannot be edited on this install, so `references/claims-gate.md` supersedes it and every copy pass must use the gate's numbers | **MEDIUM** | OPEN — mitigated by the claims gate | This build, 2026-08-26 |
| **F-06** | **ScoreApp quiz completion is untracked.** The warmest lead signal Got Moles produces happens off-site and is tied to neither GA4 nor the Jobber record. Carried forward as OI-02 from the marketing-os reality doc, 2026-05-31, still open | **MEDIUM** | OPEN — needs Roy | `got-moles-marketing-os/REALITY-2026-05-31.md` |
| **F-07** | **Meta has browser-side pixel only, no Conversions API.** 30–72% of mobile signal lost (`ESTIMATE`, 2026-04-17), so Meta optimization runs on partial data and any Meta result should be read with that stated. CAPI is server-side work — a brief for Roy | **MEDIUM** | OPEN — needs Roy | `got-moles-marketing-plan` brief |
| **F-08** | **Historical paid CPL of ~$10 is not credible as a result.** US pest-control benchmarks run $40–120. Either the lead definition is loose or the campaigns ran on near-zero-competition long-tail. The number has been used as evidence the account performed well; it cannot support that until the lead definition is established | **MEDIUM** | OPEN — Phase 1 | `google-fb-ads-rebuild/00-discovery-and-strategy.md` |
| **F-09** | **700 repeat Quick Fix customers have never been offered the program** (357 with a job inside 24 months). Highest-return, lowest-cost conversion available, and it converts transaction revenue into recurring revenue. Not a defect — an unclaimed asset, tracked here so it does not get lost behind campaign work | **MEDIUM** | OPEN — Phase 3 | `tmcp-conversion`, Jobber pull 2026-08-06 |
| **F-10** | **Google Ads keyword status is not on any recurring check.** The failure mode is "Eligible (limited)" — throttled delivery, green dashboard — which is what happened to the previous agency's account. Belongs in the monthly paid review and is not there yet | **MEDIUM** | OPEN | `google-fb-ads-rebuild`, 2026-05-04 |
| **F-11** | **LSA rodent-vs-wildlife classification unverified.** Google removed the Wildlife Removal job type from the Pest Control vertical in June 2024; moles must sit under rodent, and wildlife language on the landing page can take LSA dark silently. Sourced 2026-05-04 and never confirmed against the live account | **LOW** | OPEN | `google-fb-ads-rebuild`, 2026-05-04 |
| **F-12** | **Client ads scripts in `scripts/` are pinned to Google Ads API v23** while the `ops-google-ads` engine runs v24. Refresh when next touched | **LOW** | OPEN | `GOT-MOLES.md` |

## Closed

*(none yet — move rows here with the date and what fixed them)*
