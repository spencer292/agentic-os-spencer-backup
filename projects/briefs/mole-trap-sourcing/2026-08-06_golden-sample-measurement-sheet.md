# Golden Sample Measurement Sheet

Print this. Fill it in at a bench with new, unused traps. Every number here goes
into the RFQ, and every number becomes an acceptance criterion later — this sheet
is what stops a factory from shipping you a trap that looks right and fires weak.

**Budget: one afternoon.** Do it once, properly.

---

## Tools

| Tool | Spec | Note |
|------|------|------|
| Digital calipers | 0.01 mm resolution | The one essential item. ~$30. |
| Digital hanging scale or force gauge | 0–50 lb / 0–25 kg, 0.01 lb resolution | A fishing scale works. Must read peak-hold if possible. |
| Steel rule | mm markings | Goes in every photo as a scale reference. |
| Angle finder or protractor | 1° | For spring free angle. |
| Permanent marker | fine tip | For marking force-measurement points. |
| Zip bags + labels | — | One per trap, labeled. |
| Phone camera | — | Photo checklist at the end. |

---

## Sample log

Buy **6–10 new traps**. Record the batch — if they came from one purchase they are
one lot, which matters when you compare numbers.

| Sample ID | Size (std / large) | Purchase date | Source | Condition |
|---|---|---|---|---|
| A | | | | new, unfired |
| B | | | | new, unfired |
| C | | | | new, unfired |
| D | | | | new, unfired |
| E | | | | new, unfired |
| F | | | | new, unfired |

> Use **new** traps only. A field-used trap has already lost some spring force, and
> if you spec from it you will lock in a degraded trap forever.

---

## Part 1 — Wire diameters

Measure each part on **three traps (A, B, C)**, at **three points per part**, and
record all nine numbers. Wire varies within tolerance, and forming flattens wire at
bends — **measure away from bends**, on straight sections.

Patent US 7,380,368 B2 lists these as examples. Your measured numbers override them.

| Part | Patent says | A-1 | A-2 | A-3 | B-1 | B-2 | B-3 | C-1 | C-2 | C-3 | **Avg** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 102 First jaw segment | 0.125" / 3.18 mm | | | | | | | | | | |
| 104 Second jaw segment | 0.125" / 3.18 mm | | | | | | | | | | |
| 106 Spring | 0.067" / 1.70 mm | | | | | | | | | | |
| 108 Pan (trigger) | 0.110" / 2.79 mm | | | | | | | | | | |
| 110 Trip wire | 0.110" / 2.79 mm | | | | | | | | | | |

> **Expect the spring to disagree with the patent.** 0.067" (1.70 mm) is light for
> the closing force this trap delivers. If your calipers say 0.080" or 0.092",
> trust the calipers — the patent describes one embodiment, not today's production.
> Getting this one number wrong is the difference between a trap that fires and a
> trap that doesn't.

---

## Part 2 — Overall geometry

Measure on three traps. Record in mm to 0.1.

| Dimension | A | B | C | Avg | Notes |
|---|---|---|---|---|---|
| Jaw spread, open (set position) | | | | | Trapline std ≈ 2.0" / 50.8 mm; large ≈ 2.25" / 57.2 mm |
| Jaw spread, closed (fired) | | | | | Should be ~0 or crossed — record overlap if they cross |
| Overall length, set | | | | | |
| Overall length, fired | | | | | |
| Overall width at widest point | | | | | Determines how it fits an intact run |
| Jaw tip length (the 90° bend leg) | | | | | |
| Pan width | | | | | |
| Pan length | | | | | |
| Pan travel to trip | | | | | How far the pan moves before it lets go |
| Trip wire engagement depth at catch | | | | | How far the trip wire sits into the catch |
| Height, set (ground to top) | | | | | |

---

## Part 3 — Spring detail (do not skip)

The spring is the part that decides whether the trap works. Measure on **two traps**,
and disassemble the destructive sample to get the rest.

| Property | A | B | Notes |
|---|---|---|---|
| Wire diameter | | | From Part 1 |
| Coil outside diameter (OD) | | | |
| Coil inside diameter (ID) | | | |
| Number of **active coils** | | | Count them. Photograph and count from the photo — easier than counting by eye. |
| Body length of coil | | | |
| Free angle (legs, unloaded) | | | Angle between legs with no load, in degrees |
| Angle at set position | | | |
| **Hand of wind (LH / RH)** | | | **Critical.** Look down the coil axis: does the wire spiral clockwise or counter-clockwise going away from you? Get this wrong and the factory builds a mirrored trap that will not assemble. |
| Leg length, proximal (126) | | | |
| Leg length, distal (130) | | | |

---

## Part 4 — Force measurements (the most important numbers on this sheet)

These are the three numbers you will hold the factory to. **The method matters more
than the absolute value** — the factory has to reproduce *your* method, so write it
down exactly and send it with the samples.

**Setup, once:**
Mark a point on the first jaw segment with the permanent marker, at a measured
distance from the hinge/pivot centre. Record it:

> **Measurement radius R = ______ mm from pivot centre** (25 mm is a good default)

Attach the scale with a short cord loop at that mark, and pull **perpendicular to
the jaw** every time. Same point, same direction, same day, same scale.

| # | Measurement | Method | A | B | C | Avg | Spec (avg ±10%) |
|---|---|---|---|---|---|---|---|
| **F1** | Jaw holding force, set | Trap set. Pull at mark R, perpendicular, until the jaw just begins to move. Record peak. | | | | | |
| **F2** | Pan trip force | Trap set. Hook scale at pan centre. Pull slowly in the direction a mole pushes. Record force at the instant it trips. | | | | | |
| **F3** | Residual closing force | Trap fired/closed. Pull the jaws apart to a **25 mm** gap. Record force. | | | | | |

Repeat each measurement **three times per trap** and average. Record ambient temp:
______ °C. Spring force drifts slightly with temperature and it costs nothing to note it.

**F2 is the sleeper.** Too stiff and the trap misses moles; too light and it fires
on falling dirt. It is the number cheap factories never think about, and the one
your catch rate depends on.

---

## Part 5 — Destructive teardown (sample F only)

Take one trap apart completely. This is the only way to see how the loops and wraps
are actually formed.

- [ ] Unwind / cut apart and lay all five parts flat
- [ ] Photograph all five parts side by side on graph paper with the rule in frame
- [ ] Measure the **developed length** (total straight length) of each part before forming — this is what the factory quotes material against
- [ ] Measure every **bend radius** — inside radius at each bend
- [ ] Count and sketch every bend with its angle
- [ ] Note how the coupling loop (118) captures the second jaw segment
- [ ] Note how the pan hinges (132/134) are formed from the wire endpoints
- [ ] Note the spring catch (128) geometry — how the trip wire engages

| Part | Developed length (mm) | # of bends | Min bend radius (mm) |
|---|---|---|---|
| 102 First jaw segment | | | |
| 104 Second jaw segment | | | |
| 106 Spring | | | |
| 108 Pan | | | |
| 110 Trip wire | | | |

---

## Part 6 — Material verification (do this, it's cheap)

Send **one jaw segment and one spring** from the destructive sample to a materials
lab for **XRF / PMI (positive material identification)** and hardness.

- Cost: roughly **$50–150**, turnaround a few days
- Ask for: **alloy grade identification** and **micro-Vickers or Rockwell hardness**
- Search "positive material identification lab" or "metallurgical testing lab" plus
  Seattle / Tacoma / Portland

Why it's worth doing twice — once now, once on the first production lot:

XRF separates **201 stainless** (high manganese, low nickel) from **302/304** (8–10%
nickel) instantly and unambiguously. The single most likely way a Chinese supplier
quietly cuts cost is swapping 302 for 201, and it is invisible to the eye. A $100
test on the first production lot is the cheapest insurance in this entire project.

| Result | Jaw segment | Spring |
|---|---|---|
| Grade identified | | |
| Nickel % | | |
| Manganese % | | |
| Chromium % | | |
| Hardness (HV or HRC) | | |

---

## Part 7 — Photo checklist

Every photo with the **steel rule in frame**. Shoot on plain white paper, good light,
no flash.

- [ ] 1. Whole trap, set position, top view
- [ ] 2. Whole trap, set position, side view
- [ ] 3. Whole trap, set position, front view (down the jaw axis)
- [ ] 4. Whole trap, fired, top view
- [ ] 5. Whole trap, fired, side view
- [ ] 6. Close-up: spring coil, down the axis (for coil count and hand of wind)
- [ ] 7. Close-up: spring legs and how they seat
- [ ] 8. Close-up: coupling loop (118) where the jaws join
- [ ] 9. Close-up: pan hinges (132/134)
- [ ] 10. Close-up: spring catch (128) and trip wire tip (136) engaged
- [ ] 11. Close-up: jaw tips and the 90° bends
- [ ] 12. All five disassembled parts laid flat on graph paper

---

## Part 8 — What goes to the factory

1. This completed sheet (scan or photograph it)
2. All 12 photos
3. A one-page hand sketch with your averaged dimensions marked — **a clear hand
   sketch beats a bad CAD file**; spring shops read sketches every day
4. Your force-measurement method written out, including the radius R
5. **2 physical traps** — to shortlisted vendors only, never all of them

**Keep 3 traps sealed in a labeled bag as the untouched reference set.** When a
production lot arrives in 2027 and something feels off, that bag is the only thing
that settles the argument.
