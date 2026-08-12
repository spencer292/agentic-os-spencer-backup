# RFQ — Scissor-Jaw Wire Mole Trap

Send this to every candidate. Do not attach the patent PDF or name Trapline —
send your own measured drawing plus physical golden samples.

---

## Part 1 — What you're actually buying (read this first)

The trap is **five wire parts, no stampings, no welds, no castings.** Per the
patent's own description, the parts are joined by formed loops and wraps —
"components formed through bending and wrapping rather than soldering."

That matters commercially: a modern CNC wire-forming machine is largely **tool-less**.
There is no injection mold, no die set, no $10k tooling charge. What you pay for is
programming and setup time — realistically **$300–$1,500 one-time total**, plus
sample rounds. If a vendor quotes $8,000 "mold cost," they are either quoting the
wrong process or padding. That single fact is your strongest negotiating position.

### Bill of materials (per patent US 7,380,368 B2)

| # | Part | Wire dia. (per patent) | Notes |
|---|------|------------------------|-------|
| 102 | First jaw segment | 0.125" (⌀3.18 mm) | Transverse portion + spring loop at distal end; 90° bends form jaw tips |
| 104 | Second jaw segment | 0.125" (⌀3.18 mm) | Couples rotatably to 102, wraps around the longitudinal axis |
| 106 | Spring | 0.067" (⌀1.70 mm) | Coiled axially; provides rotational closing force |
| 108 | Pan (trigger) | 0.110" (⌀2.79 mm) | Hinged perpendicular to long axis; hinges formed from the wire endpoints |
| 110 | Trip wire | 0.110" (⌀2.79 mm) | Restrains the open position until pan pressure releases it |

Sub-features named in the patent: 112 first transverse portion, 116 spring loop,
118 coupling loop, 120/122 second and third transverse portions, 124 spring +
finger grip, 126 proximal spring tip, 128 spring catch, 130 distal spring tip,
132/134 pan hinges, 136 trip wire tip, 138 trip wire proximal tip.

> **Verify before you quote anything.** The gauges above are the patent's stated
> examples, not necessarily current production. The 0.067" spring in particular
> looks light for the closing force this trap delivers. **Measure three physical
> traps with calipers or a wire gauge and use YOUR numbers in the RFQ.** The
> patent gets you the architecture for free; the samples get you the truth.

### Overall dimensions to measure and specify

- Jaw spread, open: — (Trapline standard ≈ **2.0"**; large ≈ **2.25"**)
- Jaw spread, closed (should be ~0 / crossed)
- Overall length, set position
- Overall length, fired
- Spring free angle and number of active coils
- Pan width and pan travel to trip
- Trip wire engagement depth at the catch
- **Closing force / torque** — see acceptance tests

---

## Part 2 — Material specification (non-negotiable)

This is where a cheap copy fails, so it is written as a hard spec:

- **Jaws, pan, trip wire:** AISI **302 or 304 stainless**, **spring temper /
  cold-drawn full hard**, ASTM A313 or equivalent. **201 stainless is rejected.**
  Zinc-plated or galvanized carbon steel is rejected.
- **Spring:** AISI **302 stainless spring wire** (ASTM A313) or **17-7 PH** (ASTM
  A313 Type 631) preferred for load retention.
- **Post-form heat treatment:** stress-relieve after coiling and forming per the
  wire supplier's recommendation (typically ~230–260 °C / 450–500 °F for 302
  stainless). State the process and temperature used.
- **Passivation:** all parts passivated per **ASTM A967** after forming, to remove
  free iron from the surface. Untreated stainless picks up tooling iron and rusts
  in spots — it looks like the wrong grade and isn't.
- **No plating, no paint, no coating.** Bare passivated stainless.
- **Mill certificates required per lot** — grade, heat number, tensile, supplier.

If a vendor cannot answer "which grade and temper, and what stress-relief
schedule?" in their own words, they are a trading company, not a spring shop.

---

## Part 3 — Acceptance tests

Written into the PO. Failure of any one = lot rejected.

1. **Closing force / spring torque:** within **±10%** of golden sample, measured
   the same way (state your method — e.g. a hanging force gauge at a fixed point on
   the jaw). This is the single most important number. Insist the factory reports
   it on the sample and on every production lot.
2. **Cycle test:** 100 set-and-dry-fire cycles. No permanent set, no loss of
   trigger sensitivity, no coil relaxation, no cracking at bend radii.
3. **Trigger sensitivity:** pan trips within a stated force band, measured
   against golden samples. Too stiff = missed moles; too light = fires on dirt.
4. **Corrosion:** **48-hour neutral salt spray (ASTM B117)** on 5 pieces from the
   run, **no red rust.** Third-party lab report, factory pays.
5. **Dimensional:** jaw spread and overall length within ±0.5 mm across a 32-piece
   AQL sample.
6. **Fit and finish:** no burrs or sharp wire ends that catch on gloves; bend radii
   free of cracking.

---

## Part 4 — Commercial terms to state up front

- **Annual volume:** state your real number (3,000–5,000+/yr) and that this is a
  **repeat annual program**, not a one-off. Spring shops price loyalty.
- **First order:** ask for quotes at **1,000 / 3,000 / 5,000 / 10,000** so you can
  see the price curve and where the volume break sits.
- **Samples:** 5–10 pieces, paid, with a dimensional + force report. Expect
  $150–$500 and 15–25 days.
- **Payment:** 30% deposit / 70% **after passing pre-shipment inspection**. Never
  100% up front. Pay through Alibaba Trade Assurance or a bank T/T against
  inspection — not WeChat, not a personal account, not to a bank in a different
  company name than the one on the contract.
- **Incoterm:** quote **FOB** (Shenzhen / Ningbo / Xiamen) so you control freight
  and can compare vendors on a like basis. Ask for DDP as a second line for
  comparison, but be aware DDP quotes often hide or under-declare duty — that
  becomes your liability as importer of record, not theirs.
- **Packaging:** bulk cartons, no retail packaging, no branding. Say so — it
  removes cost.
- **Lead time:** production lead time after sample approval, and their capacity
  ceiling per month.

---

## Part 5 — The message to send

Paste this into Alibaba / Made-in-China inquiries or email. It is deliberately
written to sound like an engineer, because vendors triage inquiries and technical
ones go to the top.

> **Subject: Custom stainless wire form assembly — 5 parts — 5,000 pcs/year, ongoing**
>
> Hello,
>
> We are a US pest-control services company in Washington State. We use a small
> spring-actuated wire trap in the field and want to move to direct manufacture as
> an ongoing annual program (3,000–5,000+ pcs/year, repeat).
>
> The part is a five-piece wire assembly: two formed jaw segments (⌀3.2 mm), a
> torsion spring (⌀1.7 mm), a trigger pan and a trip wire (⌀2.8 mm). All joints are
> formed loops and wraps — no welding, no soldering, no stampings, no molded parts.
> We will supply physical golden samples and a dimensioned drawing.
>
> Material is fixed: AISI 302/304 stainless, spring temper, ASTM A313 or
> equivalent, stress-relieved after forming and passivated per ASTM A967. Bare
> finish, no plating. 201 stainless and plated carbon steel are not acceptable.
> Mill certificates required per lot.
>
> Please advise:
> 1. Can you produce and **assemble** all five parts in-house, or do you subcontract?
> 2. FOB unit price at 1,000 / 3,000 / 5,000 / 10,000 pcs.
> 3. One-time setup / programming charge (we understand CNC wire forming needs no
>    hard tooling — please quote setup, not mold cost).
> 4. Sample cost and lead time for 5 pieces with a dimensional report and a
>    measured spring-force report.
> 5. Production lead time and monthly capacity.
> 6. Can you measure and report **closing force** on samples and on each production
>    lot, to match our golden sample within ±10%?
> 7. Can you provide a third-party 48-hour neutral salt spray report (ASTM B117)?
> 8. Your ISO 9001 certificate and the name and email of the **engineer** who will
>    own this part.
>
> We are quoting several suppliers and will place a first order this autumn, with
> shipment scheduled for November. We are looking for a long-term partner, not the
> lowest one-time price.
>
> Best regards,
> Spencer — Got Moles

---

## Part 6 — Golden sample protocol

Before any of this goes out:

1. Buy **6–10 genuine traps** (~$23 retail each, cheaper by the dozen from the
   maker — you already have a bulk account).
2. **Destructive-test one.** Measure every wire diameter with calipers. Count coils.
   Measure free angle. Photograph every bend from three angles with a scale in frame.
3. **Measure closing force on three** with a hanging fish scale or force gauge at a
   marked, repeatable point. Record the method in writing — the factory has to
   reproduce your method, not invent one.
4. **Keep 3 in a sealed bag as the reference set.** Never send all your samples out.
5. Send **2 traps** to each of your final 2–3 shortlisted factories, not to all
   twelve. Use DHL, declare low value, mark as samples.
6. Build a simple 1-page dimensioned drawing from your measurements. Hand sketch
   with dimensions is fine — a spring shop reads it better than a bad CAD file.
