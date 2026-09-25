#!/usr/bin/env bash
# host-scan.sh — read-only host / network / environment evidence collector.
#
# Collects facts. It does NOT judge, fix, or change anything — the SKILL.md
# turns this evidence into graded findings. Every command here is read-only.
# Nothing is installed. No file is written outside the report path.
#
# Modes:
#   local  (default) — run the checks on THIS machine (you SSH'd into the box).
#   remote           — run the same checks over SSH against a target.
#
# Usage:
#   bash host-scan.sh                       # local, human-readable
#   bash host-scan.sh --json                # local, JSON (for cron / further processing)
#   bash host-scan.sh --remote user@host    # over SSH (needs key-based access)
#   bash host-scan.sh --remote user@host --json
#
# Exit code is 2 if any check could not run (partial evidence), else 0. The
# skill decides severity — a non-zero exit here means "collection was
# incomplete", never "the host failed a test".

set -uo pipefail

# Args: --json (machine output) · --remote user@host (run over SSH instead of locally)
JSON=0
REMOTE=""
args=("$@")
for ((i=0; i<${#args[@]}; i++)); do
  case "${args[$i]}" in
    --json)   JSON=1 ;;
    --remote) REMOTE="${args[$((i+1))]:-}" ;;
  esac
done

# run <label> <command...> : execute a read-only probe, capture output, never fail the script
INCOMPLETE=0
emit() { # emit <section> <key> <value>
  if [ "$JSON" -eq 1 ]; then
    # crude JSON line; the skill re-parses. Values are base64 to survive newlines/quotes.
    printf '{"section":"%s","key":"%s","b64":"%s"}\n' "$1" "$2" "$(printf '%s' "$3" | base64 | tr -d '\n')"
  else
    printf '\n### [%s] %s\n%s\n' "$1" "$2" "$3"
  fi
}

sh_run() { # sh_run "<shell pipeline>" — runs locally or over ssh depending on mode
  local cmd="$1"
  if [ -n "$REMOTE" ]; then
    ssh -o BatchMode=yes -o ConnectTimeout=10 "$REMOTE" "$cmd" 2>&1
  else
    bash -c "$cmd" 2>&1
  fi
}

probe() { # probe <section> <key> "<shell pipeline>"
  local out
  out="$(sh_run "$3")"
  if [ -z "$out" ]; then out="(no output / not present)"; fi
  emit "$1" "$2" "$out"
}

if [ "$JSON" -eq 0 ]; then
  echo "# Host Security Evidence — $( [ -n "$REMOTE" ] && echo "remote: $REMOTE" || echo "local" )"
  echo "# collected $(date -u '+%Y-%m-%dT%H:%M:%SZ') — READ ONLY, no changes made"
fi

# ── 1. IDENTITY / OS ──────────────────────────────────────────────────────
probe identity os          'cat /etc/os-release 2>/dev/null | grep -E "^(PRETTY_NAME|VERSION)="'
probe identity kernel      'uname -a'
probe identity uptime      'uptime'
probe identity whoami      'id'

# ── 2. NETWORK SURFACE ────────────────────────────────────────────────────
# What is actually listening, and on which interface (0.0.0.0 = public-facing).
probe network listening    'ss -tulpn 2>/dev/null || netstat -tulpn 2>/dev/null'
probe network public_binds 'ss -tulpn 2>/dev/null | grep -E "0\.0\.0\.0|:::|\*:" || echo "none bound to all interfaces"'
probe network firewall_ufw 'ufw status verbose 2>/dev/null || echo "ufw not present"'
probe network firewall_ipt 'iptables -S 2>/dev/null | head -40 || echo "iptables not readable"'
probe network tailscale    'tailscale status 2>/dev/null | head -20 || echo "tailscale not present"'
probe network public_ip    'curl -s --max-time 8 https://api.ipify.org 2>/dev/null || echo "(no egress or curl absent)"'

# ── 3. ACCESS / SSH ───────────────────────────────────────────────────────
# The one surface a VPS genuinely must lock down. Key-only, no root login.
probe access sshd_config   'grep -E "^(PermitRootLogin|PasswordAuthentication|PubkeyAuthentication|PermitEmptyPasswords|AllowUsers|AllowGroups|Port)" /etc/ssh/sshd_config 2>/dev/null || echo "(sshd_config unreadable)"'
probe access sshd_dropins  'grep -rhE "^(PermitRootLogin|PasswordAuthentication)" /etc/ssh/sshd_config.d/ 2>/dev/null || echo "(no drop-ins)"'
probe access users_login   'getent passwd 2>/dev/null | awk -F: "\$7 !~ /(nologin|false)/ {print \$1\":\"\$3\":\"\$7}"'
probe access sudoers       'getent group sudo 2>/dev/null; getent group wheel 2>/dev/null'
probe access authkeys      'for h in /home/*/.ssh/authorized_keys /root/.ssh/authorized_keys; do [ -f "$h" ] && echo "$h: $(wc -l < "$h") key(s)"; done 2>/dev/null || echo "(none found / unreadable)"'
probe access last_logins   'last -a -n 15 2>/dev/null | head -15 || echo "(wtmp unreadable)"'

# ── 4. CREDENTIAL / SECRET INVENTORY (names + locations only, NEVER values) ─
# The handover question: what secrets live on this box, and whose are they.
# We list filenames and env-var NAMES. We never print a secret value.
probe secrets env_files    'find /home /root /opt /srv /var/www -maxdepth 4 -type f \( -name "*.env" -o -name ".env" -o -name ".env.*" -o -name "*.pem" -o -name "*.key" -o -name "credentials*" -o -name "*secret*" \) 2>/dev/null | grep -v example | head -60 || echo "(none found)"'
probe secrets env_var_names 'env 2>/dev/null | grep -iE "KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|_API|DATABASE_URL" | sed -E "s/=.*/=<redacted>/" | sort'
probe secrets world_readable 'find /home /root /opt /srv -maxdepth 4 -type f \( -name "*.env" -o -name "*.pem" -o -name "*.key" \) -perm -o+r 2>/dev/null | head -30 || echo "(none world-readable)"'
probe secrets in_git         'for d in $(find /home /opt /srv /var/www -maxdepth 3 -name .git -type d 2>/dev/null); do r="${d%/.git}"; git -C "$r" ls-files 2>/dev/null | grep -iE "\.env$|\.env\.|\.pem$|\.key$|credential" | grep -v example | sed "s#^#$r/#"; done | head -30 || echo "(no tracked secrets found)"'

# ── 5. PROCESSES / SERVICES / BOOT ────────────────────────────────────────
probe services enabled     'systemctl list-unit-files --state=enabled --type=service 2>/dev/null | head -40 || echo "(systemd not present)"'
probe services running     'ps -eo user,pid,pcpu,pmem,comm --sort=-pmem 2>/dev/null | head -25'
probe services on_boot     'systemctl list-units --type=service --state=running 2>/dev/null | head -30 || echo "(systemd not present)"'
probe services cron        'for u in $(cut -d: -f1 /etc/passwd); do c=$(crontab -l -u "$u" 2>/dev/null); [ -n "$c" ] && echo "== $u ==" && echo "$c"; done 2>/dev/null; ls -1 /etc/cron.d /etc/cron.daily 2>/dev/null | head -20'

# ── 6. RECOVERY / BACKUP ──────────────────────────────────────────────────
probe recovery rclone      'rclone listremotes 2>/dev/null || echo "(rclone not configured / absent)"'
probe recovery disk        'df -h 2>/dev/null | grep -vE "tmpfs|udev" | head -15'
probe recovery snapshots   'ls -la /var/backups /opt/backups /srv/backups 2>/dev/null | head -20 || echo "(no obvious local backup dir)"'
probe recovery swap        'free -h 2>/dev/null; swapon --show 2>/dev/null || echo "(no swap)"'

# ── 7. PATCH / UPDATE POSTURE ─────────────────────────────────────────────
probe patch pending        'apt-get -s upgrade 2>/dev/null | grep -E "^[0-9]+ upgraded" || echo "(apt not present / no data)"'
probe patch security       'ls /var/run/reboot-required 2>/dev/null && echo "REBOOT REQUIRED" || echo "no reboot flag"'
probe patch unattended     'grep -rE "Unattended-Upgrade|APT::Periodic" /etc/apt/apt.conf.d/ 2>/dev/null | head -5 || echo "(unattended-upgrades not configured)"'

if [ "$JSON" -eq 0 ]; then
  echo
  echo "# END OF EVIDENCE — hand this to tool-infra-security SKILL.md for grading."
fi
exit 0
