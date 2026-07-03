// Bypass Cloudflare cache: connect directly to Vercel IP with Host header
import https from 'node:https'

const VERCEL_IP = '76.76.21.21'
const HOST = 'got-moles.com'

function probeOnce(path) {
  return new Promise((resolve) => {
    const req = https.request({ host: VERCEL_IP, port: 443, path, method: 'GET', servername: HOST, headers: { Host: HOST, 'User-Agent': 'GotMolesProbe/1.0' }, rejectUnauthorized: false }, (res) => {
      let body = ''
      res.on('data', (c) => (body += c))
      res.on('end', () => {
        const canonMatch = body.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
        resolve({ status: res.statusCode, location: res.headers.location, canonical: canonMatch ? canonMatch[1] : null })
      })
    })
    req.on('error', (e) => resolve({ error: e.message }))
    req.setTimeout(10000, () => { req.destroy(); resolve({ error: 'timeout' }) })
    req.end()
  })
}

async function probe(path) {
  const initial = await probeOnce(path)
  // Detect trailing-slash auto-redirect (308 to same path without slash) — follow it
  if (initial.status === 308 && initial.location && !initial.location.includes('://')) {
    const followed = await probeOnce(initial.location)
    return { ...followed, initialStatus: initial.status, finalPath: initial.location }
  }
  return initial
}

const tests = [
  { path: '/what-do-moles-eat/', expect: 200 },
  { path: '/voles-vs-moles-whats-the-difference/', expect: 200 },
  { path: '/do-moles-hibernate/', expect: 200 },
  { path: '/how-to-get-rid-of-moles-in-your-yard/', expect: 200 },
  { path: '/what-species-of-moles-live-in-washington-state/', expect: 200 },
  { path: '/blog/what-do-moles-eat/', expect: 301 },
  { path: '/blog/mole-vs-vole-vs-gopher/', expect: 301 },
  { path: '/blog/when-are-moles-most-active-washington/', expect: 301 },
  { path: '/blog/how-to-get-rid-of-moles/', expect: 301 },
  { path: '/blog/types-of-moles-in-washington/', expect: 200 },
]

console.log(`Probing Vercel directly @ ${VERCEL_IP} (Host: ${HOST}) — bypasses CF cache\n`)
console.log('PATH'.padEnd(56) + 'STAT  CANONICAL/LOC')
console.log('─'.repeat(110))

let pass = 0, fail = 0
for (const t of tests) {
  const r = await probe(t.path)
  if (r.error) { console.log(`❌ ${t.path.padEnd(54)} ERR: ${r.error}`); fail++; continue }
  const ok = r.status === t.expect
  if (ok) pass++; else fail++
  const display = (r.canonical || r.location || '—').replace('https://got-moles.com', '').slice(0, 50)
  console.log(`${ok ? '✅' : '❌'} ${t.path.padEnd(54)} ${String(r.status).padEnd(6)}${display}`)
}
console.log('─'.repeat(110))
console.log(`${pass} pass / ${fail} fail`)
