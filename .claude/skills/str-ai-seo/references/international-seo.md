# International SEO for AI Systems

Multi-language and multi-country sites have citation mechanics traditional SEO handles clumsily and AI systems handle even more clumsily. This file runs when the site serves more than one language or country.

**Confidence warning for this whole file.** The landscape research behind this skill covered the US market and, secondarily, English-language search. **It did not verify per-country AI platform availability, per-market AI query behavior, or the engines used outside that scope.** Treat everything here about specific non-US markets as `[U]` — directionally useful, not evidenced — and verify against the market before putting any of it in a client deliverable. The structural material (domain patterns, hreflang mechanics, localization versus translation) is stable and does not carry that caveat.

A single-market site does not need this file at all. Do not run it out of completeness.

---

## Contents

- When to run the international track
- Domain structure decision (ccTLD vs subdomain vs subfolder)
- hreflang implementation
- Language vs region targeting
- Per-country platform preferences
- Currency, region, and locale in schema
- Content localization vs translation
- International AI query patterns

---

## When to run the international track

Run when any apply:
- Site serves more than one language (even if one country)
- Site serves multiple countries in the same language (e.g. US + UK + AU English)
- Customers are geographically distributed enough that one-size-fits-all hurts conversion
- Regulatory or pricing varies by region

Don't run when:
- Single country, single language
- Multi-country but single canonical English site works fine (very small brands)

---

## Domain structure decision

Three main patterns, each with tradeoffs:

### Pattern 1: ccTLD (country code top-level domain)

Example: `yourbrand.co.uk`, `yourbrand.de`, `yourbrand.com.au`.

**Pros:**
- Strongest country-targeting signal to Google and all AI systems
- Clearest geographic intent
- Simpler hreflang

**Cons:**
- Splits domain authority across properties
- Expensive (multiple domain registrations, SSL, hosting)
- Complex CDN + analytics

**Use when:** each country market is a real business priority and you have resources to build authority per domain.

### Pattern 2: Subdomain

Example: `uk.yourbrand.com`, `de.yourbrand.com`.

**Pros:**
- Moderate country-targeting signal
- Single domain authority pool (partially shared via Google's understanding)
- Easier DNS/hosting

**Cons:**
- Google treats subdomains as separate sites for some purposes — authority less unified than subfolders
- Can look less "local" to users

**Use when:** you want separation but can't justify full ccTLDs.

### Pattern 3: Subfolder

Example: `yourbrand.com/uk/`, `yourbrand.com/de/`.

**Pros:**
- Single domain authority fully shared
- Cheapest / simplest
- Easiest hreflang
- Best for small-medium international presence

**Cons:**
- Weakest country-targeting signal
- Users may not perceive as local

**Use when:** international is emerging priority, you want to consolidate authority, or you have one strong primary market + smaller secondary markets.

**Working recommendation `[U]`:** subfolders for most, ccTLDs where each country is a genuine business priority with resources behind it, subdomains rarely. This reflects long-standing practitioner consensus rather than a Google position or a study — Google has not published a preference, and the previous "2026 consensus" framing overstated its standing. Treat it as a default to depart from with reason, not a rule.

`[P]` Google expanded its site-move guidance for domain variants in June 2026. Read it before any structural migration; a domain-structure change is the least reversible item in this file.

---

## hreflang implementation

`hreflang` tells search engines and AI systems which version of a page to show which user.

**Format (in `<head>`):**

```html
<link rel="alternate" hreflang="en-gb" href="https://yourbrand.com/uk/" />
<link rel="alternate" hreflang="en-us" href="https://yourbrand.com/us/" />
<link rel="alternate" hreflang="de-de" href="https://yourbrand.com/de/" />
<link rel="alternate" hreflang="x-default" href="https://yourbrand.com/" />
```

**Rules (every one matters):**
1. **Every variant must reference all other variants** (including itself). Broken hreflang = ignored hreflang.
2. **`x-default`** is the fallback for users who don't match any specific locale. Mandatory for most multi-language setups.
3. **Language codes are ISO 639-1** (2-letter: `en`, `de`, `fr`). Country codes are ISO 3166-1 (`US`, `GB`, `DE`). Combine with hyphen: `en-GB`.
4. **Don't hreflang pages that don't have true equivalents.** If a page only exists in English, don't fake a German hreflang.
5. **Alternative to `<link>` tag: `rel="alternate"` in sitemap.xml.** Cleaner at scale.

**Common failures:**
- Missing return-references (A links to B but B doesn't link to A)
- Wrong language/country codes
- Pointing to different URLs than canonicals
- Mixing hreflang + canonical in ways that cancel out

**Validation:** a full-site crawl reporting hreflang per URL. DataForSEO `on_page/task_post` followed by `on_page/pages` gives return-reference coverage across every variant. Search Console's international reporting is the first-party cross-check.

---

## Language vs region targeting

Three distinct optimization problems:

### Problem 1: Same language, different country (e.g. US English vs UK English)

**Concerns:**
- Spelling variants (color vs colour)
- Currency (USD vs GBP)
- Cultural/idiom differences
- Regulatory (GDPR vs CCPA disclosures)

**Approach:** minor content adaptations + proper hreflang. Don't duplicate-translate for the same language; instead vary where it genuinely matters (currency, compliance, dates).

### Problem 2: Different language, same country (e.g. Canada FR + EN, Switzerland DE/FR/IT)

**Concerns:**
- True translation, not machine translation
- Cultural nuance
- Legal requirements (e.g. Quebec French requirements)

**Approach:** professional translation + native-speaker review. hreflang by language without country code if audience is national (e.g. `fr-CA`).

### Problem 3: Different language, different country

**Concerns:** all of the above, plus market-specific AI systems.

**Approach:** content strategy per market, distinct keyword research, local case studies, local team presence shown.

---

## Per-country platform preferences

**`[U]` on this entire table.** It is a working orientation, not verified 2026 data. Per-country AI platform availability and share were not confirmed by the research behind this skill, and availability changes on announcement rather than on a schedule. **Verify before using any row with a client**, and never present a market's AI landscape as fact on the strength of this table.

| Country | Dominant search | AI search also used | Notes |
|---------|----------------|---------------------|-------|
| US | Google | ChatGPT, Perplexity, Copilot, Gemini, Claude | The market with actual measured citation data |
| UK | Google | ChatGPT, Perplexity, Copilot, Gemini | |
| Germany | Google | ChatGPT, Perplexity | Strict GDPR context |
| France | Google | ChatGPT, Perplexity, Mistral | Mistral / Le Chat emerging |
| Italy | Google | ChatGPT, Perplexity | |
| Spain | Google | ChatGPT, Perplexity | |
| China | **Baidu** | Ernie Bot (Baidu), Kimi, DeepSeek | Baidu-specific tactics required; Google blocked |
| Russia | **Yandex** | YandexGPT, GigaChat | Yandex-specific tactics required |
| South Korea | **Naver** | Naver Clova / HyperClova | Naver SEO + Korean AI systems |
| Japan | Google + Yahoo Japan | ChatGPT, local models | Yahoo Japan shares Google index largely |
| Brazil | Google | ChatGPT, Perplexity | |
| Australia | Google | ChatGPT, Perplexity, Copilot | |
| India | Google | ChatGPT, Perplexity, local (Krutrim) | Multi-language content layer matters |

**Actions for non-Google-dominant markets:**

**China (Baidu):**
- Separate ICP license + hosting in mainland China for Baidu priority
- Simplified Chinese content (not translated — written natively)
- Baidu Webmaster Tools submission
- Baijiahao accounts for content distribution

**Russia (Yandex):**
- Yandex Webmaster Tools submission
- Russian-language content
- Consider Yandex Turbo Pages for speed

**South Korea (Naver):**
- Naver Webmaster Tools
- Korean-language content with cultural adaptation
- Presence on Naver Blog / Cafe for organic visibility

---

## Currency, region, locale in schema

Schema should reflect target market:

```json
{
  "@type": "Product",
  "offers": {
    "@type": "Offer",
    "price": "29.99",
    "priceCurrency": "GBP",
    "availability": "https://schema.org/InStock",
    "areaServed": {
      "@type": "Country",
      "name": "United Kingdom"
    }
  }
}
```

**Per-variant schema:**
- Address and geo vary per local office
- Currency varies per offer
- Language `inLanguage: "en-GB"` vs `"en-US"` on content schema
- Phone formatted per country convention

---

## Content localization vs translation

**Translation** = converting words. Machine translation is cheap and scalable but AI systems detect thin translations and deprioritize.

**Localization** = adapting content — examples, references, currency, idioms, compliance, case studies — to be native-feeling in the target market.

**Rule:** for any market worth doing, localize. Translate-only is an AI visibility anti-pattern.

**Signals AI systems use to detect thin translation:**
- High text similarity to another language version (machine translation artifacts)
- Missing local references (examples, proper nouns, cultural markers)
- Awkward phrasing detected by language models
- No local testimonials / case studies
- Currency / measurement unit inconsistencies

---

## International AI query patterns

**`[U]` on every characterization below.** No study behind this skill measured per-market AI query behavior. These are working hypotheses to test, not findings to report.

- **US:** the only market with measured AI citation data in this skill's research
- **France:** a stated preference for French-language sources is plausible and untested
- **Germany:** a preference for structured, authoritative sources is plausible and untested
- **China:** a genuinely different stack, where local-domain content dominates
- **Multilingual markets:** code-switching in queries is common enough to plan for

**The reliable method, in any market, is the same one used everywhere else in this skill:** run the market's real queries through the engines that market actually uses, record which sources get cited, and treat the recurring ones as targets. That produces evidence in a week where a table like this produces assumptions. DataForSEO SERP and AI Optimization endpoints accept a location code, so this is measurable per market rather than guessed.

**Query fan-out applies here too, and it interacts badly with thin translation.** A translated page that covers the source market's sub-questions will miss the target market's, because the questions people ask differ with regulation, pricing, climate, and convention. Build the fan-out set per market rather than translating one.

---

## Report format for international

```markdown
### International SEO

**Scope:** languages {list}, countries {list}
**Domain structure:** {ccTLD / subdomain / subfolder}

**hreflang:**
  - Implementation: {yes/no}
  - Variants covered: {N}
  - Validation: {pass/fail}
  - Return-references: {complete/incomplete}
  - x-default: {present/missing}

**Per-country platform visibility:**
| Country | Primary search | Visibility | AI platforms tested |
|---------|---------------|:---:|--------|
| UK | Google | {yes/no} | AIO, ChatGPT, Perplexity |
| DE | Google | {yes/no} | AIO, ChatGPT |

**Localization vs translation:** {quality assessment per market}

**Currency / region in schema:** {correct per variant / drift flagged}

**Fan-out coverage per market:** {built per market / translated from source — flag the latter}

**Score:** {0-100}
**Fixes, ranked by impact, risk and dependency order:** {list — domain-structure changes are the least reversible, do them last or not at all}
```

**Report rules:** no time or effort estimates. Label every statistic `[P]`, `[S]` or `[U]` — **and in this file, most of it is `[U]`.** Say so plainly rather than presenting untested market characterizations as findings.
