# Sample report

A real, unedited `qa-run.mjs` report. Produced 2026-09-02 against a local Next.js build running
on `http://localhost:3020` with three paths supplied:

```
node .claude/skills/tool-web-qa/scripts/qa-run.mjs \
  --base http://localhost:3020 \
  --paths "/,/score/take,/book"
```

The original run wrote to
`C:\Claude\agent-os-v3\agentic-os\projects\tool-web-qa\2026-09-02_localhost-3020\report.md`
alongside nine screenshots.

Two things to notice in it. The three blockers are all the same defect, a staging
`noindex, nofollow` left on every page, which is exactly the failure the checklist warns about
and exactly what a pre-launch run is for. And a local run reports `robots.txt` and sitemap as
missing, which is normal for a dev server and would be a blocker on production.

What follows is the file as written.

---

```markdown
---
site: http://localhost:3020
date: 2026-09-02
pages_tested: 3
viewports: 390x844, 820x1180, 1440x900
verdict: DO NOT LAUNCH
---

# Web QA report: localhost:3020

**Verdict: DO NOT LAUNCH.** 3 blocker(s), 19 warning(s), 6 note(s).

| Severity | Count | Meaning |
|---|---|---|
| Blocker | 3 | Fix before the site goes live or the change ships. |
| Warning | 19 | Fix before launch unless a named owner accepts the risk. |
| Note | 6 | Log it, schedule it, do not hold the launch for it. |

## Blockers (3)

### seo

- meta robots contains noindex ("noindex, nofollow"). Staging flag left on is the most common launch failure. `http://localhost:3020/`
- meta robots contains noindex ("noindex, nofollow"). Staging flag left on is the most common launch failure. `http://localhost:3020/score/take`
- meta robots contains noindex ("noindex, nofollow"). Staging flag left on is the most common launch failure. `http://localhost:3020/book`

## Warnings (19)

### crawl

- No robots.txt at http://localhost:3020/robots.txt (status 404).
- No sitemap URLs found. Tried: http://localhost:3020/sitemap.xml, http://localhost:3020/sitemap_index.xml

### seo

- meta robots contains nofollow ("noindex, nofollow"). `http://localhost:3020/`
- No canonical link. `http://localhost:3020/`
- meta robots contains nofollow ("noindex, nofollow"). `http://localhost:3020/score/take`
- No canonical link. `http://localhost:3020/score/take`
- Duplicate meta description, also on http://localhost:3020/. `http://localhost:3020/book`
- meta robots contains nofollow ("noindex, nofollow"). `http://localhost:3020/book`
- No canonical link. `http://localhost:3020/book`

### social

- No og:title. `http://localhost:3020/`
- No og:description. `http://localhost:3020/`
- No og:image. Shared links render as a bare text card. `http://localhost:3020/`
- No og:title. `http://localhost:3020/score/take`
- No og:description. `http://localhost:3020/score/take`
- No og:image. Shared links render as a bare text card. `http://localhost:3020/score/take`
- No og:title. `http://localhost:3020/book`
- No og:description. `http://localhost:3020/book`
- No og:image. Shared links render as a bare text card. `http://localhost:3020/book`

### structure

- No h1 on the page. `http://localhost:3020/score/take`

## Notes (6)

### forms

- Form to "(same page)" has 6 visible fields. Every field past five costs completion. `http://localhost:3020/book`
- Form to "(same page)" has no obvious honeypot field. See references/form-test-protocol.md. `http://localhost:3020/book`

### security

- Base URL is http://. Security header and TLS checks are skipped for a local run.

### social

- No twitter:card. `http://localhost:3020/`
- No twitter:card. `http://localhost:3020/score/take`
- No twitter:card. `http://localhost:3020/book`

## Pages

| Page | Status | Title | Description | Canonical | Robots | h1 | OG image | Console | Failed req |
|---|---|---|---|---|---|---|---|---|---|
| `/` | 200 | yes | yes | MISSING | noindex, nofollow | 1 | MISSING | 0 | 0 |
| `/score/take` | 200 | yes | yes | MISSING | noindex, nofollow | 0 | MISSING | 0 | 0 |
| `/book` | 200 | yes | yes | MISSING | noindex, nofollow | 1 | MISSING | 0 | 0 |

### Page detail

#### / — http://localhost:3020/

- Title: "Security Culture Score \| Bob's Business" (39 chars)
- Meta description: 113 chars
- Canonical: MISSING
- Meta robots: noindex, nofollow
- h1: 1 — "How safe is your organisation from one simple mistake?"
- Open Graph: title no, description no, image no
- Favicon: /favicon.ico?favicon.0vk-2yclax3ek.ico
- Images: 10, 0 without alt, 0 without width and height
- Forms: 0
- JSON-LD blocks: 0

| Viewport | Status | Console errors | JS exceptions | Failed requests | 4xx/5xx | Horizontal scroll | Screenshot |
|---|---|---|---|---|---|---|---|
| 390x844 | 200 | 0 | 0 | 0 | 0 | no | [png](screenshots/390x844/home.png) |
| 820x1180 | 200 | 0 | 0 | 0 | 0 | no | [png](screenshots/820x1180/home.png) |
| 1440x900 | 200 | 0 | 0 | 0 | 0 | no | [png](screenshots/1440x900/home.png) |

#### /score/take — http://localhost:3020/score/take

- Title: "Your Security Culture Score \| Bob's Business" (44 chars)
- Meta description: 90 chars
- Canonical: MISSING
- Meta robots: noindex, nofollow
- h1: 0
- Open Graph: title no, description no, image no
- Favicon: /favicon.ico?favicon.0vk-2yclax3ek.ico
- Images: 3, 0 without alt, 0 without width and height
- Forms: 0
- JSON-LD blocks: 0

| Viewport | Status | Console errors | JS exceptions | Failed requests | 4xx/5xx | Horizontal scroll | Screenshot |
|---|---|---|---|---|---|---|---|
| 390x844 | 200 | 0 | 0 | 0 | 0 | no | [png](screenshots/390x844/score_take.png) |
| 820x1180 | 200 | 0 | 0 | 0 | 0 | no | [png](screenshots/820x1180/score_take.png) |
| 1440x900 | 200 | 0 | 0 | 0 | 0 | no | [png](screenshots/1440x900/score_take.png) |

#### /book — http://localhost:3020/book

- Title: "Book your walkthrough \| Bob's Business" (38 chars)
- Meta description: 113 chars
- Canonical: MISSING
- Meta robots: noindex, nofollow
- h1: 1 — "Book your walkthrough"
- Open Graph: title no, description no, image no
- Favicon: /favicon.ico?favicon.0vk-2yclax3ek.ico
- Images: 3, 0 without alt, 0 without width and height
- Forms: 1 (6 visible fields)
- JSON-LD blocks: 0

| Viewport | Status | Console errors | JS exceptions | Failed requests | 4xx/5xx | Horizontal scroll | Screenshot |
|---|---|---|---|---|---|---|---|
| 390x844 | 200 | 0 | 0 | 0 | 0 | no | [png](screenshots/390x844/book.png) |
| 820x1180 | 200 | 0 | 0 | 0 | 0 | no | [png](screenshots/820x1180/book.png) |
| 1440x900 | 200 | 0 | 0 | 0 | 0 | no | [png](screenshots/1440x900/book.png) |

## Internal link check

2 distinct internal links checked. 0 broken, 0 redirecting, 9 external links found but not checked.

No broken links and no redirect chains.

## robots.txt and sitemap

- robots.txt: NOT FOUND (HTTP 404)
- Sitemap declared in robots.txt: no
- Disallow rules for all agents: none
- Sitemap URLs found: 0
- Sitemap files read: http://localhost:3020/sitemap.xml, http://localhost:3020/sitemap_index.xml
- 404 probe: HTTP 404 for a URL that does not exist

## Screenshots

| Page | 390x844 | 820x1180 | 1440x900 |
|---|---|---|---|
| `/` | [png](screenshots/390x844/home.png) | [png](screenshots/820x1180/home.png) | [png](screenshots/1440x900/home.png) |
| `/score/take` | [png](screenshots/390x844/score_take.png) | [png](screenshots/820x1180/score_take.png) | [png](screenshots/1440x900/score_take.png) |
| `/book` | [png](screenshots/390x844/book.png) | [png](screenshots/820x1180/book.png) | [png](screenshots/1440x900/book.png) |

## Next

- Work the blockers first, then the warnings, then re-run this script and diff against this run with `--baseline`.
- Forms are not submitted by this script. Run `references/form-test-protocol.md` by hand for every form listed above.
- Track the wider launch sequence in `references/launch-checklist.md`.
```

---

## What a `--baseline` run adds

The same script run a second time with `--baseline` pointed at the earlier output directory adds
a visual regression table. This is a real fragment from a second run against the same build, so
every page reads as unchanged:

```markdown
## Visual regression

Threshold: 1.00% of pixels.

| Page | Viewport | State | Changed pixels | Height delta | Diff image |
|---|---|---|---|---|---|
| `/` | 390x844 | same | 0.00% | 0px | [png](diffs/390x844/home.png) |
| `/` | 820x1180 | same | 0.00% | 0px | [png](diffs/820x1180/home.png) |
| `/` | 1440x900 | same | 0.00% | 0px | [png](diffs/1440x900/home.png) |
| `/book` | 390x844 | same | 0.00% | 0px | [png](diffs/390x844/book.png) |
| `/book` | 820x1180 | same | 0.00% | 0px | [png](diffs/820x1180/book.png) |
| `/book` | 1440x900 | same | 0.00% | 0px | [png](diffs/1440x900/book.png) |
```

## What a live https site adds

Run against a public site with no `--paths`, the script reads `robots.txt`, follows the sitemap,
and takes the first `--limit` URLs. A live run against a production marketing site on the same
day produced this section, which a local run cannot:

```markdown
## robots.txt and sitemap

- robots.txt: found at https://www.example.co.uk/robots.txt
- Sitemap declared in robots.txt: https://www.example.co.uk/sitemap.xml
- Disallow rules for all agents: `/landing/*/`, `/resources-iso/*/`
- Sitemap URLs found: 448
- 404 probe: HTTP 404 for a URL that does not exist
```

It also produced a `security` warning for a missing `Strict-Transport-Security` header, and
fifteen `network` notes for third-party ad and analytics beacons the browser blocked. Blocked
tracker beacons are reported as notes rather than warnings, so first-party failures stay
visible.
