---
name: tool-browser
description: Drive a real, visible Chrome window Claude can control — navigate, screenshot, read page text/HTML, click, type, press keys, and run JS — on a persistent dedicated profile so logins to platforms (LinkedIn, X/Twitter, Instagram, Facebook, YouTube, TikTok, Reddit, and any web app) survive across sessions. Use whenever the task needs a live browser: "open a browser", "log into LinkedIn", "look at my LinkedIn feed", "check this on X/Twitter/Instagram", "screenshot this while logged in", "browse to", "navigate to", "click this in the browser", "review my social profile", "what does this page look like when signed in", "drive Chrome", "use the browser". Read-only browsing and screenshots run freely; any action that WRITES on a platform (post, comment, DM, like, follow/connect, submit a form, change settings) is a mutation that needs explicit user confirmation first. Does NOT trigger for one-shot public-page scraping where no login/interaction is needed (use tool-firecrawl-scraper or tool-web-screenshot), nor for posting via official APIs (tool-zernio-social, mkt-short-form-posting).
---

# tool-browser — Drive a real Chrome window

A zero-dependency Chrome DevTools Protocol (CDP) driver. Node 22+ ships a built-in
`WebSocket` and `fetch`, so the scripts talk straight to Chrome — nothing to install.
The window is **visible**: the user can watch every action happen and take over the
keyboard/mouse at any time (essential for logins, 2FA, and captchas).

Scripts live at the repo root: `browser/launch.mjs` and `browser/cdp.mjs`.
Run all commands **from the repo root** (`C:\Agentic-os-got-moles`).

## Outcome

A controllable browser session. Returns page text/HTML/eval values to the conversation,
and writes PNG screenshots to `browser/shots/` (gitignored) by default — pass an explicit
path to save a screenshot you want to keep (e.g. into `projects/tool-browser/`).

## Context Needs

| File | Load level | Purpose |
|------|-----------|---------|
| `context/learnings.md` → `## tool-browser` | this section only | Per-platform quirks, selectors that worked, login gotchas — read before non-trivial platform work |

## The persistent profile (why logins stick)

Chrome runs on a dedicated profile at `C:\Users\spenc\.agentic-chrome-profile` — separate
from the user's everyday Chrome, so it never touches their real browsing session and can run
while their normal Chrome is open. Because the profile is persistent, **a platform login done
once survives across sessions.** First time on a platform, the user signs in manually in the
window (handles 2FA/passkeys/captcha themselves); after that the session is remembered.

## Step 1: Make sure the window is up

```
node browser/launch.mjs
```

Opens the window (or no-ops if it's already listening on the CDP port). Safe to run anytime.
If it's not up when you try to drive it, run this first.

## Step 2: Drive it

```
node browser/cdp.mjs goto <url>            # navigate, waits for load
node browser/cdp.mjs shot [outfile.png]    # screenshot (default: browser/shots/shot-<ts>.png)
node browser/cdp.mjs text [css-selector]   # visible innerText (default: body)
node browser/cdp.mjs html [css-selector]   # outerHTML (default: whole document)
node browser/cdp.mjs eval "<js expr>"      # run JS in the page, returns JSON value
node browser/cdp.mjs click <css-selector>  # scroll into view + click
node browser/cdp.mjs type <css-selector> <text>   # focus + set value + fire input/change
node browser/cdp.mjs press <key>           # e.g. Enter, Tab
node browser/cdp.mjs url                   # current page title + URL
node browser/cdp.mjs pages                 # list open tabs/targets
```

**To actually see a page**, take a screenshot then Read the PNG — that renders the image into
the conversation. `text`/`html` are cheaper when you only need the words or structure; prefer
them for reading feeds, posts, and profiles so you don't burn tokens on images you don't need.

## Step 3: Logging into a platform (LinkedIn and friends)

The platform-agnostic pattern — same for LinkedIn, X, Instagram, Facebook, YouTube, TikTok, Reddit:

1. `node browser/cdp.mjs goto https://www.linkedin.com/login` (or the platform's login page).
2. **Ask the user to log in themselves in the Chrome window** — including any 2FA, passkey, or
   captcha. Never type their password for them; let them own the credential step.
3. Confirm with `node browser/cdp.mjs url` (or a screenshot) that they're signed in.
4. From then on, just `goto` the feed/profile/analytics page and `text`/`shot` to read and advise.
   The session persists — no re-login next time unless the platform expires it.

## Rules

- **Read freely, write only on explicit confirmation.** Navigating, reading, and screenshotting
  are safe. Anything that *acts on the user's behalf on a platform* — posting, commenting, sending
  a DM, liking, following/connecting, submitting a form, changing account settings, deleting — is a
  mutation. State exactly what you're about to do and get a clear yes in this conversation first.
  This is a real logged-in browser; a wrong click is a real action other people see.
- **Prefer human-in-the-loop for engagement.** Platforms flag scripted liking/following/connecting/
  DMing and can restrict or ban accounts. Default to *advising* the user on what to post or how to
  engage, and let them click, rather than automating engagement. If they do want an action taken,
  confirm per the rule above and keep it low-volume and human-paced.
- **Never enter the user's credentials.** Login, 2FA, passkeys, and captchas are always the user's
  hands in the window.
- **US English** in any drafted copy/advice (Got Moles is a US company): color, organize, neighborhood.
- Don't drive their everyday Chrome — this profile is deliberately separate. If they ask to use a
  logged-in *real*-profile session, flag that it can't run while their normal Chrome is open and
  confirm before changing the profile.

## Self-Update

If the user flags an issue during a run — a selector that missed, a platform that needs a different
login flow, a screenshot that captured the wrong thing, an action taken that shouldn't have been —
add a dated line to `## Rules` above immediately (and, if it's a reusable platform detail like a
working selector, to `## tool-browser` in `context/learnings.md`). Fix the skill so it doesn't
repeat the mistake, don't just mention it.

## Troubleshooting

- **"WebSocket connection to Chrome failed" / connection refused** — the window isn't up. Run
  `node browser/launch.mjs`, then retry.
- **ws attaches then 403s** — Chrome needs `--remote-allow-origins=*` (already set in `launch.mjs`).
  If the window was opened another way, relaunch via `launch.mjs`.
- **`goto` seems to hang on a heavy page** — it caps the load wait at 20s and then returns; take a
  screenshot to see current state, or `eval "document.readyState"`.
- **Element not found on click/type** — the selector didn't match (SPA not rendered yet, or inside
  an iframe/shadow DOM). Screenshot first, confirm the selector with `html <selector>`, wait/scroll,
  then retry. For dynamic feeds, `eval` a `document.querySelectorAll(...)` to find the real selector.
- **Different Chrome install path** — set `CHROME_PATH` env var before `launch.mjs`. Port and
  profile are overridable via `CDP_PORT` and `CHROME_PROFILE`.
