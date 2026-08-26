# Admin API token — status

**Updated:** 2026-08-26

## Done (agent, this session)

| Step | State |
|---|---|
| Custom app development enabled on the build store | Done — logged in Shopify as allowed by `spencer@got-moles.com`, 2026-08-26 |
| App `SYP Build Automation` created | Done — app id `415585501185`, 16:16 UTC |
| All 14 Admin API scopes ticked and saved | Done — 16:22 UTC, **verified by reloading the page and re-reading from the server** |

Scopes saved, confirmed after reload:

```
read_content                     write_content
read_files                       write_files
read_metaobject_definitions      write_metaobject_definitions
read_metaobjects                 write_metaobjects
read_online_store_navigation     write_online_store_navigation
read_products                    write_products
read_publications                write_publications
```

Nothing else is ticked. The app is **not installed**, deliberately.

## Left for Spencer — two clicks

Open:

```
https://admin.shopify.com/store/syperformance-build/settings/apps/development/415585501185/overview
```

1. **Install app**
2. **Reveal token once** and copy it — starts `shpat_`. Shopify shows it exactly once; lose it and the app has to be uninstalled and reinstalled.
3. Paste into the repo-root env file as two lines:

```
SHOPIFY_BUILD_STORE=syperformance-build.myshopify.com
SHOPIFY_BUILD_ADMIN_TOKEN=shpat_...
```

Install is left to Spencer on purpose: the token never passes through the agent, and the agent cannot read that file by design.

## Then

```
node scripts/apply-ia.mjs              # dry run — 33 collections, the menu, 45 redirects
node scripts/apply-ia.mjs --apply
node scripts/apply-pages.mjs --apply   # 5 trust pages + the build metaobject
```

Both scripts refuse to run against any store other than `syperformance-build.myshopify.com`.

## Two Shopify behaviours worth knowing

**Ticking a `write_` scope auto-ticks its `read_` pair.** Ticking both explicitly toggles the pair straight back off. That silently undid the first attempt at setting these — 14 boxes ticked, 0 saved. Only click the writes.

**The admin is Polaris web components.** The real `<input type=checkbox>` elements ignore synthetic clicks; `label[for="..."]` works. Same for buttons — several share `variant=primary`, including an `Install` button hidden inside a modal, so any selector used here has to be scoped rather than first-match.

## On the legacy path

This is Shopify's *legacy* custom app route, which they stopped offering to merchants on 2026-01-01. It still works here because the store is Partner-owned and is never transferred to a merchant — handover is a theme zip plus a runbook, not the store. Enabling it is irreversible, and was confirmed with Spencer before clicking.

The alternative was a Dev Dashboard app. Same end result for these scripts, more steps.
