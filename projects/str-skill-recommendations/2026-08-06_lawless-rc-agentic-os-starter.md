# Lawless RC — Agentic OS Starter Pack

**For:** the Lawless RC agentic operating system
**From:** Spencer (Got Moles) — audited 2026-08-06
**How to use:** paste this whole file into your agent as `LAWLESS-RC-STARTER.md`, or just drop it in
the chat and say "read this and set us up." Sections 4 and 5 are copy-paste-ready config.

---

## 1. What I actually saw on lawlessrc.com

I loaded the live site in a real browser on 2026-08-06 (it sits behind a bot-challenge screen, so
normal scrapers get nothing back — worth knowing before you point any tool at it).

**The business:** direct-to-consumer RC rock-crawler chassis kits and parts, sold through
WooCommerce on WordPress (Aurum theme). Named-model product line with an outlaw naming system that
is genuinely good branding:

| Product | Class | Price |
|---|---|---|
| "THE CONVICT" C3 | comp chassis | $289 — **out of stock** |
| "THE FELON" MOA | comp chassis | $289 |
| "SMOOTH CRIMINAL 2.0" C3 | comp chassis | $259–279 — **out of stock** |
| "THE CULPRIT" C2 | comp chassis | $259–279 |
| "THE DESPERADO" C1 | comp chassis | $229 |
| JUVENILE DELINQUENT 1/24 | micro chassis | $185 |
| Wheels, inserts, link risers, hangers, ESC/RX trays, add-ons | parts | $10–79 |
| Tees, hoodie, long sleeve, fleece, trucker cap, patches | apparel | $12.50–42 |

~21 SKUs total. Two of the three flagship C3 platforms are out of stock.

**The customer:** competition rock crawlers who know what C1/C2/C3/MOA mean, run specific rulesets,
and already own an axle and a transmission. The C1 Desperado page tells you to pair it with a GSpeed
laydown servo mount and a GSpeed panhard mount — this is a builder audience buying into an ecosystem,
not a beginner audience buying a toy.

**The voice:** all-caps, blunt, confident. "KNOCK OUT THE COMPETION WITH THIS MONSTER OF A C1."
That is a real voice with real personality — do not let an AI sand it into normal marketing English.
Capture it before you generate anything.

### What's broken or missing (ranked by what it's costing)

1. **The contact page is still the WordPress theme's demo data.** It publishes
   `2954 Golden Estates, Guys Store, Virginia 24318-5414`, phone `(571) 400-1255`, and email
   `info@aurumtheme.com`. None of that is Lawless RC. Anyone trying to reach you is emailing the
   theme vendor. **Fix this today, before anything else on this list.**
2. **There is a captcha field on the add-to-cart form.** On a $229 product page, a captcha between
   the customer and the cart is a conversion tax. If it's there for bot spam, move it to checkout.
3. **No social links anywhere on the site.** The community lives on Facebook groups (DluxFab and
   others are already reviewing and building Lawless chassis) — and the site doesn't point to it or
   capture any of it.
4. **The blog exists at `/blog/` and is completely empty.** So is the site's SEO: no meta
   description on the homepage.
5. **No About page** — `/about/` 404s. For a small-batch builder brand, the founder story *is* the
   differentiator against the big brands.
6. **Navigation is one item: HOME.** No shop nav, no category nav, no product-class filtering
   (C1 / C2 / C3 / MOA / micro / parts / apparel), even though the class system is exactly how the
   customer shops.
7. **Two flagships are out of stock with no waitlist or back-in-stock capture** — that's demand
   walking away unrecorded.

---

## 2. The skill shortlist

These are the skills from my Got Moles install that transfer to Lawless RC. Install with:

```bash
bash scripts/add-skill.sh <skill-name>
```

### Tier 1 — install first, these do the most work

| Skill | What it does for Lawless RC |
|---|---|
| `mkt-brand-voice` | **Do this one before anything else.** Feed it the product page copy and it extracts the all-caps outlaw voice into `brand_context/voice-profile.md`. Every other skill then writes in that voice instead of generic ecommerce English. Skipping this is why AI content sounds like AI content. |
| `mkt-icp` | Builds the buyer profile: comp crawler, knows the rulesets, already owns axles/trans, shops by class. Everything downstream aims at that person instead of "RC enthusiasts." |
| `mkt-positioning` | Small-batch builder vs. the big brands — finds the angle. Also settles what the apparel line is actually for (identity merch for a scene, not a revenue line). |
| `mkt-copywriting` | Rewrites the product pages. Right now they're a spec list plus one hype line. Same voice, but with the "who is this for / what does it beat / what do I still need to buy" that a $289 purchase needs. |
| `tool-humanizer` | The safety net. Runs on every piece of published text and strips AI tells. On a brand with a voice this distinct, this is not optional. |
| `str-onpage-audit` | Systematic pass over the product pages: titles, meta, headings, schema. There is no meta description on the homepage — this finds all of that. |
| `str-keyword-strategy` | Maps what crawlers actually search — "C1 comp chassis kit," "MOA chassis," "1/24 micro crawler chassis" — to pages. Tells you which pages to build and which to skip. |

### Tier 2 — content and the empty blog

| Skill | What it does for Lawless RC |
|---|---|
| `mkt-authority-content` | Fills `/blog/` with the stuff this audience genuinely searches: "C1 vs C2 vs C3 explained," "what you still need to buy with a chassis kit," build guides, ruleset breakdowns. This is the highest-leverage content lane you have — it ranks *and* it sells kits, because the buying question and the search question are the same question. |
| `str-question-harvester` | Pulls the real questions off Google's People Also Ask so the blog answers what's actually being asked instead of what you guessed. |
| `str-trending-research` | Reads Reddit and the forums for what the scene is arguing about right now — new rulesets, competitor releases, common build problems. Feeds the content list. |
| `str-ai-seo` | Gets Lawless cited when someone asks ChatGPT "best C1 chassis kit." For a niche this specialized, AI answers are a real discovery channel and almost nobody in RC is optimizing for them yet. |
| `mkt-content-repurposing` | One build guide becomes a Facebook group post, an Instagram carousel, a Reel script, a YouTube description. |
| `tool-fact-checker` | Verifies ruleset claims before publishing. Getting a class requirement wrong in front of comp crawlers costs credibility you don't get back. |

### Tier 3 — video, which is where this product lives

RC crawling is a visual, in-motion product. A chassis kit is sold by watching it flex over rocks.
This lane matters more here than it does for most businesses.

| Skill | What it does for Lawless RC |
|---|---|
| `viz-image-gen` | Product-page hero images, class-comparison graphics, spec cards. |
| `vid-clip-selection` + `vid-clip-extractor` + `vid-ffmpeg-edit` | Turn long GoPro run footage into vertical clips with captions. |
| `00-longform-to-shortform` | The whole chain automated: a long build/run video → clips → captions → posted. |
| `mkt-ugc-scripts` | Scripts for talking-head build videos and comp recaps. |
| `mkt-social-showing` | Hook writing. The difference between a build clip that gets 300 views and 30,000 is the first two seconds, and that's what this skill is for. |
| `tool-youtube` | Pulls transcripts from other people's Lawless build/review videos — free content and free customer research. |

### Tier 4 — infrastructure

| Skill | What it does for Lawless RC |
|---|---|
| `meta-wrap-up` | Ends every session by committing work and logging what was learned. This is what makes the OS compound instead of resetting. |
| `meta-memory-write` | Saves durable facts — pricing rules, what's in stock, what not to claim. |
| `meta-skill-creator` | Builds Lawless-specific skills once you know what repeats. Obvious first candidate: a kit-launch skill that takes a new chassis from photos to a product page, launch post, and clip set in one run. |
| `ops-cron` | Scheduled jobs — restock checks, weekly content, monthly SEO re-audit. |
| `tool-web-screenshot` / `tool-browser` | **Note:** lawlessrc.com sits behind a bot-challenge screen. Firecrawl and plain fetching return empty. Use the real-browser skill (`tool-browser`) for anything that reads your own site. |
| `tool-platform-security` | Scans the repo for leaked keys before pushing. Worth running once at setup. |

### Skip these — they're Got Moles-specific or won't apply

`tool-jobber`, `tool-optimoroute`, `ops-phone-roleplay`, `str-ai-seo-local`, `ops-cms-content`,
`ops-blog-pipeline`, `tool-linkedin-scraper` — field-service scheduling, route optimization, phone
training, multi-location local SEO, and a Payload CMS pipeline. None of it maps to a
single-location DTC ecommerce shop. `ops-blog-pipeline` is the exception worth *rebuilding*:
the concept (topic → post → image → humanize → publish → review) is great, but mine is wired to a
Next.js/Payload site. Build a WooCommerce version with `meta-skill-creator` once the basics are running.

`ops-google-ads` — real skill, works on any account, but hold it. Paid traffic into product pages
that still show a fake Virginia address and a captcha at add-to-cart is money set on fire. Fix the
site, then revisit.

---

## 3. The order I'd actually do it in

**Week 1 — stop the bleeding, then build the foundation**
1. Replace the theme's demo contact info with real Lawless RC details. Nothing else matters until this is done.
2. Move or remove the add-to-cart captcha.
3. Run `mkt-brand-voice` against the existing product copy. Then `mkt-icp`. Then `mkt-positioning`.

**Week 2 — the site itself**
4. `str-onpage-audit` on every product page → fix titles and meta.
5. `mkt-copywriting` to rewrite the six chassis product pages.
6. Add real navigation by class (C1 / C2 / C3 / MOA / Micro / Parts / Apparel) and an About page.
7. Add back-in-stock email capture on the two out-of-stock C3s.

**Week 3–4 — content engine on**
8. `str-keyword-strategy` + `str-question-harvester` → a 10-post content plan.
9. `mkt-authority-content` writes the first three. `tool-humanizer` on all of them.
10. `mkt-content-repurposing` pushes each one into the Facebook groups where the scene already is.

**Month 2 — video and automation**
11. Video lane: `vid-clip-selection` → `vid-ffmpeg-edit` → `mkt-social-showing`.
12. `ops-cron` to make the weekly content and monthly re-audit automatic.
13. Then, and only then, `ops-google-ads`.

---

## 4. Paste-ready: `brand_context/` seed

Save as `brand_context/business-basics.md`. This is a starting draft from public info — correct it
before the agent builds on it.

```markdown
# Lawless RC — Business Basics

**What we sell:** Small-batch RC rock-crawler chassis kits and machined parts, direct to consumer.
**Platform:** WordPress + WooCommerce (Aurum theme). ~21 SKUs.
**Product line:** Named after outlaws — THE CONVICT (C3), THE FELON (MOA),
SMOOTH CRIMINAL 2.0 (C3), THE CULPRIT (C2), THE DESPERADO (C1), JUVENILE DELINQUENT (1/24 micro).
Plus wheels, inserts, link risers, hangers, ESC/RX trays, and apparel.
**Price band:** chassis kits $185–289; parts $10–79; apparel $12.50–42.

**Who buys:** Competition rock crawlers who know the C1/C2/C3/MOA class system and build to a
specific ruleset. They already own axles and a transmission. They are choosing between chassis
platforms, not between hobbies. They buy on: does it make class legal, does it perform, does it
fit the parts I already have.

**Ecosystem context:** Kits are designed around specific third-party components (e.g. GSpeed
laydown servo mounts, GSpeed panhard mounts for AR44, DLux ultralight portal transmissions,
CP43 axles). Every product page must state exactly what the customer still needs to buy.

**Where the community is:** Facebook groups (DluxFab and other crawler build groups) already post
Lawless build and review threads. That is the center of gravity for this audience — not LinkedIn,
not X.

**Voice:** All-caps headlines, blunt, confident, zero corporate hedging. Real example:
"KNOCK OUT THE COMPETION WITH THIS MONSTER OF A C1." Keep the swagger. Never smooth it out into
standard ecommerce copy.

**Claims discipline:** Only claim class legality that is actually true for the current ruleset.
This audience will check, and being wrong once costs more than the sale.
```

## 5. Paste-ready: `CLAUDE.local.md` rules

Append these to your `CLAUDE.local.md` (the user-owned file that updates never overwrite):

```markdown
## Rules

- Voice: all-caps product headlines, blunt and confident. Never soften Lawless copy into neutral
  ecommerce English. Run tool-humanizer in `deep` mode on every published piece.
- Never publish a class-legality claim (C1/C2/C3/MOA) without checking it against the current
  ruleset. Fact-check before publish, not after.
- Every chassis product page must list what the customer STILL NEEDS to buy (axles, transmission,
  servo mount, panhard mount) with links. Incomplete parts lists cause returns and support load.
- lawlessrc.com sits behind a bot-challenge screen. Firecrawl and plain HTTP fetching return empty
  pages. Use the real-browser skill for anything that reads our own site.
- The audience lives in Facebook crawler groups, not LinkedIn. Route social output there first,
  then Instagram/YouTube. Skip LinkedIn entirely.
- Out-of-stock flagship products are a demand signal, not a dead page. Never remove them — capture
  the email instead.
```

---

## 6. Two things worth knowing before you start

**The voice extraction is the whole game.** Every skill in this pack reads
`brand_context/voice-profile.md`. If you run the content skills before running `mkt-brand-voice`,
you get competent, generic, forgettable copy — and a brand whose entire edge is that it is *not*
generic. Half a day on voice extraction pays for itself across every piece of output after it.

**Don't automate on top of a broken foundation.** The instinct with a new agentic OS is to turn on
the content engine immediately. But right now the contact page publishes someone else's address and
there's a captcha in front of the buy button. More traffic into that funnel just means more people
bouncing. Fix the site first — it's a two-day job — then let the content engine run.

---

*Audited by Claude on Spencer's Got Moles Agentic OS install, 2026-08-06. Site data read live from
lawlessrc.com the same day. Product availability and pricing were accurate at the time of reading.*
