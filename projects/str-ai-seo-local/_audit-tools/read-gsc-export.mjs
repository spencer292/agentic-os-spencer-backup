// Parse the GSC Performance-on-Search export Roy downloaded.
// File: c:/Users/roy.castleman/Downloads/got-moles.com-Performance-on-Search-2026-05-05.xlsx
//
// Output: per-sheet summary + the rows that matter for the audit:
//   - top queries
//   - top pages
//   - which queries / pages have dropped
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const XLSX = require('xlsx')

const FILE = 'C:/Users/roy.castleman/Downloads/got-moles.com-Performance-on-Search-2026-05-05.xlsx'

const wb = XLSX.readFile(FILE)
console.log(`Workbook: ${FILE}`)
console.log(`Sheet names: ${wb.SheetNames.join(', ')}`)
console.log()

for (const name of wb.SheetNames) {
  const sheet = wb.Sheets[name]
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null })
  console.log(`\n=== Sheet: "${name}" — ${rows.length} rows ===`)
  if (rows.length === 0) continue
  console.log(`Columns: ${Object.keys(rows[0]).join(' | ')}`)
  console.log(`First 3 rows (sample):`)
  for (const r of rows.slice(0, 3)) {
    console.log(`  ${JSON.stringify(r)}`)
  }
}
