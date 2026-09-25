// Read what each Batch B stub's CallRail Request actually contains.
//
// The Jobber app has no Requests scope, so the API returns only a count. The
// logged-in browser can read the page, and the request carries the real
// content: call duration, tracking number, a recording link and CallRail's AI
// call summary. That summary is the difference between "dead lead" and "a
// customer nobody called back", so read before deciding what to delete.
//
// READ-ONLY. Writes data/batch-b-requests.json.
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const here = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(here, '../data')
const OUT = path.join(dataDir, 'batch-b-requests.json')
const PORT = process.env.CDP_PORT || 9222
const BASE = `http://127.0.0.1:${PORT}`
const argOf = (f, d) => { const i = process.argv.indexOf(f); return i > -1 ? process.argv[i + 1] : d }
const LIMIT = Number(argOf('--limit', 0)) || Infinity

class CDP {
  constructor(w) { this.wsUrl = w; this.id = 0; this.pending = new Map(); this.handlers = [] }
  connect() {
    return new Promise((res, rej) => {
      this.ws = new WebSocket(this.wsUrl)
      this.ws.onopen = () => res()
      this.ws.onerror = () => rej(new Error('WebSocket failed — run: node browser/launch.mjs'))
      this.ws.onmessage = (m) => {
        const msg = JSON.parse(m.data)
        if (msg.id && this.pending.has(msg.id)) {
          const { res: r, rej: j } = this.pending.get(msg.id)
          this.pending.delete(msg.id)
          if (msg.error) j(new Error(msg.error.message)); else r(msg.result)
        } else if (msg.method) this.handlers.forEach((h) => h(msg))
      }
    })
  }
  send(method, params = {}) {
    const id = ++this.id
    return new Promise((res, rej) => { this.pending.set(id, { res, rej }); this.ws.send(JSON.stringify({ id, method, params })) })
  }
  onEvent(fn) { this.handlers.push(fn) }
  close() { try { this.ws.close() } catch {} }
}
async function evalJs(cdp, e) {
  const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
  return r.result.value
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function waitFor(cdp, expr, ms = 12000) {
  const end = Date.now() + ms
  while (Date.now() < end) { if (await evalJs(cdp, expr)) return true; await sleep(300) }
  return false
}
async function goto(cdp, url) {
  const loaded = new Promise((res) => cdp.onEvent((m) => { if (m.method === 'Page.loadEventFired') res() }))
  await cdp.send('Page.navigate', { url })
  await Promise.race([loaded, sleep(20000)])
  await sleep(700)
}

const report = JSON.parse(readFileSync(path.join(dataDir, 'junk-client-report.json'), 'utf8'))
const gone = new Set()
for (const f of ['delete-log', 'merge-log']) {
  for (const n of require('fs').readdirSync(dataDir).filter((x) => x.startsWith(f) && x.endsWith('.jsonl'))) {
    for (const line of readFileSync(path.join(dataDir, n), 'utf8').trim().split(/\r?\n/).filter(Boolean)) {
      const e = JSON.parse(line)
      if (e.ok) gone.add(e.id || e.absorbId)
    }
  }
}
const batchB = report.rows.filter((r) => !gone.has(r.id) && r.verdict === 'REVIEW-request-only')

const cache = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {}
const todo = batchB.filter((r) => !cache[r.id]).slice(0, LIMIT)
console.log(`batch B: ${batchB.length}; cached: ${Object.keys(cache).length}; to read: ${todo.length}`)

const pages = await (await fetch(`${BASE}/json`)).json()
const page = pages.find((t) => t.type === 'page')
if (!page) throw new Error('no browser page — run: node browser/launch.mjs')
const cdp = new CDP(page.webSocketDebuggerUrl)
await cdp.connect()
await cdp.send('Page.enable')

const field = (text, label, stop) => {
  const i = text.indexOf(label)
  if (i < 0) return null
  const rest = text.slice(i + label.length)
  const end = stop ? rest.search(stop) : -1
  return (end > -1 ? rest.slice(0, end) : rest).replace(/\s+/g, ' ').trim().slice(0, 700)
}

for (const [i, r] of todo.entries()) {
  try {
    await goto(cdp, r.url)
    await waitFor(cdp, `!!document.querySelector('h1')`)
    const link = await evalJs(cdp, `(()=>{const a=Array.from(document.querySelectorAll('a')).find(x=>/\\/requests\\/\\d+/.test(x.href||'')); return a? a.href : null})()`)
    if (!link) { cache[r.id] = { ...r, error: 'no request link on the client page' }; continue }
    await goto(cdp, link)
    await waitFor(cdp, `/Request Source|Call Details|Overview/.test(document.body.innerText)`)
    const text = await evalJs(cdp, `document.body.innerText`)
    cache[r.id] = {
      id: r.id, name: r.name, phone: r.phone, city: r.city, createdAt: r.createdAt, url: r.url, requestUrl: link,
      title: field(text, 'Schedule Assessment', /\n/) || null,
      duration: (text.match(/Inbound Phone Call\s*-\s*([\dhms ]+)/) || [])[1] || null,
      trackingName: field(text, 'Tracking Number Name:', /Tracking Number:/),
      trackingNumber: field(text, 'Tracking Number:', /\n\n|On-site/),
      summary: field(text, 'Call Summary:', /Start T|Call Recording|\n\n\n/),
      recording: (text.match(/https:\/\/app\.callrail\.com\/calls\/[^\s|]+/) || [])[0] || null,
      status: /\bNew\b/.test(text) ? 'New' : null,
    }
  } catch (err) {
    cache[r.id] = { id: r.id, name: r.name, error: String(err.message).slice(0, 150) }
  }
  writeFileSync(OUT, JSON.stringify(cache, null, 2))
  process.stderr.write(`${i + 1}/${todo.length}\r`)
}
process.stderr.write('\n')
cdp.close()
const vals = Object.values(cache)
console.log(`read ${vals.length}; with a summary: ${vals.filter((v) => v.summary).length}; errors: ${vals.filter((v) => v.error).length}`)
console.log(`out: ${OUT}`)
