/**
 * AIOS Team Platform — row mappers.
 *
 * SQL is snake_case; the TS contract in ./types is camelCase. These mappers are
 * the single place that bridges the two when reading rows out of the identity
 * store, so a column rename touches exactly one file. Mirrors the design of
 * ../memory/row-mappers.ts.
 *
 * Timestamps and other values are normalized defensively (`String(...)` /
 * `Number(...)`) so the mappers stay robust across PGLite versions and a future
 * hosted-`pg` type parser. The store SELECTs cast timestamps to `::text`.
 */

import type {
  AuditAction,
  AuditEventRow,
  AuditTargetType,
  ClientGrantRow,
  ClientRow,
  ClientStatus,
  GrantAccess,
  GrantStatus,
  MembershipRow,
  MembershipStatus,
  Role,
  TeamRow,
  TeamStatus,
  UserRow,
  UserStatus,
  WorkstationRow,
  WorkstationStatus,
} from "./types";

type Row = Record<string, unknown>;

/** jsonb columns arrive as an object (PGLite) or a JSON string (some pg setups). */
function asJson(value: unknown): Record<string, unknown> {
  if (value == null) return {};
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return value as Record<string, unknown>;
}

/** Map a `users` row to {@link UserRow}. */
export function mapUserRow(r: Row): UserRow {
  return {
    id: r.id as string,
    email: r.email as string,
    displayName: (r.display_name as string | null) ?? null,
    status: r.status as UserStatus,
    metadata: asJson(r.metadata),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

/** Map a `teams` row to {@link TeamRow}. */
export function mapTeamRow(r: Row): TeamRow {
  return {
    id: r.id as string,
    slug: r.slug as string,
    name: r.name as string,
    status: r.status as TeamStatus,
    metadata: asJson(r.metadata),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

/** Map a `memberships` row to {@link MembershipRow}. */
export function mapMembershipRow(r: Row): MembershipRow {
  return {
    id: r.id as string,
    teamId: r.team_id as string,
    userId: r.user_id as string,
    role: r.role as Role,
    status: r.status as MembershipStatus,
    invitedBy: (r.invited_by as string | null) ?? null,
    metadata: asJson(r.metadata),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

/** Map a `clients` row to {@link ClientRow}. */
export function mapClientRow(r: Row): ClientRow {
  return {
    id: r.id as string,
    teamId: r.team_id as string,
    slug: r.slug as string,
    name: r.name as string,
    status: r.status as ClientStatus,
    metadata: asJson(r.metadata),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

/** Map a `client_grants` row to {@link ClientGrantRow}. */
export function mapClientGrantRow(r: Row): ClientGrantRow {
  return {
    id: r.id as string,
    teamId: r.team_id as string,
    clientId: r.client_id as string,
    userId: r.user_id as string,
    access: r.access as GrantAccess,
    status: r.status as GrantStatus,
    grantedBy: (r.granted_by as string | null) ?? null,
    grantedAt: String(r.granted_at),
    revokedBy: (r.revoked_by as string | null) ?? null,
    revokedAt: r.revoked_at == null ? null : String(r.revoked_at),
    metadata: asJson(r.metadata),
  };
}

/** Map a `workstations` row to {@link WorkstationRow}. */
export function mapWorkstationRow(r: Row): WorkstationRow {
  return {
    id: r.id as string,
    teamId: r.team_id as string,
    userId: r.user_id as string,
    name: r.name as string,
    fingerprint: r.fingerprint as string,
    status: r.status as WorkstationStatus,
    registeredBy: (r.registered_by as string | null) ?? null,
    lastSeenAt: r.last_seen_at == null ? null : String(r.last_seen_at),
    metadata: asJson(r.metadata),
    createdAt: String(r.created_at),
    revokedAt: r.revoked_at == null ? null : String(r.revoked_at),
  };
}

/** Map an `audit_events` row to {@link AuditEventRow}. */
export function mapAuditEventRow(r: Row): AuditEventRow {
  return {
    id: r.id as string,
    teamId: r.team_id as string,
    actorUserId: (r.actor_user_id as string | null) ?? null,
    action: r.action as AuditAction,
    targetType: r.target_type as AuditTargetType,
    targetId: (r.target_id as string | null) ?? null,
    summary: (r.summary as string | null) ?? null,
    metadata: asJson(r.metadata),
    createdAt: String(r.created_at),
  };
}
