#!/usr/bin/env node
// Pre-flight RSA policy validator
// Uses validate_only:true on adGroupAds:mutate to get policy findings without creating ads.
// Returns approved/limited/disapproved + specific evidence per headline/description.
//
// Usage:
//   node scripts/got-moles-validate-rsa.mjs <rsa-spec-file.json>
//
// rsa-spec-file.json structure:
// {
//   "adGroupId": "<existing ad group ID for context>",
//   "rsas": [
//     {
//       "name": "T1 — Mole Removal General",
//       "finalUrl": "https://got-moles.com/lp/mole-removal/",
//       "headlines": [{"text": "...", "pinnedField": "HEADLINE_1"}, ...],
//       "descriptions": [{"text": "..."}, ...],
//       "path1": "Mole-Removal",
//       "path2": "WA"
//     }
//   ]
// }

import fs from 'node:fs'
import path from 'node:path'

const env = {}
for (const line of fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
  if (!m) continue
  let v = m[2].trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  env[m[1]] = v
}

const CID = '1665761172'
const MCC = env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
const SPEC_FILE = process.argv[2]

if (!SPEC_FILE) {
  console.error('Usage: node scripts/got-moles-validate-rsa.mjs <rsa-spec-file.json>')
  process.exit(1)
}

const spec = JSON.parse(fs.readFileSync(SPEC_FILE, 'utf8'))

const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: env.GOOGLE_ADS_CLIENT_ID,
    client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
    refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  }),
})
const { access_token } = await tokenRes.json()

const headers = {
  'Authorization': `Bearer ${access_token}`,
  'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN,
  'login-customer-id': MCC,
  'Content-Type': 'application/json',
}

const adGroupRN = `customers/${CID}/adGroups/${spec.adGroupId}`

let totalIssues = 0

for (const rsa of spec.rsas) {
  console.log(`\n=== ${rsa.name} ===\n`)
  console.log(`Final URL: ${rsa.finalUrl}`)
  console.log(`Headlines: ${rsa.headlines.length}, Descriptions: ${rsa.descriptions.length}`)

  // Length validation client-side
  console.log('\n  Client-side length checks:')
  let lengthIssues = 0
  for (const h of rsa.headlines) {
    if (h.text.length > 30) {
      console.log(`  ❌ HEADLINE >30 chars (${h.text.length}): "${h.text}"`)
      lengthIssues++
    }
  }
  for (const d of rsa.descriptions) {
    if (d.text.length > 90) {
      console.log(`  ❌ DESCRIPTION >90 chars (${d.text.length}): "${d.text}"`)
      lengthIssues++
    }
  }
  if (rsa.path1 && rsa.path1.length > 15) {
    console.log(`  ❌ path1 >15 chars: "${rsa.path1}"`)
    lengthIssues++
  }
  if (rsa.path2 && rsa.path2.length > 15) {
    console.log(`  ❌ path2 >15 chars: "${rsa.path2}"`)
    lengthIssues++
  }
  if (!lengthIssues) console.log('  ✅ All within limits')

  // Validate via API
  console.log('\n  API validation (validate_only=true):')
  const operation = {
    create: {
      adGroup: adGroupRN,
      status: 'PAUSED',
      ad: {
        finalUrls: [rsa.finalUrl],
        responsiveSearchAd: {
          headlines: rsa.headlines,
          descriptions: rsa.descriptions,
          path1: rsa.path1 || '',
          path2: rsa.path2 || '',
        },
      },
    },
  }

  const res = await fetch(`https://googleads.googleapis.com/v23/customers/${CID}/adGroupAds:mutate`, {
    method: 'POST', headers,
    body: JSON.stringify({
      operations: [operation],
      validateOnly: true,
      responseContentType: 'MUTABLE_RESOURCE',
    }),
  })
  const data = await res.json()

  if (res.ok) {
    console.log('  ✅ PASSED VALIDATION')
    if (data.results?.[0]) console.log(`     ${data.results[0].resourceName || '(no resource — validate-only mode)'}`)
  } else {
    totalIssues++
    console.log('  ❌ POLICY/VALIDATION ERRORS:\n')
    const errors = data.error?.details?.[0]?.errors || []
    for (const err of errors) {
      const code = Object.values(err.errorCode || {}).join(' / ')
      console.log(`     - [${code}] ${err.message}`)
      if (err.trigger?.stringValue) console.log(`       trigger: "${err.trigger.stringValue}"`)
      if (err.location?.fieldPathElements) {
        const path = err.location.fieldPathElements.map(e => e.fieldName + (e.index !== undefined ? `[${e.index}]` : '')).join('.')
        console.log(`       field: ${path}`)
      }
      // Policy-specific findings
      const policy = err.details?.policyFindingDetails
      if (policy?.policyTopicEntries) {
        for (const t of policy.policyTopicEntries) {
          console.log(`       policy: ${t.topic} (${t.type})`)
          if (t.evidences) {
            for (const e of t.evidences) {
              if (e.textList?.texts) {
                console.log(`         flagged text: ${e.textList.texts.join(', ')}`)
              }
            }
          }
        }
      }
    }
  }
}

console.log(`\n=== SUMMARY ===`)
console.log(`Total RSAs validated: ${spec.rsas.length}`)
console.log(`Issues found: ${totalIssues}`)
if (totalIssues === 0) {
  console.log('✅ All RSAs cleared. Safe to deploy.')
} else {
  console.log('❌ Fix issues above before deploying.')
}
