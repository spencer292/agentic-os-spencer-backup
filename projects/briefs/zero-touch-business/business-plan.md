# Business Plan — Zero-Touch Business Experiment

_Working plan v1 — 2026-07-19. Written around the recommended niche (Candidate A). The engine (sections 3-7) is niche-agnostic; swapping niche only changes section 2._

## 1. Thesis

An AI system (Claude + cron jobs + platform APIs) can build, market, and operate a digital-products business where:
- **Platforms own commerce** — Gumroad handles checkout, delivery, refunds, sales tax.
- **Crons own production** — content writing, product creation, publishing, ad management, reporting.
- **Spencer owns identity** — accounts, KYC, payouts, and a weekly approval batch.

Success = revenue per Spencer-hour, publicly auditable via the repo of cron jobs and reports.

## 2. Niche — Service-Business-in-a-Box Kits (recommended)

**What:** Template bundles + operator guides for people starting/running local service businesses: cleaning, pressure washing, lawn care, junk removal, window washing, wildlife/mole control. Per-trade kits: pricing calculator (Sheets), quote/invoice/contract templates, client intake + welcome packet, route/scheduling tracker, marketing starter pack, "first 90 days" operator guide.

**Why this beats the alternatives researched:**
- Etsy already sells cleaning/landscaping starter kits successfully (validated demand) but the space is far less saturated than landlord spreadsheets (top seller there: 137k+ sales — red ocean).
- Buyers have high intent and real money: someone starting a business spends $29-79 without blinking.
- **Unfair advantage:** Spencer actually built a 5,000-client service company. Marketing writes itself, product quality is groundable in real operations, and authentic operator authority is exactly what AI search engines (GEO) reward. His book *The Route* is a natural authority anchor and upsell.
- Price points $19-79 (vs $5-12 printables) → fewer sales needed per goal.
- Dozens of sub-trades = repeatable product formula: validate the kit structure once, then the product factory stamps out per-trade variants.

**Risks:** "how to start a X business" head terms are held by SaaS blogs (Housecall Pro, Joist, NerdWallet). Mitigation: win the long tail (per-trade contract/pricing/forms queries), Pinterest, and product-led ads — not head terms.

## 3. Product line v1 (build order)

1. **Cleaning Business Starter Kit** — $49 (largest market, proven Etsy demand)
2. **Pressure Washing Business Kit** — $49
3. **Lawn Care / Landscaping Business Kit** — $49
4. Free lead magnet: "Service Business Pricing Cheat Sheet" (email capture on the content site)

Later: per-trade variants ($29 "forms only" tier, $79 "kit + operator guide" tier), route-density playbook based on *The Route*.

Each product = Google Sheets templates (shared as copy-links) + PDF guide (tool-pdf-generator) + cover art (viz-image-gen) + Gumroad listing (Product API — confirmed to support programmatic create/edit as of 2026).

## 4. Traffic engine

| Channel | Mechanism | Automation |
|---|---|---|
| SEO/GEO content site | 3-5 long-tail articles/wk (pricing guides, contract explainers, "what to charge for X in 2026"), each funneling to a kit + lead magnet | Cron: research → write → humanize → publish → internal links |
| Google Ads | $50-75/mo exact-match product keywords ("cleaning business contract template" etc.) | ops-google-ads engine, weekly automated optimization |
| Pinterest | Template/checklist pins → site/products | Semi-auto (API app approval or tool-browser batch with approval) |
| Email | Lead magnet → 5-email automated nurture → kit offer | Platform automation (Gumroad follow-ups or free-tier ESP) |

Site: new repo + static site (Astro or Next), separate domain, deployed from Spencer's own hosting account. **Explicitly outside got-moles.com and Roy's deploy pipeline.**

## 5. Automation architecture (cron map)

| Cron | Cadence | Does |
|---|---|---|
| `ztb-content-publisher` | 3-5×/wk | Pick topic from keyword backlog → draft (GEO-structured) → humanize → commit + deploy → log |
| `ztb-product-factory` | weekly, Phase 3+ | Next trade variant: adapt templates → render PDFs/covers → create Gumroad product (unpublished) → queue for Spencer approval |
| `ztb-ads-manager` | weekly | Pull performance, adjust bids/negatives, pause losers (guardrail: hard monthly cap) |
| `ztb-digest` | weekly (Mon) | Sales (Gumroad API), traffic (GSC), ad spend, Spencer-minutes log, three-bucket status → one report file + short summary |

Guardrails: publishing crons only run on channels Spencer has authorized once; product listings created **unpublished** until first-batch quality is confirmed, then auto-publish is turned on.

## 6. What needs Spencer (three buckets, stated honestly)

**Bucket 1 — needs your approval/identity (one-time ~2-3 hrs):**
Gumroad account + payouts (KYC); domain purchase; hosting account login; new Google Ads account + billing; review/approve product batch #1 and first week of content; authorize each channel's auto-publish.

**Bucket 2 — pauses if Claude isn't running:** nothing, by design — every recurring step above is a cron job. Anything not yet cron-backed is listed in the digest as "manual until automated."

**Bucket 3 — can stall silently:** Google indexing lag (detect: GSC in digest), Gumroad account review holds (detect: API/status check in digest), ad disapprovals (detect: ads-manager run), Pinterest API approval (fallback: browser batch). Each has a detection point in the weekly digest.

**Recurring Spencer time target:** one ~20-30 min weekly review of the digest + approval queue.

## 7. Financials

**Costs:** domain ~$12/yr · hosting $0 (static) · Gumroad ~10-13% per sale, no monthly fee · ads $50-75/mo · misc tools ≤$25/mo → **~$90-120/mo burn**.

**Targets:** first dollar ≤45 days · $100/mo by month 3 (~2-3 kit sales) · $500/mo by month 6 (~10-13 sales) · breakeven ~month 4-5 · every digest reports **$/Spencer-hour**.

## 8. Roadmap

- **Phase 0 (Spencer, ~2-3 hrs):** accounts + domain (Bucket 1 checklist).
- **Phase 1 — Build (Claude, week 1):** brand name/site/lead magnet; Cleaning Kit v1; 10 launch articles; keyword backlog (~100 long-tails).
- **Phase 2 — Launch (week 2):** Spencer approves batch #1 → publish products + site; start content cron + ads cron + digest cron.
- **Phase 3 — Scale (weeks 3+):** product factory adds a trade variant/wk; content compounding; kill/scale ads by data.
- **Review gates:** day 30 (traffic + index health), day 45 (first-dollar check), day 90 (continue/pivot/expand).
