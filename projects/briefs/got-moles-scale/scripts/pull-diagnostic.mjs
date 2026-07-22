// pull-diagnostic.mjs — Phase 0 diagnostic data pulls for got-moles-scale.
// Read-only. Resumable: each phase appends JSONL to data/ and persists its
// cursor in data/state.json, so a dropped run continues where it left off.
// Usage: node projects/briefs/got-moles-scale/scripts/pull-diagnostic.mjs <invoices|clients|quotes|visits>
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(here, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });
const statePath = path.join(dataDir, 'state.json');
const state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : {};
const API = path.resolve(here, '..', '..', '..', '..', '.claude', 'skills', 'tool-jobber', 'scripts', 'jobber-api.mjs');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gms-diag-'));
function gqlJson(query, attempt = 0) {
  const f = path.join(tmp, 'q.graphql');
  fs.writeFileSync(f, query);
  let out;
  try {
    out = execSync(`node "${API}" query "${f}"`, { encoding: 'utf8', cwd: path.resolve(here, '..', '..', '..', '..') });
  } catch (e) {
    out = String(e.stdout || e.message);
  }
  const i = out.indexOf('{');
  if (i < 0 || /GraphQL errors|THROTTLED/i.test(out)) {
    if (attempt < 4) {
      const wait = /THROTTLED|rate/i.test(out) ? 60000 : 5000 * (attempt + 1);
      console.log(`  retry in ${wait / 1000}s (${out.slice(0, 120).replace(/\n/g, ' ')})`);
      execSync(process.platform === 'win32' ? `ping -n ${Math.ceil(wait / 1000)} 127.0.0.1 > nul` : `sleep ${wait / 1000}`);
      return gqlJson(query, attempt + 1);
    }
    throw new Error('query failed after retries: ' + out.slice(0, 400));
  }
  return JSON.parse(out.slice(i));
}

const sleep = (ms) => execSync(process.platform === 'win32' ? `ping -n ${Math.max(1, Math.ceil(ms / 1000))} 127.0.0.1 > nul` : `sleep ${ms / 1000}`);
const saveState = () => fs.writeFileSync(statePath, JSON.stringify(state, null, 2));

const SINCE_24MO = '2024-08-01T00:00:00Z';
const SINCE_12MO = '2025-07-01T00:00:00Z';
const VISITS_SINCE = new Date(Date.now() - 84 * 86400e3).toISOString();
const NOW = new Date().toISOString();

const PHASES = {
  invoices: {
    file: 'invoices.jsonl',
    query: (cursor) => `query {
      invoices(first: 50${cursor ? `, after: "${cursor}"` : ''},
        filter: { issuedDate: { after: "${SINCE_24MO}", before: "${NOW}" } }) {
        nodes {
          invoiceNumber issuedDate invoiceStatus
          amounts { total invoiceBalance paymentsTotal depositAmount }
          client { id }
          lineItems(first: 15) { nodes { name totalPrice quantity } }
        }
        pageInfo { endCursor hasNextPage }
      }
    }`,
    root: 'invoices',
  },
  clients: {
    file: 'clients.jsonl',
    query: (cursor) => `query {
      clients(first: 75${cursor ? `, after: "${cursor}"` : ''}) {
        nodes {
          id name createdAt isArchived isLead leadSource balance
          tags(first: 10) { nodes { label } }
        }
        pageInfo { endCursor hasNextPage }
      }
    }`,
    root: 'clients',
  },
  quotes: {
    file: 'quotes.jsonl',
    query: (cursor) => `query {
      quotes(first: 75${cursor ? `, after: "${cursor}"` : ''},
        filter: { createdAt: { after: "${SINCE_12MO}", before: "${NOW}" } }) {
        nodes { quoteNumber createdAt sentAt quoteStatus amounts { total } client { id } }
        pageInfo { endCursor hasNextPage }
      }
    }`,
    root: 'quotes',
  },
  visits: {
    file: 'visits.jsonl',
    query: (cursor) => `query {
      visits(first: 75${cursor ? `, after: "${cursor}"` : ''},
        filter: { startAt: { after: "${VISITS_SINCE}", before: "${NOW}" } }) {
        nodes {
          startAt duration isComplete allDay
          assignedUsers(first: 3) { nodes { name { full } } }
          job { id }
        }
        pageInfo { endCursor hasNextPage }
      }
    }`,
    root: 'visits',
  },
};

const phase = process.argv[2];
if (!PHASES[phase]) { console.error('usage: pull-diagnostic.mjs <invoices|clients|quotes|visits>'); process.exit(1); }

const P = PHASES[phase];
const outPath = path.join(dataDir, P.file);
const key = `${phase}_cursor`;
if (state[`${phase}_done`]) { console.log(`${phase}: already complete (${fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8').split('\n').filter(Boolean).length : 0} rows). Delete data/state.json flag to re-pull.`); process.exit(0); }

let cursor = state[key] || null;
let total = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8').split('\n').filter(Boolean).length : 0;
console.log(`${phase}: starting${cursor ? ' (resuming)' : ''}, ${total} rows already on disk`);

for (let page = 0; page < 400; page++) {
  const d = gqlJson(P.query(cursor));
  const conn = d[P.root];
  const lines = conn.nodes.map((n) => JSON.stringify(n)).join('\n');
  if (lines) fs.appendFileSync(outPath, lines + '\n');
  total += conn.nodes.length;
  cursor = conn.pageInfo.endCursor;
  state[key] = cursor;
  saveState();
  if (page % 10 === 0) console.log(`  page ${page}, ${total} rows`);
  if (!conn.pageInfo.hasNextPage) {
    state[`${phase}_done`] = true;
    saveState();
    console.log(`${phase}: COMPLETE — ${total} rows -> ${P.file}`);
    process.exit(0);
  }
  sleep(400);
}
console.log(`${phase}: page cap hit at ${total} rows — rerun to continue`);
