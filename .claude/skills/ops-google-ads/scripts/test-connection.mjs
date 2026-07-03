#!/usr/bin/env node
// test-connection.mjs — connectivity smoke test for the Google Ads engine.
// Mints a token and lists accessible customers. Run this first after setting .env.
// Usage: node test-connection.mjs

import { createClient } from './lib/ads-client.mjs'

const client = await createClient()
console.log(`API ${client.apiVersion} — operating account ${client.customerId}`)
console.log('Listing accessible customers…')
const data = await client.listAccessibleCustomers()
const ids = (data.resourceNames || []).map(r => r.split('/')[1])
console.log(`OK — ${ids.length} accessible account(s):`, ids.join(', ') || '(none)')
