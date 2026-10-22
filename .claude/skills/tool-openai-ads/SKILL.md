---
name: tool-openai-ads
description: Manage the Got Moles ChatGPT Ads account (OpenAI Ads Manager) through OpenAI's Advertiser API — check the account, list and read campaigns, ad groups and ads, build the test campaign, pause/activate, check serving issues and ad review status. Triggers on "chatgpt ads", "openai ads", "ads in chatgpt", "check the chatgpt campaign", "pause chatgpt ads", "openai ads status", "build the chatgpt ads campaign". Reads are free; every create, update, pause or activate spends or stops real money and needs the user's explicit go-ahead. Requires OPENAI_ADS_API_KEY in .env (created in Ads Manager > Settings). Does NOT trigger for Google Ads (ops-got-moles-ads) or the website (Roy's side).
---

# tool-openai-ads: the Got Moles ChatGPT Ads account

This is a live ad account that spends real money. The API notes are in
`references/api-notes.md` (researched 2026-10-22). The platform changes monthly, so re-check the
docs at https://developers.openai.com/ads before building anything new.

## Setup, once (done on a call with Roy)

1. **Create the key.** Spencer opens Ads Manager > Settings (https://ads.openai.com/settings) and creates an API key named `got-moles-claude`.
2. **Store it.** Spencer pastes the key into this folder's `.env` as `OPENAI_ADS_API_KEY=...`, using Notepad or TextEdit.
   - Never paste it into the Claude chat, an email or a document.
   - Never print it, echo it or commit it.
3. **Test it.** Run `node .claude/skills/tool-openai-ads/scripts/openai-ads.mjs test`. Good output starts with `Connected. Ad account:` and shows the currency (USD), the timezone and the status.

## Running it

Run everything from the Got Moles folder:

```bash
node .claude/skills/tool-openai-ads/scripts/openai-ads.mjs test
node .claude/skills/tool-openai-ads/scripts/openai-ads.mjs list campaigns
node .claude/skills/tool-openai-ads/scripts/openai-ads.mjs get /v1/ads/ad_123?include[]=serving_issues
node .claude/skills/tool-openai-ads/scripts/openai-ads.mjs post /v1/campaigns @campaign.json           # dry run
node .claude/skills/tool-openai-ads/scripts/openai-ads.mjs post /v1/campaigns @campaign.json --apply   # sends
node .claude/skills/tool-openai-ads/scripts/openai-ads.mjs pause campaigns cmpn_123 --apply
```

**The mutation rule:** every `post`, `pause`, `activate` and `archive` runs as a dry run first. Show the user what would change and get a clear yes before re-running with `--apply`. Build new campaigns with `status: paused`. Only switch one on when the launch gates below are all met and the user says so.

## Launch gates: do not activate until all five are done

1. **The OpenAI conversion tag is on got-moles.com.** Roy's side handles this through the site deploy.
2. **The landing page is reachable by `OAI-AdsBot`.**
   - The site's robots.txt disallows `/lp/` for all unnamed bots, and `OAI-AdsBot` isn't named. A `/lp/` page would pass review and then quietly never serve.
   - Use a non-`/lp/` page, or get Roy's fix shipped first.
3. **CallRail has a ChatGPT-only tracking number.** Most leads are phone calls.
4. **There's a dedicated landing page.** Roy builds it and Spencer approves it in Notion.
5. **The user confirms budget and goal:** $30/day average, with a checkpoint after the first $1,000 of spend.

## The test plan (agreed with Roy, 2026-09-25)

| | |
|---|---|
| Budget | $30/day average (OpenAI averages it over 7 days), on top of Google Ads |
| Bidding | Clicks first, at a $4 maximum per click. Switch to Conversions once tracking has about 30 leads. |
| Area | Washington state, or the Seattle, Tacoma and Spokane areas |
| Context hints | Homeowners asking about moles in the lawn or yard, mounds, tunnels, getting rid of moles, pet-safe or chemical-free mole control |
| Checkpoint | After $1,000. **Keep and raise to $50/day** if CPL ≤ $65 on 15+ leads and they book like Google leads. **Pause** if CPL > $80, CTR < 0.3%, or fewer than 10 leads. Anything in between: adjust and run another $500. |
| Judge on | Cost per booked job, not clicks. Google Ads' bar is about $58–73 a lead. |

## Ad copy rules (mandatory, same as Google Ads)

- **No trapping-mechanism words.** Never use body-gripping, scissor, harpoon, spike, kill or lethal language.
- **No Initiative 713 compliance claims.**
- **The "mole" homograph.** Keep every context hint about yards and lawns, and never about skin, health or dermatology.
- **Approved claims:**
  - chemical-free
  - safe for pets and kids
  - "330+ five-star Google reviews" (static copy uses this floor)
  - nearly 5,000 WA properties served since 2017
  - veteran-owned
- **Banned claims:**
  - "WA's #1"
  - "15+ years" stated as company age (it's Spencer's own experience; the company was founded in 2017)
- **Call-back wording:** "We call you back within one business day, usually the same day." Never promise same-day.
- **Spelling:** US English.
- **Length:** keep titles to 24 characters and body to 48 for safety. The API allows 50 and 100.

## Reporting

There are four Insights endpoints, but their paths weren't in the docs fetched on 2026-10-22. Look them
up at developers.openai.com/ads before building the weekly report. Until then, read results in Ads
Manager and check `serving_issues` and `review_status` on each ad through the API.
