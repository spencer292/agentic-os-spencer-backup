// One-shot verification: every URL on the site, check for canonical / og:url / twitter:card
import https from 'node:https'

const BASE = 'https://project-pf8c6.vercel.app'

const URLS = [
  // 13 indexed singletons (the Ian-flagged set)
  '/',
  '/about/',
  '/contact/',
  '/faq/',
  '/how-it-works/',
  '/reviews/',
  '/reviews/commercial-case-studies/',
  '/service-areas/',
  '/services/total-mole-control-program/',
  '/services/one-time-mole-removal/',
  '/services/commercial-mole-control/',
  '/privacy/',
  '/terms/',
  // Already-covered (sanity check still fine)
  '/blog/',
  '/blog/what-do-moles-eat/',
  '/mole-control-seattle/',
  '/how-many-eyes-do-moles-have/',
  // LP (noindex but should now have canonical)
  '/lp/commercial/',
  '/lp/mole-removal/',
  '/lp/mole-protection-plan/',
  '/lp/mole-trapper/',
]

function fetchOnce(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'GotMolesVerify/1.0' } }, (res) => {
      let body = ''
      res.on('data', (d) => (body += d))
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }))
    }).on('error', (e) => resolve({ status: 0, error: e.message, body: '', headers: {} }))
  })
}

async function fetch(path) {
  let url = BASE + path
  for (let i = 0; i < 5; i++) {
    const r = await fetchOnce(url)
    if (r.status >= 300 && r.status < 400 && r.headers.location) {
      url = r.headers.location.startsWith('http') ? r.headers.location : BASE + r.headers.location
      continue
    }
    return r
  }
  return { status: 0, body: '', error: 'redirect loop' }
}

function check(html, label, regex) {
  const m = html.match(regex)
  return m ? '✅' : '❌'
}

const results = []
for (const url of URLS) {
  const r = await fetch(url)
  const h = r.body
  results.push({
    url,
    status: r.status,
    canonical: check(h, 'canonical', /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i),
    canonicalUrl: (h.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) || [])[1] || '—',
    ogUrl: check(h, 'og:url', /<meta[^>]+property=["']og:url["']/i),
    twitter: check(h, 'twitter', /<meta[^>]+name=["']twitter:card["']/i),
    robots: (h.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i) || [])[1] || '—',
  })
}

console.log('URL'.padEnd(46) + 'STAT  CANON OG  TWT  ROBOTS')
console.log('─'.repeat(95))
for (const r of results) {
  console.log(
    r.url.padEnd(46) +
      String(r.status).padEnd(6) +
      r.canonical.padEnd(6) +
      r.ogUrl.padEnd(4) +
      r.twitter.padEnd(5) +
      (r.robots || '—').slice(0, 18)
  )
}

const missing = results.filter((r) => r.canonical === '❌')
console.log('\n' + (missing.length === 0 ? '✅ ALL PAGES HAVE CANONICAL' : `❌ ${missing.length} pages MISSING canonical: ${missing.map((m) => m.url).join(', ')}`))
