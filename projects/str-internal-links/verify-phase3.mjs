#!/usr/bin/env node
/** Phase 3 live verification — cornerstone + added-city links on the 10 reservoirs. Polls until live or times out. */
const BASE = 'https://got-moles.com'
const CORNER = '/how-to-get-rid-of-moles-in-your-yard/'
const DEADLINE = Date.now() + 6 * 60 * 1000

// slug → extra priority-city links that must now be present (added this phase)
const POSTS = {
  'how-deep-do-moles-dig': [],
  'how-many-eyes-do-moles-have': ['/mole-control-seattle/', '/mole-control-bellevue/'],
  'what-do-mole-holes-look-like': ['/mole-control-bellevue/'],
  'do-moles-bite': [],
  'voles-vs-moles-whats-the-difference': [],
  'do-moles-carry-diseases': ['/mole-control-renton/'],
  'what-eats-moles': ['/mole-control-seattle/'],
  'is-a-mole-a-rodent': ['/mole-control-renton/', '/mole-control-kent/'],
  'do-moles-hibernate': [],
  'how-to-get-rid-of-ground-moles-with-vinegar': ['/mole-control-kent/', '/mole-control-federal-way/'],
}

async function fetchPost(slug) {
  for (const url of [`/${slug}/`, `/blog/${slug}/`]) {
    try {
      const res = await fetch(BASE + url, { redirect: 'follow', headers: { 'User-Agent': 'gm-verify3/1.0' }, cache: 'no-store' })
      if (res.status === 200) return { url, html: await res.text() }
    } catch { /* try next */ }
  }
  return null
}

async function run() {
  const pending = new Set(Object.keys(POSTS))
  while (pending.size && Date.now() < DEADLINE) {
    for (const slug of [...pending]) {
      const r = await fetchPost(slug)
      if (!r) continue
      const hasCorner = slug === 'how-to-get-rid-of-moles-in-your-yard' || r.html.includes(`href="${CORNER}"`)
      const missingCity = POSTS[slug].filter((c) => !r.html.includes(`href="${c}"`))
      if (hasCorner && missingCity.length === 0) {
        console.log(`✅ ${slug}  (cornerstone✓${POSTS[slug].length ? `, +cities: ${POSTS[slug].join(' ')}` : ''})`)
        pending.delete(slug)
      }
    }
    if (pending.size) await new Promise((r) => setTimeout(r, 15000))
  }
  if (pending.size) {
    console.log('\n⏳ Not fully verified yet — detail:')
    for (const slug of pending) {
      const r = await fetchPost(slug)
      if (!r) { console.log(`  ${slug}: no 200`); continue }
      const corner = r.html.includes(`href="${CORNER}"`)
      const missingCity = POSTS[slug].filter((c) => !r.html.includes(`href="${c}"`))
      console.log(`  ${slug} [${r.url}] cornerstone=${corner ? '✓' : '✗'} missingCities=${missingCity.join(',') || 'none'}`)
    }
    process.exit(1)
  }
  console.log('\nAll 10 reservoirs verified: cornerstone + added priority-city links live.')
}
run()
