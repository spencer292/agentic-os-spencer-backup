# Day-by-day route review — corrections from Spencer, 2026-07-26

Working through the week one day at a time against the live OptimoRoute plan
(planningId 28222602, 471 routed). Nothing written to Jobber until the review is done.

## THURSDAY 7/30 — captured before the day-by-day walkthrough started

- [ ] **Luke** should run the **Olympia** route (currently not his)
- [ ] **Cory** should run the **Sammamish** route
- [ ] **Newcastle / Mercer Island** is currently split between Cammeron and Luke —
      most of it should go to **Cammeron**, and it should be **split across multiple days**
      rather than done in one hit
- [ ] Note: correction list references "Thursday at 7:30"

## TUESDAY 7/28

- [ ] **Michelle Dagg, Enumclaw — order 8099** → move to **Luke's Tuesday**

## MONDAY 7/27
_(under review)_

## WEDNESDAY 7/29
_(pending)_

## FRIDAY 7/31
_(pending — known issue: built as Luke=Buckley belt + Cory=I-90 corridor, 60 mi apart, so
Luke sits at 47 stops / 13.2h and Cory at 19 / 5.3h. Spencer's actual practice is Cory
SPLITTING Luke's Buckley. Rebuild as a Luke+Cory Buckley/Bonney Lake split.)_

## Open blockers
- 10h cap not settable by API — all four drivers have a blank `externalId`, and
  `workTimeFrom`/`workTimeTo` exist only on the singular endpoint which requires it.
- Weekend recurrence: #7208, #7971, #8054, #8209 recur on a fixed day-of-month; cleared
  through 2027 but will regenerate. Needs weekday recurrence or a standing sweep.
