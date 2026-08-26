/**
 * Take the Shopify Admin token straight from the clipboard into the env file.
 *
 *   node scripts/save-token.mjs
 *
 * Exists because the manual routes kept failing: Notepad opens a blank untitled
 * document for dotfiles rather than the file, and the PowerShell one-liner has
 * enough nested quoting and backticks to break on a bad paste. Both failed
 * silently — the file was never written and nothing said so.
 *
 * This reads the clipboard, checks the value actually looks like an Admin API
 * token, appends the two lines, and prints a masked confirmation.
 *
 * The token is never printed, and never passed as a command-line argument
 * (which would put it in the process list and the shell history). Only its
 * length and first six characters are shown.
 */

import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const envPath = join(here, '..', '..', '..', '..', '.env');
const STORE = 'syperformance-build.myshopify.com';

console.log(`Target: ${envPath}`);

let before;
try {
  before = statSync(envPath);
  console.log(`Before: ${before.size} bytes, modified ${before.mtime.toISOString()}`);
} catch {
  console.error('\n  That file does not exist. Stopping rather than creating a new one —');
  console.error('  the existing file holds your other keys and I will not risk replacing it.');
  process.exit(1);
}

// --- clipboard ---------------------------------------------------------------

let clip = '';
try {
  clip = execFileSync('powershell', ['-NoProfile', '-Command', 'Get-Clipboard'], {
    encoding: 'utf8',
    timeout: 15000,
  });
} catch (err) {
  console.error(`\n  Could not read the clipboard: ${err.message}`);
  process.exit(1);
}

const token = clip.trim().replace(/^["']|["']$/g, '');

if (!token) {
  console.error('\n  Clipboard is empty. Copy the token from Shopify first, then re-run this.');
  process.exit(1);
}

if (!token.startsWith('shpat_')) {
  console.error(`\n  Clipboard does not hold an Admin API token — it starts "${token.slice(0, 6)}…"`);
  console.error('  and an Admin API access token starts "shpat_". Nothing written.');
  console.error('  Click the copy button next to the token in Shopify, then re-run this.');
  process.exit(1);
}

if (/\s/.test(token)) {
  console.error('\n  Clipboard value contains whitespace, so it is not just the token. Nothing written.');
  process.exit(1);
}

// --- write -------------------------------------------------------------------

const raw = readFileSync(envPath, 'utf8');

if (raw.includes('SHOPIFY_BUILD_ADMIN_TOKEN')) {
  console.error('\n  SHOPIFY_BUILD_ADMIN_TOKEN is already in the file. Nothing written.');
  console.error('  Remove the existing line by hand if you are replacing a dead token.');
  process.exit(1);
}

// Preserve the file's existing line endings rather than mixing them.
const crlf = raw.includes('\r\n');
const nl = crlf ? '\r\n' : '\n';
const needsLeadingBreak = raw.length > 0 && !raw.endsWith('\n');

const addition =
  (needsLeadingBreak ? nl : '') +
  `SHOPIFY_BUILD_STORE=${STORE}${nl}` +
  `SHOPIFY_BUILD_ADMIN_TOKEN=${token}${nl}`;

writeFileSync(envPath, raw + addition, 'utf8');

const after = statSync(envPath);
console.log(`After:  ${after.size} bytes, modified ${after.mtime.toISOString()}`);
console.log(`Wrote:  SHOPIFY_BUILD_STORE=${STORE}`);
console.log(`        SHOPIFY_BUILD_ADMIN_TOKEN=${token.slice(0, 6)}… (${token.length} chars)`);
console.log(`\nGrew by ${after.size - before.size} bytes. Now run: node scripts/check-token.mjs`);
