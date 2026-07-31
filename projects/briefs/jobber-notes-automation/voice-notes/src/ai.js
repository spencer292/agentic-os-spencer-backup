// ai.js — speech-to-text + shorthand formatting, on the Gemini API.
//
// Provider choice (2026-07-28): this install's OPENAI_API_KEY has no quota (every call
// returns 429 insufficient_quota), and there is no ANTHROPIC/GROQ/ASSEMBLYAI key. The
// GEMINI_API_KEY works and gemini-3.x accepts audio natively, so one provider covers both
// steps. Verified against phone-native container formats: audio/webm (Android Chrome),
// audio/mp4 (iOS Safari), audio/ogg, audio/aac and audio/wav all transcribe correctly,
// so the recorder can ship whatever the phone gives it — no client-side conversion.
//
// Transcription and formatting are deliberately two calls: the transcript stays a faithful
// record of what the technician actually said (logged for audit and shown in the UI under
// "What you said"), and formatting is a separate, inspectable step whose output is
// validated against the live note parser.

import { SPEECH_VOCAB, buildPrompt } from './grammar.js';

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

function toBase64(bytes) {
  let bin = '';
  const chunk = 0x8000; // avoid blowing the argument limit on long recordings
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

async function generate(env, model, body) {
  const res = await fetch(`${BASE}/${model}:generateContent?key=${env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${model}: HTTP ${res.status} ${(d.error?.message || '').slice(0, 160)}`);
  const text = (d.candidates?.[0]?.content?.parts || []).map(p => p.text).filter(Boolean).join('').trim();
  if (!text) {
    const reason = d.candidates?.[0]?.finishReason || 'no content';
    throw new Error(`${model}: empty response (${reason})`);
  }
  return text;
}

// Gemini has no dedicated `prompt` bias parameter the way Whisper does, so the in-domain
// vocabulary goes in as instruction text. This is the main defence against "mole" being
// heard as "mile" — a confusion that already appears 17x in TYPED notes and gets worse
// with outdoor audio.
export async function transcribe(env, audioBytes, mimeType) {
  const model = env.TRANSCRIBE_MODEL || 'gemini-3.6-flash';
  const text = await generate(env, model, {
    contents: [{
      role: 'user',
      parts: [
        {
          text: `Transcribe this audio verbatim. It is a mole-control technician recording a visit note outdoors on a phone, so expect wind and background noise.

Expected vocabulary: ${SPEECH_VOCAB}.

Rules:
- Output ONLY the words spoken. No commentary, no headings, no timestamps.
- Keep filler words and self-corrections exactly as spoken.
- "mole" is a burrowing animal. Never transcribe it as "mile", "mold" or "my old".
- Write trap names as spoken: victor, voos, trapline.
- If a stretch is inaudible, write [inaudible] rather than guessing.`,
        },
        { inline_data: { mime_type: mimeType || 'audio/webm', data: toBase64(audioBytes) } },
      ],
    }],
    generationConfig: { temperature: 0, maxOutputTokens: 2048 },
  });
  return { text, model };
}

export async function formatNote(env, transcript, { lastNote } = {}) {
  const model = env.FORMAT_MODEL || 'gemini-3.6-flash';
  const { system, shots, user } = buildPrompt(transcript, { lastNote });
  const contents = [];
  for (const s of shots) {
    contents.push({ role: 'user', parts: [{ text: s.spoken }] });
    contents.push({ role: 'model', parts: [{ text: s.note }] });
  }
  contents.push({ role: 'user', parts: [{ text: user }] });

  const raw = await generate(env, model, {
    systemInstruction: { parts: [{ text: system }] },
    contents,
    generationConfig: { temperature: 0, maxOutputTokens: 2048 },
  });

  // Strip anything that is not a note line: code fences, lead-ins, trailing commentary.
  const note = raw
    .replace(/```[a-z]*\n?/gi, '')
    .split(/\r?\n/)
    .map(l => l.replace(/^\s*[-*•]\s*/, '').trim())
    .filter(l => l && !/^(here('s| is)\b|note:|formatted\b|output:)/i.test(l))
    .join('\n')
    .trim();
  return { note, model };
}
