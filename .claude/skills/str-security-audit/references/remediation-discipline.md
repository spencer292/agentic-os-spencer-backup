# Phased Remediation Discipline

Mandatory for any production site. Apply-fixes mode follows this exactly. Every rule exists because
skipping it has broken a live site.

## Rule A: one phase at a time

Never bulk-apply the remediation checklist. One phase is one logical change. Finish it, verify it, watch
it, then move on. Two changes in one deploy means a regression cannot be attributed, and the revert
takes the good change with the bad one.

## Rule B: the only flow per phase

1. **Baseline.** Record the current commit and capture the current state, meaning the probe output, the
   header dump or the audit snapshot the phase is meant to change. This proves the delta and makes the
   revert clean.
2. **Confirm.** State the change, the test and the revert path. Get an explicit go-ahead. Never edit,
   commit or push without one.
3. **Edit.** Make the smallest change that closes the finding. Nothing else rides along.
4. **Build.** The production build must pass locally. Never push a broken build.
5. **Test locally.** Smoke-test the affected surface, including whatever the change could plausibly
   break rather than only what it was meant to fix.
6. **Commit and push.** A descriptive message referencing the audit and the phase. Push so the work is
   backed up. Read the client `AGENTS.md` for how a change actually reaches production, and follow it.
   Where shipping needs a step someone else performs, say so and report the change as staged, not
   deployed.
7. **Verify deployed.** Once the change is genuinely live, re-run the relevant probe against production.
   Confirm the finding is closed and nothing else regressed. A commit is not a deploy.
8. **Monitor.** Watch deploy logs and analytics for the agreed window before starting the next phase.
9. **If broken.** Revert and push immediately. Diagnose before retrying. Never push through repeated
   errors hoping the next one lands.

## Rule C: enforcement flips go to preview first

Any change moving from observe-mode to enforce-mode can break something that was silently tolerated.
That includes a content security policy moving from report-only to enforcing, SPF moving from soft-fail
to hard-fail, and DMARC moving from monitoring to quarantine or reject.

Deploy to a preview or staging environment first. Observe. Fix the allowlist or the sending inventory.
Then promote. Never flip enforcement straight to production.

## Rule D: dependency bumps are their own phase

Never bundle a dependency bump with feature work or with other security fixes. Patch-level bumps across
several small packages can share one phase. Minor and major framework bumps are each isolated, each with
a full local build and a smoke test covering the admin surface, authentication and a sample of public
pages before the push. Read the changelog for breaking changes first.

## Rule E: DNS changes are usually a handoff

Email authentication and certificate authority records live in a DNS control panel, not the codebase.
Try a provider API or CLI path first. Where none exists, produce the exact records to add, remove or
change, name the panel, name who holds access, and hand it off explicitly. Never report a DNS change as
shipped when it is waiting on someone else. Report it as handed off, and name them.

## Rule F: a re-audit runs the real probe

Re-scoring after a phase ships means running the probe again, not projecting the improvement. "That fix
should take us to an A" is not evidence. If that sentence forms, stop and run the probe. The re-audit is
bound by Rule G exactly as the original audit was.

## Rule G: evidence in the report

Every finding in the saved report carries its evidence inline: the header value returned, the DNS record
as queried, the audit line, the probe response, the file path and line. A finding with no evidence is an
assertion. Re-run the probe before saving rather than writing from memory.

The same rule applies to a Pass. "TLS 1.3 with a valid chain, expiring in March" is a Pass with
evidence. "TLS looks fine" is not.

## What this discipline is protecting against

A security fix touches the layer everything else depends on. A wrong header takes the site down for
every visitor at once. An SPF hard-fail silently stops the client's invoices reaching customers, and
nobody notices for a week. A framework bump to close one advisory introduces three regressions in the
admin panel. None of these are hypothetical, and all of them are cheap to avoid by going one at a time
and verifying against production rather than against intent.

## Troubleshooting

- **No codebase access:** run black-box mode. Areas 6, 8 and 10 go in the scope section as needing code.
- **The probe is blocked:** that is itself a positive finding. Note it, fall back to manual requests and
  DNS queries, document what was reachable.
- **Advisories with no fix path:** scope them by where the code actually runs, then document the
  accept-risk decision with a named owner.
- **A CSP flip breaks the site:** revert immediately. The blocked scripts in the preview violation log
  are the allowlist entries that were missed.
- **A DNS change did not take:** re-query after the time-to-live window, and confirm the right zone.
