# Stack decision and deploy rules

The stack is decided once, in Phase 3, and written down. Re-opening it mid-build is the
most expensive avoidable rework in this process, so the decision document records not only
what was chosen but why, and who maintains the site afterwards.

---

## The house default

**Next.js 16 App Router with TypeScript, Tailwind v4 with CSS-first theme tokens, and
shadcn/ui components, hosted on Vercel with git push to deploy, one standalone repository
per site.** Add Payload CMS, self-hosted inside the same Next.js app, only when the client
will edit content themselves. Add Supabase whenever the build needs a database or
authentication, one dedicated project per app, never shared across apps or environments.

Why this is the default:

- **Rendering model fits the job.** Pages render statically at build time and serve from a
  content delivery network, which is what keeps Core Web Vitals in range and hosting cost
  near zero even at real traffic. Only admin and API routes stay dynamic.
- **Search and answer engines get real HTML.** Server rendering means the H1, the body copy
  and the JSON-LD are in the response, not assembled by client-side script.
- **The design system lands cleanly.** Tokens from `viz-design-system` map straight onto
  Tailwind theme variables, so what the design phase produced is literally what the build
  consumes.
- **One deployment surface.** With Payload inside the Next.js app there is no second service
  to host, secure or keep in sync.
- **Proven on shipped builds.** This exact stack is running in production across several
  sites in this workspace, so the failure modes are known and documented below rather than
  discovered again.

### Content model: static first, CMS by exception

Content lives in code by default, as typed data files or build-time-validated markdown with
schema-checked frontmatter. A CMS is added when, and only when, the client will edit content
without a developer. Record which it is and the reason. The wrong call here is felt for the
life of the site: a CMS nobody uses is maintenance burden with no benefit, and a static site
the client cannot edit becomes a support queue.

---

## When another platform is the better call

Recommend against the default, plainly, when the situation matches one of these. Choosing
the wrong platform to look consistent serves nobody.

| Situation | Platform | Why |
|---|---|---|
| Client's team already runs on it, edits daily, and has plugins doing real work | WordPress | Migration cost buys nothing they value. The editing workflow is the product for them. Harden it, do not replace it. |
| Content-heavy marketing site whose owner is a marketer, not a developer, and who wants to restructure pages without a deploy | Webflow | Visual editing with clean rendered output. Trade-off is a platform-shaped ceiling on custom behaviour, and hosting cost that scales with the plan. |
| Selling physical products with inventory, tax, shipping, discounts and payment | Shopify | Rebuilding commerce infrastructure is not a website project. Use Shopify and design within it, or run a headless front end against it only when a real requirement demands it. |
| A single campaign page with a short life and no ongoing content | Whatever ships fastest and is cheapest to delete | Do not stand up a repository and a hosting project for something that gets retired. |
| Membership, gated content, entitlements and payments | The default plus Supabase for auth and data | This is a product build, not a marketing site. It needs row-level security on every tenant table and entitlement checks in the database, not only in application code. |

Whatever is chosen, the rules below about deploys, secrets and shared databases still apply.

---

## Legacy sites that cannot be edited in-house

A common inherited situation: a working site built on an older React or Gatsby setup, with
no one able to change it, dependencies well out of date, and a build that may no longer run.

Do not start by rewriting. Work the decision in this order:

1. **Establish whether it still builds.** Clone it, install, build. A codebase that builds is
   a codebase that can be patched. One that does not is closer to a rebuild than it looks.
2. **Establish its ranking value.** Run the Phase 1 baseline. A legacy site carrying real
   search performance changes the risk calculus completely, because the rebuild now has to
   preserve something.
3. **Take the security and dependency position seriously.** An unmaintained build with old
   dependencies is an exposure, and it is often the honest argument for replacement.
4. **Then pick one of three paths, and write down which:**
   - **Patch in place.** It builds, the design is acceptable, and the need is a few content
     or performance fixes. Cheapest and most reversible.
   - **Rebuild the front end, keep the URLs.** The usual answer when the design is the
     problem but the search performance is not. Every ranking URL stays at its address. Full
     protocol in `seo-preservation.md`.
   - **Full rebuild with a migration.** The site is unmaintainable, or the information
     architecture itself is wrong. Highest risk, so it gets the full redirect discipline and
     the search owner's sign-off at G2 and G7.

Never let the answer be "we will keep the old site running alongside" without saying which
one is canonical. Two live copies of the same content compete with each other in search.

---

## Deploy rules

These are not preferences. Each one was paid for.

1. **Git push to the connected branch is the only deploy path.** Never a platform command
   line deploy. A command line deploy bypasses the pipeline and once returned a site-wide
   404 across an entire production site. If a deploy breaks the site, revert the commit and
   push the revert. Do not redeploy from the command line to fix it.
2. **Verify the framework preset before the first deploy.** A blank hosting project can
   default to a generic static preset and 404 every route. A suspiciously fast build is the
   symptom.
3. **Environment variables go into the host's dashboard before the first deploy.** Values
   live in the local environment file and the host's settings, never in git. The example
   file documents every variable by name only.
4. **Preview branches isolate code, not data.** A preview pointed at the production database
   is production. Seeds, migrations and fix scripts run against a shared database are
   production actions and get production care: dry run first, review the output, then apply.
5. **Deploying is not publishing.** Where content lives in a data store and pages are built
   statically, updating the store without a deploy leaves the live site stale. Both steps or
   neither.
6. **New content types need their storage before the deploy.** Adding a block or collection
   without its underlying tables builds fine and fails at runtime on a cold start.
7. **No content delivery proxy in front of the host.** It degrades bot protection, masks
   visitor addresses and double-caches.
8. **Non-production environments are noindexed sitewide.** A crawlable staging build with a
   sitemap pointing at the old site is a real launch blocker that has happened.
9. **Rate limiting and firewall rules on form endpoints and admin paths are launch
   blockers.** A scanner once sent over sixteen hundred requests in four seconds and
   exhausted a database connection pool on a live site.
10. **Security headers live in the framework config**, not in a host-level rule that gets
    lost on migration. The set: strict transport security, frame denial, no content type
    sniffing, a referrer policy, a permissions policy denying camera, microphone and
    location, and a content security policy started in report-only mode with an explicit
    allowlist for the tracking domains.

---

## Sources

Checked September 2026.

- Internal, verified against shipped production builds:
  `C:\Claude\agent-os-v3\agentic-os\projects\briefs\website-build-process\2026-08-10_atp-website-build-guide.md`
  Parts 1.2, 1.3 and 5.2, and
  `C:\Claude\agent-os-v3\agentic-os\clients\got-moles\projects\briefs\website-rebuild-rebrand\BUILD-METHODOLOGY.md`
  Tech Stack and Critical Build Rules.
- Core Web Vitals thresholds, LCP 2.5s, INP 200ms, CLS 0.1 at the 75th percentile over a
  28-day window, per Google's web vitals documentation.
- Brand Vision, Web Design Agency Process 2026, on build phase performance and accessibility
  targets. https://www.brandvm.com/post/web-design-agency-process-2026
