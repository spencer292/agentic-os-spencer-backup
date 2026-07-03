# Inbox Rules — how to handle Roy's email

> **Single source of truth.** Read this file *in full* BEFORE reading, drafting, or filing any email —
> both in an interactive session and at the top of every `gmail-daily-triage` cron run.
> **To add a rule:** append one dated bullet to the right section. It applies from that moment on.
> Last updated: 2026-06-21.

---

## 0. Golden rules — never break

- **Never send.** Replies are created as **drafts** only. Roy reviews and sends himself.
- **Never delete.** Junk/FYI are *archived* (recoverable), never trashed.
- **Never assume or propose a time on Roy's calendar.** I have no calendar access. For any scheduling,
  leave the time for Roy to fill, or ask the sender for their availability — never commit Roy to a slot.
  *(2026-06-19 — Roy)*

## 1. The three outcomes — read every email with judgement, then exactly one of:

| If it… | Goes to | Label |
|--------|---------|-------|
| **needs a reply** | **Gmail Drafts** (written in Roy's voice) | `Triage/Drafted` |
| **needs action, no reply** | **`Action`** folder | `Action` |
| **needs neither** | archived / filed (one folder) or `Junk` | area label |

Read with judgement means reading the actual content — never classify on sender or subject keywords alone.
A real ask can arrive from an automated-looking address (e.g. a forward from Roy's own alias).

## 2. Drafting rules — voice + behaviour

- Load `brand_context/voice-profile.md`. Plain British English (colour, organise, behaviour).
  Direct, warm, concise. No hustle/guru language. Avoid the word "but".
- Sign off as **Roy**.
- The draft is a starting point — keep it tight; Roy edits before sending.
- **Never invent facts only Roy holds** — prices, commitments, decisions, and calendar times (see rule 0).
  If a reply needs such a fact, draft around it or leave a clearly-marked `[Roy: …]` gap.

## 3. Classification policy — what's what

- **Security / account / credential notices** (2FA, password, new sign-in, billing-method changes,
  domain/advertiser verification) → **Action**, never auto-archived.
- **Marketing / newsletters / product launches / webinars / onboarding nags** → `Junk`.
- **Roy's own automation alerts** (n8n "Workflow Failed", Vercel deploy failures) → `Notification`/FYI,
  summarised in the report — not surfaced as individual action items.
- **Invoices / receipts / statements** → `Finance`.

## 4. People — always read, lean toward a reply

- **Catheryne Shuman** `catheryne@bos-up.coach` — BOS UP Solution & Academy Director. Real colleague.
  Her mail and the BOS UP **academy-training-videos** thread (incl. "Video Process", shared Dropbox folders
  and Vyond lesson links) → always read; file to **`Clients/Normal`** (archive). *(2026-06-21 — Roy)*
- Roy's own aliases that forward in here: `allthepower.co.uk`, `ecmsp.co.uk`, `citc.it`, `prosyn.net`
  — treat the *original* sender inside the forward as the real correspondent.
- **Ian Castleman** `ian@castleman.co.uk` — family; finance/accounts reconciliation. Always read; sensitive —
  never draft figures or commitments, surface for Roy to handle himself. *(2026-06-21)*
- **Laura Vaillancourt** `laura@eldercarecounselor.com` — personal/partner (Google Photos partner-sharing). Read. *(2026-06-21)*
- **Elean / Ana @ Zernio** `elean@`/`ana@zernio.on.crisp.email` — Zernio partnership (real humans, async-only, no calls).
  Read; file concluded threads to `Clients/Normal`. The Zernio case-study/podcast offer is still open if Roy wants it. *(2026-06-21)*
- **Jo Rogers** `jo.rogers@navistarlegal.com` — legal advisor (tax position / BADR / Entrepreneurs' Relief). Read;
  file to `Finance`; surface any open question to Roy. *(2026-06-21)*
- **Emma Foy** `emma.foy@ecmsp.co.uk` — Roy's accountant (ECMSP); finance, restructuring, the Ian separation/reconciliation
  matter. Read; file to `Finance`; surface decisions/recommendations. (Distinct from the unrelated sales "Emma Foy"
  at `technology1.com`.) *(2026-06-21)*
- **Costas Lambropoulos** `lambropoulos.costas@gmail.com` — peer/contact (shared his leadership book). Personal → `Needs-You`. *(2026-06-21)*
- **Lorraine Castleman** `lorraine.castleman@gmail.com` — family. Always read → `Needs-You`. *(2026-06-21)*
- **Community / webinar / affiliate contacts** (read; file `Clients/Normal`): Michael LaManna `michael@precision180.com`,
  Ronnie Hughan `ronnie.hughan@gmail.com`, Costas Lambropoulos, Gemma Collins `gemmacollinstheoriginal@gmail.com`,
  Chris Bowden `chrisgsol53@gmail.com`, Angiras Auro `angiras@integral-health.co.uk` (affiliate), Max Munson
  `maxmuncz@gmail.com` (gave a **testimonial** — worth keeping). Simon Bowden `simon@atpbos.com` = Roy's team. *(2026-06-21)*
- *(add clients, podcast guests, partners as we go)*

## 5. Per-sender / per-topic exceptions

- **Junk (marketing/bulk):** `gohighlevel.com`, `clickfunnelsnotifications.com`, `marketingsecrets.com`,
  `lindy.ai`, `rive.app` (product drips), Dropbox **marketing/onboarding** nags, `redditmail.com` digests,
  Venmo social notifications. *(2026-06-21)*
- **Split senders — read the message, not just the domain:** `noreply@wise.com` "money added" → `Finance`,
  but `info.wise.com` marketing → `Junk`. Dropbox **security sign-in** → Action, but Dropbox marketing → `Junk`.
  `miki@updates.zernio.com` launch blasts → `Junk`, but `ana@`/`elean@zernio` (partnership) → always read. *(2026-06-21)*
- **Finance:** subscription-renewal / upcoming-invoice notices (e.g. `wispr.ai`) → `Finance`. *(2026-06-21)*
- **Got-Moles:** Google Business review notifications → `Got-Moles` (optional: reply to the review). *(2026-06-21)*
- **Expired one-time links** (magic-login links forwarded in, e.g. HeyGen) → `Junk` once spent. *(2026-06-21)*
- **Cold B2B outreach** — unsolicited sales / lead-gen / appointment-setter pitches ("I can get you clients",
  "open to a quick demo/chat", agencies selling TO Roy) → `Junk`, even from a real human and even mid-sequence.
  `Leads` is for inbound prospects for Roy's business, never people pitching him. *(2026-06-21)*
- **Subscriber/reader replies** to Roy's newsletter or emails (genuine, warm, on-topic) → **draft a short reply**
  in Roy's voice. e.g. Muhammad re breathwork/Dispenza. *(2026-06-21)*
- **Google Ads/Cloud:** policy/ToS updates → `Marketing` (file); user-study & feedback surveys → `Junk`;
  **billing past-due / project-suspension / payment-declined** → **Needs-You** (never archive). *(2026-06-21)*
- **`sanity.io` split:** `notifications@sanity.io` plan/account changes (e.g. project downgraded) → surface as
  Needs-You/`Notification`; `knutmelvaer@`/webinar marketing → `Junk`. *(2026-06-21)*
- **AI/tool model deprecations** that affect Roy's pipelines (e.g. Imagen endpoints discontinued) → **Needs-You**. *(2026-06-21)*
- **Meetup DM notifications** (content not in the email) → `FYI`; flag the sender name so Roy can check if known. *(2026-06-21)*
- **Google Maps Local-Guide vanity notices** (review views/milestones for places Roy reviewed) → `Junk`. *(2026-06-21)*
- **Zernio automated** — chat transcripts (`transcripts@zernio.on.crisp.email`), API/quota notices → `Notification`. *(2026-06-21)*
- **Microsoft Advertising / Bing Places** — account invitations, "business is live", "verify your business" → `FYI`;
  webinars ("Perform and transform") → `Junk`; expired OTP/verification codes (Microsoft, GoHighLevel, etc.) → `Junk`. *(2026-06-21)*
- **Google Ads API** approval/application confirmations → `Notification`. **Google Ads rep outreach:** generic
  ("dedicated expert / I found solutions") → `Junk`; a named strategist following up on a real prior conversation
  (e.g. Abhirath re conversion tracking) → `Needs-You`. *(2026-06-21)*
- **Roy's own calendar artifacts** (Zoom invites/cancellations from `roy.castleman@ecmsp.co.uk`) → `Junk`. *(2026-06-21)*
- **Roy's own funnel test results** (`scoreappmail.com` Business Freedom Assessment) → `FYI`. *(2026-06-21)*
- **Google Photos / account-privacy** partner-sharing notices → `FYI` (flag if unexpected). *(2026-06-21)*
- **Google Ads rep** calendar invites / Meet links / "book a 1:1" (Abhirath, Mohammed, Sindhuja via `xwf.google.com`) →
  `Junk` when past/superseded; only a concrete, current follow-up referencing real work → `Needs-You`. *(2026-06-21)*
- **Venmo** quarterly statements → `Finance`; privacy/social/onboarding → `Junk`. *(2026-06-21)*
- **Bing Webmaster Tools** crawl/SEO site notices → `FYI`. *(2026-06-21)*
- **Security sign-in alerts:** recent/unknown device → `Needs-You`; >30 days old and matching Roy's usual OS (Windows) → `FYI`. *(2026-06-21)*
- **Google AI Studio:** product newsletters → `Junk`; billing / usage-tier / account changes → `Notification`
  (→ `Needs-You` if future-dated and genuinely actionable, e.g. model deprecation). *(2026-06-21)*
- **Finance/legal advisor threads** (accountant, solicitor) → file `Finance`; surface only open questions/decisions. *(2026-06-21)*
- **Bulk marketing senders** — `samsung@innovations.samsungusa.com` (Galaxy promos), `miki@updates.getlate.dev` /
  Late/Zernio product newsletters, Google AI Studio & NotebookLM product newsletters → `Junk`. *(2026-06-21)*
- **Roy's own podcast-guest n8n notifications** (`roy@atpbos.com` "New Podcast Guest: Episode #…") → `Notification`
  (records of guest + Drive folder; not individual action items). *(2026-06-21)*
- **`citc.it` (Computers in the City) invoice/finance emails** → `Finance`. *(2026-06-21)*
- **Google Cloud** billing / permissions / credential-security advisories → `Notification`;
  **Google Maps Timeline / account-privacy** notices → `FYI`. *(2026-06-21)*
- **VA/assistant-placement & "save you N hours" cold pitches** (e.g. OBM Solutions) → `Junk`. *(2026-06-21)*
- **Confirmed bulk-junk senders** (read & verified, backlog-swept) → `Junk`: `pikzels.com`, `marketingsecrets.com`
  (Russell Brunson), `seobility.net` feature newsletters, `placid.app` win-back, `samsung-mail.com` account-verify spam,
  and cold email-infra/MSP-growth outreach (`buildyourinfra.info`, `diyemailinfra.info`, `abmstarsgroup.com`). *(2026-06-21)*
- **Real humans NOT to bin** (look like bulk, aren't): `emily@advizehub.com` (Emily McSherry — podcast guest, asked for a
  working link → reply), `michael@precision180.com` (replied warmly to Roy's outreach). *(2026-06-21)*
- **Podcast-guest replies** to "Your Power Movers Podcast episode … release" emails → `Clients/Normal`; a guest asking
  "where's my clips folder / link doesn't work" → `Needs-You` (send the real link). *(2026-06-21)*
- **Campaign "I'm in" responses** to Roy's broadcasts (e.g. "For the ambitious ones") → `Leads` (warm, follow up). *(2026-06-21)*
- **Pau / Late–Zernio support** (`pau@getlate.on.crisp.email`) → partnership, `Clients/Normal`; Late/Zernio chat
  transcripts → `Notification`. *(2026-06-21)*
- **Roy's self-forwarded historical legal/M&A docs** (Prosyn / RJA / Bodyflight, via `roy@allthepower.co.uk`) → `Finance` (archival). *(2026-06-21)*
- **PayPal / Venmo:** statements → `Finance`; marketing/welcome/cashback → `Junk`; verify-email / new-device / "suspended,
  send photo ID" → `FYI` (for suspensions, verify IN-APP, treat email links as possible phishing). *(2026-06-21)*
- **Google Slides/Drive shares from real people** (e.g. Eldercare campaign deck, writing-retreat folder) → `Clients/Normal`. *(2026-06-21)*
- **Bounce/delay notices to the placeholder `roy@youremaildomain.com`** → `FYI`; ⚠️ flag — a workflow has an unconfigured
  recipient (real ops bug to fix). *(2026-06-21)*
- **Cal.com / Zoom self-booking artifacts** ("30 Min Meeting between Roy Castleman and Roy", `hello@cal.com`) → `Junk`. *(2026-06-21)*
- **Google Workspace ads-credit / "grow with Google Ads" / Analytics onboarding** marketing → `Junk`;
  Analytics↔Ads link-created confirmations → `Notification`. *(2026-06-21)*
- **Google account-security events:** sign-in alerts → `FYI` (stale/known device); structural changes (2FA enabled,
  phone added, **recovery phone changed**) → `FYI` if old/expected, **`Needs-You` if recent or unexpected**. *(2026-06-21)*
- **YouTube channel-access invitations** → `FYI` (Action only if not yet accepted). *(2026-06-21)*

---

## Change log
- **2026-06-19** — File created. Rule 0: never assume calendar times. People: Catheryne Shuman added.
- **2026-06-21** — Backlog read-with-judgement pass began. Added §5 sender rules (marketing→Junk; Wise/Dropbox/Zernio
  split senders; Finance renewals; Got-Moles reviews; expired links). Catheryne/BOS UP academy mail → `Clients/Normal`.
  Cron model bumped sonnet→opus; `gmail-fetch.cjs` now reads full bodies (`--full`).
