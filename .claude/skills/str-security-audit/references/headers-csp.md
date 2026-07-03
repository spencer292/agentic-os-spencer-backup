# HTTP Security Headers, CSP, Cookies

## Area 2 — HTTP Security Headers

Read response headers on the homepage + a sample inner page + an API route.

| Header | Expected | Severity if missing/wrong |
|--------|----------|---------------------------|
| `strict-transport-security` | `max-age>=31536000; includeSubDomains; preload` | High |
| `x-frame-options` | `DENY` or `SAMEORIGIN` | Medium (clickjacking) |
| `x-content-type-options` | `nosniff` | Medium (MIME sniffing) |
| `referrer-policy` | `strict-origin-when-cross-origin` or stricter | Low |
| `permissions-policy` | locks unused APIs (`camera=()`, `microphone=()`, `geolocation=()`) | Low |
| `x-xss-protection` | `0` — modern best practice DISABLES the legacy header (CSP supersedes); a non-zero value is mildly wrong | Low |
| `x-powered-by` | absent — its presence is info disclosure | Low |
| `access-control-allow-origin` | not `*` if any auth/sensitive API exists; `*` is fine for purely public marketing content | Low–Medium |

## CSP — the highest-leverage header

Three states, worst → best:
1. **No CSP** — High finding.
2. **`Content-Security-Policy-Report-Only`** — policy defined but NOT enforced. Browser logs violations, blocks nothing. Any XSS executes freely. **High** finding — flip to enforcing.
3. **`Content-Security-Policy`** (enforcing) — good. Then check quality:
   - `unsafe-inline` in `script-src` — undermines XSS protection. **Medium**. Fix with nonces.
   - `unsafe-eval` in `script-src` — allows `eval()`. **Medium**. Remove if possible.
   - Nonce-based `script-src 'self' 'nonce-{random}'` — best. Next.js supports via middleware.

### Flipping Report-Only → enforcing (the careful way)

This is an enforcement flip — **Rule C of Phased Remediation Discipline**. Process:
1. Deploy the enforcing header to a **preview** deployment only.
2. Load the site, open browser console, exercise key flows (homepage, forms, admin login).
3. Every CSP violation logged = a script the enforcing policy will block. Add legitimate ones to the allowlist.
4. Re-test in preview until the violation log is clean.
5. Promote to production. Monitor for 30+ min.

Never flip straight to prod — you will block something that was silently tolerated under Report-Only.

### Tightening CSP (separate, later phase)

Removing `unsafe-inline`/`unsafe-eval` via nonces is its own phase AFTER enforcement is stable. Next.js: generate a per-request nonce in middleware, pass to `<Script nonce>`, reference in the `script-src`. Test in preview — inline styles/scripts that lack the nonce will break.

## Area 10 — Cookies

Only relevant where the site sets cookies (auth, sessions, admin). Static marketing pages on Vercel typically set none.

For any auth/session cookie (e.g. Payload admin login), confirm in the framework config or by inspecting `Set-Cookie` on login:

| Flag | Required | Why |
|------|----------|-----|
| `Secure` | yes | HTTPS-only transmission |
| `HttpOnly` | yes | no JavaScript access — blocks XSS cookie theft |
| `SameSite` | `Lax` or `Strict` | CSRF mitigation |
| `Path` | scoped (e.g. `/admin`) | limits cookie exposure surface |

Missing `Secure` or `HttpOnly` on an auth cookie = **High**. Missing `SameSite` = **Medium**.

## Fix locations (Next.js + Payload stack)

- Headers + CSP: `next.config.js` `headers()` OR `middleware.ts` (middleware needed for per-request nonces).
- `x-powered-by`: `poweredByHeader: false` in `next.config.js`.
- Cookie flags: Payload auth config (`payload.config.ts` → `cookies` / `auth` options).
- `security.txt`: `public/.well-known/security.txt`.
