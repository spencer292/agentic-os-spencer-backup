// Push the implementation guide to Notion as a child page
// under the measurement-setup brief page.

import { readFileSync } from 'node:fs';

// Root .mcp.json holds the Notion token
const mcpPath = 'C:/Claude/agent-os/.mcp.json';
const mcp = JSON.parse(readFileSync(mcpPath, 'utf8'));
const token = mcp.mcpServers['notion-local'].env.NOTION_API_TOKEN;

if (!token) {
  console.error('No Notion token in .mcp.json');
  process.exit(1);
}

const PARENT_PAGE_ID = '34a3d42c-4a9c-81f3-be2c-cccafcd534d9';
const GUIDE_PATH = 'C:/Claude/agent-os/clients/got-moles/projects/briefs/got-moles-measurement-setup/2026-04-23_implementation-guide-from-atp.md';
const markdown = readFileSync(GUIDE_PATH, 'utf8');

const body = {
  parent: { page_id: PARENT_PAGE_ID },
  properties: {
    title: {
      title: [
        { text: { content: 'Implementation Guide — Derived from ATP (2026-04-23)' } },
      ],
    },
  },
  markdown,
};

const res = await fetch('https://api.notion.com/v1/pages', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Notion-Version': '2026-03-11',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

const json = await res.json();

if (!res.ok) {
  console.error('Notion API error:', res.status, JSON.stringify(json, null, 2));
  process.exit(1);
}

console.log('Page created:', json.id);
console.log('URL:', json.url);
