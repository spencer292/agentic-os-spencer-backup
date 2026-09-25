#!/usr/bin/env node
/**
 * team-join — redeem an invite token and join a team.
 *
 * Verifies the token against the stored hash and checks its expiry, then activates
 * the membership. The token is single-use: redeeming it clears it. An unknown,
 * used, mismatched, or expired token is rejected and grants no access.
 *
 * Usage:
 *   node scripts/team-join.cjs --team acme --email dev@acme.com --token <token>
 */

const {
  loadIdentityModules,
  openLocalIdentityStore,
  resolveTeamRef,
} = require("./load-identity-modules.cjs");

const USAGE = `team-join — redeem an invite token and join a team

Usage:
  node scripts/team-join.cjs --team <slug|id> --email <invitee> --token <token>`;

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
    if (arg === "--team") flags.team = take();
    else if (arg === "--email") flags.email = take();
    else if (arg === "--token") flags.token = take();
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
  if (!flags.team || !flags.email || !flags.token) {
    console.error("team-join: --team, --email and --token are required.\n");
    console.error(USAGE);
    return 2;
  }

  const { store, invites } = loadIdentityModules();
  const s = await openLocalIdentityStore(store);
  try {
    const team = await resolveTeamRef(s, flags.team);
    const membership = await invites.acceptInvite(s, {
      teamId: team.id,
      email: flags.email,
      token: flags.token,
    });
    console.log(
      `team-join → ${flags.email} joined "${team.name}" as ${membership.role} (status: ${membership.status})`,
    );
    return 0;
  } finally {
    await s.close();
  }
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(`\nteam-join failed: ${error instanceof Error ? error.message : error}`);
    if (error && error.stack) console.error(error.stack);
    console.error(`\n${USAGE}`);
    process.exit(1);
  });
