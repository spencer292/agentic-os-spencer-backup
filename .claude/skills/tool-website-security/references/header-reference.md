# Security Header Reference — tool-website-security

What each header does, the risk if it's missing, and a sane recommended value. Use this to translate a finding into plain-language advice for the user.

## Strict-Transport-Security (HSTS)
- **Risk if missing:** a network attacker can downgrade the first connection to HTTP (SSL strip) and intercept traffic.
- **Recommended:** `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- **Note:** only send over HTTPS. `preload` is a commitment — the domain gets hard-coded into browsers; don't add it until HTTPS is solid across all subdomains.

## Content-Security-Policy (CSP)
- **Risk if missing:** the main defence against XSS is absent — injected scripts run freely.
- **Recommended (starting point):** `Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'self'; base-uri 'self'`
- **Note:** CSP needs tuning per site; deploy in `Content-Security-Policy-Report-Only` first to find breakage before enforcing. `frame-ancestors` also replaces X-Frame-Options.

## X-Frame-Options
- **Risk if missing:** clickjacking — the site can be framed by a malicious page and the user tricked into clicking.
- **Recommended:** `X-Frame-Options: SAMEORIGIN` (or rely on CSP `frame-ancestors 'self'`).

## X-Content-Type-Options
- **Risk if missing:** browsers may MIME-sniff responses and execute non-script files as script.
- **Recommended:** `X-Content-Type-Options: nosniff`

## Referrer-Policy
- **Risk if missing:** full URLs (with tokens/paths) leak to third parties via the Referer header.
- **Recommended:** `Referrer-Policy: strict-origin-when-cross-origin`

## Permissions-Policy
- **Risk if missing:** no restriction on powerful features (camera, mic, geolocation, payment) for the page or its iframes.
- **Recommended (lock down what you don't use):** `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## Cookie flags
- **Secure** — cookie only sent over HTTPS. Without it, cookies can leak over plain HTTP.
- **HttpOnly** — JavaScript can't read the cookie. Without it, XSS can steal session cookies.
- **SameSite** — `Lax` (default-ish) or `Strict` mitigates CSRF. `None` requires `Secure`.
- **Recommended for session cookies:** `Set-Cookie: id=...; Secure; HttpOnly; SameSite=Lax`

## TLS / certificate
- **TLS 1.2 minimum**, 1.3 preferred. Disable TLS 1.0/1.1 and SSLv3.
- **Certificate:** renew well before expiry (the scan warns at < 30 days, escalates < 15). Use automated renewal (e.g. ACME/Let's Encrypt) to avoid surprise expiries.
- **Trust:** a self-signed or chain-incomplete cert breaks trust for normal users — fix the chain (include intermediates).

## Email authentication (DNS)
- **SPF** — `v=spf1 include:_spf.yourprovider.com -all` lists who may send mail for the domain. `-all` (hard fail) is stronger than `~all`.
- **DMARC** — `_dmarc` TXT, e.g. `v=DMARC1; p=quarantine; rua=mailto:dmarc@domain`. Start at `p=none` to monitor, then move to `quarantine`/`reject` once aligned. `p=none` alone doesn't stop spoofing.
- **DKIM** — needs a selector; can't be checked passively. If you manage the domain, confirm DKIM signing is on and the selector resolves.

## Version / stack disclosure
- Headers like `Server: Apache/2.4.29` or `X-Powered-By: PHP/7.2` hand attackers your exact software version to match against known CVEs. Strip version numbers (and ideally the header) at the server/CDN.

## security.txt (RFC 9116)
- Not a vulnerability, but publishing `/.well-known/security.txt` with a contact gives researchers a clean way to report issues. Low effort, good signal.
