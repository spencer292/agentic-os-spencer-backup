---
site: got-moles.com
date: 2026-06-08
grade: C
audit_type: hybrid
critical: 0
high: 3
medium: 2
low: 5
status: partially-remediated
---

# Got Moles — Security Audit (2026-06-08)

**Trigger:** Production incident at 01:14 UTC — a `Go-http-client/2.0` vulnerability scanner fired **1,625 junk-path requests in a 4-second window** (01:14:20–01:14:24), probing for exposed config/secret files (`/redis.conf`, `/.dockerenv`, `/docker-compose.yml`, `/k8s/`, `/migrations/`, etc.). Every unknown path fell through to the `/[citySlug]` database branch, exhausted Supabase's 200-connection limit (`EMAXCONN`), and returned **1,625 × HTTP 500**. Self-resolved the instant the scanner stopped (0 errors after 01:14:24).

**Baseline:** Security Patch resolved 2026-05-15 (5 HIGH closed). Three items were left open and are re-confirmed live here: CSP enforcement (2c), DMARC dedupe (2e), admin 2FA/CAPTCHA (2f).

---

## Verdict: Grade C

The site's **transport, headers, sensitive-path, injection, and form-handling posture is genuinely strong** — this is not a sloppy site. The grade is held to C by three High findings, two of which combined to cause tonight's outage:

1. **No edge bot / rate-limit protection** — scanners and floods reach origin unimpeded (Area 9).
2. **The `/[citySlug]` route amplifies unauthenticated junk traffic into database load** and returns 500 instead of 404 (application architecture).
3. **Duplicate DMARC record** — the domain has *no effective DMARC enforcement* (Area 3).

None are a Critical (no active data exposure or compromise). All three are fixable this week.

## Severity Summary

| Severity | Count | Findings |
|----------|-------|----------|
| Critical | 0 | — |
| High | 3 | No edge WAF/rate-limit (A9); `/[citySlug]` DB-amplification → 500 (app); duplicate DMARC (A3) |
| Medium | 2 | CSP still Report-Only + `unsafe-inline`/`unsafe-eval` (A2); 19 moderate npm vulns (A6) |
| Low | 5 | ACAO `*` on static HTML (A2); in-memory rate-limit not cross-instance (A8); SPF `~all` soft (A3); CAA record unconfirmed/absent (A3); admin 2FA absent (A2/baseline 2f) |
| Pass | 6 | TLS (A1), sensitive paths (A4), 3rd-party scripts (A5), app-layer injection (A7), cookies (A10), redirect abuse (A11) |

---

## Findings by Area

### Area 1 — Transport / TLS — ✅ PASS
- HTTP → HTTPS **308** redirect enforced.
- HSTS: `max-age=63072000; includeSubDomains; preload` (2 years, preload-ready). ✓
- **TLS 1.3**, cipher `TLS_AES_128_GCM_SHA256`. ✓
- Cert: Let's Encrypt, valid `May 1 → Jul 30 2026`. ✓ Auto-renewing via Vercel.

### Area 2 — HTTP Headers + CSP — ⚠️ MEDIUM + LOW
**Evidence (live headers):** `x-frame-options: DENY` ✓, `x-content-type-options: nosniff` ✓, `referrer-policy: strict-origin-when-cross-origin` ✓, `permissions-policy: camera=(), microphone=(), geolocation=()` ✓, `x-xss-protection: 0` ✓ (correct modern practice), **`x-powered-by` absent** ✓ (`poweredByHeader: false`).

- **MEDIUM — CSP is still Report-Only.** Header returned is `content-security-policy-report-only`, `enforcing: null`. Source: `next.config.ts:40`. The policy also permits `'unsafe-inline' 'unsafe-eval'` in `script-src` (GTM/ads requirement). Until flipped to enforcing, CSP provides **zero** XSS protection — it only reports. *This is baseline open item 2c.*
- **LOW — `access-control-allow-origin: *`** on the root HTML response. Confirmed **only on static public pages, NOT on `/api/*`** (`/api/users/` and `/api/contact/` return no ACAO). Public marketing HTML with no credentials → harmless. Hygiene-level only.

### Area 3 — DNS / Email Auth — 🔴 HIGH + LOW
**Evidence (live DNS):**
- **HIGH — Two DMARC records published:**
  - `v=DMARC1; p=none; rua=mailto:spencer@got-moles.com`
  - `v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;`
  Per **RFC 7489**, when more than one DMARC record exists, receivers **discard all of them** and treat the domain as having no DMARC policy. So despite one record requesting `quarantine`, Got Moles currently has **no enforced DMARC at all** — the domain is spoofable for phishing. The `onsecureserver.net` record is a GoDaddy/Secureserver leftover. *This is baseline open item 2e, now confirmed still live.*
- **LOW — SPF** `v=spf1 include:_spf.google.com ~all` — single, valid, but `~all` (softfail). Hardening to `-all` is a later, careful step (can break mail if a sender is missed).
- **LOW — CAA** could not be queried from this resolver (`unknown query type: CAA`). Likely absent. Adding a CAA record pinning Let's Encrypt is cheap defence-in-depth.

### Area 4 — Sensitive-Path Exposure — ✅ PASS
`/.env` 404, `/.env.local` 404, `/package.json` 404, `/package-lock.json` 404, `/.DS_Store` 404, `/config.json` 404, `/backup.zip` 404. `/.git/config`, `/.aws/credentials`, `/server-status` → 308 trailing-slash redirect then 404 (not exposed). `/wp-login.php` + `/wp-admin/` → 308 → home. **`/.well-known/security.txt` → 200** (present ✓).

### Area 5 — Third-Party Script Trust — ✅ PASS (info)
No external `<script src>` origins in static HTML (vendors are GTM-injected client-side). 0 iframes, 0 plain-HTTP refs. CSP allowlist is scoped to known vendors (GTM, GA, Facebook, Google Ads, Clarity, CallRail). No SRI, but that's impractical with GTM-managed tags.

### Area 6 — Dependency Vulnerabilities — ⚠️ MEDIUM
**Evidence (`npm audit --json`):** `{"moderate":19,"high":0,"critical":0,"total":19}`. Scoped triage:
- **Dev / build-only** (not in production bundle): `esbuild`, `@esbuild-kit/*`, `drizzle-kit`, `postcss`. The esbuild advisory only affects the local dev server. → effectively Low.
- **Admin-UI only** (authenticated surface): `dompurify` (XSS), `monaco-editor` — part of Payload's Lexical rich-text editor. Not on the public site. → Low–Medium.
- **Transitive via Payload:** the entire `@payloadcms/*` cluster is flagged only because it depends on `uuid` / `esbuild` / `drizzle-kit`. Root cause is a handful of transitive deps; `fix: true` on nearly all (the `next@9.3.3 MAJOR` suggestion is npm mis-resolution, not a real downgrade).
- **No High, no Critical, nothing on the public request path.** Graded Medium as a cluster with a clean `npm audit fix` path.

### Area 7 — Application-Layer Injection — ✅ PASS
Non-destructive probes for open-redirect (`?url=`, `?redirect=`, `?next=`, `?return_to=`), reflected XSS (`?s=<script>`), and SQLi tautology (`?id=1'OR'1'='1`): **no reflection in body or `Location` header** on any. Next.js App Router + Payload's parameterized queries — no raw SQL surface.

### Area 8 — Form Security — ✅ PASS (strong, one Low)
`src/app/(frontend)/api/contact/route.ts`:
- **Honeypot** (`website` field → silent success to bots) ✓
- **Rate limit** 5 / IP / 10 min ✓
- **Strict validation** — name, phone regex, email regex, ZIP regex, required service ✓
- **Sanitization + length caps** on every field ✓
- **POST-only** (GET → 405 confirmed live) ✓
- CSRF token absent, but the endpoint is a JSON API with **no cookie-based auth**, so CSRF does not apply.
- **LOW** — the rate limiter is an in-memory `Map`, so it's **per serverless instance**, not global. Under a distributed flood it's bypassable. Vercel KV (or Vercel's native rate limiting) would make it cross-instance. The code comment already acknowledges this.

### Area 9 — WAF / Bot / Rate-Limit — 🔴 HIGH
**Evidence (live):** `sqlmap/1.6` UA → **200** (not blocked), `masscan/1.0` UA → **200** (not blocked), 8 rapid parallel requests → **all 200** (no throttle). **This is the gap that let tonight's scanner run unimpeded.** There is no Cloudflare in front, and Vercel's bot/attack-challenge is not configured to challenge these patterns. → **High.** Fix is edge config (Vercel WAF / Attack Challenge / rate-limit rules), not code.

### Area 10 — Cookies — ✅ PASS
No `Set-Cookie` on public pages (stateless marketing site). Payload admin session cookies use Payload's secure defaults (HttpOnly, SameSite). No insecure cookie observed.

### Area 11 — Redirect-Chain Abuse — ✅ PASS
No user-controlled parameter reflected into any `Location:` header. Redirects are server-defined in `src/lib/redirects.ts` (the 291 SEO redirects), not param-driven.

---

## Cross-Cutting HIGH — the incident root cause (application architecture)

This isn't a single audit area; it's how three design choices in `/[citySlug]/page.tsx` combine:

1. **`export const dynamicParams = true`** — any slug not matching `mole-control-*` (i.e. every scanner junk path) routes to **Branch 2**, which runs a **live Supabase query** (`getBlogPostBySlug`).
2. **No try/catch on the Branch 2 render** (`page.tsx:114`) — a DB error throws uncaught → **500** instead of degrading to 404. (Note: `generateMetadata` *is* wrapped at line 104; the render is not.)
3. **Uncapped DB pool** (`payload.config.ts:51` — no `max`, no timeouts) — concurrent invocations collectively blew past Supabase's 200-connection ceiling → `EMAXCONN`.

Result: unauthenticated junk traffic became a self-inflicted connection-exhaustion DoS. **High** — not theoretical; it caused the outage. Fully fixable in code, lowest-risk change in the queue.

---

## Prioritised Remediation Checklist

### This week (High)
- [ ] **Harden `/[citySlug]`** — slug guard (reject file-extension/junk paths before any DB call) + try/catch → `notFound()` on Branch 2 + cap the Postgres pool (`max`, `idleTimeoutMillis`, `connectionTimeoutMillis`). Files: `src/app/(frontend)/[citySlug]/page.tsx`, `src/payload.config.ts`. Reversible (pure code). *Fixes the incident.*
- [ ] **Remove the duplicate DMARC record** — delete the `onsecureserver.net` record, keep one consolidated `p=quarantine`. DNS-panel handoff (registrar). Reversible.
- [ ] **Enable Vercel edge protection** — Attack Challenge Mode / WAF rule + rate-limit on `/[citySlug]` and `/api/contact`. Vercel dashboard + optional `vercel.json`. Reversible.

### This month (Medium)
- [ ] **`npm audit fix`** for the non-major moderates (own phase; smoke-test admin + build). Read changelog before any framework bump.
- [ ] **Flip CSP to enforcing** — Report-Only → enforcing, **preview-first** (watch violation log, fix allowlist, then promote). Item 2c.

### When convenient (Low)
- [ ] Persistent rate-limit via Vercel KV (cross-instance) for `/api/contact`.
- [ ] Admin 2FA / IP allowlist on `/admin` (baseline item 2f).
- [ ] SPF `~all` → `-all` (carefully, after confirming all senders).
- [ ] Add a CAA record pinning Let's Encrypt.
- [ ] Remove/scope `access-control-allow-origin: *` on static pages.

---

## Phased Apply-Fixes Queue (low-risk → high-risk)

| Phase | Change | Risk | Type | Notes |
|-------|--------|------|------|-------|
| **1** | Harden `/[citySlug]` (slug guard + try/catch + pool cap) | Low | Code | Highest priority *and* lowest risk. Can't break existing static city pages. Fixes the incident. |
| **2** | Delete duplicate DMARC record | Low | DNS handoff | Rule E — produce exact record, hand to DNS holder. |
| **3** | Vercel WAF / Attack Challenge + edge rate-limit | Medium | Edge config | Could challenge some legit traffic — start in observe/log mode. |
| **4** | `npm audit fix` (non-major) | Medium | Dependency | Rule D — isolated phase, full build + admin smoke test. |
| **5** | CSP Report-Only → enforcing | Medium | Enforcement flip | Rule C — **preview first**, watch violations, then promote. |
| **6** | KV rate-limit, admin 2FA, SPF `-all`, CAA | Low | Hardening | Defence-in-depth cleanup. |

---

## Could Not Cover From Here (scope notes)
- **CAA + DNSSEC** — the local resolver couldn't query CAA type. Re-check with `dig CAA got-moles.com` / `dig DNSSEC` from a full resolver, or read the registrar DNS panel directly.
- **Payload admin auth strength** — confirmed the API is auth-gated (`/api/users/` → 403) and admin login renders, but password policy / brute-force lockout / 2FA status needs a logged-in check or config review.
- **CSP real-world violations** — Report-Only means the violation report endpoint (if any) holds the data on what would break under enforcement; review before Phase 5.

---

*Audit method: `scripts/probe.mjs` (areas 1–5, 7, 9, 11) + live `nslookup`/node-fetch (area 3, CORS, admin) + `npm audit --json` (area 6) + source review of `next.config.ts`, `payload.config.ts`, contact route, and `[citySlug]/page.tsx` (areas 2, 6, 8, 10 + application architecture). All probes non-destructive.*

---

## Remediation Log

### Phase 1 — `/[citySlug]` DB-amplification hardening — ✅ SHIPPED
- **Date:** 2026-06-08
- **Commit:** `08e438ca`
- **Files:** `[citySlug]/page.tsx` (slug guard in both `generateMetadata` + render; try/catch → `notFound()` on Branch 2), `payload.config.ts` (pool `max: 10` + idle/connection timeouts).
- **Verification (live, post-deploy):** dotted junk (`/docker-compose.yml`, `/redis.conf`) → 404; bare-word junk (`/k8s/`) → 404; real city page (`/mole-control-seattle/`) → 200; real legacy blog (`/how-many-eyes-do-moles-have/`) → 200; **burst of 25 parallel junk → 25 × 404, zero 5xx / EMAXCONN.**
- **Closes:** the cross-cutting application-layer High (incident root cause). Note: the guard short-circuits dotted/path-traversal junk before any DB call; bare-word probes still reach the DB but now degrade to a cheap 404, and any future connection exhaustion returns 404 not 500. Stopping the scanner at the edge remains **Phase 3 (Vercel WAF)**.

### Phases 2–6 — pending
