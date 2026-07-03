---
project: wikidata-entity-strategy
status: active
level: 2
created: 2026-05-02
parent: aeo-audit-2026
---

# Got Moles Wikidata Entity Strategy

L2 sub-project of `aeo-audit-2026`. Establish Got Moles + Spencer Hill as Wikidata entities to unlock the single biggest AEO citation lever per the audit. Includes notability mitigation, source pre-work, step-by-step entity creation, and maintenance plan.

## Why this matters (1-line for Spencer)

**LLMs and AI search engines treat Wikidata as ground truth for "who/what is this entity."** Without a Wikidata Q-id, AI engines can't reliably distinguish Got Moles from any other "got moles" reference, can't cite us as a verified source, and can't connect us to related concepts (Western Washington, mole control, Spencer Hill). With one, citations become 2-3× more likely across ChatGPT, Perplexity, Claude, Gemini, and Google AI Overviews.

## Honest notability assessment

⚠️ **Wikidata has notability hurdles for small businesses.** Most local SMB entries get deleted within days unless they pre-empt this. Got Moles' situation:

| Criterion (only need ONE) | Got Moles status |
|---|---|
| Existing Wikipedia article | ❌ None |
| Multiple reliable third-party sources covering the company | ⚠️ Some local press coverage exists (need to compile) |
| External identifier from recognised authority | ✅ Likely qualifies — Washington State business registry, OpenCorporates if listed, BBB if accredited |
| Structural necessity (entity needed for other Wikidata items) | ⚠️ Indirect — connections to Spencer Hill (also new), Townsend's mole (existing), Western Washington (existing) |

**Verdict:** Got Moles is borderline-notable but creatable IF we lead with strong external identifiers + 3-5 third-party sources. **Pre-work to gather sources is the make-or-break step.**

Spencer Hill as a separate Person entity has higher notability hurdles (no Wikipedia, no books published, no academic citations). Likely needs a Got Moles entity to exist first AND additional press coverage to qualify standalone. **Recommend: try Got Moles entity first; Spencer secondary.**

---

## Phase 1 — Pre-work source gathering (do BEFORE touching Wikidata)

For each claim about Got Moles you'll add to Wikidata, you need a verifiable third-party source. Compile these in a single doc before opening Wikidata.

### Sources to gather

| Type | Where to find | What it backs |
|---|---|---|
| **WA Secretary of State business registration** | sos.wa.gov/corps — search "Got Moles" | Founding date, registered business, headquarters |
| **OpenCorporates entry** | opencorporates.com — search company name | External identifier (notability anchor) |
| **BBB business profile** (if accredited) | bbb.org | Business credibility, address |
| **D&B / Dun & Bradstreet listing** | dnb.com | External identifier |
| **Local press coverage** (any) | Google "Got Moles" "Spencer Hill" + news search | Notability evidence |
| **Industry trade publications** | Pest control / WA business pubs | Industry recognition |
| **Veteran-owned business listings** | sba.gov/veterans, vetsfirstverification.com | Identifies as veteran-owned |
| **Google Business Profile screenshots** (URL, not source — but useful for cross-reference) | g.co/kgs/[your-id] | Google's own knowledge entry |
| **Spencer Hill VA / military service record** | va.gov, NPRC | Backs his Person entity claims |

### Minimum viable source set for a survival-likely entity

- ✅ WA business registration (auto-included)
- ✅ At least 2 reliable third-party press / industry sources mentioning Got Moles by name
- ✅ At least 1 external identifier ID (OpenCorporates / BBB / D&B / similar)
- ✅ Founder identification (LinkedIn URL minimum, ideally with separate veteran-owned listing)

If we can't muster these, Wikidata creation will likely fail. Press coverage is the gating factor — if Got Moles has been mentioned in any news article, blog by an authority, podcast transcript, etc., gather URLs.

---

## Phase 2 — Account setup

### Spencer's actions

1. Open https://www.wikidata.org → top-right **Create account**
2. Username suggestion: `SpencerHill_GotMoles` (transparent, identifies the editor — Wikidata values transparency over anonymity)
3. Provide email (for verification)
4. Confirm email
5. Read https://www.wikidata.org/wiki/Wikidata:Welcome (15 min)
6. Make 5-10 small constructive edits on existing items (e.g., add a missing reference, correct a typo) BEFORE creating new items — establishes editor credibility, reduces auto-deletion risk on first item

⚠️ **Do NOT rush to create the Got Moles item on a fresh account.** First-edit accounts creating SMB entities are flagged for review. The 5-10 small-edits pattern signals "real editor" not "promotional account."

---

## Phase 3 — Create the Got Moles entity

After Phase 2 + sources gathered.

### Step-by-step

1. Top-right Wikidata search box → search **"Got Moles"** → confirm "no matches" (verified 2026-05-02 — none exist)
2. Click **"Create a new item"** (left sidebar)
3. Fill the basic form:
   - **Label (English):** `Got Moles`
   - **Description (English):** `mole control company in Western Washington` (KEEP IT SHORT, factual, non-promotional — descriptions are the #1 reason items get deleted; "best", "specialist", "leading" all trigger flagging)
   - **Aliases (English):** `Got Moles?` (with question mark), `gotmoles.com`
4. Click **Create**
5. Item created with a Q-id (e.g. `Q12345678`) — **save this Q-id** somewhere; it's the entity's permanent identifier

### Step-by-step — adding statements (claims)

Each claim = (property, value, source). Add one at a time. Click **+ add statement**.

| Property | Property ID | Value | Source/reference |
|---|---|---|---|
| instance of | **P31** | business (Q4830453) OR limited liability company (Q1191350) | WA business registration URL |
| official website | **P856** | https://got-moles.com | (no source needed for own URL) |
| inception date | **P571** | 2017 | WA business registration |
| country | **P17** | United States of America (Q30) | (self-evident) |
| headquarters location | **P159** | Enumclaw (Q985770) | WA business registration |
| coordinate location | **P625** | 47.2040 N, -121.9910 W | maps screenshot URL |
| founded by | **P112** | Spencer Hill (link to his Q-id once created) | Press article OR LinkedIn |
| industry | **P452** | pest control (Q9685) | WA business registration |
| number of employees | **P1128** | (current count) | LinkedIn or press |
| service area / area served | **P2541** | Western Washington (Q1411245) | Company website |

### Required external identifier properties (ANY of these dramatically improves notability)

| Property | Property ID | Where to get the value |
|---|---|---|
| OpenCorporates ID | **P1320** | opencorporates.com → find Got Moles → use the URL ID |
| LEI (Legal Entity Identifier) | **P1278** | gleif.org if registered |
| WA Sec State Corp ID | **P5810** OR generic external-id property | sos.wa.gov result |
| Better Business Bureau ID | **P5293** | bbb.org profile URL ID if accredited |
| Google Business Profile CID | (custom, no formal P-id) | Skip — not yet a recognised Wikidata external ID |

⚠️ **Add at least 1 external identifier in the first session.** This is what separates "creatable" from "deletable" for a small business entity.

### Adding a logo / image

1. Image must be on Wikimedia Commons first (commons.wikimedia.org), not just on the website
2. Upload Got Moles logo to Commons (Spencer must be the copyright holder, license as CC BY-SA 4.0 or PD)
3. Once on Commons, add to Wikidata item via property **P154** (logo image)

⚠️ Skip this in the first session — it's risky if licensing isn't bulletproof. Add later once entity is stable.

---

## Phase 4 — Create the Spencer Hill Person entity

After Got Moles entity is created and stable for 7-14 days (i.e. not auto-deleted).

### Steps

1. Search Wikidata for "Spencer Hill" — multiple matches likely exist (it's a common name); confirm none are this Spencer Hill (Got Moles founder, Enumclaw WA)
2. **Create a new item**
3. Label: `Spencer Hill`
4. Description: `American businessman, founder of Got Moles` (factual, short, non-promotional)
5. Aliases: none

### Statements

| Property | P-id | Value | Source |
|---|---|---|---|
| instance of | **P31** | human (Q5) | (self-evident) |
| sex or gender | **P21** | male (Q6581097) | LinkedIn / About page |
| country of citizenship | **P27** | United States (Q30) | LinkedIn |
| occupation | **P106** | businessperson (Q43845), entrepreneur (Q131524) | About page |
| place of birth | **P19** | Buckley, WA (Q1003540 if exists) | About page |
| residence | **P551** | Enumclaw, WA | About page |
| founded | **P112** (founder of, inverse) → set on Got Moles item | Got Moles | (set on the company entity, not the person) |
| employer | **P108** OR owner of | Got Moles | LinkedIn |
| military branch | **P241** | United States Army (Q9212) | DD-214 / VA / press if available |
| conflict | **P607** | (any deployment conflict if applicable) | DD-214 |
| LinkedIn personal profile ID | **P6634** | URL/path | LinkedIn |

### Notability hedge for Spencer Hill

Person entities for SMB founders without Wikipedia presence often get deleted. Mitigation:
- File Spencer's entity AFTER Got Moles entity is stable (so structural-necessity argument holds — Spencer is needed as the founded-by target)
- Add the LinkedIn ID immediately (P6634) — this is a recognised external identifier
- Add as many sourced statements as possible — empty / 3-statement entities get deleted faster than 8-statement ones

---

## Phase 5 — Connecting entities (the entity graph)

Once both Got Moles + Spencer Hill items exist, link them:

### On Got Moles item
- **founded by (P112)** → Spencer Hill (his Q-id) — with reference

### On Spencer Hill item
- **founded by (P112)** is on the company side; the **inverse** lives on the company. Don't add a "founded" property on Spencer.
- **employer (P108)** → Got Moles
- **owner of (P1830)** → Got Moles (if true — verify the legal structure)

### Other entity connections to add over time

| Add to | Connect | Why |
|---|---|---|
| Got Moles | service area (P2541) → cities Got Moles serves (each city is its own Q-id, e.g., Seattle Q5083, Tacoma Q49229) | Geographic entity graph |
| Got Moles | industry (P452) → pest control (Q9685) | Industry connection |
| Got Moles | subject has role (P2868) → mole control specialist | Topic connection |
| Townsend's mole (Q1374069 — existing!) | has effect (relevant to) ← Got Moles | Reverse linkage so AI engines connecting "Townsend's mole control" → Got Moles |
| Mole (Q105731 — existing) | reverse: see also Got Moles | Same |

These entity-to-entity connections are what AI engines walk through to surface Got Moles when the topic is about moles.

---

## Phase 6 — Subjects to post across (the broader entity strategy)

Beyond Wikidata, the same authoritative-entity work needs to happen across:

### Identity profiles to create / refresh

- **OpenCorporates entry** — auto-pulled from WA SOS but verify and claim it
- **D&B Hoovers profile** — claim if exists, create if not
- **BBB business profile** — apply for accreditation (small annual fee, big trust signal)
- **LinkedIn Company Page** — already exists per audit; refresh with full description, services, founder profile
- **Apple Business Connect** — pending Spencer per launch checklist
- **Google Knowledge Panel** — submit a Knowledge Graph correction once Wikidata Q-id exists (use the Q-id as suggested entity reference)

### Industry / professional listings

- **SBA Veteran-Owned Business Database** (sba.gov) — file Got Moles
- **VetsFirstVerification.com** — apply
- **Pest control industry associations** (e.g., NPMA — National Pest Management Association) — membership creates external citations
- **WA State pest control trade group** if exists

### Local / community listings

- **Local Chamber of Commerce** (Enumclaw, Tacoma, Seattle) — membership listings
- **Local press introductions** — pitch a "veteran founder" angle to local papers (Tacoma News Tribune, Seattle Times community section)
- **Podcast appearances** — Spencer on home/garden/PNW podcasts (transcripts on the site)

### Authority backlinks

- **WSU Extension Service** — Got Moles already cited their research; reach out for backlink
- **WDFW (WA Dept Fish & Wildlife)** — same pattern
- **Local university research** — UW / WSU students researching pests — offer interviews

Each of these creates a third-party citation web that:
1. Reinforces Wikidata notability (more sources to cite)
2. Independently improves AI engine citation likelihood
3. Builds the brand entity graph that AI engines traverse

---

## Phase 7 — Maintenance & risk mitigation

### Maintenance cadence

| Cadence | Action |
|---|---|
| Weekly (first 4 weeks) | Check Got Moles + Spencer items for deletion proposals or AfD nominations. Respond within 48h if challenged. |
| Monthly | Add 1-2 new sourced statements (new press coverage, new external IDs as they become available, milestone updates) |
| Quarterly | Review Watchlist for vandalism / bad-faith edits; update employee count, recent milestones |
| Annual | Refresh founding-anniversary and any annual stats |

### Risk mitigation if entity gets nominated for deletion

1. **Don't argue subjectively** ("we're important") — argue structurally ("entity has 3 external identifiers, is needed as founder-of target for Spencer Hill item, has X reliable sources")
2. **Add MORE sources** during the AfD discussion — show notability via volume of references, not by claims of importance
3. **Get an experienced Wikidata editor's help** — there are paid services (carefully — promotional editing is forbidden) or pro-bono help via Wikidata project chats
4. **Backup plan**: if Got Moles entity is deleted, focus on Spencer Hill (different criteria — humans get more leeway as Person entities) and connect Got Moles via "employer of" backwards from his entity

### Things that get entities deleted (don't do these)

- Promotional language in description ("leading", "best", "trusted")
- Unsourced claims
- Adding logo without proper Wikimedia Commons license
- Editor account exclusively focused on one entity (= "single purpose account" red flag — hence the 5-10 unrelated edits before creating)
- Aggressive linking back to the company website everywhere
- Re-creating immediately after deletion (gets you blocked)

---

## Phase 8 — Verification + AI citation impact tracking

After Got Moles entity is created and stable for ~30 days:

1. **Confirm presence in Wikidata**: re-search "Got Moles" → should appear with Q-id
2. **Confirm pickup by Google Knowledge Graph**: search "Got Moles" → check for Knowledge Panel appearance (can take 60-90 days)
3. **Test AI engines**: ask ChatGPT, Perplexity, Claude, Gemini "What is Got Moles?" / "Who founded Got Moles?" / "Where is Got Moles based?" — citations to wikidata.org or got-moles.com should increase
4. **Compare against pre-Wikidata baseline**: per the AEO audit, baseline AI citation tracking starts in P1 month — Wikidata creation should boost SoM (Share of Model) measurably within 60-90 days

---

## What this brief gives Roy + Spencer

- **Roy gets**: a structured plan for the highest-leverage AEO action identified in the audit, with realistic notability assessment + risk mitigation
- **Spencer gets**: a step-by-step playbook he can execute (or hand to a Wikidata-savvy contractor) — pre-work checklist, exact properties + values, source-gathering list, what NOT to do

## Estimated time investment

| Phase | Roy or Spencer | Time |
|---|---|---|
| 1 — Source gathering | Spencer + Roy collaborate | 2-4 hours |
| 2 — Account + 5-10 trust edits | Spencer | 1-2 hours over 1 week |
| 3 — Got Moles entity | Spencer (with Roy on call) | 2 hours |
| 4 — Spencer Hill entity (after Got Moles stable) | Spencer | 1 hour |
| 5 — Entity graph connections | Roy or Spencer | 1 hour |
| 6 — Broader profiles (OpenCorporates, BBB, etc.) | Spencer | 4-6 hours over a week |
| 7 — Maintenance | Spencer (with Roy quarterly review) | 30 min/month |

Total upfront: ~12-16 hours for full setup. Maintenance: ~30 min/month.

## Sources

- [Wikidata:Notability (official)](https://www.wikidata.org/wiki/Wikidata:Notability)
- [Wikidata: How Companies & Organizations Can Leverage It — WikiConsult](https://wikiconsult.com/en/wikidata-effective-strategies-for-companies-institutions-and-communicators)
- [The Wikipedia Proxy: Using Wikidata IDs to Anchor Brand Truth — Cubitrek](https://cubitrek.com/blog/the-wikipedia-proxy-using-wikidata-ids-to-anchor-brand-truth)
- [Wikidata for AI Search: QIDs, References, Sitelinks — Growth Marshal](https://www.growthmarshal.io/field-notes/how-wikidata-enables-ai-search-optimization)
- [Wikidata Identifiers (official P-id reference)](https://www.wikidata.org/wiki/Wikidata:Identifiers)

## Notion link

[L2: Wikidata Entity Strategy — Got Moles + Spencer Hill (Spencer playbook)](https://www.notion.so/L2-Wikidata-Entity-Strategy-Got-Moles-Spencer-Hill-Spencer-playbook-3543d42c4a9c8187a7c1ff02e75027ea) — page ID `3543d42c-4a9c-8187-a7c1-ff02e75027ea`
