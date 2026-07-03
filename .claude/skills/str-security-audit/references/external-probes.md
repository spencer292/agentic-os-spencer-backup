# External Probes — Transport, Sensitive Paths, Third-Party Trust, WAF/Bot

Non-destructive external probes. All can run black-box with no codebase access. Automated by `scripts/probe.mjs`; this file is the methodology + pass criteria.

## Area 1 — Transport / TLS

| Check | Method | Pass criteria |
|-------|--------|---------------|
| HTTPS enforced | `fetch('http://{domain}')` redirect manual | 301/308 → `https://` |
| HSTS | read `strict-transport-security` header | `max-age` ≥ 31536000, ideally `includeSubDomains; preload` |
| www → apex (or chosen canonical) | fetch the non-canonical host | redirects to canonical |
| TLS protocol | `tls.connect()` → `getProtocol()` | TLS 1.2 minimum, 1.3 preferred; no 1.0/1.1 |
| Cipher | `tls.connect()` → `getCipher()` | modern AEAD (AES-GCM / ChaCha20) |
| Cert chain + expiry | `getPeerCertificate({detailed:true})` | valid chain, not expiring <30 days, auto-renew if managed host |
| Mixed content | scan homepage HTML for `http://` asset refs | zero plain-http asset references |

## Area 4 — Sensitive-Path Exposure

Probe each path, expect 404/403/redirect — NOT 200-with-content:

```
/.env  /.env.local  /.git/config  /.git/HEAD  /package.json  /package-lock.json
/.aws/credentials  /phpinfo.php  /server-status  /.DS_Store  /config.json
/wp-login.php  /wp-admin/  /api/  /backup.zip  /.well-known/security.txt
```

- `/.env`, `/.git/*`, credentials, configs → MUST be 404/403. A 200 here is **Critical**.
- Legacy CMS paths (`/wp-*`) → redirect to `/` is fine (common on migrated sites).
- Admin login surface (e.g. `/admin`) returning a login form is **correct** — that's the login page, not exposed admin content. Note it; recommend confirming rate-limit + 2FA in the codebase review.
- `/.well-known/security.txt` 404 → **Low** finding (add responsible-disclosure contact).

## Area 5 — Third-Party Script Trust

Parse homepage HTML, extract every `<script src>` origin:

- Count unique external origins. 0 external scripts = excellent (no supply-chain surface).
- Each external script without SRI (`integrity=`) = a supply-chain risk — **Low** to **Medium** depending on what it is.
- Count `<iframe>` — each is an embedding-trust surface.
- Note: CSP allowlist may name domains that don't actually load at initial render (consent-gated tag managers). Distinguish "allowed" from "loading".

## Area 9 — WAF / Bot / Rate-Limit Posture

| Test | Method | Reading |
|------|--------|---------|
| Suspicious UA | request with UA `sqlmap/1.6`, `masscan/1.0`, `nikto` | 200 served = no UA filtering (**Low**); 403/challenge = good |
| Rapid requests | 5–10 parallel GETs | all 200 fast = no L7 rate limit (**Low**); some 429 = good |
| Platform DDoS | identify host (Vercel / Cloudflare / etc.) | managed-host edge gives L3/L4 DDoS automatically — note it; L7 abuse still needs app-level gating |

Recommendation default for Vercel-hosted: enable Vercel Bot Protection (NOT Cloudflare-in-front per `feedback_no_cloudflare_in_front_of_vercel.md`).

## Area 11 — Redirect-Chain Abuse

For sites with redirect rules (trailing-slash, www, legacy):
- Confirm no request parameter is reflected into the `Location:` response header (open-redirect amplification).
- Test: `/{path}?next=//evil.example.com` — the `Location:` must point to the intended canonical, not the param value.
- Long redirect chains aren't a security bug per se, but each hop is a place params could leak — verify the `Location:` is param-independent.

## Probe Hygiene

- All probes here are **non-destructive** — no form submissions, no parameter mutations beyond standard URL params, no auth attempts.
- Use a clear custom User-Agent for your own probes (not impersonation) except where testing UA filtering specifically.
- If the target's WAF blocks the probe script, that is itself a positive finding — document it and fall back to manual `curl`/`dig`.
