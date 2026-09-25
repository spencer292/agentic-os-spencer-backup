// Is CallRail's native Jobber integration still writing client records?
//
// Cleanup is a treadmill until this is switched off, so check its live state
// before deciding whether archiving is a one-time job or a recurring chore.
// READ-ONLY.
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')
for (const line of readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const KEY_NAMES = ['CALLRAIL_API_KEY', 'CALLRAIL_KEY', 'CALLRAIL_TOKEN', 'CALLRAIL_API_TOKEN']
const keyName = KEY_NAMES.find((n) => process.env[n])
if (!keyName) {
  console.log('No CallRail key in .env — check the integration in the CallRail UI instead.')
  process.exit(1)
}
const key = process.env[keyName].trim().replace(/^["']|["']$/g, '')

const api = async (p, params = {}) => {
  const url = new URL(`https://api.callrail.com/v3/${p}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url, { headers: { Authorization: `Token token="${key}"` } })
  if (!res.ok) throw new Error(`${res.status} on ${p}: ${(await res.text()).slice(0, 300)}`)
  return res.json()
}

const accounts = await api('a.json')
for (const acct of accounts.accounts) {
  console.log(`\nAccount ${acct.id} — ${acct.name}`)
  // integrations.json is scoped per company, not per account.
  const companies = await api(`a/${acct.id}/companies.json`)
  for (const co of companies.companies || []) {
    console.log(`  company ${co.id} — ${co.name} (${co.status})`)
    const ints = await api(`a/${acct.id}/integrations.json`, { company_id: co.id })
    for (const i of ints.integrations || []) {
      const flag = /jobber/i.test(i.type || i.name || '') ? '   <-- JOBBER' : ''
      console.log(`    ${i.id}  ${i.type || i.name}  state=${i.state || i.status}${flag}`)
    }
  }
}
