import https from 'node:https'
const URL_TO_TEST = '/voles-vs-moles-whats-the-difference/'

function probe(ip, host, path) {
  return new Promise((resolve) => {
    const req = https.request({ host: ip, port: 443, path, method: 'GET', servername: host, headers: { Host: host, 'User-Agent': 'GotMolesProbe/1.0' }, rejectUnauthorized: false }, (res) => {
      let body = ''
      res.on('data', (c) => (body += c))
      res.on('end', () => resolve({ status: res.statusCode, location: res.headers.location, server: res.headers.server, body }))
    })
    req.on('error', (e) => resolve({ error: e.message }))
    req.setTimeout(15000, () => { req.destroy(); resolve({ error: 'timeout' }) })
    req.end()
  })
}

async function follow(ip, host, path) {
  let cur = path
  for (let i = 0; i < 5; i++) {
    const r = await probe(ip, host, cur)
    if (r.error) return r
    if ([301, 302, 307, 308].includes(r.status) && r.location) {
      cur = r.location.startsWith('http') ? new URL(r.location).pathname : r.location
      continue
    }
    return r
  }
}

console.log(`═══ Testing ${URL_TO_TEST} ═══\n`)

console.log('━━ Path A: Via PUBLIC DNS (what visitors see — may hit CF cache) ━━')
const a = await follow('got-moles.com', 'got-moles.com', URL_TO_TEST)
console.log('  Status:', a.status)
console.log('  Server:', a.server)
const titleA = a.body?.match(/<title>([^<]+)<\/title>/)?.[1]
console.log('  Title:', titleA?.slice(0, 80))
const h1A = a.body?.match(/<h1[^>]*>([^<]+)<\/h1>/)?.[1]
console.log('  H1:', h1A?.slice(0, 80))
const canonA = a.body?.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1]
console.log('  Canonical:', canonA)
const ogImgA = a.body?.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
console.log('  og:image:', ogImgA)
const heroA = a.body?.match(/src=["'](\/images\/blog-[^"']+)["']/i)?.[1]
console.log('  Hero img:', heroA)

console.log('\n━━ Path B: Via Vercel direct (bypasses CF cache) ━━')
const b = await follow('76.76.21.21', 'got-moles.com', URL_TO_TEST)
console.log('  Status:', b.status)
console.log('  Server:', b.server)
const titleB = b.body?.match(/<title>([^<]+)<\/title>/)?.[1]
console.log('  Title:', titleB?.slice(0, 80))
const h1B = b.body?.match(/<h1[^>]*>([^<]+)<\/h1>/)?.[1]
console.log('  H1:', h1B?.slice(0, 80))
const canonB = b.body?.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1]
console.log('  Canonical:', canonB)
const ogImgB = b.body?.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
console.log('  og:image:', ogImgB)
const heroB = b.body?.match(/src=["'](\/images\/blog-[^"']+)["']/i)?.[1]
console.log('  Hero img:', heroB)
