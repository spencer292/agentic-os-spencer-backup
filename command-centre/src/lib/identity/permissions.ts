/**
 * AIOS Team Platform — authorization helpers.
 *
 * The small, shared decision layer the team flows build on: resolve a user's
 * active role in a team and require a minimum role before a privileged action.
 * Kept dependency-light (pure reads over the identity store) so the invite/join,
 * grant/revoke, and enforcement layers all gate on the same rules.
 *
 * Roles are ranked owner > admin > member. A check passes only when the caller
 * has an ACTIVE membership whose rank meets or exceeds the required role — an
 * invited or suspended membership never confers authority.
 */

import type { IdentityStore } from "./store";
import type { MembershipRow, Role } from "./types";

/** Numeric rank for the role hierarchy. Higher outranks lower. */
export const ROLE_RANK: Record<Role, number> = { owner: 3, admin: 2, member: 1 };

/** Thrown when a caller lacks the role required for an action. */
export class PermissionError extends Error {
  readonly code = "forbidden";
  constructor(message: string) {
    super(message);
    this.name = "PermissionError";
  }
}

/** The caller's active membership of a team, or null if absent/invited/suspended. */
export async function getActiveMembership(
  store: IdentityStore,
  teamId: string,
  userId: string,
): Promise<MembershipRow | null> {
  const membership = await store.getMembership(teamId, userId);
  return membership && membership.status === "active" ? membership : null;
}

/** True iff `role` meets or exceeds `minRole` in the hierarchy. */
export function roleMeets(role: Role, minRole: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minRole];
}

/**
 * Require that `userId` holds at least `minRole` in `teamId`, returning the
 * membership when satisfied. Throws {@link PermissionError} otherwise — the single
 * gate the privileged flows call before mutating team state.
 */
export async function requireTeamRole(
  store: IdentityStore,
  teamId: string,
  userId: string,
  minRole: Role,
): Promise<MembershipRow> {
  const membership = await getActiveMembership(store, teamId, userId);
  if (!membership || !roleMeets(membership.role, minRole)) {
    throw new PermissionError(`requires ${minRole} role on this team`);
  }
  return membership;
}
