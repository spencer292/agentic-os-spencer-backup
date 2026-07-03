# mkt-social-showing

Makes the **showing** of a finished clip excellent — the right hook in the right place, an ICP angle
that lands, the viral elements present, and a score before it posts. Grounded in researched 2025/26
short-form best practice, not guesswork.

## What it does

1. **Core message + ICP angle** — names the one thing the content says and *why Mark/Mary care*.
2. **The hook, placed right** — writes the 3-layer hook (frame-0 on-screen text + spoken/first line +
   visual), stacking ≥2 of the four triggers. Feeds the on-screen text back to the video.
3. **Structure** — Hook → Retain → Reward; confirms a payoff and a shareability trigger.
4. **Platform packages** — native per platform (LinkedIn link-in-comment, TikTok search keywords, etc.).
5. **Scorecard** — rates Hook / ICP fit / Shareability / Clarity / Platform fit; won't ship a weak hook.

## Where it sits

Between **Review** and **Post** in the `00-video-studio` lane. Output `posts.json` feeds
`00-video-studio/scripts/zernio_post.cjs`. Updates the **Video Studio Jobs** Notion row (Hook, ICP Angle).

## Usage

```
/mkt-social-showing path/to/clip.mp4
/mkt-social-showing path/to/clip.mp4 linkedin,tiktok,youtube
```

Also standalone on any content: "make this post viral", "write the hook for this", "package this for social".

## Reads
`brand_context/icp.md` (full), `voice-profile.md` (full), `positioning.md` (summary).

## References
- `viral-framework.md` — the methodology + sources
- `hook-formulas.md` — templates by trigger + the 3-layer hook
- `platform-playbook.md` — per-platform 2025/26 rules
- `icp-angles.md` — map content to the personas
- `scorecard.md` — the pre-post rubric
