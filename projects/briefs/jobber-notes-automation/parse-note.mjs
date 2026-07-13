// parse-note.mjs — Got Moles technician visit-note parser.
// Pure function: a Jobber JobNote message string -> structured record.
// Source-verified against 442 real notes on 2026-07-06. See brief.md for the grammar.

const TYPE = s => {
  s = s.toLowerCase();
  if (s === 'v' || s === 'voos' || s === 'victor') return 'Victor';
  if (s === 'tl' || s === 'trapline') return 'Trapline';
  if (s.startsWith('gopher')) return 'Gopher Hawk (legacy)';
  return s;
};
const POS = { foh: 'front', boh: 'back', loh: 'left', roh: 'right' };

export function parseNote(msg) {
  const t = ' ' + String(msg).replace(/\s+/g, ' ').trim() + ' ';
  const low = t.toLowerCase();
  const r = {};

  // moles caught
  if (/\bno mole/i.test(t)) r.moles = 0;
  else {
    const m = t.match(/(\d+)\s*moles?\b/i) || t.match(/(\d+)\s*caught\b/i);
    r.moles = m ? +m[1] : null;
  }

  // misses + subcode (u = under, t = tripped)
  if (/\bno miss/i.test(t)) { r.misses = 0; r.missKind = null; }
  else {
    const m = t.match(/(\d+)\s*miss(?:ed)?\s*(u|t)?\b/i) || t.match(/missed\s*(\d+)/i);
    if (m) {
      r.misses = +m[1];
      const k = (m[2] || '').toLowerCase();
      r.missKind = k === 'u' ? 'under' : k === 't' ? 'tripped' : null;
    } else { r.misses = null; r.missKind = null; }
  }

  // activity level
  const am = low.match(/\b([nlmh])\/?a\b/);
  r.activity = am ? { n: 'None', l: 'Low', m: 'Moderate', h: 'High' }[am[1]] : null;

  // line-aware split (real notes are newline-delimited)
  const lines = String(msg).split(/[\n\r]+/).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const VERB = /\b(pulled|added|moved|shifted|swapped|set)\b/i;
  const NEXT = /\b(add visit|return visit|monthly|2\s*weeks|convert|weekly)\b/i;
  const ONX = /on\s*x/i;

  r.actions = lines
    .filter(l => VERB.test(l) && !ONX.test(l))
    .map(l => l.replace(/\bsee onx\b/i, '').trim())
    .filter(Boolean);

  // trap inventory = lines that are pure "N type [position]" (no verb / next-action / onx)
  const inv = [];
  const ire = /(\d+)\s*(voos|victor|v|tl|trapline|gopher hawk)\b\s*(foh|boh|loh|roh|garden|shop|shed|bed|front|back)?/gi;
  for (const l of lines) {
    if (VERB.test(l) || NEXT.test(l) || ONX.test(l)) continue;
    let ii;
    while ((ii = ire.exec(l)) !== null) {
      inv.push({ n: +ii[1], type: TYPE(ii[2]), pos: ii[3] ? (POS[ii[3].toLowerCase()] || ii[3].toLowerCase()) : null });
    }
  }
  r.inventory = inv;
  r.inventoryStr = inv.map(x => `${x.n} ${x.type}${x.pos ? ' ' + x.pos : ''}`).join(', ');

  // next action (priority order)
  // "ad visit" tolerates the field misspelling of "Add visit" (seen live 2026-07-06,
  // Lynn Clapp #7247 — "Ad visit" silently parsed as no next-action).
  r.nextAction =
    /convert to annual/i.test(t) ? 'Convert to annual' :
    /return visit scheduled/i.test(t) ? 'Return visit scheduled' :
    /\bad{1,2}\s+visit/i.test(t) ? 'Add visit' :
    /monthly/i.test(t) ? 'Monthly' :
    /visit\s*2\s*weeks|2\s*weeks/i.test(t) ? '2 weeks' :
    /weekly/i.test(t) ? 'Weekly' : null;

  r.customerShown = /(show(?:ed)?|told)\s*(customer|cust)/i.test(t);
  r.onX = ONX.test(low.replace(/[^a-z ]/g, ''));
  r.legacyTrap = /gopher hawk/i.test(t);
  return r;
}

// Follow-up interval (days) derived from the parsed next-action. null = no scheduling change.
export function followUpDays(nextAction) {
  if (nextAction === 'Add visit' || nextAction === 'Weekly') return 7;
  if (nextAction === '2 weeks') return 14;
  return null; // Monthly / Return visit scheduled / Convert to annual / none
}
