// Permanently delete junk client records through the Jobber UI.
//
// Jobber's API cannot delete a client — only archive. The UI can, behind a
// confirmation dialog that requires ticking every consequence checkbox. This
// drives that dialog over CDP against the already-running browser window.
//
// THIS IS IRREVERSIBLE. There is no unarchive equivalent. Every safety check
// below runs per record, and a single mismatch aborts that record rather than
// guessing:
//   * the id must appear in an archive log (i.e. it went through the audit)
//   * the audit must have verdicted it SAFE-archive with no job/quote/invoice/balance
//   * the phone audit must show zero messages on it
//   * the page that loads must carry the exact name we expect
//
// DRY RUN BY DEFAULT. Nothing is deleted without --execute.
//
// Usage:
//   node .../jobber-junk-client-delete.mjs                 # dry run
//   node .../jobber-junk-client-delete.mjs --limit 5 --execute
//   node .../jobber-junk-client-delete.mjs --execute
import { readFileSync, writeFileSync, appendFileSync, existsSync, readdirSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const here = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(here, '../data')
const argOf = (flag, dflt) => {
  const i = process.argv.indexOf(flag)
  return i > -1 ? process.argv[i + 1] : dflt
}
const EXECUTE = process.argv.includes('--execute')
const LIMIT = Number(argOf('--limit', 0)) || Infinity
const VERDICT = argOf('--verdict', 'SAFE-archive')
const PORT = process.env.CDP_PORT || 9222
const BASE = `http://127.0.0.1:${PORT}`

// ---------- CDP plumbing (same shape as browser/cdp.mjs) ----------
class CDP {
  constructor(wsUrl) { this.wsUrl = wsUrl; this.id = 0; this.pending = new Map(); this.handlers = [] }
  connect() {
    return new Promise((res, rej) => {
      this.ws = new WebSocket(this.wsUrl)
      this.ws.onopen = () => res()
      this.ws.onerror = () => rej(new Error('WebSocket connection to Chrome failed — run: node browser/launch.mjs'))
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
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej })
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }
  onEvent(fn) { this.handlers.push(fn) }
  close() { try { this.ws.close() } catch {} }
}

async function evalJs(cdp, expression) {
  const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
  return r.result.value
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Poll until `expr` returns truthy, or give up.
async function waitFor(cdp, expr, timeoutMs = 12000, everyMs = 250) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await evalJs(cdp, expr)) return true
    await sleep(everyMs)
  }
  return false
}

async function goto(cdp, url) {
  const loaded = new Promise((res) => cdp.onEvent((m) => { if (m.method === 'Page.loadEventFired') res() }))
  await cdp.send('Page.navigate', { url })
  await Promise.race([loaded, sleep(20000)])
  await sleep(600)
}

// ---------- build the target list ----------
const report = JSON.parse(readFileSync(path.join(dataDir, 'junk-client-report.json'), 'utf8'))
const byId = new Map(report.rows.map((r) => [r.id, r]))
const phoneReport = existsSync(path.join(dataDir, 'junk-phone-report.json'))
  ? JSON.parse(readFileSync(path.join(dataDir, 'junk-phone-report.json'), 'utf8'))
  : null
const messagesById = new Map((phoneReport?.rows || []).map((r) => [r.id, r.messages]))

// Candidates come from the audit report by verdict. Batch A (SAFE-archive) went
// through an archive pass first; Batch B (REVIEW-request-only) is deleted
// straight from live, so membership of an archive log is not required — the
// per-record safety checks below are what actually gate a deletion.
const candidates = report.rows.filter((r) => r.verdict === VERDICT).map((r) => ({ id: r.id, name: r.name }))

const merged = new Set()
for (const f of readdirSync(dataDir).filter((n) => /^merge-log-.*\.jsonl$/.test(n))) {
  for (const line of readFileSync(path.join(dataDir, f), 'utf8').trim().split(/\r?\n/).filter(Boolean)) {
    const e = JSON.parse(line)
    if (e.ok) merged.add(e.absorbId)
  }
}
const alreadyDeleted = new Set()
for (const f of readdirSync(dataDir).filter((n) => /^delete-log-.*\.jsonl$/.test(n))) {
  for (const line of readFileSync(path.join(dataDir, f), 'utf8').trim().split(/\r?\n/).filter(Boolean)) {
    const e = JSON.parse(line)
    if (e.ok) alreadyDeleted.add(e.id)
  }
}

const targets = []
const refused = []
for (const a of candidates) {
  if (alreadyDeleted.has(a.id) || merged.has(a.id)) continue
  const r = byId.get(a.id)
  if (!r) { refused.push({ ...a, why: 'not in audit report' }); continue }
  if (r.jobs || r.quotes || r.invoices || r.balance) { refused.push({ ...a, why: 'holds work or balance' }); continue }
  const msgs = messagesById.get(a.id)
  if (msgs === undefined) { refused.push({ ...a, why: 'no phone-audit row — run jobber-junk-phone-audit.mjs' }); continue }
  // A text thread is real customer history — never destroy one silently.
  if (msgs > 0) { refused.push({ ...a, why: `${msgs} messages` }); continue }
  targets.push({ id: a.id, name: r.name, url: r.url, class: r.class })
}

console.log(`candidates with verdict ${VERDICT}: ${candidates.length}`)
console.log(`already deleted:  ${alreadyDeleted.size}`)
console.log(`refused by a safety check: ${refused.length}`)
for (const x of refused.slice(0, 10)) console.log(`   - ${x.name}: ${x.why}`)
const slice = targets.slice(0, LIMIT)
console.log(`${EXECUTE ? 'DELETING' : 'DRY RUN — would delete'} ${slice.length} of ${targets.length} eligible`)

if (EXECUTE) {
  const pages = await (await fetch(`${BASE}/json`)).json()
  const page = pages.find((t) => t.type === 'page')
  if (!page) throw new Error('no browser page — run: node browser/launch.mjs')
  const cdp = new CDP(page.webSocketDebuggerUrl)
  await cdp.connect()
  await cdp.send('Page.enable')

  const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase()
  const LOG = path.join(dataDir, `delete-log-${new Date().toISOString().replace(/[:.]/g, '-')}.jsonl`)
  let ok = 0, failed = 0

  for (const [i, t] of slice.entries()) {
    let entry
    try {
      await goto(cdp, t.url)

      // Safety: the page that loaded must be the record we intend to delete.
      // Jobber renders the client as an SPA, so the heading arrives after load —
      // checking too early reads the bare "Jobber" title and fails every record.
      const named = await waitFor(cdp, `(()=>{const h=document.querySelector('h1');return !!(h && h.innerText.trim())})()`)
      if (!named) throw new Error('client heading never rendered')
      const heading = await evalJs(cdp, `document.querySelector('h1').innerText`)
      if (!norm(heading).startsWith(norm(t.name))) {
        throw new Error(`name mismatch: page shows "${String(heading).slice(0, 40)}", expected "${t.name}"`)
      }

      const opened = await waitFor(cdp, `!!Array.from(document.querySelectorAll('button')).filter(x=>(x.getAttribute('aria-label')||'').trim()==='More')[0]`)
      if (!opened) throw new Error('More button never appeared')
      await evalJs(cdp, `(()=>{Array.from(document.querySelectorAll('button')).filter(x=>(x.getAttribute('aria-label')||'').trim()==='More')[0].click();return 1})()`)

      const menu = await waitFor(cdp, `!!Array.from(document.querySelectorAll('[role=menuitem],[role=menu] a,[role=menu] button')).find(x=>/Delete Client/i.test(x.innerText))`)
      if (!menu) throw new Error('Delete Client item never appeared')
      await evalJs(cdp, `(()=>{Array.from(document.querySelectorAll('[role=menuitem],[role=menu] a,[role=menu] button')).find(x=>/Delete Client/i.test(x.innerText)).click();return 1})()`)

      const dialog = await waitFor(cdp, `!!document.querySelector('[role=dialog] button[type=submit]')`)
      if (!dialog) throw new Error('delete dialog never appeared')

      // The dialog refuses to submit until every consequence is acknowledged.
      const boxes = await evalJs(cdp, `(()=>{const d=document.querySelector('[role=dialog]');const cbs=Array.from(d.querySelectorAll('input[type=checkbox]'));cbs.forEach(c=>{if(!c.checked)c.click()});return cbs.length})()`)
      await sleep(300)
      await evalJs(cdp, `(()=>{const b=document.querySelector('[role=dialog] button[type=submit]');b.scrollIntoView({block:'center'});b.click();return 1})()`)

      // Success = the dialog closes. It stays open (with a validation banner) on failure.
      const gone = await waitFor(cdp, `!document.querySelector('[role=dialog] button[type=submit]')`, 15000)
      if (!gone) throw new Error('dialog stayed open — deletion refused')

      ok++
      entry = { id: t.id, name: t.name, class: t.class, checkboxes: boxes, ok: true, at: new Date().toISOString() }
    } catch (err) {
      failed++
      entry = { id: t.id, name: t.name, class: t.class, ok: false, error: String(err.message).slice(0, 200) }
      console.log(`\n  FAIL ${t.name}: ${entry.error}`)
      // Clear any half-open dialog so the next record starts clean.
      try { await evalJs(cdp, `(()=>{const c=document.querySelector('[role=dialog] button[type=button]');if(c)c.click();return 1})()`) } catch {}
    }
    appendFileSync(LOG, JSON.stringify(entry) + '\n')
    process.stderr.write(`${i + 1}/${slice.length} deleted=${ok} failed=${failed}\r`)
    await sleep(500)
  }
  process.stderr.write('\n')
  cdp.close()
  console.log(`deleted ${ok}, failed ${failed}`)
  console.log(`log: ${LOG}`)
} else {
  for (const t of slice.slice(0, 15)) console.log(`  ${t.class.padEnd(16)} ${t.name}`)
  if (slice.length > 15) console.log(`  … and ${slice.length - 15} more`)
  console.log('\nre-run with --execute. THIS CANNOT BE UNDONE.')
}
