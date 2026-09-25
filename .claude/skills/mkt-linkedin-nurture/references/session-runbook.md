# Session Runbook — mechanics

The browser commands, the extraction technique that works, and the state file schema.

---

## Browser

Everything runs through `tool-browser` — a visible Chrome window on the persistent profile at
`~\.agentic-chrome-profile`, so Spencer's LinkedIn login survives between sessions.

```
node browser/launch.mjs                        # open the window
node browser/cdp.mjs goto <url>                # navigate
node browser/cdp.mjs eval "<js>"               # read the page
node browser/cdp.mjs shot <name>               # screenshot to browser/shots/
```

Read `.claude/skills/tool-browser/SKILL.md` for the full command set, and
`context/learnings.md` → `## tool-browser` for accumulated selector notes.

Spencer should be able to see the window during sends. That's the point of a visible browser
rather than a headless one — he can watch what's happening on his account.

---

## The tool split — which surface does which job

Established 2026-08-21 by testing both, on a live Sales Navigator Core account.

| Job | Surface | Why |
|-----|---------|-----|
| Finding prospects, extracting lists | **Standard LinkedIn people search** | The anchor-map technique works, and the page carries no active anti-scraping instrumentation |
| Filters, job-change alerts, saved-search notifications, richer prospect context | **Sales Navigator — read visually only** | Far better data, but instrumented against extraction |
| Sending invites and messages, engaging | **Standard LinkedIn**, human-paced, approved per batch | Where the account's normal behavior lives |

**Do not run DOM extraction against Sales Navigator.** Its search page loads an active
bot-detection iframe from `li.protechts.net` (PerimeterX) carrying the parameter `uc=scraping`
— it is watching for exactly this — and Sales Navigator's terms prohibit exporting data.
Standard people search does not load it.

The fields *are* addressable there (`[data-anonymize]` attributes expose person-name, title,
company-name, location, job-title, person-blurb), so a scraper would function. That is not the
question. Spencer pays for this account, the campaign depends on it, and harvesting from the one
surface built to detect harvesting is the fastest way to lose both. Read Sales Navigator with
screenshots and with your eyes, the way a person would.

**Sales Navigator is not drivable programmatically at all — not even for configuration.**
Tested 2026-08-21: `document.body.innerText` returns ~1,283 characters on a results page that is
visibly full of text, filter controls don't appear in the button list, and the save-search toggle
isn't addressable. Whether that's the app's rendering or deliberate obfuscation alongside the
PerimeterX iframe, the practical outcome is the same. **Don't fight it.** Read it with
screenshots; have Spencer click its settings himself. Attempting coordinate-based clicking on a
page running bot detection is precisely the behavior that gets a paid account flagged.

**How to use Sales Navigator properly in a session:**
- Run the filtered search visually — narrow Geography to Washington (it defaults to North America), then apply role and seniority filters
- Turn on **"Save search to get notified of new results"** — this is how job-change alerts actually arrive
- Use **"Changed jobs"** and **"Posted on LinkedIn"** filters to build the session's priority list. A community manager who just changed firms is the strongest buying signal in this market; someone who posted this week is the engagement-first target
- Read the extra context it gives — tenure in role, About snippet, mutual-connection count — and carry the conclusions into `pipeline.json` by hand
- Then do the actual list-building and sending on standard LinkedIn

## People search extraction — the technique that works

Learned 2026-07-06 and confirmed in the first real pull. Navigate to:

```
https://www.linkedin.com/search/results/people/?keywords=<url-encoded-query>
```

Then collect anchors, not list items:

```js
Object.fromEntries([...document.querySelectorAll('a[href*="/in/"]')]
  .map(a => [a.href.split('?')[0], a.innerText.trim()])
  .filter(([, t]) => t))
```

Each entry's text carries the name, connection degree, headline, location, the connect/message
button label, and the mutual-connection line — everything needed to rank a prospect without
opening their profile.

**`<li>`-based extraction returns an empty array.** LinkedIn doesn't structure results as list
items. Don't rediscover this each session.

This technique isn't only about speed — it's how the free account's ~300-searches-a-month budget
survives twice-weekly sessions. One search yields 25 rankable rows; opening 25 profiles to learn
the same thing would spend the month's allowance in three sessions. Rank first, open only what
survives the Step 3 filter, and record the session's search count in the log.

Screenshots are the fallback when the DOM shifts: capture the results page and read it visually,
then note in the session log that the extraction technique needs updating.

**Reading mutual connections:** "X is a mutual connection" on a 2nd-degree result means X is one
of *Spencer's own* first-degree connections. Recurring names across searches are network hubs and
are worth more than any individual prospect — see `target-profiles.md` → Warm-route hubs.

---

## Prior-contact checks

**LinkedIn:** connection degree appears in the search row. For existing threads, check
`linkedin.com/messaging/` and search their name before contacting.

**Gmail:** search their full name, their company name, and their email domain separately — a
thread may exist under a colleague's address at the same firm, which still counts as prior
contact with the account.

**Jobber:** use `tool-jobber` to search clients by person name and by company name. Both matter —
a community manager may be personally unknown while their management company is already a
customer. Reads are free; nothing here writes to Jobber.

---

## `pipeline.json` schema

Lives at `projects/mkt-linkedin-nurture/pipeline.json`. Update it, never replace it.

```json
{
  "updated": "2026-08-21",
  "sessions_run": 0,
  "prospects": [
    {
      "id": "mark-johnson-kappes-miller",
      "name": "Mark Johnson",
      "linkedin": "/in/mark-johnson-9461b98/",
      "title": "Community Association Manager",
      "company": "Kappes Miller Management",
      "location": "Seattle",
      "profile": "hoa-community-association",
      "degree": "2nd",
      "warm_route": ["Patrick LaCroix"],
      "hook": "Patrick LaCroix shared connection; manages multi-community portfolio",
      "stage": "researched",
      "touches": [],
      "next_action": "send connection note",
      "next_action_due": "2026-08-25",
      "notes": "Drafted 2026-07-06, never sent"
    }
  ],
  "excluded": [
    {
      "name": "Jane Doe",
      "reason": "already a TMCP customer (Jobber #8134)",
      "checked": "2026-08-21"
    }
  ]
}
```

**Stages:** `found` → `researched` → `approved` → `invited` → `connected` → `messaged` →
`replied` → `call_booked` → `won` / `dormant` / `excluded`

**Touch entries** record what actually went out, so the three-touch limit is enforceable:

```json
{"date": "2026-08-21", "type": "connection_note", "text": "Hi Mark — Patrick LaCroix is...", "response": null}
```

`type` is one of: `connection_note`, `follow_up`, `nurture_2`, `nurture_3`, `engagement`.
Engagement (a comment or a like on their post) is logged but **does not count** toward the
three-touch limit — it isn't an unsolicited message.

---

## Session log format

`projects/mkt-linkedin-nurture/{YYYY-MM-DD}_session-{N}.md`:

```markdown
# LinkedIn Session {N} — {date}

**Profile worked:** {which target profile}
**Invite allowance at start:** {what the account actually showed}

## Found
{count} raw results across {n} searches. Search strings used: ...

## Filtered
{count} dropped — {reason breakdown}

## Sent
{numbered list: name, type of message, exact text sent}

## Came back
{replies, acceptances, rejections since last session}

## Queued for next session
{who's due what, and when}

## Notes
{anything odd — interface changes, warnings, market observations}
```

The "came back" and "queued" sections are what make the next session start fast instead of
starting over. Write them properly even when the answer is "nothing yet".

---

## First-session seed

Session one doesn't start from an empty file. `projects/tool-browser/` already holds, from
2026-07-06:

- `2026-07-06_linkedin-corporate-prospects.md` — 20 researched prospects across HOA managers, golf superintendents, facilities managers and landscapers, with degrees, mutual connections and target accounts
- `2026-07-06_linkedin-outreach-drafts.md` — 14 personalized message pairs, written and never sent
- `2026-07-06_linkedin-connection-list.md` — a tiered A/B/C/D connection list
- `2026-07-06_linkedin-growth-engine.md` — profile and content recommendations

Seed `pipeline.json` from these at `stage: "researched"`. Two cautions: the research is from
July, so re-verify each person is still in the same role before contacting them, and the drafts
predate this skill's rules — re-read them against `message-patterns.md` before reusing, since
they were a calibration batch Spencer never signed off on.
