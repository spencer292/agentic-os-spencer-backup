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

On first run, tell the assistant who you are — for example: **"I'm Spencer — load my profile."** Ready-made team profiles ship in `context/profiles/`; the assistant copies yours into place as your personal `context/USER.md` and works for YOU from then on. Two people on the same repo each get their own profile, own memory, own preferences — nothing personal is shared. (Joining the team and don't have a profile yet? Say `/start-here` and it will interview you instead.)

## Staying up to date

Whenever Roy publishes updates (new skills, brand documents, methodology improvements), open a terminal in your install folder and run:

```
bash scripts/gm-update.sh
```

Or just tell Claude: **"update the Got Moles OS"**. The script fetches the shared repo, shows you anything that could clash with your own changes, merges the update on top of your commits, and refreshes dependencies. Want a preview first? `bash scripts/gm-update.sh --check` changes nothing.

Your `.env`, your memory, your daily logs, your own projects and cron jobs are never part of an update — they live in files the shared repository does not carry — so they are never overwritten.

**Why not plain `git pull`?** Your install has its own history of commits (every wrap-up is one), so modern git refuses a bare pull on a diverged branch. The script does the safe fetch-then-merge for you. If it ever stops on a conflict, nothing is lost: `git merge --abort` puts you back exactly where you were, and Claude can resolve it ("take origin for shared OS files, keep mine for my own files").

## Personal backup (one-time, per team member)

Your session memory, learnings, and work output get committed on your machine (the assistant does this when you wrap up a session) and backed up to a private GitHub repo that belongs to YOU — completely separate from the shared company repo, which stays read-only.

1. On your own GitHub account, create a **private** repo named `agentic-os-{yourname}-backup` (empty — no README).
2. In your install folder, run (swap in your account and repo name):

```
git remote set-url --push origin DISABLED
git remote add backup https://github.com/{YOUR-ACCOUNT}/agentic-os-{yourname}-backup.git
git config remote.pushDefault backup
git config pull.rebase true
git push backup main
```

What this does: pulls still come FROM the company repo; pushes now go TO your backup — and pushing to the company repo becomes physically impossible from your machine. Your assistant knows this setup and wraps up accordingly.

## The rules of the road

- **Pull, don't push.** This repository is read-only for the team — updates flow from Roy via `scripts/gm-update.sh`. Your day-to-day work (content drafts, reports, session memory) lives on your machine and in your personal backup.
- **Secrets stay in `.env`.** Never paste API keys into documents or skills.
- **The live website is managed separately.** The assistant knows not to deploy — website changes go live through Roy.

## Getting help

Ask Claude first — "what skills are installed", "how do I…" — it knows this system. Anything else: Roy.
