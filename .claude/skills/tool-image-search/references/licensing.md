# Licensing & attribution per source

Each manifest entry records the license the source returned. This file is the
reference for what those values mean and what attribution string to use in
published posts.

## Quick matrix

| Source     | Default license             | Commercial use? | Attribution required? |
| ---------- | --------------------------- | --------------- | --------------------- |
| Openverse  | varies (filter to CC-BY/CC0 with `--license commercial`) | Yes when filtered | Yes for CC-BY/CC-BY-SA |
| Wikimedia  | varies (CC, PD, BSD-art)    | Yes for PD/CC-BY/CC-BY-SA | Yes for CC-BY/CC-BY-SA |
| Imgflip    | meme template (de-facto public) | Editorial / parody | Optional             |
| Unsplash   | Unsplash License            | Yes (incl. commercial) | Recommended, not required |
| Pexels     | Pexels License              | Yes (incl. commercial) | Recommended, not required |
| Bing scrape | unknown                    | Depends on each upstream image; assume © | Yes — link upstream |

## Reading the manifest

Each entry has:

- `license` — short label as returned by the source (`by`, `by-sa`, `cc0`,
  `public domain`, `unsplash-license`, `pexels-license`, `unknown`, …)
- `license_url` — canonical URL of the license text (CC links to
  creativecommons.org, Unsplash/Pexels link to their license pages)
- `attribution` — a pre-built one-line attribution string. Drop into post
  alt-text or footer. Empty when the source didn't supply enough metadata.
- `source_url` — the page on the originating site (Flickr photo page, Wikimedia
  description page, Imgflip template page, Bing-linked upstream). Always link
  back to this URL when republishing.
- `warnings` — for Bing scrape, contains `"scraped-no-license-guarantee"`.
  Review the upstream `source_url` before using.

## Practical rules of thumb

### Tier 1 + 2 (licensed sources)

CC-BY and CC-BY-SA images **require attribution** including:
1. Title of the work (if given)
2. Author (`creator`)
3. License (e.g. "CC BY 2.0") and a link to the license deed

The skill builds an attribution string in this format:
> Photo by {creator} on {provider}, CC {LICENSE}

For posts published on platforms with limited footnote space (Instagram,
TikTok), at minimum link the `source_url` in the post description.

CC0 and Public Domain images can be used without attribution but linking back
is good citizenship.

### Tier 3 (Bing scrape)

The skill marks Bing results with `license: "unknown"`. Each upstream image
is owned by its publisher (news site, fan blog, official press kit, etc.).
Use these only when:

- The post is **editorial commentary** or **parody/critique** (likely covered
  by fair use in most jurisdictions)
- You can credit the upstream source explicitly via the `source_url`
- You are not republishing for commercial gain without clearance

For commercial campaigns featuring a real person or brand, do not rely on
Tier 3. Use official press kits or paid stock.

## Wikimedia license name quirks

Wikimedia's `LicenseShortName` can be slightly inconsistent:
- `CC BY 4.0` / `CC BY-SA 3.0` / `CC0` — standard
- `Public domain` — works in PD due to age or government-published
- `Trademarked` — appears for logos. The image is freely distributable but
  the trademark stays with the company; usage in posts is generally fine
  (referencing the brand) but not for goods/services impersonation.

When in doubt, click through to the `source_url` to read the file's licensing
section before publishing.
