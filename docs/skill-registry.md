# Skill Registry

Auto-populated as skills are installed. Each entry includes its name and trigger conditions.

---

## Skill Systems (00-*)

Orchestrator skills that chain other skills into complete pipelines.

| Skill | Triggers on |
|-------|-------------|
| `00-brand-build` | "build a brand", "build my whole brand", "create a brand from scratch" — full brand-from-scratch pipeline (ICP, strategy, positioning, voice, visual identity) |
| `00-website-build` | "build a website", "website rebuild", "redesign the site", "new site for", "site migration", "relaunch the website", "run the website process", "full website project" — end-to-end agency build process with a client sign-off gate per phase; Level 3 GSD project in `projects/briefs/{client}-website/` |
| `00-longform-to-shortform` | "full pipeline", "process video", "long to short", "YouTube to shorts", "create short-form content from" — YouTube URL → download → transcribe → clips → render → post |
| `00-slides` | "create a presentation", "create slides", "make a deck" |
| `00-social-content` | "run social content", "generate post", "create posts from my sources" — source-to-post social content pipeline |
| `00-video-studio` | "process studio inbox", "studio video", "make a clip from", "turn this footage into a reel", "process my drops" |
| `00-youtube-to-ebook` | "turn this video into an ebook", "youtube to article", "video to PDF" |

## Meta Skills

| Skill | Triggers on |
|-------|-------------|
| `meta-skill-creator` | "create a skill", "build a skill", "new skill", "make a skill", "optimize skill description" |
| `meta-skill-system-creator` | "create a system", "package these skills", "build a skill system", "turn this into a system", "system from skills" |
| `meta-synthesize-locals` | "synthesize skills", "sync local overrides", "clean up local files" |
| `meta-wrap-up` | "wrap up", "close session", "end session", "we're done", "session done" |
| `meta-memory-write` | "remember this", "remember that", "note that", "save this to memory", "update memory", "log this", "forget about", "remove from memory" |
| `meta-memory-recall` | "what did we decide about", "do we have a record of", "search memory", "look up in memory", "what do we know about X" |

## Foundation Skills

| Skill | Triggers on | Writes to |
|-------|-------------|-----------|
| `mkt-brand-strategy` | "brand strategy", "brand foundation", "brand archetype", "brand essence", "positioning statement", "brand discovery", "message house" | `brand-strategy.md` |
| `mkt-brand-voice` | "tone", "writing style", "brand voice", "how we sound" | `voice-profile.md`, `samples.md` |
| `mkt-positioning` | "differentiation", "angle", "hooks", "USP" | `positioning.md` |
| `mkt-icp` | "target audience", "buyer persona", "ideal customer" | `icp.md` |
| `mkt-visual-identity` | "visual identity", "brand identity", "design tokens", "extract visual identity" | visual identity tokens + templates |

## Marketing Skills

| Skill | Triggers on |
|-------|-------------|
| `mkt-quote-builder` | "create a quote", "quote for {client}", "banded quote", "proposal for", "send a proposal", "pricing options", "three options", "price this engagement", "what should we charge" |
| `mkt-youtube-optimizer` | "will this perform", "score this video", "youtube review", "youtube audit", "make/fix the thumbnail", "why did this video flop", pre-publish gate + thumbnail step for `mkt-youtube-content-package` |
| `mkt-youtube-content-package` | "publish a video", "create YouTube content", video SEO — full package: title, description, keywords, timestamps, thumbnail concepts, posting via Zernio |
| `mkt-copywriting` | "write copy for", "landing page copy", "sales page", "make this convert", "write a headline", "score this copy", "email copy", "ad copy" |
| `mkt-content-repurposing` | "repurpose this", "turn this into social posts", "atomize this" |
| `mkt-content-analytics` | "check analytics", "review post performance", "compare content metrics" — via Zernio MCP |
| `mkt-social-showing` | "social showing", "make this post viral", "optimize this post", "post package for", "viral package", "write the hook for" |
| `mkt-short-form-posting` | "post short", "post reel", "post shorts", "upload short", "short-form" — platform rules for short-form publishing |
| `mkt-ugc-scripts` | "write a script", "UGC script", "video script for", "TikTok script", "Reels script", "Shorts script", "batch scripts" |
| `mkt-longform-article` | "write an article from this transcript", "turn this video into a long-form article" |
| `mkt-scorecard-funnel` | "build a scorecard", "quiz funnel", "scorecard funnel", "lead magnet quiz", "assessment quiz", "build a quiz for", "diagnostic quiz", "self-assessment tool", "replace ScoreApp", "design the quiz questions", "quiz results copy", "interactive lead magnet" → `projects/mkt-scorecard-funnel/{client-slug}/` |

## Strategy Skills

| Skill | Triggers on |
|-------|-------------|
| `str-ai-seo` | "AI SEO", "AEO", "GEO", "LLMO", "answer engine optimization", "AI citations", "AI visibility", "optimize for ChatGPT/Perplexity/Claude", "show up in AI answers" |
| `str-trending-research` | "what's trending", "research topic", "what are people saying about", "recent discussions", "community sentiment on", "last 30 days" |
| `str-board-sitting` | "board sitting", "run the board", "take this to the board", "board meeting on" |
| `str-ux-research` | "discovery", "discovery phase", "research before we design", "stakeholder interview", "user research", "jobs to be done", "content audit", "content inventory", "competitor teardown", "audit the current site" → `projects/str-ux-research/{date}_{client}-discovery.md` |
| `str-cro-audit` | "CRO audit", "audit this page", "why isn't this converting", "conversion review", "score this page", "why are people bouncing", "audit my quiz funnel", "why do people drop off" → `projects/str-cro-audit/{date}_{page}-audit.md` |
| `str-keyword-strategy` | "keyword research", "keyword strategy", "what should we target", "intent mapping", "keyword clustering", "topical authority planning", "keyword foundation", "keyword remap", "AI search volume", "fan-out coverage", "cannibalisation check" → `brand_context/target-keywords.md` |
| `str-question-harvester` | "question harvester", "what questions are people asking", "find questions", "PAA research", "harvest questions", "FAQ gaps", "question bank", "what should we answer", "content gaps", "fan-out sub-queries" → `projects/str-question-harvester/{YYYY-MM-DD}_{brand-slug}-audit.md` |
| `str-authority-strategy` | "authority strategy", "brand mentions", "mention monitoring", "backlink strategy", "link building plan", "earned media strategy", "topical authority plan", "co-citation strategy", "entity SEO", "sameAs spine", "who should link to us", "how do we get into best-of lists", "linkable assets", "YouTube authority", "hallucination correction", "brand SERP defense" → `brand_context/authority-strategy.md` |
| `str-onpage-audit` | "on-page audit", "SEO audit", "AEO audit", "page audit", "score this page for SEO", "fix H1s sitewide", "apply audit fixes", "cannibalisation cull", "AI crawlability check" → `projects/str-onpage-audit/{YYYY-MM-DD}_{site-name}-audit.md` |
| `str-internal-links` | "internal linking audit", "orphan pages", "link depth", "cross-linking", "link equity", "anchor text audit", "apply the link fixes", "implement internal links" → `projects/str-internal-links/{YYYY-MM-DD}_{site-name}-audit.md` |
| `str-security-audit` | "security audit", "security review", "vulnerability scan", "npm audit", "CSP audit", "header security", "DMARC or SPF check", "harden the site", "fix security findings", "apply security fixes" — active eleven-area audit + phased apply-fixes on a site you own (passive external check = `tool-website-security`) → `projects/str-security-audit/{date}_{site}-security-audit.md` |

## Writing Skills

| Skill | Triggers on |
|-------|-------------|
| `writ-review` | "review this draft/chapter", "score this against the methodology", "what's working and what's not", "is this landing", "make this piece work" — per-piece craft review (effectiveness, not presence) against a methodology module (pilot: Dennis Ross). |
| `writ-draft` | "draft this chapter", "write this section", "turn these notes into a chapter", "apply the review / fix this draft", "rewrite this with the prescriptions" — methodology-driven drafting (Draft mode) + revision (Revise mode); never invents lived specifics (uses `[[NEEDS:]]` brief+example placeholders). |
| `writ-editor` | "review my manuscript", "does the book hang together", "does it flow between chapters", "is the arc working", "am I repeating myself across chapters", "continuity check", "editor pass", "managing-editor read" — whole-MANUSCRIPT editorial pass (cross-chapter through-line, arc, continuity, repetition, pacing, payoff, voice consistency). Sibling of `writ-review` (per-piece) and `writ-draft` (generator). |

## Visual Skills

| Skill | Triggers on |
|-------|-------------|
| `viz-stitch-design` | "design a UI", "create a screen", "stitch design", "UI mockup", "app design", "landing page design", "mobile screen", "web layout", "wireframe to UI", "design this page" |
| `viz-interface-design` | "dashboard", "admin panel", "SaaS UI", "data interface", "metrics display", "control panel", "monitoring UI", "analytics view", "settings page", "interactive tool interface" |
| `viz-excalidraw-diagram` | "excalidraw diagram", "draw a diagram", "visualize this workflow", "architecture diagram", "system diagram" |
| `viz-image-gen` | "generate an image", "create an infographic", "image gen", "make an image of", "illustrated diagram", "storyboard" — GPT Image / Gemini with 6-Element Framework |
| `viz-nano-banana` | "nano banana", "notebook sketch", "comic strip", "hand-drawn diagram", "sketchnote", "generate a visual" — Gemini 3 Pro Image, 5 styles, direct-prompt or SVG-blueprint mode |
| `viz-remotion-video` | "remotion video", "explainer video", "course video", "animated explainer", "two-host explainer", "make a course video" — All The Power brand Remotion studio |
| `viz-hyperframes` | "create a video", "make a motion graphics video", "product video" |
| `viz-frontend-slides` | "build slides", "generate the deck", "render presentation", "slide design" |
| `viz-design-system` | "design system", "design tokens", "colour palette", "brand colours", "typography system", "type scale", "spacing system", "design guidelines", "set up the design foundation", "define the look and feel", "match this site's styling" → `brand_context/design-system.md` + `projects/viz-design-system/` |
| `viz-page-architect` | "site architecture", "information architecture", "sitemap", "navigation structure", "user flow", "funnel design", "page structure", "page blueprint", "section order", "wireframe the page", "landing page structure", "what goes on the homepage" → `projects/viz-page-architect/` |
| `viz-component-library` | "component spec", "component library", "hero section design", "sticky mobile CTA", "quiz step", "results gauge", "trust strip", "form design", "pricing table", "testimonial block", "design this section" → `projects/viz-component-library/` |

## Video Skills

| Skill | Triggers on |
|-------|-------------|
| `vid-clip-selection` | "select clips", "find best clips", "clip selection", "extract shorts from" |
| `vid-clip-extractor` | "extract clips", "reframe video", "clip extractor", "portrait crop" |
| `vid-condensed-edit` | "condensed edit", "best bits edit", "highlight episode", "condensed YouTube version", "cut this episode down for YouTube" |
| `vid-ffmpeg-edit` | "edit clip", "add subtitles", "burn captions", "illustrate clip" |

## Operations Skills

| Skill | Triggers on |
|-------|-------------|
| `ops-cron` | "schedule a job", "cron job", "run this every morning", "automate daily", "recurring task", "scheduled job", "check scheduled jobs", "list jobs", "run job manually", "start crons", "stop crons", "cron status", "cron logs" |
| `ops-google-ads` | "google ads", "ads audit", "ads review", "campaign status", "keyword research for ads", "build a campaign", "negative keywords", "RSA", "PPC audit", "ad spend", "conversion tracking check", "quality score" |
| `ops-release-assurance` | "review this before we ship", "release review", "is this change safe to ship" |
| `ops-repo-assessment` | "assess this repo", "release assurance assessment", "gap analysis on this codebase" |

## Finance Skills

| Skill | Triggers on |
|-------|-------------|
| `fin-invoice-reconciliation` | "reconcile invoices/receipts", "match receipts to bank transactions", "chase missing receipts", "unexplained transactions", "receipt audit", weekly bookkeeping tidy-up |
| `fin-month-end-reporting` | "month-end close", "finalize the month", "monthly P&L", "do my monthly numbers", "monthly financial summary", scheduling a recurring monthly finance job |

---

## Utility Skills

| Skill | Triggers on |
|-------|-------------|
| `tool-stitch` | "fetch stitch design", "get stitch screens", "stitch project", "pull from stitch", "stitch code", "export stitch" |
| `tool-humanizer` | "humanize this", "de-AI this", "make this sound human", "remove AI patterns", "is this AI slop" — also called automatically by execution skills post-processing |
| `tool-fact-checker` | "fact check", "verify this", "is this true", "check these claims" |
| `tool-publisher` | "post", "publish", "post now", "publish post" |
| `tool-zernio-social` | "post to", "schedule post", "upload to", "publish to" — Zernio social publishing |
| `tool-transcription` | "transcribe this file", "speech to text", "video to text", "extract captions" — local files via WhisperX |
| `tool-youtube` | "latest youtube video", "get transcript", "youtube transcript", "video metadata", "video stats" |
| `tool-video-upload` | upload and compress videos for YouTube publishing |
| `tool-video-screenshots` | "screenshot from video", "extract frames", "video screenshots" |
| `tool-web-screenshot` | capture web page screenshots with multi-backend routing |
| `tool-screenshot-annotator` | "annotate this screenshot", "add numbered circles", "highlight this area" |
| `tool-image-search` | search the web for licensed images for social-content posts (Openverse, Wikimedia, Imgflip) |
| `tool-linkedin-scraper` | "scrape linkedin", "linkedin posts", "fetch linkedin profile" — via Apify |
| `tool-firecrawl-scraper` | scrape/crawl websites into LLM-ready data via Firecrawl API |
| `tool-pdf-generator` | "generate PDF", "convert to PDF", "make a PDF", "markdown to PDF" |
| `tool-platform-security` | "security audit", "scan for secrets", "check for hardcoded credentials", "is this repo safe to push" — static audit of THIS codebase |
| `tool-website-security` | "website security audit", "audit this site", "check security headers", "TLS/SSL check" — passive audit of a live URL |
| `tool-infra-security` | "audit this server", "audit the VPS", "host security", "is this box safe" |
| `tool-accessibility-audit` | "accessibility audit", "WCAG audit", "is this site accessible", "a11y audit", "screen reader test", "keyboard accessibility", "axe scan", "WCAG 2.2 AA", "accessibility statement", "contrast check", "are we compliant", "European Accessibility Act", "public sector accessibility regulations" → `projects/tool-accessibility-audit/{date}_{site}-audit.md` |
| `tool-web-performance` | "Core Web Vitals", "page speed", "performance audit", "why is my site slow", "LCP", "INP", "CLS", "PageSpeed score", "Lighthouse score", "speed up the site" → `projects/tool-web-performance/{date}_{site}-cwv.md` |
| `tool-web-qa` | "QA the site", "pre-launch check", "launch checklist", "ready to launch", "check for broken links", "did anything break", "visual regression", "screenshot every page", "check the redirects", "did we leave noindex on", "post-deploy check", "site health check" → `projects/tool-web-qa/{date}_{site}/` |
| `tool-behaviour-analytics` | "set up Clarity", "Microsoft Clarity", "heatmaps", "session recordings", "add analytics to the site", "GA4 setup", "GTM", "tracking plan", "event taxonomy", "conversion tracking", "build a funnel", "where are people dropping off", "rage clicks", "dead clicks", "scroll depth", "consent mode", "weekly analytics review" → `projects/tool-behaviour-analytics/{YYYY-MM-DD}_{site}-{setup|review}.md` |

---

*Optional skills are auto-registered by reconciliation when their folders appear on disk. Install with `bash scripts/add-skill.sh <name>`. See `.claude/skills/_catalog/catalog.json` for the full list.*
