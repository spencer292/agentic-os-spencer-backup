# Cory: Your Got Moles Agentic OS Setup

This is your copy of the AI system Spencer uses to run routing, CallRail, and reports. It runs on your computer in Claude Code. You talk to it in plain English and it runs the tools for you.

Work through the parts in order. Part 1 takes about 30 minutes. Plan on 1–2 weeks before you run a live routing week on your own.

---

## Part 1 — Install (one time, ~30 min)

### 1.1 What you need first
1. **A Claude plan with Claude Code.** Max is recommended. Routing and Jobber work runs on Opus (the stronger model) on purpose, and that uses a lot of the plan.
2. **Claude Code** installed and signed in: https://claude.com/claude-code
3. **Git**: https://git-scm.com (the default options are fine)
4. **Node.js 20 or newer**: https://nodejs.org (LTS version)
5. **A GitHub account.** Send Spencer your username so Roy can invite you to the Got Moles repo. Accept the invite from your email.

### 1.2 Get the system
Open **PowerShell** and run:

```
cd C:\
git clone https://github.com/Got-moles/Agentic-os-got-moles.git
cd Agentic-os-got-moles
copy .env.example .env
```

### 1.3 Start it and load your profile
```
claude
```
Then type: **"I'm Cory, load my profile."** It already has a profile for you. Tell it your role: *"I run routing, CallRail, and reports for Got Moles, and I'm the T2 technician / bid lead."*

### 1.4 Set up your personal backup
Your memory and work get saved to a private GitHub repo that belongs to you. It's separate from the company repo.

1. On GitHub, create a **private**, empty repo named `agentic-os-cory-backup`.
2. In PowerShell, inside `C:\Agentic-os-got-moles`:
```
git remote set-url --push origin DISABLED
git remote add backup https://github.com/YOUR-GITHUB-NAME/agentic-os-cory-backup.git
git config remote.pushDefault backup
git config pull.rebase true
git push backup main
```

---

## Part 2 — Keys and logins

**Keys never go in email or text.** Spencer will give them to you in person or through a password manager. They go in the `.env` file in your install folder and nowhere else.

| Key in `.env` | What it unlocks | How you get it |
|---|---|---|
| `JOBBER_CLIENT_ID`, `JOBBER_CLIENT_SECRET` | Jobber (clients, jobs, visits) | From Spencer |
| `JOBBER_REFRESH_TOKEN` | Your own Jobber login | **You make this yourself.** See below |
| `OPTIMOROUTE_API_KEY` | OptimoRoute (route planning) | From Spencer |
| `CALLRAIL_API_KEY` | CallRail (calls, transcripts) | Make your own in CallRail: Settings → API Keys |
| `FLEETSHARP_API_KEY`, `FLEETSHARP_API_URL` | Truck GPS (FleetSharp/Linxup) | From Spencer |
| `GOOGLE_ADS_*` | Google Ads reports | Optional, later |

**Jobber: do NOT copy Spencer's refresh token.** Jobber replaces the token every time it's used. If you both use the same one, one of you gets locked out. Run this and log in to Jobber in the browser window that opens:
```
node .claude/skills/tool-jobber/scripts/jobber-api.mjs auth
```

### Test every connection
Run these from `C:\Agentic-os-got-moles`. Each should print a success line.
```
node .claude/skills/tool-jobber/scripts/jobber-api.mjs test
node .claude/skills/tool-optimoroute/scripts/optimoroute-api.mjs test
node projects/briefs/callrail-faq/scripts/test-callrail-access.mjs
```
(The CallRail test only works after Part 3.) If a test fails, paste the error into Claude and say *"fix my connection."*

---

## Part 3 — The ops pack (routing, CallRail, reports)

The company repo comes with the general skills. Spencer's routing, CallRail, and reporting tools were built on his machine, so they arrive separately as the **ops pack**. You'll get them in one of two ways:

- **Through an update.** Spencer gets Roy to add the ops pack to the shared repo. Then run `bash scripts/gm-update.sh`, or tell Claude *"update the Got Moles OS."*
- **As a folder.** Spencer gives you the folder. Copy it into `C:\Agentic-os-got-moles`, merging it with the folders already there.

After that, tell Claude: **"Register the ops pack skills in my CLAUDE.local.md and confirm every script runs."**

The ops pack contains **scripts only, no customer data.** Your copy pulls live data from Jobber, OptimoRoute, and CallRail the first time you run each tool.

---

## Part 4 — Your skills

You don't need to remember skill names. Say what you want and Claude picks the skill. These are the ones you'll use most:

### Operations (core of your job)
| Skill | Say something like | What it does |
|---|---|---|
| `tool-jobber` | "pull this week's visits", "find the client at 123 Main" | Reads and edits Jobber |
| `tool-optimoroute` | "show today's routes", "plan Tuesday" | Reads and plans OptimoRoute |
| `tool-browser` | "open Jobber in the browser", "screenshot this" | Drives a real Chrome window on your logins |
| `ops-phone-roleplay` | "phone role-play", "quiz me on the phones" | Phone training: Claude plays the caller and scores you |
| `ops-cron` | "cron status" | Scheduled jobs. **Leave them off.** See the rules |

### Reports and numbers
| Skill | Say something like | What it does |
|---|---|---|
| `ops-got-moles-ads` | "got moles ads status", "3-day pulse" | Google Ads performance (read-only reports) |
| `fin-month-end-reporting` | "close out last month" | Monthly finance roll-up |
| `meta-memory-recall` | "what did we decide about Kent?" | Searches past decisions |

### Writing and content
| Skill | Say something like |
|---|---|
| `mkt-copywriting` | "write a text to customers about…" |
| `tool-humanizer` | "make this sound less like AI" |
| `00-slides` | "make a deck for the team meeting" |
| `tool-pdf-generator` | "turn this into a PDF" |

### Housekeeping
| Skill | Say something like |
|---|---|
| `meta-wrap-up` | "wrap up" (end of every session: saves memory and backs up) |
| `meta-memory-write` | "remember that…" |

Say **"list skills"** at any time to see everything that's installed.

---

## Part 5 — Weekly routing loop

This is how Spencer runs a week. **Jobber is the source of truth for which day and which tech.** OptimoRoute only works out the order and the arrival times.

**Before you start any routing session:** tell Claude *"routing session. Check the crons are off and the write gate is closed."*

1. **Set the week in Jobber.** Put each visit on its day and tech. Days are owned territory days. Only move a visit to a different day if it fixes overtime, and only with Spencer's OK.
2. **Copy last week's ops folder.** Say: *"Set up next week's routing folder from last week's."* Claude copies `projects/briefs/route-engine/redesign/ops/{last-week}_week/` to the new week and updates the dates.
3. **Dry run.** Say: *"Dry-run sync-plan-times for next week."* It shows every OptimoRoute order it will create, update, or delete. **Read the list.** If anything looks wrong, stop and ask.
4. **Open the write gate (time-limited).**
   ```
   node projects/briefs/route-engine/scripts/write-authority.mjs enable --reason "week of MM-DD sync" --ttl 30m
   ```
5. **Run it live:** *"Run sync-plan-times --execute --no-times."* This syncs OptimoRoute to Jobber.
6. **Check first stops start at 7:00** for every tech. Claude does this through the API. You never need to click through the OptimoRoute screens.
7. **Plan and write times back:** *"Run sync-plan-times --from-saved."* This writes the planned arrival times into Jobber.
8. **Arrival windows:** *"Run the arrival-window sweep."* This sets the 3-hour windows customers see in their texts.
9. **Build the timetable:** *"Build the timetable for the week."* This makes the page the techs look at.
10. **Close the gate:** `node projects/briefs/route-engine/scripts/write-authority.mjs disable`
11. **Friday 12:00 PT:** *"Run the week snapshot"* (`snapshot-week.mjs --part=all`). This records what actually happened.

**Rule for the first two weeks:** you do steps 1–3 and Spencer reviews the dry run before you go live. After that, run the whole loop yourself and send Spencer the timetable link.

---

## Part 6 — CallRail

| Task | Say | Script behind it |
|---|---|---|
| Daily call review | "grade yesterday's calls" | `fetch-day-calls.mjs [date]` builds a briefing. Claude scores each call against `GRADING-RUBRIC.md` |
| Fix bad Jobber clients from calls | "run the CallRail to Jobber sync" | `callrail-jobber-sync.mjs`: dry run first, then `--apply` |
| Who's answering | "who's answering the phones this week" | `who-answers.mjs` |
| Close rate | "what's the phone close rate" | `close-rate.mjs` |
| Missed calls | "what happened to missed calls" | `missed-call-outcomes.mjs` |

All of these are in `projects/briefs/callrail-faq/scripts/`. **Don't change the grading rubric.** Scores have to mean the same thing from month to month. If a policy changes, ask Spencer to add a dated amendment.

---

## Part 7 — Reports

- **Daily dashboard:** *"refresh the daily dashboard."* This is one page covering today's jobs, calls, and money.
- **Monthly call grading:** *"build the month's call grading report."*
- **Ads:** *"got moles ads status."* Read-only. **Never change bids, budgets, or ads** without Spencer.
- **Ninety scorecard:** this runs from Spencer's machine. Don't set it up on yours, or the numbers get posted twice.

---

## Part 8 — Rules of the road (read twice)

**One writer at a time.** You and Spencer each have your own copy, and each copy has its own write gate. His gate doesn't stop your writes, and yours doesn't stop his. Before any live Jobber or OptimoRoute write, **text Spencer "I'm writing routes now"** and wait for his OK. Two people writing the same week will scramble the board.

1. **Dry run first, every time.** Never pass `--execute` or `--apply` until you've read the dry run.
2. **Crons stay off.** Never turn on `route-drift-check`, `jobber-visit-followups`, or `route-horizon-extend`. Each one rewrote real routes without anyone watching. Only Spencer turns crons back on.
3. **Use Opus for anything that writes to Jobber or OptimoRoute.** Don't switch to a cheaper model to save usage. A wrong answer here goes out to real customers in their texts.
4. **No weekend visits.** Got Moles works Monday to Friday. A Saturday or Sunday visit is a mistake to fix, not a visit to route.
5. **No day moves without Spencer's approval.** Spencer sets the days. Overtime is the only reason to change one.
6. **Compare tech workload in hours, not visit counts.** Drive time per stop ranges from about 4 to 18 minutes.
7. **Clear ghost stops before judging a route.** OptimoRoute can hold orders for visits that are gone from Jobber. The sync deletes them. Don't trust map balance until it has run.
8. **Jobber times are 3-hour arrival windows**, not exact appointment times.
9. **Visits parked on Courtney are on purpose.** They're staging for a mass move. Leave them alone unless Spencer says otherwise.
10. **Tavis covering Snoqualmie is on purpose**, even though the territory map says Alias. Don't let a script hand it back.
11. **Cadence:** on a TMCP job, any activity (fresh sign, a catch, or a miss) means a visit every week. No activity and no catch means monthly. Quick Fix is always weekly for its 5 weeks. After that it's a sales call, not an automatic add.
12. **Never deploy the website.** Site changes go through Roy.
13. **No customer data or keys in email, chat, or Notion.** Keys stay in `.env`.
14. **End every session with "wrap up"** so your memory saves and backs up.

---

## Part 9 — First week checklist

- [ ] Part 1 installed, profile loaded, backup pushed
- [ ] Keys in `.env`, your own Jobber auth done, all three tests pass
- [ ] Ops pack installed and registered
- [ ] Say "list skills" and check that the ops skills show up
- [ ] Read-only practice: "show today's routes", "pull next week's visits by tech with hours"
- [ ] Grade one day of calls and compare it with Spencer's grading
- [ ] Refresh the daily dashboard
- [ ] Shadow Spencer through one weekly routing loop
- [ ] Run the next loop yourself up to the dry run (step 3) and send it to Spencer for review

**Stuck?** Ask Claude first: *"how do I…"* or *"why did this fail?"* Then Spencer. Roy handles anything with the shared repo.
