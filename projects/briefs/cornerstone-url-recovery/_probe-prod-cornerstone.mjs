// Phase 5 verification: probe production to confirm cornerstone URL recovery is live.
import https from 'node:https'

async function resolveAndProbe(host, path, expectStatus, expectCanonical) {
  return new Promise((resolve) => {
    const req = https.request({ host, port: 443, path, method: 'GET', headers: { Host: host, 'User-Agent': 'GotMolesProbe/1.0' }, rejectUnauthorized: false }, (res) => {
      let body = ''
      res.on('data', (c) => (body += c))
      res.on('end', () => {
        const canonMatch = body.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
        const ogImg = body.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
        const heroImg = body.match(/src=["'](\/images\/blog-[^"']+)["']/i)
        resolve({
          status: res.statusCode,
          location: res.headers.location || null,
          canonical: canonMatch ? canonMatch[1] : null,
          ogImage: ogImg ? ogImg[1] : null,
          heroImg: heroImg ? heroImg[1] : null,
        })
      })
    })
    req.on('error', (e) => resolve({ error: e.message }))
    req.setTimeout(10000, () => { req.destroy(); resolve({ error: 'timeout' }) })
    req.end()
  })
}

const tests = [
  // 4 restored legacy-root URLs — expect 200 + self-canonical + image
  { path: '/what-do-moles-eat/', expect: { status: 200, canonical: 'https://got-moles.com/what-do-moles-eat/' } },
  { path: '/voles-vs-moles-whats-the-difference/', expect: { status: 200, canonical: 'https://got-moles.com/voles-vs-moles-whats-the-difference/' } },
  { path: '/do-moles-hibernate/', expect: { status: 200, canonical: 'https://got-moles.com/do-moles-hibernate/' } },
  { path: '/how-to-get-rid-of-moles-in-your-yard/', expect: { status: 200, canonical: 'https://got-moles.com/how-to-get-rid-of-moles-in-your-yard/' } },
  // m6 — existing legacy-root post resurrected by removing redirect
  { path: '/what-species-of-moles-live-in-washington-state/', expect: { status: 200, canonical: 'https://got-moles.com/what-species-of-moles-live-in-washington-state/' } },
  // 4 /blog/* old slugs — expect 301 → legacy-root
  { path: '/blog/what-do-moles-eat/', expect: { status: 301, location: '/what-do-moles-eat/' } },
  { path: '/blog/mole-vs-vole-vs-gopher/', expect: { status: 301, location: '/voles-vs-moles-whats-the-difference/' } },
  { path: '/blog/when-are-moles-most-active-washington/', expect: { status: 301, location: '/do-moles-hibernate/' } },
  { path: '/blog/how-to-get-rid-of-moles/', expect: { status: 301, location: '/how-to-get-rid-of-moles-in-your-yard/' } },
  // /blog/types-of-moles-in-washington/ → expected to STILL work (cornerstone unchanged)
  { path: '/blog/types-of-moles-in-washington/', expect: { status: 200, canonical: 'https://got-moles.com/blog/types-of-moles-in-washington/' } },
]

console.log('Probing got-moles.com production after cornerstone-url-recovery deploy\n')
console.log('PATH'.padEnd(56) + 'STAT  CANONICAL/LOC  IMG')
console.log('─'.repeat(120))

let pass = 0
let fail = 0
for (const t of tests) {
  const r = await resolveAndProbe('got-moles.com', t.path, t.expect.status, t.expect.canonical)
  if (r.error) { console.log(`${t.path.padEnd(56)} ERROR: ${r.error}`); fail++; continue }

  const statusOk = r.status === t.expect.status
  const checkVal = t.expect.canonical || t.expect.location
  const actualVal = t.expect.canonical ? r.canonical : r.location
  const valOk = actualVal && (actualVal.includes(checkVal) || actualVal === checkVal)
  const imgOk = t.expect.status === 200 ? !!(r.heroImg || r.ogImage) : true

  const verdict = (statusOk && valOk && imgOk) ? '✅' : '❌'
  if (statusOk && valOk && imgOk) pass++; else fail++

  const display = (actualVal || '—').replace('https://got-moles.com', '').slice(0, 50)
  const imgDisplay = t.expect.status === 200 ? (r.heroImg ? '✅ hero' : (r.ogImage ? '✅ og' : '❌ none')) : '—'
  console.log(`${verdict} ${t.path.padEnd(54)} ${String(r.status).padEnd(6)}${display.padEnd(30)} ${imgDisplay}`)
}

console.log('─'.repeat(120))
console.log(`${pass} pass / ${fail} fail`)
process.exit(fail === 0 ? 0 : 1)
