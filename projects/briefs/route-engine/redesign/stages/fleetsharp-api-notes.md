# FleetSharp API notes

Researched 2026-09-18, for pulling historical trip/stop/position data for 5 trucks,
2026-08-17..2026-09-17, into the route-engine redesign.

## The headline finding: FleetSharp has no API of its own — it runs on Linxup's platform

FleetSharp (fleetsharp.com) is owned by Linxup, LLC, a St. Louis GPS-tracking company founded in
2004 as Agilis Systems. FleetSharp, AwareGPS, and CommandGPS are three customer-facing brands
built on the same underlying Linxup platform.
[Source: Tracxn FleetSharp profile](https://tracxn.com/d/companies/fleetsharp/__b50ZM-htKpa1NAZ6grHDC90H_qQyctWugq8ivJ8wmbI),
[Agilis Systems is now Linxup](https://www.linxup.com/about/agilis-systems-is-now-linxup).

FleetSharp's own site links out to Linxup's API documentation and PDF for integration:
[fleetsharp.com/our-solutions-2/api-integration](https://fleetsharp.com/our-solutions-2/api-integration)
(page itself has no technical content — sales copy only) and
[info.linxup.com/Fleetsharp-Partner-Resource-Center](https://info.linxup.com/Fleetsharp-Partner-Resource-Center),
which states: "FleetSharp's API makes it simple to integrate FleetSharp's GPS data with other
software applications," and links two things:
- Pull API: `https://www.linxup.com/ibis/apidocs/#/` (this specific link 404s today — see below,
  the live docs moved to `api.linxup.com`)
- Push API PDF: `https://www.linxup.com/ibis/apidocs/LinxupPushAPI.pdf`

**Practical conclusion: obtaining a "FleetSharp API key" from the account owner is the same thing
as obtaining a Linxup API key.** The credentials, docs, and support line are Linxup's. Everything
below is documented against `api.linxup.com`, not a FleetSharp-specific domain — UNVERIFIED whether
FleetSharp's own portal (`app.fleetsharp.com`) issues its own key or redirects to Linxup's
Setup > API/Developers screen; confirm with the owner when they get the key.

## Pull API (what we want) — this is the one to use

**Base URL:** `https://api.linxup.com/pullapi` (from the spec's own `servers` entry, a relative
`/pullapi` under that host).
**Live OpenAPI spec (fetched directly, no auth needed to view the schema):**
`https://api.linxup.com/pullapi/v3/api-docs`
**Interactive docs (Swagger UI, needs JS to render — the JSON above is the same spec):**
`https://api.linxup.com/pullapi/swagger-ui/index.html`
This is confirmed as the real, current pull API by a support article:
[Linxup / Agilis – Creating API Token – SpeedGauge help center](https://speedgauge.zendesk.com/hc/en-us/articles/29625337783443-LinxUp-Agilis-Creating-API-Token)
and Linxup's own help center: [API - Linxup](https://helpcenter.linxup.com/api/api).

**2026-09-18 update — live auth test failed, root cause found.** The first `FLEETSHARP_API_KEY`
the owner supplied does not work: it turned out to be a 276-character JWT (issuer `agilis`, 5-year
expiry) rather than the short opaque key the `/jwts` exchange expects — almost certainly a portal
session token grabbed from the wrong place, not one generated via **Setup > API/Developers > "+
Create New Token."** Full diagnosis, the 7 auth variants tried, and exactly what to ask the owner
for instead: `../private/fleetsharp/auth-diagnosis-2026-09-18.md` (gitignored — has account IDs in
it, not published). No trips/stops/positions data has been pulled yet as a result.

Also checked whether this JWT belongs to an older, pre-v3 "legacy" Linxup/Agilis API instead
(the help center does mention a **"Traditional REST API"** as a category separate from V3 and the
Webhook API, with no base URL or docs link given). Tried 14 read-only Bearer-JWT `GET`s against
plausible REST paths on the two confirmed first-party Linxup hosts (`www.linxup.com` — same host
that serves the Push API PDF and the `/ibis/apidocs/` Swagger stub — and `api.linxup.com`, which
hosts the real `pullapi`). Every guess came back a plain 404 from the web server itself (not an
auth-level 401/403 like the real endpoints gave), meaning the paths don't exist there, not that
the credential is being rejected. Stopped guessing at that point rather than fuzzing further —
Linxup's own docs say the account's **API host link is account-specific and only shown in the
portal**, so no amount of public guessing was ever going to find it. Full list of paths tried is
in the same diagnosis file.

**2026-09-18, later — the legacy API IS real and this token DOES work on it.** Base URL:
`https://www.linxup.com/ibis/rest/api/v2` (named by a ProgrammableWeb listing, "Linxup REST API
v2," described there as bearer-authenticated JSON covering "GPS locations, stops, trips, usage,
jobs, geofence information, tracking, and alerts" —
[programmableweb.com/api/linxup-rest-api-v2](https://www.programmableweb.com/api/linxup-rest-api-v2),
page itself not independently re-readable, this is from the search snippet). Confirmed live:
`GET /geofences` with `Authorization: Bearer <the agilis JWT>` returned **`200 OK` with real Got
Moles data** — a geofence literally named `"Enumclaw-Buckley (~South~ friday)"`, matching this
account's actual territory naming. `GET /trips`, `/stops`, `/alerts` all returned `405 Method Not
Allowed` — meaning **those resources exist at that path**, a bare parameterless `GET` is just the
wrong call shape (almost certainly need `startDate`/`endDate` query params, by analogy with every
other version of this API documented in this file). `/vehicles`, `/trackers`, `/devices`,
`/positions`, `/jobs`, `/usage`, `/assets` all `404`d — wrong resource names, not proven not to
exist under some other name.

**This is now the leading candidate for the whole project** — it's confirmed reachable, confirmed
authenticated as the right account, right now, with the very credential already sitting in `.env`.
It does not need the owner to do anything further. What's blocking it is **a local Claude Code
permission wall** (the auto-mode classifier is refusing further live calls against this endpoint
as "Credential Exploration," even a single narrowly-scoped date-ranged request), not the API
itself. Full detail, and the exact next call to try (`GET /trips?startDate=2026-09-16&endDate=
2026-09-16`), is in `../private/fleetsharp/auth-diagnosis-2026-09-18.md`.

Everything in this section is quoted or paraphrased directly from the fetched
`https://api.linxup.com/pullapi/v3/api-docs` JSON, fetched today. Note: this is the **v3 / beta**
API — Linxup's help center says "V3 is currently in beta; contact Support at 877-732-4980 to
enable it" and that it needs its own API key separate from any older/legacy key. **Whoever gets
the FleetSharp/Linxup key should ask support to confirm the account is enrolled in v3**, or ask
what version they're being handed.

### Authentication

1. In the Linxup web portal: **Setup > API/Developers > "+ Create New Token."** Tokens are free;
   Linxup's own docs suggest creating one per downstream integration ("Generate as many tokens as
   you have partners to minimize your risk if one is leaked").
2. Exchange the API key for a short-lived JWT:
   `POST /api/v3/jwts`, header `x-api-key: <the api key>` → response body is the JWT (plain string).
   **"calls to generate JWTs do not count against rate limiting."**
3. **JWTs are valid for 15 minutes** — the script must re-mint one before/during any long pull, not
   once at the top of a multi-day run.
4. Use the JWT as a Bearer token: `Authorization: Bearer <jwt>` on every subsequent call.

### Endpoints relevant to this project

All of these take `startDate` (required, **epoch milliseconds**) and `endDate` (optional, epoch
ms). **`endDate` must be within 93 days of `startDate`** for `/trips`, `/stops`, and `/positions` —
our 31-day window (2026-08-17..2026-09-17) fits in a single call, no daily looping needed. Filter
by `trackerIds` / `personIds` / `fleetIds` (comma-separated). Pagination: **100 records per page**,
`page` param starting at 0, no total-count field documented — page until a call returns fewer than
100 (or an empty array).

| Endpoint | Method | Purpose | Response object |
|---|---|---|---|
| `/api/v3/trips` | GET | Trips report for the period | `TripsReport[]` |
| `/api/v3/trips/in-progress` | GET | Currently in-progress trips only | `TripsReport[]` |
| `/api/v3/stops` | GET | Stops report for the period | `StopsReport[]` |
| `/api/v3/stops/in-progress` | GET | Currently in-progress stops only | `StopsReport[]` |
| `/api/v3/positions` | GET | Raw position breadcrumbs for the period | `Position[]` |
| `/api/v3/positions/current` | GET | Last-known position per tracker | `Position[]` |
| `/api/v3/advanced-trips` | GET | Trip + segment detail, geofence/alert/visit overlays | `AdvancedTripsReport[]` |
| `/api/v3/trackers` | GET | List/search trackers (the vehicle↔device roster) | `Tracker[]` |
| `/api/v3/trackers/{trackerId}` | GET | Single tracker detail | `Tracker` |
| `/api/v3/trackers` | PUT/PATCH | Update tracker config | — (not needed here, read-only project) |

`/api/v3/advanced-trips` is the one exception to the 93-day rule: **`endDate` "Must be within 48
hours of startDate."** If we ever want its richer segment/geofence/alert overlay for the full
31-day window, the script has to loop in ≤48h windows. For the base ask — trip start/end
time+location, distance, duration, and stop arrival/dwell/lat-lng — plain `/trips` + `/stops` cover
it in one call each and don't need that looping.

### Response fields (quoted from the schema definitions in the spec)

- **TripsReport**: `tripCounter`, `mileage`, `travelMinutes`, `idleMinutes`, `stopMinutes`,
  `tracker`, `asset`, `person`, `fleet`. UNVERIFIED whether trip start/end lat-lng and timestamps
  sit directly on this object or nested inside `tracker`/`asset` — the summarizer that read the
  spec truncated before reaching the nested field list. **Before writing real parsing logic, print
  one raw `/api/v3/trips` record with `--probe` once the key exists and read the actual shape.**
- **StopsReport**: `latitude`, `longitude`, `address`, `stopDateTime`, `durationMinutes`,
  `tracker`, `asset`, `person`, `fleet`. This gives one timestamp + a duration, not separate
  arrival/departure fields — arrival = `stopDateTime`, departure = `stopDateTime + durationMinutes`.
  UNVERIFIED whether there's a distinct idle-vs-stopped flag on this object (the Push API's
  equivalent has a `stopType` of `"Engine Off"` or `"Idling"` — see below; not confirmed present
  here, check on the real payload).
- **Position**: `latitude`, `longitude`, `reportDateTime`, `tracker`, `address`. This is the
  historical breadcrumb feed. UNVERIFIED whether speed/heading/engine-state ride along — the Push
  API's `POSITION` payload (see below) has them, so the Pull API's `Position` schema likely does
  too, but the summarizer only surfaced these four fields before truncating.
- **AdvancedTripsReport**: `tripCounter`, `stopCounter`, `totalAuthorizedMiles`,
  `totalUnauthorizedMiles`, `totalAuthorizedTravelMinutes`, `totalUnauthorizedTravelMinutes`,
  `totalAuthorizedIdleMinutes`, `totalUnauthorizedIdleMinutes`, `totalStopMinutes`, `tracker`,
  `asset`, `person`, `fleet`, `trips` (nested per-trip segments).
- **Tracker**: `trackerId`, `serialNumber`, `trackerName`, `statusCode`, `fleetIds`, `personId`,
  `customData`. UNVERIFIED whether vehicle make/model/VIN live here or on a separate `Asset`
  object — the spec references an `AssetSummary` type that wasn't fully expanded in this pass.
  **This is the main unresolved question for building the vehicle↔driver map** (see "what we need
  from the owner" below).

### Rate limits

Token-bucket: **25 tokens added per minute, bucket holds max 200, starts full.** A 429 comes back
when the bucket is empty. Response headers `X-RateLimit-Limit` / `X-Rate-Limit-Remaining` report
the state. JWT-minting calls are explicitly exempted from this bucket.

## Push API (webhook, not useful for this project's backfill, documented for completeness)

Linxup also offers a **Push API** — a webhook you register a URL against, and Linxup POSTs events
to you in real time as they happen. PDF fetched directly:
`https://www.linxup.com/ibis/apidocs/LinxupPushAPI.pdf`. This is **not a query API** — there's no
way to ask it for a historical date range after the fact, so it can't backfill 2026-08-17..09-17.
Documenting it here only because it confirms the underlying data shape (useful for guessing at the
Pull API's Position/Stop fields the summarizer didn't fully expand):

- Push types: `POSITION`, `FENCE_EVENT`, `STOP`, `USAGE_HOURS`, `TRIP`, `ALERT`, device updates.
- `POSITION` payload carries: `latitude`, `longitude`, `altitude`, `speed` (mph), `heading`,
  `direction` (degrees), `odo`, `battery`, `fuelLevel`, `currentState` (`STOPPED`/`MOVING`),
  `engineOn` (bool), plus `vin`/`make`/`model`/`year` and `date`/`formattedDate`.
- `STOP` payload carries **separate** `startDateTime`/`endDateTime` (+ formatted ISO 8601
  versions), `durationMinutes`, `latitude`/`longitude`, `street`/`city`/`stateCode`/`postalCode`,
  and `stopType`: `"Engine Off"` or `"Idling"`. If the Pull API's `StopsReport` really only exposes
  `stopDateTime` + `durationMinutes` (see UNVERIFIED note above), the Push API schema is proof this
  provider's data model *does* distinguish start/end and stop-type internally — worth asking
  support whether `/api/v3/stops` exposes an `endDateTime`/`stopType` equivalent that the spec
  summary just didn't surface.
- `TRIP` payload carries **separate** `startDateTime`/`endDateTime`, `startAddress`/`endAddress`,
  `startLatitude`/`startLongitude`/`endLatitude`/`endLongitude`, `durationMinutes`,
  `distanceMiles`/`distanceMilesDetailed`, and authorized/unauthorized mile splits.
- Alert types include `IDLE_START` / `IDLE_END`, `GEOFENCE_ENTERED`/`EXITED`, `NO_SIGNAL`,
  `UNAUTHORIZED_USE`, speeding/braking/acceleration events — these map to the Pull API's `/alerts`
  surface, which exists per the spec (an `AlertsReport` type with an `"IDLE"` enum value was
  mentioned) but wasn't in this task's required endpoint list, so it isn't detailed above.

## Portal report exports (fallback if the API key is delayed or v3 isn't enabled)

Not independently verified by fetching the actual portal (no login), but the two Jobber-facing
help pages plus Linxup's own naming give a strong signal that these reports exist and are
exportable, since they're the same names as the Pull API resources:
- **Trip report** (mirrors `/api/v3/trips`)
- **Stop report** (mirrors `/api/v3/stops`)
- **Usage hours / idle report** (mirrors the Push API's `USAGE_HOURS` and the Alerts `IDLE_START`/
  `IDLE_END` pair)
[Jobber and FleetSharp GPS Tracking Integration](https://help.getjobber.com/hc/en-us/articles/360037054873-Jobber-and-FleetSharp-GPS-Tracking-Integration)
confirms the portal shows, per vehicle: location/status (driving/idle/off/syncing), speed,
direction, fuel %, battery voltage, nearest address, assigned team member, last-updated time — all
on a live map, not stated to be exportable to CSV. **UNVERIFIED: exact export button, column list,
and file format (CSV vs XLSX) for the Trip/Stop/Usage-hours reports** — this needs an actual
logged-in portal screenshot from the owner, or ask Linxup support directly. If the API key is
delayed, ask the owner to open **Reports > Trips** (or similar) in the FleetSharp/Linxup portal, set
the 2026-08-17..09-17 range, and export — that unblocks the backfill without programmatic access.

## What we need from the owner beyond the API key

1. **Confirm v3/beta enrollment** — call support (877-732-4980) or ask them to check Setup >
   API/Developers for a "v3 / Experimental" toggle. If the account is still on a legacy API
   version, the endpoints above may not match and we'll need to re-pull the spec for that version.
2. **The account's `trackerIds` (or `fleetIds`) for the five trucks** — `/api/v3/trackers` will
   list them once we have a key, but the owner should also give us the human-readable
   truck↔tracker↔driver mapping (which `trackerId`/`serialNumber` is which physical truck, and
   which is normally driven by which tech) since the API's own `Tracker`/`Asset` objects may not
   carry a friendly name we'd recognize.
3. **Confirmation of which report they want as ground truth if the API and portal ever disagree**
   — not expected, but worth a sanity check on day one (pull one day via API, compare row counts /
   total miles against the portal's Trip report for the same day).

## CONFIRMED 2026-09-19 (browser session with Spencer, Setup > API/Developers)

- The portal has an **API Version** switch: **Version 2** (live, token created 2026-09-19 — the value Spencer saved as the FleetSharp key variable) and **Version 3** (beta, separate "Create New API Key"; none created).
- The saved credential is a **Version 2 token**: a long-lived agilis JWT by design. It is NOT a v3 key and will never mint a v3 JWT.
- **Account-specific host:** `https://app02.fleetsharp.com` (Swagger banner "Your API Host"). Base path `/ibis/rest/api/v2`, api version 2.13. Spec saved as `stages/fleetsharp-v2-api.yaml` (from `/ibis/apidocs/api.yaml`). `www.linxup.com` serves the same API (the worker's `/geofences` 200 proves it) but use the account host.
- **Auth:** `Authorization: Bearer <token>` on every call.
- **Why every GET bounced:** `/trips`, `/stops`, `/advancedTrips` are **POST** with body `{fromDate, toDate}` in epoch ms, **range <= 48 h**. Roster is `GET /tracker`.
- Pull script: `scripts/gps-pull.mjs --from --to` (16 two-day windows for 08-17..09-17). Spencer runs it with the `!` prefix because the local permission classifier blocks this session from calling the host.
