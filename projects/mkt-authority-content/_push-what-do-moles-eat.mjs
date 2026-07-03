import fs from 'node:fs'
import path from 'node:path'

const ROOT = 'C:/Claude/agent-os/clients/got-moles'
const mcp = JSON.parse(fs.readFileSync(path.join(ROOT, '.mcp.json'), 'utf8'))
const token = mcp.mcpServers['notion-local']?.env?.NOTION_API_TOKEN
if (!token) { console.error('No token in .mcp.json'); process.exit(1) }

const MD_PATH = path.join(ROOT, 'projects/mkt-authority-content/2026-04-20_what-do-moles-eat.md')
const md = fs.readFileSync(MD_PATH, 'utf8')

const TITLE = 'Blog: What Do Moles Eat? (And Why It Matters for Your Yard)'
const PARENT_PAGE_ID = '32d3d42c4a9c8194a491f1de76439ecd'

const stripped = md.replace(/^---[\s\S]*?---\n+/, '')

const header = [
  `**Status:** Draft — ready for Spencer review`,
  `**Live on staging:** https://project-pf8c6.vercel.app/blog/what-do-moles-eat`,
  `**Primary keyword:** what do moles eat (H volume, Tier 1 cornerstone #3)`,
  `**Word count:** ~1,900`,
  `**Humanizer:** 8.6/10 self-scored (no material edits required)`,
  `**Date:** 2026-04-20`,
  `**Key angle:** Earthworms are 55-93% of diet. Moles don't eat plants. This breaks most DIY mole control (grub killers, castor oil, plant-protection sprays) because they target the wrong food source.`,
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
if (!res.ok) { console.error(JSON.stringify(json, null, 2)); process.exit(1) }
console.log('Page URL:', json.url)
console.log('Page ID:', json.id)
