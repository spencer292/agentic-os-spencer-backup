import fs from 'node:fs'
import path from 'node:path'

const ROOT = 'C:/Claude/agent-os/clients/got-moles'
const mcp = JSON.parse(fs.readFileSync(path.join(ROOT, '.mcp.json'), 'utf8'))
const token = mcp.mcpServers['notion-local']?.env?.NOTION_API_TOKEN
if (!token) { console.error('No token in .mcp.json'); process.exit(1) }

const MD_PATH = path.join(ROOT, 'projects/str-ai-seo/2026-04-20_full-seo-geo-report.md')
const md = fs.readFileSync(MD_PATH, 'utf8')

const TITLE = 'Got Moles — Full SEO + GEO Report (2026-04-20)'
const PARENT_PAGE_ID = '32d3d42c4a9c8194a491f1de76439ecd'

const header = [
  `**Date:** 2026-04-20`,
  `**Staging:** https://project-pf8c6.vercel.app`,
  `**Production (pending DNS switch):** https://got-moles.com`,
  `**Overall score:** ~87/100 (from 78 baseline)`,
  `**Traditional SEO:** ~90/100 (from 84 baseline)`,
  `**GEO / AI Search:** ~85/100 (from 71 baseline)`,
  ``,
  `**Status:** Code-side launch-ready. Remaining items require live production environment (DNS switch pending Ian).`,
  ``,
  `---`,
  ``,
].join('\n')

const body = header + md

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
