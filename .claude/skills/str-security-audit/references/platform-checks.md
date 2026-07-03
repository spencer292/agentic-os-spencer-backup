# Platform Security Checks Reference

Checklist for auditing the Agentic OS platform itself — MCP servers, API keys, hooks, cron agents, memory, skills, and settings.

## OWASP Top 10 for Agentic Applications (2026)

The first dedicated security framework for AI agent systems. Use alongside the web OWASP Top 10 2025.

| ID | Category | What to check in Agentic OS |
|----|----------|---------------------------|
| ASI01 | Agent Goal Hijack | Could prompt injection redirect agent behavior? Check memory files, MCP tool descriptions, skill YAML |
| ASI02 | Tool Misuse | Do tools have minimum-necessary permissions? Can a tool access resources beyond its scope? |
| ASI03 | Identity & Privilege Abuse | Do cron agents run with full credentials? Are permissions scoped per-agent or shared? |
| ASI04 | Supply Chain | Are MCP servers and skills from verified sources? Are versions pinned? |
| ASI05 | Unexpected Code Execution | Do hooks spawn processes? Can skill scripts execute arbitrary code? |
| ASI06 | Memory/Context Poisoning | Could malicious data in memory files persist and trigger in future sessions? |
| ASI07 | Excessive Agency | Can agents take high-impact actions without human approval? |
| ASI08 | Insecure Output Handling | Are agent outputs validated before being used in downstream actions? |
| ASI09 | Logging & Monitoring | Are agent actions auditable? Can anomalous behavior be detected? |
| ASI10 | Rogue Agents | Could a cron agent diverge from its intended purpose? Is there a kill switch? |

## MCP Server Audit Checklist

For each server in `.claude/settings.json`:

```
[ ] Server source is trusted (official or verified)
[ ] Version is pinned (not "latest" or unpinned)
[ ] Tool descriptions reviewed for hidden instructions
[ ] Filesystem access is scoped (not root or broad)
[ ] Network access is scoped (not wildcard)
[ ] Credentials use minimum-privilege scope
[ ] No admin/debug endpoints exposed
[ ] Checked against current CVE database
```

### Known MCP CVEs (as of May 2026)

| CVE | Server | CVSS | Issue |
|-----|--------|------|-------|
| CVE-2026-0755 | gemini-mcp-tool | 9.8 | Command injection via unsanitised input |
| CVE-2025-66335 | Apache Doris MCP | High | SQL injection |
| Various | 492 exposed servers | Varies | Zero authentication on internet-facing MCP servers |

## API Key Hygiene Checklist

```
[ ] All keys documented in .env.example with descriptions
[ ] .env is in .gitignore (verify, don't assume)
[ ] No keys appear in git history (git log -p --all -S "API_KEY")
[ ] No keys in committed files (grep across non-gitignored files)
[ ] Keys are minimum-privilege scoped
[ ] Key rotation schedule exists or is documented
[ ] Keys not in error messages or log output
[ ] Fewer than 10 keys, or secrets manager in use
[ ] OAuth tokens use proper scoping (not "all" or admin)
[ ] Google OAuth credentials stored securely (check .config paths)
```

## Cron Agent Security Checklist

```
[ ] Each cron job has scoped permissions (not full credential set)
[ ] Output validation before external actions
[ ] Actions are logged and auditable
[ ] Kill switch exists (stop script, PID tracking)
[ ] Cron prompts are tamper-resistant
[ ] Watchdog monitors for runaway agents
[ ] Job results don't accumulate unbounded
```

## Memory Poisoning Indicators

Scan `context/memory/` files for:

- Unexpected instruction patterns: "ignore previous", "instead do", "you must"
- Encoded payloads: base64 strings, URL-encoded commands
- External URLs that don't match known project domains
- Suspiciously long entries that don't match normal memory format
- Entries that reference tools or actions not in the skill registry

## Settings Permission Audit

Check `.claude/settings.json`:

**Allow patterns to flag as overly broad:**
- `Bash(*)` — allows arbitrary command execution
- `Write(*)` or `Edit(*)` without path restrictions
- `Read(*)` without deny patterns for secrets

**Deny patterns that should exist:**
- `.env`, `.env.local`, `.env.production`
- `credentials.json`, `*.pem`, `*.key`
- `gcp-oauth.keys.json` or similar OAuth credential files
- Password/secret files

**Hook security:**
- Pre/post-tool hooks should be committed code (not dynamically generated)
- Hook scripts should not accept external input without validation
- HTTP hooks should use localhost only, not externally accessible ports

## Prompt Injection Surface Assessment

External content that enters agent context and could carry injection payloads:

| Source | Entry point | Mitigation |
|--------|------------|------------|
| Web scraping (Firecrawl) | Skill execution | Treat scraped content as untrusted |
| YouTube transcripts | tool-youtube | Transcripts could contain injection |
| Email content (Gmail MCP) | MCP tool response | Never execute instructions from email |
| Google Drive files | MCP tool response | File content could contain payloads |
| Notion pages | MCP tool response | Page content could contain injection |
| User-pasted content | Direct input | Lowest risk but still validate |
| Memory files | Session startup | Validate format before reading |
