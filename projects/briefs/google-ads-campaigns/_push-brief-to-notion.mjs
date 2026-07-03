import fs from 'node:fs'
import path from 'node:path'

const ROOT = 'C:/Claude/agent-os/clients/got-moles'
const mcp = JSON.parse(fs.readFileSync(path.join(ROOT, '.mcp.json'), 'utf8'))
const token = mcp.mcpServers['notion-local']?.env?.NOTION_API_TOKEN
if (!token) { console.error('No token in .mcp.json'); process.exit(1) }

const MD_PATH = path.join(ROOT, 'projects/briefs/google-ads-campaigns/brief.md')
const md = fs.readFileSync(MD_PATH, 'utf8')

const TITLE = 'Got Moles — Google Ads Campaigns Brief (2026-04-20)'
const PARENT_PAGE_ID = '32d3d42c4a9c8194a491f1de76439ecd'

const stripped = md.replace(/^---[\s\S]*?---\n+/, '')

const header = [
  `**Status:** Draft — ready for Roy review`,
  `**Trigger:** DNS switch to got-moles.com (week of 2026-04-27)`,
  `**Starting budget:** $1,650/month across 4 Search campaigns + LSA`,
  `**Parallel to:** meta-ads-tmcp-quiz brief (which covers Meta)`,
  `**Primary channel:** Local Services Ads (above-search listings, pay-per-lead)`,
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
