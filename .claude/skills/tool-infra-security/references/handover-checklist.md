# Handover Checklist — Credential Separation & Blast Radius

Read this at handover time. It turns a host audit into a handover decision. The core idea: **the moment a box changes owner, every secret on it changes meaning.** A key that was fine while you ran the box becomes a liability the instant someone else does.

## The three fates of a secret

Every secret found on the box gets exactly one:

1. **Transfer** — it belongs to the recipient's own systems (their Supabase project, their domain's mail, their Stripe). It stays. Confirm the recipient actually controls the underlying account, or you've handed them a dependency on you.
2. **Rotate + remove** — it's a shared or app-level secret that will keep working after handover but still traces to your account or bills you (a model API key, a scraping key, a third-party token issued under your login). The recipient must issue their own; yours is rotated so the old value dies, then removed from the box.
3. **Remove** — it's purely yours and never had any business being on a box you're giving away (your personal Gmail OAuth, your backup-repo token, your Tailscale auth key, SSH keys authorising *you* into *your* other machines). Off the box entirely.

If you can't decide between Transfer and Rotate, it's Rotate. The safe default at a trust boundary is "assume it leaks."

## Blast radius

For each secret, ask: **if this box is compromised the day after handover, what does this key reach?**

- A key that reaches only the recipient's own resources → contained, their risk to manage.
- A key that reaches *your* accounts, *your* other servers, *your* billing → that's the blast radius that must be zero before you hand over. It is the reason Rotate+Remove exists.

Write the worst case in one plain sentence in the report: "If this box were taken over tomorrow, the attacker would reach ___." Then make sure the answer is "only things that are now theirs."

## Access separation

- Remove your own `authorized_keys` from the box (or confirm you intend continued access, and that the recipient knows).
- Remove Tailscale auth that ties the box to *your* tailnet if it's leaving your network.
- Confirm the recipient has their own login path before you remove yours — don't lock them out or strand yourself.

## The identity split (for boxes that keep running an agent/OS)

If the box runs an Agentic OS install or any automation after handover:

- The identity that can change **application code** should not be the same identity that can change **infrastructure / credentials / the review gate** without a second pair of eyes. (This mirrors the release-assurance "don't let the agent weaken its own gate" rule, applied to a host.)
- The agent's unattended powers travel with the box. Enumerate them: which crons run, what each can do (deploy? email? spend on an API?), and what the worst unattended hour looks like on the recipient's watch. The recipient is inheriting those powers — they must know what they are.

## Handover sign-off buckets

Close the report by sorting every outstanding item into the operating rules' three buckets, so nothing blocks silently after you've stepped away:

1. **Needs a decision** — a shared secret whose split needs the recipient's input; whether you keep any access.
2. **Pauses if not done** — a rotate that must happen before cutover or a service breaks; a backup that must be re-pointed at the recipient's storage.
3. **Can stall silently** — a third-party key that keeps working on the old value until someone notices; a backup that stops without erroring. Name how each is detected.
