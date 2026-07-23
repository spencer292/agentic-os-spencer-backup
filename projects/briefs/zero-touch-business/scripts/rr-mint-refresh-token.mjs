#!/usr/bin/env node
// rr-mint-refresh-token.mjs — OAuth flow for the Route Ready Ads account.
// Reads ROUTE_READY_ADS_CLIENT_ID/SECRET from .env, opens the consent screen,
// and writes ROUTE_READY_ADS_REFRESH_TOKEN back into .env WITHOUT printing it.
// Also fills the two non-secret account ids if absent.
// Usage: node projects/briefs/zero-touch-business/scripts/rr-mint-refresh-token.mjs
import fs from 'node:fs'
import http from 'node:http'
import crypto from 'node:crypto'
import { exec } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(here, '..', '..', '..', '..', '.env')

const raw = fs.readFileSync(envPath, 'utf8')
const env = {}
for (const line of raw.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
  if (!m) continue
  let v = m[2].trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  env[m[1]] = v
}

const CLIENT_ID = env.ROUTE_READY_ADS_CLIENT_ID
const CLIENT_SECRET = env.ROUTE_READY_ADS_CLIENT_SECRET
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('FAIL: ROUTE_READY_ADS_CLIENT_ID / ROUTE_READY_ADS_CLIENT_SECRET missing from .env')
  process.exit(1)
}

function upsertEnvKey(key, value) {
  let text = fs.readFileSync(envPath, 'utf8')
  const re = new RegExp(`^\\s*${key}\\s*=.*$`, 'm')
  if (re.test(text)) text = text.replace(re, `${key}=${value}`)
  else text = text.replace(/\n*$/, '\n') + `${key}=${value}\n`
  fs.writeFileSync(envPath, text)
}

const PORT = 8765
const REDIRECT = `http://localhost:${PORT}`
const STATE = crypto.randomBytes(16).toString('hex')

const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
authUrl.searchParams.set('client_id', CLIENT_ID)
authUrl.searchParams.set('redirect_uri', REDIRECT)
authUrl.searchParams.set('response_type', 'code')
authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/adwords')
authUrl.searchParams.set('access_type', 'offline')
authUrl.searchParams.set('prompt', 'consent')
authUrl.searchParams.set('state', STATE)

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT)
  if (url.pathname !== '/') { res.statusCode = 404; res.end(); return }
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const err = url.searchParams.get('error')

  if (err) { res.end(`OAuth error: ${err}. Close this tab.`); console.error('OAuth error:', err); server.close(); process.exit(1) }
  if (!code || state !== STATE) { res.end('Missing/mismatched code/state. Close this tab.'); console.error('Missing/mismatched code/state.'); server.close(); process.exit(1) }

  try {
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET, redirect_uri: REDIRECT, grant_type: 'authorization_code' }),
    })
    const data = await r.json()
    if (!r.ok || !data.refresh_token) {
      res.end('Token exchange failed. Check terminal.')
      console.error('Token exchange failed:', JSON.stringify({ ...data, refresh_token: data.refresh_token ? '<redacted>' : undefined }))
      server.close(); process.exit(1)
    }
    upsertEnvKey('ROUTE_READY_ADS_REFRESH_TOKEN', data.refresh_token)
    if (!env.ROUTE_READY_ADS_LOGIN_CUSTOMER_ID) upsertEnvKey('ROUTE_READY_ADS_LOGIN_CUSTOMER_ID', '1433070544')
    if (!env.ROUTE_READY_ADS_CUSTOMER_ID) upsertEnvKey('ROUTE_READY_ADS_CUSTOMER_ID', '7630857815')
    res.end('Done — refresh token saved to .env. Close this tab and return to the terminal.')
    console.log(`OK: ROUTE_READY_ADS_REFRESH_TOKEN written to .env (length ${data.refresh_token.length}, value not shown). Account id keys ensured.`)
    server.close(); process.exit(0)
  } catch (e) {
    res.end('Error. Check terminal.'); console.error(e.message); server.close(); process.exit(1)
  }
})

server.listen(PORT, () => {
  console.log('Opening browser for consent — pick routereadykits@gmail.com in the account chooser.')
  exec(process.platform === 'win32' ? `start "" "${authUrl.href}"` : `open "${authUrl.href}"`)
})

setTimeout(() => { console.error('Timed out after 8 minutes waiting for consent.'); process.exit(1) }, 8 * 60 * 1000)
