// SUPERSEDED — safe to delete this file.
//
// The app originally used OpenAI (gpt-4o-transcribe + gpt-4o). That path was abandoned on
// 2026-07-28 because this install's OPENAI_API_KEY returns 429 insufficient_quota on every
// call. The live implementation is ./ai.js, on the Gemini key that does work.
//
// Nothing imports this module. It is left in place only because `rm` is denied by this
// install's permission settings.
export {};
