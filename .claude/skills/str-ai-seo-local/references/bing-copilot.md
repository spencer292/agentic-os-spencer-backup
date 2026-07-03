# Bing + Copilot + Apple — The Underweighted Surface

Bing/Copilot/Apple is not a footnote for a Western Washington pest-control company. The demographic skews older and Edge-default, and a single Bing Places listing surfaces in 4 places: Yahoo Search, Microsoft Copilot, Windows Search, and Bing itself.

## Bing Places per location

| Section | Pass criteria |
|---------|---------------|
| Claim status | All 3 GBPs claimed and verified on Bing Places. Free import from GBP — but verify the import didn't lose data |
| NAP | Matches GBP exactly. Watch for phone-format drift (parens vs dashes — Bing matches strict) |
| Categories | Primary: Pest Control. Bing's category set is smaller than Google's; pick closest match per location |
| Hours | Match GBP. Bing's "Open now" surfaces in Copilot answers about local availability |
| Photos | At least 10 per location. Bing Business Profile Image Slider (2026 feature) shows top 6 in Copilot results |
| Services | List TMCP, One-Time, Commercial — Bing parses these into structured offerings |
| Reviews | Bing imports Google reviews via Yelp/Facebook — verify aggregateRating shows up. If only "based on N reviews" with no rating, the import broke |
| Owner verification | Phone or postcard verification per location. Bing's verification is less seamless than Google's — budget time |

## Bing Webmaster Tools — AI Performance (Feb 2026 launch)

Microsoft launched the AI Performance report inside Bing Webmaster Tools on 2026-02-09 (public preview). It surfaces:

- **Citation count** per page across Copilot answers
- **Grounding queries** — the user prompts that Copilot resolved to your URL
- **Visibility trends** over time
- **Page-level performance** — which pages drive most citations

Action: confirm this is enabled in the `got-moles-measurement-setup` Track A2 work. After 7 days of property verification, citation data populates. Pull monthly into the re-audit.

Annotation rule: if Bing Webmaster Tools is not yet verified, flag in audit but **don't re-recommend** — it's already scoped in measurement-setup Track A2.

## Apple Business Connect

Free. Surfaces in Apple Maps, Siri, Spotlight on every iPhone in Western Washington. The older-skewing homeowner demographic for mole removal heavily indexes to iOS.

| Section | Pass criteria |
|---------|---------------|
| Claim | All 3 locations claimed, verified |
| Showcases | At least 1 active "Showcase" per location (Apple's equivalent of GBP Posts). Photo + headline + CTA. 30-day expiry. |
| Action button | Set per location: Call, Directions, or Website. Pick based on funnel — Call for emergency intent, Website for research intent |
| Photos | At least 5 per location. Apple's display privileges first 3 strongly |
| Reviews | Apple imports from Yelp + own ABC reviews. Reviews on Apple are independent of Google's review pool — counts separately |

## Yelp + Nextdoor + BBB

Yelp citation pattern in AI Overviews: ChatGPT cites Yelp 4.2% of the time for local-service queries (2026 GEO benchmark data). Nextdoor cites in hyperlocal queries (e.g., "best mole removal near Issaquah") at higher rates than national platforms.

| Platform | Why it matters | Audit check |
|----------|---------------|-------------|
| Yelp | Cited in AI Overviews + still ~5-8% of homeowner consideration set | Claimed, photos, response rate, hours match GBP |
| Nextdoor | Cited heavily in hyperlocal AI Overviews, free local recommendations | Active business profile, recent posts, neighbor reviews |
| BBB | Trust signal in older demo, weak in AI Overview citation | Accreditation status, A+ rating, complaints resolved |
| Angi | Lead-gen platform, weak AI citation but homeowner trust signal | Claimed, response rate, badges |
| Facebook | Cited in AI Overviews especially for community-sourced answers | Active page, NAP consistent, post cadence |

## Sources

- [Bing Webmaster Tools — AI Performance public preview launch](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview)
- [ALM Corp — Bing Webmaster Tools AI Performance complete guide 2026](https://almcorp.com/blog/bing-ai-performance-webmaster-tools-complete-guide/)
- [Bing Places for Business — Complete Optimization Guide 2026](https://thestacc.com/blog/bing-places-guide/)
- [Pedowitz Group — How Bing Copilot Sources Answers (AEO)](https://www.pedowitzgroup.com/how-bing-copilot-sources-answers-aeo-for-microsoft-search)
