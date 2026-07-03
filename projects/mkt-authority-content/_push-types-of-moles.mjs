import fs from 'node:fs'
import path from 'node:path'

const ROOT = 'C:/Claude/agent-os/clients/got-moles'
const mcp = JSON.parse(fs.readFileSync(path.join(ROOT, '.mcp.json'), 'utf8'))
const token = mcp.mcpServers['notion-local']?.env?.NOTION_API_TOKEN
if (!token) { console.error('No token in .mcp.json'); process.exit(1) }

const MD_PATH = path.join(ROOT, 'projects/mkt-authority-content/2026-04-20_types-of-moles-in-washington.md')
const md = fs.readFileSync(MD_PATH, 'utf8')

const TITLE = "Blog: The 3 Mole Species in Washington State — A Homeowner's Identification Guide"
const PARENT_PAGE_ID = '32d3d42c4a9c8194a491f1de76439ecd'

const stripped = md.replace(/^---[\s\S]*?---\n+/, '')

const header = [
  `**Status:** Draft — ready for Spencer review`,
  `**Live on staging:** https://project-pf8c6.vercel.app/blog/types-of-moles-in-washington`,
  `**Primary keyword:** types of moles Washington state (L volume, GEO goldmine — Tier 1 cornerstone #4)`,
  `**Word count:** ~1,678`,
  `**Humanizer:** 8.6/10 self-scored (no material edits required)`,
  `**Date:** 2026-04-20`,
  `**GEO rationale:** zero competitor content on WA-specific species. Targets "types of moles in Washington", "Townsend's mole", "Pacific Coast mole", "shrew mole", "Eastern Washington moles" long-tail queries. Expected AI citation lift.`,
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
