---
project: wikidata-entity-strategy
status: active
level: 2
version: 2
created: 2026-05-02
parent: aeo-audit-2026
supersedes: brief.md (v1)
---

# Got Moles Wikidata Entity Strategy — v2 (with examples + Claude prompts)

L2 sub-project of `aeo-audit-2026`. Set up Got Moles + Spencer Hill as Wikidata entities — the highest-leverage single AEO action per the audit.

This v2 adds: explanations of WHY each step matters, real Wikidata examples to study, and copy-paste Claude prompts for the parts where AI help speeds Spencer's work.

---

## Why Wikidata matters (the actual mechanism)

**LLMs are trained on Wikipedia + Wikidata.** When ChatGPT, Claude, Perplexity, or Gemini sees a question about "got moles" or "mole control in Washington", their internal knowledge representation looks for an entity that matches. If Got Moles has a Wikidata Q-id with structured statements ("Got Moles is a pest control company in Western Washington founded in 2017 by Spencer Hill"), the AI can:

1. **Disambiguate** — "got moles" the company vs "got moles?" the question
2. **Verify** — claims on the company are backed by sources, AI weighs them as trustworthy
3. **Connect** — Got Moles → Spencer Hill → US Army veteran → Western Washington → Townsend's mole → mole control. AI walks this graph to answer related queries.
4. **Cite** — when AI answers, it can attribute to a verifiable entity rather than "some company website"

Without a Q-id, all of this is fuzzy. AI engines might mention got-moles.com but won't reliably identify the brand or attribute it as authoritative.

**Real example to study before starting:** [Orkin (Q7102943)](https://www.wikidata.org/wiki/Q7102943) — a pest control company on Wikidata. Open it, see how statements are structured, where references appear, what properties are filled. This is the model Got Moles needs to follow (just smaller scale).

---

## ⚠️ Honest notability assessment

Wikidata has notability hurdles for small businesses. **Most local SMB entries get deleted within 7-30 days unless they pre-empt the deletion criteria.**

The deletion problem: Wikidata editors patrol new items. If yours looks "promotional" (single-purpose account, no sources, vague description), it gets nominated for deletion within hours. You have ~7 days to defend it. Most small businesses lose this fight.

The mitigation: enter Wikidata with **multiple verifiable sources from day 1, an established editor account, and a strict factual description**. Editors looking at a well-sourced entity with external identifiers leave it alone.

### What qualifies Got Moles for notability (only need ONE)

| Criterion | Got Moles status | Notes |
|---|---|---|
| Existing Wikipedia article | ❌ None | Out of scope short-term |
| Multiple reliable third-party sources | ⚠️ Need to gather | **Phase 1 work** |
| External identifier from recognised authority | ✅ Almost certainly qualifies | WA SOS registry + likely OpenCorporates |
| Structural necessity (other Wikidata items reference this one) | ⚠️ Indirect | Becomes true once Spencer entity exists pointing back |

**Verdict:** Got Moles is borderline-notable but creatable IF Phase 1 source-gathering is done properly. Skip Phase 1 = entity gets deleted.

---

## Phase 1 — Source gathering (the make-or-break step)

**Why this matters:** Every claim on a Wikidata entity needs a verifiable source. "Got Moles was founded in 2017" needs a URL pointing to a third party that confirms 2017. Without sources, the entity gets deleted as unverifiable.

**Goal:** compile 3-5 reliable URLs Spencer can use as references when adding statements in Phase 3.

### Sources Spencer needs to gather

| Type | Where to find | What it backs | Priority |
|---|---|---|---|
| **WA Secretary of State business registration** | https://ccfs.sos.wa.gov/ — search "Got Moles" | Founding date, registered business, headquarters | 🔴 Must-have |
| **OpenCorporates entry** | https://opencorporates.com/ — search company | External identifier (notability anchor) | 🔴 Must-have |
| **BBB business profile** (if accredited) | https://bbb.org | Business credibility, address, accreditation | 🟡 Strong-have |
| **D&B / Dun & Bradstreet listing** | https://dnb.com — search company | External identifier (DUNS number) | 🟡 Strong-have |
| **Local press coverage** (any) | Google News + general search | Notability evidence (most important) | 🔴 Must-have if exists |
| **Industry trade publications** | Pest control / WA business pubs | Industry recognition | 🟢 Nice-to-have |
| **Veteran-owned business listings** | sba.gov/veterans, vetsfirstverification.com | Veteran-owned status | 🟡 Strong-have |
| **Spencer's military service record** | DD-214 or VA listing | Backs Spencer's Person entity | 🔴 Must-have for Spencer entity |

### 🤖 Claude prompt — Source discovery

Copy and paste this into Claude (any session) — it'll do the deep search work for you:

```
I need to gather third-party sources about my company "Got Moles" 
(mole control company in Western Washington, founded 2017 by Spencer Hill, 
based in Enumclaw WA) to use as Wikidata entity references.

Please search the web and return:
1. Any local press articles mentioning Got Moles or Spencer Hill (Tacoma 
   News Tribune, Seattle Times, Enumclaw Courier-Herald, KING5, KIRO7, 
   regional pest control trade pubs, etc.) — give me URLs + brief quote 
   from each
2. The Washington Secretary of State business registry entry URL for Got Moles
3. OpenCorporates entry if one exists
4. BBB profile URL if listed
5. Any Yelp/Angie's/Nextdoor mentions in published "best of" lists
6. Any veteran-owned business directory listings (SBA, VetsFirstVerification, etc.)

For each result, include the URL and a 1-line description of what it 
verifies (e.g., "Confirms founding date 2017", "Confirms veteran-owned").

If you can't find anything for a category, say so — don't make things up.
```

### Minimum-viable source set before proceeding to Phase 3

- ✅ WA Secretary of State business registration URL (auto-qualifies as a source)
- ✅ At least 2 reliable third-party press / industry sources mentioning Got Moles by name
- ✅ At least 1 external identifier ID (OpenCorporates / BBB / D&B / similar)
- ✅ Founder identification (LinkedIn URL minimum, ideally with a separate veteran-owned listing)

**If we can't muster these, Wikidata creation will likely fail. Press coverage is the gating factor.**

If press coverage is thin: pivot. Spend 2-4 weeks pitching local press the "veteran-owned mole specialist" angle (Phase 6 covers this). Then return to Wikidata after coverage exists.

---

## Phase 2 — Wikidata account setup (Spencer)

**Why this matters:** Wikidata's editorial community treats new accounts that immediately create promotional-looking entities as suspect. The 5-10 small constructive edits pattern signals "real editor, not a marketing operative" — which buys your Got Moles entity goodwill from patrolling editors.

### Steps

1. Open https://www.wikidata.org → top-right **Create account**
2. **Username**: `SpencerHill_GotMoles` (transparent — Wikidata values transparency over anonymity. A username that hides affiliation is more suspect than one that's open about it.)
3. Provide email (for verification) → confirm via email
4. Read https://www.wikidata.org/wiki/Wikidata:Welcome (15 min) — covers basic norms
5. Make 5-10 small constructive edits on existing items BEFORE creating new items

### Examples of "small constructive edits" Spencer can make

Pick existing items and improve them. Examples:

- Open [Townsend's mole (Q1374069)](https://www.wikidata.org/wiki/Q1374069) → check if all properties are filled, add a missing reference, fix a typo in a description
- Open [Enumclaw, Washington (Q985770)](https://www.wikidata.org/wiki/Q985770) → check city statistics, add a sister-city if missing
- Open [Pest control (Q9685)](https://www.wikidata.org/wiki/Q9685) → improve description if vague
- Open [American Mole (a few species exist)](https://www.wikidata.org/wiki/Q105731) → add references to scientific sources

### 🤖 Claude prompt — Find good first edits

```
I'm new to Wikidata and need to make 5-10 small constructive edits before 
creating a new entity (to establish editor credibility). My company is 
Got Moles, a mole control company in Western Washington.

Please suggest 8-10 specific Wikidata items related to my industry/area 
where small improvements would be welcome. For each, give me:
1. The Wikidata item URL (with Q-id)
2. What's missing or could be improved (e.g., "missing image", "unsourced 
   founding date", "description in English could be clearer")
3. The exact edit I should make

Focus on items related to: mole control, pest control, mole species 
(Townsend's, Pacific, Shrew), Western Washington cities (Enumclaw, Tacoma, 
Seattle), veteran-owned businesses, US Army units. Avoid items where I 
have a conflict of interest (Got Moles itself, Spencer Hill).
```

⚠️ **Do NOT rush to create the Got Moles item on a fresh account.** Single-purpose accounts get auto-flagged.

---

## Phase 3 — Create the Got Moles entity

After Phase 1 sources gathered + Phase 2 trust-building done.

### Step-by-step UI walkthrough

1. Wikidata search box (top right) → search **"Got Moles"** → confirm "no matches" exist (verified 2026-05-02)
2. Click **"Create a new item"** in the left sidebar
3. Fill the basic form (English language fields):

   | Field | Value | Why |
   |---|---|---|
   | Label | `Got Moles` | The canonical name |
   | Description | `mole control company in Western Washington` | Factual, non-promotional, location-specific |
   | Aliases | `Got Moles?`, `gotmoles.com` | Alternate ways the entity is known |

4. Click **Create** — item is created with a Q-id (e.g., `Q12345678`)
5. **Save the Q-id** — it's the entity's permanent identifier; you'll reference it in Phase 4 + 5

### 🤖 Claude prompt — Draft the description

Wikidata descriptions are STRICT — under 250 characters, factual, non-promotional, distinguishing. The #1 deletion trigger is promotional language. Use this prompt to test your draft:

```
I'm writing a Wikidata entity description for my company "Got Moles". 
Wikidata descriptions must be:
- Under 250 characters
- Factual, NOT promotional (no "best", "leading", "specialist", "trusted")
- Distinguishing (helps tell this entity apart from others)
- Lowercase first word (Wikidata convention)

Draft 5 candidate descriptions. Got Moles is:
- A mole control company
- Founded 2017
- Headquartered in Enumclaw, Washington
- Serves Western Washington (King, Pierce, Snohomish, Thurston counties)
- Founded by Spencer Hill, a US Army veteran

For each candidate, flag any promotional language and suggest fixes. 
Recommend the best one.
```

### Step-by-step — adding statements (claims)

Each claim = (property, value, source). Click **+ add statement** for each row below. Add one at a time so you can verify each before moving on.

#### Core properties (always add these)

| Property | P-id | Value to enter | Source you'll need |
|---|---|---|---|
| instance of | **P31** | business (Q4830453) — search this | (none — type-of-entity is structural) |
| official website | **P856** | https://got-moles.com | (no source needed for own URL) |
| inception date | **P571** | 2017 | WA business registration URL |
| country | **P17** | United States of America (Q30) | (self-evident) |
| headquarters location | **P159** | Enumclaw (Q985770) — search "Enumclaw, Washington" | WA business registration URL |
| coordinate location | **P625** | 47.2040°N, -121.9910°W (Enumclaw HQ) | Google Maps link |
| founded by | **P112** | Spencer Hill (his Q-id, after his entity is created in Phase 4) | LinkedIn or press article |
| industry | **P452** | pest control (Q9685) — search this | (self-evident) |
| number of employees | **P1128** | (current count, e.g., 10) | LinkedIn company page |
| service area | **P2541** | Western Washington (Q1411245) | Company website |

#### External identifier properties (CRITICAL — at least 1)

| Property | P-id | Where to get the value |
|---|---|---|
| OpenCorporates ID | **P1320** | opencorporates.com → find Got Moles → format: `us_wa/{ID}` |
| LEI (Legal Entity Identifier) | **P1278** | gleif.org if registered (most SMBs are not) |
| Better Business Bureau ID | **P5293** | bbb.org profile URL ID if accredited |

⚠️ **Add at least 1 external identifier in the FIRST session.** This is the single biggest factor separating "creatable" from "deletable" for SMB entities.

### How to add a reference (source) to a statement

For each statement that needs a source:

1. Click the statement value (e.g., the founding date "2017")
2. Click **+ add reference** below it
3. Fill in:
   - **stated in** (P248): if it's a publication, pick the publication's Wikidata item
   - **reference URL** (P854): paste the URL of the source page
   - **retrieved** (P813): today's date (when you accessed the URL)
4. Save

### 🤖 Claude prompt — Format Wikidata reference for a URL

```
I need to format a Wikidata reference for this URL: 
{{PASTE_URL}}

Please give me:
1. The publication or organisation (for "stated in" P248) — and its 
   Wikidata Q-id if I should look one up
2. A clean reference URL (P854 value)
3. Today's date for "retrieved" P813 in YYYY-MM-DD format
4. The actual claim this URL backs (e.g., "founding date 2017")

If the URL doesn't qualify as a reliable Wikidata source (blogs, 
self-published, low quality), tell me so I don't waste a slot on it.
```

---

## Phase 4 — Create Spencer Hill Person entity

**Why this comes second:** Person entities for SMB founders without Wikipedia presence often get deleted. Create AFTER Got Moles entity is stable for 7-14 days — that way the structural-necessity argument holds (Spencer is needed as the "founded by" target on the Got Moles item).

### Steps

1. Search Wikidata for "Spencer Hill" — multiple matches likely (it's a common name)
2. Confirm none of them are this Spencer Hill (Got Moles founder, Enumclaw WA)
3. **Create a new item**
4. **Label**: `Spencer Hill`
5. **Description**: `American businessman, founder of Got Moles` (factual, short, distinguishing — adding "businessman, founder of Got Moles" tells Wikidata editors which Spencer Hill this is)
6. **Aliases**: none

### Statements to add

| Property | P-id | Value | Source |
|---|---|---|---|
| instance of | **P31** | human (Q5) | (self-evident) |
| sex or gender | **P21** | male (Q6581097) | LinkedIn |
| country of citizenship | **P27** | United States (Q30) | LinkedIn |
| occupation | **P106** | businessperson (Q43845), entrepreneur (Q131524) | About page |
| place of birth | **P19** | Buckley, Washington (search for Q-id) | About page |
| residence | **P551** | Enumclaw, Washington | About page |
| employer | **P108** | Got Moles (his Q-id from Phase 3) | LinkedIn |
| owner of | **P1830** | Got Moles (verify legal structure first) | WA SOS |
| military branch | **P241** | United States Army (Q9212) | DD-214 |
| LinkedIn personal profile ID | **P6634** | URL path (e.g., "spencerhillmoles") | LinkedIn URL |

### 🤖 Claude prompt — Spencer Hill description draft

```
I'm writing a Wikidata description for Spencer Hill, founder of Got 
Moles (a mole control company in Western Washington). Multiple Spencer 
Hills exist — I need a description that distinguishes mine clearly 
without being promotional.

Wikidata description rules:
- Under 250 characters
- Factual, lowercase first word, no promotional language
- Should help disambiguate from other Spencer Hills

Spencer Hill (this one):
- American businessperson
- Founded Got Moles in 2017
- US Army veteran (infantry, 2011-2014)
- Lives in Enumclaw, Washington (born Buckley, WA)

Draft 5 candidate descriptions and recommend the best.
```

---

## Phase 5 — Connect entities (the entity graph)

Once both items exist, link them. AI engines walk these graph connections to surface related entities.

### On Got Moles item

- **founded by (P112)** → Spencer Hill (his Q-id) — with reference (LinkedIn or press article)

### On Spencer Hill item

- **employer (P108)** → Got Moles
- **owner of (P1830)** → Got Moles (only if true — verify the company's legal structure first)

### Other entity connections to add over time

These are reverse links — they don't create the Got Moles entity, but they make Got Moles findable when AI engines look up the related concept.

| Add to (existing entity) | Connect | Why |
|---|---|---|
| [Townsend's mole (Q1374069)](https://www.wikidata.org/wiki/Q1374069) | (no direct property — but listed in "see also") | When AI looks up Townsend's mole, finds Got Moles in graph |
| [Enumclaw, Washington (Q985770)](https://www.wikidata.org/wiki/Q985770) | "businesses in this city" property if available | Geographic graph connection |
| Each city Got Moles serves (Seattle Q5083, Tacoma Q49229, etc.) | service area (P2541) on Got Moles | Geographic entity graph |

---

## Phase 6 — Broader entity strategy (post across these subjects)

Wikidata is the centerpiece, but the same authoritative-entity work needs to happen across multiple platforms. Each one creates a third-party citation that:
1. Reinforces Wikidata notability (more sources to cite)
2. Independently improves AI engine citation likelihood
3. Builds the brand entity graph that AI engines traverse

### Identity profiles — claim or refresh

| Profile | Why it matters | Action |
|---|---|---|
| **OpenCorporates** | External identifier for Wikidata + LLM training data | Verify entry exists, claim if possible |
| **D&B Hoovers** | Recognised business identifier | Claim if exists, create if not |
| **BBB** | Trust signal, external Wikidata identifier | Apply for accreditation (~$500/yr) |
| **LinkedIn Company Page** | Already exists per audit; refresh | Add full description, services, founder profile, regular posts |
| **Apple Business Connect** | Apple Maps + Siri citation | Pending Spencer per launch checklist |
| **Google Knowledge Panel** | Massive AEO lift | Submit Knowledge Graph correction once Wikidata Q-id exists |

### 🤖 Claude prompt — Knowledge Graph correction submission

After Wikidata Q-id exists:

```
I need to submit a Google Knowledge Panel suggestion for my business.

Business: Got Moles
Wikidata Q-id: {{YOUR_Q_ID}}
URL: https://got-moles.com
Founded: 2017
Founder: Spencer Hill (Wikidata Q{{SPENCER_Q}})
Industry: pest control / mole control
HQ: Enumclaw, Washington
Service area: King, Pierce, Snohomish, Thurston counties (Western WA)

Please draft:
1. The exact text I'll submit via google.com → search "Got Moles" → 
   "Suggest an edit" → "Add or change information"
2. A separate version for the "Reach out to claim this Knowledge Panel" 
   flow at https://www.google.com/business/

Keep submissions factual, reference Wikidata as the source of truth, 
and avoid promotional language.
```

### Industry / professional listings

| Listing | Why | Action |
|---|---|---|
| **SBA Veteran-Owned Business Database** | Official .gov citation, helps with veteran-owned positioning | File at sba.gov/veterans |
| **VetsFirstVerification.com** | Independent verification of veteran-owned status | Apply for verification |
| **NPMA — National Pest Management Association** | Industry membership creates external citation web | Annual membership |

### Local / community listings

| Item | Action |
|---|---|
| Local Chambers of Commerce (Enumclaw, Tacoma, Seattle) | Apply for membership; chambers list members publicly |
| Local press introductions (TNT, Seattle Times community section, KING5, KIRO7) | Pitch the "veteran founder" angle |
| Podcast appearances on home/garden/PNW shows | Spencer interviews + transcripts on the site |

### 🤖 Claude prompt — Local press pitch

```
I'm pitching local press for coverage of my business. The "story angle" 
needs to hook a journalist — not feel like a marketing email.

Business: Got Moles
Founder: Spencer Hill
Story angles to choose from:
- US Army veteran turned mole specialist (Spencer served 2011-2014, 
  founded Got Moles 2017)
- Only mole-exclusive company in Western Washington (5,000+ properties 
  served, 219+ five-star reviews)
- Chemical-free methods, safe for kids/pets in the era of poison concerns
- Year-round subscription model (Total Mole Control Program at $100/mo) 
  — 500 enrolled — unique in the region

Target: {{TARGET_PUBLICATION_NAME}} (e.g., "Tacoma News Tribune", 
"Enumclaw Courier-Herald", "Seattle Times community section")

Please draft:
1. A subject line (30-60 chars, hook-driven, no clickbait)
2. A 4-paragraph email pitch from Spencer's perspective:
   - Para 1: Story hook (the angle that grabs)
   - Para 2: Why this matters now / local relevance
   - Para 3: What I can offer for the piece (interview, photos, 
     property visits, customer testimonials)
   - Para 4: Specific offer + clear next step (no pressure)
3. A 1-line bio for the journalist's reference

Voice: warm, direct, modest (Spencer is not a self-promoter). No 
"thrilled to announce" or marketing-speak. Read like a neighbour, 
not a press release.
```

### Authority backlinks

| Source | Why | How |
|---|---|---|
| **WSU Extension Service** | Got Moles already cites their research; reciprocate for a backlink | Email the relevant WSU Extension specialist; offer a Got Moles case study or data |
| **WDFW (WA Dept Fish & Wildlife)** | Same pattern | Email their wildlife/pest contact |
| **UW / WSU students researching pests** | Long-term relationship building | Offer interviews or property visits for student research projects |

### 🤖 Claude prompt — WSU Extension outreach

```
I need to reach out to Washington State University Extension Service 
to build a professional relationship + ideally earn a backlink to my 
mole control resources page.

About me: Spencer Hill, founder of Got Moles 
(https://got-moles.com), a mole control company in Western Washington. 
I've trapped moles on nearly 5,000 properties since 2017. I cite WSU 
Extension's research on castor oil ineffectiveness in my own writing.

What I can offer WSU:
- 8 years of field data on mole behavior in Western Washington 
  (seasonal patterns, soil-type correlations, success rates of various 
  trapping methods)
- Property access for student researchers
- Photographs of mole damage, mounds, tunnels for use in extension 
  publications
- A practitioner perspective on what's actually working in residential 
  mole control vs what extension publications recommend

Please draft a 4-paragraph email to a WSU Extension contact that:
1. Establishes my credibility briefly (don't lead with the ask)
2. References their existing research I've used
3. Proposes a specific collaboration or data contribution
4. Asks if they'd be interested in linking to a relevant resource on 
   my site OR co-authoring something

Voice: practitioner, modest, focused on giving value not asking for 
favors. Avoid "checking in" / "circling back" language.
```

---

## Phase 7 — Maintenance & risk mitigation

### Maintenance cadence

| Cadence | Action |
|---|---|
| Weekly (first 4 weeks) | Check Got Moles + Spencer items for deletion proposals — respond within 48h if challenged |
| Monthly | Add 1-2 new sourced statements (new press, new external IDs, milestone updates) |
| Quarterly | Review Watchlist for vandalism, update employee count, recent milestones |
| Annual | Refresh founding-anniversary, annual stats, milestone numbers |

### 🤖 Claude prompt — Monthly maintenance check

```
It's the monthly Wikidata maintenance check for Got Moles.

The Wikidata items I maintain:
- Got Moles: https://www.wikidata.org/wiki/Q{{GOT_MOLES_QID}}
- Spencer Hill: https://www.wikidata.org/wiki/Q{{SPENCER_QID}}

Please:
1. Check both items for any "deletion proposed" or "merge requested" 
   notices
2. Identify any properties on each item that have outdated values 
   (e.g., employee count, last fiscal year)
3. Suggest 1-2 new sourced statements I could add this month, given 
   recent press coverage or new external listings I should look for
4. List any vandalism or low-quality edits in the Watchlist that I 
   should revert

Return a checklist I can work through in 30 minutes.
```

### If entity nominated for deletion (the survival playbook)

Don't panic. Most deletion nominations can be defeated.

1. **Don't argue subjectively** ("we're important", "this is our brand"). Wikidata editors actively reject self-importance arguments.
2. **Argue structurally**: "Entity has [N] external identifiers, is needed as the 'founded by' target for the Spencer Hill item, has [N] reliable third-party sources." Numbers + structural roles win arguments.
3. **Add MORE sources during the AfD discussion**. Show notability via reference volume, not by asserting it.
4. **Get an experienced Wikidata editor's help**. There are paid services (carefully — promotional editing is forbidden) or pro-bono help via Wikidata project chats.
5. **Backup plan**: if Got Moles entity is deleted, focus on Spencer Hill (humans get more leeway as Person entities). Connect Got Moles via "employer of" backwards from his entity.

### 🤖 Claude prompt — Deletion defense argument

If your entity gets nominated for deletion:

```
My Wikidata item for Got Moles (Q{{GOT_MOLES_QID}}) has been nominated 
for deletion. The deletion discussion link is: {{AFD_URL}}

Here's the current state of the item:
- {{N}} statements with sources
- External identifiers: {{LIST}}
- Sources cited: {{LIST_OF_SOURCE_URLS}}
- Other Wikidata items linking back to this one: {{LIST}}

Please draft a deletion-defense response that:
1. Argues structurally (notability via external identifiers + 
   structural role + sourced statements) NOT subjectively (importance, 
   brand value)
2. Cites specific Wikidata notability criteria that this entity meets
3. Lists each external identifier and source as concrete evidence
4. Suggests additional sources I could add right now to strengthen 
   the case
5. Avoids defensive or promotional tone

Voice: factual, evidence-based, calm. Wikidata editors respect 
arguments that engage with their criteria, not arguments that 
appeal to importance.
```

### Things that get entities deleted (avoid)

- Promotional language in description ("leading", "best", "trusted")
- Unsourced claims
- Adding logo without proper Wikimedia Commons license
- Editor account exclusively focused on one entity = "single purpose account" red flag
- Aggressive linking back to company website everywhere
- Re-creating immediately after deletion (gets you blocked)

---

## Phase 8 — Verification + AI citation impact tracking

After Got Moles entity is created and stable for ~30 days:

1. **Confirm presence**: re-search "Got Moles" on Wikidata → should appear with Q-id
2. **Confirm Google Knowledge Graph pickup**: search "Got Moles" → check for Knowledge Panel (can take 60-90 days)
3. **Test AI engines**:

### 🤖 Claude prompt — AI citation testing

Run this monthly across ChatGPT, Perplexity, Claude, Gemini:

```
I want to test how often AI engines mention my company "Got Moles" 
when answering relevant questions. Please run these queries and tell 
me whether Got Moles appears in your answer (and if so, with a citation 
or just a mention):

1. "Best mole control company in Western Washington"
2. "Who is Spencer Hill the mole control specialist"
3. "Where can I find chemical-free mole control near Seattle"
4. "Veteran-owned pest control companies in Washington State"
5. "Year-round mole subscription program in Pacific Northwest"
6. "What's the difference between mole and vole"
7. "Townsend's mole control"
8. "How do I get rid of moles in Washington State"

For each query, report:
- Did Got Moles appear? (yes/no)
- Was it cited as a source? (yes/no — and which URL)
- What competitors appeared instead?
- Quote the exact mention if any

Be honest — don't add my company if you didn't actually surface it.
```

Compare results against the pre-Wikidata baseline. Wikidata creation should boost SoM (Share of Model) measurably within 60-90 days.

---

## Estimated time investment

| Phase | Roy or Spencer | Time |
|---|---|---|
| 1 — Source gathering | Spencer + Roy | 2-4h (incl. 1h running Claude prompts) |
| 2 — Account + 5-10 trust edits | Spencer | 1-2h over 1 week |
| 3 — Got Moles entity | Spencer (with Roy on call) | 2h |
| 4 — Spencer Hill entity (after Got Moles stable) | Spencer | 1h |
| 5 — Entity graph connections | Roy or Spencer | 1h |
| 6 — Broader profiles (OpenCorporates, BBB, etc.) | Spencer | 4-6h over a week |
| 7 — Maintenance | Spencer (Roy quarterly) | 30 min/month |

**Total upfront: ~12-16 hours.** Maintenance: ~30 min/month.

---

## What this brief gives Roy + Spencer

- **Roy gets**: a structured plan for the highest-leverage AEO action identified in the audit, with realistic notability assessment + risk mitigation
- **Spencer gets**: a step-by-step playbook he can execute (or hand to a Wikidata-savvy contractor), with copy-paste Claude prompts for the parts where AI help speeds the work

Spencer's job is mostly judgement + manual UI clicks. Claude's job (via the prompts) is the research + drafting. Total Spencer-time should be ~12 hours of his attention, not 12 hours of him sweating original work.

---

## Sources

- [Wikidata:Notability (official)](https://www.wikidata.org/wiki/Wikidata:Notability)
- [Orkin (Q7102943)](https://www.wikidata.org/wiki/Q7102943) — real pest control company entity to study as a model
- [Townsend's mole (Q1374069)](https://www.wikidata.org/wiki/Q1374069) — already exists, can connect to
- [Wikidata: How Companies & Organizations Can Leverage It — WikiConsult](https://wikiconsult.com/en/wikidata-effective-strategies-for-companies-institutions-and-communicators)
- [The Wikipedia Proxy: Using Wikidata IDs to Anchor Brand Truth — Cubitrek](https://cubitrek.com/blog/the-wikipedia-proxy-using-wikidata-ids-to-anchor-brand-truth)
- [Wikidata for AI Search: QIDs, References, Sitelinks — Growth Marshal](https://www.growthmarshal.io/field-notes/how-wikidata-enables-ai-search-optimization)
- [Wikidata Identifiers (official P-id reference)](https://www.wikidata.org/wiki/Wikidata:Identifiers)

---

## Notion link

(Populated after push)

## Files in this folder

- `brief.md` — v1 (superseded by this v2)
- `brief-v2.md` — this version
- `_push-brief-to-notion.mjs` — pushes v1 (kept for reference)
- `_push-brief-v2-to-notion.mjs` — pushes v2 (replaces v1 Notion page content)
