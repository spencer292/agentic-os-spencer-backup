# Website launch checklist

Ordered by risk and dependency, not by effort. Nothing here carries a duration. Work top to
bottom inside each stage. An item marked BLOCKING means the launch does not proceed until it
passes.

Sources checked September 2026:

- Digital Applied, "Website Launch Checklist 2026: 150+ Items to Cover" — https://www.digitalapplied.com/blog/website-launch-checklist-150-items-2026
- Brand Vision, "Website QA Checklist Before Launch: Forms, Tracking, SEO, Speed, Accessibility" — https://www.brandvm.com/post/website-qa-checklist
- Block Agency, "Website launch checklist: pre-launch and post-launch QA for 2026" — https://blockagency.co/blog/website-launch-checklist/
- Scale Growth Digital, "Website Launch SEO Checklist 2026: 43 Points" — https://scalegrowth.digital/resources/seo/website-launch-seo-checklist/
- hafencity.dev, "Website Relaunch Without Losing SEO: 2026 Checklist" — https://hafencity.dev/en/blog/website-relaunch-without-losing-seo-checklist
- UXPin, "The Web Design Process: 8 Essential Steps From Strategy to Launch (2026)" — https://www.uxpin.com/studio/blog/web-design-process/
- Digital Silk, "58 Website Launch Checklist Items For 2026" — https://www.digitalsilk.com/digital-trends/website-launch-checklist/

The recurring finding across all of them: a redesign that ships without a redirect map, or
with the staging noindex still set, loses a large share of organic traffic inside two weeks,
and the loss is only visible after the damage is done.

---

## Stage 1: irreversible things (do first, everything else depends on them)

These are the items where a mistake is expensive to undo or invisible until traffic has
already gone.

1. **BLOCKING. Redirect map complete.** Every URL on the old site maps to a URL on the new
   site, or to a deliberate 410. Export the old URL list from Search Console, the old sitemap,
   the server logs and the analytics landing-page report, not from the CMS alone. The CMS does
   not know about URLs that only exist as inbound links.
2. **BLOCKING. Redirects are 301, single hop, no loops.** A chain of two or more hops leaks
   authority and slows crawl. `qa-run.mjs` reports every chain it finds.
3. **BLOCKING. Staging noindex removed.** Check the meta robots tag, the `X-Robots-Tag`
   response header, and the CMS setting. All three can carry it independently. This is the
   single most common launch failure in every source checked.
4. **BLOCKING. robots.txt on production is the production file, not the staging one.** A
   staging `Disallow: /` copied to production takes the whole site out of the index.
5. **BLOCKING. Canonical tags are absolute, https, and self-referencing** unless a page is a
   deliberate duplicate. A canonical left pointing at the staging host tells Google the real
   page does not exist.
6. **DNS records captured before any change.** Screenshot or export the current zone. Keep it
   for at least 72 hours past cutover.
7. **Full backup taken and restore tested.** A backup nobody has restored is a hope, not a
   backup. Restore it somewhere before you need it.
8. **Rollback plan written down.** Prior DNS records, a database snapshot, and the previous
   build artifact, all reachable by someone other than the person who built the site.

## Stage 2: content and legal (blocks launch, does not block build)

9. **BLOCKING. Every page proofread by someone who did not write it.** Lorem ipsum, placeholder
   phone numbers and "Client Name Here" survive far longer than anyone expects.
10. **Contact details correct everywhere.** Phone, email, address, opening hours. Check the
    footer, the contact page, the schema markup and the Google Business Profile all agree.
11. **BLOCKING. Privacy policy, cookie policy and terms of service published and reachable.**
12. **Accessibility statement published** if the site is public-sector in the UK or serves EU
    customers. WCAG 2.2 AA is the UK public-sector baseline, and the European Accessibility Act
    has applied to EU-facing services since 28 June 2025.
13. **Branded 404 page exists and is genuinely a 404.** A missing page that returns HTTP 200 is
    a soft 404 and gets the URL indexed as real content. `qa-run.mjs` probes for this.
14. **Branded 500 page exists.**
15. **Copyright year is dynamic**, not hardcoded to the build year.

## Stage 3: search carry-over (blocks launch)

16. **BLOCKING. Titles unique across the site.** Duplicates mean two pages compete for the
    same query.
17. **Meta descriptions unique and written, not auto-truncated body copy.**
18. **One h1 per page**, matching the page topic. A second h1 is usually a logo or a mobile
    header that was not marked up as a heading.
19. **Heading levels do not skip.** h2 follows h1, h3 follows h2.
20. **XML sitemap generated, listing only final, indexable, 200-status URLs.** No redirected
    URLs, no noindex URLs, no deleted URLs. A sitemap listing redirects actively slows the
    indexing of everything else in it.
21. **robots.txt declares the sitemap.**
22. **No URL is both in the sitemap and blocked by robots.txt.**
23. **Structured data validates.** Organization, LocalBusiness or Article as the page type
     requires, plus Breadcrumb. Treat schema as entity binding, not as a ranking lever.
24. **hreflang correct and reciprocal** if the site is multilingual.
25. **Image alt text present and meaningful** on every content image. Decorative images take an
    empty alt, not a missing one.

## Stage 4: forms and lead flow (blocks launch)

26. **BLOCKING. Every form submitted end to end on a real device, and the lead confirmed in the
    place it is supposed to land.** Run `references/form-test-protocol.md` in full. A form that
    posts successfully and drops the lead silently is the most expensive launch defect there is,
    because nothing alerts anyone.
27. **Notification emails arrive at more than one inbox**, and not in spam.
28. **SPF, DKIM and DMARC pass for the sending domain.** A new site on a new host often sends
    from a new IP that no DNS record authorises yet.
29. **CRM field mapping verified with a long value in every field.** Truncation shows up only
    with real-length input.
30. **Honeypot or equivalent bot defence present and tested against a real submission.**
31. **Success state tells the person what happens next and when.** "We will call you within two
    working days" beats "Form submitted".

## Stage 5: analytics and consent (blocks launch)

32. **BLOCKING. GA4 fires on every page, once.** A duplicated tag doubles every number for the
    life of the property.
33. **Google Tag Manager container loads once.**
34. **Conversion events defined and firing only when they should.** Test a page refresh and
    confirm nothing double-counts.
35. **Consent banner appears where required, and analytics behaviour matches the choice made.**
36. **The site still works with consent refused and cookies blocked.** Test in a private window.
37. **Internal traffic filtered** so the team's own visits do not pollute the first weeks of data.
38. **Search Console property verified for the production domain** before cutover, so day-one
    crawl errors are visible.
39. **Bing Webmaster Tools verified.**

## Stage 6: performance and security (fix before launch, rarely blocks it)

40. **Core Web Vitals inside target on the templates that carry traffic:** LCP 2.5 s or under,
    INP 200 ms or under, CLS 0.1 or under, all at the 75th percentile over 28 days. Test in an
    incognito window, mobile emulation first.
41. **Images compressed, served in a modern format, with explicit width and height.** Missing
    dimensions are the usual cause of a failing CLS.
42. **Fonts limited in number and loaded with a swap behaviour.**
43. **Third-party scripts audited.** Every one is either required, deferred, or removed. Heavy
    tag stacks are the usual cause of a failing INP.
44. **BLOCKING. HTTPS enforced.** The http version 301s to https. No page serves over http.
45. **BLOCKING. No mixed content.** One http image or script breaks the padlock. An http script
    or stylesheet is an active mixed-content load and browsers block it outright.
46. **TLS certificate valid, covering both the apex and the www host, with auto-renewal on.**
47. **Security headers set:** Strict-Transport-Security, Content-Security-Policy,
    X-Content-Type-Options, Referrer-Policy, and a frame policy. Run `tool-website-security` for
    the full grading.
48. **Admin and CMS login not linked from the public site, and rate-limited.**
49. **Dependencies free of high or critical vulnerabilities.** Run `tool-platform-security`.

## Stage 7: cross-device QA (blocks launch)

50. **BLOCKING. Screenshot matrix captured at mobile, tablet and desktop** for every template.
    `qa-run.mjs` does this at 390x844, 820x1180 and 1440x900.
51. **No horizontal scroll at any viewport.**
52. **Zero console errors and zero uncaught exceptions** on any template.
53. **No failed first-party requests.** Third-party ad and analytics beacons blocked by the
    browser are normal and are reported separately.
54. **Tested in Chrome, Safari, Firefox and Edge**, plus iOS Safari and Android Chrome. Safari
    is where CSS assumptions break.
55. **Every interactive element reachable by Tab, in an order that matches the visual flow,
    with a visible focus state.**
56. **Buttons are buttons and links are links**, not styled divs.
57. **Navigation works at every breakpoint**, including the mobile menu open and closed.
58. **Search works, if the site has search.**

## Stage 8: launch day sequence

Run in this order. Each step depends on the one before it.

59. Code freeze. No merges from here.
60. Take the final database backup and the final build artifact.
61. Lower the DNS TTL to 300 seconds, and wait out the old TTL before the flip.
62. Deploy to production, still behind the old DNS.
63. Smoke-test production directly by host or IP, before DNS moves.
64. Flip DNS.
65. Confirm propagation from more than one network, including a mobile connection.
66. Re-run `qa-run.mjs` against the live production host. This is the run that matters. The
    staging run was a rehearsal.
67. Verify the redirect map against the live host, sampling the highest-traffic old URLs first.
68. Submit the sitemap in Search Console and Bing Webmaster Tools.
69. Confirm the production robots.txt and meta robots one final time. Deploy pipelines have
    been known to re-introduce the staging file.
70. Watch error rates and conversion events in real time.
71. Restore the DNS TTL once the flip is confirmed stable.
72. Tell the team it is live, and only then tell the market.

## Stage 9: first seven days

73. **Daily:** Search Console coverage and crawl errors. New "Excluded by noindex" or
    "Blocked by robots.txt" entries mean something is still wrong.
74. **Daily:** analytics against the same period on the old site. A drop over roughly 20 percent
    in organic sessions means the redirect map has a hole.
75. **Daily:** conversion events and form leads actually arriving, counted against the CRM, not
    against the analytics number.
76. **Daily for the first two days, then every other day:** server error logs.
77. **Once, on day two:** crawl the live site fully and fix every broken link and redirect chain
    the crawl finds.
78. **Once, in the first week:** confirm the highest-value old inbound links land on live pages,
    not on redirects to redirects.

## Stage 10: first thirty days

79. **Weekly:** Core Web Vitals field data in Search Console. Field data lags, so the real
    performance picture only appears here.
80. **Weekly:** ranking movement on the terms that mattered before the launch. Expect a dip and
    a recovery. A dip with no recovery by week four is a carry-over problem, not a wobble.
81. **Weekly:** broken-link re-check. New content introduces new broken links.
82. **Once, at day thirty:** a retrospective covering what the launch broke, what the checklist
    missed, and what to add to it. Write the additions into this file.
83. **Once, at day thirty:** capture a screenshot baseline with `qa-run.mjs` and keep it. Every
    later change gets diffed against it.
