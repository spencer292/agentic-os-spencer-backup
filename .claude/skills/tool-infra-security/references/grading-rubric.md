# Host Grading Rubric

The severity model for `tool-infra-security`. Grade evidence against these, and always in the context of the audit's purpose (handover vs routine — set in Before You Start).

## Letter grade

Start at A. Apply the largest applicable deduction per area, not the sum of every nit:

- Any **high** finding caps the grade at **D**.
- Each **medium** drops one grade (B→C→D), floored so a box with strong fundamentals and one gap isn't graded F.
- **low** findings are capped in aggregate at a single grade step — a pile of hardening nits on an otherwise sound box is a B, not an F.
- A handover audit with your credentials still on the box after handover cannot grade above **C** regardless of other strengths — that's the point of the exercise.

## Severity by area

### Network surface
- **high** — a database, admin panel, or app management port reachable from the public internet with no auth/firewall.
- **medium** — no firewall configured, but nothing dangerous is actually reachable (e.g. everything is Tailscale-only).
- **low** — SSH on the default port (with password auth already off), verbose service banners.
- **positive** — no public IPv4 / Tailscale-only; firewall default-deny inbound.
- **Judgement:** reachability, not bind address. `0.0.0.0` behind Tailscale with no public IP is safe.

### Access / SSH
- **high** — `PasswordAuthentication yes`, `PermitRootLogin yes`, or `PermitEmptyPasswords yes` on an internet-reachable box.
- **medium** — root login by key allowed (prefer a sudo user), no `AllowUsers`/`AllowGroups` allowlist, many login-capable accounts of unknown purpose.
- **low** — default port, no `fail2ban`.
- **positive** — key-only, no root login, explicit allowlist, few accounts.

### Credentials / secrets (the handover core)
- **high** — a secret world-readable, or committed to a git repo on the box, or a secret of YOURS that remains after handover and still bills/authorises against your accounts.
- **medium** — a secret shared between you and the recipient that must be split; a secret with no owner assigned.
- **low** — secrets present but correctly scoped and owned; `.env` mode `600` — note as positive if so.
- **Never** print a value. Names, paths, ownership only.

### Services / boot
- **high** — an unknown/unexpected service listening publicly; an agent/automation running with production credentials and no bound on what it can do unattended.
- **medium** — many services enabled on boot with unclear purpose; an automation that can act (deploy, email, post) without a review gate.
- **low** — non-essential services running.
- **positive** — minimal enabled set, each accounted for.

### Recovery
- **high** — the box holds the only copy of client data and has no backup at all.
- **medium** — backup configured but never verified by restore; no swap on a memory-tight box doing renders/builds.
- **low** — local-only backups (same failure domain as the data).
- **positive** — off-box backup present and a restore has been proven.

### Patch posture
- **medium** — reboot-required flag set and ignored; security updates pending for weeks.
- **low** — general patch backlog; unattended-upgrades not configured.
- **positive** — unattended security upgrades on, no reboot pending.

## Handover overlay

For a handover audit, re-rank everything by one question: **after the box is theirs, does anything here still reach me?** Any "yes" is high, regardless of its base severity — a perfectly-scoped, mode-600, non-exposed API key is still a high finding if it's *your* key on *their* box, because it bills you and a compromise of their box compromises your account. That reframing is the whole reason this audit exists at handover.
