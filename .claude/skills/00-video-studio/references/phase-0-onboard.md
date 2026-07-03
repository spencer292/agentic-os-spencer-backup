# Phase 0 — ONBOARD (first run only)

Runs once, the first time `/00-video-studio` is invoked. Detect first run by the absence of
`projects/00-video-studio/.onboarded`.

## Steps

1. **Deps.** Run `scripts/setup.sh` (ffmpeg check + shared reframe venv + opencv/numpy). If anything
   fails, tell the user the exact install command and stop.

2. **Drive IDs.** Verify the cached IDs in `references/drive-ids.md` still resolve (one
   `get_file_metadata` on the root). If the user rebuilt the Drive, re-resolve and rewrite the file.

3. **Personal brand seed (recommended).** This lane is Roy's *personal* brand, distinct from the
   podcast. If `brand_context/voice-profile.md` doesn't already reflect the personal channel:
   - Offer to seed a lightweight personal `voice-profile` + `visual-identity` from the first one or two
     videos dropped in the Inbox (watch them, pull tone + any on-screen style).
   - This is optional — without it, clips use clean default captions/overlays. Don't block.

4. **Write `.onboarded`** with the date and the resolved Drive root ID.

5. Continue into Phase 1 for the current run.

## One-time note to the user
Explain the contract in one short message: drop a folder per piece into `1_inbox`, optionally add a
`note.txt`, run `/00-video-studio`, review the result in `3_Review`, and drag to `4_Approved` to
publish. Then proceed.
