# AI Ad Gate

Every AI ad passes this gate before it goes to Spencer, and nothing ships without his OK.
This gate adds AI-specific rules on top of `.claude/skills/mkt-cmo/references/claims-gate.md`.
Read that file first. Where any reference digest in this skill conflicts with either gate, the
gates win: the digests repeat course advice, and the course teaches several things we never do.

## 1. Claims (from the claims gate, the short version)

- No I-713 claims. No "WA's #1", best or largest. "15+ years" is Spencer's personal experience;
  the company was founded in 2017.
- Review count: **re-measure before every new use** with `node scripts/gbp-scrape-reviews.mjs`
  (trust `scrapedAt`, not the filename). Never state the total as a five-star count.
- No client count until the conflict in claims-gate §3 is resolved.
- Prices only from the published residential tiers. Commercial and over-5-acre properties sell
  *the visit*, never a price.
- Lead with "chemical-free, safe for pets and kids". Trapping is the method, not the identity.
- Dead moles go double-bagged into the customer's garbage can. Never show or say "hauled away".
- US English, and an American accent on every voice.

## 2. Posture A applies to the picture too

Paid ads never name the mechanism, and **never show it either**. The rule covers every frame,
every style (photoreal, 2D, clay, cartoon) and every sound effect:

- No traps, trap-setting, probes pushed into a tunnel with a trap beside them, or tool kits that
  read as traps.
- No dead, injured or suffering mole. No "snap" SFX, no comedic violence toward the mole.
- A cartoon or clay mole is fine as a cheeky character: popping up, smug, packing a suitcase and
  leaving, being outsmarted. The story is the tech solving the problem and the lawn recovering,
  never the mole being harmed.
- No "chaos/injury" hooks such as someone falling, crashing or getting hurt. The course rewards
  them; for a trust-led local brand they are off.
- Banned words in VO, captions and on-screen text: kill, lethal, body-gripping, scissor, harpoon,
  spike, poison, bait, exterminate, eradicate.

**Homograph check.** Mole means a skin mole too. Nothing in an image, caption or hook may read as
skin, dermatology or medical. Write "moles in your lawn/yard", not "get rid of moles".

## 3. AI people and honesty (FTC endorsement rules, platform AI policies)

| Allowed | Never |
|---|---|
| An AI presenter clearly framed as a **brand spokesperson** explaining things ("Here's how to tell moles from voles") | An AI person speaking as a **customer** ("We had moles for years until Got Moles…") |
| **Spencer or a real tech** cloned with their **written consent**, saying things they'd say | Cloning anyone without written consent on file |
| **Real** reviews, quoted verbatim with first name and town as published on Google | Invented reviews, AI-voiced reviews, a "testimonial cascade" of made-up voices (the course's Witness framework) |
| A host-and-expert podcast where the expert is labelled honestly ("mole-control specialist" = the real team) | A fake doctor, fake credential, or an "expert" who doesn't exist on the team |
| Claymation, 2D or obviously stylized characters, including named fictional homeowners | Photoreal "hidden camera" or "not an ad" hooks that pretend to be real footage of a real customer |
| Real before/after lawn photos from our jobs | AI before/after presented as a real customer's yard |

- Photoreal AI people get a visible "AI-generated" label in the caption or on screen. Tick the
  platform's AI-content disclosure when it offers one. Platform rules change, so check Meta's and
  Google's current AI-disclosure policy before the first spend on a photoreal AI person.
- No invented statistics. If the course template asks for proof we don't have, delete the line.
  Don't fill it in.
- No competitor names, no third-party brands or celebrities in prompts or frames.
- No fake engagement (second accounts, planted errors to bait comments), no comment filters
  that hide "this is AI" remarks. The course teaches both; we never use them.

## 4. Pre-ship checklist

Answer each item in one line in the ad's `gate.md`:

1. Claims gate §1–§6 cleared (paste its six one-liners).
2. No mechanism in words, frames or SFX. Homograph-safe.
3. Every person on screen is one of: a real consenting person, a labelled AI spokesperson, or an
   obviously stylized character. Nobody AI-generated speaks as a customer.
4. Every number traced to a dated source, or removed.
5. Logo, colors and van/uniform match `got-moles-passports.md`. No warped text in frame.
6. Lip-sync, hands and identity drift checked shot by shot. Regenerate any shot that "looks AI".
7. US English captions and VO, American accent.
8. AI disclosure decided and noted.
9. Spend and launch are **Spencer's call**, routed through `mkt-cmo`. This skill makes creative;
   it never spends, uploads to an ad account, or posts.
