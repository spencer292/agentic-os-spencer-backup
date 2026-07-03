// Fetch /about/ live HTML and extract every JSON-LD block.
const html = await fetch('https://got-moles.com/about/').then(r => r.text())
const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])
console.log(`Found ${blocks.length} JSON-LD blocks\n`)
blocks.forEach((s, i) => {
  try {
    const data = JSON.parse(s)
    const t = Array.isArray(data['@graph']) ? `@graph[${data['@graph'].length}]` : (data['@type'] || '?')
    console.log(`=== Block ${i+1}: @type=${t} ===`)
    console.log(JSON.stringify(data, null, 2))
    console.log()
  } catch (e) {
    console.log(`Block ${i+1} parse error: ${e.message}`)
    console.log(s.slice(0, 400))
  }
})
