# Product Spec — Cleaning Business Starter Kit (Kit #1)

_v1 2026-07-19. First product; its structure is the master template the product factory reuses for pressure washing, lawn care, and later trades._

## Positioning
"Everything the paperwork side of your cleaning business needs on day one — built by an operator who grew a route-based service company to 5,000 clients, not a template shop." Chemical-free of fluff: every doc exists because a real service business needed it.

## Price & tiers
- **$49 — Full Kit** (launch product)
- **$29 — Forms Only** (later, after launch data)
- **$79 — Kit + First 90 Days Operator Guide** (later; guide draws on *The Route* thinking — route density, recurring revenue, firing bad-fit customers)

## Contents (14 files)

**Spreadsheets (Google Sheets, delivered as copy-links; master copies in a dedicated business Google account):**
1. Pricing Calculator — inputs: sq ft, frequency, add-ons, local wage; outputs hourly + flat quote with margin guardrails
2. Recurring Client & Route Tracker — client list, frequency, day-of-week grid, revenue per route day
3. Income & Expense Tracker — monthly P&L view, tax-deduction categories
4. Job Costing Sheet — per-job time/supplies/drive → true hourly earnings

**Documents (editable Google Doc copy-links + PDF versions):**
5. Residential Cleaning Service Agreement
6. Commercial Cleaning Contract
7. Client Intake Form (residential + commercial versions)
8. Quote/Estimate Template
9. Invoice Template
10. Client Welcome Packet (policies, communication, review ask)
11. Cancellation & No-Show Policy (insert for agreement)
12. Price-Increase Letter (existing clients)

**Checklists (PDF):**
13. Standard + Deep + Move-Out Cleaning Checklists (3-in-1, crew-ready)
14. Startup Checklist — licensing, insurance, supplies, first-client plan (state-agnostic w/ "check your state" pointers)

**Legal note (mandatory, in listing + docs):** templates are starting points, not legal advice; recommend local attorney review. No jurisdiction-specific legal claims.

## Production pipeline (repeatable per trade)
1. Draft all content in markdown in `products/cleaning-kit/src/` (this repo folder)
2. Build Sheets/Docs in the business Google account; lock master copies; generate copy-links
3. Render PDFs via tool-pdf-generator; covers + listing art via viz-image-gen
4. Create Gumroad product via Product API (unpublished) with listing copy from mkt-copywriting patterns
5. QA pass → Spencer approval (batch #1 only) → publish
6. Delivery file = branded PDF "Start Here" containing all copy-links + how-to

## Lead magnet (free, email capture)
"Service Business Pricing Cheat Sheet" — 2-page PDF: pricing formula, minimum-job floor, route-density rule of thumb. Works for all trades → nurtures into whichever kit fits.

## Open items
- [ ] Business Google account (Spencer, Phase 0) — masters must NOT live in spencer@got-moles.com long-term
- [ ] Brand name/domain pick → all docs get branded footer
- [ ] Draft all 14 files' content (Claude, next session — no accounts needed for markdown drafts)
