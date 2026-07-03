# Remediation Guide — tool-platform-security

How to fix each finding type. The golden rule for anything secret-related: **a credential that was ever committed, pushed, or shared is compromised — rotate it.** Removing it from the file hides it; rotating it at the provider invalidates the leaked value. Do both, in that order of importance.

## 1. Hardcoded secret (secrets check)

1. **Rotate first.** Generate a new key/token at the provider and revoke the old one. Do this before touching the code — while the old value is still in a file or in history, it's live.
2. **Move it to `.env`.** Replace the literal with `process.env.MY_KEY` (Node) / `os.environ["MY_KEY"]` (Python). Add the key to `.env` (gitignored) and document it in `.env.example` with a placeholder value only.
3. **Confirm `.env` is gitignored** and not tracked (`git ls-files | grep .env` should return nothing but `.env.example`).
4. If the secret was only ever in the working tree (never committed), steps 1–3 are enough. If it was committed, also do section 2.

## 2. Secret in git history (history check)

A secret in any past commit is recoverable by anyone with the repo, even if a later commit removed it.

1. **Rotate the credential** (always — this is the real fix; history rewriting is cleanup).
2. **Purge from history** if the repo is shared/public and you must remove it:
   - Preferred: [`git filter-repo`](https://github.com/newren/git-filter-repo) — `git filter-repo --replace-text <patterns.txt>` (each line `OLD==>REDACTED`).
   - Or BFG Repo-Cleaner for simple cases.
3. **Force-push** the rewritten history — coordinate with collaborators first, since it rewrites shared commits. (Note: this repo's policy is *never force-push `main`*; for a secret purge, treat it as an exception, communicate it, and re-clone afterwards.)
4. For a private solo repo where rotation is done, history rewriting is optional — the rotated key is already dead. Decide based on exposure.

## 3. Dependency vulnerabilities (deps check)

1. In the flagged directory, run `npm audit` to see the package list and severity detail.
2. `npm audit fix` resolves most non-breaking cases automatically.
3. `npm audit fix --force` pulls breaking major bumps — only with tests to catch regressions.
4. For a transitive dep with no direct fix, use an `overrides` field in `package.json` to pin a patched version, or update the parent package.
5. Re-run the audit to confirm the count dropped. Some advisories are dev-only or unreachable in your usage — note those in learnings rather than chasing zero blindly.

## 4. Config & permissions (config check)

- **`.env` / key / cert tracked by git** → `git rm --cached <file>`, add the pattern to `.gitignore`, commit, then rotate whatever it held (it's in history now — see section 2).
- **`.gitignore` missing patterns** → add `.env`, `*.pem`, `*.key`, `id_rsa`, `*.p12` (and `.env.local`, `.env.*.local`).
- **Overly broad permission allow rule** (`*`, `Bash(*)`) in `.claude/settings.json` → replace wildcards with scoped allows for the specific commands actually used. Broad allows defeat the point of the permission system.
- **Deny list doesn't cover `.env`** → add a deny rule so the agent can't read credential files even by accident.

## Verifying a clean run

After remediation, re-run the full audit. A green result (`0 high · 0 medium`) plus the report saved to `projects/tool-platform-security/` is the evidence the issues are closed. Keep the dated reports — the diff between runs is the audit trail.
