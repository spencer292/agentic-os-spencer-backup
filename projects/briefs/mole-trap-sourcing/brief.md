---
project: mole-trap-sourcing
status: active
level: 2
created: 2026-08-06
---

# Mole Trap Direct Sourcing — Project Brief

## Goal

Replace Trapline Products traps ($6.50/ea bulk) with a direct-manufactured
equivalent built to the same spec, at a landed cost target under $3.50/ea, from a
factory Got Moles can buy from for years. Volume: 3,000–5,000+ units/year, for
internal field use.

## The key finding: the patent is the spec

The Trapline trap is **US 7,380,368 B2, "Animal trap"** — inventor Stephen Albano,
filed 2006-01-18, issued 2008-06-03, **anticipated expiration 2026-10-30**.
Spencer's October 2026 date is exactly right.

Two consequences:

1. **The patent document is a free, public, fully-dimensioned engineering
   disclosure.** It names every component, the assembly method, the materials, and
   the wire gauges. That is the RFQ package — no CAD reverse-engineering needed,
   just verification against physical samples. See the RFQ doc.
2. **After 2026-10-30 the design is public domain** — free to make, import, use,
   and sell. Before that date, *importing into the US* is the exposure. So the
   schedule below simply lands the first shipment after expiry. That costs nothing:
   RFQ, sampling, and tooling all happen in China during the window anyway.

What does **not** expire: the *Trapline* name and trade dress. Nothing on the trap,
the packaging, the cartons, or the shipping docs says "Trapline." Refer to it as a
scissor-jaw wire mole trap.

## Deliverables

| File | What it is |
|------|-----------|
| `2026-08-06_rfq-technical-spec.md` | The technical spec + the exact message to send vendors |
| `2026-08-06_vendor-shortlist-and-qualification.md` | Named leads, search terms, scorecard, red flags, sample protocol |

## The number that changes the decision: tariffs

The $1.88 quote is not the landed cost. Steel articles from China stack duties.
A wire mole trap most likely classifies under **HTS 7326.20.00** (articles of iron
or steel wire), which sits in Chapter 73 — squarely inside the Section 232 steel
derivative net.

Landed cost model, 5,000 units, assuming a realistic to-spec FOB of $2.50 (see
"Why not $1.88" below):

| Scenario | FOB | Duty | Freight+QC+broker | **Landed/ea** | **Annual @5,000** |
|---|---|---|---|---|---|
| Trapline today | — | — | — | **$6.50** | **$32,500** |
| China, low-duty case (3.9% MFN + 25% §301) | $2.50 | $0.72 | $0.27 | **~$3.49** | **~$17,450** |
| China, high-duty case (+50% §232 steel) | $2.50 | $1.97 | $0.27 | **~$4.74** | **~$23,700** |
| US wire-form shop (hypothetical $3.25) | $3.25 | $0 | $0.10 | **~$3.35** | **~$16,750** |

Savings are real in every case — $8,800 to $15,000/year. But note the last row:
**if Section 232 applies, a US spring shop may actually beat China.** That is a
hypothesis, not a quote — and testing it costs one email, since the same RFQ goes
to both. Run them in parallel.

**Action that de-risks the whole model:** request a **CBP binding ruling** on the
classification. It is free, takes roughly 30 days, and the answer is legally
binding on Customs. Filing it in August means the number is settled before any PO
is placed. A licensed customs broker will file it; most will do it for a small fee
or free to win the account.

### Why not $1.88

A $1.88 quote for a five-piece assembled stainless wire trap is almost certainly
one of: zinc-plated carbon steel, 201-grade stainless, or annealed (non-spring-
temper) wire. Any of those produce a trap that rusts or loses closing force in a
season — which is precisely the failure mode Trapline markets against. At field
rates, a trap that misfires costs a re-visit worth far more than the $4.62/unit
saved. The spec doc treats **material grade, temper, and closing force** as the
three non-negotiables and builds acceptance tests around them.

Budget $2.20–$3.20 FOB for a to-spec trap at this volume. Treat anything under
$2.00 as a signal to re-verify the material, not a win.

## Timeline

| When | What |
|------|------|
| Aug 2026 | Buy 6–10 genuine traps as golden samples. Measure and destructive-test one. Send RFQ to 8–12 China shops + 3 US shops. File CBP binding ruling. |
| Sep 2026 | Shortlist to 3. Pay for sample rounds (~$150–500 each). Samples stay in China or ship after Oct 30. |
| Oct 2026 | Sample approval on video/measurement reports. Negotiate. PO issued with **ship date on or after Nov 1**. |
| Nov 2026 | Production run. Pre-shipment inspection before the balance is paid. |
| Dec 2026 / Jan 2027 | Arrival, ahead of the 2027 season. |

Got Moles buys from Trapline one more cycle to cover through year-end. That is the
cost of doing this cleanly, and it is small.

## Constraints

- No "Trapline" branding anywhere on product, packaging, or documents.
- Country-of-origin marking ("Made in China") is required at import even for
  internal use.
- Field performance is the acceptance bar, not price. A cheaper trap that fires
  weakly is a net loss.

## Acceptance criteria

- Landed cost ≤ $3.50/ea at 5,000 units, verified against a real invoice + duty bill.
- Sample traps match golden-sample closing force within ±10% and pass 100 dry-fire
  cycles with no permanent set.
- 48-hour neutral salt spray with no red rust.
- A supplier who has quoted, sampled, and shipped once — with a named English-
  speaking engineering contact, not a sales-only trading account.

## Open decisions

- Confirm annual volume (3,000? 5,000? more) — it moves FOB price materially.
- Standard jaw (~2") only, or a split of standard and large (~2¼")? Coast Mole is
  the WA species; Trapline lists standard as the general-purpose choice.
- Whether to also re-negotiate with Trapline at higher committed volume as a
  fallback / leverage play.
