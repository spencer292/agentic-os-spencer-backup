# HR Data Handling — what goes where, and what never enters the repo

Read this before writing any file about a named employee.

## The problem this solves

This repository is **tracked and pushed to a private GitHub backup**. Anything committed leaves the
machine and lives in git history forever — a later deletion does not remove it from history. Employee
personal data does not belong in a system with those properties, and some of it (medical, I-9)
carries a legal obligation to be kept separate from the ordinary personnel file.

So the split is not a preference. It is the design.

## Three tiers

### Tier 1 — Tracked, in the repo
`projects/briefs/hr-in-house/`

Policy, process, templates, the compliance calendar, findings, job descriptions, interview guides,
and **employee documentation written in behavioural terms**: reviews, coaching notes, warnings,
PIPs, termination memos.

These are the documents an employee is entitled to see anyway. Writing them somewhere durable and
version-controlled is exactly right — a written warning whose creation date can be proven is worth
more than one that cannot.

Names are fine here. Job titles, pay *bands*, start dates, performance facts and disciplinary
history are fine here.

### Tier 2 — Local only, gitignored
`hr-private/` (already in `.gitignore`)

Never committed, never backed up to GitHub. This is where the following go, and only here:

- Social Security numbers, dates of birth, home addresses, personal phone numbers
- **I-9 forms and the identity documents behind them** — federal rules require these be kept apart
  from personnel files, which is why they get their own folder: `hr-private/i9/`
- W-4s, direct deposit and bank details
- Driver's licence copies, MVR / driving record reports
- Background check reports and their supporting documents
- **Anything medical**: doctor's notes, accommodation requests, workers' comp injury detail,
  fitness-for-duty results, leave paperwork. Folder: `hr-private/medical/`
- Garnishment orders, child support notices
- Immigration documents

Structure:

```
hr-private/
├── i9/{firstname-lastname}/          <- I-9 + supporting ID, separate by law
├── medical/{firstname-lastname}/     <- confidential medical file, separate by law
└── people/{firstname-lastname}/      <- SSN, DOB, address, W-4, banking, MVR
```

**Back this folder up separately** — an encrypted drive, or a password manager's document vault.
It is excluded from git precisely so git cannot protect it, which means something else has to.

### Tier 3 — Never stored here at all
Payroll data, tax filings and benefits enrolment stay in the payroll provider's system. That is the
system of record for money. This skill audits it; it does not duplicate it.

## Writing rule

When a Tier 1 document needs a Tier 2 fact, **reference it, do not copy it**.

- Bad: "Confirmed DOB 05/14/1991 and SSN ending 4432."
- Good: "Identity documents verified 2026-09-02. I-9 complete, filed in `hr-private/i9/`."

- Bad: "MVR shows a 2023 speeding citation and a 2021 at-fault collision."
- Good: "Driving record reviewed 2026-09-02 — meets the company driving standard. Report filed in
  `hr-private/people/`."

The decision belongs in the personnel file. The evidence behind it belongs in the private folder.

## Access

Personnel records are open to Spencer, and to a manager only for their own direct reports and only
for a business reason. The medical and I-9 folders are Spencer-only. If the crew grows past the
point where that is workable, that is the trigger to move to a real HRIS with per-record permissions —
not the trigger to loosen this.

## Before any commit that touches HR

Check the diff for: 9-digit numbers, dates of birth, street addresses, account numbers, and the words
"diagnosis", "doctor", "injury", "medication", "accommodation". `git diff --cached` before staging.
Stage explicit paths, never `git add -A`, in any session that touched HR.
