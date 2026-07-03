#!/usr/bin/env node
// get-refresh-token.mjs — one-shot OAuth flow to mint a Google Ads API refresh token.
// Usage: node get-refresh-token.mjs <CLIENT_ID> <CLIENT_SECRET>
// Paste the printed token into .env as GOOGLE_ADS_REFRESH_TOKEN.

import http from 'node:http'
import { exec } from 'node:child_process'
import crypto from 'node:crypto'

const [, , CLIENT_ID, CLIENT_SECRET] = process.argv
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Usage: node get-refresh-token.mjs <CLIENT_ID> <CLIENT_SECRET>')
  process.exit(1)
}

const PORT = 8765
const REDIRECT = `http://localhost:${PORT}`
const SCOPE = 'https://www.googleapis.com/auth/adwords'
const STATE = crypto.randomBytes(16).toString('hex')

const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
authUrl.searchParams.set('client_id', CLIENT_ID)
authUrl.searchParams.set('redirect_uri', REDIRECT)
authUrl.searchParams.set('response_type', 'code')
authUrl.searchParams.set('scope', SCOPE)
authUrl.searchParams.set('access_type', 'offline')
authUrl.searchParams.set('prompt', 'consent')
authUrl.searchParams.set('state', STATE)

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT)
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
    if (!r.ok || !data.refresh_token) { res.end('Token exchange failed. Check terminal.'); console.error('Token exchange failed:', data); server.close(); process.exit(1) }
    res.end('Refresh token captured. Close this tab and return to the terminal.')
    console.log('\n=== GOOGLE_ADS_REFRESH_TOKEN ===')
    console.log(data.refresh_token)
    console.log('================================\nPaste into .env as GOOGLE_ADS_REFRESH_TOKEN.')
    server.close(); process.exit(0)
  } catch (e) { res.end('Token exchange threw. Check terminal.'); console.error(e); server.close(); process.exit(1) }
})

server.listen(PORT, () => {
  console.log(`Listening on ${REDIRECT}. Opening browser…`)
  const cmd = process.platform === 'win32' ? `start "" "${authUrl}"` : process.platform === 'darwin' ? `open "${authUrl}"` : `xdg-open "${authUrl}"`
  exec(cmd, (e) => { if (e) console.log(`Open manually:\n${authUrl}`) })
})
