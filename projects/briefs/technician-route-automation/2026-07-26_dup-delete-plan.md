# Duplicate visit cleanup — week of 7/27 (plan, NOT executed)

Verified against Jobber 2026-07-26. 17 job #s carry 18 extra visits.
Rule applied: keep the ORIGINAL (lowest visit id); delete the later artifact.
Exception: where a duplicate is assigned to a non-working tech (Tavis) or to
Spencer on non-peninsula work, delete that side regardless of id.

## A. Stale Tavis visits — Tavis is not currently working (3)
| Job | Client | Date | DELETE visit | keep |
|---|---|---|---|---|
| 5947 | Neil Kanungo | 7/28 | 1912213813 (Tavis 07:00) | 2260866715 Cammeron |
| 7744 | GC Bellefield LLC | 7/27 | 2063540939 (Tavis 07:00) | 2259670489 Cory |
| 7788 | Bonnie Mccracken | 7/28 | 2086100541 (Tavis 07:00) | 2260306106 Cammeron |

## B. Spencer-assigned, non-peninsula, live duplicate exists (1)
| Job | Client | Date | DELETE visit | keep |
|---|---|---|---|---|
| 8163 | Ryan Jaffe | 7/28 | 2251433823 (Spencer 17:00) | 2260186568 Cammeron |

## C. Exact same-tech same-date duplicates (5)
| Job | Client | Date | DELETE visit | keep |
|---|---|---|---|---|
| 5139 | Aly Mendez | 7/29 | 2262158754 | 2254047380 |
| 7199 | Glen Smith | 7/31 | 2264419945 | 2256731302 |
| 7365 | Paul Hwang | 7/31 | 2264828649 | 2264814767 |
| 7697 | Jennifer Cramer | 7/30 | 2262944954 | 2262915173 |
| 8170 | Ross Luo | 7/29 | 2262205860 | 2253064121 |

## D. Same day, one timed original + one 00:00 regeneration (3)
| Job | Client | Date | DELETE visit | keep |
|---|---|---|---|---|
| 8060 | Blake Diers | 7/27 | 2259347293 (00:00) | 2231424519 (07:00) |
| 8072 | Prologis TMC Quote | 7/29 | 2261779855 (00:00) | 2232222180 (07:00) |
| 8200 | GenCare 1yr | 7/29 | 2261970930 (00:00) | 2259576110 (17:00) |

## E. Amy Collins — 3 visits, same day (2)
| Job | Client | Date | DELETE visits | keep |
|---|---|---|---|---|
| 8202 | Amy Collins | 7/30 | 2263134436, 2263135628 | 2259592941 (17:00) |

## F. CROSS-DATE — same job twice in the week; deleting picks a DATE (4)
These are NOT same-day dupes. Recommendation keeps the original date.
| Job | Client | keep date | DELETE visit | (drops date) |
|---|---|---|---|---|
| 8113 | Max Ye | 7/28 | 2263156198 | 7/30 |
| 8155 | Bac Walker | 7/30 | 2261677657 | 7/29 |
| 8190 | Kevin Bohnert | 7/30 | 2260388791 | 7/28 |
| 8214 | Joseph Syejoon Lee | 7/30 | 2262025055 | 7/29 |

TOTAL DELETIONS: 18  →  480 orders becomes 462

## Not a route problem
7884 Matt Arnold — the duplicate was two job FORMS on PAST visits (7/24 luke,
7/21 spencer), not two upcoming visits. Only one visit next week. Paperwork
item, no route impact.
