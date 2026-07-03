# Memory Retrieval

Structure every recall response based on what was found:

**Found:** answer + cite source inline ("Based on the session log from 2026-05-11 and a decision in MEMORY.md...") + temporal context ("This was last discussed 3 days ago"). If the source is >14 days old: "Note: this information is from [date] — it may be outdated."

**Partial:** state what you know + what you don't + where you looked + temporal gap ("Last mention of [topic] was [date]. No records since then.") + what might fill the gap.

**Absent:** "I checked MEMORY.md, daily logs back to [earliest date], and ran semantic search across all indexed sources. No mentions of [topic]. If discussed, it may predate capture or occurred in a session that wasn't logged."

For partial or absent responses: run `bash scripts/lib/memory-meta.sh "[topic]"` to get exact coverage before responding.

Auto-captured `.aos.md` files contain summarized per-turn memory, are indexed, and are
tracked for private GitHub backups so memory can be re-chunked and re-embedded later.
Raw transcripts are archived locally under `context/transcripts/`, but expanded chunk
lookup and raw transcript deep-search are still deferred. Do not fabricate sources.
