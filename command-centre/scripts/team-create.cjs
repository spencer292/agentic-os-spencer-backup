#!/usr/bin/env node
/**
 * team-create — bootstrap a team and its first owner.
 *
 * The genesis step for the team platform: with no team or owner yet there is no
 * admin to authorize anything, so this command creates the team and an active
 * owner membership directly. Everything after this (invites, grants) runs through
 * the normal authorized flows. Writes to the workspace's local PGLite store, or
 * hosted Postgres when MEMORY_DATABASE_URL is set.
 *
 * Usage:
 *   node scripts/team-create.cjs --slug acme --name "Acme Inc" --owner-email owner@acme.com [--owner-name "Owner"]
 */

const {
  loadIdentityModules,
  openLocalIdentityStore,
} = require("./load-identity-modules.cjs");

const USAGE = `team-create — create a team and its first owner

Usage:
  node scripts/team-create.cjs --slug <slug> --name <name> --owner-email <email> [--owner-name <name>]`;

function parseArgs(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const take = () => {
      const v = argv[i + 1];
      if (v === undefined) throw new Error(`${arg} requires a value`);
      i += 1;
      return v;
    };
    if (arg === "--slug") flags.slug = take();
    else if (arg === "--name") flags.name = take();
    else if (arg === "--owner-email") flags.ownerEmail = take();
    else if (arg === "--owner-name") flags.ownerName = take();
    else if (arg === "--help" || arg === "-h") flags.help = true;
    else throw new Error(`Unknown flag: ${arg}`);
  }
  return flags;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  if (flags.help) {
    console.log(USAGE);
    return 0;
  }
  if (!flags.slug || !flags.name || !flags.ownerEmail) {
    console.error("team-create: --slug, --name and --owner-email are required.\n");
    console.error(USAGE);
    return 2;
  }

  const { store } = loadIdentityModules();
  const s = await openLocalIdentityStore(store);
  try {
    const existing = await s.getTeamBySlug(flags.slug);
    if (existing) {
      console.error(
        `team-create: a team with slug "${flags.slug}" already exists (${existing.id}).`,
      );
      return 2;
    }

    const team = await s.createTeam({ slug: flags.slug, name: flags.name });
    const owner = await s.upsertUser({
      email: flags.ownerEmail,
      displayName: flags.ownerName ?? null,
    });
    await s.upsertMembership({
      teamId: team.id,
      userId: owner.id,
      role: "owner",
      status: "active",
    });

    console.log(`team-create → created team "${team.name}"`);
    console.log(`  team id : ${team.id}`);
    console.log(`  slug    : ${team.slug}`);
    console.log(`  owner   : ${owner.email} (${owner.id})`);
    return 0;
  } finally {
    await s.close();
  }
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(`\nteam-create failed: ${error instanceof Error ? error.message : error}`);
    if (error && error.stack) console.error(error.stack);
    console.error(`\n${USAGE}`);
    process.exit(1);
  });
