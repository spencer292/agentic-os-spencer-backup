/**
 * AIOS Team Platform — identity & access-control store.
 *
 * A thin repository over the team-platform tables (users, teams, memberships,
 * clients, client_grants, workstations, audit_events) added by migration
 * 0004_team_platform.sql. It lives in the SAME database as the memory store and
 * reuses the memory store's engine seam: the migration runner (../memory/migrate),
 * the PGLite/Postgres adapters, and the backend selector. The exact same class
 * therefore backs local PGLite and hosted Postgres with no change — every
 * operation talks to the schema through the engine-agnostic SqlClient.
 *
 * Scope: the data model only. The invite/join flow, the grant/revoke flow
 * authorization, enforcement before memory search/ingest, and the full audit
 * wiring build ON these repository methods — they are intentionally left as
 * clean seams here.
 *
 * Transactions: grant/revoke write the grant AND its audit event atomically via
 * BEGIN/COMMIT issued on the SqlClient. That requires a SINGLE pinned connection
 * (PGLite is single-user; the Postgres adapter's openPostgres pins one
 * connection). The pooled Postgres client rejects bare BEGIN by design — do not
 * back this store with a pool. (Same rationale as ../memory/postgres-adapter.ts.)
 *
 * SQL is snake_case, the TS surface is camelCase; ./row-mappers bridges the two.
 */

import { applyMigrations, DEFAULT_EMBED_DIM, type SqlClient } from "../memory/migrate";
import { openPGlite } from "../memory/pglite-adapter";
import { openPostgres } from "../memory/postgres-adapter";
import { resolveMemoryBackend, type MemoryBackendSelector } from "../memory/backend";
import {
  mapAuditEventRow,
  mapClientGrantRow,
  mapClientRow,
  mapMembershipRow,
  mapTeamRow,
  mapUserRow,
  mapWorkstationRow,
} from "./row-mappers";
import type {
  AuditAction,
  AuditEventRow,
  AuditTargetType,
  ClientGrantRow,
  ClientRow,
  ClientStatus,
  GrantAccess,
  MembershipRow,
  MembershipStatus,
  Role,
  TeamRow,
  TeamStatus,
  UserRow,
  UserStatus,
  WorkstationRow,
} from "./types";

export interface OpenIdentityStoreOptions {
  /** Persisted PGLite directory. Omit for an ephemeral in-memory database (tests). */
  dataDir?: string;
  /** Storage engine selector. Overrides `MEMORY_STORE_BACKEND`. Default `auto`. */
  backend?: MemoryBackendSelector;
  /** Hosted Postgres connection string. Overrides `MEMORY_DATABASE_URL`/`DATABASE_URL`. */
  connectionString?: string;
  /**
   * Use an already-open SqlClient (e.g. one shared with the memory store). When
   * provided, open + migrate are skipped and `close()` is a no-op — the caller
   * owns the connection lifecycle. This is the seam the flow and enforcement
   * layers use to run identity reads/writes on the same connection that serves memory.
   */
  client?: SqlClient;
  /**
   * Embedding dimension forwarded to applyMigrations' ledger. The team-platform
   * tables have no vector columns, so this only matters because 0001 (memory)
   * applies alongside 0002 against a fresh database. Default 384.
   */
  embedDim?: number;
}

/** Fields to create-or-update a global user (keyed on lower(email)). */
export interface UpsertUserInput {
  email: string;
  displayName?: string | null;
  status?: UserStatus;
  metadata?: Record<string, unknown>;
}

/** Fields to create a team. */
export interface CreateTeamInput {
  slug: string;
  name: string;
  status?: TeamStatus;
  metadata?: Record<string, unknown>;
}

/** Fields to create-or-update a membership (keyed on (teamId, userId)). */
export interface UpsertMembershipInput {
  teamId: string;
  userId: string;
  role?: Role;
  status?: MembershipStatus;
  invitedBy?: string | null;
  /** Replaces the metadata bag. Omit to clear it to `{}` on upsert. */
  metadata?: Record<string, unknown>;
}

/** Fields to create-or-update a client (keyed on (teamId, slug)). */
export interface UpsertClientInput {
  teamId: string;
  slug: string;
  name: string;
  status?: ClientStatus;
  metadata?: Record<string, unknown>;
}

/** Fields to grant client access to a member. Re-granting supersedes any active grant. */
export interface GrantClientAccessInput {
  teamId: string;
  clientId: string;
  userId: string;
  /** Defaults to 'read'. 'write' implies read. */
  access?: GrantAccess;
  grantedBy?: string | null;
  metadata?: Record<string, unknown>;
}

/** Fields to revoke a member's active client grant. */
export interface RevokeClientAccessInput {
  teamId: string;
  clientId: string;
  userId: string;
  revokedBy?: string | null;
}

/** Filter for listing grants (active + revoked history). */
export interface ListGrantsFilter {
  teamId: string;
  clientId?: string;
  userId?: string;
}

/** Fields to register a workstation. Re-registering a fingerprint supersedes the active one. */
export interface RegisterWorkstationInput {
  teamId: string;
  userId: string;
  name: string;
  fingerprint: string;
  registeredBy?: string | null;
  metadata?: Record<string, unknown>;
}

/** Fields to record an audit event. */
export interface RecordAuditEventInput {
  teamId: string;
  actorUserId?: string | null;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId?: string | null;
  summary?: string | null;
  metadata?: Record<string, unknown>;
}

/** Filter for querying the audit trail by team and (optionally) target. */
export interface ListAuditEventsFilter {
  teamId: string;
  targetType?: AuditTargetType;
  targetId?: string;
  limit?: number;
}

// ── RETURNING column lists (timestamps cast to ::text for stable string parsing) ──
const USER_COLS =
  "id, email, display_name, status, metadata, " +
  "created_at::text AS created_at, updated_at::text AS updated_at";
const TEAM_COLS =
  "id, slug, name, status, metadata, " +
  "created_at::text AS created_at, updated_at::text AS updated_at";
const MEMBERSHIP_COLS =
  "id, team_id, user_id, role, status, invited_by, metadata, " +
  "created_at::text AS created_at, updated_at::text AS updated_at";
const CLIENT_COLS =
  "id, team_id, slug, name, status, metadata, " +
  "created_at::text AS created_at, updated_at::text AS updated_at";
const GRANT_COLS =
  "id, team_id, client_id, user_id, access, status, granted_by, " +
  "granted_at::text AS granted_at, revoked_by, revoked_at::text AS revoked_at, metadata";
const WORKSTATION_COLS =
  "id, team_id, user_id, name, fingerprint, status, registered_by, " +
  "last_seen_at::text AS last_seen_at, metadata, " +
  "created_at::text AS created_at, revoked_at::text AS revoked_at";
const AUDIT_COLS =
  "id, team_id, actor_user_id, action, target_type, target_id, summary, metadata, " +
  "created_at::text AS created_at";

/**
 * Engine-neutral repository over the team-platform tables. Construct it via
 * {@link openIdentityStore}; the only engine-specific concern is teardown,
 * injected as `closeFn`.
 */
export class IdentityStore {
  constructor(
    readonly client: SqlClient,
    private readonly closeFn: () => Promise<void>,
  ) {}

  // ── Users ──────────────────────────────────────────────────────────────────

  /** Create or update a user, keyed case-insensitively on email. Idempotent. */
  async upsertUser(input: UpsertUserInput): Promise<UserRow> {
    const { rows } = await this.client.query<Record<string, unknown>>(
      `INSERT INTO users (email, display_name, status, metadata)
       VALUES ($1, $2, $3, $4::jsonb)
       ON CONFLICT (lower(email)) DO UPDATE SET
         display_name = COALESCE(EXCLUDED.display_name, users.display_name),
         metadata     = EXCLUDED.metadata,
         updated_at   = now()
       RETURNING ${USER_COLS}`,
      [
        input.email,
        input.displayName ?? null,
        input.status ?? "active",
        JSON.stringify(input.metadata ?? {}),
      ],
    );
    return mapUserRow(rows[0]);
  }

  async getUserByEmail(email: string): Promise<UserRow | null> {
    const { rows } = await this.client.query<Record<string, unknown>>(
      `SELECT ${USER_COLS} FROM users WHERE lower(email) = lower($1)`,
      [email],
    );
    return rows.length ? mapUserRow(rows[0]) : null;
  }

  async getUserById(id: string): Promise<UserRow | null> {
    const { rows } = await this.client.query<Record<string, unknown>>(
      `SELECT ${USER_COLS} FROM users WHERE id = $1`,
      [id],
    );
    return rows.length ? mapUserRow(rows[0]) : null;
  }

  // ── Teams ──────────────────────────────────────────────────────────────────

  async createTeam(input: CreateTeamInput): Promise<TeamRow> {
    const { rows } = await this.client.query<Record<string, unknown>>(
      `INSERT INTO teams (slug, name, status, metadata)
       VALUES ($1, $2, $3, $4::jsonb)
       RETURNING ${TEAM_COLS}`,
      [input.slug, input.name, input.status ?? "active", JSON.stringify(input.metadata ?? {})],
    );
    return mapTeamRow(rows[0]);
  }

  async getTeam(id: string): Promise<TeamRow | null> {
    const { rows } = await this.client.query<Record<string, unknown>>(
      `SELECT ${TEAM_COLS} FROM teams WHERE id = $1`,
      [id],
    );
    return rows.length ? mapTeamRow(rows[0]) : null;
  }

  async getTeamBySlug(slug: string): Promise<TeamRow | null> {
    const { rows } = await this.client.query<Record<string, unknown>>(
      `SELECT ${TEAM_COLS} FROM teams WHERE lower(slug) = lower($1)`,
      [slug],
    );
    return rows.length ? mapTeamRow(rows[0]) : null;
  }

  // ── Memberships ─────────────────────────────────────────────────────────────

  /** Create or update a membership, keyed on (teamId, userId). */
  async upsertMembership(input: UpsertMembershipInput): Promise<MembershipRow> {
    const { rows } = await this.client.query<Record<string, unknown>>(
      `INSERT INTO memberships (team_id, user_id, role, status, invited_by, metadata)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       ON CONFLICT (team_id, user_id) DO UPDATE SET
         role       = EXCLUDED.role,
         status     = EXCLUDED.status,
         invited_by = COALESCE(EXCLUDED.invited_by, memberships.invited_by),
         metadata   = EXCLUDED.metadata,
         updated_at = now()
       RETURNING ${MEMBERSHIP_COLS}`,
      [
        input.teamId,
        input.userId,
        input.role ?? "member",
        input.status ?? "active",
        input.invitedBy ?? null,
        JSON.stringify(input.metadata ?? {}),
      ],
    );
    return mapMembershipRow(rows[0]);
  }

  async getMembership(teamId: string, userId: string): Promise<MembershipRow | null> {
    const { rows } = await this.client.query<Record<string, unknown>>(
      `SELECT ${MEMBERSHIP_COLS} FROM memberships WHERE team_id = $1 AND user_id = $2`,
      [teamId, userId],
    );
    return rows.length ? mapMembershipRow(rows[0]) : null;
  }

  async listMemberships(teamId: string): Promise<MembershipRow[]> {
    const { rows } = await this.client.query<Record<string, unknown>>(
      `SELECT ${MEMBERSHIP_COLS} FROM memberships WHERE team_id = $1 ORDER BY created_at`,
      [teamId],
    );
    return rows.map(mapMembershipRow);
  }

  /** True iff the user has an `active` membership of the team. */
  async isActiveMember(teamId: string, userId: string): Promise<boolean> {
    const { rows } = await this.client.query<Record<string, unknown>>(
      `SELECT 1 FROM memberships
       WHERE team_id = $1 AND user_id = $2 AND status = 'active' LIMIT 1`,
      [teamId, userId],
    );
    return rows.length > 0;
  }

  async setMembershipStatus(
    teamId: string,
    userId: string,
    status: MembershipStatus,
  ): Promise<MembershipRow | null> {
    const { rows } = await this.client.query<Record<string, unknown>>(
      `UPDATE memberships SET status = $3, updated_at = now()
       WHERE team_id = $1 AND user_id = $2
       RETURNING ${MEMBERSHIP_COLS}`,
      [teamId, userId, status],
    );
    return rows.length ? mapMembershipRow(rows[0]) : null;
  }

  async setRole(teamId: string, userId: string, role: Role): Promise<MembershipRow | null> {
    const { rows } = await this.client.query<Record<string, unknown>>(
      `UPDATE memberships SET role = $3, updated_at = now()
       WHERE team_id = $1 AND user_id = $2
       RETURNING ${MEMBERSHIP_COLS}`,
      [teamId, userId, role],
    );
    return rows.length ? mapMembershipRow(rows[0]) : null;
  }

  // ── Clients ─────────────────────────────────────────────────────────────────

  /** Create or update a client, keyed on (teamId, slug). */
  async upsertClient(input: UpsertClientInput): Promise<ClientRow> {
    const { rows } = await this.client.query<Record<string, unknown>>(
      `INSERT INTO clients (team_id, slug, name, status, metadata)
       VALUES ($1, $2, $3, $4, $5::jsonb)
       ON CONFLICT (team_id, slug) DO UPDATE SET
         name       = EXCLUDED.name,
         status     = EXCLUDED.status,
         metadata   = EXCLUDED.metadata,
         updated_at = now()
       RETURNING ${CLIENT_COLS}`,
      [
        input.teamId,
        input.slug,
        input.name,
        input.status ?? "active",
        JSON.stringify(input.metadata ?? {}),
      ],
    );
    return mapClientRow(rows[0]);
  }

  /** Resolve a memory-store client slug to its DB row within a team (enforcement hook). */
  async getClientBySlug(teamId: string, slug: string): Promise<ClientRow | null> {
    const { rows } = await this.client.query<Record<string, unknown>>(
      `SELECT ${CLIENT_COLS} FROM clients WHERE team_id = $1 AND slug = $2`,
      [teamId, slug],
    );
    return rows.length ? mapClientRow(rows[0]) : null;
  }

  async getClientById(id: string): Promise<ClientRow | null> {
    const { rows } = await this.client.query<Record<string, unknown>>(
      `SELECT ${CLIENT_COLS} FROM clients WHERE id = $1`,
      [id],
    );
    return rows.length ? mapClientRow(rows[0]) : null;
  }

  async listClients(teamId: string): Promise<ClientRow[]> {
    const { rows } = await this.client.query<Record<string, unknown>>(
      `SELECT ${CLIENT_COLS} FROM clients WHERE team_id = $1 ORDER BY created_at`,
      [teamId],
    );
    return rows.map(mapClientRow);
  }

  // ── Client grants ────────────────────────────────────────────────────────────

  /**
   * Grant a member read/write access to a client. Any existing active grant for
   * the same (team, client, user) is superseded (revoked, then a fresh active row
   * inserted) so re-granting is safe and the partial unique index is honoured. The
   * grant and a `grant.granted` audit event are written in one transaction.
   */
  async grantClientAccess(input: GrantClientAccessInput): Promise<ClientGrantRow> {
    return this.transaction(async () => {
      await this.client.query(
        `UPDATE client_grants
           SET status = 'revoked', revoked_at = now(), revoked_by = $4
         WHERE team_id = $1 AND client_id = $2 AND user_id = $3 AND status = 'active'`,
        [input.teamId, input.clientId, input.userId, input.grantedBy ?? null],
      );

      const { rows } = await this.client.query<Record<string, unknown>>(
        `INSERT INTO client_grants
           (team_id, client_id, user_id, access, status, granted_by, metadata)
         VALUES ($1, $2, $3, $4, 'active', $5, $6::jsonb)
         RETURNING ${GRANT_COLS}`,
        [
          input.teamId,
          input.clientId,
          input.userId,
          input.access ?? "read",
          input.grantedBy ?? null,
          JSON.stringify(input.metadata ?? {}),
        ],
      );
      const grant = mapClientGrantRow(rows[0]);

      await this.recordAuditEvent({
        teamId: input.teamId,
        actorUserId: input.grantedBy ?? null,
        action: "grant.granted",
        targetType: "grant",
        targetId: grant.id,
        summary: `granted ${grant.access} on client ${input.clientId} to user ${input.userId}`,
        metadata: { clientId: input.clientId, userId: input.userId, access: grant.access },
      });

      return grant;
    });
  }

  /**
   * Revoke a member's active grant for a client. The row is flipped to `revoked`
   * (history is preserved, never deleted) and a `grant.revoked` audit event is
   * written in the same transaction. Returns the revoked grant, or null if there
   * was no active grant.
   */
  async revokeClientAccess(input: RevokeClientAccessInput): Promise<ClientGrantRow | null> {
    return this.transaction(async () => {
      const { rows } = await this.client.query<Record<string, unknown>>(
        `UPDATE client_grants
           SET status = 'revoked', revoked_at = now(), revoked_by = $4
         WHERE team_id = $1 AND client_id = $2 AND user_id = $3 AND status = 'active'
         RETURNING ${GRANT_COLS}`,
        [input.teamId, input.clientId, input.userId, input.revokedBy ?? null],
      );
      if (rows.length === 0) return null;
      const grant = mapClientGrantRow(rows[0]);

      await this.recordAuditEvent({
        teamId: input.teamId,
        actorUserId: input.revokedBy ?? null,
        action: "grant.revoked",
        targetType: "grant",
        targetId: grant.id,
        summary: `revoked access on client ${input.clientId} from user ${input.userId}`,
        metadata: { clientId: input.clientId, userId: input.userId },
      });

      return grant;
    });
  }

  /**
   * The member's current active grant for a client, or null. Revoked grants are
   * ignored here but remain queryable via {@link listGrants} — this is how
   * "revoked grants can be checked without deleting history" is satisfied.
   */
  async getActiveGrant(
    teamId: string,
    clientId: string,
    userId: string,
  ): Promise<ClientGrantRow | null> {
    const { rows } = await this.client.query<Record<string, unknown>>(
      `SELECT ${GRANT_COLS} FROM client_grants
       WHERE team_id = $1 AND client_id = $2 AND user_id = $3 AND status = 'active'`,
      [teamId, clientId, userId],
    );
    return rows.length ? mapClientGrantRow(rows[0]) : null;
  }

  /** List grants (active and revoked) — the full auditable history for a team. */
  async listGrants(filter: ListGrantsFilter): Promise<ClientGrantRow[]> {
    const conditions = ["team_id = $1"];
    const params: unknown[] = [filter.teamId];
    if (filter.clientId != null) {
      params.push(filter.clientId);
      conditions.push(`client_id = $${params.length}`);
    }
    if (filter.userId != null) {
      params.push(filter.userId);
      conditions.push(`user_id = $${params.length}`);
    }
    const { rows } = await this.client.query<Record<string, unknown>>(
      `SELECT ${GRANT_COLS} FROM client_grants
       WHERE ${conditions.join(" AND ")}
       ORDER BY granted_at`,
      params,
    );
    return rows.map(mapClientGrantRow);
  }

  // ── Workstations ─────────────────────────────────────────────────────────────

  /**
   * Register a workstation for a user. Any existing active registration of the
   * same (team, fingerprint) is superseded so the partial unique index is
   * honoured. Returns the new active workstation.
   */
  async registerWorkstation(input: RegisterWorkstationInput): Promise<WorkstationRow> {
    return this.transaction(async () => {
      await this.client.query(
        `UPDATE workstations SET status = 'revoked', revoked_at = now()
         WHERE team_id = $1 AND fingerprint = $2 AND status = 'active'`,
        [input.teamId, input.fingerprint],
      );
      const { rows } = await this.client.query<Record<string, unknown>>(
        `INSERT INTO workstations
           (team_id, user_id, name, fingerprint, status, registered_by, metadata)
         VALUES ($1, $2, $3, $4, 'active', $5, $6::jsonb)
         RETURNING ${WORKSTATION_COLS}`,
        [
          input.teamId,
          input.userId,
          input.name,
          input.fingerprint,
          input.registeredBy ?? null,
          JSON.stringify(input.metadata ?? {}),
        ],
      );
      return mapWorkstationRow(rows[0]);
    });
  }

  /** Revoke a workstation by id. History is preserved (status flip + revoked_at). */
  async revokeWorkstation(id: string): Promise<WorkstationRow | null> {
    const { rows } = await this.client.query<Record<string, unknown>>(
      `UPDATE workstations SET status = 'revoked', revoked_at = now()
       WHERE id = $1 AND status = 'active'
       RETURNING ${WORKSTATION_COLS}`,
      [id],
    );
    return rows.length ? mapWorkstationRow(rows[0]) : null;
  }

  async listWorkstations(teamId: string, userId?: string): Promise<WorkstationRow[]> {
    const params: unknown[] = [teamId];
    let where = "team_id = $1";
    if (userId != null) {
      params.push(userId);
      where += ` AND user_id = $${params.length}`;
    }
    const { rows } = await this.client.query<Record<string, unknown>>(
      `SELECT ${WORKSTATION_COLS} FROM workstations WHERE ${where} ORDER BY created_at`,
      params,
    );
    return rows.map(mapWorkstationRow);
  }

  // ── Audit events ─────────────────────────────────────────────────────────────

  /**
   * Append an audit event. Issues no transaction control of its own, so it is safe
   * to call standalone OR inside an open transaction (grant/revoke do the latter).
   */
  async recordAuditEvent(input: RecordAuditEventInput): Promise<AuditEventRow> {
    const { rows } = await this.client.query<Record<string, unknown>>(
      `INSERT INTO audit_events
         (team_id, actor_user_id, action, target_type, target_id, summary, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
       RETURNING ${AUDIT_COLS}`,
      [
        input.teamId,
        input.actorUserId ?? null,
        input.action,
        input.targetType,
        input.targetId ?? null,
        input.summary ?? null,
        JSON.stringify(input.metadata ?? {}),
      ],
    );
    return mapAuditEventRow(rows[0]);
  }

  /** Query the audit trail by team, optionally narrowed to a target. Newest first. */
  async listAuditEvents(filter: ListAuditEventsFilter): Promise<AuditEventRow[]> {
    const conditions = ["team_id = $1"];
    const params: unknown[] = [filter.teamId];
    if (filter.targetType != null) {
      params.push(filter.targetType);
      conditions.push(`target_type = $${params.length}`);
    }
    if (filter.targetId != null) {
      params.push(filter.targetId);
      conditions.push(`target_id = $${params.length}`);
    }
    let sql = `SELECT ${AUDIT_COLS} FROM audit_events
       WHERE ${conditions.join(" AND ")}
       ORDER BY created_at DESC, id DESC`;
    if (filter.limit != null) {
      params.push(filter.limit);
      sql += ` LIMIT $${params.length}`;
    }
    const { rows } = await this.client.query<Record<string, unknown>>(sql, params);
    return rows.map(mapAuditEventRow);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────────

  async close(): Promise<void> {
    await this.closeFn();
  }

  /** Run `fn` inside a single BEGIN/COMMIT, rolling back on any error. */
  private async transaction<T>(fn: () => Promise<T>): Promise<T> {
    await this.client.exec("BEGIN");
    try {
      const result = await fn();
      await this.client.exec("COMMIT");
      return result;
    } catch (error) {
      await this.client.exec("ROLLBACK");
      throw error;
    }
  }
}

/**
 * Open (and migrate) the identity store, selecting the engine via
 * {@link resolveMemoryBackend}: hosted Postgres when a connection string is
 * configured (or `backend: "postgres"`), else local PGLite. applyMigrations runs
 * BOTH 0001 (memory) and 0002 (team platform) — they share one migrations
 * directory and one database, by design.
 *
 * Pass `opts.client` to wrap an already-open connection (shared with the memory
 * store); open + migrate are then skipped and `close()` is a no-op.
 *
 * Safety mirrors openMemoryStore: when the resolved engine is Postgres, a
 * connection or migration failure PROPAGATES — this never substitutes the local
 * PGLite store for a hosted one.
 */
export async function openIdentityStore(
  opts: OpenIdentityStoreOptions = {},
): Promise<IdentityStore> {
  if (opts.client) {
    return new IdentityStore(opts.client, async () => {});
  }

  const embedDim = opts.embedDim ?? DEFAULT_EMBED_DIM;
  const backend = resolveMemoryBackend(
    { backend: opts.backend, connectionString: opts.connectionString, dataDir: opts.dataDir },
    process.env,
  );

  if (backend.kind === "postgres") {
    const pg = await openPostgres(backend.connectionString);
    try {
      await applyMigrations(pg.client, { embedDim });
    } catch (error) {
      await pg.close();
      throw error;
    }
    return new IdentityStore(pg.client, pg.close);
  }

  // The local PGLite store is a regenerable derived index; quarantine a corrupt
  // dir and start fresh rather than wedging every command (same as the memory store).
  const { client, close } = await openPGlite(backend.dataDir, { recreateCorruptDir: true });
  try {
    await applyMigrations(client, { embedDim });
  } catch (error) {
    await close();
    throw error;
  }
  return new IdentityStore(client, close);
}
