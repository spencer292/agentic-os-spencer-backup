// Fetch homepage live HTML, extract JSON-LD + key meta + image attrs + link counts.
const cb = `?nocache=${Date.now()}`
const html = await fetch('https://got-moles.com/' + cb, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }).then(r => r.text())
const headersResp = await fetch('https://got-moles.com/' + cb, { method: 'HEAD', cache: 'no-store' })

console.log(`HTML length: ${html.length} chars\n`)

console.log('=== Response headers ===')
for (const [k, v] of headersResp.headers.entries()) {
  if (/last-modified|cache-control|x-vercel|content-type|date/i.test(k)) {
    console.log(`${k}: ${v}`)
  }
}
console.log()

// Title + meta
const title = html.match(/<title>([^<]*)<\/title>/)?.[1] || ''
const desc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/)?.[1] || ''
const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/)?.[1] || ''
const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/)?.[1] || ''
const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/)?.[1] || ''
const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/)?.[1] || ''
const twCard = html.match(/<meta[^>]+name=["']twitter:card["'][^>]+content=["']([^"']*)["']/)?.[1] || ''

console.log('=== Meta ===')
console.log(`title (${title.length} chars): ${title}`)
console.log(`description (${desc.length} chars): ${desc}`)
console.log(`canonical: ${canonical}`)
console.log(`og:title: ${ogTitle}`)
console.log(`og:description: ${ogDesc}`)
console.log(`og:image: ${ogImage}`)
console.log(`twitter:card: ${twCard}`)
console.log()

// Headings
const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map(m => m[1].replace(/<[^>]+>/g, '').trim())
const h2s = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map(m => m[1].replace(/<[^>]+>/g, '').trim())
const h3s = [...html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/g)].map(m => m[1].replace(/<[^>]+>/g, '').trim())
console.log(`=== Headings ===`)
console.log(`H1s (${h1s.length}):`)
h1s.forEach(t => console.log(`  - ${t}`))
console.log(`H2s (${h2s.length}):`)
h2s.forEach(t => console.log(`  - ${t}`))
console.log(`H3s (${h3s.length}):`)
h3s.forEach(t => console.log(`  - ${t}`))
console.log()

// Images
const imgs = [...html.matchAll(/<img[^>]+>/g)].map(m => m[0])
console.log(`=== Images (${imgs.length} total) ===`)
imgs.slice(0, 8).forEach((tag, i) => {
  const alt = tag.match(/alt=["']([^"']*)["']/)?.[1] || ''
  const src = tag.match(/src=["']([^"']*)["']/)?.[1] || ''
  const fetchPriority = tag.match(/fetchpriority=["']([^"']*)["']/)?.[1] || ''
  const loading = tag.match(/loading=["']([^"']*)["']/)?.[1] || ''
  console.log(`  ${i+1}. alt="${alt}" loading=${loading} fetchpriority=${fetchPriority}`)
  console.log(`      src=${src.slice(0, 100)}`)
})
console.log()

// Anchor + href pairs (with anchor text)
const anchorPairs = [...html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/g)].map(m => ({
  href: m[1],
  text: m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
}))
const internalPairs = anchorPairs.filter(p => p.href.startsWith('/') || p.href.includes('got-moles.com'))
const externalPairs = anchorPairs.filter(p => p.href.startsWith('http') && !p.href.includes('got-moles.com'))
const telPairs = anchorPairs.filter(p => p.href.startsWith('tel:'))
console.log(`=== Links ===`)
console.log(`internal: ${internalPairs.length}, external: ${externalPairs.length}, tel: ${telPairs.length}`)
const uniqueInternalHrefs = [...new Set(internalPairs.map(p => p.href))]
console.log(`unique internal hrefs: ${uniqueInternalHrefs.length}`)
console.log('\n--- Internal links with anchor text ---')
internalPairs.forEach(p => console.log(`  [${p.text || '(empty)'}] -> ${p.href}`))
console.log('\n--- External links with anchor text ---')
externalPairs.forEach(p => console.log(`  [${p.text || '(empty)'}] -> ${p.href}`))
console.log()

// Word count of visible body text
const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/)
const bodyHtml = bodyMatch ? bodyMatch[1] : html
const stripped = bodyHtml
  .replace(/<script[\s\S]*?<\/script>/g, ' ')
  .replace(/<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
  .replace(/<noscript[\s\S]*?<\/noscript>/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z#0-9]+;/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim()
const wordCount = stripped.split(/\s+/).filter(Boolean).length
console.log(`=== Word count (visible body) ===`)
console.log(`words: ${wordCount}`)
console.log(`first 200 words: ${stripped.split(/\s+/).slice(0, 200).join(' ')}`)
console.log()

// Anchor-city + cluster scan in first 200 words
const first200 = stripped.split(/\s+/).slice(0, 200).join(' ').toLowerCase()
const anchorCities = ['seattle','tacoma','bellevue','sammamish','puyallup','renton']
const counties = ['king','pierce','snohomish','thurston','kitsap','lewis']
console.log(`=== Anchor-city seeding (first 200 words) ===`)
anchorCities.forEach(c => console.log(`  ${c}: ${first200.includes(c) ? 'YES' : 'no'}`))
console.log(`=== County seeding (first 200 words) ===`)
counties.forEach(c => console.log(`  ${c} county: ${first200.includes(c) ? 'YES' : 'no'}`))
console.log()

// JSON-LD blocks
const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])
console.log(`=== JSON-LD: ${blocks.length} blocks ===`)
blocks.forEach((s, i) => {
  try {
    const data = JSON.parse(s)
    const t = Array.isArray(data['@graph']) ? `@graph[${data['@graph'].length}]` : (data['@type'] || '?')
    console.log(`Block ${i+1}: @type=${t}`)
    if (Array.isArray(data['@graph'])) {
      data['@graph'].forEach((n, j) => console.log(`  graph[${j}]: ${n['@type']} (id=${n['@id'] || '-'})`))
    } else {
      const keys = Object.keys(data).filter(k => !k.startsWith('@')).slice(0, 8)
      console.log(`  keys: ${keys.join(', ')}`)
      if (data.mainEntity) console.log(`  mainEntity: ${typeof data.mainEntity === 'object' ? JSON.stringify(data.mainEntity).slice(0, 120) : data.mainEntity}`)
      if (data.speakable) console.log(`  speakable: ${JSON.stringify(data.speakable).slice(0, 200)}`)
      if (data.sameAs) console.log(`  sameAs: ${Array.isArray(data.sameAs) ? data.sameAs.length + ' urls' : 'not array'}`)
      if (data.knowsAbout) console.log(`  knowsAbout: ${Array.isArray(data.knowsAbout) ? data.knowsAbout.length + ' items' : 'not array'}`)
      if (data.hasOfferCatalog) console.log(`  hasOfferCatalog: present`)
    }
  } catch (e) {
    console.log(`Block ${i+1} parse error: ${e.message}`)
  }
})
console.log('\n=== Full JSON-LD dump ===')
blocks.forEach((s, i) => {
  try {
    const data = JSON.parse(s)
    console.log(`\n--- Block ${i+1} ---`)
    console.log(JSON.stringify(data, null, 2).slice(0, 3000))
  } catch {}
})
