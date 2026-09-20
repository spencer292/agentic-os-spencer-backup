---
name: tool-behaviour-analytics
description: >
  Set up and read behavioural analytics on a website: Microsoft Clarity heatmaps, session
  recordings, Smart Events and funnels, plus GA4, Google Tag Manager and consent mode. Five
  modes: setup and verification, event taxonomy with one snake_case funnel vocabulary and a
  single track() seam, funnel and dashboard design, reading the evidence with a weekly
  review that feeds a CRO audit, and privacy covering masking, consent and retention. Use
  when the user says: "set up Clarity", "Microsoft Clarity", "heatmaps", "session
  recordings", "add analytics to the site", "GA4 setup", "GTM", "tracking plan", "event
  taxonomy", "conversion tracking", "build a funnel", "where are people dropping off",
  "rage clicks", "dead clicks", "consent mode", "weekly analytics review". Do NOT use for
  scoring one page (str-cro-audit), discovery interviews (str-ux-research), keyword data
  (str-ai-seo), or ad reporting (ops-google-ads).
---

# Behavioural Analytics

Instrument a site so you can see what people actually do on it, then read the evidence
honestly. Clarity supplies heatmaps, recordings, rage and dead clicks. GA4 supplies the
counts. One event vocabulary feeds both.

## Outcome

**Produces:** `projects/tool-behaviour-analytics/{YYYY-MM-DD}_{site}-{setup|review}.md`.
Always save to disk, then show the full absolute path. Setup mode also writes code into the
site: a Clarity component or tag, a `track()` seam, consent wiring. Review mode writes none.

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `brand_context/icp.md` | summary | Whose behaviour is being read, and on which devices |
| `brand_context/positioning.md` | summary | What counts as a conversion for this business |
| `brand_context/design-system.md` | CTA rules only | Which elements should be getting the clicks |
| `context/learnings.md` | `## tool-behaviour-analytics` section | Past taxonomy and review patterns |

Missing brand context never blocks the work. Ask what the conversion is and carry on.

## Dependencies

| Skill | Required? | What it provides | Without it |
|-------|-----------|------------------|------------|
| `str-cro-audit` | Optional | Consumes the weekly findings and scores the page | Findings stay a list, no scored audit |
| `str-ux-research` | Optional | Discovery context and content inventory | Ask the user what the funnel is meant to do |
| `tool-website-security` | Optional | Confirms the CSP will not block the analytics hosts | Verify the tag fires manually in devtools |

## Skill Relationships

**Upstream:** `str-ux-research` for the funnel definition, `mkt-icp` for the device profile.
**Downstream:** `str-cro-audit` takes the findings as evidence, `mkt-copywriting` takes rage
clicks on ambiguous wording, `viz-page-architect` takes drop-off by section.
**Boundaries:** "score this page" goes to `str-cro-audit`, "interview the client" to
`str-ux-research`, "why are we not ranking" to `str-ai-seo`.

## Step 1: Pick the Mode

| Mode | Trigger | Output |
|------|---------|--------|
| A Setup | No analytics yet, or a rebuild | `_{site}-setup.md` plus code |
| B Event taxonomy | Events exist but are ad hoc | Taxonomy table plus `track()` seam |
| C Funnel and dashboard | Events live, nobody sees the drop-off | Funnel spec, built in Clarity |
| D Reading the evidence | At least a week of data | `_{site}-review.md` |
| E Privacy | Legal, consent or masking question | Consent and masking spec |

On a new build they run in order. On an existing site, D runs first and exposes the gaps.

## Step 2 (Mode A): Set Up the Tag

Read `references/clarity-api.md` before writing any code.

1. **Create the Clarity project.** One per site. The project id is the API key. Clarity is
   free with no traffic cap.
2. **Pick one install route, never two.** Next.js or any JS app: copy `assets/Clarity.tsx`,
   gated on `NEXT_PUBLIC_CLARITY_PROJECT_ID`. WordPress, Shopify, Wix, Squarespace: the
   platform integration in Settings, Setup. Anything else: the snippet in `head`. GTM:
   Clarity auto-detects the container.
3. **Turn cookies off by default** in Settings, Setup, then pass consent from the banner.
   For UK and EEA traffic this is not optional. See Step 6.
4. **Wire GA4** through GTM, not a second snippet, so one `dataLayer` feeds both, then link
   GA4 inside Clarity. Container layout is in `assets/gtm-container-notes.md`.
5. **Verify.** Devtools, Network, confirm a POST to `https://www.clarity.ms/collect`.
   Confirm live users in Clarity, `dataLayer` in the console, events in GA4 DebugView.
6. **Record it** in the setup document: project id location, install route, event list, who
   has access, and any page relying on canvas or a third-party iframe, which Clarity cannot
   capture inside.

## Step 3 (Mode B): Build the Event Taxonomy

Read `references/event-taxonomy.md`. The rules that matter:

- snake_case, verb-shaped, describing the action only. Context goes in parameters, never in
  the name. GA4 event names are case sensitive.
- The funnel spine is always the same: page, engage, start, step_n, lead, conversion. A
  repeating step keeps one name and carries an index.
- Custom tags carry the cut, not the step: `segment`, `tier`, `variant`, `page_type`.
- Map every event to its GA4 equivalent, using the GA4 recommended lead lifecycle where it
  fits. The reference holds the full mapping table.

Install exactly one seam. Copy `assets/track.ts` for a typed app or `assets/track.js` for a
plain site. Every funnel step calls `track()`, which fans out to `dataLayer.push` and
`clarity("event", name)` and swallows every error, so a missing vendor never breaks a page.
Nothing outside the seam touches a vendor. Cap the plan at five to eight events and a
handful of tags, because a short plan that stays true beats a long one nobody maintains.

## Step 4 (Mode C): Design the Funnel and Dashboard

Events sent by `clarity("event")` arrive as API events and need no further setup. Add
page-visit and button-click steps code free where that beats a deploy. A project allows 20
custom Smart Events, admins only, so spend them on funnel rungs, not curiosities.

Build one funnel per journey, ordered, first touch to money. Every step links to its
filtered recordings and heatmaps, and that link is the point: the number says where, the
recordings say why. Add one dashboard filter set per audience cut using the Step 3 tags, and
turn Copilot on for grouped-session and heatmap summaries.

## Step 5 (Mode D): Read the Evidence

Follow `references/weekly-review-template.md`, which holds the table of what each map and
friction signal actually tells you, plus the fill-in template. Come with a written question,
leave with one change. Read in this order: funnel, then the heatmaps on the worst step's
page, then the friction signals, then filtered recordings, then Copilot last. Read mobile
and desktop separately, because they are different pages in practice. Change one thing at a
time, so the next review can attribute the difference.

Twenty filtered recordings on the page in question beats an hour of unfiltered browsing.
Never conclude from one recording: a recording is a hypothesis, a funnel step is a
measurement. Write findings as observation, hypothesis, then the one change. Hand them to
`str-cro-audit` as evidence.

## Step 6 (Mode E): Privacy

Read `references/consent-patterns.md` before touching consent code. Non-negotiables:

- Clarity enforces a consent signal for UK, EEA and Swiss visitors. Without it, tracking
  runs cookieless with a fresh id per page view and sessions never join across pages.
- Use `consentv2` with `ad_Storage` and `analytics_Storage`. The boolean
  `clarity('consent')` is deprecated and any live site still calling it needs migrating.
- Consent Mode v2 and PECR are separate obligations. PECR decides what you must ask
  permission for. Consent Mode decides what you must tell Google.
- Analytics cookies need consent in the UK. The 2026 statistical-purposes exemption is
  first-party only, and both GA4 and Clarity send data to a third party. Banners must offer
  reject with equal prominence, with no pre-ticked boxes.
- Clarity masks input content, numbers and email addresses by default. Mask more with
  `data-clarity-mask="true"`. Setting either mask attribute to false does nothing.
- Never put personal data in an event name, a tag or a parameter. No email, phone, name,
  address, or free text a user typed. Use an opaque reference via `clarity("identify")`.
- Retention is fixed at 30 days for recordings and 9 months for heatmaps and favourited
  sessions, so favourite or screenshot anything that has to outlive that.
- Clarity must not be used on sites aimed at under-18s. Disclose both tools in the policy.

## Step 7: Save and Present

1. Save to `projects/tool-behaviour-analytics/{YYYY-MM-DD}_{site}-{setup|review}.md` with
   frontmatter `site`, `mode`, `date`, `clarity_project`, `status`, then show the full path.
2. Present three things: what is now measured, what the evidence says, the one change next.
3. Ask "How did this land? Anything I read wrong?" and log the answer to
   `context/learnings.md` under `## tool-behaviour-analytics`.

## Rules

*Updated automatically when the user flags issues. Read before every run.*

- 2026-09-02: built at root for the web-design skill pack, currency pass against September
  2026 sources. Clarity consent enforcement for UK, EEA and Switzerland began 31 October
  2025 and `consentv2` replaces the deprecated boolean `consent` call, so existing
  `clarity('consent', true)` wiring on a live site is a fix, not a preference. Five heatmap
  types: click, scroll, area, conversion, attention. Smart Events capped at 20 custom per
  project, admins only. Retention: recordings 30 days, heatmaps 9 months.
- 2026-09-02: two consent problems found while building this skill.
  `C:\Users\roy.castleman\allthepower\src\components\Clarity.tsx` still uses the deprecated
  boolean call and needs migrating to `consentv2`, still outstanding.
  `C:\Users\roy.castleman\bobs-business-demo\src\components\Clarity.tsx` had no consent call
  and was fixed in this session by a ConsentBanner that sends `consentv2`.
- Never claim a cause from a single recording. Recordings generate hypotheses, funnels
  measure them. Never put personal data in an event name, tag or parameter.
- One event vocabulary for the whole site. If two names mean the same action, one is wrong.
- Report what the data shows, including when it shows nothing. "Not enough sessions to say"
  is a valid finding and beats a confident guess. Zero em dashes, full stops and commas.
- If the site has no consent banner and serves UK or EEA visitors, that is the first fix
  regardless of what else the review finds.

## Self-Update

If the user flags an issue, a misread heatmap, a broken snippet, a bad taxonomy, update the
`## Rules` section in this SKILL.md immediately with the correction and today's date,
format `- {YYYY-MM-DD}: {What was wrong and the rule to prevent it}`. Fix the skill, do not
just log it to learnings.

## References

| File | Contents |
|------|----------|
| `references/clarity-api.md` | Every client API call, limits, masking, retention, install routes |
| `references/event-taxonomy.md` | Standard funnel vocabulary, tags, GA4 mapping, naming rules |
| `references/weekly-review-template.md` | What each map and signal means, the review, the template |
| `references/consent-patterns.md` | Consent Mode v2, Clarity consentv2, UK PECR and ICO position |
| `assets/Clarity.tsx` | Next.js component, env gated, consent aware, consentv2 |
| `assets/track.ts` and `assets/track.js` | The single tracking seam, typed and framework free |
| `assets/gtm-container-notes.md` | GTM variables, triggers, tags, consent config, publish checklist |
