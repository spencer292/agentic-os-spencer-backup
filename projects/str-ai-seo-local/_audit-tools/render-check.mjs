// Raw render check — fetches a URL with a chosen User-Agent and reports
// schema + indexing signals. Used by str-ai-seo-local audits.
// Usage: node render-check.mjs <url> [user-agent]

const url = process.argv[2]
const ua = process.argv[3] || 'Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)'

if (!url) {
  console.error('Usage: node render-check.mjs <url> [user-agent]')
  process.exit(1)
}

try {
  const res = await fetch(url, { headers: { 'User-Agent': ua } })
  const html = await res.text()

  console.log(`URL:    ${url}`)
  console.log(`Status: ${res.status}`)
  console.log(`UA:     ${ua}`)
  console.log(`Bytes:  ${html.length}`)
  console.log()

  // JSON-LD schema blocks
  const ldRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  const ldBlocks = [...html.matchAll(ldRegex)]
  console.log(`JSON-LD blocks: ${ldBlocks.length}`)
  for (const [, body] of ldBlocks) {
    try {
      const json = JSON.parse(body.trim())
      const types = []
      const collect = (node) => {
        if (!node) return
        if (Array.isArray(node)) return node.forEach(collect)
        if (typeof node === 'object') {
          if (node['@type']) types.push(Array.isArray(node['@type']) ? node['@type'].join('/') : node['@type'])
          if (node['@graph']) collect(node['@graph'])
        }
      }
      collect(json)
      console.log(`  - @type: ${types.join(', ')}`)
    } catch {
      console.log(`  - (parse error)`)
    }
  }
  console.log()

  // Key signals
  const checks = [
    ['sameAs', /sameAs/],
    ['aggregateRating', /aggregateRating/],
    ['LocalBusiness', /"@type":\s*"LocalBusiness"/],
    ['Organization', /"@type":\s*"Organization"/],
    ['BreadcrumbList', /"@type":\s*"BreadcrumbList"/],
    ['Article', /"@type":\s*"Article"/],
    ['FAQPage', /"@type":\s*"FAQPage"/],
    ['Service', /"@type":\s*"Service"/],
    ['Person (Spencer)', /"@type":\s*"Person"/],
    ['WebSite @id', /"@id":\s*"[^"]*\/#website"/],
    ['BBB sameAs', /bbb\.org/],
    ['Wikidata sameAs', /wikidata\.org/],
    ['noindex meta', /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i],
    ['canonical', /<link[^>]+rel=["']canonical["']/i],
    ['speakable', /"@type":\s*"SpeakableSpecification"/],
    ['QuizCTA link', /score\.got-moles\.com/],
    ['Find my risk score', /Find my risk score/i],
    ['CallRail swap.js loaded', /cdn\.callrail\.com[^"']*\/swap\.js/],
    ['GTM container loaded', /googletagmanager\.com\/gtm\.js/],
    ['Tel link present', /href=["']tel:/],
  ]
  for (const [name, rx] of checks) {
    console.log(`  ${rx.test(html) ? '[Y]' : '[N]'}  ${name}`)
  }
} catch (err) {
  console.error('FETCH FAILED:', err.message)
  process.exit(2)
}
