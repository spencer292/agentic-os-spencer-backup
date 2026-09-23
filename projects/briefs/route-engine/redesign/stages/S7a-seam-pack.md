# S7a — The Seam Decision Pack

Decision pack for the ownership-register sitting. Five seams, each costed both ways, each with
its no-decision default stated. Built from `master-asbuilt.json`, `territory-asbuilt.json`,
`jobber/jobs.json`, `gps-ground-truth.json` and `route-day-ledger.json`; `territories.json` v9 is
read once, only to state what the file says.

Outputs: `redesign/data/seam-pack.json`, `redesign/seam-pack.html` (one map per seam, printable,
12 pages). Script: `redesign/scripts/build-seam-pack.mjs`.

Hours are weekly-equivalent visits x that tech's own GPS cycle minutes per stop for that weekday.
The board today: Alias 49.6, Luke 42.1, Robert 39.2, Tavis 38.6, Cory 31.5 — spread **18.1 h**.
Each option holds the rest of the board still, so two options cannot be added together.

## The five recommendations

| Seam | Customers | Recommended | Hours effect | The other option |
|---|---:|---|---|---|
| **S1** Buckley / Bonney Lake / Lake Tapps / Sumner | 93 | **Ratify Robert Norton** | 6 move, Robert +1.0, Cory −0.7, spread 18.8 | Enforce Cory: 87 move, Cory +13.1 → 44.6, Robert −18.1 → 21.1, spread **28.5** |
| **S2** Kent North / Maple Valley (north of SR-516) | 88 | **Ratify Cory Ventura** | 11 move, Cory +1.3, Robert −1.0, spread 16.8 | Enforce Robert: 83 move, Robert +16.1 → **55.3**, Cory −10.3 → 21.2, spread 34.1 |
| **S3** 98059 Renton and 98092 Auburn | 38 + 28 | **No recommendation from the field** | — | Drive breaks both: Tavis for Renton, Robert for Auburn |
| **S4** The 51 islands | 51 | **Leave them, record each one** | 0 move, spread unchanged at 18.1 | Hand to neighbour majority: 51 move, 10.6 h, spread **worsens to 22.3** |
| **S5** Snoqualmie Valley | 39 | **Ratify Tavis Alexander, Friday** | 11 move, Tavis +1.2 → 39.8, Alias −1.5 → 48.1, spread 16.6 | Enforce Alias/Thursday: 28 move, Alias +7.4 → **57.0**, spread 25.5 |

## S1 and S2 are one decision, not two

v9 cut the board partly on doorsteps: **Cory lives in Buckley 98321, Robert lives in Maple Valley
98038**, and each was given his own block. The field swapped them, so each man now drives past the
other's ground to reach his own. Costed together:

| | Customers moved | Alias | Cory | Luke | Robert | Tavis | Spread |
|---|---:|---:|---:|---:|---:|---:|---:|
| Leave both as they run | 0 | 49.6 | 31.5 | 42.1 | 39.2 | 38.6 | 18.1 |
| Ratify both | 17 | 49.6 | 32.1 | 42.1 | 39.2 | 37.8 | 17.5 |
| Enforce both (swap back) | 170 | 49.6 | 34.3 | 42.1 | 37.1 | 37.8 | **15.3** |

Swapping back is the best balance on paper and the shortest commutes — Cory drives a median 8.8 km
to S1 against Robert's 21.8, Robert 7.0 km to S2 against Cory's 31.1, and commute is unpaid on this
board. It still loses: it moves **170 customers against 17**, and it hands Buckley's clean Friday
53 / Wednesday 38 rhythm to the tech whose own book is 4% day-stable. The 2.2 h of balance is also
optimistic, because Buckley is costed at Cory's dense-ground 14.9 min/stop rather than Robert's
20.2. Ratify now; revisit the swap if and when Cory's book gets a day grid.

## Where the data cannot recommend

**S3, both zips.** 98059 Renton is Cory 19 / Tavis 19 and 98092 Auburn is Cory 14 / Robert 14.
There is no majority to read, so the field cannot choose and no amount of further analysis of it
will. Drive can: Tavis is a median 19.2 km closer to Renton from home, Robert 10.1 km closer to
Auburn, and the pattern distances are 6.3 against 6.4 km and 7.8 against 10.9 km. One thing the tie
hides — **Tavis Alexander lives in 98092 Auburn and holds none of its 28 customers.** He is not on
the ballot the field drew, and he should be. That is an owner decision, not a data one.

**S4 is a recording decision, not a routing one.** Moving all 51 islands buys tidier lines and a
*worse* spread. Several are known deliberate exceptions. The value is the register entry.

## Cautions

- Cycle time blends drive with on-site time, so dense ground flatters a tech and spread ground
  penalises one. Cory is flattered, Luke and Alias are penalised. Every "after" figure inherits this.
- The seams overlap: 8 customers are in both S2 and S4, 6 in both S3 and S4. Deciding one changes
  what the next is asking about.
- Cory Ventura is salaried, so paid hours cannot check the model for him the way they can for the
  other four.
