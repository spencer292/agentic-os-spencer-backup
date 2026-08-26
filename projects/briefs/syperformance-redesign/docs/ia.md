# Phase 2 — Information Architecture

**Store:** syperformance.net redesign, built on `syperformance-build.myshopify.com`
**Date:** 2026-08-25
**Status:** Designed and ready to build. Needs one thing from Spencer — see §7.

---

## 0. What this replaces

Phase 0 found the navigation broken in five specific ways: `SHOP BY BRAND` and `SHOP BY PRODUCT` both pointing at `/collections`, five individual products sitting at category level, one nav link pointing at a URL `robots.txt` forbids Google from crawling, four typos live in the menu, and no fitment entry point anywhere.

Underneath that, 57 collections — **all 57 with an empty description**, 12 of them holding one or two products, and one called SALE SPECIAL holding 118 of the 198 products in the catalog.

This phase replaces all of it with 33 collections, every one of which has intro copy written below, arranged in a nav that puts the manufacturing first.

**How the 33 were chosen:** every product was classified by platform and by system with explicit rules (`scripts/build-ia.mjs`), not by eye. All 198 products land somewhere; nothing falls through. Counts in this document are measured, not estimated. Re-run the script and the numbers regenerate.

---

## 1. The one finding that changed the plan

The plan says the moat is drivetrain, and it is. But the plan also puts **Synchro Solutionz** in a `BRANDS` menu alongside Comp 1 Clutch, and that is where the shape of the catalog disagrees with it.

| In-house line | SKUs |
|---|---|
| SYPerformance billet drivetrain (halfshafts, carriers, bellhousing, transfer case block-off, shift selector) | 12 |
| **Synchro Solutionz transmission internals** | **33** |
| SYPerformance turbo manifolds | 31 |
| SYPerformance cooling and charge piping | 19 |

Synchro Solutionz is the deepest in-house line in the catalog and it is *entirely* drivetrain. Putting it under `BRANDS` means the single biggest body of drivetrain product on the site is reachable only by someone who already knows the brand name — which is nobody outside the existing customer base.

**Decision (Spencer, 2026-08-25):** Synchro Solutionz surfaces inside `SYP BILLET → Drivetrain` as *Transmission Internals*. The `synchro-solutionz` brand collection still exists and still keeps its URL, so nothing that ranks today stops ranking. It just stops being the only way in.

---

## 2. The navigation

Three rules govern this tree, all from the plan and all enforced below:

- **No single product is ever linked from the nav.** Products live in collections. The five that currently sit at category level (HD Vanjen Clamps, Stainless V-Band Assembly, Flex Bellow, K Billet Bellhousing, K AWD T-Case Block Off) are now inside `SYP Clamps, Hardware & Fabrication` and `Billet Halfshafts, Carriers & Selectors`.
- **Every collection linked here has intro copy.** §4 carries it. A collection with no words is a page that cannot rank.
- **Clearance is not in the primary nav.** See §5.

```
SYP BILLET                                        → syp-billet (110)
  Drivetrain                                      → syp-drivetrain (42)
    Billet Halfshafts, Carriers & Selectors       → billet-drivetrain (12)
    Transmission Internals — Synchro Solutionz    → transmission-internals (33)
    LSD, Gearsets & Final Drives                  → lsd (4)
    Clutch & Flywheel                             → clutch-flywheel (6)
  Single Lobe Rockers                             → syp-single-lobe-rockers (3)
  Turbo Manifolds                                 → syp-turbo-manifolds (31)
  Cooling & Charge Piping                         → syp-cooling (19)
  Clamps, Hardware & Fabrication                  → syp-fabrication-hardware (10)

HONDA                                             → honda (104)
  K-Series                                        → honda-k-series (66)
  B/D/H-Series                                    → honda-b-d-h-series (38)

MITSUBISHI EVO                                    → mitsubishi-evo-parts (21)
  Evo 7/8/9                                       → mitsubishi-evo-7-8-9 (18)
  Evo X                                           → mitsubishi-evo-x (3)

BMW / TOYOTA B58                                  → bmw-toyota-b58 (17)

FORCED INDUCTION                                  → forced-induction (18)
  Turbo Manifolds                                 → turbo-manifolds (24)
  Exhaust & Hot Parts                             → exhaust-hot-parts (10)
  Cooling & Charge Piping                         → cooling (26)
  Fueling                                         → fueling (7)
  Engine Management & Electronics                 → engine-management (8)

FABRICATION                                       → universal-fabrication (56)
  Clamps, V-Band & Flanges                        → clamps-v-band-flanges (7)
  Pie Cuts, Mandrel Bends & Tube                  → pie-cuts-mandrel-bends (4)

ENGINE
  Engine Internals & Service Parts                → engine (17)
  Valvetrain                                      → valvetrain (6)
  Intake & Throttle Bodies                        → intake (4)
  Chassis & Suspension                            → suspension (7)
  Exterior                                        → exterior (5)

BRANDS
  Synchro Solutionz                               → synchro-solutionz (33)
  Comp 1 Clutch                                   → comp-1-clutch (2)

TECH                                              (Phase 6 — no collections)
  Tech Articles · Install Guides · Build Gallery
```

**Not in the nav, but live:** `clearance`, and the five per-platform manifold views described in §4.

**Two honest notes on this tree.** `MITSUBISHI EVO → Evo X` holds three products, and `SYP BILLET → Single Lobe Rockers` holds three. Both stay because they are real search terms and, in the rockers' case, a flagship product family — but they will look thin next to a 66-product K-Series menu, and no amount of design hides that. The fix is more product, not more nav.

---

## 3. Collection set at a glance

33 collections, down from 57. **Twelve keep their existing handle**, which means twelve established URLs keep their history and need no redirect.

| # | Handle | Title | Products | Handle status |
|---|---|---|---|---|
| 1 | `syp-billet` | SYP Billet — Made In-House | 110 | new |
| 2 | `syp-drivetrain` | SYP Drivetrain | 42 | new |
| 3 | `syp-single-lobe-rockers` | Single Lobe Rockers | 3 | new |
| 4 | `syp-turbo-manifolds` | SYP Turbo Manifolds | 31 | new |
| 5 | `syp-cooling` | SYP Cooling | 19 | new |
| 6 | `syp-fabrication-hardware` | SYP Clamps, Hardware & Fabrication | 10 | new |
| 7 | `honda` | Honda | 104 | **kept** |
| 8 | `honda-k-series` | Honda K-Series | 66 | new |
| 9 | `honda-b-d-h-series` | Honda B/D/H-Series | 38 | new |
| 10 | `mitsubishi-evo-parts` | Mitsubishi Evo | 21 | **kept** |
| 11 | `mitsubishi-evo-7-8-9` | Mitsubishi Evo 7/8/9 | 18 | new |
| 12 | `mitsubishi-evo-x` | Mitsubishi Evo X | 3 | new |
| 13 | `bmw-toyota-b58` | BMW / Toyota B58 | 17 | new |
| 14 | `transmission-internals` | Transmission Internals | 33 | new |
| 15 | `billet-drivetrain` | Billet Halfshafts, Carriers & Selectors | 12 | new |
| 16 | `lsd` | LSD, Gearsets & Final Drives | 4 | **kept** |
| 17 | `clutch-flywheel` | Clutch & Flywheel | 6 | new |
| 18 | `valvetrain` | Valvetrain | 6 | new |
| 19 | `turbo-manifolds` | Turbo Manifolds | 24 | new |
| 20 | `forced-induction` | Forced Induction — Turbos, Wastegates & BOV | 18 | **kept** |
| 21 | `exhaust-hot-parts` | Exhaust & Hot Parts | 10 | new |
| 22 | `cooling` | Cooling & Charge Piping | 26 | **kept** |
| 23 | `fueling` | Fueling | 7 | **kept** |
| 24 | `engine-management` | Engine Management & Electronics | 8 | new |
| 25 | `engine` | Engine Internals & Service Parts | 17 | **kept** |
| 26 | `intake` | Intake & Throttle Bodies | 4 | **kept** |
| 27 | `clamps-v-band-flanges` | Clamps, V-Band & Flanges | 7 | new |
| 28 | `pie-cuts-mandrel-bends` | Pie Cuts, Mandrel Bends & Tube | 4 | new |
| 29 | `suspension` | Chassis & Suspension | 7 | **kept** |
| 30 | `exterior` | Exterior | 5 | **kept** |
| 31 | `universal-fabrication` | Universal & Fabrication | 56 | new |
| 32 | `synchro-solutionz` | Synchro Solutionz | 33 | **kept** |
| 33 | `comp-1-clutch` | Comp 1 Clutch | 2 | **kept** |
| — | `clearance` | Clearance | curated | new — see §5 |

Products appear in more than one collection by design: a K-series billet halfshaft is in `syp-billet`, `syp-drivetrain`, `billet-drivetrain`, `honda`, and `honda-k-series`. That is correct and it is how people shop. §6 covers the canonical-tag consequence.

---

## 4. Intro copy

Every paragraph below goes in the collection's description field. They are written to be read by a person deciding whether they are in the right place, and they are the only thing standing between a bare product grid and a page Google can rank.

**Nothing here states a horsepower figure, a tolerance, a material spec, a lead time, or a warranty term.** Those are yours to give me and they go in during Phase 4 and Phase 6. What is written is what the part does and what a buyer needs to know before choosing one.

### In-house

**`syp-billet` — SYP Billet — Made In-House**
> Every part on this page is designed and machined in-house — not sourced, not rebadged. Billet drivetrain, single lobe rockers, turbo manifolds, cooling and charge piping, clamps and hardware, across Honda B, D, H and K series, Mitsubishi Evo, and BMW/Toyota B58. If you want to know what SYPerformance actually makes rather than what it stocks, this is the list.

**`syp-drivetrain` — SYP Drivetrain**
> Drivetrain is where power stops being a dyno number and starts being a reliability problem. Halfshafts, halfshaft carriers, billet bellhousings, transfer case block-offs and shift selectors, alongside the Synchro Solutionz transmission internals that go inside the box. These are the parts that fail first on a built car and the parts most worth doing once.

**`syp-single-lobe-rockers` — Single Lobe Rockers**
> A single lobe rocker conversion removes the VTEC changeover from the valvetrain and runs one lobe profile throughout, which takes a set of moving parts out of a system that spends its life at high rpm. Available for both B series and K series. If you are already running aggressive cams and high spring pressures, this is the conversion worth understanding before your next head build.

**`syp-turbo-manifolds` — SYP Turbo Manifolds**
> In-house turbo manifolds for Honda K, Honda B/D/H, Evo 7/8/9, Evo X and B58 — top mount, bottom mount, forward facing, sidewinder and stock placement. Manifold choice sets turbo position, and turbo position sets what else has to move: hood clearance, downpipe routing, wastegate placement, charge piping. Read the fitment notes on the product page before you commit to a layout.

**`syp-cooling` — SYP Cooling**
> Intercoolers, charge piping, coolant necks, fill pots and overflow tanks, fabricated in-house from 6061. Charge air cooling and coolant routing are the two things that decide whether a build makes its power on the third pull as well as the first. Sizes and end-tank configurations vary by application — check the fitment notes for what clears your chassis.

**`syp-fabrication-hardware` — SYP Clamps, Hardware & Fabrication**
> HD Vanjen clamps, stainless V-band assemblies, flex bellows, titanium studs and the weld-on fittings that go with them. Clamps and studs are the parts nobody plans for and everybody replaces — a V-band that relaxes under heat cycling or a stud that stretches will cost you a session regardless of what the rest of the car is worth.

### Platform

**`honda` — Honda**
> Every Honda part in the catalog, B, D, H and K series, across drivetrain, forced induction, cooling, fabrication and engine internals. Use the sub-collections to narrow to your engine family, or the fitment selector to filter the whole catalog to your chassis.

**`honda-k-series` — Honda K-Series**
> The K series is the deepest platform in this catalog, covering FWD, AWD and RWD swaps: transmission internals and synchros, billet halfshafts and carriers, AWD bellhousings and transfer case block-offs, top mount and forward facing turbo manifolds, cooling and charge piping. K20 and K24, RSX, EP3, DC5, FG/FA and swapped chassis.

**`honda-b-d-h-series` — Honda B/D/H-Series**
> B, D and H series parts including brass and dual cone synchro kits, single lobe rockers, hydro billet halfshafts and carriers, top mount and mini ram turbo manifolds, and B/D/H intake and exhaust hardware. Covers B16, B18, GSR, ITR, H22 and Accord Euro applications — check the individual product for which of those it is cut for, because the families share a case but not every part.

**`mitsubishi-evo-parts` — Mitsubishi Evo**
> Evo 7/8/9 and Evo X parts: turbo manifolds in stock placement, top mount and forward facing, hot parts and downpipes, intercoolers and pipe kits, clutch and fueling. The 4G63 and 4B11 do not share parts — pick your generation below before you shop.

**`mitsubishi-evo-7-8-9` — Mitsubishi Evo 7/8/9**
> 4G63 parts for Evo 7, 8 and 9. Stock placement, top mount V-band and forward facing turbo manifolds, stock frame turbo components, downpipes and hot parts, upper and lower intercooler pipe kits, and complete intercoolers. Manifold choice drives everything downstream on this platform — decide the turbo position first, then the piping.

**`mitsubishi-evo-x` — Mitsubishi Evo X**
> 4B11 parts for the Evo X: stock placement and top mount V-band turbo manifolds, and titanium exhaust manifold studs. This is a short list and we would rather say so than pad it. If there is an Evo X part you need that is not here, ask — a lot of what we make starts as a customer request.

**`bmw-toyota-b58` — BMW / Toyota B58**
> B58 parts for the A90/A91 Supra and BMW 240i/340i/440i/540i/740i, including xDrive. Six-port top mount turbo manifolds and CNC turbo flanges, downpipes, charge pipe kits, throttle body and charge pipe flanges, and coolant feed fittings. Note the split between B58 generations and between stock frame and top mount layouts — the flanges are not interchangeable.

### Drivetrain systems

**`transmission-internals` — Transmission Internals**
> Synchros, hubs, sliders, collars, springs and complete rebuild kits — the Synchro Solutionz line, made in-house. Synchro wear is the failure most owners misread as "the box needs rebuilding": the grind into second or third under load is usually a cone and a slider, not a gearset. Kits are available per-gear and as full 1-4 and 1-6 refreshes, with and without bearings and seals.

**`billet-drivetrain` — Billet Halfshafts, Carriers & Selectors**
> Billet halfshafts and halfshaft carriers, AWD bellhousings, transfer case block-offs, billet cases, and HD shift selectors. The carrier is the part most people find out about the hard way — a stock intermediate shaft support flexes under load, and once it does, the inner joint angle changes every time you launch. Available for B series and K series.

**`lsd` — LSD, Gearsets & Final Drives**
> Limited slip differentials, gearsets, final drives and diff bearing kits for Honda B and K series, FWD and AWD. A differential decision is a driving decision before it is a parts decision: helical and plate-type behave differently on corner exit and want different things from your suspension setup.

**`clutch-flywheel` — Clutch & Flywheel**
> Twin and triple disc clutches from Comp 1 Clutch, flywheels, and scatter shields. Clutch capacity is chosen against torque at the crank and how the car is driven, not against a peak horsepower number — a street car that sees traffic and a car that only sees a launch want different discs.

**`valvetrain` — Valvetrain**
> Single lobe rockers for B and K series, billet timing chain guides, and the valvetrain hardware that goes with them. Everything on this page is aimed at the same problem: valvetrain parts that were designed around a stock rev ceiling behaving differently once cams, springs and boost have moved that ceiling.

### Forced induction and cooling

**`forced-induction` — Forced Induction — Turbos, Wastegates & BOV**
> Turbochargers, turbo kits, wastegates, blow-off valves, boost controllers and turbo accessories. Start with the manifold, because turbo position decides what fits; the turbo, gate and piping follow from it. Use the fitment selector to narrow this list to your platform.

**`turbo-manifolds` — Turbo Manifolds**
> Every turbo manifold in the catalog, in-house and resold, across Honda K, Honda B/D/H, Evo 7/8/9, Evo X and B58 — top mount, bottom mount, forward facing, sidewinder, mini ram, ram horn and stock placement. Manifold design is a trade between spool, packaging and how the runners survive heat cycling. The product pages say which trade each one makes.

**`exhaust-hot-parts` — Exhaust & Hot Parts**
> Downpipes, up pipes, headers, hot parts kits and resonators. Hot parts are where manifold choice becomes real — a forward facing manifold and a stock placement manifold need different downpipes, and the wastegate routing is part of that decision, not an afterthought.

**`cooling` — Cooling & Charge Piping**
> Intercoolers, upper and lower charge pipe kits, coolant necks and fill pots, overflow tanks, radiators and coolant fittings. Covers Honda, Evo and B58 applications plus universal cores. Charge air temperature is what separates the number a car makes on the first pull from the number it makes on the fifth.

**`fueling` — Fueling**
> Injectors, fuel pumps, rails, regulators and surge tanks. Fueling has to be sized against the power target *and* the fuel — the same setup that is comfortable on pump gas can be marginal on E85, and the pump is usually the part that runs out first.

**`engine-management` — Engine Management & Electronics**
> ECUs, engine management, wiring, harnesses, sensors, gauges, coils and alternator relocation. None of the rest of this catalog makes power without something to tune it with, and a boost target set in software is the cheapest part of any build to get wrong.

### Engine and chassis

**`engine` — Engine Internals & Service Parts**
> Oil pumps and pans, water plates and bypasses, thermostats, seal and bearing kits, idler pulleys, shims and the service parts that come out of a build alongside the headline components. Not glamorous, and the reason a rebuild either goes back together in a weekend or does not.

**`intake` — Intake & Throttle Bodies**
> Billet and tuner series throttle bodies for Honda B/D/F/H series, RBC/RBB adapter plates, intake manifolds and throttle cables. Throttle body sizing is chosen against the manifold and the rpm the engine actually lives at, not against the biggest number that bolts on.

**`suspension` — Chassis & Suspension**
> Suspension, traction bars, camber correction and tires. On a front-wheel-drive car making real power, chassis parts are drivetrain parts — how the car puts power down decides how much of it the halfshafts ever see.

**`exterior` — Exterior**
> Carbon fiber fenders, door guard trim, trunk spoilers, hood pins and quick release hood hinges. Mostly A90/A91 Supra and Honda applications.

### Fabrication

**`universal-fabrication` — Universal & Fabrication**
> Everything that is not platform-specific: pie cuts, mandrel bends, stainless tube, weld-on caps and fittings, V-band and turbo flanges, clamps, bellows and titanium hardware. If you are building your own manifold, charge piping or exhaust, start here.

**`clamps-v-band-flanges` — Clamps, V-Band & Flanges**
> HD Vanjen clamps, stainless V-band assemblies, turbo head, inlet and discharge flanges, T3/T4 and V-band flanges, flex bellows and titanium studs. Getting the joint right matters more than most people budget for: a clamp that relaxes under heat cycling turns into a boost leak you will chase for weeks.

**`pie-cuts-mandrel-bends` — Pie Cuts, Mandrel Bends & Tube**
> 304 stainless pie cuts, mandrel bends, 6061 weld-on caps and UJ bends. Raw material for manifold and charge piping work, cut to weld.

### Brands

**`synchro-solutionz` — Synchro Solutionz**
> Synchro Solutionz is the in-house transmission internals line — synchros, hubs, sliders, collars, springs and complete rebuild kits for Honda B, H and K series, 5-speed and 6-speed, FWD and AWD. The full range is also reachable through SYP Billet → Drivetrain → Transmission Internals.

**`comp-1-clutch` — Comp 1 Clutch**
> Comp 1 Clutch is the in-house clutch line: twin and triple disc assemblies. Disc count and material are chosen against torque and how the car is used, so read the application notes before ordering.

**`clearance` — Clearance**
> Genuine clearance: discontinued parts, superseded revisions and one-off overstock. When it is gone it is gone, and nothing on this page is here permanently.

---

## 5. SALE SPECIAL — the decision

Phase 0 flagged this and Phase 2 is where it gets resolved.

**Today:** a collection called SALE SPECIAL holds **118 of 198 products** — 60% of the catalog — and it is surfaced in the main navigation as "Coupon Limited Items."

**Why it matters:** a store where six products in ten live in a permanent sale collection reads as a discounter, which is precisely what the plan says the site must never look like. It does that without a single struck-through price, so it does not show up in the compare-at audit — there are only 13 of those, and 8 of them are in-house SKUs where the discount should simply be removed.

**Recommendation, and what I have built for:** keep a `clearance` collection, curate it by hand to genuinely discontinued and superseded stock, and leave it out of the primary nav — footer and on-page links only. Do **not** migrate the 118.

**This one is Spencer's call and it is not blocking.** The build works either way; the collection exists and is empty until someone decides what goes in it. What I will not do is auto-populate it with 118 products, because that reproduces the exact problem the redesign exists to fix.

The eight in-house compare-at prices are a separate, ten-minute fix and land in Phase 7 with the rest of the product-data corrections.

---

## 6. Redirects

**45 old collection URLs change. Every one gets a 301.** Twelve handles are preserved and need nothing.

The plan says "audit which URLs have inbound links first." Honest limitation: I have no backlink data for this domain — that needs Search Console or Ahrefs access, neither of which I have. So the map below redirects **all 45** rather than only the ones known to be linked. Redirecting a URL nobody links to costs nothing; missing one that is linked costs a 404 and whatever ranking it held.

| Old handle | Products | → New handle |
|---|---|---|
| `sale-special` | 118 | `clearance` — see §5, and the 118 do **not** carry over |
| `syperformance` | 73 | `syp-billet` |
| `transmission-rebuild-kits` | 43 | `transmission-internals` |
| `featured` | 29 | `syp-billet` |
| `transmission-drivetrain` | 26 | `billet-drivetrain` |
| `b58-3-0l-supra-bmw` | 20 | `bmw-toyota-b58` |
| `fabrication-parts` | 20 | `universal-fabrication` |
| `turbo-accessories` | 15 | `forced-induction` |
| `honda-turbo-manifolds` | 14 | `turbo-manifolds` |
| `evo-turbo` | 13 | `mitsubishi-evo-7-8-9` |
| `engine-bay` | 12 | `engine` |
| `evo-turbo-manifolds` | 10 | `turbo-manifolds` |
| `intercoolers` | 10 | `cooling` |
| `titanium-hardware` | 8 | `clamps-v-band-flanges` |
| `turbo-kits` | 7 | `forced-induction` |
| `wiring-ecu` | 7 | `engine-management` |
| `cooling-fab-6061` | 6 | `syp-cooling` |
| `evo-fueling` | 6 | `fueling` |
| `evo-hot-parts` | 6 | `exhaust-hot-parts` |
| `evo-stock-frame-turbo-components` | 6 | `mitsubishi-evo-7-8-9` |
| `flanges` | 6 | `clamps-v-band-flanges` |
| `translab` | 6 | `transmission-internals` |
| `turbos` | 6 | `forced-induction` |
| `boost-controller` | 5 | `forced-induction` |
| `evo-intercoolers` | 5 | `cooling` |
| `evo-turbo-kits` | 5 | `forced-induction` |
| `honda-intercoolers` | 5 | `cooling` |
| `axles` | 4 | `billet-drivetrain` |
| `clutches` | 4 | `clutch-flywheel` |
| `evo-clutch` | 4 | `clutch-flywheel` |
| `halfshafts` | 4 | `billet-drivetrain` |
| `header-exhaust` | 4 | `exhaust-hot-parts` |
| `wastegate-blow-off-valves` | 4 | `forced-induction` |
| `evo-cooling` | 3 | `cooling` |
| `clamps` | 2 | `clamps-v-band-flanges` |
| `gearsets` | 2 | `lsd` |
| `mandrel-bends` | 2 | `pie-cuts-mandrel-bends` |
| `shift-selector` | 2 | `billet-drivetrain` |
| `billet-case` | 1 | `billet-drivetrain` |
| `pie-cuts` | 1 | `pie-cuts-mandrel-bends` |
| `scatter-sheild` | 1 | `clutch-flywheel` |
| `shifters-cables` | 1 | `billet-drivetrain` |
| `tires` | 1 | `suspension` |
| `traction-bars` | 1 | `suspension` |
| `frontpage` | 97 | `/collections/all` — Shopify reserves this handle |

**Preserved, no redirect needed:** `honda`, `mitsubishi-evo-parts`, `cooling`, `engine`, `forced-induction`, `fueling`, `intake`, `lsd`, `suspension`, `exterior`, `synchro-solutionz`, `comp-1-clutch`.

**One nav link dies rather than redirects.** `/collections/shift-selector/Selector-rod+shift-selector` is a tag-filtered URL, and `robots.txt` carries `Disallow: /collections/*+*` — Google was never allowed to crawl it. The base handle redirects; the filtered variant is simply removed from the menu.

### Canonical tags

Products now sit in up to five collections each, so Shopify will generate `/collections/{handle}/products/{product}` variants of every product URL. Horizon canonicalizes those to `/products/{handle}`. This is verified as part of Phase 7 rather than assumed, and it is on that phase's checklist.

---

## 7. What I need to build this

Everything above is designed and scripted. Creating it needs write access to the dev store, which this machine does not have — the Shopify CLI token covers themes only.

**Spencer: create a custom app on the dev store and paste me the token.** Two minutes, and it also unlocks Phase 3 (metafield definitions and bulk metafield writes across 198 products), Phase 6 (metaobjects for the build gallery) and Phase 7 (the vendor/title corrections and this redirect map). Without it, all four phases become manual clicking.

1. Go to **https://admin.shopify.com/store/syperformance-build/settings/apps/development**
2. **Create an app** → name it `SYP Build Automation` → Create
3. **Configure Admin API scopes** and tick exactly these:
   - `read_products`, `write_products`
   - `read_online_store_navigation`, `write_online_store_navigation`
   - `read_content`, `write_content`
   - `read_metaobjects`, `write_metaobjects`
   - `read_metaobject_definitions`, `write_metaobject_definitions`
   - `read_files`, `write_files`
   - `read_publications`, `write_publications`
4. **Save** → **Install app** → **Reveal token once** and copy it
5. Paste it into `.env` at the repo root as two lines:
   ```
   SHOPIFY_BUILD_STORE=syperformance-build.myshopify.com
   SHOPIFY_BUILD_ADMIN_TOKEN=shpat_...
   ```

**This is the build store, not syperformance.net.** The token only reaches the replica. SY's live store stays untouched, exactly as `environment.md` describes.

Once it is in `.env`, the build is one script: create 33 collections with the copy above, assign members, build the menu, write the 45 redirects, and report what landed.

---

## 8. Deferred out of this phase

| Item | Where it goes | Why |
|---|---|---|
| Collection images | Phase 5 | Needs real photography; placeholders would be worse than none |
| Storefront filters on collection pages | Phase 3 | Filters run on the metafields Phase 3 defines |
| Per-platform manifold sub-views (`syp-turbo-manifolds` split by platform) | Phase 3 | These are filter states, not collections — building them as collections now would create five more thin pages that Phase 3 immediately obsoletes |
| Meta titles and descriptions per collection | Phase 7 | Intro copy is written; the meta fields are part of the SEO pass |
| Backlink audit before redirecting | blocked | Needs Search Console or Ahrefs access — see §6 |
| Clearance membership | Spencer | See §5 |

---

**Phase 2 designed. Blocked on the token in §7 to build it.**
