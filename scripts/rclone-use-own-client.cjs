#!/usr/bin/env node
// Point the rclone `gdrive` remote at OUR OWN Google OAuth client.
//
//   node scripts/rclone-use-own-client.cjs            # wire the client id/secret
//   node scripts/rclone-use-own-client.cjs --check    # report state, change nothing
//
// Why this exists (2026-08-23):
//
// The gdrive remote was authenticated with rclone's BUILT-IN client_id — the one
// shared by every rclone user on earth. That client has a single global Google API
// quota, so backup-sync.cjs was being throttled roughly 50x: it opened at ~1 MB/s
// and collapsed to 19 KiB/s, turning an 822 MiB transcript delta into a ~12 hour
// job that could never finish inside the 90m cron timeout. Google is also retiring
// that shared client during 2026, at which point the lane stops entirely.
//
// The fix is not a new Google project. GOOGLE_WORKSPACE_CLI_CLIENT_ID/SECRET already
// exist in .env — a Desktop OAuth client created for Drive/Gmail/Calendar. rclone
// simply was never told to use it. This wires it in.
//
// Secrets are read from .env and handed straight to rclone. They are never printed,
// never logged, and never echoed — matching the house rule that only env var NAMES
// appear in output.

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const REPO = path.resolve(__dirname, "..");
const RCLONE = "C:/Claude/tools/rclone/rclone.exe";
const REMOTE = "gdrive";
const ENV_FILE = path.join(REPO, ".env");

const CHECK_ONLY = process.argv.includes("--check");
const WHICH = process.argv.includes("--which");

// 2026-08-23: GOOGLE_WORKSPACE_CLI_* is documented in .env.example but was never
// populated. The Gmail Desktop client IS populated and is the same client TYPE
// rclone needs, so we reuse it (Roy's call). If Drive API is not enabled on that
// client's project, `config reconnect` fails with an error naming the project and
// a direct enable link — that error is the diagnostic, not a dead end.
const ID_KEY = "GMAIL_CLIENT_ID";
const SECRET_KEY = "GMAIL_CLIENT_SECRET";

// Candidate OAuth client pairs, best-fit first. --which reports which are actually
// POPULATED in .env (names only, never values) so we can pick without guessing from
// .env.example, which documents keys that may never have been filled in.
const CANDIDATES = [
  { id: "GOOGLE_WORKSPACE_CLI_CLIENT_ID", secret: "GOOGLE_WORKSPACE_CLI_CLIENT_SECRET", note: "Desktop client documented for Drive/Gmail/Calendar — ideal" },
  { id: "GMAIL_CLIENT_ID",                secret: "GMAIL_CLIENT_SECRET",                note: "Desktop client, gmail.modify — needs Drive API enabled on ITS project" },
  { id: "GOOGLE_ADS_CLIENT_ID",           secret: "GOOGLE_ADS_CLIENT_SECRET",           note: "Ads client — wrong project family, last resort" },
];

// Minimal .env reader — we deliberately do NOT pull in dotenv or mutate process.env,
// so these values exist only inside this function's scope.
function readEnv(keys) {
  if (!fs.existsSync(ENV_FILE)) {
    console.error(`.env not found at ${ENV_FILE}`);
    process.exit(2);
  }
  const out = {};
  for (const raw of fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    if (!keys.includes(key)) continue;
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

// NOTE the character class instead of \s: \s matches newlines, so `client_id =`
// with an EMPTY value would skip the blank and capture the NEXT config line,
// reporting a dedicated client where there is none. That false negative is what
// hid this problem on 2026-08-23 — an empty value is precisely the broken state
// we are looking for, so the detection must not step over it.
function currentClientId() {
  const r = spawnSync(RCLONE, ["config", "show", REMOTE], { encoding: "utf8" });
  if (r.status !== 0) return null;
  const m = (r.stdout || "").match(/^client_id[^\S\r\n]*=[^\S\r\n]*(.*)$/m);
  return m ? m[1].trim() : "";
}

// rclone's own published client_id. If the config carries THIS value, the remote is
// still on the shared quota even though a value is technically present.
const RCLONE_SHARED_ID_PREFIX = "202264815644";

function main() {
  if (!fs.existsSync(RCLONE)) {
    console.error(`rclone not found at ${RCLONE}`);
    process.exit(2);
  }

  const remotes = spawnSync(RCLONE, ["listremotes"], { encoding: "utf8" });
  const names = (remotes.stdout || "").split("\n").map((s) => s.trim().replace(/:$/, "")).filter(Boolean);
  if (!names.includes(REMOTE)) {
    console.error(`rclone remote "${REMOTE}" does not exist — nothing to update.`);
    process.exit(2);
  }

  const before = currentClientId();
  const usingShared = !before || before.startsWith(RCLONE_SHARED_ID_PREFIX);
  console.log(`remote:      ${REMOTE}`);
  console.log(`client_id:   ${!before ? "EMPTY" : before.startsWith(RCLONE_SHARED_ID_PREFIX) ? "rclone's public shared id" : "dedicated"}`);
  console.log(`quota:       ${usingShared ? "SHARED — throttled, and retired by Google during 2026" : "own project"}`);

  if (WHICH) {
    const env = readEnv(CANDIDATES.flatMap((c) => [c.id, c.secret]));
    console.log(`\nOAuth client pairs populated in .env (names only — no values shown):\n`);
    let any = false;
    for (const c of CANDIDATES) {
      const ok = Boolean(env[c.id]) && Boolean(env[c.secret]);
      if (ok) any = true;
      console.log(`  [${ok ? "SET" : "   "}] ${c.id} / ${c.secret}`);
      console.log(`        ${c.note}`);
    }
    if (!any) console.log(`\nNone populated — a Desktop OAuth client id/secret must be added to .env.`);
    process.exit(any ? 0 : 1);
  }

  if (CHECK_ONLY) {
    console.log(usingShared ? "\nRun without --check to wire our own client." : "\nAlready on a dedicated client_id.");
    process.exit(usingShared ? 1 : 0);
  }

  const env = readEnv([ID_KEY, SECRET_KEY]);
  const missing = [ID_KEY, SECRET_KEY].filter((k) => !env[k]);
  if (missing.length) {
    console.error(`\nMissing in .env: ${missing.join(", ")}`);
    console.error(`These are the Desktop OAuth client documented in .env.example for Drive/Gmail/Calendar.`);
    process.exit(2);
  }

  const r = spawnSync(RCLONE, [
    "config", "update", REMOTE,
    "client_id", env[ID_KEY],
    "client_secret", env[SECRET_KEY],
    "--non-interactive",
  ], { encoding: "utf8" });

  if (r.status !== 0) {
    // rclone echoes config on error; scrub before surfacing so no secret escapes.
    const scrub = (s) => (s || "").replace(new RegExp(env[SECRET_KEY].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), "<redacted>");
    console.error(scrub(r.stderr) || scrub(r.stdout));
    process.exit(1);
  }

  console.log(`\nWired ${ID_KEY} / ${SECRET_KEY} into the ${REMOTE} remote.`);
  console.log(`\nThe existing token was minted against the OLD client, so it must be re-authorised`);
  console.log(`ONCE in a browser. Roy runs this himself — it opens a Google consent screen:\n`);
  console.log(`  "${RCLONE}" config reconnect ${REMOTE}:\n`);
  console.log(`Then prove it worked with a timed transfer:\n`);
  console.log(`  node scripts/backup-sync.cjs --only transcripts\n`);
  console.log(`Expect ~1 MB/s sustained rather than 19 KiB/s. If it still crawls, the consent`);
  console.log(`screen for this client may not include the Drive scope.`);
}

main();
