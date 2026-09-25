# Duplicate Jobber client records — cause, scale, and the fix

Investigated 2026-08-13 after the 08-12 call grading turned up two client records for Chris Breiland
and two for Travis Bruce (the Bruce pair is what made Mo tell a paying customer his money hadn't
arrived). All queries read-only. Scan window: **90 days, 805 client records created**.

---

## The scale

| | Count | Share |
|---|---:|---:|
| Client records created in 90 days | 805 | — |
| **Completely empty and still live** (no email, no address, no quote, no job, no invoice) | **389** | **48%** |
| …of those, caller-ID-shaped names (`Wireless Caller`, `Dey,Sanjay N/A`, `Tacoma Wa`) | 52 | |
| …of those, sharing a phone with a real customer record — true duplicates | **36** | |
| Pairs with real data on **both** sides — need a genuine merge | 18 | |
| Spam / non-US phone numbers | 3 numbers, 11 records | |

Roughly **one in two client records created is an empty shell.** That is what makes the search box
unreliable, and an unreliable search box is what produced the Travis Bruce incident.

---

## The cause — what I verified and what I didn't

**Verified:**

- **Nothing in this repo creates these.** The only `clientCreate` in the codebase is
  `projects/briefs/callrail-faq/scripts/callrail-jobber-sync.mjs`, and it (a) only touches calls that
  carry a Voice Assist message, and (b) searches by phone first and creates only when there is no
  phone match. It is not the source.
- **The system already knows the stubs exist.** `projects/briefs/lead-alerts/lead-alert.mjs` has
  `JUNK_HOLD_MS = 70 * 60 * 1000` and a `JUNK_NAME` regex for `wireless caller|unknown|restricted|
  anonymous`, and labels those records **"Phone lead — caller ID only."** The stub is an input to the
  lead alert, not an accident nobody noticed.
- **Jobber's API has no client-merge mutation.** Only `clientArchive` and `clientEdit`. Real merges
  have to happen in the Jobber web UI.

**Not verified — needs someone to look at a settings screen:**

The stub is written **outside this repo**, at the second the call connects, carrying the caller-ID
name. That is the signature of the CallRail↔Jobber integration creating a customer for unknown
callers. I can't read integration settings through the API, so check the toggle in **Jobber → Apps →
CallRail** (and the mirror setting in CallRail's Jobber integration).

**The duplicate itself is then created by a person.** The stub says `C Breiland`; Mo asks the customer
his name, types "Chris Breiland" into search, gets nothing, and makes a new client. Both records now
exist, one with the quote and one with nothing.

**Correction to the 08-12 grading report:** I wrote that duplicates are auto-created "on every inbound
call." That is wrong in two ways. The *stub* is created on inbound calls; the *duplicate* only appears
when whoever answers doesn't find the stub. And several pairs are not same-call duplicates at all —
`Brian Malgarini` (07-13) and `Mike Malgarini` (07-28) are two weeks apart, i.e. an earlier call from
the same number that never converted.

---

## The fix, in the order worth doing it

### 1. Do NOT turn off the auto-create first — it will break the lead alert

This is the obvious move and it has a trap. `lead-alert.mjs` learns that a phone lead came in *by
seeing the stub appear in Jobber*. Kill the stub and Spencer stops getting emailed about inbound
callers nobody wrote down — which is exactly the lead most worth chasing. If the auto-create is going
away, `lead-alert.mjs` has to be repointed at CallRail's API first.

### 2. Search the phone number, never the name (free, highest leverage)

Every stub carries the caller's number even when the name is junk. The number is on screen when the
phone rings. **Paste the number into Jobber search before saying anything else, and fill in the record
that comes back** rather than creating a new one.

This is already a rule in Mo's training — it broke on 08-11 (Bruce) and again on 08-12 (Breiland), and
it is the same root cause both times. It belongs in tomorrow's drill list, not just the doc.

### 3. Nightly sweep to archive stale empty stubs

Archive any live client older than ~14 days with **no email, no address, no quote, no job and no
invoice**. Lossless by construction — there is nothing in the record to lose — and it cannot collide
with the lead alert, which only looks back a few hours. Steady state is roughly 4–5 records a day.

Caveat worth stating: an empty record *could* be a lead someone means to call back. The 14-day hold
plus the "nothing attached at all" test makes that unlikely, but it is a judgement call, not a
certainty.

### 4. Clean the backlog (three piles, three different treatments)

- **36 records — archive now, zero risk.** Each is an empty stub sharing a phone with a complete
  customer record. Full list below.
- **18 pairs — merge by hand in the Jobber UI.** Data on both sides, so an archive would lose
  something. Includes `Matt Buelow` / `Matt Bulow` (two different emails — check which is real) and
  `Steve Murdock` (`jsmuu1@msn.com` vs `jsmuu11@gmail.com`).
- **11 spam records across 3 numbers** — archive: `@jmailservice.com`, `@dandyaisoftware.com`, and
  `shariful.ads1@gmail.com` on a Bangladeshi number.
- Plus 5 identical `Tacoma Wa` records created at the same second on 05-26 and 05-27.

---

## Pile 1 — safe to archive (empty stub → real record on the same phone)

Every DROP row below has no email, no address, no quote, no job and no invoice.

| Phone | Keep | Archive |
|---|---|---|
| 2537363313 | Sauce | Tangi Siaosi |
| 6504369820 | Louis Huang | Wireless Caller |
| 2532185100 | Pam Yzaguirre | Yzaguirre P. |
| 2064951809 | Theresa Feeley | Wireless Caller |
| 5033337275 | Mitchell Parrish | Deruiter Andrea |
| 2067930649 | Steve Burns | Burns Steven |
| 2063832500 | Anne Nguyen | Nguyen Anne |
| 2062000998 | Danielle Steele | Steele Danielle |
| 2062272568 | John Mears | Mears John |
| 4152725520 | John Kinsella | Kinsella John |
| 2537400710 | Joann Mortenson | Mortenson M. |
| 2535303334 | Norpoint | Rosedale N/A |
| 6072791238 | Frank Ciaramello | Ciaramello F. |
| 2533440018 | Madera West Condos | Lambert Sharon |
| 2535485428 | Larry Brewer | Teresa Brewer |
| 2405438699 | Katie Marvin | Wireless Caller |
| 6175198405 | Deborah Berger | Deborah Cheng |
| 2066784761 | Bac Walker | Bac Nguyen |
| 2063838709 | Patrick Kennedy | Wireless Caller |
| 2069629582 | Mike Malgarini | Brian Malgarini |
| 5177451081 | Ryan Linderman | Ryan Linderman |
| 2143858913 | Sanjay Dey | Dey,Sanjay N/A |
| 2532796772 | Lisa Politeo | Politeo,Elizabe N/A |
| 6302517685 | Jenna Elberts | Kevin Elberts |
| 4255034440 | Carlie Stusser | Wireless Caller |
| 2063214155 | Joe Pruitt | Joe Pruitt |
| 4434983272 | ChittiBabu Pacharu | C Pacharu |
| 2063566916 | Will Reagan | Will Reagan |
| 2067781665 | Tad Hutchison | T Hutchinson |
| 4254666441 | Terry Wirth | Terence Wirth |
| 9258089896 | Terry Dombroski | Dombroski,Terry N/A |
| 2066978310 | Huy Nguyen | Huy Nguyen |
| 4253377593 | Jennifer — | Taylor Ricky |
| 4257666225 | Dino P. Simone | Wireless Caller |
| 2067071311 | Andre Rodriguez | Iphone Andre |
| 2062579448 | Chris Breiland | C Breiland |

Some of these pairs are probably two real people on one household or office line — `Kevin` / `Jenna
Elberts`, `Larry` / `Teresa Brewer`, `Mike` / `Brian Malgarini`. It doesn't change the call: the
archived side holds no data either way. If one of them later turns out to be a separate customer,
they get a fresh record with real information in it.

## Pile 2 — merge by hand (data on both sides)

Lan Kulapaditharom · Matt Buelow/Bulow · Lance Steffey · Maria Beritich · Nazanin Kimiai ·
Arash Mirhosseini/Mirosseini · Devin Hill (**3 records**) · Tami Wooding · Carin Mack ·
Robert Jensen · Steve Murdock · John Shepard · Mark Fetters · Doug Crow · Chris Sica ·
Brian Meadows (both created in the *same second* — worth a look, that one isn't a caller-ID stub) ·
Nolan Dodgen · Alicia Hoare. Plus three name-variant pairs: Sang Hoon Shin, Michael/Mike Winkler,
Ed/Edward Elway.

---

## Recommended sequence

1. Drill "search the number, not the name" with Mo tomorrow — stops new ones today, costs nothing.
2. Check the Jobber → Apps → CallRail auto-create setting so we know what we're dealing with.
3. Archive pile 1 (36) and the spam (11). Reversible in Jobber if anything looks wrong.
4. Build the nightly stale-stub sweep.
5. Work pile 2's 18 merges by hand — worth doing before the next big Jobber report, since duplicates
   split a customer's history across two records.
6. Only then consider turning the auto-create off, and only after `lead-alert.mjs` reads CallRail
   directly.
