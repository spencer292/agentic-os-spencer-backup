# Text Desk — operator guide

Customer texts all land on the Jobber number **253-300-0889**, in one shared inbox with no owner.
This tool answers the question that inbox can't: **whose customer is this?**

Jobber cannot tell us a text arrived — there is no inbound-message webhook and the API cannot read
messages. So a person watches the Jobber message center, and this tool handles everything after
that.

---

## Daily routine

1. Start the tool (below). Leave it open beside Jobber.
2. Watch the Jobber message center.
3. New text comes in → copy the phone number (or the client's name) into the search box → Enter.
4. You get the owning tech, their job, the program they're on, the property, and how to reach them.
5. **Answer it yourself** if it's scheduling, timing, "are you coming today", billing, or general.
   **Hand off** if it's about what happened on the property, findings, trap placement, or anything
   the tech needs to answer.
6. To hand off: click **Copy handoff** and send it to the tech.
7. Click **Add to queue** for anything that isn't finished. It stays visible until you click Done.

The queue turns **red after 30 minutes**. That's the point to chase it. Nothing dropping through
the cracks is the whole point of the desk.

---

## Starting it

From `C:\Agentic-os-got-moles`:

```
node projects/briefs/jobber-text-routing/desk-server.mjs
```

Then open <http://localhost:8787>. Ctrl+C in that window stops it.

To let another machine in the office use it:

```
node projects/briefs/jobber-text-routing/desk-server.mjs --host 0.0.0.0
```

Then browse to `http://<this-machine-ip>:8787` from the other computer. Both machines must be on
the same network. There is no login — keep it on the office network only.

Prefer the terminal? Same answer, no browser:

```
node projects/briefs/jobber-text-routing/route-inbound-text.mjs "(253) 988-7254"
```

---

## Reading the result

| Field | What it means |
|---|---|
| **Big name at the top** | The tech who owns this customer |
| **high / medium confidence** | How sure. `high` = they have a visit booked, or completed one in the last 3 weeks. `medium` = last visit was 3 weeks to 4 months ago |
| **desk answers** | No tech owns it — a new lead, or nobody has been out in 4+ months. You handle it |
| **Program** | Total Mole Control Program or Quick Fix. Sets expectations on visit frequency |
| **Next / Last visit** | Usually tells you what they're texting about |
| **Reach them** | From `tech-contacts.json`, not Jobber |

**Warnings you may see:**

- *Number shared with…* — two clients have this number (spouses, property managers). Confirm who
  is actually texting before replying.
- *Texting is disabled for this number in Jobber* — reply by phone instead.
- *No contact details on file* — add the tech to `tech-contacts.json`.

---

## Tech phone numbers — do this the right way

**Never put a tech's number in their Jobber user profile phone field.**

Doing that makes their personal number selectable as the callback number on On My Way texts.
Customers then contact that personal line directly, the office never sees the conversation, and it
walks out the door when the tech leaves. That's a worse problem than the one this tool solves.

Jobber documents the workaround:

> "If you do not want to have 'my number' as an option for a team member, remove their phone number
> from their user profile. Instead, **a team custom field** can be set up as a way to record their
> number which will not add it as a callback option for on my way texts."

**Set it up once:**

1. Gear Icon → Settings → **Custom Fields** → add a field for **Team**, type Text, named something
   containing "phone", "cell", "mobile", or "contact" — e.g. `Work Cell`.
2. Gear Icon → Manage Team → each tech → fill in that field.
3. Leave the **profile phone field blank**.
4. Leave the On My Way callback set to **Office number**.

> ⚠ "Office number" reads from Gear → Settings → **Company Settings**, which is currently set to
> **253-326-1740 — Spencer's personal cell**, not the main line. Until that field is changed to
> **253-750-0211**, the "Office number" callback and any calls made to the texting number both
> ring Spencer directly.

The desk tool reads that custom field automatically, so Jobber stays the single source of truth
and nothing leaks to customers.

`tech-contacts.json` is a fallback for anyone not yet filled in. Jobber values win where both
exist. Keys must match the Jobber name exactly.

---

## If something breaks

| Symptom | Cause / fix |
|---|---|
| Red error box mentioning a token | The Jobber connection expired. From the repo root: `node .claude/skills/tool-jobber/scripts/jobber-api.mjs auth` |
| "Throttled" or slow lookups | Jobber's rate limiter. The tool already backs off and retries; wait a minute |
| Page won't load | The server isn't running — start it again |
| Wrong tech shown | Check the visit assignment in Jobber. The tool reports what Jobber says |

---

## What this does not do

It cannot see texts. It cannot send texts. It cannot assign anything inside Jobber — Jobber has no
concept of an assigned conversation. It tells a human who owns a customer, fast, so the human can
act. That is the whole scope of Path A, and it's deliberate.

Background, the options considered, and what it would take to go further: `brief.md`.
