// grammar.js — the canonical Got Moles visit-note shorthand, and the prompts that turn
// spoken field speech into it.
//
// Everything here is grounded in a 4,341-note corpus pulled from the live Jobber account
// on 2026-07-28 (see _sample-notes.mjs / _analyze-corpus.mjs). The formatter's job is NOT
// to write nice prose — it is to emit the exact shorthand that ../parse-note.mjs already
// decodes, because that parser drives the live custom-field status report and the
// follow-up scheduling engine. Output that does not round-trip through parseNote() is a
// defect, not a style preference.

// Vocabulary observed in the corpus, fed to the speech model as a decoding hint. Without
// this, transcription reliably mangles the trade words ("voos" -> "views", "foh" -> "for",
// and most damagingly "mole" -> "mile", which already appears 17x in TYPED notes).
export const SPEECH_VOCAB = [
  'Got Moles', 'mole', 'moles', 'vole', 'gopher',
  'Victor', 'voos', 'VOOS', 'trapline', 'TL', 'Gopher Hawk',
  'foh', 'boh', 'loh', 'roh', 'froh', 'floh', 'broh', 'bloh',
  'front of house', 'back of house', 'left of house', 'right of house',
  'miss under', 'miss tripped', 'no miss',
  'no activity', 'light activity', 'moderate activity', 'high activity',
  'add visit', 'two weeks', 'monthly', 'weekly', 'return visit scheduled',
  'convert to annual', 'onX', 'showed customer', 'told customer',
  'perimeter', 'fenceline', 'drain field', 'retaining wall', 'garden bed',
].join(', ');

// Canonical line order. parse-note.mjs is order-independent, but a fixed order makes the
// note scannable for whoever reads it in Jobber later.
export const CANONICAL_ORDER = ['moles', 'misses', 'actions', 'activity', 'inventory', 'extras', 'next'];

export const SYSTEM_PROMPT = `You convert a Got Moles technician's spoken visit note into the company's written shorthand.

You are a TRANSCRIPTION FORMATTER, not an author. You never add information the technician did not say. You never guess a number. If the technician did not mention something, you leave that line out entirely — a missing line is caught downstream and is far safer than an invented one.

# Output format

Plain text. One field per line. No headings, no bullets, no punctuation at line ends, no commentary before or after. Use exactly this line order, omitting any line the technician did not speak:

1. MOLES CAUGHT
   - none caught -> "No mole"
   - one -> "1 mole"
   - more than one -> "2 moles" (use the number spoken)
2. MISSES
   - none -> "No miss"
   - a miss where the mole went under the trap -> "1 miss u"
   - a miss where the trap was tripped but empty -> "1 miss t"
   - miss with no cause given -> "1 miss"
   - multiple kinds spoken -> put them on one line: "1 miss u 1 miss t"
3. ACTIONS (zero or more lines, only if the tech changed the trap set)
   - "Pulled 1 v", "Added 2 v", "Moved 1 tl", "Shifted 1 v", "Set 2 v", "Swapped 1 v for tl"
   - verbs allowed: Pulled, Added, Moved, Shifted, Set, Swapped, Removed, Reset, Replaced
4. ACTIVITY LEVEL — exactly one of: "NA" (none), "LA" (light), "MA" (moderate), "HA" (high)
5. TRAP INVENTORY — what is on the ground NOW, one line per group: "<count> <type> <place>"
   - types: "v" for Victor / VOOS / victors, "tl" for trapline
   - places: foh, boh, loh, roh (front/back/left/right of house);
     froh, floh, broh, bloh (front-right, front-left, back-right, back-left);
     or a plain word the tech used: garden, fence, driveway, field, perimeter,
     shop, shed, bed, pool, patio, garage, "ret wall", "drain field", "front gate"
   - examples: "3 v foh", "1 tl boh", "2 v fence"
   - if the tech says there are no traps on the property -> "No traps"
6. EXTRAS (only if spoken)
   - "Showed customer" / "Told customer"
   - "See onX" if they mention onX / mapping
   - any other remark the tech made, kept short, in their own words
7. NEXT ACTION — exactly one of:
   - "Add visit"        (come back in about a week / next week / soon / asap)
   - "2 weeks"          (two weeks / couple weeks)
   - "Monthly"          (normal monthly cadence / next month / nothing needed)
   - "Weekly"           (explicitly weekly)
   - "Return visit scheduled"
   - "Convert to annual"

# Speech-to-text repairs (important)

The audio is recorded outdoors on a phone. Fix these known mishearings:
- "mile", "miles", "my old", "mold" in a catch context -> mole / moles
- "views", "voose", "boos", "vs" -> voos (a Victor trap; write it as "v")
- "trap line", "trampoline" -> trapline ("tl")
- "for/four" + "of house" -> foh;  "bow/bo" + "of house" -> boh
- "N A", "in a", "and a" spoken as an activity level -> NA
- "L A", "el a" -> LA;  "M A", "em a" -> MA;  "H A" -> HA
- "add visit" and "ad visit" are the same thing -> "Add visit"

A vole is NOT a mole. If the tech clearly says vole, keep the word vole on an extras line and do not count it as a mole.

# Hard rules

- Never invent a count, a trap type, a placement, or a next action.
- If the tech contradicts themselves, keep the LAST thing they said.
- If the tech says something you cannot classify, put it on its own extras line verbatim rather than dropping it.
- Numbers spoken as words become digits ("two" -> 2).
- Output nothing except the note lines.`;

// Few-shot pairs. The shorthand sides are real note shapes from the corpus; the spoken
// sides are how a tech says the same thing out loud.
export const FEW_SHOT = [
  {
    spoken: `two moles today no misses moderate activity three victors out front come back next week`,
    note: `2 moles\nNo miss\nMA\n3 v foh\nAdd visit`,
  },
  {
    spoken: `no mile one miss under it pulled a victor no activity got one trapline front of house and one victor left of house give it two weeks`,
    note: `No mole\n1 miss u\nPulled 1 v\nNA\n1 tl foh\n1 v loh\n2 weeks`,
  },
  {
    spoken: `caught one uh one miss under light activity moved a victor two victors back of house one victor left one on the retaining wall one back by the fence add a visit`,
    note: `1 mole\n1 miss u\nMoved 1 v\nLA\n2 v boh\n1 v loh\n1 v ret wall\n1 v boh fence\nAdd visit`,
  },
  {
    spoken: `nothing this time no misses no activity three views along the fence line showed the customer everything back to monthly`,
    note: `No mole\nNo miss\nNA\n3 v fence\nShowed customer\nMonthly`,
  },
  {
    spoken: `no moles one under one tripped swapped a victor for a trapline moderate two victors back of house two victors left of house yard is a nightmare add visit`,
    note: `No mole\n1 miss u 1 miss t\nSwapped 1 v for tl\nMA\n2 v boh\n2 v loh\nYard is a nightmare\nAdd visit`,
  },
];

// Provider-neutral prompt assembly — src/ai.js shapes this for whichever API is in use.
export function buildPrompt(transcript, { lastNote } = {}) {
  const context = lastNote
    ? `\n\nFor reference only, the previous note on this job was:\n${lastNote}\n\nUse it to resolve ambiguous trap references (e.g. "same as last time", "pulled the one out back"). Do NOT copy figures from it — only the current transcript describes today's visit.`
    : '';
  return { system: SYSTEM_PROMPT + context, shots: FEW_SHOT, user: transcript };
}

// ── validation ─────────────────────────────────────────────────────────────
// Runs the formatter's output back through the live parser. This is the gate: if the
// downstream report/scheduling engine cannot read the note, the technician finds out on
// the spot instead of the note silently degrading a week later.
const NEXT_ACTIONS = ['Add visit', '2 weeks', 'Monthly', 'Weekly', 'Return visit scheduled', 'Convert to annual'];

export function validate(noteText, parsed) {
  const warnings = [];
  const lines = String(noteText).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const hasNoTraps = /^no traps$/i.test(noteText.trim()) || lines.some(l => /^no traps$/i.test(l));

  if (parsed.moles === null) warnings.push({ field: 'moles', msg: 'No mole count — say "no mole" or "two moles".' });
  if (parsed.misses === null) warnings.push({ field: 'misses', msg: 'No miss count — say "no miss" or "one miss under".' });
  if (!parsed.activity) warnings.push({ field: 'activity', msg: 'No activity level — say none, light, moderate or high.' });
  if (!parsed.inventory.length && !hasNoTraps) warnings.push({ field: 'inventory', msg: 'No trap inventory — say what is on the ground now, e.g. "three victors front of house".' });
  if (!parsed.nextAction) warnings.push({ field: 'nextAction', msg: 'No next action — say add visit, two weeks, or monthly.' });
  else if (!NEXT_ACTIONS.includes(parsed.nextAction)) warnings.push({ field: 'nextAction', msg: `Unrecognised next action "${parsed.nextAction}".` });

  // Sanity: implausible counts usually mean a misheard number.
  if (parsed.moles !== null && parsed.moles > 12) warnings.push({ field: 'moles', msg: `${parsed.moles} moles is unusually high — check the number.` });
  const totalTraps = parsed.inventory.reduce((s, i) => s + i.n, 0);
  if (totalTraps > 40) warnings.push({ field: 'inventory', msg: `${totalTraps} traps is unusually high — check the numbers.` });

  return {
    ok: warnings.length === 0,
    warnings,
    // A note is sendable if it parses well enough for the report; warnings are advisory
    // and the technician can send anyway (they may genuinely not have checked something).
    fields: {
      moles: parsed.moles,
      misses: parsed.misses,
      missKind: parsed.missKind,
      activity: parsed.activity,
      inventory: parsed.inventoryStr || (hasNoTraps ? 'none' : ''),
      actions: parsed.actions,
      nextAction: parsed.nextAction,
      customerShown: parsed.customerShown,
    },
  };
}
