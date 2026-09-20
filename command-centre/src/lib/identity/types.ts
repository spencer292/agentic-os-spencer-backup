/**
 * AIOS Team Platform — identity & access-control row/enum types.
 *
 * The TypeScript contract for the team-platform models. They mirror the DDL in
 * ../memory/migrations/0004_team_platform.sql exactly. The store and row-mappers
 * import from here so there is a single source of truth for the row shapes.
 *
 * Naming: snake_case in SQL, camelCase in TS. ./row-mappers bridges the two.
 *
 * This module is intentionally dependency-free (pure types + const arrays) so it
 * loads stub-free under the runtime .ts loader the tests use.
 */

// ── Enums (must match the DB CHECK constraints in 0002 exactly) ──────────────

/** A user's account state. */
export type UserStatus = "active" | "disabled";

/** A team's lifecycle state. */
export type TeamStatus = "active" | "archived";

/** A member's role within a team. owner ⊃ admin ⊃ member in capability. */
export type Role = "owner" | "admin" | "member";

/** Membership lifecycle. `invited` until the user joins; `suspended` pauses access. */
export type MembershipStatus = "active" | "invited" | "suspended";

/** A client workspace's lifecycle state. */
export type ClientStatus = "active" | "archived";

/** Client-access level. `write` implies `read`. */
export type GrantAccess = "read" | "write";

/** Grant lifecycle. Revoke flips to `revoked` (history is never deleted). */
export type GrantStatus = "active" | "revoked";

/** Workstation lifecycle. */
export type WorkstationStatus = "active" | "revoked";

/** Sensitive actions recorded in the audit trail. Mirrors the 0002 CHECK list. */
export type AuditAction =
  | "membership.invited"
  | "membership.joined"
  | "membership.role_changed"
  | "membership.suspended"
  | "membership.removed"
  | "grant.granted"
  | "grant.revoked"
  | "workstation.registered"
  | "workstation.revoked"
  | "client.created"
  | "client.archived"
  | "access.denied_search"
  | "access.denied_ingest";

/** The kind of entity an audit event is about. */
export type AuditTargetType =
  | "user"
  | "membership"
  | "client"
  | "grant"
  | "workstation"
  | "team";

export const ROLES: readonly Role[] = ["owner", "admin", "member"];
export const GRANT_ACCESS_LEVELS: readonly GrantAccess[] = ["read", "write"];

// ── Row shapes (camelCase mirror of the snake_case columns) ──────────────────

/** A global user identity. Maps to `users`. */
export interface UserRow {
  id: string;
  email: string;
  displayName: string | null;
  status: UserStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** A team — the tenant boundary. Maps to `teams`. */
export interface TeamRow {
  id: string;
  slug: string;
  name: string;
  status: TeamStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** A user's membership of a team, with a role. Maps to `memberships`. */
export interface MembershipRow {
  id: string;
  teamId: string;
  userId: string;
  role: Role;
  status: MembershipStatus;
  invitedBy: string | null;
  /** Free-form bag. Holds a pending invite's hashed token + expiry until joined. */
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** A client workspace owned by a team. Maps to `clients`. */
export interface ClientRow {
  id: string;
  teamId: string;
  slug: string;
  name: string;
  status: ClientStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** A read/write grant of one client to one member. Maps to `client_grants`. */
export interface ClientGrantRow {
  id: string;
  teamId: string;
  clientId: string;
  userId: string;
  access: GrantAccess;
  status: GrantStatus;
  grantedBy: string | null;
  grantedAt: string;
  revokedBy: string | null;
  revokedAt: string | null;
  metadata: Record<string, unknown>;
}

/** A registered device/agent host bound to a user. Maps to `workstations`. */
export interface WorkstationRow {
  id: string;
  teamId: string;
  userId: string;
  name: string;
  fingerprint: string;
  status: WorkstationStatus;
  registeredBy: string | null;
  lastSeenAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  revokedAt: string | null;
}

/** An append-only audit record. Maps to `audit_events`. */
export interface AuditEventRow {
  id: string;
  teamId: string;
  actorUserId: string | null;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string | null;
  summary: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}
