/**
 * Jobber API integration
 *
 * OAuth 2.0 flow: refresh_token → access_token → clientCreate GraphQL mutation.
 *
 * Env vars required:
 *   JOBBER_CLIENT_ID
 *   JOBBER_CLIENT_SECRET
 *   JOBBER_REFRESH_TOKEN (long-lived; static if app has refresh-token-rotation OFF)
 *
 */

const JOBBER_API_BASE = 'https://api.getjobber.com/api'
// Hardcoded to a known-valid Jobber GraphQL API version. Do not pull from
// env — a stale env value will override the code default and break sync.
// Latest active version per https://developer.getjobber.com/docs/changelog/
const JOBBER_API_VERSION = '2025-04-16'

interface TokenResponse {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in: number
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.JOBBER_CLIENT_ID
  const clientSecret = process.env.JOBBER_CLIENT_SECRET
  const refreshToken = process.env.JOBBER_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Jobber credentials not configured (JOBBER_CLIENT_ID, JOBBER_CLIENT_SECRET, or JOBBER_REFRESH_TOKEN missing)')
  }

  const res = await fetch(`${JOBBER_API_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Jobber token refresh failed: ${res.status} ${errorText}`)
  }

  const data = (await res.json()) as TokenResponse
  return data.access_token
}

export interface JobberLead {
  name: string
  phone: string
  email?: string
  zipCode: string
  service: string
  message?: string
}

interface ClientCreateResult {
  data?: {
    clientCreate?: {
      client?: { id: string }
      userErrors?: Array<{ message: string; path: string[] }>
    }
  }
  errors?: Array<{ message: string }>
}

export async function createJobberClient(lead: JobberLead): Promise<{ id: string }> {
  const accessToken = await getAccessToken()

  const parts = lead.name.trim().split(/\s+/)
  const firstName = parts[0] || 'Lead'
  const lastName = parts.slice(1).join(' ') || '—'

  // Minimal ClientCreateInput — firstName/lastName + phones + (optional) emails.
  // `notes` is NOT a valid field on ClientCreateInput; notes are added via a
  // separate mutation after the client exists.
  const input: Record<string, unknown> = {
    firstName,
    lastName,
    phones: [
      {
        description: 'MAIN',
        primary: true,
        number: lead.phone,
      },
    ],
  }

  if (lead.email) {
    input.emails = [
      {
        description: 'MAIN',
        primary: true,
        address: lead.email,
      },
    ]
  }

  const mutation = `
    mutation CreateClient($input: ClientCreateInput!) {
      clientCreate(input: $input) {
        client {
          id
        }
        userErrors {
          message
          path
        }
      }
    }
  `

  const res = await fetch(`${JOBBER_API_BASE}/graphql`, {
    method: 'POST',
    headers: {
      Authorization: `bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-JOBBER-GRAPHQL-VERSION': JOBBER_API_VERSION,
    },
    body: JSON.stringify({ query: mutation, variables: { input } }),
  })

  const rawBody = await res.text()
  let json: ClientCreateResult
  try {
    json = JSON.parse(rawBody) as ClientCreateResult
  } catch {
    throw new Error(`Jobber non-JSON response (status ${res.status}): ${rawBody.slice(0, 500)}`)
  }

  if (json.errors?.length) {
    throw new Error(`Jobber GraphQL errors: ${json.errors.map((e) => e.message).join('; ')}`)
  }

  const userErrors = json.data?.clientCreate?.userErrors ?? []
  if (userErrors.length) {
    throw new Error(
      `Jobber clientCreate rejected: ${userErrors.map((e) => `${e.message} (${e.path.join('.')})`).join('; ')}`,
    )
  }

  const client = json.data?.clientCreate?.client
  if (!client) {
    // Surface the full response so we can diagnose response-shape issues
    throw new Error(
      `Jobber clientCreate returned no client. Status=${res.status}. Body=${rawBody.slice(0, 1500)}`,
    )
  }

  return client
}

export function isJobberConfigured(): boolean {
  return Boolean(
    process.env.JOBBER_CLIENT_ID &&
      process.env.JOBBER_CLIENT_SECRET &&
      process.env.JOBBER_REFRESH_TOKEN,
  )
}

interface RequestCreateResult {
  data?: {
    requestCreate?: {
      request?: { id: string }
      userErrors?: Array<{ message: string; path: string[] }>
    }
  }
  errors?: Array<{ message: string }>
}

/**
 * Create a Jobber Request linked to an existing Client. Requests appear in
 * Spencer's Jobber 'Requests' dashboard — that's where he triages new leads.
 * Must be called after createJobberClient returns a client ID.
 */
export async function createJobberRequest(
  clientId: string,
  lead: JobberLead,
): Promise<{ id: string }> {
  const accessToken = await getAccessToken()

  const description = [
    `Service requested: ${lead.service}`,
    `ZIP: ${lead.zipCode}`,
    lead.email ? `Email: ${lead.email}` : null,
    `Phone: ${lead.phone}`,
    lead.message ? `\nMessage:\n${lead.message}` : null,
    `\nSource: Got Moles website contact form`,
  ]
    .filter(Boolean)
    .join('\n')

  const input: Record<string, unknown> = {
    clientId,
    title: `Website inquiry — ${lead.service}`,
    description,
    source: 'Website Contact Form',
  }

  const mutation = `
    mutation RequestCreate($input: RequestCreateInput!) {
      requestCreate(input: $input) {
        request {
          id
        }
        userErrors {
          message
          path
        }
      }
    }
  `

  const res = await fetch(`${JOBBER_API_BASE}/graphql`, {
    method: 'POST',
    headers: {
      Authorization: `bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-JOBBER-GRAPHQL-VERSION': JOBBER_API_VERSION,
    },
    body: JSON.stringify({ query: mutation, variables: { input } }),
  })

  const rawBody = await res.text()
  let json: RequestCreateResult
  try {
    json = JSON.parse(rawBody) as RequestCreateResult
  } catch {
    throw new Error(`Jobber requestCreate non-JSON response (${res.status}): ${rawBody.slice(0, 500)}`)
  }

  if (json.errors?.length) {
    throw new Error(`Jobber requestCreate GraphQL errors: ${json.errors.map((e) => e.message).join('; ')}`)
  }

  const userErrors = json.data?.requestCreate?.userErrors ?? []
  if (userErrors.length) {
    throw new Error(
      `Jobber requestCreate rejected: ${userErrors.map((e) => `${e.message} (${e.path.join('.')})`).join('; ')}`,
    )
  }

  const request = json.data?.requestCreate?.request
  if (!request) {
    throw new Error(
      `Jobber requestCreate returned no request. Status=${res.status}. Body=${rawBody.slice(0, 1500)}`,
    )
  }

  return request
}
