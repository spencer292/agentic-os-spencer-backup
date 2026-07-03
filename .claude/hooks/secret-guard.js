#!/usr/bin/env node
// Secret Guard — PreToolUse hook (Bash)
// Closes the gap that `Bash(cat:*)` leaves open: the `Read(.env)` permission
// deny only covers the Read TOOL, not shell commands. Without this hook a
// command like `cat .env` (or `Get-Content .env`, `head .env`, etc.) would
// dump every secret into the transcript, bypassing the deny entirely.
//
// What it blocks: any Bash command whose COMMAND LINE references a secrets
// file (.env, .env.local, *.pem, *.key, id_rsa, credentials files).
//
// What it deliberately allows:
//   - .env.example / .env.sample / .env.template / .env.dist  (safe, no secrets)
//   - skills/scripts that LOAD .env internally — e.g. `bash scripts/setup.sh`
//     or `python foo.py` — because the .env access happens inside the script,
//     not on the command line, so it never appears in the string we inspect.
//
// This is the surgical "read to USE = fine, read to PRINT = blocked" control.

// --- secrets-file detection -------------------------------------------------

// Suffixes that are safe (templates / examples, never real secrets).
const SAFE_ENV_SUFFIXES = new Set(['example', 'sample', 'template', 'dist', 'defaults']);

// Match .env optionally followed by .<suffix>, at a token boundary.
const ENV_REF = /(?:^|[\s'"`=:;|&(])\.env(?:\.([A-Za-z0-9_-]+))?(?=$|[\s'"`)\];|&>])/g;

// Other secret-bearing files we never want dumped on a command line.
const OTHER_SECRET_REF = /(?:^|[\s'"`=:/\\])(?:[^\s'"`]*\.(?:pem|key|ppk|p12|pfx)|id_rsa[^\s'"`]*|[^\s'"`]*credentials[^\s'"`]*|[^\s'"`]*\.env\.local)(?=$|[\s'"`)\];|&>])/i;

function referencesSecretFile(cmd) {
  // 1) .env references (excluding safe template suffixes)
  let m;
  ENV_REF.lastIndex = 0;
  while ((m = ENV_REF.exec(cmd)) !== null) {
    const suffix = (m[1] || '').toLowerCase();
    if (!suffix) return true;                  // bare `.env`
    if (!SAFE_ENV_SUFFIXES.has(suffix)) return true; // `.env.local`, `.env.prod`, etc.
    // else: .env.example / .env.sample / ... -> safe, keep scanning
  }
  // 2) other secret files (keys, certs, credentials)
  if (OTHER_SECRET_REF.test(cmd)) return true;
  return false;
}

// --- hook plumbing (matches project convention: stdin JSON, fail-safe) ------

let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 4000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => (input += chunk));
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);
    if (data.tool_name !== 'Bash') process.exit(0);

    const cmd = (data.tool_input && data.tool_input.command) || '';
    if (!referencesSecretFile(cmd)) process.exit(0);

    const reason =
      'Blocked: this command references a secrets file (.env or a key/credential file) ' +
      'directly on the command line, which would expose its contents in the transcript. ' +
      'To verify a key works, make a live API call and mask the value instead of printing it. ' +
      'If you genuinely need the raw value, open the file yourself outside the agent. ' +
      '(.env.example and other template files are not blocked.)';

    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: reason,
        },
      })
    );
    process.exit(0);
  } catch {
    // Parse failure: do not wedge the session.
    process.exit(0);
  }
});
