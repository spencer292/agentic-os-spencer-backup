// Launch a Chrome window with the DevTools remote-debugging port open, on a
// dedicated persistent profile. Zero dependencies — Node 22+ built-ins only.
//
//   node browser/launch.mjs
//
// Env overrides: CDP_PORT (9222), CHROME_PATH, CHROME_PROFILE
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const PORT = process.env.CDP_PORT || 9222;
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const profile = process.env.CHROME_PROFILE || path.join(os.homedir(), '.agentic-chrome-profile');

async function portOpen(port) {
  try {
    const r = await fetch(`http://127.0.0.1:${port}/json/version`, { signal: AbortSignal.timeout(800) });
    return r.ok;
  } catch { return false; }
}

if (await portOpen(PORT)) {
  console.log(`Chrome already listening on CDP port ${PORT}.`);
  process.exit(0);
}

fs.mkdirSync(profile, { recursive: true });

const args = [
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  '--remote-allow-origins=*',   // let the Node WebSocket client attach
  '--no-first-run',
  '--no-default-browser-check',
  '--start-maximized',
  'about:blank',
];

const child = spawn(CHROME, args, { detached: true, stdio: 'ignore' });
child.on('error', (e) => { console.error('Failed to launch Chrome:', e.message); process.exit(1); });
child.unref();

for (let i = 0; i < 50; i++) {
  if (await portOpen(PORT)) {
    console.log(`Chrome is up on CDP port ${PORT}.`);
    console.log(`Profile: ${profile}`);
    process.exit(0);
  }
  await new Promise((r) => setTimeout(r, 200));
}
console.error('Chrome launched but did not open the debugging port in time.');
process.exit(1);
