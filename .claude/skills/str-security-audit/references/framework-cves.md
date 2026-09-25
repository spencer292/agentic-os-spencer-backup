# Framework CVEs and Platform Caveats

Checked September 2026. Sources in `sources-2026-09.md`. Read this before grading. A live unpatched
framework CVE outranks every header finding in the report, and a headers-first audit will miss it.

Refresh this file on every currency pass. A CVE list ages faster than any other part of the audit, so
treat an entry older than a quarter as a prompt to re-check rather than as fact.

---

## React Server Components remote code execution, the 2025 to 2026 family

**CVE-2025-55182, known as React2Shell.** CVSS 10.0. Disclosed by Meta on 3 December 2025.
Unauthenticated remote code execution reachable over ordinary HTTP requests. The cause is React's
server-side Flight decoder failing to validate incoming payloads, so an attacker can inject objects
that get deserialised in a privileged server context.

Affected: React 19.0.0 through 19.2.0, and any framework built on React Server Components. That
includes Next.js, React Router in RSC mode, the Vite and Parcel RSC plugins, RedwoodSDK and Waku.

**CVE-2025-66478** was assigned to track the same defect in the Next.js context and was later rejected
as a duplicate, because the root cause is the upstream React one. Some scanners and advisories still
carry both identifiers, so do not report them as two separate findings.

Exploitation is not theoretical. Multiple threat clusters were observed exploiting it within days of
disclosure, deploying tunnellers, downloaders, backdoors and cryptocurrency miners. A newly generated
production Next.js application on an affected React version was vulnerable with no code changes at all.

**How to check.** Read the installed React version from the lockfile, not from `package.json` ranges.
Anything in 19.0.0 to 19.2.0 is a **Critical** finding on a site that renders Server Components, and
patching is the whole of Phase 1. Confirm the framework version pins a patched React rather than
resolving to an affected one transitively.

## Next.js middleware authorisation bypass

**CVE-2025-29927.** CVSS 9.1. Affects Next.js 11.1.4 through 15.2.2. A crafted
`x-middleware-subrequest` header makes middleware skip entirely, taking any authentication or
authorisation logic in it with it. Fixed in 15.2.3 and later.

Self-hosted deployments running `next start` with standalone output are the exposed shape. Managed
platforms varied in whether their edge stripped the header, so the deployment context changes the
severity rather than removing it.

**How to check.** Read the Next.js version from the lockfile. Then send the header against a route the
middleware is supposed to protect, and confirm the protection still holds.

## Next.js 16 renamed middleware to proxy

Next.js 16 renames `middleware.ts` to `proxy.ts`. The rename is deliberate, and the reason matters for
this audit: the layer was never a security boundary, and treating it as one produced the bypass above.

Audit rule for any Next.js 16 codebase:

- Find every authorisation check that lives only in `proxy.ts`. Each is a **High** finding on its own,
  independent of any CVE.
- The check belongs in the Server Action, the Route Handler or the data-access layer, where it runs
  regardless of what happens at the edge. A proxy-layer check is a redirect for user experience, not
  an access control.
- A codebase that migrated `middleware.ts` to `proxy.ts` by renaming the file has usually carried the
  same assumption across. Read what the file actually gates.

## Supply chain: the npm worm campaigns

Self-propagating npm worms have hit the registry in repeated waves since late 2025, spreading through
stolen maintainer credentials and republishing infected versions of every package a compromised
maintainer controls. One wave took several hundred packages with billions of monthly installs inside
an hour. Widely used utility packages have been in scope, so "we only use popular dependencies" is not
a defence.

Audit checks that follow from this, in `dependency-audit.md`:

- A lockfile is committed and installs run against it, so integrity hashes are verified on every install.
- CI installs with a lockfile-respecting command rather than a resolving one.
- `npm audit signatures` passes, and provenance attestation is checked where publishers provide it.
- Postinstall scripts across the tree are reviewed, since that is how these worms execute.
- Any package the current campaign advisories name is checked by exact installed version, not by name.

Treat a compromised transitive version as **Critical** when it is in the production install, since the
payload targets credentials on the build machine as well as the runtime.

## What to record

For every entry above, the report states the installed version found, where it was read from, whether
the site is in the affected shape, and the fix path. "Not applicable, this site does not use Server
Components" is a valid and useful finding. "Probably fine" is not.
