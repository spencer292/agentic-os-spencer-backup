#!/usr/bin/env node
// rr-mint-gsc-token.mjs — OAuth flow for Route Ready Search Console (read-only).
// Reuses the existing ROUTE_READY_ADS_CLIENT_ID/SECRET OAuth client (same GCP project,
// same routereadykits@gmail.com identity) and writes ROUTE_READY_GSC_REFRESH_TOKEN back
// into .env WITHOUT printing it. Mirrors rr-mint-refresh-token.mjs exactly.
//
// Prerequisite: the "Google Search Console API" must be ENABLED in the same GCP project
// that owns the OAuth client. If it isn't, the consent screen will still work but the
// first API call 403s with SERVICE_DISABLED and a direct enable link — rr-gsc-report.mjs
// surfaces that link verbatim.
//
// Usage: node projects/briefs/zero-touch-business/scripts/rr-mint-gsc-token.mjs
import fs from 'node:fs'
import http from 'node:http'
import crypto from 'node:crypto'
import { exec } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(here, '..', '..', '..', '..', '.env')

const env = {}
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
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

const PORT = 8766 // deliberately not 8765 — avoids clashing with the ads mint flow
const REDIRECT = `http://localhost:${PORT}`
const STATE = crypto.randomBytes(16).toString('hex')

const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
authUrl.searchParams.set('client_id', CLIENT_ID)
authUrl.searchParams.set('redirect_uri', REDIRECT)
authUrl.searchParams.set('response_type', 'code')
authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/webmasters.readonly')
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
    upsertEnvKey('ROUTE_READY_GSC_REFRESH_TOKEN', data.refresh_token)
    res.end('Done — Search Console token saved to .env. Close this tab and return to the terminal.')
    console.log(`OK: ROUTE_READY_GSC_REFRESH_TOKEN written to .env (length ${data.refresh_token.length}, value not shown).`)
    console.log('Next: node projects/briefs/zero-touch-business/scripts/rr-gsc-report.mjs')
    server.close(); process.exit(0)
  } catch (e) {
    res.end('Error. Check terminal.'); console.error(e.message); server.close(); process.exit(1)
  }
})

server.listen(PORT, () => {
  console.log('Opening browser for consent — pick routereadykits@gmail.com in the account chooser.')
  console.log('Scope requested: webmasters.readonly (read-only — this token cannot change anything in Search Console).')
  exec(process.platform === 'win32' ? `start "" "${authUrl.href}"` : `open "${authUrl.href}"`)
})

setTimeout(() => { console.error('Timed out after 8 minutes waiting for consent.'); process.exit(1) }, 8 * 60 * 1000)
