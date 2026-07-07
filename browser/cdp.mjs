// Zero-dependency Chrome DevTools Protocol driver + CLI.
// Talks to a Chrome started by launch.mjs (remote-debugging-port). Node 22+.
//
// CLI:
//   node browser/cdp.mjs goto <url>
//   node browser/cdp.mjs shot [outfile.png]      (default: browser/shots/<ts>.png)
//   node browser/cdp.mjs text [selector]         (visible text; default body)
//   node browser/cdp.mjs html [selector]         (outerHTML; default documentElement)
//   node browser/cdp.mjs eval "<js expression>"  (returns JSON value)
//   node browser/cdp.mjs click <css-selector>
//   node browser/cdp.mjs type <css-selector> <text>
//   node browser/cdp.mjs press <key>             (e.g. Enter, Tab)
//   node browser/cdp.mjs url                      (current page URL/title)
//   node browser/cdp.mjs pages                    (list open targets)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = process.env.CDP_PORT || 9222;
const BASE = `http://127.0.0.1:${PORT}`;
const __dir = path.dirname(fileURLToPath(import.meta.url));

async function listTargets() {
  const r = await fetch(`${BASE}/json`);
  return r.json();
}

async function getPageTarget() {
  const targets = await listTargets();
  let page = targets.find((t) => t.type === 'page');
  if (!page) {
    const r = await fetch(`${BASE}/json/new?about:blank`, { method: 'PUT' });
    page = await r.json();
  }
  return page;
}

class CDP {
  constructor(wsUrl) { this.wsUrl = wsUrl; this.id = 0; this.pending = new Map(); this.handlers = []; }
  connect() {
    return new Promise((res, rej) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => res();
      this.ws.onerror = () => rej(new Error('WebSocket connection to Chrome failed'));
      this.ws.onmessage = (m) => {
        const msg = JSON.parse(m.data);
        if (msg.id && this.pending.has(msg.id)) {
          const { res: r, rej: j } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) j(new Error(msg.error.message)); else r(msg.result);
        } else if (msg.method) {
          this.handlers.forEach((h) => h(msg));
        }
      };
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  onEvent(fn) { this.handlers.push(fn); }
  close() { try { this.ws.close(); } catch {} }
}

async function withPage(fn) {
  const page = await getPageTarget();
  const cdp = new CDP(page.webSocketDebuggerUrl);
  await cdp.connect();
  try { return await fn(cdp, page); } finally { cdp.close(); }
}

async function evalJs(cdp, expression) {
  const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) {
    throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  }
  return r.result.value;
}

async function goto(cdp, url) {
  await cdp.send('Page.enable');
  const loaded = new Promise((res) => cdp.onEvent((m) => { if (m.method === 'Page.loadEventFired') res(); }));
  await cdp.send('Page.navigate', { url });
  await Promise.race([loaded, new Promise((r) => setTimeout(r, 20000))]);
  await new Promise((r) => setTimeout(r, 400)); // settle
}

async function shot(cdp, out) {
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(data, 'base64'));
  return out;
}

const q = (s) => JSON.stringify(String(s)); // safe JS string literal

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  if (!cmd) { console.error('Usage: node browser/cdp.mjs <goto|shot|text|html|eval|click|type|press|url|pages> ...'); process.exit(1); }

  if (cmd === 'pages') {
    const t = await listTargets();
    console.log(t.filter((x) => x.type === 'page').map((x) => `- ${x.title} :: ${x.url}`).join('\n') || '(no pages)');
    return;
  }

  await withPage(async (cdp) => {
    switch (cmd) {
      case 'goto': {
        await goto(cdp, rest[0]);
        const info = await evalJs(cdp, '({url:location.href,title:document.title})');
        console.log(`Loaded: ${info.title}\n${info.url}`);
        break;
      }
      case 'shot': {
        const out = rest[0]
          ? path.resolve(rest[0])
          : path.join(__dir, 'shots', `shot-${Date.now()}.png`);
        console.log('Saved screenshot:', await shot(cdp, out));
        break;
      }
      case 'text': {
        const sel = rest[0] ? q(rest[0]) : q('body');
        const v = await evalJs(cdp, `(document.querySelector(${sel})||{}).innerText || ''`);
        console.log(v);
        break;
      }
      case 'html': {
        const sel = rest[0] ? q(rest[0]) : null;
        const v = await evalJs(cdp, sel
          ? `(document.querySelector(${sel})||{}).outerHTML || ''`
          : 'document.documentElement.outerHTML');
        console.log(v);
        break;
      }
      case 'eval': {
        const v = await evalJs(cdp, rest.join(' '));
        console.log(typeof v === 'string' ? v : JSON.stringify(v, null, 2));
        break;
      }
      case 'url': {
        const info = await evalJs(cdp, '({url:location.href,title:document.title})');
        console.log(`${info.title}\n${info.url}`);
        break;
      }
      case 'click': {
        const sel = q(rest[0]);
        const ok = await evalJs(cdp, `(()=>{const e=document.querySelector(${sel});if(!e)return false;e.scrollIntoView({block:'center'});e.click();return true;})()`);
        console.log(ok ? `Clicked ${rest[0]}` : `NOT FOUND: ${rest[0]}`);
        break;
      }
      case 'type': {
        const sel = q(rest[0]);
        const val = q(rest.slice(1).join(' '));
        const ok = await evalJs(cdp, `(()=>{const e=document.querySelector(${sel});if(!e)return false;e.focus();const set=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value')?.set||Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value')?.set;if(set)set.call(e,${val});else e.value=${val};e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return true;})()`);
        console.log(ok ? `Typed into ${rest[0]}` : `NOT FOUND: ${rest[0]}`);
        break;
      }
      case 'press': {
        const key = rest[0];
        const map = { Enter: { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' }, Tab: { key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 } };
        const k = map[key] || { key, code: key };
        await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', ...k });
        await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...k });
        console.log(`Pressed ${key}`);
        break;
      }
      default:
        console.error(`Unknown command: ${cmd}`);
        process.exit(1);
    }
  });
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
