# install.sh Patterns

## Full Template

Adapt this template for each system. Remove sections that don't apply (e.g., no assets, no tools).

```bash
#!/bin/bash
# {System Name} Installer
#
# Usage:
#   ./install.sh                          # Fresh project in ./{system-name}/
#   ./install.sh /path/to/project         # Fresh project at specified path
#   ./install.sh --target /path/to/existing  # Add to existing project
#
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET=""
MODE="fresh"

# ─── PLATFORM DETECTION ────────────────────────────────────────────────────
OS="$(uname -s)"
case "$OS" in
  Darwin*)  PLATFORM="macos" ;;
  Linux*)   PLATFORM="linux" ;;
  MINGW*|MSYS*|CYGWIN*) PLATFORM="windows" ;;
  *)        PLATFORM="unknown" ;;
esac

# Cross-platform helpers
make_symlink() {
  local target="$1" link="$2"
  if [ "$PLATFORM" = "windows" ]; then
    if command -v cmd.exe &>/dev/null; then
      cmd.exe /c "mklink /J \"$(cygpath -w "$link")\" \"$(cygpath -w "$target")\"" 2>/dev/null || \
        cp -r "$target" "$link" 2>/dev/null || true
    else
      cp -r "$target" "$link" 2>/dev/null || true
    fi
  else
    ln -sf "$target" "$link" 2>/dev/null || true
  fi
}

make_executable() {
  [ "$PLATFORM" != "windows" ] && chmod +x "$1"
}

sed_inplace() {
  if [ "$PLATFORM" = "macos" ]; then
    sed -i '' "$@"
  else
    sed -i "$@"
  fi
}

install_hint() {
  local cmd="$1"
  case "$PLATFORM" in
    macos)   echo "brew install $cmd" ;;
    linux)   echo "apt install $cmd  # or your distro's package manager" ;;
    windows) echo "choco install $cmd  # or winget install $cmd" ;;
    *)       echo "Install $cmd via your system package manager" ;;
  esac
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      MODE="existing"
      TARGET="$2"
      shift 2
      ;;
    --force)
      FORCE=true
      shift
      ;;
    --help|-h)
      echo "{System Name} Installer"
      echo ""
      echo "Usage:"
      echo "  ./install.sh                             Fresh project in ./{system-name}/"
      echo "  ./install.sh /path/to/project            Fresh project at specified path"
      echo "  ./install.sh --target /existing/project   Add to existing project"
      echo "  ./install.sh --force --target /existing    Overwrite existing skills"
      echo ""
      exit 0
      ;;
    *)
      TARGET="$1"
      shift
      ;;
  esac
done

# Default target
if [ -z "$TARGET" ]; then
  TARGET="$(pwd)/{system-name}"
fi

echo "==> {System Name} Installer"
echo "    Mode: $MODE"
echo "    Target: $TARGET"
echo ""

# ─── FRESH MODE ─────────────────────────────────────────────────────────────

if [ "$MODE" = "fresh" ]; then
  if [ -d "$TARGET" ] && [ "$(ls -A "$TARGET" 2>/dev/null)" ]; then
    echo "ERROR: Target directory '$TARGET' already exists and is not empty."
    echo "       Use --target for existing projects, or choose a different path."
    exit 1
  fi

  echo "==> Creating project structure..."
  mkdir -p "$TARGET"/{framework-dirs,.claude/skills}
  # e.g.: mkdir -p "$TARGET"/{remotion/{compositions,data},public,.claude/skills}

  # Copy skills
  echo "==> Installing skills..."
  cp -r "$SCRIPT_DIR/skills/"* "$TARGET/.claude/skills/"

  # Render templates from entry skill's skill-pack
  echo "==> Rendering templates..."
  # SKILL_PACK="$SCRIPT_DIR/skills/{entry-skill}/skill-pack"
  # cp "$SKILL_PACK/templates/config.yaml.template" "$TARGET/config.yaml"
  # cp "$SKILL_PACK/templates/setup.sh.template" "$TARGET/setup.sh"
  # make_executable "$TARGET/setup.sh"

  # Install dependencies
  echo "==> Installing dependencies..."
  cd "$TARGET" && npm install

  echo ""
  echo "==> Installation complete!"
  echo ""
  echo "    Project: $TARGET"
  echo ""
  echo "    Quick start:"
  echo "      cd \"$TARGET\""
  echo "      claude '/{entry-skill} {example-arg}'"
  echo ""

# ─── EXISTING MODE ──────────────────────────────────────────────────────────

elif [ "$MODE" = "existing" ]; then
  if [ ! -d "$TARGET" ]; then
    echo "ERROR: Target directory '$TARGET' does not exist."
    exit 1
  fi

  # Dynamic output dir from PACKAGE.yaml
  ENTRY_SKILL=$(grep '^entry_skill:' "$SCRIPT_DIR/PACKAGE.yaml" | head -1 | sed 's/entry_skill: *//')
  OUTPUT_DIR="$TARGET/projects/${ENTRY_SKILL:-{system-name}}"

  # ── Skills ──
  echo "==> Installing skills..."
  mkdir -p "$TARGET/.claude/skills"
  for skill_dir in "$SCRIPT_DIR/skills/"*/; do
    skill_name=$(basename "$skill_dir")
    dest="$TARGET/.claude/skills/$skill_name"
    if [ -d "$dest" ] && [ "$FORCE" != "true" ]; then
      echo "    SKIP: $skill_name (already exists, use --force to overwrite)"
    else
      cp -r "$skill_dir" "$dest"
      echo "    OK: $skill_name"
    fi
  done

  # ── Output dirs ──
  mkdir -p "$OUTPUT_DIR/renders" "$OUTPUT_DIR/runs"

  # ── Templates from entry skill's skill-pack (skip if exists unless --force) ──
  # SKILL_PACK="$SCRIPT_DIR/skills/$ENTRY_SKILL/skill-pack"
  # for tmpl in "$SKILL_PACK/templates/"*.template; do
  #   [ -f "$tmpl" ] || continue
  #   base="$(basename "${tmpl%.template}")"
  #   dest="$TARGET/$base"
  #   if [ ! -f "$dest" ] || [ "$FORCE" = "true" ]; then
  #     cp "$tmpl" "$dest"
  #   fi
  # done

  echo ""
  echo "==> Installation complete!"
  echo ""
  echo "    Skills installed to: $TARGET/.claude/skills/"
  echo "    Output dir: $OUTPUT_DIR/"
  echo ""
  echo "    Setup:"
  echo "      cd \"$TARGET\" && npm install && ./setup.sh"
  echo ""
fi
```

## Key Patterns

### Prerequisites Validation

Check required system commands before doing any work. Fail fast with platform-specific install hints:

```bash
# Check prerequisites
MISSING=""
for cmd in node ffmpeg python3; do
  command -v "$cmd" &>/dev/null || MISSING="$MISSING $cmd"
done
if [ -n "$MISSING" ]; then
  echo "ERROR: Missing prerequisites:$MISSING"
  echo ""
  echo "       Install with:"
  for cmd in $MISSING; do
    echo "         $(install_hint "$cmd")"
  done
  exit 1
fi
```

Place this after argument parsing and platform detection, before any copying. Adapt the command list per system.

### .env.example Key Merging

Append missing keys from the system's `.env.example` without duplicating existing ones:

```bash
if [ -f "$TARGET/.env.example" ]; then
  while IFS= read -r line; do
    key=$(echo "$line" | grep -oE '^[A-Z_]+=' | tr -d '=')
    if [ -n "$key" ] && ! grep -q "^${key}=" "$TARGET/.env.example"; then
      echo "$line" >> "$TARGET/.env.example"
    fi
  done < "$SCRIPT_DIR/skills/$ENTRY_SKILL/skill-pack/templates/.env.example"
else
  cp "$SCRIPT_DIR/skills/$ENTRY_SKILL/skill-pack/templates/.env.example" "$TARGET/.env.example"
fi
```

### Symlink Validation

After creating symlinks, verify they resolve. Warn (don't fail) for broken links since targets may not exist until first run:

```bash
for link in "$TARGET/public/audio" "$TARGET/public/logos" "$TARGET/public/videos"; do
  if [ -L "$link" ] && [ ! -e "$link" ]; then
    echo "    WARN: Symlink $link is broken (target doesn't exist yet — will resolve on first run)"
  fi
done
```

### Config Directory Convention

System config files live inside `skills/{entry-skill}/skill-pack/config/`, co-located with the entry skill. This keeps config with the system and avoids polluting the project root. Operational config goes in `skills/{entry-skill}/skill-pack/config/sys-config.md`.

```bash
# Install config from template
SKILL_PACK="$SCRIPT_DIR/skills/$ENTRY_SKILL/skill-pack"
CONFIG_DIR="$TARGET/.claude/skills/$ENTRY_SKILL/skill-pack/config"
mkdir -p "$CONFIG_DIR"
if [ ! -f "$CONFIG_DIR/pipeline.config.yaml" ] || [ "$FORCE" = "true" ]; then
  cp "$SKILL_PACK/templates/pipeline.config.yaml.template" "$CONFIG_DIR/pipeline.config.yaml"
fi
```

Use a `_customized: false` flag in config templates. After install, check it and prompt the user:

```bash
CONFIG_FILE="$CONFIG_DIR/pipeline.config.yaml"
if [ -f "$CONFIG_FILE" ] && grep -q '_customized: false' "$CONFIG_FILE" 2>/dev/null; then
  echo "==> First-run setup needed:"
  echo "    Edit $CONFIG_FILE to set your preferences"
  echo "    The _customized flag will remind you until set to true."
fi
```

### Merge, Don't Overwrite (Existing Mode)

In existing mode, never blindly overwrite. For each file/dir:
- If it exists and `--force` is not set: skip silently or with a message
- If it doesn't exist or `--force` is set: copy

### Template Rendering

Templates use `.template` extension and live in `skills/{entry-skill}/skill-pack/templates/`. The installer copies them and strips the extension:

```bash
SKILL_PACK="$SCRIPT_DIR/skills/$ENTRY_SKILL/skill-pack"
cp "$SKILL_PACK/templates/config.yaml.template" "$TARGET/config.yaml"
```

For templates that need variable substitution, use `sed_inplace` after copying:

```bash
cp "$SKILL_PACK/templates/config.yaml.template" "$TARGET/config.yaml"
sed_inplace "s|{{ENTRY_SKILL}}|$ENTRY_SKILL|g" "$TARGET/config.yaml"
```

### Symlink Direction

Symlinks always point FROM the framework's expected path TO the output directory:

```
public/audio  ->  projects/{entry_skill}/audio   (framework expects public/audio)
public/videos ->  projects/{entry_skill}/runs     (framework expects public/videos)
```

Always use the `make_symlink` helper (handles Windows junctions and copy fallback):

```bash
make_symlink "$OUTPUT_DIR/audio" "$TARGET/public/audio"
```

### Error Handling

- `set -e` at the top — fail fast
- `2>/dev/null || true` for optional copies (assets that may not exist)
- Check directory exists before operating on it
- Clear error messages with context

### Cross-Platform Compatibility

Every system installer must work on macOS, Linux, and Windows (Git Bash / MSYS2). The platform detection block and helpers in the Full Template handle the key differences:

| Operation | macOS | Linux | Windows |
|-----------|-------|-------|---------|
| Symlinks | `ln -sf` | `ln -sf` | `mklink /J` junction, falls back to copy |
| In-place sed | `sed -i ''` | `sed -i` | `sed -i` (MSYS2) |
| Executable bit | `chmod +x` | `chmod +x` | no-op |
| Install hints | `brew install` | `apt install` | `choco install` / `winget install` |
| Path conversion | native | native | `cygpath -w` for Windows APIs |

**Rules:**
- Never use raw `ln -sf`, `chmod +x`, or `sed -i ''` — always use the helpers
- Never use raw `sed -i` without the helper — macOS requires the empty string arg
- Always include the platform detection block before argument parsing
- Print the detected platform in the installer header for debugging
- Prerequisite errors must include platform-specific install commands

### Permission Awareness

Claude Code restricts shell commands. System reference docs MUST NOT use:
- `curl` / `wget` — use Python `http.client` or `urllib.request` (stdlib)
- Inline `pip install` — only in setup.sh (user approves once)
- `rm -rf` — use safer alternatives or confirm

Document required permissions in system README so users can pre-approve.

### Tool Output Behavior

When a system wraps a CLI tool, reference docs MUST document:
- Whether `--output PATH` creates a file or a directory
- The naming convention of generated files inside output directories
- Any post-processing normalization needed
- The two-step alternative if single-command mode is unreliable

Test the tool manually once and document ACTUAL behavior, not assumed.

### Fresh vs Existing Summary

| Aspect | Fresh | Existing |
|--------|-------|----------|
| Target dir | Must not exist or be empty | Must exist |
| Skills | Copy all (includes skill-pack/ with vendor, tools, assets, config) | Skip existing (unless --force) |
| Templates | Render from `skills/{entry-skill}/skill-pack/templates/` | Skip existing (unless --force) |
| Dependencies | Auto-install (npm, pip) | Manual step in echo message |
| Output dirs | Not needed yet | Create `renders/`, `runs/` |
