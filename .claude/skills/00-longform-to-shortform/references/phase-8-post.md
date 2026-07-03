# Phase 8: POST

Reference: `.claude/skills/mkt-short-form-posting/SKILL.md`

For content packaging and platform-specific formatting, the orchestrator dispatches the content-packager sub-agent. See `.claude/agents/l2s-content-packager.md` for the full agent definition.

The orchestrator handles mode selection (skip/draft/auto-post) and passes the mode to the sub-agent.

Controlled by `publishing.mode` in config:

```bash
PHASE_START=$(date +%s)
```

## Mode: `skip`
Log "Publishing skipped per config" and finish.

## Mode: `draft`
For each rendered clip:
1. Generate content package (title, description, hashtags) per platform
2. Create draft in Zernio for each configured platform
3. Log the Zernio dashboard URLs for manual review

## Mode: `auto-post`
For each rendered clip:
1. Generate platform-specific content packages:
   - **YouTube Shorts:** Title (<=60 chars), description, tags
   - **Instagram Reels:** Caption with hashtags (<=2200 chars)
   - **TikTok:** Description with hashtags (<=2200 chars)
2. Upload video to Zernio storage
3. Create and publish posts to each configured platform
4. Log post URLs

```bash
PHASE_END=$(date +%s)
echo "Phase 8 POST: $((PHASE_END - PHASE_START))s" >> "$RUN_DIR/phase-timings.txt"
```

## Timing Summary

After Phase 8 completes (or after the last phase that runs), write the timing summary to `pipeline-log.md`:

```bash
# Read all phase timings and format as a table
echo "" >> "$RUN_DIR/pipeline-log.md"
echo "## Timing Summary" >> "$RUN_DIR/pipeline-log.md"
echo "| Phase | Duration | Notes |" >> "$RUN_DIR/pipeline-log.md"
echo "|-------|----------|-------|" >> "$RUN_DIR/pipeline-log.md"

TOTAL=0
while IFS= read -r line; do
  PHASE_NAME=$(echo "$line" | cut -d: -f1)
  SECONDS=$(echo "$line" | grep -o '[0-9]*s' | grep -o '[0-9]*')
  NOTES=$(echo "$line" | cut -d: -f2- | sed 's/^ *//')
  MINS=$((SECONDS / 60))
  SECS=$((SECONDS % 60))
  TOTAL=$((TOTAL + SECONDS))
  printf "| %s | %d:%02d | %s |\n" "$PHASE_NAME" "$MINS" "$SECS" "$NOTES" >> "$RUN_DIR/pipeline-log.md"
done < "$RUN_DIR/phase-timings.txt"

TOTAL_MINS=$((TOTAL / 60))
TOTAL_SECS=$((TOTAL % 60))
printf "| **Total** | **%d:%02d** | |\n" "$TOTAL_MINS" "$TOTAL_SECS" >> "$RUN_DIR/pipeline-log.md"
```
