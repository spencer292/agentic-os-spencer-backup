#!/usr/bin/env node
// Resolve Spencer's 91 city list to Google Ads Geo Target Constant IDs

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

const CITIES = [
  'Algona', 'Arlington', 'Auburn', 'Bainbridge Island', 'Bellevue', 'Black Diamond',
  'Bonney Lake', 'Bothell', 'Bremerton', 'Brier', 'Buckley', 'Burien', 'Carnation',
  'Centralia', 'Chehalis', 'Clyde Hill', 'Covington', 'Des Moines', 'DuPont', 'Duvall',
  'Eatonville', 'Edgewood', 'Edmonds', 'Elk Plain', 'Enumclaw', 'Everett', 'Fairfax',
  'Fairwood', 'Federal Way', 'Fife', 'Fircrest', 'Frederickson', 'Gig Harbor', 'Graham',
  'Granite Falls', 'Green River', 'Issaquah', 'Kenmore', 'Kent', 'Kirkland', 'Lacey',
  'Lake City', 'Lake Forest Park', 'Lake Stevens', 'Lake Tapps', 'Lakewood', 'Lynnwood',
  'Maple Valley', 'Marysville', 'Medina', 'Mercer Island', 'Mill Creek', 'Milton',
  'Monroe', 'Mountlake Terrace', 'Mukilteo', 'Newcastle', 'Normandy Park', 'North Bend',
  'Olympia', 'Orting', 'Pacific', 'Parkland', 'Port Orchard', 'Poulsbo', 'Prairie Ridge',
  'Puyallup', 'Rainier', 'Ravensdale', 'Redmond', 'Renton', 'Roy', 'Sammamish', 'SeaTac',
  'Seattle', 'Shoreline', 'Silverdale', 'Snohomish', 'Snoqualmie', 'South Hill',
  'Spanaway', 'Stanwood', 'Steilacoom', 'Sultan', 'Sumner', 'Tacoma', 'Tenino',
  'Tukwila', 'Tumwater', 'University Place', 'White Center', 'Woodinville', 'Yelm'
]

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
  'Content-Type': 'application/json',
}

// Suggest geo target constants — disambiguate by appending Washington
// API caps batches at 25 location names per call
const locationNames = CITIES.map(c => `${c}, Washington, United States`)

const allSuggestions = []
for (let i = 0; i < locationNames.length; i += 25) {
  const batch = locationNames.slice(i, i + 25)
  console.log(`Batch ${Math.floor(i/25) + 1}: ${batch.length} cities...`)
  const res = await fetch('https://googleads.googleapis.com/v23/geoTargetConstants:suggest', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      locale: 'en',
      countryCode: 'US',
      locationNames: { names: batch },
    }),
  })
  const data = await res.json()
  if (!res.ok) {
    console.error('FAIL:', JSON.stringify(data, null, 2))
    process.exit(1)
  }
  allSuggestions.push(...(data.geoTargetConstantSuggestions || []))
}

const suggestions = allSuggestions
console.log(`Got ${suggestions.length} suggestions total\n`)

// Filter to City-level matches in WA only
const resolved = []
const unresolved = []

for (const city of CITIES) {
  const wantedName = `${city}, Washington, United States`.toLowerCase()
  const wantedCity = city.toLowerCase()

  // Find best match: searchTerm match + targetType=City + WA state + ENABLED + canonicalName starts with city
  const cityCanonical = city.toLowerCase().replace(/\s+/g, '')
  const candidates = suggestions
    .filter(s => s.searchTerm?.toLowerCase() === wantedName)
    .filter(s => s.geoTargetConstant?.targetType === 'City')
    .filter(s => s.geoTargetConstant?.status === 'ENABLED')
    .filter(s => s.geoTargetConstant?.countryCode === 'US')
    .filter(s => /washington/i.test(s.geoTargetConstant?.canonicalName || ''))
    .filter(s => {
      // canonicalName format: "Snohomish,Washington,United States" or "Fairwood,King County,Washington,United States"
      const cn = (s.geoTargetConstant?.canonicalName || '').toLowerCase().replace(/\s+/g, '')
      return cn.startsWith(cityCanonical + ',')
    })

  // Sort by reach descending — prefer the higher-population variant if multiple
  candidates.sort((a, b) => Number(b.reach || 0) - Number(a.reach || 0))

  const best = candidates[0]
  if (best) {
    resolved.push({
      city,
      id: best.geoTargetConstant.id,
      resourceName: best.geoTargetConstant.resourceName,
      canonicalName: best.geoTargetConstant.canonicalName,
      reach: Number(best.reach || 0),
    })
  } else {
    unresolved.push(city)
  }
}

console.log(`Resolved: ${resolved.length}/${CITIES.length}`)
console.log(`Unresolved: ${unresolved.length}\n`)

if (unresolved.length) {
  console.log('--- UNRESOLVED CITIES ---')
  for (const c of unresolved) console.log(`  ${c}`)
  console.log('')
}

console.log('--- RESOLVED (sample of first 30) ---')
for (const r of resolved.slice(0, 30)) {
  console.log(`  ${r.id.padStart(7)}  reach=${String(r.reach).padStart(8)}  ${r.canonicalName}`)
}

const outPath = 'projects/briefs/got-moles-paid-search/geo-targets-resolved.json'
fs.writeFileSync(outPath, JSON.stringify({ resolved, unresolved }, null, 2))
console.log(`\nSaved: ${outPath}`)

// Print the resource names for use in campaign mutate
console.log(`\n--- ALL ${resolved.length} resourceNames (for campaign criteria) ---`)
for (const r of resolved) console.log(`  ${r.resourceName}  // ${r.city}`)
