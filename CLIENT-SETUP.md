# Got Moles — Agentic OS Setup

Your company's AI operating system: Claude Code with Got Moles' brand memory, methodologies, and skills built in. Each person on the team runs their own copy on their own computer, and everyone stays current by pulling from the shared GitHub repository.

## What you need first

1. **Claude Code** installed and signed in (https://claude.com/claude-code)
2. **Git** installed (https://git-scm.com — defaults are fine)
3. **Access to the Got Moles repository on GitHub** (invite comes from Roy — accept it from your email)

## First-time setup (one time, ~10 minutes)

Open a terminal (PowerShell on Windows) and run:

```
cd C:\
git clone https://github.com/Got-moles/Agentic-os-got-moles.git
cd Agentic-os-got-moles
```

Git will ask you to sign in to GitHub in the browser the first time.

Then create your personal keys file:

```
copy .env.example .env
```

Open `.env` in any text editor and add the API keys you've been given (each key has a comment explaining what it's for — leave blank anything you don't have; everything still works, some skills just tell you what a key would add).

Start the system:

```
claude
```

On first run it walks you through a short onboarding (`/start-here`) — this builds YOUR profile so the assistant knows who it's working with. Two people on the same repo each get their own profile, own memory, own preferences. Nothing personal is shared.

## Staying up to date

Whenever Roy publishes updates (new skills, brand documents, methodology improvements):

```
cd C:\agentic-os-got-moles
git pull
```

That's it. Your `.env`, your memory, and your local notes are never touched by an update — they live in files the repository deliberately doesn't manage.

**If `git pull` ever complains about local changes:** you (or Claude) edited a shared file directly. Ask Claude to "stash my local changes and pull the update" — or message Roy. The rule of thumb: put personal rules in `CLAUDE.local.md` (or a skill's `SKILL.local.md`), never edit the shared files, and pulls will always be clean.

## The rules of the road

- **Pull, don't push.** This repository is read-only for the team — updates flow from Roy. Your day-to-day work (content drafts, reports, session memory) lives on your machine.
- **Secrets stay in `.env`.** Never paste API keys into documents or skills.
- **The live website is managed separately.** The assistant knows not to deploy — website changes go live through Roy.

## Getting help

Ask Claude first — "what skills are installed", "how do I…" — it knows this system. Anything else: Roy.
