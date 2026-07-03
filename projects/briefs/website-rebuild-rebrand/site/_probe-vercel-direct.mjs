import https from 'node:https'
import { lookup } from 'node:dns/promises'

// Manually fetch the A record via Google DoH to bypass local cache
async function freshLookup(host) {
  const r = await fetch(`https://dns.google/resolve?name=${host}&type=A`)
  const j = await r.json()
  return (j.Answer || []).filter((a) => a.type === 1).map((a) => a.data)
}

function probe(ip, host) {
  return new Promise((resolve) => {
    const req = https.request({ host: ip, port: 443, path: '/', method: 'GET', servername: host, headers: { Host: host, 'User-Agent': 'GotMolesProbe/1.0', 'Cache-Control': 'no-cache' }, rejectUnauthorized: false }, (res) => {
      let body = ''
      res.on('data', (c) => (body += c))
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: body.slice(0, 400) }))
    })
    req.on('error', (e) => resolve({ error: e.message }))
    req.setTimeout(10000, () => { req.destroy(); resolve({ error: 'timeout' }) })
    req.end()
  })
}

const ips = await freshLookup('got-moles.com')
console.log('Fresh A records via Google DoH:', ips)

for (const ip of ips) {
  console.log(`\n══ Probing ${ip} (Host: got-moles.com) ══`)
  const r = await probe(ip, 'got-moles.com')
  if (r.error) { console.log('  ERROR:', r.error); continue }
  console.log('  Status:', r.status)
  console.log('  Server:', r.headers.server || '—')
  console.log('  X-Vercel-Id:', r.headers['x-vercel-id'] || '—')
  console.log('  X-Vercel-Cache:', r.headers['x-vercel-cache'] || '—')
  console.log('  Location:', r.headers.location || '—')
  console.log('  Body[0..200]:', r.body.replace(/\s+/g, ' ').slice(0, 200))
}

// Also probe www directly
async function freshLookup2(host) {
  const r = await fetch(`https://dns.google/resolve?name=${host}&type=CNAME`)
  const j = await r.json()
  const cname = (j.Answer || []).find((a) => a.type === 5)
  if (!cname) return null
  const r2 = await fetch(`https://dns.google/resolve?name=${cname.data}&type=A`)
  const j2 = await r2.json()
  return (j2.Answer || []).filter((a) => a.type === 1).map((a) => a.data)
}

console.log('\n\nResolving www.got-moles.com → CNAME → A:')
const wwwIps = await freshLookup2('www.got-moles.com')
console.log('Resolved IPs:', wwwIps)
if (wwwIps && wwwIps.length) {
  for (const ip of wwwIps) {
    console.log(`\n══ Probing ${ip} (Host: www.got-moles.com) ══`)
    const r = await probe(ip, 'www.got-moles.com')
    if (r.error) { console.log('  ERROR:', r.error); continue }
    console.log('  Status:', r.status)
    console.log('  Server:', r.headers.server || '—')
    console.log('  X-Vercel-Id:', r.headers['x-vercel-id'] || '—')
    console.log('  Location:', r.headers.location || '—')
    console.log('  Body[0..200]:', r.body.replace(/\s+/g, ' ').slice(0, 200))
  }
}
