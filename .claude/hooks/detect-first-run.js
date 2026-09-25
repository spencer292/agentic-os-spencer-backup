#!/usr/bin/env node
// SessionStart hook — auto-detects a first-run client whose brand voice is not
// yet set up, and fires the /start-here onboarding automatically without the
// user having to type the command. Mirrors the Session Type Detection guard in
// CLAUDE.md and the Guard in .claude/commands/start-here.md: "not set up" means
// brand_context/ is absent OR contains no populated .md files.
//
// Emits context the same way load-memory-snapshot.js does:
//   hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext }
//
// Fire-and-forget — never throws, never blocks session start. If brand voice is
// already configured it emits nothing (no nag, no false trigger).

const fs = require('fs');
const os = require('os');
const path = require('path');

function hasSavedTeamContext() {
  try {
    const dir = process.env.AGENTIC_OS_TEAM_CONFIG_DIR
      ? path.resolve(process.env.AGENTIC_OS_TEAM_CONFIG_DIR)
      : path.join(os.homedir(), '.agentic-os');
    const parsed = JSON.parse(fs.readFileSync(path.join(dir, 'team-context.json'), 'utf8'));
    return (
      parsed &&
      typeof parsed === 'object' &&
      /^https?:\/\//i.test(typeof parsed.apiUrl === 'string' ? parsed.apiUrl.trim() : '') &&
      typeof parsed.token === 'string' &&
      parsed.token.trim() !== ''
    );
  } catch {
    return false;
  }
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  try {
    if (
      process.env.AGENTIC_OS_WORK_MODE === 'team' ||
      process.env.AGENTIC_OS_TEAM_ENRICHMENT === 'conversation_only' ||
      process.env.AGENTIC_OS_CONTEXT_OVERLAY_DIR ||
      hasSavedTeamContext()
    ) {
      process.exit(0);
    }

    let data = {};
    try {
      data = JSON.parse(input);
    } catch {
      // No JSON input — fall back to env / cwd
    }

    const cwd = data.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();

    // A brand_context/ is "populated" if it exists and holds at least one .md
    // file with real (non-whitespace) content. Templates with only headers are
    // still considered set up if they carry text — matching the start-here Guard
    // which checks for populated .md files (ls, not deep parse).
    function isFirstRun(dir) {
      const brandDir = path.join(dir, 'brand_context');
      if (!fs.existsSync(brandDir)) return true;
      let entries = [];
      try {
        entries = fs.readdirSync(brandDir);
      } catch {
        return true;
      }
      const mdFiles = entries.filter((f) => f.toLowerCase().endsWith('.md'));
      if (mdFiles.length === 0) return true;
      for (const f of mdFiles) {
        try {
          const content = fs.readFileSync(path.join(brandDir, f), 'utf8').trim();
          if (content.length > 0) return false; // populated → already set up
        } catch {
          // unreadable file — ignore, keep checking
        }
      }
      return true; // .md files exist but all empty → still first-run
    }

    if (!isFirstRun(cwd)) {
      process.exit(0); // already configured — emit nothing
    }

    const message =
      `# First run detected — begin onboarding now\n\n` +
      `No populated \`brand_context/\` was found, so this client's brand voice is ` +
      `not set up yet. Run the \`/start-here\` onboarding flow now — do NOT wait ` +
      `for the user to type \`/start-here\`. Follow ` +
      `\`.claude/commands/start-here.md\` First-Run Mode from the top (GitHub ` +
      `backup check → project scan + intro → the core questions, one at a time). ` +
      `Greet the user, give the brief intro, and ask the first question.`;

    const output = {
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: message,
      },
    };

    process.stdout.write(JSON.stringify(output));
  } catch {
    // Fire-and-forget — never corrupt the JSON contract, never block startup.
    process.exit(0);
  }
});

// Safety net — if stdin never delivers, exit silently after a few seconds
setTimeout(() => process.exit(0), 4000).unref();
