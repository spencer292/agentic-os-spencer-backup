# DNS + Email Authentication

## Area 3 — DNS / Email Auth

Query via DNS-over-HTTPS (`cloudflare-dns.com/dns-query`) or `dig`. All read-only.

| Record | Query | Pass criteria | Severity if wrong |
|--------|-------|---------------|-------------------|
| SPF | TXT on apex | exactly one `v=spf1` record; ends `-all` (hard fail) ideal, `~all` (soft) acceptable | Medium if `~all`, High if missing or multiple |
| DKIM | TXT on `{selector}._domainkey` (e.g. `google._domainkey`) | valid `v=DKIM1; k=rsa; p=...` for each sending service | High if missing |
| DMARC | TXT on `_dmarc` | **exactly one** record; policy `p=quarantine` or `p=reject` ideal, `p=none` is monitoring-only | High if missing, **High** if duplicate |
| CAA | CAA on apex | restricts cert issuance to the actual CA | Medium if absent |
| DNSSEC | DNSKEY on apex | signed zone | Low if absent |
| AAAA | AAAA on apex | IPv6 dual-stack (host-dependent) | Low if absent |

## The duplicate-DMARC trap

Per RFC 7489 §6.6.3 a domain MUST have exactly one DMARC record. **When two exist, receivers ignore DMARC entirely** — the domain has zero spoofing protection even though it looks configured. This is a common, silent, High-severity finding. Always count the records, don't just check one exists.

Fix: decide the intended record (keep the stricter policy), delete the other from the DNS panel. Verify with `dig TXT _dmarc.{domain}` showing exactly one.

## DMARC policy progression

Never jump straight to `p=reject` — legitimate mail can get dropped. Progression over 4–8 weeks, monitoring the `rua` aggregate reports at each stage:

`p=none` (monitor) → `p=quarantine` (suspicious to spam) → `p=reject` (hard block)

## SPF hardening

`~all` (softfail) → `-all` (hardfail) is a one-character change, but only make it once you're certain ALL legitimate mail flows through the `include:`'d services. A forgotten sender (CRM, invoicing, transactional email) will start failing. This is an enforcement flip — treat with Rule C caution: confirm the full sending inventory first.

## CAA records

Tell CAs which authorities may issue certs for the domain. Without them, any CA worldwide can issue. Example for a Let's Encrypt site:

```
{domain}.  CAA 0 issue "letsencrypt.org"
{domain}.  CAA 0 issuewild ";"
```

## Rule E applies — DNS is usually a handoff

SPF / DKIM / DMARC / CAA / DNSSEC live in the registrar's DNS panel (GoDaddy, Cloudflare, Namecheap, etc.), not the codebase. Attempt a registrar API/CLI path first. If none, produce the **exact** records to add / remove / change and hand off to whoever holds DNS access — name the specific records and the specific panel. Don't report a DNS fix as "done" when it's pending a handoff; report it as "handed off, pending {person}".
