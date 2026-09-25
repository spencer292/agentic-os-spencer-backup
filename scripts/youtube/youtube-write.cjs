#!/usr/bin/env node
/**
 * YouTube tamper-safe write client — videos.update with independent
 * read-back verification, plus per-call quota accounting.
 *
 * Zero-dependency CommonJS: Node built-ins (fs, path) and global fetch
 * only. Requires getAccessToken from ./youtube-oauth.cjs rather than
 * duplicating the token-refresh exchange.
 *
 * videos.update?part=snippet overwrites the WHOLE snippet object, not just
 * the fields sent. Every write here echoes the full snippet retrieved by a
 * prior videos.list call plus only the intended delta — never a partial
 * object — then reads again and deep-compares six fields. Any drift sets a
 * non-zero exit code. This is the tamper guard.
 *
 * The read-back is POLLED, not read once: YouTube can take minutes to
 * reflect a write on videos.list, and a single immediate read reports a
 * confident mismatch for a write that succeeded. The echo is also refused
 * when the prior read came back incomplete, since a full-snippet PUT built
 * on a partial read erases live fields.
 *
 * Modes:
 *   --noop-proof --channel <name> --video <id>
 *   --set-tags   --channel <name> --video <id> --tags "a,b,c"
 *   --set-thumbnail ...   (guard only — deferred to Phase 6)
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { getAccessToken, envVar } = require('./youtube-oauth.cjs');

const QUOTA_UNITS = { 'videos.list': 1, 'videos.update': 50 };
// Read-after-write poll window. videos.list is 1 unit, so polling is cheap
// next to the 50-unit write it is verifying.
const READBACK_POLL_INTERVAL_MS = 30_000;
const READBACK_POLL_MAX = 10; // 10 x 30 s = 5 min
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const COMPARE_FIELDS = [
  'title',
  'description',
  'categoryId',
  'tags',
  'defaultLanguage',
  'defaultAudioLanguage',
];

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')
    ? process.argv[i + 1]
    : def;
}
const flag = (n) => process.argv.includes(`--${n}`);

// --- ledger dir resolution, matching ledger/lib.cjs's BREATHWORK_LEDGER_DIR
// convention, but this script lives outside the ledger folder so it walks
// up to the repo root itself rather than resolving relative to __dirname.
function findRepoRoot() {
  let dir = __dirname;
  for (let i = 0; i < 20; i++) {
    if (fs.existsSync(path.join(dir, 'package.json')) || fs.existsSync(path.join(dir, '.git'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return dir;
    dir = parent;
  }
  return dir;
}

const LEDGER_DIR = process.env.BREATHWORK_LEDGER_DIR
  ? path.resolve(process.env.BREATHWORK_LEDGER_DIR)
  : path.join(findRepoRoot(), 'projects', 'briefs', 'breathwork-channel-engine', 'ledger');
const QUOTA_PATH = path.join(LEDGER_DIR, 'quota.jsonl');

function appendQuota({ endpoint, method, units, channel, videoId }) {
  fs.mkdirSync(LEDGER_DIR, { recursive: true });
  const entry = {
    at: new Date().toISOString(),
    endpoint,
    method,
    units,
    channel,
    video_id: videoId,
  };
  fs.appendFileSync(QUOTA_PATH, `${JSON.stringify(entry)}\n`, 'utf8');
  return entry;
}

function deepEqualField(a, b) {
  return JSON.stringify(a === undefined ? null : a) === JSON.stringify(b === undefined ? null : b);
}

function short(v) {
  if (v === undefined || v === null) return '(none)';
  const s = Array.isArray(v) ? v.join('|') : String(v);
  return s.length > 22 ? `${s.slice(0, 19)}...` : s;
}

function pad(s, n) {
  s = String(s);
  return s.length >= n ? s : s + ' '.repeat(n - s.length);
}

function refreshTokenVarName(channel) {
  if (channel === 'breathwork') return 'YOUTUBE_OAUTH_REFRESH_TOKEN_BREATHWORK';
  if (channel === 'main') return 'YOUTUBE_OAUTH_REFRESH_TOKEN_MAIN';
  return null;
}

async function run() {
  const channel = arg('channel', '');
  const videoIdArg = arg('video', '');

  if (flag('set-thumbnail')) {
    console.error(
      'thumbnails.set is deferred to Phase 6 — it depends on the channel completing phone ' +
        'verification (see 01-RESEARCH.md Pitfall 8). Not implemented here.'
    );
    process.exitCode = 1;
    return;
  }

  const mode = flag('noop-proof') ? 'noop-proof' : flag('set-tags') ? 'set-tags' : null;
  if (!mode) {
    console.error('Specify a mode: --noop-proof or --set-tags (or --set-thumbnail).');
    process.exitCode = 1;
    return;
  }

  // Credential check first — no network call yet.
  const clientId = envVar('YOUTUBE_OAUTH_CLIENT_ID');
  const clientSecret = envVar('YOUTUBE_OAUTH_CLIENT_SECRET');
  const refreshVarName = refreshTokenVarName(channel);
  const missing = [];
  if (!clientId) missing.push('YOUTUBE_OAUTH_CLIENT_ID');
  if (!clientSecret) missing.push('YOUTUBE_OAUTH_CLIENT_SECRET');
  if (!refreshVarName) {
    missing.push(`unknown --channel "${channel}" (accepted: breathwork, main)`);
  } else if (!envVar(refreshVarName)) {
    missing.push(refreshVarName);
  }
  if (missing.length) {
    for (const m of missing) console.log(`MISSING: ${m}`);
    process.exitCode = 1;
    return;
  }

  // Video id: --video, or the breathwork test-video fallback. Still no
  // network call.
  let videoId = videoIdArg;
  if (!videoId && channel === 'breathwork') {
    videoId = envVar('YOUTUBE_OAUTH_TEST_VIDEO_ID_BREATHWORK');
  }
  if (!videoId) {
    console.log('MISSING: --video <id> (no test-video fallback available for this channel)');
    process.exitCode = 1;
    return;
  }

  const tokenResult = await getAccessToken(channel);
  if (!tokenResult.ok) {
    console.error(
      `Token refresh failed: ${tokenResult.error || (tokenResult.missing || []).join(', ')}`
    );
    process.exitCode = 1;
    return;
  }
  const authHeader = { Authorization: `Bearer ${tokenResult.accessToken}` };

  // Step 1: read-before-write.
  const beforeUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,status&id=${encodeURIComponent(videoId)}`;
  let beforeRes;
  try {
    beforeRes = await fetch(beforeUrl, { headers: authHeader });
  } catch (e) {
    console.error(`videos.list network error: ${e.message}`);
    process.exitCode = 1;
    return;
  }
  const beforeJson = await beforeRes.json().catch(() => ({}));
  appendQuota({
    endpoint: 'videos.list',
    method: 'GET',
    units: QUOTA_UNITS['videos.list'],
    channel,
    videoId,
  });
  if (!beforeRes.ok) {
    console.error(`videos.list failed: HTTP ${beforeRes.status} ${JSON.stringify(beforeJson).slice(0, 300)}`);
    process.exitCode = 1;
    return;
  }
  const items = beforeJson.items || [];
  if (!items.length) {
    console.error(
      `No video found for id "${videoId}" on the ${channel} channel's credential ` +
        '(not found, or not owned by this channel).'
    );
    process.exitCode = 1;
    return;
  }
  const snippet = items[0].snippet;

  // Build the intended snippet — always the full echo, plus any delta.
  let intendedSnippet = snippet;
  let intendedTags = snippet.tags || [];
  if (mode === 'set-tags') {
    const suppliedRaw = arg('tags', '');
    const supplied = suppliedRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    // An omitted or malformed --tags used to yield an empty supplied list,
    // making `merged` identical to the existing tags — and the script still
    // performed a real 50-unit PUT against the live video and printed
    // WRITE VERIFIED. A typo produced a successful-looking run that did
    // nothing. (arg() also returns the default when the value starts with
    // "--", so `--tags --foo` lands here too.)
    if (!supplied.length) {
      console.error('--set-tags requires a non-empty --tags "a,b,c"');
      process.exitCode = 1;
      return;
    }
    // videos.update?part=snippet overwrites the WHOLE snippet object, so the
    // echo has to be trustworthy. The tamper guard compares the write against
    // the read but never checked the read itself: if videos.list came back
    // without `tags`, the PUT would silently erase the live video's tags.
    if (!('categoryId' in snippet) || !('title' in snippet)) {
      console.error(
        'videos.list returned an incomplete snippet (missing categoryId or title) — ' +
          'refusing a destructive full-snippet PUT'
      );
      process.exitCode = 1;
      return;
    }
    const merged = [...(snippet.tags || [])];
    for (const t of supplied) if (!merged.includes(t)) merged.push(t);
    intendedTags = merged;
    intendedSnippet = Object.assign({}, snippet, { tags: intendedTags });
  }

  // Step 2: write — full echo, never a partial object.
  const updateUrl = 'https://www.googleapis.com/youtube/v3/videos?part=snippet';
  let updateRes;
  try {
    updateRes = await fetch(updateUrl, {
      method: 'PUT',
      headers: Object.assign({ 'Content-Type': 'application/json' }, authHeader),
      body: JSON.stringify({ id: videoId, snippet: intendedSnippet }),
    });
  } catch (e) {
    console.error(`videos.update network error: ${e.message}`);
    process.exitCode = 1;
    return;
  }
  const updateJson = await updateRes.json().catch(() => ({}));
  appendQuota({
    endpoint: 'videos.update',
    method: 'PUT',
    units: QUOTA_UNITS['videos.update'],
    channel,
    videoId,
  });
  if (!updateRes.ok) {
    console.error(`videos.update failed: HTTP ${updateRes.status} ${JSON.stringify(updateJson).slice(0, 300)}`);
    process.exitCode = 1;
    return;
  }

  // Step 3: independent read-after, POLLED.
  //
  // A single read here was the exact false negative the sibling script
  // already measured and fixed: on the 2026-09-08 run a tag write took ~3
  // minutes to appear on videos.list, and "a single read 10 s after the
  // write produced a confident FAIL for a write that had in fact succeeded"
  // (checks/zernio-publish-proof.cjs). Retry on an interval until every
  // compared field matches or the window closes, and only then call it a
  // mismatch. Same poll shape as pollTags there, kept minimal because this
  // is documented fallback code off the v1 path.
  const afterUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${encodeURIComponent(videoId)}`;
  let afterSnippet = null;
  let pollCount = 0;

  for (let attempt = 1; attempt <= READBACK_POLL_MAX; attempt++) {
    pollCount = attempt;
    let afterRes;
    try {
      afterRes = await fetch(afterUrl, { headers: authHeader });
    } catch (e) {
      console.error(`post-write videos.list network error: ${e.message}`);
      process.exitCode = 1;
      return;
    }
    const afterJson = await afterRes.json().catch(() => ({}));
    appendQuota({
      endpoint: 'videos.list',
      method: 'GET',
      units: QUOTA_UNITS['videos.list'],
      channel,
      videoId,
    });
    const afterItems = afterJson.items || [];
    if (!afterRes.ok || !afterItems.length) {
      console.error(`Post-write read failed: HTTP ${afterRes.status}`);
      process.exitCode = 1;
      return;
    }
    afterSnippet = afterItems[0].snippet;

    const allMatchNow = COMPARE_FIELDS.every((field) =>
      deepEqualField(field === 'tags' ? intendedTags : intendedSnippet[field], afterSnippet[field])
    );
    if (allMatchNow) break;
    if (attempt < READBACK_POLL_MAX) {
      console.log(
        `  read-back ${attempt}/${READBACK_POLL_MAX}: not yet consistent, retrying in ${READBACK_POLL_INTERVAL_MS / 1000}s ` +
          '(YouTube can take minutes to reflect a write)'
      );
      await sleep(READBACK_POLL_INTERVAL_MS);
    }
  }

  // Compare and report.
  console.log(`${pad('field', 20)}${pad('before', 25)}${pad('intended', 25)}${pad('after', 25)}match`);
  let allMatch = true;
  for (const field of COMPARE_FIELDS) {
    const expected = field === 'tags' ? intendedTags : intendedSnippet[field];
    const actual = afterSnippet[field];
    const isMatch = deepEqualField(expected, actual);
    if (!isMatch) allMatch = false;
    console.log(
      `${pad(field, 20)}${pad(short(snippet[field]), 25)}${pad(short(expected), 25)}${pad(short(actual), 25)}${isMatch ? 'OK' : 'MISMATCH'}`
    );
  }

  const totalUnits =
    QUOTA_UNITS['videos.list'] * (1 + pollCount) + QUOTA_UNITS['videos.update'];
  console.log(`Run total: ${totalUnits} quota units (channel: ${channel}, video: ${videoId})`);

  if (allMatch) {
    console.log(`WRITE VERIFIED${pollCount > 1 ? ` (after ${pollCount} read-back poll(s))` : ''}`);
  } else {
    console.log(
      `WRITE MISMATCH — still inconsistent after ${pollCount} read-back poll(s) over ` +
        `${(READBACK_POLL_INTERVAL_MS * (READBACK_POLL_MAX - 1)) / 1000}s`
    );
    process.exitCode = 1;
  }
}

if (require.main === module) {
  run().catch((err) => {
    console.error(`Unexpected error: ${err && err.message ? err.message : err}`);
    process.exitCode = 1;
  });
}

module.exports = { run };
