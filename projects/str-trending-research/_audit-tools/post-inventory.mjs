#!/usr/bin/env node
/** Inventory current blog posts: slug | cluster | primaryMoneyPage | primaryKeyword | title. Read-only. */
import { readFileSync } from 'node:fs'
const src = readFileSync(new URL('../../briefs/website-rebuild-rebrand/site/src/lib/blog-data.ts', import.meta.url), 'utf8')

const slugRe = /\n {4}slug: '([^']+)',/g
const marks = []
let m
while ((m = slugRe.exec(src))) marks.push({ slug: m[1], idx: m.index })
marks.push({ slug: '__END__', idx: src.length })

function field(block, name) {
  const m = block.match(new RegExp(`\\n {4}${name}: (["'])((?:\\\\.|(?!\\1).)*?)\\1,`))
  return m ? m[2] : ''
}

const rows = []
for (let i = 0; i < marks.length - 1; i++) {
  const block = src.slice(marks[i].idx, marks[i + 1].idx)
  rows.push({
    slug: marks[i].slug,
    cluster: field(block, 'cluster'),
    money: (block.match(/primaryMoneyPage: '([^']+)'/) || [, 'tmcp*'])[1],
    pk: field(block, 'primaryKeyword'),
    title: field(block, 'title'),
  })
}

console.log(`TOTAL POSTS: ${rows.length}\n`)
// group by cluster
const byCluster = {}
for (const r of rows) (byCluster[r.cluster] ||= []).push(r)
for (const [c, list] of Object.entries(byCluster).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`\n## cluster: ${c || '(none)'} — ${list.length}`)
  for (const r of list) console.log(`  [${r.money}] ${r.slug}  | pk: ${r.pk}`)
}
