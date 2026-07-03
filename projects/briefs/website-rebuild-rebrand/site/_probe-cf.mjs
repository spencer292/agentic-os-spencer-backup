import https from 'node:https'

// Known Cloudflare Anycast IPs that the OLD got-moles.com used to resolve to
const cfIps = ['104.21.95.246', '172.67.149.193']

function probe(ip, host) {
  return new Promise((resolve) => {
    const req = https.request({ host: ip, port: 443, path: '/', method: 'GET', servername: host, headers: { Host: host, 'User-Agent': 'GotMolesProbe/1.0' }, rejectUnauthorized: false }, (res) => {
      let body = ''
      res.on('data', (c) => (body += c))
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: body.slice(0, 300) }))
    })
    req.on('error', (e) => resolve({ error: e.message }))
    req.setTimeout(8000, () => { req.destroy(); resolve({ error: 'timeout' }) })
    req.end()
  })
}

for (const ip of cfIps) {
  console.log(`══ Probing CF Anycast IP ${ip} (Host: got-moles.com) ══`)
  const r = await probe(ip, 'got-moles.com')
  if (r.error) { console.log('  ERROR:', r.error); continue }
  console.log('  Status:', r.status)
  console.log('  Server:', r.headers.server || '—')
  console.log('  CF-Ray:', r.headers['cf-ray'] || '—')
  console.log('  Body[0..200]:', r.body.replace(/\s+/g, ' ').slice(0, 200))
  console.log('')
}
