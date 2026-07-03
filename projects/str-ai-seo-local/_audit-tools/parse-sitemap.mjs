// Pull sitemap.xml and split URLs by pattern.
const res = await fetch('https://got-moles.com/sitemap.xml')
const xml = await res.text()
const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])

const blog = locs.filter(u => u.includes('/blog/'))
const lp = locs.filter(u => u.includes('/lp/'))
const test = locs.filter(u => u.includes('/test/'))
const cities = locs.filter(u => /\/mole-control-/.test(u))
const services = locs.filter(u => /\/services\//.test(u))
const corePages = locs.filter(u =>
  /got-moles\.com\/?$|\/about\/?$|\/contact\/?$|\/faq\/?$|\/how-it-works\/?$|\/reviews\/?$|\/service-areas\/?$|\/privacy\/?$|\/terms\/?$|\/blog\/?$/.test(u)
)
const corePagesSet = new Set(corePages)
const accountedFor = new Set([...blog, ...lp, ...test, ...cities, ...services, ...corePages])
const legacyRoot = locs.filter(u => !accountedFor.has(u))

console.log(`Total URLs: ${locs.length}`)
console.log(`/blog/* posts: ${blog.length}`)
console.log(`Legacy-root posts (slug at /): ${legacyRoot.length}`)
console.log(`Cities (/mole-control-*): ${cities.length}`)
console.log(`Services (/services/*): ${services.length}`)
console.log(`Core pages: ${corePages.length}`)
console.log(`/lp/*: ${lp.length}`)
console.log(`/test/*: ${test.length}`)
console.log()
console.log('=== /blog/* posts in sitemap ===')
blog.sort().forEach(u => console.log('  ' + u))
console.log()
console.log('=== Legacy-root posts in sitemap ===')
legacyRoot.sort().forEach(u => console.log('  ' + u))
console.log()
console.log('=== Looking for canonical conflicts ===')
// If a slug appears at BOTH /blog/<slug> AND /<slug> in sitemap → canonical conflict
const blogSlugs = new Set(blog.map(u => u.replace(/.*\/blog\//, '').replace(/\/$/, '')))
const legacySlugs = new Set(legacyRoot.map(u => {
  const m = u.match(/got-moles\.com\/([^/]+)\/?$/)
  return m ? m[1] : null
}).filter(Boolean))
const both = [...blogSlugs].filter(s => legacySlugs.has(s))
if (both.length === 0) {
  console.log('  no slug appears at both /blog/{slug} AND /{slug} — clean')
} else {
  console.log('  CONFLICTS:')
  both.forEach(s => console.log('    ' + s))
}
