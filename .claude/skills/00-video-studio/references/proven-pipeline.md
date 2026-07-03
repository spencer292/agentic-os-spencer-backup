# Proven Pipeline — how the studio lane actually runs

This is the source-of-truth for the working flow, validated 2026-06-14 on two real
pieces (a talking-head scam-warning short + the Spencer racing film). It supersedes
any earlier MCP-based assumptions in the phase files.

## I/O — use the Drive-for-Desktop mount, NOT MCP base64

`31_Studio` lives on a **Shared Drive** mounted locally by Google Drive for Desktop:

```
/G/Shared drives/Elevate 360/31_Studio/{1_inbox,2_processing,3_Review,4_Approved,5_Posted,6_Assets}
```

- **Read** source straight off the mount; **process locally** in
  `projects/00-video-studio/runs/{date}_{job}/`; **write** the finished clip into
  `3_Review/{date}_{job}/` on the mount — it auto-syncs to Drive. No uploads, no
  base64 (a 277 MB MOV through the MCP download tool would blow up context).
- **Drive streams on demand** → the first `ffprobe`/`ffmpeg` on an un-hydrated file
  fails with "No such file". **Copy the whole inbox job folder local first**
  (`cp "$D"/* run/source/`) to force hydration, then work on the local copy.

## Scripts (all stdlib / ffmpeg — no pip needed except highlight)

| Script | Does | Notes |
|--------|------|-------|
| `transcribe_assemblyai.py` | audio → word-level JSON + SRT + txt | AssemblyAI. Reads `ASSEMBLYAI_API_KEY` from `.env` internally (never on CLI — the secrets guard blocks `.env` on the command line). |
| `smart_cut.py` | phrase-anchored cut of a talking-head clip | give it keep-segments by start/end phrase; drops the filler between. Re-transcribe the CUT for caption alignment. |
| `assemble_reel.py` | ordered plan (videos+photos) → one 9:16 reel | cover-crop normalises ANY orientation, Ken-Burns photos, `duck:true` sidechains music under voice/engine. Pure ffmpeg — works without the venv. |
| `highlight_select.py` | motion+audio peak picks for silent action footage | needs opencv (`.venv-studio`, pip-gated) — UNTESTED as of 2026-06-14. |
| `elevenlabs_music.cjs` | generate a music bed | Eleven Music `POST /v1/music`, `music_length_ms`. Reads `ELEVENLABS_API_KEY` internally. |
| `zernio_accounts.cjs` | list connected Zernio accounts | read-only; discover platform→accountId. |
| `zernio_post.cjs` | upload clip + 1 tailored draft per platform | Phase 6. See posting gotchas below. |
| `zernio_publish.cjs` | flip EXISTING drafts live, in place (no re-upload, no dupes) | Phase 6. `--match`/`--ids`, `--book`, `--in`. See flip gotcha below. |

## Talking-head flow (proven on the scam short)

1. Probe orientation. **iPhone/Samsung videos carry rotation metadata** → ffmpeg
   auto-rotates on decode, so a "1920×1080 rot=-90" clip is really vertical → no
   reframe needed, just trim + caption.
2. `transcribe_assemblyai.py` on the master → words.
3. `smart_cut.py` with phrase anchors → tight cut (dropped ~41 s of filler on the scam clip).
4. Re-transcribe the **cut** (hard rule — padding drifts timings).
5. Captions: convert AssemblyAI words (`text`→`word`) and feed the L2S
   `captions_from_words.py --kinetic` (gold word-highlight), then burn with the
   `ass` filter + progress bar. Lower-third (`--alignment 2 --margin-v ~360`) to clear the face.

## Assembly / voice-driven flow (proven on the Spencer film)

1. Inventory: copy local, build contact sheets to SEE content (`hstack` strips —
   this ffmpeg has **no glob tiling** and **broken drawtext fontconfig**; use ASS
   for text, `%0Nd`/`hstack` for montages).
2. Mine the words: transcribe the talking clips → pick the spoken spine/hook.
3. Author `plan.json` (ordered video segments + photos; `mute:false` on voice/engine
   clips, `mute:true` on montage; `duck:true`, `music`, `music_gain_db`).
4. `assemble_reel.py` → base concat + sidechain-ducked music (voice up, music swells in gaps).
5. Overlay pass — **always** `scripts/brand_overlay.py` (the brand convention, see
   `references/brand-overlay.md`): BN Dime Display lower-third title (controlled size, off the face),
   corner ATP mark through the body, and a clean **Night Sky brand END CARD** (logo centred + tagline
   in Light Green) so the brand lands. Talking-head clips ending on a spoken payoff can pass
   `--corner-only`.
6. QC frames → place in `3_Review`.

## Posting (Phase 6) — Zernio = getlate.dev

- **No MCP, no curl.** Zernio MCP isn't connected this environment and `curl` is denied.
  Post via **Node** (`zernio_post.cjs`) against the REST API (`https://getlate.dev/api/v1`).
- **Upload gotcha:** the corporate **TLS-inspection proxy intermittently corrupts large
  uploads** ("bad record mac" / "other side closed") — risk rises with size. Fix baked in:
  **compress to ~8 MB** (`crf 31 -maxrate 650k`) AND **retry the R2 PUT with a fresh
  presign** (poster retries 6×). Use the core `https` module, explicit `Content-Length`.
- Default `--mode draft` (review in Zernio UI, then publish). `schedule`/`now` also supported.
- Skip ad accounts (`googleads`, `metaads`, `tiktokads`) — organic only.
- **Flipping drafts live (`zernio_publish.cjs`):** `publishNow` is only honoured on *create*, and
  there is **no publish endpoint** (`/posts/{id}/publish` → 404). The working flip is
  `PUT /posts/{id}` with `scheduledFor` + `isDraft:false` → status `scheduled`; the scheduler fires
  it. So "publish now" = schedule ~5 min out (API min +2). GET/PUT wrap the post as `{post:{…}}` and
  return `accountId` as an object — normalise to its `_id` string before PUT. First comments are
  API-reliable only on `linkedin/instagram/facebook/youtube` (validated 2026-06-14, scam short live
  across all 7 platforms). Proven on the scam short.

## Known cleanup
- Empty duplicate inbox folders (`scam-warning`, `spencer-racing` lowercase) — created
  by an early MCP `create_file`; use Roy's capitalised folders. Remove the dupes.
