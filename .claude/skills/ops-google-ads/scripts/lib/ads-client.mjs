#!/usr/bin/env node
// ads-client.mjs — reusable Google Ads API engine (no SDK, node builtins only).
//
// Refactored from the got-moles paid-search operation. The whole engine is ~1 file:
// parse .env -> mint access token from a refresh token -> call GAQL search / mutate.
//
// Bump API_VERSION here ONCE when Google ships a new version (monthly cadence since 2026).
// Current: v24 (v20 sunset 2026-06-10, v21 Aug, v22 Oct, v23 aging — keep this current).
//
// Required .env vars:
//   GOOGLE_ADS_DEVELOPER_TOKEN   - from the API Center of the MCC
//   GOOGLE_ADS_CLIENT_ID         - OAuth client (Desktop app)
//   GOOGLE_ADS_CLIENT_SECRET
//   GOOGLE_ADS_REFRESH_TOKEN     - mint with scripts/get-refresh-token.mjs
//   GOOGLE_ADS_LOGIN_CUSTOMER_ID - the MCC (manager) account id, digits only
//   GOOGLE_ADS_CUSTOMER_ID       - the operating (client) account id, digits only

import fs from 'node:fs'
import path from 'node:path'

export const API_VERSION = 'v24'
const BASE = `https://googleads.googleapis.com/${API_VERSION}`

/** Parse a .env file into a plain object (no dotenv dependency). */
export function loadEnv(envPath = path.resolve(process.cwd(), '.env')) {
  if (!fs.existsSync(envPath)) throw new Error(`No .env found at ${envPath}`)
  const env = {}
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
    if (!m) continue
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    env[m[1]] = v
  }
  return env
}

const REQUIRED = [
  'GOOGLE_ADS_DEVELOPER_TOKEN',
  'GOOGLE_ADS_CLIENT_ID',
  'GOOGLE_ADS_CLIENT_SECRET',
  'GOOGLE_ADS_REFRESH_TOKEN',
  'GOOGLE_ADS_LOGIN_CUSTOMER_ID',
]

/**
 * Build an authenticated client bound to one customer (account).
 * @param {object} [opts]
 * @param {string} [opts.customerId] - operating account; defaults to GOOGLE_ADS_CUSTOMER_ID
 * @param {object} [opts.env]        - pre-loaded env; defaults to loadEnv()
 */
export async function createClient(opts = {}) {
  const env = opts.env || loadEnv()
  const missing = REQUIRED.filter(k => !env[k])
  if (missing.length) throw new Error(`Missing in .env: ${missing.join(', ')}`)

  const customerId = (opts.customerId || env.GOOGLE_ADS_CUSTOMER_ID || '').replace(/-/g, '')
  if (!customerId) throw new Error('No customerId given and GOOGLE_ADS_CUSTOMER_ID not set')
  const loginCustomerId = env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, '')

  // Mint a short-lived access token from the refresh token.
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
  const tokenData = await tokenRes.json()
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(`Token mint failed: ${JSON.stringify(tokenData)}`)
  }

  const headers = {
    'Authorization': `Bearer ${tokenData.access_token}`,
    'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN,
    'login-customer-id': loginCustomerId,
    'Content-Type': 'application/json',
  }

  return {
    env,
    customerId,
    apiVersion: API_VERSION,

    /** List every account the authenticated user can reach (good first smoke test). */
    async listAccessibleCustomers() {
      const r = await fetch(`${BASE}/customers:listAccessibleCustomers`, { headers })
      if (!r.ok) throw new Error(`listAccessibleCustomers ${r.status}: ${await r.text()}`)
      return r.json()
    },

    /** Run a GAQL query. Returns the flattened results array (handles pagination). */
    async gaql(query) {
      const out = []
      let pageToken
      do {
        const body = { query }
        if (pageToken) body.pageToken = pageToken
        const r = await fetch(`${BASE}/customers/${customerId}/googleAds:search`, {
          method: 'POST', headers, body: JSON.stringify(body),
        })
        if (!r.ok) throw new Error(`GAQL ${r.status}: ${await r.text()}`)
        const j = await r.json()
        out.push(...(j.results || []))
        pageToken = j.nextPageToken
      } while (pageToken)
      return out
    },

    /**
     * Apply mutate operations against a service, e.g. mutate('campaigns', [{ create: {...} }]).
     * Set validateOnly:true to dry-run without changing the account — ALWAYS dry-run first.
     */
    async mutate(service, operations, { validateOnly = false, partialFailure = false } = {}) {
      const r = await fetch(`${BASE}/customers/${customerId}/${service}:mutate`, {
        method: 'POST', headers,
        body: JSON.stringify({ operations, validateOnly, partialFailure }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(`mutate ${service} ${r.status}: ${JSON.stringify(j)}`)
      return j
    },
  }
}
