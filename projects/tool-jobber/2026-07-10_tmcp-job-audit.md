# TMCP Job Count + Tag Audit — 2026-07-10

Source: Jobber GraphQL API. Full sweep of all 4,749 recurring jobs (all statuses) and all
clients tagged `TMCP - Active`. "Active" below = job status is not archived
(upcoming / today / action_required / requires_invoicing).

Program jobs identified by line items (`Total Mole Control Program -- Year round protection`
or `Total Mole Control Package`), plus title/visit-title matches — job titles are blank on
4,646 of 4,749 recurring jobs, so line items are the reliable identifier.

## Headline numbers

| Metric | Count |
|---|---|
| Clients tagged `TMCP - Active` | 577 |
| **Active TMCP program jobs** | **597** |
| Distinct clients holding those jobs | 577 |
| Distinct properties | 597 (every job is its own property) |
| Clients with 2+ TMCP jobs (multi-property) | 10 (accounting for the 20 extra jobs) |
| Active Quick Fix (one-month program) jobs | 88 |
| Active barter / warranty / friends-family recurring jobs | 13 |

Note: 577 tagged and 577 with-jobs is a coincidence — the sets differ by 8 in each
direction (569 clients are in both).

## Multi-property clients (10 clients, 30 jobs)

| Jobs | Client | Job #s |
|---|---|---|
| 10 | Prologis - Sumner Landing | 7610–7617, 7848, 4335 |
| 3 | HyperGreen Landscaping | 7548, 7462, 4926 |
| 3 | Cruz Rodriguez | 6323, 6325, 7789 |
| 2 | Tom Schlimme | 6720, 6890 |
| 2 | Kelly Kunz | 7961, 4515 |
| 2 | Clark Potter | 5536, 5676 |
| 2 | SLPPLLC | 6653, 5511 |
| 2 | Ganesh Thirumalai | 5087, 7834 |
| 2 | Clint Bjornson | 6389, 7371 |
| 2 | Kevin Chen | 7384, 7807 |

All 10 are correctly tagged.

## Missing the `TMCP - Active` tag (8 clients with an active TMCP job)

| Client | Job # (status) | Note |
|---|---|---|
| Briana Watson | 8030 (upcoming) | recent signup |
| Dave Parker | 8042 (upcoming) | recent signup |
| Isaiah Scheel | 8050 (upcoming) | recent signup |
| Jinzhi Liu | 8064 (upcoming) | recent signup |
| Pauline Kabue | 8082 (upcoming) | recent signup |
| Paul Davis | 8146 (upcoming) | recent signup |
| Laura Zarro | 8147 (upcoming) | recent signup |
| Mike Kaiser | 5390 (upcoming) | older job — slipped through some time ago |

7 of 8 are job numbers 8030+ — the tag isn't being applied at signup lately.

**RESOLVED same day:** all 8 tagged via `clientEdit(tagsToAdd)` with read-back verification.
Live count now 584 (Bob Miller's stale tag was removed manually mid-session). Note: Mike
Kaiser now carries both `TMCP - Active` and `TMCP Churned` — Churned likely stale.

## Tagged `TMCP - Active` but NO active TMCP job (8 clients — stale tags?)

| Client | What they actually have |
|---|---|
| Marcus Andy | no active recurring jobs at all |
| Bob Miller | no active recurring jobs at all |
| Connie Schlimgen | no active recurring jobs at all |
| Kim Suver | no active recurring jobs at all |
| Bac Walker | no active recurring jobs at all |
| Aziz El-solh | no active recurring jobs at all |
| Tyler Smythe | 2 active Barter jobs (#7704, #7705) — likely program-in-trade, tag arguably fine |
| Barbee Mill HOA | active Quick Fix (#7964) — program ended or downgraded? |

## Edge bucket: active recurring jobs billed as Barter / Warranty / Friends & Family (13)

These are likely mole-program work billed differently; none carry TMCP line items and
only Tyler Smythe is tagged: Margaret Kump (#8018 F&F), Patty Dills (#8117 Warranty),
Sauce (#7927 F&F), Tyler Smythe (#7704/#7705 Barter), Kathy Hill (#7969 Warranty),
David Ballestrasse (#4821 Barter), Ron Montgomery MC Trade (#7930 Barter),
Melissa Bobbit (#8004 F&F), Robert Saeman (#7063 Barter), Cory Ventura (#7777 Barter),
Ari Anthony (#5801 Barter), Spencer Hill (#7778 Barter).

If these count as "on the program," the true active program-job total is 597 + 13 = 610.

## Monthly value (added same day)

From `job.total` + `invoiceSchedule` on all 610 jobs:

| Billing setup | Jobs | Monthly value |
|---|---|---|
| Monthly | 571 | $64,378.00 |
| Yearly ($6,800/yr ÷ 12) | 12 | $566.67 |
| Quarterly / every 90 days (incl. #8056 $3,825/qtr; Cruz Rodriguez ×2 $849/90d) | 4 | $1,868.78 |
| On-completion #8058 $100 (ambiguous) | 1 | excluded |
| $0 / never-invoice | 9 | $0 |
| **TMCP total cash** | **597** | **$66,813.44/mo ≈ $801,761/yr** |

Median program price $100/mo (range $50–$1,550). Big monthly accounts: #6352 $1,550,
#7744 $1,500, #4930 $1,500, #5055 $950, #7546 $833, #7977/#7869 $500.

Barter/warranty/F&F (13 jobs): $0/mo recurring — 10 are $0 with invoicing off; the 3
Friends & Family jobs (Kump #8018, Sauce #7927, Bobbit #8004) bill $250 once on close.
Valued in-kind at the $100 median: ~$1,300/mo → all-in program value ≈ **$68,100/mo**.

**Review — the 9 zero/never-invoice TMCP jobs (deep-dive same day):**

| Job | Client | Since | Line price | Invoiced ever | Read |
|---|---|---|---|---|---|
| #5007 | Karen Porter (Carnation) | 2024-02 | **$100/mo** | **never** | ⚠ leak candidate ≈ $2,900 to date |
| #7701 | Susan Mcdonald (Edgewood) | 2026-02 | $75/mo | $900 ×1 | annual prepay — fine |
| #7449 | Sally Gasser (Ravensdale) | 2025-10 | $0 | $340 ×4 | invoiced manually |
| #5440 | Steve Hewitt (Auburn) | 2024-07 | $0 | $160 ×2 | invoiced manually |
| #4492 | Rich Porter (Auburn) | 2023-09 | $0 | never | comp or freebie |
| #4754 | Barry Heimbigner (North Bend) | 2023-11 | $0 | never | comp or freebie |
| #5433 | Susan Newby (Bonney Lake) | 2024-06 | $0 | never | comp or freebie |
| #6900 | Jeff Hunter (Kent) | 2025-07 | $0 | never | comp or freebie |
| #7767 | Jamie Randall (Maple Valley) | 2026-03 | $0 | never | newest — check if setup mistake |

Jobber links: work_orders/ 76053584, 80821577, 84947516, 92911583, 92987981, 120068861,
128181543, 136398865, 138044713.

## Bottom line

- **597 active TMCP jobs** is the real workload number (vs 577 tagged clients).
- **$66,813/mo cash** (~$68,100/mo including in-kind barter/F&F at median value).
- Tag hygiene: add the tag to 8 clients, review 8 stale tags (6 look like ended programs).
- Billing hygiene: review the 9 zero-dollar TMCP jobs.
