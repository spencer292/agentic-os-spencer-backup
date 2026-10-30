# Digest B: Lead handling, nurture, reviews/referrals, CRM (HSA Starter / SnipeyLead)

Sources (all under `projects/briefs/hsa-starter/skool-corpus/`): `05-snipeylead-training/` (01-10), `10-crm-setup-jobber/` (01-05), `15-snipeylead-recorded-calls/` (01-09, weekly Q&A with the SnipeyLead support lead, 2026-08-04 to 2026-10-06). The `pdf/` subfolders are empty. Abbreviations: S05 = 05-snipeylead-training, S10 = 10-crm-setup-jobber, S15 = recorded calls.

Evidence caveat: lessons are demos of a HighLevel white-label. Performance numbers are the instructor's own claims (Christmas-lights and window businesses), not verified. SnipeyLead is not the recommendation; the methods are.

---

## 1. What is taught

### 1.1 Speed to lead (the core idea)
- Claim: the Harvard Business Review lead-response study shows replying in under 1 minute gives a "391% higher chance of closing" versus 24 hours. Instructor: speed to lead is "the singularly most important thing" (S05/01, S05/03). The number is the course's, not independently checked.
- Target: contact within seconds to 1 minute. The inbound lead triggers a call to the owner/sales phone: "You have a new lead, press any key to connect." Pressing a key outbound-dials the lead, so a human talks to them live. "Nobody thinks a fast contractor is desperate" (S05/01).
- Flow in business hours (S05/03, S05/01, S10/01):
  1. Lead created, placed in pipeline stage "Lead", tagged by source (new Facebook lead, TikTok, Google, form).
  2. Email alert to owner with merge fields (name, email, phone).
  3. Business-hours gate (example 7 AM-8 PM; editable).
  4. Text alert to owner, then about 1 minute later the whisper call "press any key to connect".
  5. No answer: pre-recorded voicemail drop (MP3 in the owner's voice, casual, no lead name), then an automatic text. If the lead's voicemail picks up, the owner just hangs up.
  6. No reply: follow-up texts at about 1 hour and at about 12-26 hours ("Let us know, happy to help", "Keep us posted"). Total three text follow-ups; "any more and you get blocked" (S05/03). Timings differ between lessons: S05/01 says 1 h then 26 h; S10/01 says 12 h then 24 h. All editable.
  7. Any reply, inbound call, or answered call removes the lead from all automations and moves the card to "Engaged lead" / "Hot inbound lead". Next morning the team calls the Hot column first (S05/01 credits this with the jump in appointment booking; Christmas business claimed 490K to 800K).
- After-hours flow: no call, no voicemail. Immediate text: "we just saw your form come in after business hours, wanted to show you were on it. How does your schedule look after 9 AM to chat?" An AI sentiment check on the reply sends "we'll reach out tomorrow" if positive. If silent, follow-ups wait for a configured next-day window (example 10:30-5, weekends optional) (S05/01, S05/03).
- The first text is compliance-driven: "you have to do that legally with an automated system, but it doesn't change response rate" (S05/01).
- Example voicemail: "Hey, this is the team over at X. We just saw you submitted a form on our site, and we're going to shoot you a text right after this voicemail. Feel free to call me back directly on this number or reply to the text and we'll get you started." Example first text: "Hey [first name], this is Jack with X. We left you a voicemail as well. Please feel free to reach back out at your earliest convenience and we'll get you started on your quote."
- Missed-call text-back: phone settings > Voice > Voicemail and missed call text back. Default: "Hey, this is [business]. I saw we just missed your call. How can I help you?" Editable (S15/02, S15/06). Inbound calls alone do not enter a pipeline; only form, ad or receptionist triggers do (S15/02, S15/09).
- Call routing quirks (S15/03, S15/09): default ring timeouts (10-20 s) can send calls straight to voicemail before a second person rings; raise the timeout and the "ring team members" list; a second number needs an admin user or a manual switch to reply from it. A "receptionist" form logs a phone-in lead without triggering a second callback call.
- Mobile app: SMS, Facebook and Instagram DMs and Google Business messages in one inbox. Mark-as-unread keeps "last message inbound" items red so none are forgotten (S05/06).

### 1.2 Form-to-phone flow (S05/04, S05/08)
- A prebuilt "lead opt-in form" is wired to the phone sequence. Embed code on the website, or a direct link. Standard fields: name, email, phone, plus an optional multi-line "what are you looking for" stored in Additional Info. Taught: do not customize at first. On submit: message or redirect to a booking/thank-you page.
- Funnel and review pages can live on a subdomain (info.yourdomain.com) via CNAME (S05/08).
- Jobber pairing (S10/01): the website form posts to SnipeyLead (call and text start instantly) and also creates the client in Jobber. SnipeyLead handles "marketing, nurturing"; Jobber handles quote, schedule, payment. The instructor says Jobber nurtures poorly: no SMS targeting, spotty email, cannot segment by stage.

### 1.3 Facebook lead ads hookup (S05/05, S15/01, S15/03, S15/08, S15/09)
- Connect the Page and Instagram under Settings > Integrations (all leads). Then Facebook form field mapping: select the specific lead form, map each question (first/last name, email, phone, city; custom questions go to notes/additional info). Confirm the "Facebook lead form submitted" trigger is published.
- Failure modes seen on calls: new ad forms not mapped so leads sit in Meta; unmapped yes/no questions; the Facebook connection silently expires and needs a reconnect (about every 90 days); a yellow "forms not mapped" warning. Retest after any change.

### 1.4 Pipeline stages (S05/01, S05/03, S10/01)
Lead > Engaged/Hot inbound > Made contact > In-person or remote estimate scheduled > Quote sent pending approval > Closed won / Closed lost > "Ghosted, never made contact". Stage changes drive messages, review requests and later segment blasts (everyone who did work in the last 365 days; the ghosted bucket).
Pitfalls (S15/09, S15/06): booked customers still got "still interested?" texts because they remained in another workflow. Fixes: "if contact replies/answers, remove from workflow", an "answered" tag, and a master workflow on stage change that removes the contact from all lead workflows.

### 1.5 Quote chase and the 30-45 day blast (S05/01)
- No quote-chase automation beyond the lead-stage texts is taught. The explicit follow-up is a manual SMS blast to the ghosted/inbound column 30-45 days after the sequence ends: "Hey, it's Steve with X, you reached out about a month or so ago for [service]. I know everybody gets busy. I'm going to cross this off my list if you're not interested, but wanted to follow up one more time and make sure you know we're still ready to give you an estimate." Claimed yield: 10-15 replies from 143.
- Cap: "don't pepper people more than four or five times" per sequence.

### 1.6 Two-year email/SMS nurture (S05/07, S05/02, S15/08)
- Cadence: one value email per week for two years. Templates: 12 monthly folders, about 8 emails each (4 year-one, 4 year-two), seasonal content (New Year in January, holidays), subject line auto-inserts the year. Each email ends with a book-a-call link.
- Mechanics: a "monthly nurture" automation folder fires on contact creation, picks the current month and week, waits a year, then runs year two. Any new contact (phone-system lead, form, manual add, CSV import) enters automatically.
- Content examples (S05/02): pressure-washing value emails on protecting property value; a new-year "start fresh" windows email. Birthday and holiday goodwill messages are prebuilt. No full email copy is shown in the corpus; templates live inside the product.
- Offers: none specified inside the nurture. Separate 365-day-customer promos and special blasts are mentioned (S10/01, S15/07).
- Warnings: no scraped or purchased lists ("you will get banned by your phone provider"); warm contacts only (S05/07). Bulk adds should be dripped (50 per 30 min); one user had about 200 emails flagged as spam by Google after a bulk workflow add (S15/01, S15/08). Always filter "DND not enabled for email" before blasts. Batch guidance: up to 300-400 recipients at once, above that about 200 per 30 min (S05/09).
- Reactivation: past clients or cold leads are added by tag or CSV-import tag to a workflow with a wait step (S15/01); prebuilt reactivation workflows exist.

### 1.7 Reviews (S05/10, S15/07, S05/02)
- Trigger: job moved to the "Job completed" stage, or tag "request review" (bulk-applicable in drip mode).
- Flow: wait about 3 days, send email (and one text; instructor recommends deleting the duplicate text) linking a one-question rating form. Follow-up emails the next day and about 3 days later until a "review received" goal removes the contact.
- Routing: 4-5 stars lead to a thank-you page with the Google (or Yelp) link; 1-3 stars get "sorry to hear it" and no public link. The course calls this "smart logic" and "mitigate the problem before Google". This is review gating (see 2.6): do not copy.
- Ask text: "Hey, thanks for working with us. Could you leave us some feedback here, please?" plus link.

### 1.8 Referrals (S05/10)
- Only after a 4-5 star rating (same gate). Sequence: thank-you email, a thank-you SMS 3 minutes later, then one day later a referral email asking for "friends, neighbors, or family" via a referral form.
- The submitted referral becomes a contact and gets its own outreach (email, SMS, follow-ups) naming the referrer when the SnipeyLead funnel link is used, linking to the booking calendar. A tracking workflow emails the owner when a referred person converts so the customer can be thanked.
- No reward or dollar offer for referrers is taught anywhere in the three folders.

### 1.9 Jobber setup (S10/02-05)
- CRM habit: save every caller as a client at first contact even if they never book (name, phone, email, address, lead-source custom field on a mid-tier plan).
- Stages: Quote > Approved > convert to Job > schedule (visit, crew, colored by crew) > complete > invoice > payment (card on file, deposits, pay-by-phone). Booking confirmation email/text, text/email reminders (S10/03, S10/05). The Request column is ignored by the instructor.
- Map view of unscheduled jobs for route matching; claimed to cut two hours of drive to 30 minutes; schedule in-person estimates on days already in that area (S10/05).
- Records value: one customer file with quotes, approvals, visit dates, crew, receipts, email trail (S10/04, a subpoena anecdote).
- SnipeyLead-Jobber sync (S15/04, S15/05, S15/07, S15/09): native integration is hard (client ID/OAuth); Zapier is the common bridge; match pipeline stages in both tools and move people by stage-change triggers. An August 2026 live training used an AI prompt plus webhooks to bypass Zapier (referenced, not in this corpus). Quotes sent from Jobber go out on a different number; tell customers to reply on the SnipeyLead number, or run two numbers (leads vs customers).
- Jobber's own automations (quote follow-up, reminders, review asks) are not covered; the course deliberately uses SnipeyLead for them.

### 1.10 Compliance and setup items surfaced on calls
- A2P 10DLC registration is required to text from a US number; the support lead builds a minimal "A2P funnel" landing page (services, privacy policy, terms, opt-in language, chatbot) to pass carrier review (S15/03, S15/04, S15/08). Texting only.
- Conversation AI looped and "got spammy"; one user turned it off (S15/09). Needs guardrails and testing.

### 1.11 Metrics tracked (as taught)
Mostly implicit: card counts per stage, lead-to-appointment rate, quote-to-close rate, source via tags, who replied overnight (Hot column). Instructor figures: 25-35% more sales from speed to lead plus nurture (called conservative), Christmas business 490K to 800K, a $5,000 job closed on the 4th automated touch, ghosted blast 10-15 replies from 143. No dashboard or KPI lessons.

---

## 2. Got Moles fit (no HighLevel)

Starting facts: leads come by phone (CallRail) and web forms; Jobber is the CRM; Gmail/Workspace available; email platform undecided.

### 2.1 Speed to lead
- Target: first human contact in under 5 minutes in business hours for forms; every missed call gets a text within 1 minute. Measure both.
- Form leads: route the website form to (a) a Jobber request/client and (b) an instant alert (Gmail, plus SMS to whoever answers phones). Use a webhook or Zapier/Make if the form tool needs a bridge. CallRail form tracking can also alert; confirm what the current plan includes.
- Missed-call text-back: CallRail text features or a rule on the call flow's no-answer branch. Wording from the course works, adapted: "Hey, this is Got Moles. Sorry we missed your call. Is this for a home or a business, and about how many acres?" That serves the standing rule to capture property type and acreage at intake.
- Routing: CallRail call flows for ring order and timeouts (avoid the 10-20 second voicemail trap from S15/03 and S15/09).
- After-hours: auto-text acknowledging receipt and promising a morning call; no after-hours voicemail drops. A start-of-day list of replied and missed leads (Jobber saved filter or a sheet).
- Voicemail drop: skip. Text plus email is enough and drops add legal risk.
- Facebook lead ads: Meta instant forms to Jobber via Zapier, or to Gmail/Sheets alerts. `ops-meta-ads` owns campaign work; test every new instant form end to end, since S15 shows leads stalling unmapped. Calendar a 90-day reconnect check.

### 2.2 Pipeline and quote chase in Jobber
- Mirror the course stages with Jobber statuses: Request, Quote sent, Quote approved, Job, Complete, plus tags (lead source, TMCP vs Quick Fix, residential vs commercial, acreage). A "ghosted" saved filter: requests or quotes older than 14 days with no response.
- Jobber follow-ups (verify plan tier): quote follow-up text/email 2 and 5 days after sending, visit reminders, post-visit message. Cap at 3-4 touches, per the course.
- Standing rules: commercial and over 5 acres never get a phone price; route to Cory for an in-person bid. Automated texts must not quote prices.
- 30-45 day last-chance text to unconverted estimates, using the course wording, only where consent exists (2.6).

### 2.3 Nurture and winback (email platform TBD)
- Do not rebuild 96 weekly emails. Build a seasonal calendar tied to mole activity: about 12-20 emails a year, quarterly at minimum, monthly in peak months.
- Segments by Jobber tag: TMCP active (retention, what to expect, seasonal activity, referral), Quick Fix completed (winback), unconverted estimates (educational, soft), lapsed customers.
- Quick Fix to TMCP winback, Jan-Mar: 3-4 emails plus 1-2 texts to Quick Fix customers starting about 30 days after the last visit and again in January: moles return, here is monthly protection ($100/$125/$150 by acreage tier). Use Posture A wording (chemical-free, safe for pets and children; no kill language).
- Platform needs (Mailchimp, Klaviyo, Brevo, or Jobber campaigns): tag-based segments, one-click unsubscribe, suppression list, throttling, UTM tracking. Throttle first imports (course: 50 per 30 minutes).
- Seed list: export Jobber clients (email, last service, product, status), clean, import with consent state recorded.

### 2.4 Reviews and referrals
- Review ask: send to every completed customer on one schedule, not filtered by satisfaction. Use Jobber's post-job follow-up (or the email platform) with the direct Google review link for the customer's GBP location. Wait about 1-3 days after the visit, one reminder, stop.
- Unhappy customers: a separate private "tell us how we did" contact option shown to everyone alongside the Google link, not as a gate.
- Ask text: "Thanks for choosing Got Moles. If you have a minute, a Google review helps neighbors find us: [link]." No incentive, no star screen, no quota, no technician-naming.
- Referrals: a referral ask is not a review, so asking satisfied customers is fine. Timing: after a positive reply, after a catch-free confirmation visit, or at the TMCP anniversary. The course offers no reward; if Got Moles adds one (for example a month credit for both sides), keep it fully separate from review requests and state terms. Tag lead source "referral" in Jobber and thank the referrer on conversion.

### 2.5 Skip
- SnipeyLead/HighLevel itself, funnels and site builder, Conversation AI, business-in-a-box templates, domain connect, Slack integration, the Zapier-vs-webhook debate, the lead mobile app (CallRail and Jobber apps cover it).
- Voicemail drops, the "press any key" whisper call, two-year weekly cadence, birthday messages, review gating, funnel-link referral automation.
- Purchased or scraped lists: never.
- S10/03-05 is basic admin; only map-view route matching is relevant and OptimoRoute already does it.

### 2.6 Risk flags
- Review gating (S05/10, S15/07): diverting 1-3 star customers away from Google violates Google's review policy against selectively soliciting. Do not adopt in any form.
- Incentives or quotas: not in the course but easy to add by accident (for example "$10 off for a review"). Prohibited, as is naming a technician for credit.
- TCPA/consent: the course treats a web-form submission as permission to call, text, drop prerecorded voicemail and run up to four automated touches. For automated or marketing texts the safe standard is express written consent with a clear disclosure on the form (who texts, what, frequency, message and data rates, STOP/HELP). Prerecorded voicemail drops are the riskiest piece. Marketing texts (winback, 30-45 day check-ins, promos) need that consent; transactional texts (reminders for booked jobs) are lower risk. Washington has its own telemarketing and consumer-protection rules; use 8 AM-8 PM local, not the course's wide window. Have counsel confirm form wording.
- Referral outreach: auto-texting a referred person who never opted in is unsolicited marketing. Use a single email or have the referrer share a link.
- A2P 10DLC: any text platform needs brand and campaign registration. The thin "A2P funnel" workaround in S15/04 is a shortcut that can get numbers blocked; register honestly.
- Email: CAN-SPAM unsubscribe and sender identity; honor opt-outs; throttle imports; the "DND not enabled" filter is the right habit.
- AI auto-reply: looped badly on S15/09. If used, scheduling help only, never prices, claims or method wording (Posture A).
- Claims in any nurture copy must pass the `mkt-cmo` claims gate and the review-count rule in CLAUDE.local.md (283 five-star, not 219+ or 292).
- Data hygiene: customer exports stay out of git; keep only aggregate counts in tracked files.

---

## 3. Lesson-to-topic index
| Topic | Files |
|---|---|
| Speed-to-lead story, stats, sample messages | S05/01, S05/03, S10/01 |
| Phone-sequence setup (hours, voicemail, texts, assign user) | S05/03 |
| Website form embed | S05/04 |
| Facebook lead ads mapping | S05/05, S15/01, S15/03, S15/08, S15/09 |
| Mobile app, unread flag | S05/06 |
| Two-year nurture | S05/02, S05/07, S15/08 |
| Email blast mechanics, DND filter, batching | S05/09, S15/01 |
| Subdomain/funnel | S05/08 |
| Reviews and referrals | S05/10, S15/07, S05/02 |
| Missed-call text-back, call routing, second numbers | S15/02, S15/03, S15/06, S15/09 |
| A2P registration | S15/03, S15/04, S15/08 |
| Jobber/SnipeyLead sync, Zapier, stage mapping | S10/01, S15/04, S15/05, S15/07, S15/09 |
| Jobber basics and scheduling | S10/02-05 |
| Conversation AI trouble | S15/05, S15/09 |
| Remove-from-workflow fixes | S15/06, S15/09 |
