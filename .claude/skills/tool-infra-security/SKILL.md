---
name: tool-infra-security
description: >
  Read-only security audit of a HOST — a server, VPS, or the machine an app runs on — covering
  network surface, SSH/access, on-box secret inventory and blast radius, running services,
  backup/recovery, and patch posture. Two modes: run ON the box (local) or point it at an SSH
  endpoint (remote). Built for handing a server to a client or team: it answers what can reach this
  box, who can log in, which secrets live here and whose they are, and what happens if it is
  compromised or reboots. Triggers on: "audit this server", "audit the VPS", "host security", "is
  this box safe to hand over", "check the SSH config", "what ports are open", "secrets inventory on
  the server", "handover readiness", "infra security", "harden this VPS". Use before ANY server
  handover and periodically on always-on boxes. Does NOT audit source code
  (tool-platform-security), a live website (tool-website-security), or a repo's release process
  (ops-repo-assessment).
---

# Host / Infrastructure Security

Passive, read-only audit of a server or environment. It looks at what the box itself reveals — listening ports, SSH config, the secrets sitting on disk, what runs on boot, whether recovery exists — and grades it for the one moment that matters most: **handing that box to someone else.**

This is deliberately non-destructive. It never installs, changes a setting, rotates a key, or restarts a service. A clean result means "nothing dangerous was visible to a read-only look" — it is not a penetration test.

## Outcome

A graded, prioritised markdown report at `projects/tool-infra-security/{YYYY-MM-DD}_{host}.md` — a letter grade (A–F), severity-grouped findings, a **handover-readiness verdict** (READY / CONDITIONS / NOT READY), and for every secret found: whose it is and what happens to it at handover (transfer / rotate / remove). Always save the report and show the user the full absolute path. This is not optional.

The report's findings use the same structured format as `ops-release-assurance` (severity · confidence · finding · why it matters · remediation · blocking) so a host finding and a code finding read the same in an evidence package.

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `context/learnings.md` | `## tool-infra-security` section | Accepted findings, per-host quirks, what "normal" looks like for this box |
| `references/handover-checklist.md` | full, at handover time | The credential-separation + blast-radius model that makes a handover report honest |

## Dependencies

| Tool | Required? | What it provides | Without it |
|------|-----------|------------------|------------|
| `bash` + coreutils on the target | Yes | the scan script runs standard read-only probes (`ss`, `systemctl`, `find`, `getent`) | can't collect evidence; on a non-Linux target, collect manually against the same checklist |
| SSH key access to the target | Remote mode only | run the probes over SSH from this machine | use local mode: SSH in yourself, run the script on the box |

## Skill Relationships

- **Siblings (same domain, different surface):** `tool-platform-security` audits source code you own; `tool-website-security` audits a live site over HTTP. **This audits the host they run on.** The three together are the full picture; each alone is one layer.
- **Feeds:** `ops-release-assurance` — a host finding here can be attached to a release evidence package. **Feeds:** the VPS handover brief — this skill's handover verdict is the security half of the cutover decision.
- **Trigger boundary:** "audit my site" + a URL → `tool-website-security`. "audit my repo/code" → `tool-platform-security`. "audit my server/VPS/box" → here.

## Before You Start

Establish two things, because they change how every finding is graded:

1. **Is this a handover, or routine hygiene?** A handover audit grades against "safe to give someone else" — credential separation and blast radius dominate. A routine audit grades against "safe to keep running" — patch posture and drift dominate. Ask if unclear.
2. **Whose box is it becoming?** For a handover, name the recipient (a client, a teammate). Every secret found gets classified against them: theirs to keep, yours to rotate-and-remove, or shared-and-must-be-split. Without a named recipient the secret inventory is just a list; with one it's an action plan.

## Step 1: Read Prior Context

Read the `## tool-infra-security` section of `context/learnings.md`. A box audited before will have accepted findings ("port 3001 is the Command Centre, bound to Tailscale only, intended") — without that history you will re-flag intended things as faults, and a report that cries wolf stops being read. If this is a handover, also read `references/handover-checklist.md` now.

## Step 2: Collect Evidence

Run the read-only collector. It judges nothing — it gathers facts.

```bash
# On the box (you SSH'd in) — the honest way, sees everything:
bash .claude/skills/tool-infra-security/scripts/host-scan.sh --json > /tmp/host-evidence.json

# Or from this machine, over SSH (needs key access):
bash .claude/skills/tool-infra-security/scripts/host-scan.sh --remote user@host --json > /tmp/host-evidence.json
```

Prefer **local mode for a handover** — some checks (world-readable secrets, per-user crontabs, authorized_keys) only see the whole truth when run on the box as a user who can read them. Note in the report which mode you used; remote mode is "what SSH could see", not "what is there".

The collector covers seven areas: identity/OS · network surface · access/SSH · **credential inventory (names and locations only, never values)** · services/boot · recovery/backup · patch posture. If any probe returns "(unreadable)", say so in the report — missing evidence is a finding in itself (you cannot certify what you could not see), not a silent pass.

## Step 3: Grade the Evidence

Read `references/grading-rubric.md` for the full severity model. The shape of it:

- **high** — reachable now or a live handover hazard: password SSH auth enabled, root login permitted, a secret world-readable or committed to git, a database/admin port bound to `0.0.0.0` with no firewall, no backup at all on a box holding the only copy of client data.
- **medium** — a real gap: firewall absent but nothing dangerous exposed, unattended-upgrades off, a shared secret that will need splitting at handover, SSH on default port with password auth off (hardening, not hole).
- **low** — hardening: no swap, patch backlog, no `fail2ban`, verbose service banners.
- **info / positive** — what's already right (Tailscale-only binds, key-only SSH, rclone backup present). Record these — a handover report that only lists faults understates a well-built box and the recipient trusts it less, not more.

**The two judgement calls that matter most:**

- **Public vs private binds.** A port on `0.0.0.0` is only a finding if it's actually reachable from the internet. A box behind Tailscale with no public IPv4 can bind widely and be safe. Cross-check `network.public_binds` against `network.tailscale` and `network.public_ip` before calling anything exposed — the VPS model here is "no public surface", not "hardened public surface", so the question is *reachability*, not *bind address*.
- **Secrets: whose, and what happens at handover.** For every item in `secrets.env_files` / `secrets.env_var_names`, classify against the named recipient (Step Before-You-Start #2). This is the heart of a handover audit — see Step 4.

## Step 4: The Handover Ledger (handover audits only)

This is the section the recipient and the outgoing operator both need, and it is what `references/handover-checklist.md` exists for. For every secret found, produce a row:

| Secret (name only) | Location | Whose | Action at handover |
|---|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | `/srv/app/.env` | client's project | **Transfer** — stays, recipient owns it |
| `ANTHROPIC_API_KEY` | `/srv/app/.env` | your account | **Rotate + remove** — it bills you; recipient issues their own |
| `GMAIL_OAUTH_*` | `/opt/os/.env` | your identity | **Remove** — never belongs on the recipient's box |

The blast-radius question follows from it: if this box were compromised the day after handover, which of your other systems does a leaked secret here reach? Anything that reaches *your* accounts after the box is *theirs* is a rotate-and-remove, not a transfer. State the worst case plainly.

## Step 5: Verdict

Close with one of three, and the reason in a sentence:

- **READY** — no high finding; secret ledger is clean (nothing of yours left billing or reachable); recovery exists.
- **CONDITIONS** — ready once a named, short list is done (rotate these keys, close this port, enable the firewall). List them as imperatives.
- **NOT READY** — a high finding stands, or your credentials would leave with the box. Name the blocker.

For a handover, map the verdict to the three buckets the operating rules use for unattended work: what needs the user's decision, what pauses if unhandled, what can stall silently. The cutover gates on this verdict — say so.

## Step 6: Save the Report

Write to `projects/tool-infra-security/{YYYY-MM-DD}_{host}.md` (create the folder if needed). Show the user the full absolute path. For a box audited repeatedly, keep dated reports so drift is visible between them. **Never write a secret value into the report** — names, locations, and ownership only. If you ever need to prove a key works, that is a separate masked live-call check, not this audit.

## Step 7: Feedback

Ask whether the findings were fair and which are accepted-risk for this host (an intended open port, a service that must run as root). Log accepted findings and the box's "normal" to `context/learnings.md` → `## tool-infra-security` with the date, so the next audit of this host starts from truth instead of re-litigating settled calls.

## Schedule (optional)

A good `ops-cron` fit for an always-on box: run `--json` weekly and diff against the last run, so a newly-opened port, a freshly world-readable secret, or a backup that silently stopped is caught as drift. Offer this once if the same host is audited more than twice.

## Rules

*Read before every run. Updated when the user flags a miss.*

- 2026-08-18: Never print, log, or write a secret VALUE anywhere — names, paths, and ownership only. The collector already redacts env values; keep it that way. Exposing a value in the report defeats the audit's own purpose and puts it in the transcript and git.
- 2026-08-18: A bind to `0.0.0.0` is not automatically a finding. Judge by reachability — cross-check against Tailscale status and whether the box has a public IP. The VPS model here is "no public surface", so flag *reachable* services, not bind addresses. Flagging a Tailscale-only bind as "exposed" is the fastest way to lose the reader's trust.
- 2026-08-18: Distinguish "could not read" from "not present". A probe returning unreadable is a finding (incomplete evidence — you cannot certify what you did not see), never a silent pass. Say which mode (local/remote) was used and what it could not reach.
- 2026-08-18: For a handover, every secret gets an owner and a handover action. A secret inventory without the "whose / what happens at handover" columns is half a finding — the recipient can't act on it and the outgoing operator doesn't know what to rotate.

## Self-Update

If the user flags a false positive (an intended open port graded as exposed, a service that legitimately runs as root) or a missed check (a secret store the collector didn't look in, a firewall the probe couldn't read), fix it: adjust the grading judgement in this SKILL.md or add a probe to `scripts/host-scan.sh`, and record the correction in `## Rules` with today's date. Don't just log it — fix the skill so the next audit is sharper.

## Troubleshooting

- **Remote mode returns almost nothing** — the SSH user can't read `sshd_config`, other users' `authorized_keys`, or world-restricted secret files. That's expected; it's why local mode is preferred for a handover. Re-run on the box as a user with read access, and mark the remote pass as "edge view only".
- **`ss`/`systemctl` absent** — non-systemd or minimal host. The script falls back (`netstat`) where it can; for the rest, collect manually against the same seven areas and note the gaps.
- **Windows or non-Linux target** — the bash collector won't run. Audit manually against the seven areas (this repo's own always-on host is Windows — ports via `Get-NetTCPConnection`, services via `Get-Service`, secrets via the known `.env` locations) and grade with the same rubric.
- **Everything looks exposed** — you're almost certainly reading bind addresses as reachability. Re-read Rule 2 and cross-check the firewall/Tailscale evidence before grading.
