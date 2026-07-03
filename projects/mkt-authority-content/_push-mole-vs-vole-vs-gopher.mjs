// Push "Mole vs Vole vs Gopher" blog to Notion via direct API.
// Per feedback_notion_direct_api.md — never MCP.
import fs from 'node:fs'
import path from 'node:path'

const ROOT = 'C:/Claude/agent-os/clients/got-moles'
const mcp = JSON.parse(fs.readFileSync(path.join(ROOT, '.mcp.json'), 'utf8'))
const token = mcp.mcpServers['notion-local']?.env?.NOTION_API_TOKEN
if (!token) { console.error('No token in .mcp.json'); process.exit(1) }

const MD_PATH = path.join(ROOT, 'projects/mkt-authority-content/2026-04-20_mole-vs-vole-vs-gopher.md')
const md = fs.readFileSync(MD_PATH, 'utf8')

const TITLE = "Blog: Mole vs Vole vs Gopher — How to Tell What's Destroying Your Lawn"
const PARENT_PAGE_ID = '32d3d42c4a9c8194a491f1de76439ecd'

const stripped = md.replace(/^---[\s\S]*?---\n+/, '')

const header = [
  `**Status:** Draft — ready for Spencer review`,
  `**Live on staging:** https://project-pf8c6.vercel.app/blog/mole-vs-vole-vs-gopher`,
  `**Primary keyword:** mole vs vole vs gopher (M volume, Tier 1 cornerstone #2)`,
  `**Word count:** ~1,802`,
  `**Humanizer:** 8.7/10 self-scored (surgical edits applied)`,
  `**Date:** 2026-04-20`,
  `**Sleeper insight:** true pocket gophers are rare in Western WA; Mazama pocket gopher is federally protected. If a homeowner thinks they have a gopher, it's almost always a mole.`,
  ``,
  `---`,
  ``,
].join('\n')

const body = header + stripped

const res = await fetch('https://api.notion.com/v1/pages', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Notion-Version': '2026-03-11',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    parent: { page_id: PARENT_PAGE_ID },
    properties: { title: { title: [{ text: { content: TITLE } }] } },
    markdown: body,
  }),
})

const json = await res.json()
console.log('Status:', res.status)
if (!res.ok) {
  console.error(JSON.stringify(json, null, 2))
  process.exit(1)
}
console.log('Page URL:', json.url)
console.log('Page ID:', json.id)
