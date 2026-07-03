import https from 'node:https'

// Resolve via Google DoH to bypass local CF cache
async function resolve(host) {
  const r = await fetch(`https://dns.google/resolve?name=${host}&type=A`)
  const j = await r.json()
  return (j.Answer || []).filter((a) => a.type === 1).map((a) => a.data)[0]
}

function probe(ip, host, path) {
  return new Promise((resolve) => {
    const req = https.request({ host: ip, port: 443, path, method: 'GET', servername: host, headers: { Host: host, 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' }, rejectUnauthorized: false }, (res) => {
      let body = ''
      res.on('data', (c) => (body += c))
      res.on('end', () => {
        // Extract canonical from HTML
        const canonMatch = body.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
        resolve({ status: res.statusCode, location: res.headers.location, canonical: canonMatch ? canonMatch[1] : null })
      })
    })
    req.on('error', (e) => resolve({ error: e.message }))
    req.setTimeout(10000, () => { req.destroy(); resolve({ error: 'timeout' }) })
    req.end()
  })
}

const ip = await resolve('got-moles.com')
console.log(`Probing via fresh-resolved IP: ${ip}\n`)

const URLS = [
  // Test BOTH old and new for the migrated cornerstones
  '/what-do-moles-eat/',
  '/blog/what-do-moles-eat/',
  '/voles-vs-moles-whats-the-difference/',
  '/blog/mole-vs-vole-vs-gopher/',
  '/do-moles-hibernate/',
  '/blog/when-are-moles-most-active-washington/',
  // Legacy-root preserved
  '/how-many-eyes-do-moles-have/',
  '/do-moles-bite/',
  '/do-moles-carry-diseases/',
  // City pages
  '/mole-control-redmond/',
  '/mole-control-renton/',
  '/mole-control-burien/',
  '/mole-control-puyallup/',
  '/mole-control-shoreline/',
  '/mole-control-bellevue/',
  '/mole-control-issaquah/',
  '/mole-control-maple-valley/',
  '/mole-control-sammamish/',
  '/mole-control-kent/',
  '/mole-control-south-hill/',
  '/mole-control-fife/',
  '/mole-control-woodinville/',
  '/mole-control-enumclaw/',
  '/mole-control-tacoma/',
  '/mole-control-tukwila/',
  '/mole-control-covington/',
  '/mole-control-kirkland/',
  '/mole-control-seatac/',
  '/mole-control-buckley/',
  '/mole-control-federal-way/',
  '/mole-control-des-moines/',
]

console.log('PATH'.padEnd(56) + 'STAT  → LOCATION / CANONICAL')
console.log('─'.repeat(110))
for (const path of URLS) {
  let cur = path
  let status = '?'
  let final = ''
  let canonical = null
  for (let hop = 0; hop < 5; hop++) {
    const r = await probe(ip, 'got-moles.com', cur)
    if (r.error) { status = 'ERR'; break }
    status = r.status
    if (r.status >= 300 && r.status < 400 && r.location) {
      const next = r.location.startsWith('http') ? new URL(r.location).pathname : r.location
      cur = next
      continue
    }
    canonical = r.canonical
    if (cur !== path) final = ` → ${cur}`
    break
  }
  console.log(path.padEnd(56) + String(status).padEnd(6) + (final + (canonical ? `   canonical=${canonical.replace('https://got-moles.com', '')}` : '')))
}
