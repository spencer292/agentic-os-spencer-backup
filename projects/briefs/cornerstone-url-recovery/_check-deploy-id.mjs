import https from 'node:https'
function probe(host, path) {
  return new Promise((resolve) => {
    const req = https.request({ host, port: 443, path, method: 'GET', headers: { Host: host, 'User-Agent': 'GotMolesProbe/1.0', 'Cache-Control': 'no-cache' }, rejectUnauthorized: false }, (res) => {
      let body = ''
      res.on('data', (c) => (body += c))
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: body.slice(0, 100) }))
    })
    req.on('error', (e) => resolve({ error: e.message }))
    req.setTimeout(10000, () => { req.destroy(); resolve({ error: 'timeout' }) })
    req.end()
  })
}

for (const path of ['/', '/blog/mole-vs-vole-vs-gopher/', '/blog/types-of-moles-in-washington/', '/blog/what-do-moles-eat/']) {
  const r = await probe('got-moles.com', path)
  console.log(`\n${path}`)
  console.log('  Status:', r.status)
  console.log('  Server:', r.headers?.server)
  console.log('  X-Vercel-Id:', r.headers?.['x-vercel-id'])
  console.log('  X-Vercel-Cache:', r.headers?.['x-vercel-cache'])
  console.log('  X-Matched-Path:', r.headers?.['x-matched-path'])
  console.log('  Location:', r.headers?.location)
  console.log('  Age:', r.headers?.age)
}
