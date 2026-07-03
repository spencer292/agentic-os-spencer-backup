# Security Patterns Reference

Quick-reference for grep patterns used during code scanning. Organised by vulnerability category.

## Secret Patterns

These regex patterns catch the most common leaked credentials. Run case-insensitive.

| Pattern | What it catches |
|---------|----------------|
| `(api[_-]?key\|apikey)\s*[:=]\s*['"][A-Za-z0-9]` | Generic API keys |
| `AKIA[0-9A-Z]{16}` | AWS Access Key IDs |
| `-----BEGIN (RSA \|EC )?PRIVATE KEY-----` | Private keys (RSA, EC) |
| `(mongodb\|postgres\|mysql\|redis):\/\/[^\s]+` | Database connection strings |
| `(password\|passwd\|pwd)\s*[:=]\s*['"][^'"]+` | Hardcoded passwords |
| `(token\|secret\|auth)\s*[:=]\s*['"][A-Za-z0-9]` | Tokens and secrets |
| `sk-[A-Za-z0-9]{20,}` | OpenAI / Stripe secret keys |
| `ghp_[A-Za-z0-9]{36}` | GitHub personal access tokens |
| `xoxb-[0-9]{10,}` | Slack bot tokens |

**Exclude paths:** `node_modules/`, `.git/`, `*.lock`, `*.min.js`, `.env.example`, `__tests__/`, `*.test.*`, `*.spec.*`, `fixtures/`, `mocks/`

## XSS Patterns

| Pattern | Framework | Severity |
|---------|-----------|----------|
| `dangerouslySetInnerHTML` | React/Next.js | High — review sanitisation |
| `innerHTML\s*=` | Vanilla JS | High |
| `eval\(` | Any | High — if input is dynamic |
| `new Function\(` | Any | High — if input is dynamic |
| `document\.write\(` | Vanilla JS | Medium |
| `\$\{.*\}.*<` | Template literals in HTML | Medium — check encoding |
| `v-html=` | Vue | High — review sanitisation |
| `\[innerHTML\]=` | Angular | High — review sanitisation |

## SQL Injection Patterns

| Pattern | Context | Severity |
|---------|---------|----------|
| `\$queryRaw` with template literal | Prisma | Critical if unsanitised |
| `.raw\(` with string concat | Various ORMs | Critical |
| `query\(.*\+\s*` | Raw SQL | Critical |
| `SELECT.*FROM.*\$\{` | Template SQL | Critical |
| `execute\(.*\+\s*` | Raw SQL | Critical |

## Next.js Specific

| Check | What to look for | Severity |
|-------|-----------------|----------|
| `NEXT_PUBLIC_` containing secret-like names | `NEXT_PUBLIC_.*SECRET`, `NEXT_PUBLIC_.*KEY` (not `NEXT_PUBLIC_SUPABASE_ANON_KEY`) | Critical |
| API routes without auth | Route handlers missing auth middleware | High |
| Server actions without validation | `"use server"` functions without input checks | Medium |
| Exposed source maps | `productionBrowserSourceMaps: true` | Medium |

## Supabase Specific

| Check | What to look for | Severity |
|-------|-----------------|----------|
| Service role key in client code | `supabase.*service_role` in non-server files | Critical |
| Missing RLS | Tables without `enable row level security` | Critical |
| Permissive RLS | Policies with `true` as the check | High |
| Anon key exposure | Expected — anon key is designed to be public | Info |

## Security Headers Reference

| Header | Recommended Value | MDN Reference |
|--------|------------------|---------------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | HSTS |
| `Content-Security-Policy` | Restrictive, framework-specific | CSP |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `X-Frame-Options` | `DENY` or `SAMEORIGIN` | Clickjacking |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Referrer leaking |
| `Permissions-Policy` | Deny unused APIs | Feature policy |
| `Cross-Origin-Opener-Policy` | `same-origin` | Spectre mitigation |
| `Cross-Origin-Resource-Policy` | `same-origin` | Resource isolation |
| `Cross-Origin-Embedder-Policy` | `credentialless` or `require-corp` | Cross-origin isolation |

## Known CVEs to Check (as of May 2026)

| CVE | CVSS | Affected | Fixed in | What it does |
|-----|------|----------|----------|-------------|
| CVE-2025-55182 (React2Shell) | 10.0 | React Server Components with `"use server"` | React 19.0.1, 19.1.2, 19.2.1 | Unauthenticated RCE via Server Functions |
| CVE-2025-29927 | High | Next.js 11.1.4-15.2.2 | Next.js 15.2.3+ | Middleware auth bypass via spoofed internal headers |
| CVE-2025-55183 | High | React Server Components | React 19.0.1+ | Source code exposure of Server Actions |
| CVE-2026-23864 | Medium | React/Next.js RSC | Patches vary | DoS via memory exhaustion in RSC |

**How to check:** Grep for `"use server"` directives. If found, verify React version is patched. If no Server Actions exist, note as mitigated.

## OWASP 2025 Changes

Key changes from OWASP 2021 → 2025 that affect audit priorities:

1. **A02 Security Misconfiguration** — surged from #5 to #2 (missing headers, debug mode, default creds)
2. **A03 Software Supply Chain Failures** — expanded from sub-category to top-3 (dependency hygiene, lockfile integrity, Dependabot)
3. **A05 Injection** — dropped from #3 to #5 (still important but frameworks mitigate more)
4. **A10 Mishandling Exceptional Conditions** — new category (error handling, graceful degradation)

## UK Data Use and Access Act 2025

Key requirements effective 5 February 2026:

- Cookie consent relaxed for low-risk cookies (analytics, appearance) but must provide clear info and prominent opt-out
- Reject button must have **equal prominence** to accept (no dark patterns)
- PECR cookie penalties now aligned with UK GDPR: up to 17.5M or 4% global turnover
- Privacy policy must list data processors, lawful basis, retention periods, data subject rights
