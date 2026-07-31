// worker.js — Cloudflare Worker: serves the field app and brokers Jobber + OpenAI.
//
// The technician's phone never holds a Jobber or OpenAI credential; it holds a short-lived
// signed session token tied to one Jobber user. All writes go through /api/note, which
// posts a JobNote and nothing else — this app cannot edit schedules, jobs or clients.
//
// parseNote is imported from the SAME file the nightly report sync and the scheduling
// engine use (../../parse-note.mjs). That is deliberate: there is one definition of the
// note grammar, so the app can never drift from what the downstream automation reads.

import { parseNote } from '../../parse-note.mjs';
import { validate } from './grammar.js';
import { transcribe, formatNote } from './ai.js';
import { visitsForTech, createJobNote, ptToday } from './jobber.js';
import { APP_HTML } from './app.html.js';

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

// ── session tokens (HMAC-signed, no storage needed) ────────────────────────
const enc = new TextEncoder();
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64uStr = s => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => atob(s.replace(/-/g, '+').replace(/_/g, '/'));

async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}
async function sign(payload, secret) {
  const body = b64uStr(JSON.stringify(payload));
  const sig = b64u(await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(body)));
  return `${body}.${sig}`;
}
async function verify(token, secret) {
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig) return null;
  const expect = b64u(await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(body)));
  // Constant-time-ish compare: lengths match and no early exit on first difference.
  if (sig.length !== expect.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expect.charCodeAt(i);
  if (diff !== 0) return null;
  const payload = JSON.parse(unb64u(body));
  if (!payload.exp || payload.exp < Date.now()) return null;
  return payload;
}

function techs(env) {
  try { return JSON.parse(env.TECH_CODES || '{}'); } catch { return {}; }
}

async function requireTech(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  return verify(token, env.SESSION_SECRET);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/' || path === '/index.html') {
      return new Response(APP_HTML, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'no-referrer',
        },
      });
    }

    // ── login ────────────────────────────────────────────────────────────
    if (path === '/api/login' && request.method === 'POST') {
      const { code } = await request.json().catch(() => ({}));
      const map = techs(env);
      const entry = map[String(code || '').trim()];
      if (!entry) {
        // Uniform delay so a wrong code cannot be distinguished by timing.
        await new Promise(r => setTimeout(r, 600));
        return json({ error: 'That code did not work' }, 401);
      }
      const exp = Date.now() + 45 * 24 * 3600 * 1000; // long-lived: a tech should not be re-typing a code in a field
      const token = await sign({ uid: entry.jobberUserId, name: entry.name, exp }, env.SESSION_SECRET);
      return json({ token, name: entry.name });
    }

    const tech = await requireTech(request, env);
    if (!tech) return json({ error: 'Session expired' }, 401);

    // ── today's jobs ─────────────────────────────────────────────────────
    if (path === '/api/jobs') {
      try {
        const date = url.searchParams.get('date') || ptToday();
        const jobs = await visitsForTech(env, tech.uid, date);
        return json({ date, tech: tech.name, jobs });
      } catch (e) {
        console.log(`ERROR jobs tech=${tech.name}: ${e.message}`);
        return json({ error: 'Could not load jobs from Jobber. Check signal and try again.' }, 502);
      }
    }

    // ── audio -> shorthand ───────────────────────────────────────────────
    if (path === '/api/transcribe' && request.method === 'POST') {
      try {
        const form = await request.formData();
        const audio = form.get('audio');
        const jobId = form.get('jobId');
        if (!audio || typeof audio === 'string') return json({ error: 'No audio received' }, 400);
        if (audio.size > 18 * 1024 * 1024) return json({ error: 'That recording is too long — keep notes under about 10 minutes' }, 413);

        const bytes = new Uint8Array(await audio.arrayBuffer());
        const mime = (form.get('mime') || audio.type || 'audio/webm').split(';')[0];
        const { text: transcript } = await transcribe(env, bytes, mime);

        // Previous note gives the formatter context for "same as last time" style speech.
        let lastNote = null;
        if (jobId) {
          try {
            const jobs = await visitsForTech(env, tech.uid, ptToday());
            lastNote = jobs.find(j => j.jobId === jobId)?.lastNote || null;
          } catch { /* context is a nicety, never a blocker */ }
        }

        const { note } = await formatNote(env, transcript, { lastNote });
        const parsed = parseNote(note);
        const v = validate(note, parsed);
        console.log(`FORMAT tech=${tech.name} job=${jobId} chars=${note.length} warnings=${v.warnings.length}`);
        return json({ transcript, note, ...v });
      } catch (e) {
        console.log(`ERROR transcribe tech=${tech.name}: ${e.message}`);
        return json({ error: 'Could not write that up. Try recording again.' }, 502);
      }
    }

    // ── re-validate hand-edited text ─────────────────────────────────────
    if (path === '/api/check' && request.method === 'POST') {
      const { note } = await request.json().catch(() => ({}));
      const parsed = parseNote(String(note || ''));
      return json(validate(String(note || ''), parsed));
    }

    // ── write the note ───────────────────────────────────────────────────
    if (path === '/api/note' && request.method === 'POST') {
      const { jobId, message, transcript } = await request.json().catch(() => ({}));
      if (!jobId || !message || !String(message).trim()) return json({ error: 'Nothing to send' }, 400);
      try {
        const created = await createJobNote(env, jobId, String(message).trim());
        // Jobber attributes API notes to the connected app, not the technician, so the
        // tech's name is recorded here. `wrangler tail` is the audit trail.
        console.log(`NOTE tech=${tech.name} job=${jobId} noteId=${created?.id || '?'} spoken=${JSON.stringify(String(transcript || '').slice(0, 400))} sent=${JSON.stringify(message)}`);
        return json({ ok: true, noteId: created?.id || null });
      } catch (e) {
        console.log(`ERROR note tech=${tech.name} job=${jobId}: ${e.message}`);
        return json({ error: 'Jobber did not accept the note.' }, 502);
      }
    }

    return json({ error: 'Not found' }, 404);
  },
};
