#!/usr/bin/env node
// For every invoice in the month whose quote/job/invoice chain names nobody, walk
// the CLIENT's whole history in Jobber and see if a seller is recorded anywhere.
// This is what makes "5% for the life of the customer" payable: a recurring TMCP
// invoice raised years after the sale carries no salesperson of its own.
//
// Usage: node resolve-legacy-attribution.mjs [YYYY-MM]

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../..');
const API = path.join(ROOT, '.claude/skills/tool-jobber/scripts/jobber-api.mjs');
const DATA = path.resolve(HERE, '../data');

const MONTH = process.argv[2] || fs.readdirSync(DATA).filter(f => f.endsWith('_raw.json')).sort().pop().slice(0, 7);
const raw = JSON.parse(fs.readFileSync(path.join(DATA, `${MONTH}_raw.json`), 'utf8'));
const rows = JSON.parse(fs.readFileSync(path.join(DATA, `${MONTH}_rows.json`), 'utf8')).rows;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function gql(query, attempt = 0) {
  let out;
  try {
    out = execFileSync('node', [API, 'query', query], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  if (/THROTTLED|Throttled/.test(out)) {
    if (attempt >= 8) throw new Error('Throttled repeatedly — retry later.');
    const wait = 5000 * (attempt + 1);
    process.stderr.write(`\n  throttled, waiting ${wait / 1000}s...`);
    await sleep(wait);
    return gql(query, attempt + 1);
  }
  let parsed;
  try { parsed = JSON.parse(out); } catch { throw new Error('Non-JSON: ' + out.slice(0, 400)); }
  if (parsed.errors) throw new Error(JSON.stringify(parsed.errors).slice(0, 600));
  return parsed;
}

// Invoices with nobody anywhere in the chain -> the clients we need to look back on.
const needy = rows.filter(r => !r.resolved);
const clientOf = new Map(); // invoiceNumber -> {id, name}
for (const inv of raw.invoices.nodes) {
  if (needy.some(n => n.invoiceNumber === inv.invoiceNumber) && inv.client) {
    clientOf.set(inv.invoiceNumber, { id: inv.client.id, name: inv.client.name });
  }
}
const clients = [...new Map([...clientOf.values()].map(c => [c.id, c])).values()];
process.stderr.write(`${needy.length} unattributed invoices across ${clients.length} clients\n`);

const BATCH = 8;
const history = {}; // clientId -> {name, quotes:[], jobs:[]}
for (let i = 0; i < clients.length; i += BATCH) {
  const slice = clients.slice(i, i + BATCH);
  const q = '{\n' + slice.map((c, n) => `  c${n}: client(id: "${c.id}") {
    id name
    quotes(first: 20) { nodes { quoteNumber createdAt salesperson { name { full } } } }
    jobs(first: 20) { nodes { jobNumber createdAt salesperson { name { full } } } }
  }`).join('\n') + '\n}';
  const data = await gql(q);
  for (const key of Object.keys(data)) {
    const c = data[key];
    if (!c) continue;
    history[c.id] = {
      name: c.name,
      quotes: (c.quotes?.nodes || []).map(x => ({ n: x.quoteNumber, at: x.createdAt, seller: x.salesperson?.name?.full?.trim() || null })),
      jobs: (c.jobs?.nodes || []).map(x => ({ n: x.jobNumber, at: x.createdAt, seller: x.salesperson?.name?.full?.trim() || null })),
    };
  }
  process.stderr.write(`\r  clients ${Math.min(i + BATCH, clients.length)}/${clients.length}   `);
  await sleep(1000);
}
process.stderr.write('\n');

// Resolve: earliest record on the client that names anybody wins — that is the
// person who brought the customer in, which is what "life of the customer" pays.
const resolution = {};
for (const [invoiceNumber, c] of clientOf) {
  const h = history[c.id];
  if (!h) { resolution[invoiceNumber] = { seller: null, basis: 'CLIENT_LOOKUP_FAILED', client: c.name }; continue; }
  const all = [
    ...h.quotes.filter(x => x.seller).map(x => ({ ...x, kind: 'quote' })),
    ...h.jobs.filter(x => x.seller).map(x => ({ ...x, kind: 'job' })),
  ].sort((a, b) => String(a.at).localeCompare(String(b.at)));
  if (!all.length) {
    resolution[invoiceNumber] = {
      seller: null, basis: 'NO_SELLER_IN_CLIENT_HISTORY', client: c.name,
      evidence: `${h.quotes.length} quotes, ${h.jobs.length} jobs, none carry a salesperson`,
    };
  } else {
    const sellers = [...new Set(all.map(x => x.seller))];
    resolution[invoiceNumber] = {
      seller: all[0].seller,
      basis: sellers.length > 1 ? 'CLIENT_HISTORY_AMBIGUOUS' : 'CLIENT_HISTORY',
      client: c.name,
      evidence: `earliest seller on record: ${all[0].kind} ${all[0].n} (${String(all[0].at).slice(0, 10)}) = ${all[0].seller}` +
        (sellers.length > 1 ? ` | client also shows: ${sellers.slice(1).join(', ')}` : ''),
    };
  }
}

const out = path.join(DATA, `${MONTH}_client-resolution.json`);
fs.writeFileSync(out, JSON.stringify({ month: MONTH, resolvedAt: new Date().toISOString(), resolution, history }, null, 2));

const recovered = Object.values(resolution).filter(r => r.seller);
const byBasis = {};
for (const r of Object.values(resolution)) (byBasis[r.basis] ??= []).push(r);
const amt = (invNo) => rows.find(r => r.invoiceNumber === invNo)?.total || 0;
console.log(`\nRecovered a seller for ${recovered.length} of ${needy.length} unattributed invoices.`);
for (const [b, list] of Object.entries(byBasis).sort((a, b2) => b2[1].length - a[1].length)) {
  const total = Object.entries(resolution).filter(([, r]) => r.basis === b).reduce((a, [k]) => a + amt(k), 0);
  console.log(`  ${b.padEnd(28)} ${String(list.length).padStart(4)} invoices  $${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
}
const tally = {};
for (const r of recovered) tally[r.seller] = (tally[r.seller] || 0) + 1;
console.log('\nRecovered credit goes to:');
for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(20)} ${v}`);
console.log(`\nSaved -> ${out}`);
