# Application-Layer Probes, Form Security, Redirects

All probes here are **non-destructive** — standard URL params only, no form submissions without explicit consent, no auth attempts, no payloads that mutate state.

## Area 7 — Application-Layer Injection / Open-Redirect Probes

| Probe | Test URL pattern | Safe result |
|-------|------------------|-------------|
| Open redirect | `/?url=`, `/?redirect=`, `/?next=//evil.example.com`, `/?return_to=` | 200 with no reflection; param does not appear in `Location:` |
| XSS reflection | `/?s=<script>alert(1)</script>` | param not reflected unescaped into HTML |
| SQLi tautology | `/?id=1'OR'1'='1` | no behaviour change, no DB error leaked |
| Path traversal | `/blog/?cat=../../etc/passwd` | URL-encoded / redirected / 404 — never serves a file |

On a Next.js + Payload stack, URL params rarely drive server-side DB queries directly (no SQL string concatenation), so these usually pass — but probe anyway, and probe any route that *does* take params into server logic (search, filters, API routes).

## Area 8 — Form Security (needs codebase access for the deep check)

External probe tells you the form exists; the real check is in the handler code. For each form (contact, quote, search), read the handler (`src/app/api/{route}/route.ts` on Next.js App Router) and confirm:

| Check | What to verify |
|-------|----------------|
| Method gating | POST-only endpoint rejects GET (405) |
| CSRF protection | token validated, or `SameSite` cookie + origin check |
| Rate limiting | per-IP submission cap (not just Vercel edge L3/L4) |
| Bot protection | reCAPTCHA / hCaptcha / honeypot field |
| Server-side validation | input length capped, content-type validated, no trust of client validation |
| Output handling | submitted data escaped before storage/display/email |

Missing CSRF on a state-changing POST = **High**. No rate limit = **Medium**. No bot protection = **Medium** (form spam) to **Low**.

If black-box only: note these as "needs codebase access" in the scope section — do NOT submit test payloads to a live form without explicit consent.

## Area 11 — Redirect-Chain Abuse

For sites with redirect rules (trailing-slash alignment, www→apex, legacy CMS paths):

- Confirm no request param is reflected into the `Location:` header — that would be an open-redirect amplification vector.
- Test: `/{path}?next=//evil.example.com` → the `Location:` must resolve to the intended canonical, param-independent.
- Long redirect chains aren't a vulnerability by themselves, but each hop is a place a param *could* leak — verify each hop's `Location:` is param-independent.
- Newly-rolled-out redirect graphs (e.g. a recent trailing-slash flip) are worth re-probing if the framework had any redirect cache-poisoning CVE in its current version — the two interact.

## Areas needing credentials / code (note in scope section)

Black-box external audit cannot cover these — list them explicitly in the report's "could not cover" section:

- Admin auth flow (login lockout, 2FA enforcement, password reset abuse)
- Webhook endpoint security (signature verification on inbound webhooks)
- Database security (connection string exposure, row-level security)
- Server-side environment variable exposure
- CI/CD pipeline secrets + permissions
- Subdomains on separate hosts (audit each separately)
- Media/storage bucket permissions (Vercel Blob, Supabase Storage, S3)
