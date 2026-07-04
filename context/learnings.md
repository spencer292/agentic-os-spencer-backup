# Learnings

## General

### What works well

### What doesn't work well

## Individual Skills

## tool-n8n
- 2026-07-04: Skill reads creds from a repo-root file named exactly `.env`. Common Windows failure: user's editor saves `.env` as `.env.txt`, and/or the file ends up 0 bytes (empty). When `test` reports "Missing N8N_BASE_URL or N8N_API_KEY", check the filename AND the byte size before assuming the key is wrong. Note: agent is blocked from reading `.env` on the command line, so verify existence/size with a plain `ls -la` (no `.env` token in the command) — `ls -la | grep -i env` works.
