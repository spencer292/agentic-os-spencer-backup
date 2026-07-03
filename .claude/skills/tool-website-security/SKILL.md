---
name: tool-website-security
description: >
  Passive, non-intrusive security audit of a LIVE website over HTTP — safe and
  legal to run against any URL without prior authorization (no fuzzing, no
  payloads, no brute-force enumeration). Checks HTTPS enforcement, TLS/certificate
  health, security headers (HSTS, CSP, X-Frame-Options, etc.), cookie flags,
  DNS email authentication (SPF/DMARC), security.txt, version/stack disclosure,
  mixed content, and a small fixed set of commonly-exposed sensitive files.
  Produces a graded, prioritised report. Triggers on: "website security audit",
  "audit this site", "is this website secure", "check security headers", "scan
  this URL for security", "security check on <domain>", "TLS/SSL check", "are my
  cookies secure", "check SPF/DMARC", "security headers for". Use whenever a
  live URL is the target. Does NOT audit this codebase (use
  tool-platform-security) and does NOT do SEO/performance audits (use str-ai-seo).
---

# Website Security

Passive security audit of a running website. It looks only at what a normal browser visit plus DNS/TLS lookups reveal — so it's safe and legal to point at any site without authorization. One Node script, built-in modules only (no curl, nothing to install).

This is deliberately **non-intrusive**: it never fuzzes parameters, sends payloads, or brute-forces paths. A clean result means "nothing was visible without active probing" — it is not a penetration test.

## Outcome

A graded, prioritised markdown report at `projects/tool-website-security/{YYYY-MM-DD}_{host}.md` — a letter grade (A–F), severity-grouped findings (high / medium / low / info), and a remediation hint per finding. Always save the report to disk and show the user the full absolute path. This is not optional.

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `context/learnings.md` | `## tool-website-security` section | Site-specific notes, accepted findings, false positives |

## Dependencies

None. Uses Node's built-in `https`, `http`, `tls`, and `dns` modules. Requires outbound network access to the target.

## Skill Relationships

- **Sibling:** `tool-platform-security` — same domain, opposite side. This audits a live site over HTTP; that audits source code you own.
- **Boundary vs `str-ai-seo`:** that skill is about being *found* by AI/search; this is about being *secure*. "Audit my site" + security/headers/TLS → here. "Audit my site" + ranking/visibility/SEO → str-ai-seo.
- **Optional input:** `tool-firecrawl-scraper` / `tool-web-screenshot` can capture a site, but this skill fetches what it needs itself.

## Step 1: Confirm the Target

Get the URL. A bare domain is fine — the scanner defaults to `https://`. If the user names several sites, run one scan per host. No authorization gate is needed for passive mode, but if the user explicitly wants deeper *active* probing (directory enumeration, injection tests), that's out of scope for this skill — say so and confirm they own/are authorised for the target before considering any other tool.

## Step 2: Run the Scan

```bash
node .claude/skills/tool-website-security/scripts/scan.cjs <url> \
  --out projects/tool-website-security/{YYYY-MM-DD}_{host}.md
```

| Flag | Default | What it does |
|------|---------|-------------|
| `<url>` | — | Target (bare domain ok; `https://` assumed) |
| `--out <path>` | stdout | Write the report to a file |
| `--format <md\|json>` | `md` | `json` for cron / further processing |
| `--no-paths` | off | Skip the common-sensitive-file checks (most conservative; pure header/TLS/DNS) |
| `--quiet` | off | Suppress progress logging |

Exit code is `2` when any **high** finding exists.

**What it checks:** HTTP→HTTPS redirect · TLS protocol + certificate (expiry, trust, issuer) · security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) · cookie flags (Secure/HttpOnly/SameSite) · SPF + DMARC + MX · security.txt · version/stack disclosure headers · mixed content on HTTPS pages · a fixed short list of commonly-exposed files (`.git/config`, `.env`, `server-status`, etc. — a single GET each, not enumeration).

## Step 3: Interpret & Prioritise

Read the report top-down. Severity guide:

- **high** — exploitable or exposing data now: no HTTPS redirect, expired/untrusted cert, weak TLS (1.0/1.1), a reachable `.git`/`.env`.
- **medium** — meaningful gap: missing HSTS or CSP, cookies without Secure/HttpOnly/SameSite, mixed content, cert expiring < 30 days.
- **low** — hardening: missing secondary headers, no SPF/DMARC, version disclosure, no security.txt.
- **info / positive** — what's already good (helps show progress between scans).

For *what each header does and the recommended value*, read `references/header-reference.md`. Translate findings into plain language for the user — explain the risk, not just the missing header. Lead with the highs; don't bury the one thing that matters under ten low-severity header nits.

## Step 4: Save the Report

Always write to `projects/tool-website-security/{YYYY-MM-DD}_{host}.md` (the `--out` flag creates the folder). Show the user the full absolute path. For repeat audits of the same site, keep dated reports so the grade trend is visible.

## Step 5: Collect Feedback

Ask whether the findings were useful and whether any are accepted-risk for this site (e.g., a deliberately frameable widget). Log accepted findings and site quirks to `context/learnings.md` → `## tool-website-security` so future scans of that host are interpreted in context.

## Schedule (optional)

Good fit for an `ops-cron` job to watch a domain over time (cert expiry creep, a header regressing after a deploy) using `--format json`. Offer this once if the user audits the same site repeatedly — catching a cert 30 days out beats finding it expired.

## Rules

*Updated automatically when the user flags an issue. Read before every run.*

- 2026-06-19: Passive only. Never add active probing (fuzzing, parameter injection, path brute-forcing) to this skill — that boundary is the whole reason it's safe to run on any site. Deeper testing needs explicit per-target authorisation and a different tool.
- 2026-06-19: Check SPF/DMARC on the apex domain, not the `www.` subdomain (records live on the registrable domain). Implemented via `apexDomain()`.
- 2026-06-19: Distinguish "DNS unavailable" (ECONNREFUSED/ENOTFOUND/etc.) from "record genuinely absent" — a failed resolver must NOT be reported as a missing SPF/DMARC record. Caught when DNS was sandboxed during a test run.
- 2026-06-19: Exposed-file checks must content-fingerprint the response, not just trust HTTP 200 — many hosts (e.g. ClickFunnels) serve a normal page with 200 for unknown paths (soft-404). `/server-status` on a ClickFunnels site was a false positive until each path got a body signature.
- 2026-06-19: Grade calibration — cap low-severity deductions and let any high finding cap the grade at D, so a site with strong fundamentals (HSTS/CSP/TLS1.3) isn't graded F over minor hardening nits.

## Self-Update

If the user flags a false positive (e.g., a custom 200 page counted as an exposed file) or a missed check, fix it: tighten the relevant check in `scripts/scan.cjs` or adjust severity, and record the correction in `## Rules` with today's date. Don't just log it — fix the skill.

## Troubleshooting

- **"Could not fetch site"** — host unreachable, blocking the User-Agent, or no outbound network. TLS/DNS checks still run. Try again, or check connectivity. WAFs (Cloudflare etc.) sometimes challenge non-browser agents — note it; the TLS/DNS/header data from the edge is still valid.
- **Everything shows missing behind a CDN** — some headers are added at the origin and stripped/added at the CDN edge. Interpret results as "what a visitor actually receives", which is what matters.
- **Exposed-file false positive** — a site returning 200 with a custom page for everything. The scanner does a crude body check, but if needed run with `--no-paths` and verify manually.
- **DNS lookups empty** — corporate DNS or split-horizon resolvers can return nothing. Re-run on a normal network if SPF/DMARC come back absent unexpectedly.
