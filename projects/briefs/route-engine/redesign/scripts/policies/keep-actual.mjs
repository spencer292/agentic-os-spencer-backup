#!/usr/bin/env node
/**
 * Policy: keep-actual
 *
 * The oracle baseline. Proposes exactly the tech and day each visit actually
 * got, so tech and day agreement land at 100% by construction. It exists to
 * validate the harness: if keep-actual does not score ~100% on tech and day,
 * the join or the scorer is broken, not the policy.
 *
 * It still gets sequenced by sequence.mjs like any other policy, which makes
 * its route-time ratio a direct read on the sequencer: same stops, same days,
 * same techs as OptimoRoute, only the order differs.
 *
 * This policy READS THE ORACLE (snap.actual). No other policy may.
 */

export const name = 'keep-actual';
export const description = 'Oracle baseline — the tech and day each visit actually got.';
export const usesOracle = true;

export function propose(snap) {
  const assignments = [];
  const unresolved = [];
  for (const v of snap.due) {
    const a = snap.actual.get(v.key);
    if (!a || !a.tech || !a.date) {
      unresolved.push(v.key);
      continue;
    }
    assignments.push({ key: v.key, tech: a.tech, date: a.date });
  }
  return {
    assignments,
    notes: {
      unresolvedVisits: unresolved.length,
      unresolvedKeys: unresolved.slice(0, 40),
      comment:
        'Visits with no resolvable actual are left unassigned and count as drops; they are the same visits the scorer cannot score.',
    },
  };
}
