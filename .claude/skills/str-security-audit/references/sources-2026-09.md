# Sources and Verification Log

Every standard, threshold and advisory this skill cites, with its source and the month checked.
Re-verify on the next currency pass. A security reference ages faster than any other kind, so an entry
older than a quarter is a prompt to re-check rather than a fact to repeat.

Checked: September 2026.

## Standards and frameworks

| Claim | Verdict | Source |
|-------|---------|--------|
| OWASP Top 10 2025 is the current list, announced November 2025 and finalised January 2026 | Confirmed | https://owasp.org/Top10/2025/ |
| Broken Access Control remains first and now absorbs server-side request forgery | Confirmed | https://owasp.org/Top10/2025/ |
| Security Misconfiguration moved from fifth to second | Confirmed | https://orca.security/resources/blog/owasp-top-10-2025-key-changes/ |
| Software Supply Chain Failures is a new top-three category, broadened from the old components category | Confirmed | https://about.gitlab.com/blog/2025-owasp-top-10-whats-changed-and-why-it-matters/ |
| Mishandling of Exceptional Conditions is a new category | Confirmed | https://www.parasoft.com/blog/owasp-top-10/ |
| MDN HTTP Observatory scores from a 100 baseline with per-test modifiers, heaviest deductions on missing CSP, HSTS and framing defence | Confirmed | https://developer.mozilla.org/en-US/observatory |
| CSP Level 3 nonces with `strict-dynamic` are the current best practice, and adoption remains low | Confirmed | https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html and https://www.checkfast.io/blog/securing-headers-csp-hsts-2026 |
| `strict-dynamic` extends nonce or hash trust to transitively loaded scripts, and is widely supported in modern browsers | Confirmed | https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src |

## Framework advisories

| Claim | Verdict | Source |
|-------|---------|--------|
| CVE-2025-55182, React2Shell, CVSS 10.0, unauthenticated remote code execution in React Server Components, disclosed 3 December 2025 | Confirmed | https://www.rapid7.com/blog/post/etr-react2shell-cve-2025-55182-critical-unauthenticated-rce-affecting-react-server-components/ |
| Affects React 19.0.0 to 19.2.0 and every RSC-based framework, including Next.js, React Router in RSC mode, the Vite and Parcel RSC plugins, RedwoodSDK and Waku | Confirmed | https://unit42.paloaltonetworks.com/cve-2025-55182-react-and-cve-2025-66478-next/ |
| CVE-2025-66478 was assigned for the Next.js context and later rejected as a duplicate of CVE-2025-55182 | Confirmed | https://unit42.paloaltonetworks.com/cve-2025-55182-react-and-cve-2025-66478-next/ and https://nextjs.org/blog/CVE-2025-66478 |
| Widely exploited within days, with multiple threat clusters deploying tunnellers, backdoors and miners | Confirmed | https://cloud.google.com/blog/topics/threat-intelligence/threat-actors-exploit-react2shell-cve-2025-55182 |
| A freshly generated production Next.js app on an affected React version was vulnerable with no code changes | Confirmed | https://www.praetorian.com/blog/critical-advisory-remote-code-execution-in-next-js-cve-2025-66478-with-working-exploit/ |
| CVE-2025-29927, CVSS 9.1, Next.js middleware authorisation bypass via a spoofed `x-middleware-subrequest` header, affecting 11.1.4 to 15.2.2, fixed in 15.2.3 | Confirmed | https://projectdiscovery.io/blog/nextjs-middleware-authorization-bypass and https://securitylabs.datadoghq.com/articles/nextjs-middleware-auth-bypass/ |
| Self-hosted deployments using standalone output were the exposed shape, with platform behaviour varying | Confirmed | https://www.zscaler.com/blogs/security-research/cve-2025-29927-next-js-middleware-authorization-bypass-flaw |
| Next.js 16 renames `middleware.ts` to `proxy.ts`, and the layer is not a security boundary. Authorisation belongs in Server Actions, Route Handlers and the data layer | Confirmed | https://www.rabinarayanpatra.com/blogs/hello-proxy-ts-nextjs-16 and https://www.nexgismo.com/blog/nextjs-16-auth-security-mistakes-2026 |

## Supply chain

| Claim | Verdict | Source |
|-------|---------|--------|
| Self-propagating npm worms have hit the registry in repeated waves since late 2025, spreading through stolen maintainer credentials | Confirmed | https://unit42.paloaltonetworks.com/npm-supply-chain-attack/ |
| One 2026 wave compromised several hundred packages with more than two billion monthly installs in under an hour | Confirmed | https://www.armorcode.com/blog/shai-hulud-npm-supply-chain-attack-keyv-flat-cache and https://www.csa.gov.sg/alerts-and-advisories/advisories/ad-2026-009/ |
| Widely used utility packages were in scope, so popularity is not a defence | Confirmed | as above |
| Lockfiles pin exact versions and carry integrity hashes verified on install | Confirmed | https://bastion.tech/blog/npm-supply-chain-attacks-2026-saas-security-guide |
| npm supports provenance attestation proving a package was built from a specific commit in a verified pipeline | Confirmed | as above |

## What changed from the previous version of this skill

- Added the OWASP Top 10 2025 mapping. The earlier version referenced a 2021 to 2025 comparison in a
  general reference file that is no longer carried here.
- Added `framework-cves.md`, because the highest-severity findings of the last year were framework
  advisories rather than header gaps, and a headers-first audit misses them entirely.
- Raised CSP guidance from "enforcing with an allowlist" to "nonce-based with `strict-dynamic`" as the
  target state.
- Added the supply-chain half of the dependency audit: lockfile integrity, signature verification,
  provenance, postinstall review.
- Removed the platform and agent-security reference that shipped alongside the client version. Auditing
  this workspace's own configuration, keys, hooks and cron agents belongs to `tool-platform-security`,
  not to a website audit.
- Removed the code-pattern grep reference for the same reason. Scanning a repository for hardcoded
  secrets and injection patterns is `tool-platform-security`, and keeping a second copy here meant two
  lists drifting apart.
