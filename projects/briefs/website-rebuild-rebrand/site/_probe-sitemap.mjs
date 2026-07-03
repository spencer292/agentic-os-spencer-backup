import https from 'node:https'

function probe(ip, host, path = '/sitemap.xml') {
  return new Promise((resolve) => {
    const req = https.request({ host: ip, port: 443, path, method: 'GET', servername: host, headers: { Host: host, 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }, rejectUnauthorized: false }, (res) => {
      let body = ''
      res.on('data', (c) => (body += c))
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }))
    })
    req.on('error', (e) => resolve({ error: e.message }))
    req.setTimeout(15000, () => { req.destroy(); resolve({ error: 'timeout' }) })
    req.end()
  })
}

const targets = [
  { ip: '76.76.21.21', label: 'Vercel direct (new site)' },
  { ip: '104.21.95.246', label: 'Cloudflare IP #1 (old cache)' },
  { ip: '172.67.149.193', label: 'Cloudflare IP #2 (old cache)' },
]

for (const t of targets) {
  console.log(`\n══ ${t.label} — ${t.ip} ══`)
  const r = await probe(t.ip, 'got-moles.com', '/sitemap.xml')
  if (r.error) { console.log('  ERROR:', r.error); continue }
  console.log('  Status:', r.status)
  console.log('  Server:', r.headers.server || '—')
  console.log('  Content-Type:', r.headers['content-type'] || '—')
  console.log('  Body length:', r.body.length, 'chars')
  console.log('  URL count:', (r.body.match(/<loc>/g) || []).length)
  console.log('  First 200 chars:', r.body.slice(0, 200).replace(/\s+/g, ' '))
}

// Also try the sitemap_index.xml WP path on CF
console.log('\n\n══ CF — /sitemap_index.xml (WP-style path) ══')
const r2 = await probe('104.21.95.246', 'got-moles.com', '/sitemap_index.xml')
if (r2.error) { console.log('  ERROR:', r2.error) } else {
  console.log('  Status:', r2.status)
  console.log('  Server:', r2.headers.server || '—')
  console.log('  Body length:', r2.body.length)
  console.log('  First 300 chars:', r2.body.slice(0, 300).replace(/\s+/g, ' '))
}

// Check robots.txt via both
console.log('\n\n══ Vercel direct — /robots.txt ══')
const r3 = await probe('76.76.21.21', 'got-moles.com', '/robots.txt')
if (r3.error) { console.log('  ERROR:', r3.error) } else {
  console.log('  Status:', r3.status)
  console.log('  Body:', r3.body.slice(0, 500))
}

console.log('\n══ CF — /robots.txt ══')
const r4 = await probe('104.21.95.246', 'got-moles.com', '/robots.txt')
if (r4.error) { console.log('  ERROR:', r4.error) } else {
  console.log('  Status:', r4.status)
  console.log('  Body:', r4.body.slice(0, 500))
}
