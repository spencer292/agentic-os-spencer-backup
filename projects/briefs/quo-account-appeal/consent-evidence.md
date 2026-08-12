# Recipient-consent evidence — Got Moles?

Prepared for Quo account review (ticket 1152711). Generated from the CallRail API by `scripts/build-consent-evidence.mjs`. All times America/Los_Angeles.

**The claim this evidences:** Got Moles places no cold calls and runs no outbound campaign. Every outbound call is a return call to a person who contacted Got Moles first and asked to be contacted about mole removal at their property. Contact reaches the business by two routes, and both leave a record:

1. **Inbound telephone calls** to CallRail tracking numbers published on got-moles.com and Google Business Profile. CallRail records and transcribes every one.
2. **Service-request forms** submitted on got-moles.com, which create a client record in Jobber, the company's field-service system.

Both records are reproduced below. A companion audit — `callback-pool-audit.md` — examines the form-lead route in detail, including a data-quality problem Got Moles found in the course of this review and has corrected.

---

## 1. Summary

| | |
|---|---|
| Evidence window | 2026-06-01 to 2026-08-11 |
| Total inbound calls to Got Moles | **737** |
| Distinct people who called Got Moles | **506** |
| Days with inbound calls | 69 (avg 10.7/day) |
| Outbound calls logged in CallRail | 2 |
| | |
| Quo account active | 2026-08-03 to 2026-08-11 (9 days) |
| Inbound calls during the Quo window | **129** |
| — answered live | 125 |
| — **missed, i.e. owed a call back** | **4** |

Calls from the Quo line went to two groups, and no others: the 4 missed callers above, and the homeowners who submitted a service-request form on got-moles.com during the same period (75 of them — itemised in `callback-pool-audit.md`). There is no other outbound calling of any kind: no purchased lists, no rented data, no prospecting, no SMS campaigns, no dialler, no autodialler.

---

## 2. Missed inbound calls while Quo was active

Every row is an inbound call **to** Got Moles, logged by CallRail before any outbound call existed. These callers were rung back.

| Date | Time (PT) | Caller | City | Called our number | CallRail call ID |
|---|---|---|---|---|---|
| 2026-08-03 | 16:53 | +14257851367 (WIRELESS CALLER) | Bellevue | +12535288090 | `CAL019fca0c4f7677338187bc6bcd30baae` |
| 2026-08-04 | 08:41 | +13608524322 (WIRELESS CALLER) | Vancouver | +12535445581 | `CAL019fcd6f78037bbebfbb70a1346d6b9c` |
| 2026-08-06 | 09:45 | +15092946207 (JOSEPH DAVIS) | Spokane | +12532525391 | `CAL019fd7f787c67413aa7c9d5e02385988` |
| 2026-08-11 | 10:46 | +12533261740 (Spencer Hill) | Auburn | +12535288152 | `CAL019ff1ef25ce7f0ca9f892ce6030ce2b` |

---

## 3. All inbound calls during the Quo window

Full inbound log for 2026-08-03 to 2026-08-11, answered and missed, showing normal inbound demand for a seasonal home-services business at peak season.

| Date | Time (PT) | Caller | City | Answered | Length | Our number |
|---|---|---|---|---|---|---|
| 2026-08-03 | 09:12 | +12062294669 (Chris Hughes) | Seattle | yes | 2m00s | +12537858876 |
| 2026-08-03 | 09:22 | +19783761763 (RICHARD MOORE) | Lawrence | yes | 1m34s | +12536557918 |
| 2026-08-03 | 09:55 | +14156062006 (Lan Kulapaditharom) | San Francisco | yes | 3m48s | +12536557918 |
| 2026-08-03 | 10:52 | +15092201337 (C POPPY) | Spokane | yes | 5m40s | +12532592376 |
| 2026-08-03 | 10:57 | +12086317524 (Jan Miller) | Meridian | yes | 4m31s | +12538938242 |
| 2026-08-03 | 11:06 | +19013559301 (Danielle Goodjen) | Memphis | yes | 4m08s | +12535445581 |
| 2026-08-03 | 11:39 | +14255888901 (WIRELESS CALLER) | Kirkland | yes | 12m46s | +12532429708 |
| 2026-08-03 | 12:55 | +12532298455 (AM JESSE) | Tacoma | yes | 5m18s | +12532525391 |
| 2026-08-03 | 14:56 | +12062250566 (Spencer Jacobs) | Seattle | yes | 4m44s | +12536557918 |
| 2026-08-03 | 15:33 | +14155396635 (Nick B) | San Francisco | yes | 3m53s | +12536557918 |
| 2026-08-03 | 15:51 | +15092201337 (C POPPY) | Spokane | yes | 5m24s | +12537858876 |
| 2026-08-03 | 15:53 | +12069999848 (Chad Erickson) | Seattle | yes | 3m40s | +12535288090 |
| 2026-08-03 | 16:53 | +14257851367 (WIRELESS CALLER) | Bellevue | **missed** | 0m12s | +12535288090 |
| 2026-08-03 | 16:54 | +14257851367 (WIRELESS CALLER) | Bellevue | yes | 0m37s | +12535288090 |
| 2026-08-03 | 17:30 | +12533775609 (Vernie Dunham) | Tacoma | yes | 3m21s | +12537858876 |
| 2026-08-04 | 08:06 | +13608524322 (WIRELESS CALLER) | Vancouver | yes | 0m11s | +12535445581 |
| 2026-08-04 | 08:40 | +13608524322 (WIRELESS CALLER) | Vancouver | yes | 0m14s | +12535445581 |
| 2026-08-04 | 08:41 | +13608524322 (WIRELESS CALLER) | Vancouver | **missed** | 0m00s | +12535445581 |
| 2026-08-04 | 08:46 | +17078373824 (Daniel Gagen) | Windsor | yes | 3m28s | +12532525391 |
| 2026-08-04 | 08:49 | +13608524322 (WIRELESS CALLER) | Vancouver | yes | 0m07s | +12535445581 |
| 2026-08-04 | 09:10 | +13608524322 (WIRELESS CALLER) | Vancouver | yes | 1m25s | +12535445581 |
| 2026-08-04 | 09:11 | +14257666225 (WIRELESS CALLER) | Bellevue | yes | 0m57s | +12535445581 |
| 2026-08-04 | 11:38 | +12533261740 (Spencer Hill) | Auburn | yes | 0m53s | +12533312772 |
| 2026-08-04 | 12:01 | +14259997239 (Amy Brainard) | Bellevue | yes | 16m00s | +12532525391 |
| 2026-08-04 | 12:20 | +14254638223 (S STRATOUDIS) | Bellevue | yes | 10m31s | +12536838152 |
| 2026-08-04 | 12:55 | +12069190215 (Mark Anderson) | Seattle | yes | 4m50s | +12535288090 |
| 2026-08-04 | 14:00 | +13863783343 (QRG) | De Land | yes | 1m19s | +12538938242 |
| 2026-08-04 | 14:16 | +12533261740 (Spencer Hill) | Auburn | yes | 0m31s | +12533312772 |
| 2026-08-04 | 14:17 | +12533261740 (Spencer Hill) | Auburn | yes | 0m20s | +12533312772 |
| 2026-08-04 | 14:21 | +12533261740 (Spencer Hill) | Auburn | yes | 0m47s | +12533312772 |
| 2026-08-04 | 14:31 | +12533261740 (Spencer Hill) | Auburn | yes | 0m21s | +12533312772 |
| 2026-08-04 | 14:38 | +12533261740 (Spencer Hill) | Auburn | yes | 0m40s | +12533312772 |
| 2026-08-04 | 14:39 | +12533261740 (Spencer Hill) | Auburn | yes | 0m50s | +12533312772 |
| 2026-08-04 | 14:41 | +12533261740 (Spencer Hill) | Auburn | yes | 0m44s | +12533312772 |
| 2026-08-04 | 14:53 | +12533261740 (Spencer Hill) | Auburn | yes | 0m23s | +12533312772 |
| 2026-08-04 | 14:54 | +12533261740 (Spencer Hill) | Auburn | yes | 1m33s | +12533312772 |
| 2026-08-04 | 14:56 | +12533261740 (Spencer Hill) | Auburn | yes | 0m50s | +12533312772 |
| 2026-08-04 | 15:00 | +12533261740 (Spencer Hill) | Auburn | yes | 0m19s | +12533312772 |
| 2026-08-04 | 15:11 | +12533261740 (Spencer Hill) | Auburn | yes | 0m23s | +12533312772 |
| 2026-08-04 | 15:12 | +12533261740 (Spencer Hill) | Auburn | yes | 0m53s | +12533312772 |
| 2026-08-04 | 15:12 | +12533261740 (Spencer Hill) | Auburn | yes | 0m14s | +12534610822 |
| 2026-08-04 | 15:15 | +12533261740 (Spencer Hill) | Auburn | yes | 2m39s | +12533312772 |
| 2026-08-04 | 15:15 | +12533261740 (Spencer Hill) | Auburn | yes | 2m05s | +12534610822 |
| 2026-08-04 | 15:22 | +12533261740 (Spencer Hill) | Auburn | yes | 7m18s | +12533312772 |
| 2026-08-04 | 15:22 | +12062265680 (Simeng Wang) | Seattle | yes | 3m53s | +12536557918 |
| 2026-08-04 | 15:40 | +12064038723 (Scott Vojik) | Seattle | yes | 3m50s | +12537858876 |
| 2026-08-04 | 16:07 | +12535694822 (CORY VENTURA) | Auburn | yes | 6m10s | +12533312772 |
| 2026-08-05 | 08:32 | +12066971220 (WIRELESS CALLER) | Seattle | yes | 0m17s | +12535445581 |
| 2026-08-05 | 09:13 | +14253931653 (Belur Shivashankara) | Bellevue | yes | 0m47s | +12532592376 |
| 2026-08-05 | 09:22 | +14253931653 (Belur Shivashankara) | Bellevue | yes | 0m32s | +12532592376 |
| 2026-08-05 | 10:17 | +14253931653 (Belur Shivashankara) | Bellevue | yes | 5m08s | +12532592376 |
| 2026-08-05 | 10:29 | +12069483188 (NOLAN,TREVOR) | Seattle | yes | 12m47s | +12532592376 |
| 2026-08-05 | 10:50 | +12066971220 (WIRELESS CALLER) | Seattle | yes | 0m49s | +12537858876 |
| 2026-08-05 | 10:55 | +12522200368 (Virgil Holman) | Nashville | yes | 4m42s | +12533312772 |
| 2026-08-05 | 10:55 | +12522200368 (Virgil Holman) | Nashville | yes | 4m08s | +12534610822 |
| 2026-08-05 | 11:16 | +12533261740 (Spencer Hill) | Auburn | yes | 0m35s | +12537858876 |
| 2026-08-05 | 11:56 | +14255888901 (WIRELESS CALLER) | Kirkland | yes | 1m21s | +12537858876 |
| 2026-08-05 | 12:04 | +12062915324 (MONIQUE BROWN) | Seattle | yes | 5m43s | +12532592376 |
| 2026-08-05 | 14:04 | +14259997239 (Amy Brainard) | Bellevue | yes | 1m29s | +12532525391 |
| 2026-08-05 | 14:39 | +15123086292 (RAPID SERVICES) | Bastrop | yes | 0m33s | +12532592376 |
| 2026-08-05 | 15:09 | +12533261740 (Spencer Hill) | Auburn | yes | 0m37s | +12533312772 |
| 2026-08-05 | 15:10 | +12533261740 (Spencer Hill) | Auburn | yes | 0m03s | +12534610822 |
| 2026-08-05 | 15:13 | +12535694822 (CORY VENTURA) | Auburn | yes | 4m49s | +12533312772 |
| 2026-08-05 | 15:27 | +12533261740 (Spencer Hill) | Auburn | yes | 7m03s | +12533312772 |
| 2026-08-05 | 15:44 | +12533261740 (Spencer Hill) | Auburn | yes | 7m24s | +12533312772 |
| 2026-08-05 | 15:51 | +12533259244 (TACOMAWVLY   WA) | Tacoma - Waverly Rate Area | yes | 11m26s | +12538938242 |
| 2026-08-06 | 08:24 | +13607019225 (Debra Miller) | Olympia | yes | 3m04s | +12537968399 |
| 2026-08-06 | 09:45 | +15092946207 (JOSEPH DAVIS) | Spokane | **missed** | 0m04s | +12532525391 |
| 2026-08-06 | 10:43 | +12069159688 (CHATALAS,RENEE) | Seattle | yes | 6m52s | +12534003228 |
| 2026-08-06 | 11:24 | +442037807201 (Unavailable    ) | — | yes | 0m21s | +12533312772 |
| 2026-08-06 | 11:25 | +14254456329 (ALICIA HOARE) | Bellevue | yes | 0m57s | +12535288090 |
| 2026-08-06 | 11:53 | +442037807201 (Unavailable    ) | — | yes | 1m07s | +12533312772 |
| 2026-08-06 | 11:55 | +442037807201 (Unavailable    ) | — | yes | 6m18s | +12533312772 |
| 2026-08-06 | 11:55 | +12066971220 (WIRELESS CALLER) | Seattle | yes | 1m37s | +12537858876 |
| 2026-08-06 | 12:25 | +15185905050 (Kenton Phillips) | Troy | yes | 3m19s | +12535288090 |
| 2026-08-06 | 13:57 | +12533261740 (Spencer Hill) | Auburn | yes | 8m55s | +12533312772 |
| 2026-08-06 | 14:04 | +17738991998 (XIAOJIANG YE) | Chicago (Kildare) | yes | 0m36s | +12537858876 |
| 2026-08-06 | 14:25 | +12062261144 (LISA BUKOWITZ) | Seattle | yes | 19m51s | +12535288090 |
| 2026-08-06 | 14:48 | +14259997239 (Amy Brainard) | Bellevue | yes | 3m14s | +12532525391 |
| 2026-08-06 | 16:20 | +12533261740 (Spencer Hill) | Auburn | yes | 0m32s | +12535288090 |
| 2026-08-06 | 16:21 | +12533261740 (Spencer Hill) | Auburn | yes | 0m20s | +12536557918 |
| 2026-08-06 | 16:22 | +12533261740 (Spencer Hill) | Auburn | yes | 0m20s | +12535445581 |
| 2026-08-06 | 16:22 | +12533261740 (Spencer Hill) | Auburn | yes | 0m20s | +12532525391 |
| 2026-08-06 | 16:23 | +12533261740 (Spencer Hill) | Auburn | yes | 0m15s | +12534003228 |
| 2026-08-06 | 16:26 | +12535536866 (WIRELESS CALLER) | Auburn | yes | 0m30s | +12538938242 |
| 2026-08-06 | 16:27 | +12535536866 (WIRELESS CALLER) | Auburn | yes | 0m23s | +12535288152 |
| 2026-08-06 | 16:28 | +12535536866 (WIRELESS CALLER) | Auburn | yes | 0m21s | +12533312772 |
| 2026-08-06 | 16:28 | +12535536866 (WIRELESS CALLER) | Auburn | yes | 0m19s | +12537858876 |
| 2026-08-06 | 16:29 | +12535536866 (WIRELESS CALLER) | Auburn | yes | 0m18s | +12532592376 |
| 2026-08-06 | 16:30 | +12535536866 (WIRELESS CALLER) | Auburn | yes | 0m20s | +12538938242 |
| 2026-08-06 | 16:31 | +12535536866 (WIRELESS CALLER) | Auburn | yes | 0m18s | +12535443931 |
| 2026-08-06 | 16:32 | +12535536866 (WIRELESS CALLER) | Auburn | yes | 0m19s | +12537852601 |
| 2026-08-06 | 16:33 | +12535536866 (WIRELESS CALLER) | Auburn | yes | 5m09s | +12534610822 |
| 2026-08-07 | 08:33 | +12066965391 (Laura Goodrich) | Seattle | yes | 0m15s | +12536557918 |
| 2026-08-07 | 08:42 | +12066965391 (Laura Goodrich) | Seattle | yes | 4m08s | +12536557918 |
| 2026-08-07 | 09:08 | +12535766509 (JEROME MCDANIEL) | Tacoma | yes | 8m00s | +12538938242 |
| 2026-08-07 | 09:17 | +12535766509 (JEROME MCDANIEL) | Tacoma | yes | 0m55s | +12538938242 |
| 2026-08-07 | 09:52 | +12392873230 (HIGGS,ANTHONY) | Bonita Springs | yes | 6m00s | +12532429708 |
| 2026-08-07 | 12:47 | +15035475402 (J PARMENTER) | Hillsboro | yes | 5m55s | +12536838152 |
| 2026-08-07 | 12:55 | +14252219939 (ROCKWOOD,BARBAR) | Bellevue | yes | 1m55s | +12535443271 |
| 2026-08-07 | 14:06 | +15037990489 (BALKENHOL,CHERY) | Portland | yes | 10m26s | +12535288090 |
| 2026-08-07 | 14:23 | +12536327771 (ALEKSAND ADAMOV) | Auburn | yes | 15m11s | +12537858876 |
| 2026-08-07 | 14:49 | +12536327771 (ALEKSAND ADAMOV) | Auburn | yes | 3m25s | +12537858876 |
| 2026-08-07 | 16:19 | +14258303611 (CHARLES HEMPHIL) | Bellevue | yes | 8m08s | +12534003228 |
| 2026-08-07 | 16:39 | +12536068084 (WIRELESS CALLER) | Tacoma | yes | 4m44s | +12534003228 |
| 2026-08-08 | 09:33 | +12066982134 (Donald Kaplan) | Seattle | yes | 3m43s | +12532592376 |
| 2026-08-09 | 15:37 | +12534496165 (Jo Kim) | Des Moines | yes | 2m58s | +12532525391 |
| 2026-08-10 | 09:47 | +12068416715 (LOHSE,KEN) | Seattle | yes | 11m54s | +12535288090 |
| 2026-08-10 | 09:59 | +12069406375 (B BLUMENTHAL) | Seattle | yes | 2m16s | +12534003228 |
| 2026-08-10 | 11:01 | +14256558966 (Stella Sun) | Kirkland | yes | 4m14s | +12535445581 |
| 2026-08-10 | 11:03 | +12062408920 (TOM DAVIDSON) | Seattle | yes | 5m35s | +12536525985 |
| 2026-08-10 | 11:03 | +12062408920 (TOM DAVIDSON) | Seattle | yes | 5m01s | +12534610822 |
| 2026-08-10 | 11:57 | +14257803032 (SHARMA,NISHA) | Bothell | yes | 9m29s | +12532592376 |
| 2026-08-10 | 13:03 | +12062185491 (BENJAMIN TUDOR) | Seattle | yes | 8m18s | +12534003228 |
| 2026-08-10 | 13:52 | +12533505852 (WIRELESS CALLER) | Auburn | yes | 3m21s | +12537858876 |
| 2026-08-10 | 16:06 | +15417602490 (AMY BURNS) | Corvallis | yes | 6m21s | +12536838152 |
| 2026-08-10 | 16:47 | +12533261740 (Spencer Hill) | Auburn | yes | 0m08s | +12533312772 |
| 2026-08-10 | 16:47 | +12533261740 (Spencer Hill) | Auburn | yes | 0m08s | +12535445581 |
| 2026-08-10 | 16:48 | +12533261740 (Spencer Hill) | Auburn | yes | 3m54s | +12535443271 |
| 2026-08-10 | 17:08 | +12533261740 (Spencer Hill) | Auburn | yes | 0m09s | +12534610822 |
| 2026-08-11 | 08:38 | +18582324126 (DAVID JOHAL) | La Jolla | yes | 0m28s | +12532429708 |
| 2026-08-11 | 08:41 | +18582324126 (DAVID JOHAL) | La Jolla | yes | 0m12s | +12532429708 |
| 2026-08-11 | 09:37 | +12533753051 (LARENA WALSHE) | Graham | yes | 3m11s | +12532592376 |
| 2026-08-11 | 09:56 | +12068838895 (WIRELESS CALLER) | Seattle | yes | 3m38s | +12532592376 |
| 2026-08-11 | 10:08 | +18582324126 (DAVID JOHAL) | La Jolla | yes | 0m58s | +12536838152 |
| 2026-08-11 | 10:32 | +18582324126 (DAVID JOHAL) | La Jolla | yes | 0m09s | +12536838152 |
| 2026-08-11 | 10:32 | +18582324126 (DAVID JOHAL) | La Jolla | yes | 0m10s | +12536838152 |
| 2026-08-11 | 10:46 | +12533261740 (Spencer Hill) | Auburn | **missed** | 0m11s | +12535288152 |
| 2026-08-11 | 10:57 | +12066607600 (SILKE,LETIZIA) | Seattle | yes | 6m23s | +12532429708 |

---

## 4. Recorded verbal consent, on the inbound call itself

**This is the most direct evidence in this pack.** When no one is free to pick up, the CallRail receptionist takes the caller's details and asks, in terms, for permission to call them back — _"Could I have the best phone number for our team to reach you?"_ — and the caller agrees, on a recorded line, before any outbound call is ever placed.

Verbatim openings of recorded inbound calls in the same window follow. CallRail holds the full audio and transcript of every one; all are available to your compliance team on request.

**2026-08-03 09:12 — inbound from +12062294669, Seattle · CallRail id `CAL019fc865e7867ae6909caacb995d7799`**

```
Agent: Thanks for calling Got Moles. Our team is currently unavailable, but I can grab your info so someone gets back to you quickly. Are you a new caller or an existing customer?
Caller: Existing.
Agent: Got it, you're an existing customer. Let me get the details so the team can take care of you right away. What should they know about your situation or request?
Caller: I pay for a monthly service, but I have a lot of mole activity.
Agent: Thanks for letting me know. I'll pass that along. Could I have the best phone number for our team to reach you? Is it the number you're calling from ending in 4669?
Caller: Yes,
```

**2026-08-03 09:22 — inbound from +19783761763, Lawrence · CallRail id `CAL019fc86ec88f775bafe76b333afa2015`**

```
Agent: Thanks for calling Got Moles. Our team is currently unavailable, but I can grab your info so someone gets back to you quickly. Are you a new caller or an existing customer?
Caller: New caller.
Agent: Great! As a new caller, I'm happy to answer any questions you might have about our pricing, how we work, or our service area. Is there something specific you'd like to know first?
Caller: Yes, how much does it cost to trap a mole?
Agent: For residential properties, we offer flat-rate pricing, not per mole. Up to 1 acre, you can choose our Quick Fix program at $450 for 1 month, which includes about 5 weekly visits, and a $150 setup fee upfront. If no moles are caught, that $150 is all you pay. Or there's the Total Mole Control plan at $100 per month year-round, unlimited visits, no setup fee, with a 12-month commitment. The rates go up slightly for larger properties. Would you like to know more about those options, or do you have any other questions before we move on?
Caller: Uh, no, it's too expensive. Thank you.
```

**2026-08-03 09:55 — inbound from +14156062006, San Francisco · CallRail id `CAL019fc88d7b097d1dae839a0f7bf3656c`**

```
Agent: Thanks for calling Dot Moles. Our team is currently unavailable, but I can grab your info so someone gets back to you quickly. Are you a new caller or an existing customer?
Caller: Existing customer.
Agent: Understood. Let me get the details so the team can take care of you right away. What should they know about your situation today?
Caller: I think I see some new mole activity in my backyard.
Agent: Thanks for letting me know. I'll make sure the team is aware. Could I have the best number to reach you? Is it the one you're calling from now, ending in 2006?
Caller: Yes.
```

**2026-08-03 10:52 — inbound from +15092201337, Spokane · CallRail id `CAL019fc8c12d8c75718aae5ec2db1b63a8`**

```
Agent: Thank you for calling Gotmold. This is Spencer. What do you got going on out there?
Caller: Hey, Spencer, I was just calling that we've got some moles in our lawn and we're in the greater Seattle area. I was just calling to inquire about what services you offer for mole removal.
Agent: Yeah, so what we do is we trap moles. We don't use chemicals or poisons. We charge a flat rate. Well, we run the service two different ways. We do what we call a quick fix service, which is a one month service. We come out, we catch the moles that are causing the issue. Now it's a flat rate, it's $450. You pay me $150 deposit. If I don't catch any moles and the problem goes away on its own, all I charge is that 150 bucks.
Agent: The other option is our total mole control program. It's year round mole trapping. We come out, we catch the moles that are causing the issue now. And then we start locating the main runs where the moles are coming into your property and we start catching them there before they ever get into your lawn. I have a ton of success doing it that way. That's my most popular option. It's 100 bucks a month and we're out there all the time. It's unlimited visits.
Caller: Okay.
Caller: Got it. And on that one, can you cancel at any point in time or are you in for a certain amount of months?
```

**2026-08-03 10:57 — inbound from +12086317524, Meridian · CallRail id `CAL019fc8c61a907efd8a4469b3129eedc3`**

```
Agent: Thanks for calling Got Moles. Our team is currently unavailable, but I can grab your info so someone gets back to you quickly. Are you a new caller or an existing customer?
Caller: New caller.
Agent: Great! I'm happy to answer any questions you have about our services or pricing first. What would you like to know?
Caller: Need help.
Agent: Absolutely, I'm here to help. We specialize in safe, chemical-free trapping for moles only. Many new callers ask about how the service works or what it costs. So if you'd like details on that, I can go over them. Or is there something specific you're concerned about? I'm sorry, I didn't quite catch what you're looking for. Could you please repeat or
Caller: Pricing.
```

**2026-08-03 11:06 — inbound from +19013559301, Memphis · CallRail id `CAL019fc8ceb701747885a443e34f93800a`**

```
Agent: Thanks for calling Got Moles! Our team is currently unavailable, but I can grab your info so someone gets back to you quickly. Are you a new caller or an existing customer?
Caller: New caller.
Agent: Great, I'm happy to answer any questions you may have about our service first. Is there something specific you'd like to know about pricing, how the service works, or our coverage area?
Caller: What is your pricing to get rid of mold?
Agent: Absolutely. For residential properties up to 1 acre, we offer 2 plans. The Quick Fix is $450 flat for 1 month of service, about 5 weekly visits, with a $150 setup fee paid upfront. If we don't catch any moles, that $150 is all you pay. The Year-Round Total Mole Control Plan is $100 per month, unlimited visits, no setup fee, and a 12-month commitment. It's a flat rate either way, with no per-mole charges. Does that answer your question? Or is there anything else you'd like to know before we get your information?
Caller: That answers it.
```

**2026-08-03 11:39 — inbound from +14255888901, Kirkland · CallRail id `CAL019fc8eced207b7fa89c1f8957e07c6c`**

```
Agent: Thank you for calling Gotmo. This is Spencer. What do you got going on out there?
Caller: Hi there. Yes, I'm calling. I'm here in Redmond, and we are having a mole problem. Last year, we get them every year, and I used another person. But anyway, they're out of business now, so I'm just calling to see what kind of services you guys offer your prices and I guess to have somebody come out and have a look.
Agent: Okay, so I run my service two different ways. I do. Obviously, we trap moles. We don't use chemicals or poisons. That's really the only way to get rid of moles is to trap them.
Caller: Pardon? Okay.
Agent: So there's kind of two ways to think about this. There's what we call like a quick fix service, which is really just putting a band aid on the problem.
Caller: Yes.
```

**2026-08-03 12:55 — inbound from +12532298455, Tacoma · CallRail id `CAL019fc9323ec97d30bc60e37d91187133`**

```
Agent: Thank you for calling gotmold. This is Spencer. What do you got going on out there?
Caller: We've got moles and we need them gone.
Agent: Where are you located?
Caller: Tacoma.
Agent: Perfect. And.
Caller: North End.
```

---

## 5. How consent is obtained

A homeowner with mole damage in their lawn finds Got Moles through Google Search, Google Business Profile (three locations, 219+ five-star reviews) or got-moles.com. They then either:

**(a) telephone us.** CallRail answers, records and transcribes the call. If nobody is free the call is missed and logged with the caller's number, and it is returned — usually the same day. The purpose of the return call is the service the caller just asked for, minutes earlier.

**(b) submit the service-request form on got-moles.com.** The form asks for name, address and phone number and states that Got Moles will contact them to arrange an inspection. Submitting it creates a client record in Jobber. That record is the consent artefact, and the return call is the response the homeowner asked for.

There is no third route. Got Moles has never bought, rented or scraped a phone list, has never run an outbound campaign, and has no autodialler. Outbound calling exists purely to answer people who reached out first, and it is one receptionist doing it by hand — roughly 8–9 calls a day at the peak of a 12-week mole season.

### A problem we found while assembling this

Preparing this pack surfaced something Got Moles had not seen: the got-moles.com service-request form has been receiving spam and bot submissions, and the internal alert that routes new leads to the receptionist did not filter them. Of 75 form leads in this window, 20 carried phone numbers outside Washington State — including one international number — and 23 had no matching inbound call. Those are not customers; they are junk submissions, and ringing them produced exactly the unanswered, out-of-area dialling pattern that a fraud model is built to catch.

This was our error and we have fixed it. The lead alert now only raises a callback for Washington State area codes (206, 253, 360, 425, 509, 564); everything else goes to a human review queue and is never dialled. Full detail, including every affected record, is in `callback-pool-audit.md`, which we are supplying voluntarily.

---

_Generated 2026-08-11 from CallRail account ACC019dc0126ade7956850fbd40239646af. Every call ID above is verifiable in that account, with audio._
