#!/usr/bin/env node
/** Phase 1+2 live verification — polls until the new markers appear or times out. */
const BASE = 'https://got-moles.com'
const DEADLINE = Date.now() + 6 * 60 * 1000 // 6 min

const checks = [
  {
    url: '/blog/best-mole-traps/',
    label: 'one-time blog callout + author link',
    needs: [
      ['one-time money lead', 'Got active moles right now?'],
      ['links one-time page', '/services/one-time-mole-removal/'],
      ['author byline link', 'href="/author/spencer/"'],
    ],
  },
  {
    url: '/how-deep-do-moles-dig/',
    label: 'TMCP-default callout (legacy-root) + author link',
    needs: [
      ['tmcp money lead', 'Want moles handled for good, not just for now?'],
      ['links tmcp page', '/services/total-mole-control-program/'],
      ['author byline link', 'href="/author/spencer/"'],
    ],
  },
  {
    url: '/mole-control-seattle/',
    label: 'city "Most Popular" emphasis',
    needs: [['most popular badge', 'Most Popular']],
  },
]

async function get(url) {
  const res = await fetch(BASE + url, { headers: { 'User-Agent': 'gm-verify/1.0' }, cache: 'no-store' })
  return { status: res.status, html: await res.text() }
}

async function run() {
  const pending = new Set(checks.map((c) => c.url))
  while (pending.size && Date.now() < DEADLINE) {
    for (const c of checks) {
      if (!pending.has(c.url)) continue
      try {
        const { status, html } = await get(c.url)
        const results = c.needs.map(([name, str]) => [name, html.includes(str)])
        if (status === 200 && results.every(([, ok]) => ok)) {
          console.log(`✅ ${c.url} — ${c.label}`)
          for (const [name] of results) console.log(`     ✓ ${name}`)
          pending.delete(c.url)
        }
      } catch { /* retry */ }
    }
    if (pending.size) await new Promise((r) => setTimeout(r, 15000))
  }
  if (pending.size) {
    console.log('\n⏳ Not yet live (re-checking detail):')
    for (const url of pending) {
      const c = checks.find((x) => x.url === url)
      try {
        const { status, html } = await get(url)
        console.log(`  ${url} status=${status}`)
        for (const [name, str] of c.needs) console.log(`     ${html.includes(str) ? '✓' : '✗'} ${name}`)
      } catch (e) { console.log(`  ${url} ERR ${e.message}`) }
    }
    process.exit(1)
  }
  console.log('\nAll Phase 1+2 markers verified live.')
}
run()
