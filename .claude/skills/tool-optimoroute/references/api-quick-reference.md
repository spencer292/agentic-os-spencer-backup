# OptimoRoute API — local quick reference

Researched 2026-07-04 from the official API reference (optimoroute.com/api/, v1.36).
If something fails against the live API, verify there and update this file.

## Basics

- Base URL: `https://api.optimoroute.com/v1/`
- Auth: `?key=<OPTIMOROUTE_API_KEY>` query parameter on EVERY request. HTTPS mandatory.
- GET retrieves; POST creates/updates/deletes. Bodies and responses are JSON.
- Every response: `success` (bool) + `code`/`message` on error + requested data.
- Limits: max 5 concurrent requests per account/IP; bulk endpoints max 500 items.
- Key location in app: Administration → Settings → WS API.

## Endpoints

### Orders
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/create_order` | POST | Create/update ONE order (only endpoint that geocodes addresses) |
| `/create_or_update_orders` | POST | Bulk create/update (≤500; needs lat/long or clean addresses) |
| `/get_orders` | POST/GET | Retrieve order details |
| `/search_orders` | POST | Search with filters |
| `/delete_order` | POST | Delete one |
| `/delete_orders` | POST | Bulk delete (≤500) |
| `/delete_all_orders` | POST | DELETE A WHOLE DATE — double-confirm before ever using |

Minimum order fields: `orderNo`, `date` (YYYY-MM-DD), `type` (`D` delivery / `P` pickup / `T` task),
`location` (address or lat/long).

### Planning & routes
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/start_planning` | POST | Kick off optimization (returns planning ID) |
| `/get_planning_status` | GET | Poll progress by planning ID |
| `/stop_planning` | POST | Cancel by planning ID |
| `/get_routes` | GET | Planned routes for a `date` (required param, YYYY-MM-DD) |
| `/get_scheduling_info` | GET | Scheduling details for an order |

### Drivers
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/update_driver_parameters` | POST | One driver (note: unschedules existing routes) |
| `/update_drivers_parameters` | POST | Bulk (≤500) |
| `/update_drivers_positions` | POST | Push GPS positions |

### Mobile & completion
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/get_events` | GET | Mobile app events (≤500 per call) — the polling substitute for webhooks |
| `/get_completion_details` | POST/GET | Completion data for orders |
| `/update_order_completion` | POST | Submit completion info |

## No webhooks

OptimoRoute does not push events. Event-driven behavior = poll `get_events` or
`get_completion_details` on a schedule (n8n Schedule trigger works well).

## Integration notes

- Key-as-query-param means the key appears in URLs — never paste request URLs into documents/chat.
- In n8n: plain HTTP Request node, no OAuth credential needed; put the key in the query parameters.
- Typical Got Moles flow: Jobber JOB_CREATE webhook → n8n → `create_order` (orderNo = Jobber job
  number, type T, service address) → nightly `start_planning` → morning `get_routes`.
