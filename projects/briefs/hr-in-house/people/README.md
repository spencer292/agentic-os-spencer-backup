# Personnel Files — structure

One folder per person: `people/{firstname-lastname}/`.

**Read `.claude/skills/ops-hr/references/data-handling.md` before creating one.** This folder is
tracked in git and pushed to a private GitHub backup. It holds employment documentation. It does not
hold SSNs, dates of birth, home addresses, I-9s, medical information, bank details or background
reports — those live in `hr-private/`, which git ignores.

## Folder contents

```
people/robert-norton/
├── profile.md                          <- the index: role, dates, status, pointers
├── 2026-03-01_offer-letter.md
├── 2026-06-01_review-90day.md
├── 2026-09-14_coaching-visit-notes.md
├── 2026-10-02_written-warning.md
└── 2027-01-15_review-annual.md
```

Filenames are `{YYYY-MM-DD}_{type}.md`. The date is when the event happened, not when the file was
written — and if those differ, the document itself says so. Never backdate.

## profile.md template

```markdown
# {Full Name}

| Field | |
|---|---|
| Role | |
| Reports to | |
| Start date | |
| Status | Active / Separated {date} |
| Employment type | W-2 full-time |
| **Exempt status** | Non-exempt (hourly) / Exempt — verified against the WA threshold on {date} |
| Pay | {rate} — see hr-private for full history if sensitive |
| Territory | |
| Ninety seat | |

## Compliance
- I-9 completed {date} — filed in `hr-private/i9/{name}/`
- Handbook acknowledged {date}
- Safety orientation / APP delivered {date}
- Driving record reviewed {date} — **meets the company driving standard: yes/no**
- Background check completed {date} — **result: cleared / not cleared**

## Equipment issued
| Item | Serial / count | Issued | Returned |
|---|---|---|---|

## Document index
| Date | Document | Type |
|---|---|---|
```

## The rule that makes this work

Record the **decision** here, and keep the **evidence** in `hr-private/`.

"Driving record reviewed 2026-09-02 — meets the company driving standard. Report in `hr-private/`."
Not the citations, not the dates of the violations, not the licence number.

Every document in this folder is written on the assumption the employee will read it — because in
Washington they are entitled to request it, annually while employed and for three years after
separation.
