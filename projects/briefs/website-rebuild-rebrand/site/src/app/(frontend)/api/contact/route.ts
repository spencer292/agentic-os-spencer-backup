import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import {
  createJobberClient,
  createJobberRequest,
  createJobberRequestNote,
  isJobberConfigured,
  type JobberLead,
} from '@/lib/jobber'

interface ContactFormData {
  name: string
  phone: string
  zipCode: string
  service: string
  email?: string
  message?: string
  // Honeypot — must be empty
  website?: string
}

// Rate limit: 5 submissions per IP per 10 minutes (in-memory fallback;
// Vercel Bot Protection + Vercel KV for persistent cross-invocation limits
// is the proper solution. No Cloudflare in front of Vercel.)
const submissions = new Map<string, number[]>()
const RATE_LIMIT = 5
const RATE_WINDOW = 10 * 60 * 1000

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = submissions.get(ip)?.filter((t) => now - t < RATE_WINDOW) ?? []
  submissions.set(ip, timestamps)
  if (timestamps.length >= RATE_LIMIT) return true
  timestamps.push(now)
  return false
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const userAgent = request.headers.get('user-agent') || undefined

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many submissions. Please try again later.' },
      { status: 429 },
    )
  }

  let body: ContactFormData
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  // Honeypot check — bots fill hidden fields, humans don't
  if (body.website) {
    // Return success to the bot so it doesn't retry
    return NextResponse.json({ success: true })
  }

  // Validation
  if (!body.name?.trim() || body.name.length > 200) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  }
  if (!body.phone?.trim() || !/^[\d\s\-().+]+$/.test(body.phone) || body.phone.length > 30) {
    return NextResponse.json({ error: 'Valid phone number is required.' }, { status: 400 })
  }
  if (!body.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()) || body.email.length > 200) {
    return NextResponse.json({ error: 'Valid email address is required.' }, { status: 400 })
  }
  if (!body.zipCode?.trim() || !/^\d{5}(-\d{4})?$/.test(body.zipCode.trim())) {
    return NextResponse.json({ error: 'Valid ZIP code is required.' }, { status: 400 })
  }
  if (!body.service?.trim()) {
    return NextResponse.json({ error: 'Please select a service.' }, { status: 400 })
  }

  // Sanitize
  const sanitized = {
    name: body.name.trim().slice(0, 200),
    phone: body.phone.trim().slice(0, 30),
    zipCode: body.zipCode.trim().slice(0, 10),
    service: body.service.trim().slice(0, 100),
    email: body.email?.trim().slice(0, 200) || undefined,
    message: body.message?.trim().slice(0, 2000) || undefined,
  }

  // Step 1: Save to Leads collection (source of truth, must not fail silently)
  let leadId: number | string | undefined
  try {
    const payload = await getPayloadClient()
    const created = await payload.create({
      collection: 'leads',
      data: {
        name: sanitized.name,
        phone: sanitized.phone,
        email: sanitized.email,
        zipCode: sanitized.zipCode,
        service: sanitized.service as 'tmcp' | 'one-time' | 'commercial' | 'other',
        message: sanitized.message,
        source: 'website-contact',
        status: 'new',
        ipAddress: ip,
        userAgent,
      },
    })
    leadId = created.id
  } catch (err) {
    console.error('[contact] Failed to save lead to Payload:', err)
    return NextResponse.json(
      { error: 'Unable to save submission. Please call (253) 750-0211.' },
      { status: 500 },
    )
  }

  // Step 2: Fire Jobber sync (fire-and-log — Jobber failure must not block form success)
  if (isJobberConfigured()) {
    const jobberLead: JobberLead = {
      name: sanitized.name,
      phone: sanitized.phone,
      email: sanitized.email,
      zipCode: sanitized.zipCode,
      service: sanitized.service,
      message: sanitized.message,
    }

    try {
      // Create the Jobber Client, then raise a Request against it. The Client
      // on its own is a SILENT record — it lands in a list of 4,000+ names and
      // notifies nobody, which is how website leads were being missed. The
      // Request is what surfaces in the Requests dashboard for triage.
      // (An earlier comment here claimed Jobber removed request-creation
      // mutations in Aug 2023. That is wrong: requestCreate is live on API
      // version 2025-04-16.)
      const client = await createJobberClient(jobberLead)

      // Request creation must never lose the lead: the Client already exists
      // and the Payload lead record is saved, so a failure here is logged and
      // reported, not thrown.
      let requestId: string | undefined
      try {
        const jobberRequest = await createJobberRequest(client.id, jobberLead)
        requestId = jobberRequest.id
        await createJobberRequestNote(jobberRequest.id, jobberLead)
      } catch (requestErr) {
        console.error(
          '[contact] Jobber client created but request/note failed:\n' +
            (requestErr instanceof Error ? requestErr.message : String(requestErr)),
        )
      }

      try {
        const payload = await getPayloadClient()
        await payload.update({
          collection: 'leads',
          id: leadId!,
          data: {
            status: 'synced-jobber',
            externalIds: { jobberClientId: client.id },
            syncLog: [
              {
                destination: 'jobber',
                success: true,
                // Surfaces in the Payload admin when a lead reached Jobber as a
                // client but never made it into the Requests queue.
                error: requestId ? undefined : 'Client created; Request NOT created (see function logs)',
                timestamp: new Date().toISOString(),
              },
            ],
          },
        })
      } catch (updateErr) {
        console.error('[contact] Jobber sync succeeded but lead update failed:', updateErr)
      }
    } catch (jobberErr) {
      const fullError = jobberErr instanceof Error ? jobberErr.message : String(jobberErr)
      // Always log full error to Vercel function logs (no DB length truncation there)
      console.error('[contact] Jobber sync failed. Full error:\n' + fullError)
      try {
        const payload = await getPayloadClient()
        await payload.update({
          collection: 'leads',
          id: leadId!,
          data: {
            status: 'failed-sync',
            syncLog: [
              {
                destination: 'jobber',
                success: false,
                // Payload text fields cap around 255 chars; truncate to avoid silent write failure
                error: fullError.slice(0, 250),
                timestamp: new Date().toISOString(),
              },
            ],
          },
        })
      } catch {
        // Lead still exists with status=new; no blocking
      }
    }
  }

  return NextResponse.json({ success: true })
}
