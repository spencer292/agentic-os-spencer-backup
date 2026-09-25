---
project: hr-in-house
status: active
level: 2
created: 2026-08-26
---

# HR In-House — replace the outsourced HR retainer

## Goal

Bring HR fully in-house for a Washington-only W-2 team of fewer than ten people, covering hiring
through offer, onboarding and compliance, and performance and problems. Cancel the Cascade HR
retainer once what they hold has been reclaimed and the gaps they left have been closed.

## Why now

Spencer believes the retainer is overpriced relative to what it delivers. Two facts support that:

1. **Cascade HR is an HR consulting and advisory firm, not a PEO.** They are not the employer of
   record, they do not hold the L&I account, and they do not own payroll. Leaving is a cancellation
   letter, not a migration. Verified 2026-08-26 from cascade-hr.com — their listed services are
   audits, compliance, policy, performance management, talent acquisition, training, org development.
2. **An advisory retainer is exactly the category an agent replaces well.** What it sells is
   knowing the rule and writing the document. Both are now in `.claude/skills/ops-hr/`.

What an agent does **not** replace: the judgement call on a termination with retaliation exposure,
a harassment investigation, or a wage-and-hour question where back pay may be owed. Those go to an
employment attorney, which for a company this size costs far less than a monthly retainer.

## Scope

**In:** hiring to offer · onboarding and WA compliance · performance, discipline and separation ·
policy and handbook · the compliance calendar · personnel records.

**Out:** payroll processing, tax filing and benefits enrolment stay with the payroll provider. This
project audits them; it does not duplicate them.

## Deliverables

| # | Deliverable | Status |
|---|---|---|
| 1 | `ops-hr` skill — router, WA compliance base, hiring playbook, documentation standards, data handling | **Built 2026-08-26** |
| 2 | Templates — job description, interview guide, offer letter, new-hire checklist, written warning, PIP, review, separation | **Built 2026-08-26** |
| 3 | `open-findings.md` — live compliance risks, severity-ranked | **Built 2026-08-26** |
| 4 | `compliance-calendar.md` — recurring obligations by month | **Built 2026-08-26** |
| 5 | `cascade-exit.md` — what to reclaim before cancelling, and how | **Built 2026-08-26** |
| 6 | Employee handbook — Got Moles specific, WA compliant | **Not started** — needs Cascade's version first, or a clean build |
| 7 | Accident Prevention Program (APP) — legally required at any size | **Not started** — check whether Cascade produced one |
| 8 | Personnel file reconstruction for the current crew | **Not started** — needs the roster |
| 9 | Employment attorney identified and on call | **Not started** — Spencer decision |

## Acceptance criteria

- Every current employee has a personnel file that would survive an ESD or L&I request
- Every recurring legal obligation is on a calendar with an owner
- A new tech can be hired and onboarded end to end from these files with no outside help
- Warnings, PIPs and terminations are documented to a standard that holds up when read by a stranger
- No sensitive personal data is in git history

## Constraints

- **Fewer than 10 employees, all W-2, Washington only.** Federal thresholds at 15, 20 and 50 mostly
  do not apply. **WLAD applies at 8** — recount at every hire.
- The repo pushes to a private GitHub backup. Sensitive data goes in `hr-private/` (gitignored) and
  nowhere else. See `.claude/skills/ops-hr/references/data-handling.md`.
- WA reindexes minimum wage, the exempt salary threshold, PFML rates and the non-compete threshold
  every January. The compliance file carries verify-by dates for exactly this reason.

## Dependencies

- The current roster: names, W-2 or 1099, start dates, pay type and rate, job titles — **needed for
  deliverables 8 and for confirming finding F1**
- The Cascade HR service agreement (notice period) and their last invoice
- Whatever Cascade holds: handbook, job descriptions, personnel files, APP, compliance calendar

## Open threads

- Finding F1 (exempt salary threshold) needs Cory Ventura's actual salary to confirm or clear
- Handbook: rebuild from scratch, or reclaim and correct Cascade's version
- Whether an APP exists at all
