#!/usr/bin/env node
// rr-upload-conversions.mjs — match Gumroad sales to Google Ads click ids and
// upload them as click conversions ("Gumroad Purchase (uploaded)" action).
//
// How the ids get there: the site stores gclid/gbraid/wbraid in localStorage for
// 90 days and appends them to Gumroad checkout links at click time (build.mjs
// TRACK_SNIPPET). Gumroad passes checkout-URL query params through to the sale
// record; this script scans each sale for them, uploads any it finds, and keeps
// a local ledger so nothing is double-uploaded (Google also dedups server-side).
//
// Diagnostic mode: --dump prints the field names of the most recent sale (values
// redacted) so we can confirm where Gumroad exposes url params once a real
// param-carrying sale exists.
//
// Usage: node projects/briefs/zero-touch-business/scripts/rr-upload-conversions.mjs [--dump] [--days 30]
import fs from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '..', '..', '..', '..')
const env = {}
for (const line of fs.readFileSync(resolve(repoRoot, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
  if (!m) continue
  let v = m[2].trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  env[m[1]] = v
}

const CID = env.ROUTE_READY_ADS_CUSTOMER_ID
const CONVERSION_ACTION = `customers/${CID}/conversionActions/7694371664`
const LEDGER = resolve(here, '..', 'runs', 'data', 'uploaded-conversions.json')
const DUMP = process.argv.includes('--dump')
const daysArg = process.argv.indexOf('--days')
const DAYS = daysArg > -1 ? Number(process.argv[daysArg + 1]) : 30

if (!env.GUMROAD_ACCESS_TOKEN) { console.error('FAIL: GUMROAD_ACCESS_TOKEN missing'); process.exit(1) }

// --- pull Gumroad sales ---
const after = new Date(Date.now() - DAYS * 864e5).toISOString().slice(0, 10)
let sales = []
let page = `https://api.gumroad.com/v2/sales?after=${after}&access_token=${env.GUMROAD_ACCESS_TOKEN}`
while (page) {
  const data = await (await fetch(page)).json()
  if (!data.success) { console.error('FAIL: Gumroad sales pull:', data.message || JSON.stringify(data).slice(0, 200)); process.exit(1) }
  sales.push(...(data.sales || []))
  page = data.next_page_url ? `https://api.gumroad.com${data.next_page_url}&access_token=${env.GUMROAD_ACCESS_TOKEN}` : null
}
console.log(`Gumroad sales since ${after}: ${sales.length}`)

if (DUMP) {
  if (!sales.length) { console.log('No sales to dump.'); process.exit(0) }
  const s = sales[0]
  const shape = (o, d = 0) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k,
    v && typeof v === 'object' && d < 1 ? shape(v, d + 1) : (typeof v)]))
  console.log('Most recent sale field shape (values redacted):')
  console.log(JSON.stringify(shape(s), null, 2))
  process.exit(0)
}

// --- find click ids anywhere plausible on the sale record ---
const KEYS = ['gclid', 'gbraid', 'wbraid']
function findClickIds(sale) {
  const found = {}
  const scan = (obj) => {
    if (!obj || typeof obj !== 'object') return
    for (const [k, v] of Object.entries(obj)) {
      const lk = k.toLowerCase()
      if (KEYS.includes(lk) && typeof v === 'string' && v.length > 8) found[lk] = v
      else if (typeof v === 'object') scan(v)
      else if (typeof v === 'string' && v.includes('gclid=')) {
        try { const u = new URLSearchParams(v.split('?')[1] || v); KEYS.forEach(key => { const val = u.get(key); if (val) found[key] = val }) } catch {}
      }
    }
  }
  scan(sale)
  return found
}

const ledger = fs.existsSync(LEDGER) ? JSON.parse(fs.readFileSync(LEDGER, 'utf8')) : { uploaded: {} }
const candidates = []
let noId = 0
for (const s of sales) {
  if (ledger.uploaded[s.id]) continue
  const ids = findClickIds(s)
  if (!ids.gclid && !ids.gbraid && !ids.wbraid) { noId++; continue }
  const dt = new Date(s.created_at)
  candidates.push({
    saleId: s.id,
    conversion: {
      conversionAction: CONVERSION_ACTION,
      conversionDateTime: dt.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '+00:00'),
      conversionValue: (Number(s.price) || 4900) / 100,
      currencyCode: 'USD',
      ...(ids.gclid ? { gclid: ids.gclid } : ids.gbraid ? { gbraid: ids.gbraid } : { wbraid: ids.wbraid }),
    },
  })
}
console.log(`New sales with click ids: ${candidates.length} (without: ${noId}, already uploaded: ${Object.keys(ledger.uploaded).length})`)
// NOTE: no process.exit() on success paths — abrupt exit after fetch trips a
// libuv assert on Windows (exit 127) and would read as failure to the cron.
if (!candidates.length) {
  console.log('Nothing to upload.')
} else {
  await upload()
}

async function upload() {
// --- upload to Google Ads ---
const { access_token } = await (await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ client_id: env.ROUTE_READY_ADS_CLIENT_ID, client_secret: env.ROUTE_READY_ADS_CLIENT_SECRET, refresh_token: env.ROUTE_READY_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' }),
})).json()
const res = await fetch(`https://googleads.googleapis.com/v23/customers/${CID}:uploadClickConversions`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${access_token}`,
    'developer-token': env.ROUTE_READY_ADS_DEVELOPER_TOKEN,
    'login-customer-id': env.ROUTE_READY_ADS_LOGIN_CUSTOMER_ID,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ conversions: candidates.map(c => c.conversion), partialFailure: true }),
})
const data = await res.json()
if (!res.ok) { console.error('FAIL upload:', JSON.stringify(data, null, 2)); process.exit(1) }

const failures = data.partialFailureError ? (data.partialFailureError.details || []).flatMap(d => d.errors || []) : []
let ok = 0
candidates.forEach((c, i) => {
  const failed = failures.some(f => f.location?.fieldPathElements?.some(p => p.fieldName === 'conversions' && Number(p.index) === i))
  if (!failed) { ledger.uploaded[c.saleId] = { at: new Date().toISOString(), value: c.conversion.conversionValue }; ok++ }
})
fs.mkdirSync(dirname(LEDGER), { recursive: true })
fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 2))
console.log(`Uploaded ${ok}/${candidates.length} conversions.`)
if (failures.length) console.log('Partial failures:', JSON.stringify(failures.map(f => f.message)))
}
