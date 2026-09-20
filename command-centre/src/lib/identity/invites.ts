/**
 * AIOS Team Platform — invite & join flow.
 *
 * Lets a team admin invite someone by email and lets that person join. An invite
 * is a membership held in the `invited` state plus a hashed, expiring, single-use
 * token kept in the membership's metadata. Only the hash is stored: the raw token
 * is returned once, to be handed to the invitee, and is verified on join. An
 * invite that is unknown, already used, tampered with, or past its expiry never
 * grants access.
 *
 * Builds entirely on the identity store's primitives — membership upsert/status,
 * the audit log, and the role gate in ./permissions — so there is no new storage
 * or SQL beyond the metadata bag the membership already carries.
 */

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { PermissionError, requireTeamRole } from "./permissions";
import type { IdentityStore } from "./store";
import type { MembershipRow, Role, UserRow } from "./types";

/** Roles an invite may carry. Ownership is a transfer concern, not an invite. */
const INVITABLE_ROLES: readonly Role[] = ["admin", "member"];

const DEFAULT_EXPIRY_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface InviteMemberInput {
  teamId: string;
  /** The admin or owner issuing the invite. Must hold an active admin+ role. */
  actorUserId: string;
  /** Who to invite. A user is created if none exists for this email yet. */
  email: string;
  /** Role to grant on join. Defaults to `member`; `owner` is not invitable. */
  role?: Role;
  /** Days until the invite expires. Defaults to 7. */
  expiresInDays?: number;
  /** Injectable clock for deterministic tests. Defaults to the current time. */
  now?: Date;
}

export interface InviteMemberResult {
  membership: MembershipRow;
  user: UserRow;
  /** The raw invite token — returned ONCE; only its hash is stored. */
  token: string;
  /** ISO timestamp after which the invite is no longer valid. */
  expiresAt: string;
}

export interface AcceptInviteInput {
  teamId: string;
  email: string;
  token: string;
  /** Injectable clock for deterministic tests. Defaults to the current time. */
  now?: Date;
}

/** Raised when an invite is missing, already used, mismatched, or expired. */
export class InvalidInviteError extends Error {
  readonly code = "invalid_invite";
  constructor(message = "invite is invalid or has expired") {
    super(message);
    this.name = "InvalidInviteError";
  }
}

interface InviteSecret {
  inviteTokenHash: string;
  inviteExpiresAt: string;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Constant-time comparison of two equal-length hex digests. */
function hashesEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

function readInviteSecret(metadata: Record<string, unknown>): InviteSecret | null {
  const inviteTokenHash = metadata.inviteTokenHash;
  const inviteExpiresAt = metadata.inviteExpiresAt;
  if (typeof inviteTokenHash !== "string" || typeof inviteExpiresAt !== "string") {
    return null;
  }
  return { inviteTokenHash, inviteExpiresAt };
}

/**
 * Invite a member to a team. The caller must hold an active admin (or owner)
 * role. Creates or reuses the invitee's user, records the membership in the
 * `invited` state with a hashed, expiring token, and writes a `membership.invited`
 * audit event. Returns the raw token (shown once) for delivery to the invitee.
 */
export async function inviteMember(
  store: IdentityStore,
  input: InviteMemberInput,
): Promise<InviteMemberResult> {
  const role = input.role ?? "member";
  if (!INVITABLE_ROLES.includes(role)) {
    throw new PermissionError(`cannot invite with role "${role}"`);
  }

  // Authorize the inviter before creating or touching anything.
  await requireTeamRole(store, input.teamId, input.actorUserId, "admin");

  const user = await store.upsertUser({ email: input.email });

  const existing = await store.getMembership(input.teamId, user.id);
  if (existing && existing.status === "active") {
    throw new InvalidInviteError("user is already an active member of this team");
  }

  const now = input.now ?? new Date();
  const expiresInDays = input.expiresInDays ?? DEFAULT_EXPIRY_DAYS;
  const expiresAt = new Date(now.getTime() + expiresInDays * DAY_MS).toISOString();
  const token = randomBytes(32).toString("base64url");

  const inviteMetadata: InviteSecret = {
    inviteTokenHash: hashToken(token),
    inviteExpiresAt: expiresAt,
  };

  const membership = await store.upsertMembership({
    teamId: input.teamId,
    userId: user.id,
    role,
    status: "invited",
    invitedBy: input.actorUserId,
    metadata: { ...inviteMetadata },
  });

  await store.recordAuditEvent({
    teamId: input.teamId,
    actorUserId: input.actorUserId,
    action: "membership.invited",
    targetType: "membership",
    targetId: membership.id,
    summary: `invited ${user.email} as ${role}`,
    metadata: { email: user.email, role, expiresAt },
  });

  return { membership, user, token, expiresAt };
}

/**
 * Accept an invite and join the team. Verifies the token against the stored hash
 * in constant time and checks expiry, then flips the membership to `active` and
 * clears the now-spent token (single use). Writes a `membership.joined` audit
 * event. Throws {@link InvalidInviteError} for any unknown, used, mismatched, or
 * expired invite.
 */
export async function acceptInvite(
  store: IdentityStore,
  input: AcceptInviteInput,
): Promise<MembershipRow> {
  const user = await store.getUserByEmail(input.email);
  if (!user) throw new InvalidInviteError();

  const membership = await store.getMembership(input.teamId, user.id);
  if (!membership || membership.status !== "invited") throw new InvalidInviteError();

  const secret = readInviteSecret(membership.metadata);
  if (!secret) throw new InvalidInviteError();

  if (!hashesEqual(hashToken(input.token), secret.inviteTokenHash)) {
    throw new InvalidInviteError();
  }

  const now = input.now ?? new Date();
  if (new Date(secret.inviteExpiresAt).getTime() <= now.getTime()) {
    throw new InvalidInviteError("invite has expired");
  }

  const joined = await store.upsertMembership({
    teamId: input.teamId,
    userId: user.id,
    role: membership.role,
    status: "active",
    invitedBy: membership.invitedBy,
    metadata: {}, // consume the token — single use
  });

  await store.recordAuditEvent({
    teamId: input.teamId,
    actorUserId: user.id,
    action: "membership.joined",
    targetType: "membership",
    targetId: joined.id,
    summary: `${user.email} joined as ${joined.role}`,
    metadata: { email: user.email, role: joined.role },
  });

  return joined;
}
