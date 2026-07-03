# Dependency Vulnerability Audit

## Area 6 — Dependencies (needs codebase access)

Run from the project root:

```bash
npm audit --json > pre-patch-audit.json
git rev-parse HEAD            # baseline for revert
```

`npm audit` reports advisories against the installed dependency tree. Don't take its severity labels at face value — **scope each vuln** before assigning your own severity.

## Scoping — where does the vulnerable code actually run?

| Scope | Real severity | Why |
|-------|---------------|-----|
| Production runtime bundle | as reported (High → High) | attacker-reachable on the live site |
| Build-time only (bundler, postcss, esbuild dev server) | downgrade ~1 level | not in the shipped artifact; dev-server vulns need local network access |
| Admin-surface only (e.g. monaco-editor in a CMS admin) | downgrade ~1 level | gated behind admin auth, not public |
| Dev dependency, never shipped | Low | not attacker-reachable in prod |

A "High" `npm audit` finding in a dev-only tool is a Low in the report. A "Moderate" in the production request path may be a High. Always state the scope reasoning in the finding.

## Fix-path mapping

For each vuln, map the actual fix path — `npm audit fix` alone is often insufficient:

- **Direct dependency** — bump the version. Check the changelog for breaking changes.
- **Transitive dependency** — find which parent pins it. Often the fix is bumping the *parent* (e.g. a Payload sub-package vuln is fixed by bumping `@payloadcms/*`, not the sub-package directly).
- **`npm audit fix` stops short** — it only applies semver-compatible bumps. If the fix needs a minor/major bump it won't apply it; you do that explicitly.
- **No fix available** — document it, scope it, decide accept-risk vs. find-alternative.

## Framework bumps are their own phase (Rule D)

Never bundle a framework bump (Next.js, Payload, React) with other security fixes or feature work — it compounds the regression surface. Each framework bump:

1. Read the changelog between current and target version for breaking changes.
2. `npm install {pkg}@{target}` — bump the framework AND its peer-pinned siblings together (e.g. all `@payloadcms/*` packages move in lockstep).
3. `npm run build` locally — fix any TypeScript / API changes the bump introduces.
4. `npm audit` again — confirm the target vulns are actually resolved.
5. Smoke-test locally: admin panel loads + login works, a sample of public pages render.
6. Push as its own commit. Verify the deploy. Monitor.
7. If broken: `git revert`, push, diagnose before retrying.

Patch-level bumps (`x.y.Z`) across several small packages can be grouped into one phase. Minor/major framework bumps are each isolated.

## Output for the report

Per vuln: package, installed version, advisory ID, `npm audit` severity, **scoped** severity + reasoning, fix path (exact command), whether it's its own phase or groupable.
