# Deploying routereadykits.com

## Build

```
cd site
node build.mjs
```

Zero dependencies — Node built-ins only (Node 18+). Output lands in `site/dist/` (fully static: HTML, `styles.css`, `sitemap.xml`, `robots.txt`). Content files that fail to parse are reported at the end and skipped; the exit code is non-zero if any failed.

## Option A — Vercel (recommended)

Deploy `dist/` as a static site. Put this `vercel.json` next to `dist/` (or in the repo you deploy from):

```json
{
  "cleanUrls": true,
  "trailingSlash": true,
  "outputDirectory": "dist"
}
```

Then either `vercel --prod` from that folder, or connect the repo in the Vercel dashboard with:
- Framework preset: **Other**
- Build command: `node build.mjs`
- Output directory: `dist`

`cleanUrls` + `trailingSlash` match the site's canonical URLs (`/guides/{slug}/`).

## Option B — GitHub Pages

1. Push the repo to GitHub.
2. Simplest: build locally, commit `dist/`, and set Pages → "Deploy from a branch" → `/dist` folder (or copy `dist/` contents to a `gh-pages` branch).
3. Or use an Actions workflow that runs `node build.mjs` and uploads `site/dist` with `actions/upload-pages-artifact` + `actions/deploy-pages`.
4. Add a `CNAME` file containing `routereadykits.com` to `dist/` (Pages settings → Custom domain also creates it).

Every URL is a folder with `index.html`, so Pages serves clean URLs natively.

## One-time DNS for routereadykits.com

At your registrar:

**Vercel**
| Type | Name | Value |
|------|------|-------|
| A | @ | `76.76.21.21` |
| CNAME | www | `cname.vercel-dns.com` |

Then add the domain under Project → Settings → Domains (Vercel verifies and issues TLS automatically). If Vercel's dashboard shows different values when you add the domain, use those — they win.

**GitHub Pages**
| Type | Name | Value |
|------|------|-------|
| A | @ | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` |
| CNAME | www | `{github-username}.github.io` |

Set the custom domain in repo Settings → Pages and tick "Enforce HTTPS" once the cert is issued.

DNS propagation: minutes to a few hours. Verify with `nslookup routereadykits.com`.
