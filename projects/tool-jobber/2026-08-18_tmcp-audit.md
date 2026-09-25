# TMCP Audit — 2026-08-18

Run: `node projects/tool-jobber/scripts/tmcp-tag-audit.mjs 2026-08-18`
Source: live Jobber sweep, 837 live jobs across all 8 non-archived statuses. Read-only.
Data: `data/2026-08-18_tmcp-tag-audit.json` · `data/2026-08-18_tmcp-jobs.jsonl` (690 rows)

---

## The number

**690 live TMCP jobs, across 669 distinct clients.**

A TMCP job is any live job carrying a `Total Mole Control` line item — `Total Mole Control
Package` or `Total Mole Control Program -- Year round protection`. Product comes from the line
item, never from `jobType` (every job in this account is Recurring).

| | |
|---|---|
| Live TMCP **jobs** | **690** (689 recurring, 1 one-off) |
| Distinct **clients** holding them | **669** |
| Clients with more than one | 11, carrying **21 extra jobs** |
| MRR equivalent | **$75,792.19** |

**Why the two numbers differ.** `TMCP - Active` is a tag on the *Client* record, not the Job. A
client with three properties is one tagged client and three billed jobs. Every count sourced from
the tag — the Ninety scorecard, the client list, the autopay reports — is a *client* count and
runs ~21 jobs light. The job count is the one that ties to revenue.

Reconciliation against the tag:

```
669  clients with ≥1 live TMCP job
 -9  have a TMCP job but no "TMCP - Active" tag
 +2  tagged Active with no live TMCP job
----
662  clients tagged "TMCP - Active"   ✓ matches Jobber
```

## The 11 multi-job clients (21 extra jobs, $4,930.75/mo)

Every one verified against its property address — these are separate properties, not
double-billing, with one exception noted below.

| Client | Jobs | Properties |
|---|---|---|
| Prologis - Sumner Landing | 10 | One per building — Sumner 13, 1-4-6&8, 3-7-9&10, 5&7, 27 (Duke), Sumner Landing, River Front Industrial Park, 22&23, 24, White River. $2,184.75/mo |
| Cruz Rodriguez | 3 | Kent 98032 + two Monte Villa Parkway sites, Bothell 98021 |
| HyperGreen Landscaping | 3 | Buttes Dr E (Pierce Co) + Buckley 98321 + Auburn 98001 |
| Clark Potter | 2 | Covington 98042 + Maple Valley 98038 |
| Clint Bjornson | 2 | Lake Tapps 98391 + Graham 98338 |
| Ganesh Thirumalai | 2 | Renton 98058 + Bellevue 98005 |
| Kelly Kunz | 2 | Renton 98058 + Kent 98042 |
| SLPPLLC | 2 | Auburn 98092 + Kent 98042 |
| Tanya O'Bannon | 2 | Snoqualmie 98065 + Lakemont Blvd, Bellevue 98006 |
| Tom Schlimme | 2 | Auburn 98002 + Auburn 98092 |
| **Ross Luo** | 2 | **Both on 14105 E Lake Kathleen Dr SE, Renton 98059** — see below |

**Clears the 08-11 open item.** Clark Potter, Tom Schlimme, SLPPLLC and Ganesh Thirumalai were
flagged then as possible duplicates. All four are two genuinely different properties in two
different cities. Closed — not duplicates.

**One real question: Ross Luo.** #8170 ($90/mo, Senior Discount, since 07-15) and #8350 ($60/mo,
**Neighboring Property Discount**, since 08-14) sit on the same property record. The discount
name says it is the neighbour's yard, which would make it a legitimate second job with the wrong
address attached. Either the property on #8350 needs correcting, or it is a duplicate and $60/mo
is being billed twice. Needs your eyes — one minute in Jobber.

## Tag hygiene — 9 jobs missing the Active tag (was 3 on 08-11)

Nine live TMCP jobs whose client is **not** tagged `TMCP - Active`. Seven are signups since the
08-11 run, so the tag is simply lagging behind new sales. Two are worse.

| Job | Client | Starts | $/mo | Current client tags |
|---|---|---|---|---|
| #8404 | Simmons Mill HOA | 08-20 | 150 | *(none)* |
| #8381 | Michael Colella | 08-19 | 100 | Schedule requested, Voice Assist ×2 |
| #8366 | Denise Froatz | 08-12 | 100 | Schedule requested, Voice Assist ×2 |
| #8365 | Relic Rodrigues | 08-12 | 100 | *(none)* |
| #8332 | Nancy Collinsworth | 08-13 | 90 | *(none)* |
| #8340 | Ken Lohse | 08-11 | 100 | Schedule requested |
| #8219 | Trent Bryan | 07-30 | 200 | *(none)* |
| #8003 | Aaron Carriveau | 06-16 | 100 | **TMCP Churned** + Schedule booked |
| #7352 | Sue Eastman | 2025-10-13 | 100 | **TMCP Churned** |

The last two are backwards: both clients are tagged **Churned** while still holding a live,
billing TMCP job. Either they came back and the tag was never flipped, or the job should have
been closed and they are still being serviced. Sue Eastman's job also ends 08-20, which fits
"churning" — but Aaron Carriveau's runs on.

$1,040/mo sits behind these nine. It bills fine (billing follows the Job), but it is invisible
to every report that counts the tag.

**Two clients tagged Active with no live TMCP job:** Tyler Smythe, Barbee Mill HOA. (Larena
Walshe, the third from 08-11, has cleared.)

## Billing leak — 11 TMCP jobs producing $0/month

These carry a TMCP line item and are being serviced, but the invoice schedule will never raise a
recurring charge:

| Job | Client | Invoice schedule | Job total |
|---|---|---|---|
| #8339 | Donald Kaplan | When the job is marked closed | $100 |
| #8338 | Leena Shah | When the job is marked closed | $100 |
| #5440 | Steve Hewitt | When the job is marked closed | $0 |
| #5007 | Karen Porter | Don't remind me to invoice | $100 |
| #4979 | Marcus Andy | Don't remind me to invoice | $0 |
| #5433 | Susan Newby | Don't remind me to invoice | $0 |
| #6900 | Jeff Hunter | Don't remind me to invoice | $0 |
| #7767 | Jamie Randall | Don't remind me to invoice | $0 |
| #7449 | Sally Gasser | Don't remind me to invoice | $0 |
| #4492 | Rich Porter | Yearly | $0 |
| #4754 | Barry Heimbigner | Yearly | $0 |

#8338 and #8339 are brand new (08-13 and 08-20) with a real $100 price attached and the wrong
schedule picked — those two look like straight setup errors worth fixing this week. The older
$0 jobs may be deliberate (comps, barter, friends-and-family); worth confirming which. At the
$100 median that is up to ~$1,100/mo unbilled.

## Movement since the 08-11 audit

| | 08-11 | 08-18 | Δ |
|---|---|---|---|
| Live jobs scanned | 812 | 837 | +25 |
| **TMCP jobs** | **674** | **690** | **+16** |
| Distinct clients | 653 | 669 | +16 |
| MRR equivalent | $74,162.19 | $75,792.19 | **+$1,630.00** |
| Clients tagged Active | 653 | 662 | +9 |
| Clients tagged Churned | 18 | 20 | +2 |
| Jobs missing Active tag | 3 | 9 | +6 |

25 TMCP jobs have a start date on or after 08-11 (some are net-new sales, some are re-starts), so
+16 net is roughly 25 on and 9 off in seven days. All 11 multi-job clients are the same 11 as
08-11 — the extra-job count did not move.

## Shape of the book

- **Median $100/mo.** 606 of 690 jobs (88%) sit between $75 and $149.
- 660 jobs (96%) bill *Monthly on the last day of the month*; 16 bill yearly, 4 quarterly.
- The top 8 jobs ($500+/mo) carry $8,608/mo — 11% of MRR from ~1% of jobs. Concentration risk
  sits with Prologis and Cruz Rodriguez.
- 1 job has already passed its end date and is stuck in `action_required`: #6411 John and Tessa
  Woodyard, ended 08-15, $100/mo.
- 6 jobs end within the next three months ($525/mo) — renewal touch-points, not churn yet.

**Autopay caveat:** only 87 of the 690 jobs sit on a client tagged `Autopay` ($8,189/mo). The
autopay audit on 08-11 measured 212 of 675 TMCP jobs actually on autopay, so the `Autopay` tag is
roughly 60% under-applied and should not be used as the autopay source of truth.

---

## Do next

1. **Ross Luo #8350** — same address as #8170. Second property or duplicate? ($60/mo)
2. **Tag the 9** clients missing `TMCP - Active`; flip Aaron Carriveau and Sue Eastman off
   `TMCP Churned` or close their jobs.
3. **Fix #8338 and #8339** invoice schedules to monthly before the first bill cycle misses.
4. **Untag** Tyler Smythe and Barbee Mill HOA, or find their missing job.
5. **Close or requeue #6411** (Woodyard) — expired 08-15, still open.
6. **Push 690, not 662, to Ninety.** The scorecard reads the client tag; the job count is what
   ties to $75,792.19 MRR.
