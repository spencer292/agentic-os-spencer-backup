# Session Capture

Session capture runs from the Claude Stop hook. The hook itself returns immediately and
starts `command-centre/scripts/memory-capture.cjs` in the background.

## What Gets Written

- `context/memory/{YYYY-MM-DD}.aos.md` gets one summarized block per captured turn.
- `context/transcripts/{YYYY-MM-DD}/*.jsonl` stores a raw copy of the transcript.
- Both are machine-owned. The `.aos.md` file is indexed and tracked for private
  GitHub backups because it is the source for future re-chunking and re-embedding.
  Raw transcripts are local archives and are gitignored.

Each capture block includes a SHA-256 hash of the source turn. If the same Stop event is
replayed, the existing block is detected and nothing new is written.

## Summarizer Config

Defaults live in `context/memory-config.json`:

```json
{
  "capture": {
    "summarize": {
      "enabled": true,
      "provider": "claude",
      "model": "haiku",
      "timeout_ms": 120000
    }
  }
}
```

`provider` supports `claude`, `codex`, or `none`. Claude is the default and shells out to
`claude -p --model haiku --no-session-persistence` with `CLAUDECODE` removed from the
environment. Codex support is best-effort through `codex exec` with hooks disabled. If the
summarizer is missing, fails, or times out, capture writes a bounded fallback summary.

## Manual Test

From `command-centre/`:

```bash
node scripts/memory-capture.cjs --session --session-id testrun --transcript "<path-to-transcript.jsonl>" --force
npm run memory:status
```

Expected result:

- today's `.aos.md` file exists under `context/memory/`
- a raw `.jsonl` copy exists under `context/transcripts/{YYYY-MM-DD}/`
- `memory:status` shows today's capture as present and indexed

Run the offline coverage with:

```bash
npm run test:memory
```
