# International SEO for AI Systems

Multi-language and multi-country sites have citation mechanics traditional SEO handles clumsily and AI systems handle even more clumsily. This file runs when the site serves more than one language or country.

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

**2026 consensus recommendation:** subfolders for most, ccTLDs for large enterprises with dedicated country teams. Subdomains rarely optimal.

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

**Validation:** use the hreflang Tags Testing Tool (Merkle), Screaming Frog hreflang report, or Google Search Console's International Targeting report.

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

Major AI systems available by country (2026):

| Country | Dominant search | AI search also used | Notes |
|---------|----------------|---------------------|-------|
| US | Google | ChatGPT, Perplexity, Copilot, Claude | All AI platforms relevant |
| UK | Google | ChatGPT, Perplexity, Copilot | ClaudeBot via Brave |
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

AI query behavior varies by market:

- **US:** high "vs" comparison queries, long-tail informational, AI-heavy for commercial intent
- **UK:** similar to US but more "guide" and "how to" phrasing
- **Germany:** high information-seeking depth; AI cites highly structured, authoritative sources over thin content
- **France:** higher preference for French-language sources even when English equivalents are better
- **China (Baidu context):** very different — AI heavily favors Baidu-domain content (Baike, Zhidao, Baijiahao)
- **Multilingual markets (India, Switzerland):** code-switching queries common; optimize both languages per region

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

**Score:** {0-100}
**Launch-critical international fixes:** {list}
**Post-launch:** {list}
```
