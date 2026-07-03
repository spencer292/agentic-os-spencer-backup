# Policy & Compliance Framework

The most reusable, hardest-won part of this skill. For **ambiguous-term** and **regulated** verticals,
the negative-keyword list and the messaging posture matter more than the ads themselves. Skipping this
burns budget on the wrong intent and risks disapprovals.

## 1. Ambiguous-term negative strategy

Many service terms are **homographs** — the same words mean different things to different searchers. The
canonical example: **"mole removal"** means *animal/pest control* to your customer but *dermatology /
cosmetic skin-mole removal* to a huge competing search population.

Process for any ambiguous head term:
1. Identify the colliding meanings (animal vs skin; "duct cleaning" HVAC vs air-duct vs medical; etc.).
2. Build a **negative cluster** for each unwanted meaning. For the skin/cosmetic collision that's
   ~100–120 negatives: `skin`, `dermatolog*`, `cosmetic`, `face`, `body mole`, `beauty`, `removal cream`,
   `how to remove a mole`, `mole on skin`, etc.
3. These negatives are **mandatory before any PHRASE/broad match goes live** — EXACT city+service
   converts; loose head terms bleed without them.
4. Maintain the cluster as a shared **negative keyword list** applied across campaigns, version it in JSON.

Also add **competitor** and **out-of-area** negatives (competitor brand names, neighbouring-but-unserved
city names) — these match through loose keywords and never convert.

## 2. Messaging "Posture" for regulated/sensitive verticals

Some verticals have method/claim sensitivities (animal welfare, health claims, financial promises). Define
a **Posture** = an explicit banned-words list + allowed framing, and audit every RSA/keyword against it
before publish.

Worked example — **Posture A: "silent mechanism"** (humane animal control):
- **Banned in all copy:** `body-grip(ping)`, `scissor`, `harpoon`, `spear`, `spike`, `kill`, `lethal`,
  `dispatch`, `exterminate`, `euthani*`, `poison`, `strychnine`, `warfarin`, `crush`, `snap trap`.
- **Allowed:** generic "trapping", "professional methods", "safe for pets and children", "chemical-free".
- Implement as a regex audit (`BANNED_RX`) run over campaign/ad-group/RSA/keyword text; flag `⚠ MECHANISM`.
- Run a parallel `⚠ MEDICAL` flag for the ambiguous-term collision above.

Adapt the banned list per vertical — the *pattern* (explicit posture + automated audit) is what transfers.

## 3. Local Services Ads (LSA) interaction

If the account also runs LSA, watch for category/policy purges (e.g. wildlife categories getting
eligible-limited). Keep LSA and Search messaging consistent with the same Posture.

## 4. Mechanical policy traps

- **No phone numbers in RSA text** → `PHONE_NUMBER_IN_AD_TEXT` 400 error. Phone goes on the **call asset**
  only, never in headlines/descriptions.
- Watch claim discipline — only make guarantees the client can substantiate, and only on the offer that
  actually carries them (e.g. permanence claims gated to a recurring-plan upsell, not the one-time service).

## 5. The audit, operationally

`gaql()` to pull all campaign/ad-group/RSA/keyword text, run `BANNED_RX` + `MEDICAL_RX` over each, and
print flagged items. This is the pre-publish gate and a good recurring (daily/weekly) review job.
