#!/usr/bin/env node
// desk-server.mjs — the text desk lookup tool.
//
// Path A: inbound customer texts keep landing on Jobber's number (253-300-0889) because Jobber
// sends every reminder/On My Way from it and that sender cannot be changed. So we do not try to
// move the number — we fix OWNERSHIP. One named person watches the Jobber message center, drops
// the number or name in here, and instantly knows whose customer it is.
//
// Run:  node projects/briefs/jobber-text-routing/desk-server.mjs
// Then: http://localhost:8787
//
// Add --host 0.0.0.0 to let the office machine reach it over the LAN.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolve, handoffMessage, techContacts } from './lib-resolve.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.DESK_PORT || 8787);
const HOST = process.argv.includes('--host')
  ? process.argv[process.argv.indexOf('--host') + 1]
  : '127.0.0.1';

function json(res, code, body) {
  const payload = JSON.stringify(body);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
  });
  res.end(payload);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/' || url.pathname === '/index.html') {
    let html;
    try {
      html = fs.readFileSync(path.join(HERE, 'desk-ui.html'), 'utf8');
    } catch {
      res.writeHead(500).end('desk-ui.html missing');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  if (url.pathname === '/api/techs') {
    const c = techContacts();
    delete c._comment;
    json(res, 200, c);
    return;
  }

  if (url.pathname === '/api/lookup') {
    const q = (url.searchParams.get('q') || '').trim();
    if (!q) return json(res, 400, { error: 'Missing query' });
    try {
      const r = resolve(q);
      r.handoff = handoffMessage(r);
      json(res, 200, r);
    } catch (err) {
      // Surface the real Jobber error — a dead refresh token is the likely cause and the desk
      // needs to know it is a system problem, not a "customer not found".
      json(res, 502, { error: String(err.message || err).slice(0, 400) });
    }
    return;
  }

  res.writeHead(404).end('Not found');
});

server.listen(PORT, HOST, () => {
  console.log(`\n  Got Moles — text desk`);
  console.log(`  http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}\n`);
  if (HOST === '0.0.0.0') console.log(`  Reachable on the LAN at http://<this-machine-ip>:${PORT}\n`);
  console.log(`  Paste a phone number or client name to find the owning tech.`);
  console.log(`  Ctrl+C to stop.\n`);
});
