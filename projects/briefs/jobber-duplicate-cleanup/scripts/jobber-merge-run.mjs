// Drive Jobber's Merge Clients wizard for the graded pairs.
//
// Direction is the whole risk here, so it is enforced three ways:
//   1. the wizard is always STARTED from the keeper's own page, and Jobber
//      labels that record "This client will remain after the merge"
//   2. that label is re-read and matched against the expected keeper before
//      anything is selected
//   3. the review screen is checked for the keeper's name before confirming
// Any mismatch aborts that pair untouched.
//
// Only STRONG and LIKELY pairs run by default. CONFLICT and REVIEW pairs need a
// human — pass --confidence to override deliberately.
//
// IRREVERSIBLE: the absorbed client is deleted. Dry run by default.
//
// Usage:
//   node .../jobber-merge-run.mjs                       # dry run
//   node .../jobber-merge-run.mjs --limit 1 --execute
//   node .../jobber-merge-run.mjs --execute
import { readFileSync, appendFileSync, existsSync, readdirSync } from 'fs'
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
const ALLOWED = argOf('--confidence', 'STRONG,LIKELY').split(',').map((s) => s.trim())
const PORT = process.env.CDP_PORT || 9222
const BASE = `http://127.0.0.1:${PORT}`

class CDP {
  constructor(wsUrl) { this.wsUrl = wsUrl; this.id = 0; this.pending = new Map(); this.handlers = [] }
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

async function evalJs(cdp, expression) {
  const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
  return r.result.value
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function waitFor(cdp, expr, timeoutMs = 15000, everyMs = 300) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) { if (await evalJs(cdp, expr)) return true; await sleep(everyMs) }
  return false
}
async function goto(cdp, url) {
  const loaded = new Promise((res) => cdp.onEvent((m) => { if (m.method === 'Page.loadEventFired') res() }))
  await cdp.send('Page.navigate', { url })
  await Promise.race([loaded, sleep(20000)])
  await sleep(800)
}
const jsStr = (s) => JSON.stringify(String(s))

const PAIRS_FILE = argOf('--pairs', 'merge-pairs.json')
const pairs = JSON.parse(readFileSync(path.join(dataDir, PAIRS_FILE), 'utf8')).rows
const done = new Set()
for (const f of readdirSync(dataDir).filter((n) => /^merge-log-.*\.jsonl$/.test(n))) {
  for (const line of readFileSync(path.join(dataDir, f), 'utf8').trim().split(/\r?\n/).filter(Boolean)) {
    const e = JSON.parse(line)
    if (e.ok) done.add(e.absorbId)
  }
}

const eligible = pairs.filter((p) => ALLOWED.includes(p.confidence) && !done.has(p.absorb.id) && !p.keeperIsJunk)
  // The absorbed record must be empty: Jobber warns that moving jobs disables
  // automatic payments, and that saved payment methods do not travel.
  .filter((p) => !p.absorb.jobs && !p.absorb.quotes && !p.absorb.invoices && !p.absorb.balance)
  .filter((p) => !p.absorbHasWork)
const held = pairs.filter((p) => !ALLOWED.includes(p.confidence) || p.keeperIsJunk)
const slice = eligible.slice(0, LIMIT)

console.log(`pairs on file: ${pairs.length}   already merged: ${done.size}`)
console.log(`held for a human (${held.length}): ${held.map((p) => `${p.absorb.name}->${p.keep.name} [${p.confidence}]`).join(', ')}`)
console.log(`${EXECUTE ? 'MERGING' : 'DRY RUN — would merge'} ${slice.length} of ${eligible.length} eligible`)

if (!EXECUTE) {
  for (const p of slice) console.log(`  absorb "${p.absorb.name}" INTO "${p.keep.name}"  (${p.confidence}: ${p.why})`)
  console.log('\nre-run with --execute. THE ABSORBED CLIENT IS DELETED — THIS CANNOT BE UNDONE.')
} else {
  const pages = await (await fetch(`${BASE}/json`)).json()
  const page = pages.find((t) => t.type === 'page')
  if (!page) throw new Error('no browser page — run: node browser/launch.mjs')
  const cdp = new CDP(page.webSocketDebuggerUrl)
  await cdp.connect()
  await cdp.send('Page.enable')

  const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase()
  const LOG = path.join(dataDir, `merge-log-${new Date().toISOString().replace(/[:.]/g, '-')}.jsonl`)
  let ok = 0, failed = 0

  for (const [i, p] of slice.entries()) {
    let entry
    try {
      // 1. Start from the keeper. This is what fixes the merge direction.
      await goto(cdp, p.keep.url)
      if (!await waitFor(cdp, `(()=>{const h=document.querySelector('h1');return !!(h&&h.innerText.trim())})()`)) throw new Error('keeper page never rendered')
      const h1 = await evalJs(cdp, `document.querySelector('h1').innerText`)
      if (norm(h1) !== norm(p.keep.name)) throw new Error(`keeper mismatch: page shows "${h1}", expected "${p.keep.name}"`)

      await evalJs(cdp, `(()=>{Array.from(document.querySelectorAll('button')).filter(x=>(x.getAttribute('aria-label')||'').trim()==='More')[0].click();return 1})()`)
      if (!await waitFor(cdp, `!!Array.from(document.querySelectorAll('[role=menuitem],[role=menu] a,[role=menu] button')).find(x=>/Merge Client/i.test(x.innerText))`)) throw new Error('Merge Client item never appeared')
      await evalJs(cdp, `(()=>{Array.from(document.querySelectorAll('[role=menuitem],[role=menu] a,[role=menu] button')).find(x=>/Merge Client/i.test(x.innerText)).click();return 1})()`)

      // 2. Jobber names the surviving record on screen — confirm it is ours.
      // The label paints before the client card does, so wait for the name too
      // rather than reading an empty panel and aborting a valid pair.
      const panelReady = await waitFor(cdp, `(()=>{const t=document.body.innerText;const i=t.indexOf('This client will remain after the merge');if(i<0)return false;return t.slice(i,i+200).replace(/\\s+/g,' ').toLowerCase().includes(${jsStr(norm(p.keep.name))})})()`)
      if (!panelReady) {
        const remains = await evalJs(cdp, `(()=>{const t=document.body.innerText;const i=t.indexOf('This client will remain after the merge');return i<0?'(wizard never opened)':t.slice(i,i+200)})()`)
        throw new Error(`"will remain" panel does not name the keeper: ${String(remains).replace(/\s+/g, ' ').slice(0, 90)}`)
      }

      // 3. Find the record to absorb. Search by phone, falling back to email
      // then name — email-only duplicates carry no phone.
      const term = p.number || (p.absorb.emails || [])[0] || p.absorb.name
      const input = await evalJs(cdp, `(()=>{const e=Array.from(document.querySelectorAll('input')).filter(x=>x.offsetParent)[0]; return e? e.id : null})()`)
      if (!input) throw new Error('client search box not found')
      await evalJs(cdp, `(()=>{const e=document.getElementById(${jsStr(input)});e.focus();const set=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;set.call(e,${jsStr(term)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return 1})()`)
      await sleep(3000)

      // Pick the record to absorb. Most of these duplicates carry the SAME name
      // on both sides, so name alone cannot separate them — the keeper is
      // identified by its street number, which the dropdown prints and the
      // duplicate usually lacks. Require exactly one survivor: if the two are
      // indistinguishable in the list, abort rather than guess which is which.
      const keeperHouseNo = ((p.keep.addresses || [])[0] || '').match(/^\s*(\d+)/)?.[1] || null
      const picked = await evalJs(cdp, `(()=>{
        const opts=Array.from(document.querySelectorAll('[role=option]')).filter(e=>e.innerText && e.innerText.trim());
        if(!opts.length) return {ok:false, why:'search returned nothing'};
        const want=${jsStr(norm(p.absorb.name))};
        const house=${keeperHouseNo ? jsStr(keeperHouseNo) : 'null'};
        let hits=opts.filter(e=>e.innerText.replace(/\\s+/g,' ').trim().toLowerCase().startsWith(want));
        if(!hits.length) return {ok:false, why:'no option matched the absorb name'};
        if(house && hits.length>1){
          const re=new RegExp('\\\\b'+house+'\\\\b');
          const without=hits.filter(e=>!re.test(e.innerText));
          if(without.length) hits=without;
        }
        // Identical twins from the CallRail double-write differ only by status:
        // the record holding the work reads "Active", its shadow reads "Lead".
        const leadTag=${JSON.stringify(p.absorb.isLead === true ? 'Lead' : p.absorb.isLead === false ? 'Active' : null)};
        if(leadTag && hits.length>1){
          const tagged=hits.filter(e=>new RegExp('\\\\b'+leadTag+'\\\\s*$').test(e.innerText.trim()));
          if(tagged.length===1) hits=tagged;
        }
        if(hits.length!==1) return {ok:false, why:'ambiguous: '+hits.length+' options match and none is distinguishable'};
        const el=hits[0];
        el.scrollIntoView({block:'center'}); el.click();
        return {ok:true, text:el.innerText.replace(/\\n+/g,' | ').slice(0,90)};
      })()`)
      if (!picked.ok) throw new Error(picked.why)

      await sleep(1200)
      if (!await waitFor(cdp, `(()=>{const b=Array.from(document.querySelectorAll('button')).find(x=>x.innerText.trim()==='Next');return !!(b&&!b.disabled)})()`)) throw new Error('Next never enabled')
      await evalJs(cdp, `(()=>{Array.from(document.querySelectorAll('button')).find(x=>x.innerText.trim()==='Next').click();return 1})()`)

      // 4. Review screen must still show the keeper.
      if (!await waitFor(cdp, `/Review before merging/.test(document.body.innerText)`)) throw new Error('review screen never appeared')
      const reviewName = await evalJs(cdp, `(()=>{const h=document.querySelector('h1, h2');return document.body.innerText.slice(0,400)})()`)
      if (!norm(reviewName).includes(norm(p.keep.name))) throw new Error('review screen does not name the keeper')

      await evalJs(cdp, `(()=>{Array.from(document.querySelectorAll('button')).find(x=>x.innerText.trim()==='Merge').click();return 1})()`)
      if (!await waitFor(cdp, `!!document.querySelector('[role=dialog]') && /can't be undone/i.test(document.body.innerText)`)) throw new Error('final confirm dialog never appeared')

      // 5. Jobber requires the word DELETE typed out.
      const cin = await evalJs(cdp, `(()=>{const e=Array.from(document.querySelectorAll('input')).filter(x=>x.offsetParent)[0];return e? e.id : null})()`)
      if (!cin) throw new Error('confirm input not found')
      await evalJs(cdp, `(()=>{const e=document.getElementById(${jsStr(cin)});e.focus();const set=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;set.call(e,'DELETE');e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return 1})()`)
      await sleep(800)
      await evalJs(cdp, `(()=>{const d=document.querySelector('[role=dialog]');const b=Array.from(d.querySelectorAll('button')).find(x=>x.innerText.trim()==='Merge');b.click();return 1})()`)

      // Success = we land back on the kept client's page.
      const landed = await waitFor(cdp, `location.href.indexOf('/clients/merge')===-1 && /\\/clients\\//.test(location.href)`, 25000)
      if (!landed) throw new Error('merge did not complete — still on the wizard')

      ok++
      entry = { keepId: p.keep.id, keepName: p.keep.name, absorbId: p.absorb.id, absorbName: p.absorb.name, number: p.number, confidence: p.confidence, picked: picked.text, ok: true, at: new Date().toISOString() }
    } catch (err) {
      failed++
      entry = { keepId: p.keep.id, keepName: p.keep.name, absorbId: p.absorb.id, absorbName: p.absorb.name, ok: false, error: String(err.message).slice(0, 220) }
      console.log(`\n  FAIL ${p.absorb.name} -> ${p.keep.name}: ${entry.error}`)
      try { await goto(cdp, 'https://secure.getjobber.com/clients') } catch {}
    }
    appendFileSync(LOG, JSON.stringify(entry) + '\n')
    process.stderr.write(`${i + 1}/${slice.length} merged=${ok} failed=${failed}\r`)
    await sleep(700)
  }
  process.stderr.write('\n')
  cdp.close()
  console.log(`merged ${ok}, failed ${failed}`)
  console.log(`log: ${LOG}`)
}
