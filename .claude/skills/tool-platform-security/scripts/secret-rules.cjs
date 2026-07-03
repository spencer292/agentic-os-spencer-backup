'use strict';
/**
 * Shared secret-detection ruleset for tool-platform-security.
 * Used by both the working-tree scanner and the git-history scanner so the
 * two stay in lockstep. No external dependencies — pure Node.
 *
 * Design notes:
 * - Every finding is REDACTED before it leaves this module. We never want a
 *   real secret written into a report that then lands in projects/ (and maybe
 *   git). The point of the audit is to flag the leak, not re-leak it.
 * - Placeholder values (your_key_here, ${VAR}, process.env.X, xxxx) are
 *   filtered out so the report is signal, not noise.
 * - Callers can suppress a line with an inline `security-ok` / `pragma:
 *   allowlist secret` comment, or whole paths via .security-allowlist.txt.
 */

// --- High-confidence, provider-specific patterns -------------------------
// These match a known token shape, so they rarely false-positive.
const PROVIDER_RULES = [
  { id: 'aws-access-key-id',     severity: 'high', re: /\bAKIA[0-9A-Z]{16}\b/g, label: 'AWS Access Key ID' },
  { id: 'aws-secret-access-key', severity: 'high', re: /\baws_secret_access_key\b["'\s:=]{1,5}([A-Za-z0-9/+]{40})\b/gi, label: 'AWS Secret Access Key' },
  { id: 'google-api-key',        severity: 'high', re: /\bAIza[0-9A-Za-z\-_]{35}\b/g, label: 'Google API key (Gemini / Maps / etc.)' },
  { id: 'gcp-oauth-secret',      severity: 'high', re: /\bGOCSPX-[0-9A-Za-z\-_]{20,}\b/g, label: 'Google OAuth client secret' },
  { id: 'notion-token',          severity: 'high', re: /\b(?:secret_[A-Za-z0-9]{43}|ntn_[A-Za-z0-9]{40,})\b/g, label: 'Notion integration token' },
  { id: 'slack-token',           severity: 'high', re: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g, label: 'Slack token' },
  { id: 'slack-webhook',         severity: 'high', re: /https:\/\/hooks\.slack\.com\/services\/T[0-9A-Z]+\/B[0-9A-Z]+\/[0-9A-Za-z]+/g, label: 'Slack incoming webhook' },
  { id: 'stripe-secret-key',     severity: 'high', re: /\b(?:sk|rk)_live_[0-9a-zA-Z]{20,}\b/g, label: 'Stripe live secret key' },
  { id: 'openai-key',            severity: 'high', re: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g, label: 'OpenAI API key' },
  { id: 'anthropic-key',         severity: 'high', re: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g, label: 'Anthropic API key' },
  { id: 'github-pat',            severity: 'high', re: /\b(?:ghp|gho|ghu|ghs|ghr)_[0-9A-Za-z]{36}\b/g, label: 'GitHub personal access token' },
  { id: 'github-fine-pat',       severity: 'high', re: /\bgithub_pat_[0-9A-Za-z_]{60,}\b/g, label: 'GitHub fine-grained PAT' },
  { id: 'sendgrid-key',          severity: 'high', re: /\bSG\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g, label: 'SendGrid API key' },
  { id: 'twilio-key',            severity: 'high', re: /\bSK[0-9a-fA-F]{32}\b/g, label: 'Twilio API key SID' },
  { id: 'private-key-block',     severity: 'high', re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/g, label: 'Private key block' },
  { id: 'jwt',                   severity: 'medium', re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, label: 'JWT (may carry credentials/claims)' },
];

// --- Generic assignment pattern ------------------------------------------
// Catches `apiKey = "...."`, `password: '....'`, `token=".."` etc. Higher
// false-positive rate, so it runs through stronger placeholder filtering and
// a length/charset floor.
const GENERIC_RULE = {
  id: 'generic-assigned-secret',
  severity: 'medium',
  label: 'Hardcoded credential (generic key/secret/token/password assignment)',
  // group 1 = the quoted value
  re: /\b(?:api[_-]?key|apikey|secret|client[_-]?secret|access[_-]?token|refresh[_-]?token|auth[_-]?token|password|passwd|pwd|private[_-]?key|bearer)\b\s*[:=]\s*["'`]([^"'`]{8,})["'`]/gi,
};

const PLACEHOLDER_RE = /^(?:your[_-]?|my[_-]?|the[_-]?|some[_-]?|example|sample|test|dummy|fake|changeme|placeholder|redacted|xxx+|\*+|\.\.\.|<.*>|\$\{.*\}|\{\{.*\}\}|process\.env|os\.environ|import\.meta\.env)/i;

function isPlaceholder(value) {
  const v = String(value).trim();
  if (v.length < 8) return true;
  if (PLACEHOLDER_RE.test(v)) return true;
  if (/^(?:true|false|null|undefined|none)$/i.test(v)) return true;
  // env-var references like ${FOO} or process.env.FOO anywhere
  if (/\$\{?\w+\}?$/.test(v) || /process\.env\.\w+/.test(v) || /os\.environ/.test(v)) return true;
  // obviously non-secret words (all letters, dictionary-ish, no digits/symbols)
  if (/^[a-z]+$/i.test(v) && v.length < 16) return true;
  return false;
}

function redact(value) {
  const v = String(value);
  if (v.length <= 8) return v[0] + '***' + v[v.length - 1];
  return v.slice(0, 4) + '…' + '*'.repeat(Math.min(8, v.length - 8)) + '…' + v.slice(-4);
}

function lineHasInlineAllow(lineText) {
  return /(?:security-ok|pragma:\s*allowlist secret|gitleaks:allow|nosec)/i.test(lineText);
}

/**
 * Scan a blob of text for secrets.
 * @param {string} text
 * @param {object} [opts]
 * @param {string} [opts.filename] - for context in findings
 * @returns {Array<{rule,severity,label,line,match,context}>}
 */
function scanText(text, opts = {}) {
  const findings = [];
  if (!text || typeof text !== 'string') return findings;
  const lines = text.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.length > 2000) continue;       // skip blank / minified-ish lines
    if (lineHasInlineAllow(line)) continue;

    // Provider-specific rules — match the whole token
    for (const rule of PROVIDER_RULES) {
      rule.re.lastIndex = 0;
      let m;
      while ((m = rule.re.exec(line)) !== null) {
        const value = m[1] || m[0];
        if (rule.id !== 'private-key-block' && isPlaceholder(value)) continue;
        findings.push(mkFinding(rule, i + 1, value, line, opts));
      }
    }

    // Generic assignment rule — value is group 1
    GENERIC_RULE.re.lastIndex = 0;
    let g;
    while ((g = GENERIC_RULE.re.exec(line)) !== null) {
      const value = g[1];
      if (isPlaceholder(value)) continue;
      // de-dupe: skip if a provider rule already flagged this exact value on this line
      if (findings.some(f => f.line === i + 1 && f.rawLen === value.length && f._raw === value)) continue;
      findings.push(mkFinding(GENERIC_RULE, i + 1, value, line, opts));
    }
  }
  return findings;
}

function mkFinding(rule, lineNo, value, lineText, opts) {
  return {
    rule: rule.id,
    severity: rule.severity,
    label: rule.label,
    file: opts.filename || null,
    line: lineNo,
    match: redact(value),
    rawLen: value.length,
    _raw: value,                                   // internal only — never serialized to report
    context: lineText.trim().slice(0, 200).replace(value, redact(value)),
  };
}

module.exports = { scanText, redact, isPlaceholder, PROVIDER_RULES, GENERIC_RULE };
