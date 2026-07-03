import https from 'node:https'
import http from 'node:http'

function probe(url, label) {
  return new Promise((resolve) => {
    const u = new URL(url)
    const lib = u.protocol === 'https:' ? https : http
    const req = lib.get({ hostname: u.hostname, port: u.port || (u.protocol === 'https:' ? 443 : 80), path: u.pathname + u.search, headers: { 'User-Agent': 'GotMolesProbe/1.0', 'Cache-Control': 'no-cache' }, rejectUnauthorized: false }, (res) => {
      let body = ''
      res.on('data', (c) => (body += c))
      res.on('end', () => resolve({ label, status: res.statusCode, headers: res.headers, body: body.slice(0, 300) }))
    })
    req.on('error', (e) => resolve({ label, error: e.message, code: e.code }))
    req.setTimeout(10000, () => { req.destroy(); resolve({ label, error: 'timeout' }) })
  })
}

const targets = [
  ['https://got-moles.com/', 'apex https'],
  ['https://www.got-moles.com/', 'www https'],
  ['http://got-moles.com/', 'apex http'],
]

for (const [url, label] of targets) {
  const r = await probe(url, label)
  console.log('═'.repeat(60))
  console.log(`${label}: ${url}`)
  if (r.error) { console.log('  ERROR:', r.error, r.code || ''); continue }
  console.log('  Status:', r.status)
  console.log('  Server:', r.headers.server || '—')
  console.log('  X-Vercel-Id:', r.headers['x-vercel-id'] || '—')
  console.log('  X-Vercel-Cache:', r.headers['x-vercel-cache'] || '—')
  console.log('  Location (if redirect):', r.headers.location || '—')
  console.log('  Body[0..120]:', r.body.replace(/\s+/g, ' ').slice(0, 120))
}
