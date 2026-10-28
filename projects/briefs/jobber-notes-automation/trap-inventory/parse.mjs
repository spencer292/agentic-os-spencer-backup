// Trap-inventory reader for tech visit notes. Inventory lines look like
// "1 TL 2 VOOS foh" / "2 v boh"; action lines (Added/Moved/Pulled/miss/mole) are skipped.
// 2023-24 notes say "Vic" and "trap line" (once "trap lime"); 2026 notes say "VOOS"/"v" and "TL"
const TRAP = /\b(\d{1,2})\s*(tl|trap\s*l[ia][nm]es?|voos|vics?|victors?|v)\b/gi;
const typeOf = w => /^(tl|trap)/i.test(w) ? 'TL' : 'Victor';
const ACTION = /^\s*(added|add(?!\s+visit)|moved|move|pulled|pull|removed|shifted|swapped|caught|\d*\s*miss|missed|no\s+miss)/i;
// a line recording traps that are gone ("2 tl lost", "1 v taken by landscapers") — counted as lost, not in ground.
// A parenthetical ("1 voos foh (missing trap line)") is a side remark, so only the text outside brackets is tested.
const LOST = /\b(lost|taken|stolen|missing|not\s+found|can'?t\s+find|couldn'?t\s+find|gone)\b/i;

// Some notes list per-location lines AND a grand total ("3 victors by shop / 2 victors fenced
// yard / 5 victors."). A BARE line (just counts, no location) equal to the sum of the others is that total.
function collapse(entries) {
  const sum = entries.reduce((a, e) => a + e.c, 0);
  if (entries.length > 2 && entries.some(e => e.bare && e.c * 2 === sum)) return sum / 2;
  return sum;
}
const isBare = l => !l.replace(TRAP, '').replace(/\b(and|total|in\s+ground)\b|[^a-z]/gi, '');

export function inventory(msg) {
  let lost = 0, lines = [], lostLines = [];
  const per = { TL: [], Victor: [] };
  for (const raw of String(msg).split(/[\n\r]+/)) {
    const l = raw.replace(/\s+/g, ' ').trim();
    if (!l || ACTION.test(l) || /\bmiss(es|ed)?\b/i.test(l) || /\bmoles?\b/i.test(l)) continue;
    const gone = LOST.test(l.replace(/\([^)]*\)?/g, ''));
    const lineCount = { TL: 0, Victor: 0 };
    let hit = false;
    for (const m of l.matchAll(TRAP)) {
      hit = true;
      if (gone) { lost += +m[1]; continue; }
      lineCount[typeOf(m[2])] += +m[1];
    }
    if (!hit) continue;
    (gone ? lostLines : lines).push(l);
    if (!gone) for (const t of ['TL', 'Victor']) if (lineCount[t]) per[t].push({ c: lineCount[t], bare: isBare(l) });
  }
  const tl = collapse(per.TL), v = collapse(per.Victor);
  return { tl, v, total: tl + v, lines, lost, lostLines };
}

export const PULLED_ALL = /pulled\s+(all|closed|everything)|all\s+traps\s+pulled|pull(ed)?\s+(all\s+)?traps?\s+(and\s+)?clos/i;
// any pull at all — on a closing note, a pull with no inventory left means the yard was cleared
export const PULLED_ANY = /\bpull(ed|ing)?\b|\bremoved\b|\bpicked\s+up\b/i;
