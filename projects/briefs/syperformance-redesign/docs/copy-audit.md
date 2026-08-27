# Copy audit — against the trust ruleset

**Run 2026-08-26** in AUDIT mode against `mkt-syp-trust-copy`. Copy pulled from **rendered
pages**, not from theme source. Fixes applied and pushed the same session unless marked
BLOCKED.

The ruleset is Spencer's. Its diagnosis of the first draft — *it argued instead of proving* —
turned out to be measurable, and the page it was written about was still live.

---

## 1. The finding that matters most

**All four rows of Rule 1's kill table were live on the homepage, plus the rule's named dead
headline and Rule 3's "Weak" example verbatim.** The ruleset was not written from a general
principle. It was written from this page.

| Rule | Was live | Now |
|---|---|---|
| 4 (headline) | "We make the drivetrain parts that break first." | "Your drivetrain is the weak link. We manufacture the fix." |
| 1 (kill table) | "We manufacture our own parts. We don't rebadge someone else's." | "Our drawings. Our tolerances. Our name." |
| 1 (kill table) | "Designed against the failure" | "Designed from what broke" |
| 1 (kill table) | "…nothing ships that does not meet them." | "Every part is inspected, then boxed." |
| 1 (kill table) | "…rather than discovered after checkout." | **deleted, not made affirmative** — see §2 |
| 2 (liar test) | "Built to our spec" | "Ours to change" |
| 3 (Weak example) | "SYPerformance manufactures its own parts…" | "You broke a part. You replaced it with the same part, and it broke again…" |

## 2. Where two rules collided, and which won

**Rule 6 outranks Rule 1.** Rule 1's affirmative for the checkout line is *"Lead time is on
the product page before you pay."* That sentence is false today: no lead time is published on
any product page, and `page.lead-times` still ships zero rows. Making the sentence affirmative
would have converted a hedge into an overclaim. It was deleted instead, and the claim returns
when lead times exist.

**Rule 2 collides permanently with the manufacturing-claim rule.** Two of Rule 2's four proof
types — *a photo of the mill* and *hours of machine time* — assert a physical shop floor, which
this brand may never claim. So proof on this site has to come from the other two: material
spec / tolerance / inspection step, and a named car with a power figure. Both are SY's to
supply. This is written into the skill so it does not get re-litigated.

## 3. Two false claims, both live

- **`/pages/about` said "Parts we manufacture: **110+**".** The confirmed count is **75** — the
  110 was the pre-correction figure that still counted Synchro Solutionz and Comp 1 Clutch.
  Fixed.
- **The mega-panel note "Our own parts - built to order" printed in every menu**, including
  **Brands** — where it sat directly under Synchro Solutionz, Comp 1 Clutch, AEM, Turbosmart,
  Blox, Rywire, Vibrant, Mickey Thompson and Competition Clutch and claimed nine other
  companies' products as ours. It also said *built to order* about resold stock. Now scoped to
  `syp-*` menus, the only ones where both halves are true.

## 4. Rule 3, measured

Homepage body copy, counting `we/our/us/SYP` against `you/your`:

| | SYP-facing | Builder-facing |
|---|---|---|
| Before | 34 | 3 |
| After | 26 | 9 |

Target is roughly 30:70. **This is improved, not fixed.** The remaining imbalance is
structural: the three trust steps and the story section are still about the company, because
the thing that would make them about the builder — a named car, a spec, an inspection
step — does not exist yet.

**Collection intros: 35 of 55 never say "you".** That is the largest single queue of Rule 3
work on the site and it is best done during the product-copy pass, not before it.

## 5. Rule 1's tripwire fired 19 times on collection copy. None were violations.

The literal test flags *not / never / rather than / doesn't*. On the collection intros, every
one of the 19 hits is a **technical negation about the customer's car**, which is exactly what
the rule is meant to permit:

> "The 4G63 and 4B11 do not share parts — pick your generation below before you shop."
> "Clutch capacity is chosen against torque at the crank… not against a peak horsepower number."
> "Synchro wear is the failure most owners misread… usually a cone and a slider, not a gearset."

Rewriting these would have made the copy worse and less precise. **The tripwire is a search,
not a verdict** — the rule's stated intent is sentences that define *SYP* by negatives, and all
of those were on the homepage. Recorded here so the next pass does not "fix" them.

Two more cleared deliberately: `/collections/comp-1-clutch` carries *"Not to be confused with
Competition Clutch, a separate brand also stocked here"* (useful disambiguation, kept), and
`/collections/mitsubishi-evo-x` carries *"If there is an Evo X part you need that is not here,
ask"* (builder-facing, kept).

## 6. Also fixed

- **"Where the moat is"** — internal strategy language, live as a customer-facing eyebrow. Now
  "The parts that break first".
- **"the parts we can build better than anyone selling on price"** — unverifiable superlative,
  Rule 6. Rewritten.
- **`/collections/syp-billet`** — *"Not picked from someone else's catalog and rebadged"* (Rule
  1) and a stale implied count. Now opens on the real number: "Seventy-five parts here carry
  SYPerformance drawings, SYPerformance tolerances and the SYPerformance name on the box."

---

## 7. BLOCKED — the ship checklist cannot pass without these

Rule 2: *no trust section ships with zero proof assets.* By that rule, the homepage trust
section and the About page are **not shippable today**, regardless of how well they are
written. Nothing here can be written around.

| # | Needed | Who | Blocks |
|---|---|---|---|
| A | **One hard spec number** — a material (6061-T6, 4340, 300M) and one tolerance on one hero part | SY | Homepage proof minimum, every product page |
| B | **One named build with a power figure** — platform, power, owner or shop, how long the part has been on it | SY / Spencer | Homepage proof minimum. This is the cheapest of the three to get and the most persuasive |
| C | **One real photo of a part** — a finished part on a bench, in hand, or on a car. **Not** a machine, a fixture or a shop floor: those assert a claim this brand does not make | SY | Homepage, product pages (checklist 3.4) |
| D | **The origin failure** — what broke, on what car, what got machined because of it | SY | About, which the ruleset says carries the most trust weight on the site |
| E | **Lead times per category** | SY | `page.lead-times` (zero rows), the checkout promise deleted in §2 |
| F | **Warranty terms** | SY | `page.warranty` (renders a heading and nothing else) |

**B is the unlock.** One customer car with a dyno number and a part that has survived on it
satisfies Rule 2 for the homepage, gives every product page something to point at, and is the
one proof type that costs nothing but a phone call.

## 8. Consequence for the 198 product descriptions

The copy-pilot structure survives this audit — lead, *why this part exists*, *before you buy*,
spec table, fitment. Two changes to how they get written:

1. **Open on the reader's failure, not on what the part is.** Pilot 1 currently opens *"A single
   lobe rocker conversion for the Honda B-series, manufactured by SYPerformance."* Rule 3 wants
   the builder first.
2. **Every `(SY to supply)` gap is now a Rule 2 blocker, not a cosmetic one.** A product page
   with an empty spec table has zero proof assets and fails the ship checklist. The copy can be
   written and staged; the page is not *done* until at least one number lands in it.
