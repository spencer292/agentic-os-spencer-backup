import https from 'node:https'

const tests = [
  '/blog/types-of-moles-in-washington/',
  '/what-do-moles-eat/',
  '/voles-vs-moles-whats-the-difference/',
  '/do-moles-hibernate/',
  '/how-many-eyes-do-moles-have/',
]

function probe(path) {
  return new Promise((res) => {
    const req = https.request({ host: '76.76.21.21', port: 443, path, method: 'GET', servername: 'got-moles.com', headers: { Host: 'got-moles.com' }, rejectUnauthorized: false }, (r) => {
      let b = ''; r.on('data', (c) => (b += c)); r.on('end', () => {
        const updated = b.match(/Updated\s+(\w+\s+\d{4})/)
        const old = b.match(/(?:>Spencer Hill<[\s\S]{0,200}<time[^>]*>)([^<]+)/)
        res({ status: r.statusCode, location: r.headers.location || null, updated: updated ? updated[1] : null, old: old ? old[1] : null })
      })
    })
    req.on('error', (e) => res({ error: e.message }))
    req.setTimeout(15000, () => { req.destroy(); res({ error: 'timeout' }) })
    req.end()
  })
}

async function follow(p) {
  let cur = p
  for (let i = 0; i < 3; i++) {
    const r = await probe(cur)
    if (r.error) return r
    if ([301, 302, 307, 308].includes(r.status) && r.location) {
      cur = r.location.startsWith('http') ? new URL(r.location).pathname : r.location
      continue
    }
    return r
  }
}

console.log('Probing direct to Vercel (bypasses CF)\n')
for (const p of tests) {
  const r = await follow(p)
  const verdict = r.updated ? '✅ NEW' : (r.old ? '🟡 OLD' : '❓')
  console.log(`${verdict}  ${p.padEnd(50)}  byline: ${r.updated || r.old || r.error || 'no byline detected'}`)
}
