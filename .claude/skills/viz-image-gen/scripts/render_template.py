#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "playwright>=1.40.0",
# ]
# ///
"""
Render an HTML/CSS carousel template to PNG using Playwright + headless Chromium.

Stage 2 — pool mode is the only supported mode. The legacy
`--template <family>/<page>` form is retained in argparse for in-flight
back-compat but the template families themselves were moved to
`viz-image-gen/references/templates/_archive/`.
Use the pool flow:

    uv run render_template.py \\
      --template-pool linkedin-carousel \\
      --template-id hero-typographic \\
      --output ./slide-01.png \\
      --data '{"HEADLINE": "The 4 ideas that ship.", "SLIDE_N": 1, "SLIDE_TOTAL": 7}' \\
      --brand-kit '<json or path>'

The pool flow reads the pool's manifest.json from
`brand_context/templates/<pool>/manifest.json` (per-brand only; no fallback),
resolves the HTML file (including cross-folder `../family/file.html` imports),
loads the pool's _shared/styles.css (or per-entry override) automatically, and
supports Mustache sections in the template ({{#X}}…{{/X}}, {{^X}}…{{/X}},
{{.}} inside list sections).

First-time setup:
    uv run playwright install chromium
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = SCRIPT_DIR.parent / "references" / "templates"


def load_env_file(env_path: Path) -> None:
    """Parse .env into os.environ so subprocess.run(generate_image_*.py) inherits API keys.
    Without this, FULL_AI / Case B / Case C renders fail with "No API key provided"
    because uv-run subprocesses spawn with a clean env."""
    import os
    if not env_path.is_file():
        return
    for line in env_path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        k = k.strip()
        v = v.strip().strip('"').strip("'")
        if k and k not in os.environ:
            os.environ[k] = v


def find_project_root(start: Path) -> Path:
    for c in [start, *start.parents]:
        if c.name == ".claude":
            continue
        if (c / ".claude").is_dir():
            return c
    return Path.cwd()


def resolve_pool_dir(pool: str, brand_context: Path | None = None) -> Path:
    """Return the directory holding the pool's templates.

    Stage 2 — pool mode universal. Looks in:
        - {brand_context}/templates/<pool>/  when brand_context override is supplied
        - <project_root>/brand_context/templates/<pool>/  by default

    The legacy viz-image-gen/references/templates/ fallback was removed.
    Per-brand customization is the only mode now; missing pool → loud failure.
    """
    if brand_context is not None:
        brand_pool = brand_context / "templates" / pool
    else:
        project_root = find_project_root(SCRIPT_DIR)
        brand_pool = project_root / "brand_context" / "templates" / pool
    if not (brand_pool / "manifest.json").is_file():
        raise SystemExit(
            f"ERROR: template pool '{pool}' not found at {brand_pool}. "
            f"Build it via /mkt-visual-identity Templates mode, or copy a default pool "
            f"from .claude/skills/viz-image-gen/references/templates/_archive/ as a starting point."
        )
    return brand_pool


def build_brand_tokens_css(brand_kit: dict, target_canvas: dict | None = None) -> str:
    """Convert a brand_kit dict into CSS custom property overrides.

    BRAND WINS RULE — the brand's own fonts + colors (from tokens.json) MUST drive
    the rendered output, not the template's hardcoded defaults. element-subtypes.css
    uses `var(--type-display-family, "Fraunces", serif)` etc., so this function MUST
    emit the brand's actual family names; otherwise the CSS falls back to whatever
    the template author hardcoded.

    Reads v3 tokens.json schema:
      - fonts.{display,body,micro,headline}.{family,weight,style}
      - colors.{accent,bg_dark,bg_light,text_on_dark,text_on_light,muted_*,primary,background,text,accents[]}
      - type_scale.{h1,h2,subtitle,body,caption,micro}  (top-level, NOT nested under tokens.* — v3 schema)
      - canvas.{width,height}

    Legacy schema (fonts.headline_family, colors.text, accents[]) is also honored
    as a fallback so older brand_context dirs keep rendering.
    """
    colors = brand_kit.get("colors", {}) or {}
    accents = colors.get("accents") or []
    fonts = brand_kit.get("fonts", {}) or {}
    ts = brand_kit.get("type_scale", {}) or (brand_kit.get("tokens", {}) or {}).get("type_scale", {}) or {}
    canvas = brand_kit.get("canvas", {}) or (brand_kit.get("tokens", {}) or {}).get("grid", {}) or {}
    sp = (brand_kit.get("tokens", {}) or {}).get("spacing", {}) or brand_kit.get("spacing", {}) or {}

    # ── Format scale (SAFE-BY-DEFAULT) ───────────────────────────────────────
    # The brand's type/space px are "designed at" the brand canvas (reference).
    # When rendering a different output_format the caller passes its `target_canvas`.
    # We scale by the **smaller (limiting) dimension**, NOT by width — because
    # scaling by width alone overflows when the aspect ratio flips (4:5 portrait →
    # 16:9 landscape shrinks the height while growing the type). Tracking the
    # limiting dimension means anything that fit at the reference still fits — it
    # never overflows. The standard social formats all share a 1080 short side, so
    # this yields scale 1.0 for them (type stays a consistent, safe absolute size);
    # it only scales up for genuinely higher-res canvases (e.g. 2x retina).
    # Growing type to fill extra room on a wider canvas is a DELIBERATE per-pool
    # override applied after a visual review — not an automatic guess.
    # `line_height` (unitless) + `letter_spacing` (em) are relative → NOT scaled.
    def _min_dim(c):
        if not isinstance(c, dict):
            return None
        dims = [d for d in (c.get("width"), c.get("height")) if isinstance(d, (int, float)) and d > 0]
        return min(dims) if dims else None

    ref_dim = _min_dim(canvas) or 1080
    tgt_canvas = target_canvas if (isinstance(target_canvas, dict) and target_canvas.get("width")) else canvas
    tgt_dim = _min_dim(tgt_canvas) or ref_dim
    scale = (tgt_dim / ref_dim) if ref_dim else 1.0

    def _spx(v):
        """Scale a px value by the format factor; emit an int when whole."""
        try:
            n = float(v) * scale
        except (TypeError, ValueError):
            return None
        return f"{int(round(n))}px"

    pairs = []

    # ── Colors (v3 schema first, then legacy fallbacks) ────────────────────
    color_map = {
        "--brand-bg-dark":       colors.get("bg_dark") or colors.get("background") or colors.get("primary"),
        "--brand-bg-light":      colors.get("bg_light") or colors.get("background"),
        "--brand-background":    colors.get("background") or colors.get("bg_light") or colors.get("bg_dark"),
        "--brand-primary":       colors.get("primary") or colors.get("bg_dark"),
        "--brand-secondary":     colors.get("secondary") or colors.get("accent_secondary"),
        "--brand-accent":        colors.get("accent") or (accents[0] if accents else None),
        "--brand-accent-2":      colors.get("accent_secondary") or (accents[1] if len(accents) > 1 else None),
        "--brand-text":          colors.get("text") or colors.get("text_on_light") or colors.get("primary"),
        "--brand-text-on-dark":  colors.get("text_on_dark") or colors.get("bg_light"),
        "--brand-text-on-light": colors.get("text_on_light") or colors.get("bg_dark") or colors.get("primary"),
        "--brand-muted-on-dark": colors.get("muted_on_dark"),
        "--brand-muted-on-light":colors.get("muted_on_light") or colors.get("neutral_dark"),
    }
    for css_name, val in color_map.items():
        if val:
            pairs.append(f"{css_name}: {val};")

    # ── Fonts (BRAND WINS — these override template hardcoded families) ────
    # v3 schema: fonts.{role}.family. Legacy: fonts.headline_family / body_family.
    def _font_family_for(role: str, legacy_key: str | None = None, fallback_quoted: str = "") -> str | None:
        role_cfg = fonts.get(role)
        if isinstance(role_cfg, dict) and role_cfg.get("family"):
            fam = role_cfg["family"]
        elif legacy_key and fonts.get(legacy_key):
            fam = fonts[legacy_key]
        else:
            return None
        # Wrap in quotes (CSS requires for multi-word family names)
        quoted = f'"{fam}"'
        return f"{quoted}, {fallback_quoted}" if fallback_quoted else quoted

    display_fam = _font_family_for("display", "headline_family", '"Fraunces", "Playfair Display", Georgia, serif')
    body_fam    = _font_family_for("body",    "body_family",     '"Inter", system-ui, sans-serif')
    micro_fam   = _font_family_for("micro",   None,              '"Inter", system-ui, sans-serif')

    if display_fam:
        # Multiple var names so different element classes can pick the right one
        pairs.append(f"--type-display-family: {display_fam};")
        pairs.append(f"--font-display: {display_fam};")
    if body_fam:
        pairs.append(f"--type-body-family: {body_fam};")
        pairs.append(f"--font-body: {body_fam};")
    if micro_fam:
        pairs.append(f"--type-micro-family: {micro_fam};")

    # Font weights/styles (so display-italic gets the brand's specified weight)
    for role, prefix in [("display", "--type-display"), ("body", "--type-body"), ("micro", "--type-micro")]:
        role_cfg = fonts.get(role) or {}
        if isinstance(role_cfg, dict):
            if role_cfg.get("weight"):
                pairs.append(f"{prefix}-weight: {role_cfg['weight']};")
            if role_cfg.get("style"):
                pairs.append(f"{prefix}-style: {role_cfg['style']};")

    # ── Type scale ─────────────────────────────────────────────────────────
    # v3 schema: type_scale.{role} = {size, line_height, letter_spacing} (nested).
    # Legacy schema: type_scale.{role} = <px scalar>. Handle BOTH.
    # (Before this, a nested dict was stringified into an invalid CSS value, so the
    #  brand's type SIZES silently fell back to the template's hardcoded defaults —
    #  only fonts/colors actually "won". line_height/letter_spacing were dropped too.)
    for k_kit, k_css in [
        ("display", "--type-display"), ("h1", "--type-h1"), ("h2", "--type-h2"),
        ("h3", "--type-h3"), ("subtitle", "--type-subtitle"),
        ("body", "--type-body"), ("body_l", "--type-body-l"),
        ("body_m", "--type-body-m"), ("body_s", "--type-body-s"),
        ("caption", "--type-caption"), ("micro", "--type-micro"),
    ]:
        if k_kit not in ts:
            continue
        entry = ts[k_kit]
        size = entry.get("size") if isinstance(entry, dict) else entry
        if size is not None:
            css_size = _spx(size)
            if css_size:
                pairs.append(f"{k_css}: {css_size};")
        if isinstance(entry, dict):
            if entry.get("line_height") is not None:
                pairs.append(f"{k_css}-line-height: {entry['line_height']};")
            if entry.get("letter_spacing"):
                pairs.append(f"{k_css}-letter-spacing: {entry['letter_spacing']};")

    # ── Spacing (v3 nested `spacing.scale` OR legacy flat) — scaled ──────────
    sp_scale = sp.get("scale") if (isinstance(sp, dict) and isinstance(sp.get("scale"), dict)) else sp
    if isinstance(sp_scale, dict):
        for token, css_name in [
            ("2xs", "--space-2xs"), ("xs", "--space-xs"), ("sm", "--space-sm"),
            ("md", "--space-md"), ("lg", "--space-lg"), ("xl", "--space-xl"),
            ("2xl", "--space-2xl"), ("3xl", "--space-3xl"), ("4xl", "--space-4xl"),
            ("5xl", "--space-5xl"),
        ]:
            if token in sp_scale:
                css_val = _spx(sp_scale[token])
                if css_val:
                    pairs.append(f"{css_name}: {css_val};")

    # ── Canvas (the target format's dimensions — NOT scaled; these ARE the size)
    if tgt_canvas.get("width"):
        pairs.append(f"--canvas-w: {tgt_canvas['width']}px;")
    if tgt_canvas.get("height"):
        pairs.append(f"--canvas-h: {tgt_canvas['height']}px;")

    return " ".join(pairs)


# ─── Mustache-lite parser ────────────────────────────────────────────────

def render_sections(html: str, data: dict) -> str:
    """Process {{#X}}…{{/X}} (section) and {{^X}}…{{/X}} (inverted) blocks.

    - If `data[X]` is truthy and a list → repeat the block per item, with {{.}}
      replaced by the item's value. Item can be a string OR a dict (then nested
      placeholders {{key}} inside the block resolve against the dict).
    - If `data[X]` is truthy (non-list) → keep block contents once.
    - Else → strip block.
    - Inverted (^): kept only when value is falsy/missing.

    Handles nested sections via a single non-greedy regex pass repeated until
    no more sections remain (simple but works for our depth).
    """
    section_re = re.compile(r"\{\{([#^])([A-Za-z_][A-Za-z0-9_]*)\}\}([\s\S]*?)\{\{/\2\}\}")
    while True:
        m = section_re.search(html)
        if not m:
            break
        kind, key, content = m.group(1), m.group(2), m.group(3)
        val = data.get(key)
        if kind == "#":
            if isinstance(val, list):
                replacement = "".join(_render_list_item(content, v) for v in val)
            elif val:
                replacement = content
            else:
                replacement = ""
        else:  # inverted
            replacement = content if not val else ""
        html = html[:m.start()] + replacement + html[m.end():]
    return html


def _render_list_item(content: str, item) -> str:
    """Render one repetition of a list section.
    If item is dict, replace {{key}} placeholders inside content.
    If item is scalar, replace {{.}} only.
    """
    if isinstance(item, dict):
        out = content
        for k, v in item.items():
            out = out.replace("{{" + k + "}}", str(v))
        # remaining {{.}} ignored
        out = out.replace("{{.}}", "")
        return out
    else:
        return content.replace("{{.}}", str(item))


def _html_escape(s: str) -> str:
    """Escape a plain-text value for HTML text content, exactly once.

    Idempotent by design: the value is first `html.unescape`d so any entities
    already present (e.g. `&#39;` / `&#x27;` for an apostrophe, emitted upstream by
    the model or carried in from scraped source material) are normalised back to
    literal characters before the single escape pass. Without this, the blind
    `&` → `&amp;` replacement turns a pre-existing `&#39;` into `&amp;#39;`, which
    the browser renders as a visible `&#39;` instead of `'`.

    Apostrophes are intentionally NOT escaped — they need no escaping in HTML text
    content, so `it's` / `don't` render as literal characters.
    """
    s = html.unescape(s)
    return (
        s.replace("&", "&amp;")
         .replace("<", "&lt;")
         .replace(">", "&gt;")
         .replace('"', "&quot;")
    )


def substitute(html: str, data: dict) -> str:
    """Mustache substitution after sections are processed.

    Triple-brace {{{NAME}}} renders the value raw (HTML pass-through — used by
    slots with `type: html` whose content may include <mark>, <em>, <strong>).
    Double-brace {{NAME}} HTML-escapes the value.

    Triple-brace is processed FIRST so the outer `{` `}` are consumed cleanly
    (otherwise the inner `{{NAME}}` matches first and the outer braces leak
    into the rendered output — the exact bug that produced visible `{...}`
    in editorial-news slides post-Fase 6).
    """
    def repl_raw(match: re.Match) -> str:
        key = match.group(1).strip()
        return str(data.get(key, ""))

    def repl_escaped(match: re.Match) -> str:
        key = match.group(1).strip()
        return _html_escape(str(data.get(key, "")))

    # Triple-brace first.
    html = re.sub(r"\{\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}\}", repl_raw, html)
    # Then double-brace.
    html = re.sub(r"\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}", repl_escaped, html)
    return html


def fill(html: str, data: dict) -> str:
    """Full pipeline: sections → inverted → placeholders."""
    return substitute(render_sections(html, data), data)


# ─── Pool resolver ───────────────────────────────────────────────────────

def resolve_pool_template(pool: str, template_id: str, brand_context: Path | None = None, allow_draft: bool = False) -> tuple[dict, Path | None, Path | None, Path]:
    """Resolve a pool template_id. Returns (entry, html_path, prompt_path, shared_css).

    - Case A (TEMPLATE):  html_path set,  prompt_path None
    - Case B (FULL_AI):   html_path None, prompt_path set
    - Case C (HYBRID_AI): both set       — entry has both `file` (html) and `ai_prompt` (.prompt.md)

    Pool dir resolution: {brand_context}/templates/<pool>/ when supplied,
    else <project_root>/brand_context/templates/<pool>/.

    Status enforcement: by default only `status: "ready"` entries are renderable.
    `allow_draft=True` allows `draft` (used by Phase 4.5 preview rendering before
    user acceptance). `broken` is never renderable.
    """
    pool_dir = resolve_pool_dir(pool, brand_context=brand_context)
    manifest_path = pool_dir / "manifest.json"
    if not manifest_path.is_file():
        raise SystemExit(f"ERROR: no manifest at {manifest_path}")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    # Schema normalization: Phase 4.5 (primitive_to_template) writes 'templates[]';
    # Phase 5 (template factory) writes 'variations[]'. Accept both transparently.
    # Also accept a dict keyed by id (build_manifest.py historically emitted that) —
    # normalize it to a list so downstream `t.get(...)` works either way.
    entries = manifest.get("templates") or manifest.get("variations") or []
    if isinstance(entries, dict):
        entries = [{**v, "id": v.get("id", k)} for k, v in entries.items() if isinstance(v, dict)]
    entry = next((t for t in entries if t.get("id") == template_id), None)
    if entry is None:
        ids = ", ".join(t["id"] for t in entries)
        raise SystemExit(f"ERROR: template_id '{template_id}' not in pool '{pool}'. Available: {ids}")
    status = entry.get("status")
    allowed_statuses = {"ready"} if not allow_draft else {"ready", "draft", "TODO"}
    if status not in allowed_statuses:
        raise SystemExit(f"ERROR: template '{template_id}' has status '{status}', not in {sorted(allowed_statuses)}.")

    # Per-entry shared_css wins over pool-level (used for cross-folder imports
    # where the imported template needs its source family's stylesheet, not
    # the pool's).
    shared_css_rel = entry.get("shared_css") or manifest.get("shared_css", "_shared/styles.css")
    shared_css = (pool_dir / shared_css_rel).resolve()

    # File path normalization: Phase 5 factory writes 'file: templates/{pool}/body/X.html'
    # (rooted at brand_context), while Phase 4.5 primitive_to_template writes 'file: body/X.html'
    # (rooted at pool_dir). Accept both — strip the redundant 'templates/{pool}/' prefix
    # if present to dedupe the path.
    file_field = entry["file"]
    redundant_prefix = f"templates/{pool}/"
    if file_field.startswith(redundant_prefix):
        file_field = file_field[len(redundant_prefix):]
    file_path = (pool_dir / file_field).resolve()
    html_path = None
    prompt_path = None

    # Case routing by manifest entry shape
    if entry.get("ai_prompt"):
        # Case C: hybrid — file is HTML, ai_prompt is .prompt.md
        html_path = file_path
        prompt_path = pool_dir / entry["ai_prompt"]
    elif str(file_path).endswith(".prompt.md"):
        # Case B: AI prompt template — file is .prompt.md
        prompt_path = file_path
    else:
        # Case A: HTML template
        html_path = file_path

    if html_path and not html_path.is_file():
        raise SystemExit(f"ERROR: HTML missing: {html_path}")
    if prompt_path and not prompt_path.is_file():
        raise SystemExit(f"ERROR: prompt template missing: {prompt_path}")

    return entry, html_path, prompt_path, shared_css


# ─── Prompt-template (.prompt.md) parser ─────────────────────────────────

_FRONTMATTER_RE = re.compile(r"^---\s*\n(.+?)\n---\s*\n(.+)$", re.DOTALL)
_SECTION_RE = re.compile(r"^##\s+(.+?)\s*$", re.MULTILINE)


def parse_prompt_md(path: Path) -> dict:
    """Parse a .prompt.md template into {frontmatter, prompt_body, negative, variables}.

    Frontmatter is parsed via a simple YAML-subset reader (avoids PyYAML dep).
    Body sections are identified by `## <Section>` headers.
    """
    text = path.read_text(encoding="utf-8")
    m = _FRONTMATTER_RE.match(text)
    if not m:
        raise SystemExit(f"ERROR: {path} has no YAML frontmatter (--- ... ---)")
    fm_raw, body = m.group(1), m.group(2)

    frontmatter = {}
    for line in fm_raw.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if ":" in line:
            k, _, v = line.partition(":")
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                v = [x.strip().strip("'\"") for x in v[1:-1].split(",") if x.strip()]
            else:
                v = v.strip("'\"")
            frontmatter[k.strip()] = v

    sections = {}
    headers = list(_SECTION_RE.finditer(body))
    for i, h in enumerate(headers):
        name = h.group(1).strip().lower()
        start = h.end()
        end = headers[i + 1].start() if i + 1 < len(headers) else len(body)
        sections[name] = body[start:end].strip()

    return {
        "frontmatter": frontmatter,
        "prompt": sections.get("prompt", "").strip(),
        "negative": sections.get("negative", "").strip(),
        "variables": sections.get("variables", "").strip(),
        "notes": sections.get("notes for designer", "").strip() or sections.get("notes", "").strip(),
    }


def build_ai_prompt(parsed: dict, data: dict, brand_kit: dict) -> str:
    """Substitute brand tokens + slide data into the prompt body."""
    prompt = parsed["prompt"]
    # Brand placeholders
    mood = (brand_kit or {}).get("mood_block") or ""
    colors = (brand_kit or {}).get("colors", {}) or {}
    accents = colors.get("accents") or []
    brand_replacements = {
        "BRAND_MOOD_BLOCK": mood,
        "BRAND_PRIMARY":    colors.get("primary") or "",
        "BRAND_SECONDARY":  colors.get("secondary") or "",
        "BRAND_BACKGROUND": colors.get("background") or "",
        "BRAND_TEXT":       colors.get("text") or "",
        "BRAND_ACCENT":     accents[0] if accents else "",
        "BRAND_ACCENT_2":   accents[1] if len(accents) > 1 else "",
    }
    for k, v in brand_replacements.items():
        prompt = prompt.replace("{{" + k + "}}", str(v))
    # Slide-data placeholders (TOPIC, TOPIC_ARTIFACT, etc.)
    for k, v in (data or {}).items():
        prompt = prompt.replace("{{" + k + "}}", str(v))
    # Strip any unfilled placeholders
    prompt = re.sub(r"\{\{[^}]+\}\}", "", prompt)
    # Append negative as suffix if present
    if parsed.get("negative"):
        prompt = prompt.strip() + "\n\nNegative: " + parsed["negative"]
    return prompt.strip()


def call_ai_image_gen(prompt: str, output: Path, model: str, aspect: str = "4:5", input_image: Path | None = None) -> Path:
    """Invoke generate_image_gemini.py or generate_image_gpt.py via subprocess.

    When `input_image` is supplied, runs in EDIT mode — the underlying photograph
    is preserved and the prompt only describes overlays to add. This is critical
    for FULL_AI render of scene-template templates: regenerating the scene from
    scratch loses the user-approved composition. Edit mode keeps the cleaned
    scene intact and bakes text on top with gpt-image-2's high-fidelity text rendering.
    """
    script_name = "generate_image_gemini.py" if "gemini" in (model or "").lower() else "generate_image_gpt.py"
    script_path = SCRIPT_DIR / script_name
    if not script_path.is_file():
        raise SystemExit(f"ERROR: AI image script not found: {script_path}")
    output.parent.mkdir(parents=True, exist_ok=True)
    if "gemini" in script_name:
        cmd = ["uv", "run", str(script_path), "--prompt", prompt, "--filename", str(output), "--aspect-ratio", aspect]
    else:
        size = {"4:5": "1024x1536", "1:1": "1024x1024", "9:16": "1024x1536", "16:9": "1536x1024"}.get(aspect, "1024x1536")
        cmd = ["uv", "run", str(script_path), "--prompt", prompt, "--filename", str(output), "--size", size, "--quality", "high"]
    if input_image and input_image.is_file():
        cmd.extend(["--input-image", str(input_image)])
    import subprocess
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if result.returncode != 0:
        raise SystemExit(f"AI image gen failed:\nSTDOUT: {result.stdout[-1000:]}\nSTDERR: {result.stderr[-1000:]}")
    return output


def resolve_ai_image_slots(
    entry: dict,
    data: dict,
    output_dir: Path,
    brand_kit: dict | None = None,
    allow_ai_gen: bool = True,
) -> dict:
    """v3 schema: for each `type: image` slot with `prompt_pattern`, generate the
    AI image (gpt-image-2 / gemini-3-pro-image) and inject the file path into data
    as `{slot_key}_PATH`. Cached by prompt hash so re-runs reuse the image.

    Bug fix: the v3 manifest declares image slots like `BG_AI_IMAGE` with a
    `prompt_pattern` containing the full AI prompt, but render_template's legacy
    Case C only triggers on the older `ai_prompt` field. Without this resolver,
    HYBRID_AI templates render with empty `background-image: url('')` — text on
    off-white instead of editorial photography. Preview is structurally meaningless.

    - `allow_ai_gen=False` → skip generation (user explicitly declined AI bg via
      the `--no-ai-bg` flag, or sub-agent decided no-AI for cost/policy reasons).
      Caller knows previews will lack the bg image.
    - Caller-provided `{slot_key}_PATH` always wins — never overwritten.
    """
    import hashlib
    slots = (entry or {}).get("slots") or {}
    if not slots:
        return dict(data)

    out = dict(data)
    cache_dir = output_dir / "_ai_bg"

    for slot_key, slot_def in slots.items():
        if slot_def.get("type") != "image":
            continue
        prompt_pattern = slot_def.get("prompt_pattern")
        if not prompt_pattern:
            continue
        path_key = f"{slot_key}_PATH"
        if out.get(path_key):
            continue  # caller supplied a path
        if not allow_ai_gen:
            print(f"[render_template] SKIP AI gen for slot {slot_key} (--no-ai-bg)", file=sys.stderr)
            continue
        prompt_hash = hashlib.sha1(prompt_pattern.encode("utf-8")).hexdigest()[:12]
        cache_dir.mkdir(parents=True, exist_ok=True)
        cache_path = cache_dir / f"{slot_key.lower()}-{prompt_hash}.png"
        if not cache_path.is_file():
            model = "gpt-image-2"
            if brand_kit and (brand_kit.get("image_provider") or "").lower() == "gemini":
                model = "gemini-3-pro-image"
            aspect = slot_def.get("aspect", "4:5")
            print(f"[render_template] AI gen for slot {slot_key} via {model} (cache miss)", file=sys.stderr)
            call_ai_image_gen(prompt_pattern, cache_path, model, aspect)
        else:
            print(f"[render_template] AI gen for slot {slot_key} (cache hit: {cache_path.name})", file=sys.stderr)
        out[path_key] = str(cache_path.resolve())

    return out


def inject_brand_tokens_into_data(data: dict, brand_kit: dict | None) -> dict:
    """Pre-fill `{{BRAND_*}}` Mustache placeholders with brand_kit values.

    BRAND WINS RULE — intents reference colors via Mustache (e.g.
    `color: '{{BRAND_ACCENT}}'`) so that the SAME intent.md works across brands
    with different palettes. This function resolves those placeholders from the
    brand_kit BEFORE HTML fill, so the rendered output uses the brand's actual
    hex codes — not the template author's defaults.

    Caller-provided values (already set in `data`) WIN. We only fill what's missing.

    Reads v3 tokens.json schema with legacy fallbacks (same conventions as
    build_brand_tokens_css).
    """
    if not brand_kit:
        return dict(data)
    colors = (brand_kit.get("colors") or {}) if isinstance(brand_kit, dict) else {}
    accents = colors.get("accents") or []
    fonts = (brand_kit.get("fonts") or {}) if isinstance(brand_kit, dict) else {}
    brand_name = brand_kit.get("brand", "")

    defaults = {
        "BRAND_ACCENT":         colors.get("accent") or (accents[0] if accents else "#e25a45"),
        "BRAND_ACCENT_2":       colors.get("accent_secondary") or (accents[1] if len(accents) > 1 else ""),
        "BRAND_PRIMARY":        colors.get("primary") or colors.get("bg_dark") or "#0a0a0a",
        "BRAND_BACKGROUND":     colors.get("background") or colors.get("bg_light") or "#f2f0eb",
        "BRAND_BG_DARK":        colors.get("bg_dark") or colors.get("primary") or "#0a0a0a",
        "BRAND_BG_LIGHT":       colors.get("bg_light") or colors.get("background") or "#f2f0eb",
        "BRAND_TEXT":           colors.get("text") or colors.get("text_on_light") or "#0a0a0a",
        "BRAND_TEXT_ON_DARK":   colors.get("text_on_dark") or colors.get("bg_light") or "#ece8e7",
        "BRAND_TEXT_ON_LIGHT":  colors.get("text_on_light") or colors.get("bg_dark") or "#0a0a0a",
        "BRAND_MUTED_ON_DARK":  colors.get("muted_on_dark") or "#999999",
        "BRAND_MUTED_ON_LIGHT": colors.get("muted_on_light") or colors.get("neutral_dark") or "#666666",
        "BRAND_NAME":           brand_name,
    }
    # Font families (so intents can reference {{BRAND_FONT_DISPLAY}} etc.)
    for role, key_name in [("display", "BRAND_FONT_DISPLAY"), ("body", "BRAND_FONT_BODY"), ("micro", "BRAND_FONT_MICRO")]:
        role_cfg = fonts.get(role) if isinstance(fonts, dict) else None
        if isinstance(role_cfg, dict) and role_cfg.get("family"):
            defaults[key_name] = role_cfg["family"]

    out = dict(data)
    for k, v in defaults.items():
        if k not in out and v:
            out[k] = v
    return out


def sample_bg_luminance(bg_path: Path, *, sample_box: tuple[float, float, float, float] = (0.1, 0.1, 0.9, 0.9)) -> float:
    """Sample mean luminance of a bg image inside `sample_box` (left, top, right, bottom as fractions).

    Returns a float 0.0 (pure black) to 1.0 (pure white). Used by `auto_resolve_text_color_tokens`
    to override BRAND_TEXT_ON_DARK / BRAND_TEXT_ON_LIGHT when the bg's actual luminance doesn't
    match what the template author assumed.

    Default sample box excludes the outer 10% (chrome rows / edge artifacts), focusing on the
    area where text typically sits.
    """
    try:
        from PIL import Image
    except ImportError:
        print("[render_template] PIL not installed; skipping luminance sample. Run: uv add pillow", file=sys.stderr)
        return 0.5  # neutral fallback — no override
    if not bg_path.is_file():
        return 0.5
    img = Image.open(bg_path).convert("RGB")
    w, h = img.size
    l, t, r, b = sample_box
    box = (int(w * l), int(h * t), int(w * r), int(h * b))
    crop = img.crop(box)
    # Downsample to 32x32 for speed
    crop.thumbnail((32, 32))
    pixels = list(crop.getdata())
    # Relative luminance per WCAG: 0.2126*R + 0.7152*G + 0.0722*B (sRGB linear approximation)
    total = sum(0.2126 * r + 0.7152 * g + 0.0722 * b for r, g, b in pixels)
    return total / (255.0 * len(pixels))


def auto_resolve_text_color_tokens(data: dict, brand_kit: dict | None, bg_path_keys: list[str]) -> dict:
    """Auto-override BRAND_TEXT_ON_DARK / BRAND_TEXT_ON_LIGHT based on actual bg luminance.

    Templates hardcode `{{BRAND_TEXT_ON_DARK}}` assuming the bg is dark; when scene-template
    extraction returns a LIGHT photograph (sunlit brick wall) the assumption breaks and text
    renders illegibly. This fn samples the actual bg, computes luminance, and overrides the
    token in `data` so the template still uses a readable color.

    Threshold rationale: WCAG AA contrast 4.5:1 requires roughly luminance delta > 0.3 between
    text and bg. Using cutoffs 0.35 / 0.55 gives safety margin.
    """
    if not bg_path_keys:
        return data
    bg_lum = None
    for key in bg_path_keys:
        p = data.get(key)
        if p and Path(p).is_file():
            bg_lum = sample_bg_luminance(Path(p))
            break
    if bg_lum is None:
        return data
    colors = (brand_kit or {}).get("colors", {}) or {}
    text_on_light = colors.get("text_on_light") or colors.get("primary") or "#0a0a0a"
    text_on_dark = colors.get("text_on_dark") or "#f2f0eb"
    out = dict(data)
    if bg_lum > 0.55:
        # Bg is light — text marked "on dark" should actually use the on-light color
        out["BRAND_TEXT_ON_DARK"] = text_on_light
        out["BRAND_TEXT_ON_LIGHT"] = text_on_light
        print(f"[render_template] auto-luminance: bg lum={bg_lum:.2f} (light) → text=on-light ({text_on_light})", file=sys.stderr)
    elif bg_lum < 0.35:
        # Bg is dark — text marked "on light" should actually use the on-dark color
        out["BRAND_TEXT_ON_LIGHT"] = text_on_dark
        out["BRAND_TEXT_ON_DARK"] = text_on_dark
        print(f"[render_template] auto-luminance: bg lum={bg_lum:.2f} (dark) → text=on-dark ({text_on_dark})", file=sys.stderr)
    else:
        print(f"[render_template] auto-luminance: bg lum={bg_lum:.2f} (mid) → keeping brand defaults", file=sys.stderr)
    return out


def embed_paths_as_data_uris(data: dict, brand_context: Path | None, template_dir: Path | None = None) -> dict:
    """For every data key ending in _PATH whose value is a local file, replace the value
    with a base64 data URI. Templates use these via Mustache (e.g.
    `<img src="{{LOGO_PATH}}">` or `background-image: url('{{BG_SOURCE_PATH}}')`).
    Playwright's `set_content()` runs with no base URL and blocks file:// — so any
    local path leaks as a broken image. Inlining as data URI sidesteps both issues.

    This MUST run before Mustache fill: `_inline_relative_urls` only catches LITERAL
    relative paths in the raw HTML, so a path that arrives through a Mustache slot
    (e.g. `<img src="{{BRAND_LOGO_PATH}}">`) is only inlined here. That's why per-post
    image slots must end in `_PATH`.

    Caller-provided data URIs and http(s) URLs pass through unchanged.
    Relative paths resolve against the template dir first (where the template's own
    `assets/` live), then `brand_context` (the project's brand folder).
    """
    out = dict(data)
    for key in list(out.keys()):
        if not key.endswith("_PATH"):
            continue
        val = out[key]
        if not isinstance(val, str) or not val:
            continue
        if val.startswith("data:") or val.startswith("http://") or val.startswith("https://"):
            continue
        path = Path(val)
        if not path.is_absolute():
            for base in (template_dir, brand_context):
                if base is None:
                    continue
                candidate = (Path(base) / val).resolve()
                if candidate.is_file():
                    path = candidate
                    break
        if not path.is_file():
            continue
        suffix = path.suffix.lower().lstrip(".")
        mime = {"png": "png", "jpg": "jpeg", "jpeg": "jpeg",
                "svg": "svg+xml", "webp": "webp"}.get(suffix, "png")
        import base64 as _b64
        b64 = _b64.b64encode(path.read_bytes()).decode()
        out[key] = f"data:image/{mime};base64,{b64}"
    return out


def resolve_brand_logo_path(brand_kit: dict | None, brand_context: Path | None) -> str | None:
    """Resolve the brand's primary logo path for PAGE_INDICATOR_LOGO_PATH auto-injection.

    Lookup order:
      1. brand_kit['logo']['primary_path'] (set by brand_kit_loader)
      2. {brand_context}/visual-identity/logos/*-transparent.{png,svg}
      3. {brand_context}/visual-identity/logos/*.{png,svg,jpg}  (first file found)

    Returns absolute path string or None if no logo found.
    """
    if brand_kit:
        primary = (brand_kit.get("logo") or {}).get("primary_path")
        if primary and Path(primary).is_file():
            return str(Path(primary).resolve())
    if brand_context:
        logos_dir = brand_context / "visual-identity" / "logos"
        if logos_dir.is_dir():
            for pattern in ("*-transparent.png", "*-transparent.svg", "*.svg", "*.png", "*.jpg"):
                for candidate in sorted(logos_dir.glob(pattern)):
                    if "_bg_clean" in candidate.parts:
                        continue
                    return str(candidate.resolve())
    return None


def render(
    output: Path,
    data: dict,
    brand_kit: dict | None = None,
    *,
    template: str | None = None,
    template_pool: str | None = None,
    template_id: str | None = None,
    template_dir: str | Path | None = None,
    brand_context: Path | None = None,
    target_canvas: dict | None = None,
    allow_draft: bool = False,
    allow_ai_gen: bool = True,
) -> Path:
    """Render an HTML template to PNG. Three call modes:

    - **template_dir** (new, preferred): a folder with `template.html` + optional `bg.png`, `instructions.md`.
    - Pool: `template_pool="linkedin-carousel"`, `template_id="hero-typographic"`.
    - Legacy: `template="family/page"`.
    """
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("ERROR: playwright not installed. Run: uv run playwright install chromium", file=sys.stderr)
        sys.exit(1)

    entry = {}
    prompt_path = None
    pool_shared_css = None
    if template_dir:
        # New simplified architecture: a per-template folder with template.html inside.
        td = Path(template_dir).resolve()
        html_path = td / "template.html"
        shared_css_path = td / "styles.css"  # optional per-template overrides; missing is fine
        # The pool's _shared/styles.css carries the brand @font-face + base classes. Templates
        # link it via <link href="../_shared/styles.css">, but Playwright set_content() has no
        # base URL so that relative link never resolves — without loading it explicitly here the
        # brand fonts never inject and display text falls back to the serif tail of
        # --type-display-family. Load it (pool first, per-template styles.css override second).
        pool_shared_css = td.parent / "_shared" / "styles.css"
        is_pool = False
    elif template_pool and template_id:
        entry, html_path, prompt_path, shared_css_path = resolve_pool_template(
            template_pool, template_id,
            brand_context=brand_context,
            allow_draft=allow_draft,
        )
        is_pool = True
    elif template:
        html_path = TEMPLATES_DIR / f"{template}.html"
        shared_css_path = html_path.parent / "styles.css"
        is_pool = False
    else:
        raise SystemExit("ERROR: pass --template-dir OR (--template-pool + --template-id) OR --template")

    # ─── Case B / C: AI prompt template branch ──────────────────────────
    if prompt_path is not None:
        parsed = parse_prompt_md(prompt_path)
        fm = parsed["frontmatter"]
        model = fm.get("recommended_model") or fm.get("model") or "gpt-image-2"
        aspect = fm.get("aspect") or fm.get("aspect_ratio") or "4:5"
        prompt_text = build_ai_prompt(parsed, data, brand_kit or {})

        # Edit-mode input image (frontmatter `input_image:` field) — preserves the
        # user-approved scene-template composition. Without this, FULL_AI regenerates
        # the photo from scratch and loses the brick wall + figure positioning the
        # user already accepted.
        input_image_path: Path | None = None
        fm_input = fm.get("input_image")
        if fm_input:
            candidate = Path(fm_input)
            if not candidate.is_absolute() and brand_context:
                candidate = (brand_context / fm_input).resolve()
            if candidate.is_file():
                input_image_path = candidate
                print(f"[render_template] Case B/C using input_image: {candidate}", file=sys.stderr)

        output = output.resolve()
        output.parent.mkdir(parents=True, exist_ok=True)

        if html_path is None:
            # Case B: AI image is the final output (FULL_AI mode)
            mode_label = "edit" if input_image_path else "txt2img"
            print(f"[render_template] Case B ({mode_label}): {template_id}", file=sys.stderr)
            return call_ai_image_gen(prompt_text, output, model, aspect, input_image=input_image_path)

        # Case C: generate AI image to a temp file, then embed in HTML overlay below
        print(f"[render_template] Case C (hybrid): {template_id}", file=sys.stderr)
        tmp_bg = output.parent / f"_tmp-{output.stem}-bg.png"
        call_ai_image_gen(prompt_text, tmp_bg, model, aspect, input_image=input_image_path)
        # Inject IMAGE_SRC for the HTML overlay step below
        data = dict(data or {})
        data["IMAGE_SRC"] = str(tmp_bg)
        # Then fall through to the HTML render path

    if html_path is None or not html_path.exists():
        print(f"ERROR: template not found: {html_path}", file=sys.stderr)
        sys.exit(1)

    # v3 schema HYBRID_AI: resolve image slots BEFORE HTML fill. Generates the
    # AI bg via gpt-image-2 / gemini-3-pro-image and injects {SLOT}_PATH keys.
    # Disabled by --no-ai-bg (caller opted out of AI bg generation explicitly).
    if is_pool:
        data = resolve_ai_image_slots(
            entry,
            data,
            output_dir=output.parent,
            brand_kit=brand_kit,
            allow_ai_gen=allow_ai_gen,
        )

    # BRAND WINS — fill {{BRAND_*}} Mustache placeholders from brand_kit BEFORE
    # any other resolution. Caller-provided data wins; we only fill missing keys.
    # This is what makes color/font tokens in intent.md (e.g. `{{BRAND_ACCENT}}`)
    # resolve to the brand's actual hex codes / family names.
    if is_pool:
        data = inject_brand_tokens_into_data(data, brand_kit)

    # Auto-resolve PAGE_INDICATOR_LOGO_PATH if not supplied by caller. Otherwise
    # the {{#PAGE_INDICATOR_LOGO_PATH}}…{{^…}} Mustache section falls through to
    # the default black circle placeholder, even though the brand has a logo.
    if is_pool and "PAGE_INDICATOR_LOGO_PATH" not in data:
        logo_path = resolve_brand_logo_path(brand_kit, brand_context)
        if logo_path:
            data["PAGE_INDICATOR_LOGO_PATH"] = logo_path

    # Auto-luminance: sample bg image, override BRAND_TEXT_ON_* tokens when contrast
    # would fail (e.g., scene-template extraction returned a light photo but the
    # template hardcodes text_on_dark assuming a dark bg). Covers:
    #   - BG_AI_IMAGE_PATH (set by resolve_ai_image_slots for HYBRID_AI templates)
    #   - any image-type slot named *BG* in the entry
    #   - _bg_image_path field on the entry itself (set by primitive_to_template
    #     when the bg is real-photo or scene-template — these are inlined in HTML,
    #     not in a slot, so they need explicit injection here)
    if is_pool:
        bg_keys = ["BG_AI_IMAGE_PATH"] + [
            f"{k}_PATH" for k in (entry.get("slots") or {})
            if "BG" in k.upper() and (entry["slots"][k].get("type") == "image")
        ]
        # Also sample any full-bleed bg the template fills via a Mustache image slot
        # (PHOTO_CUTOUT_PATH on hero-display-cutout, PHOTO_MAIN_PATH, BG_SCENE_PATH, …)
        # AND the --bg-override path (slides whose bg is a generated/real image swapped
        # into `url('bg.png')`). Without these, auto-luminance never fires for
        # overlaid-text-on-image templates and dark text renders on dark photos.
        bg_keys += [
            k for k in data
            if k.endswith("_PATH") and any(tok in k.upper() for tok in ("PHOTO", "SCENE", "CUTOUT", "BG"))
        ]
        _ov = (data.get("_BG_OVERRIDE") or "").strip()
        if _ov:
            data.setdefault("_BG_OVERRIDE_SAMPLE", _ov)
            bg_keys.append("_BG_OVERRIDE_SAMPLE")
        seen = set(); bg_keys = [k for k in bg_keys if not (k in seen or seen.add(k))]
        # Inject _bg_image_path as ENTRY_BG_PATH so auto_resolve can find it
        entry_bg = entry.get("_bg_image_path") or ""
        if entry_bg:
            entry_bg_abs = entry_bg
            if not Path(entry_bg_abs).is_absolute() and brand_context:
                entry_bg_abs = str((brand_context / entry_bg_abs).resolve())
            data.setdefault("ENTRY_BG_PATH", entry_bg_abs)
            bg_keys.append("ENTRY_BG_PATH")
        data = auto_resolve_text_color_tokens(data, brand_kit, bg_keys)

    # Canvas: a target format canvas (CLI --canvas) overrides the brand grid.
    # Resolved here so it drives BOTH the brand-token scaling and the viewport below.
    _grid = (brand_kit or {}).get("tokens", {}).get("grid", {}) or {}
    if isinstance(target_canvas, dict) and target_canvas.get("width") and target_canvas.get("height"):
        canvas_w, canvas_h = int(target_canvas["width"]), int(target_canvas["height"])
    else:
        canvas_w = _grid.get("canvas_width") or 1080
        canvas_h = _grid.get("canvas_height") or 1350
    tokens = build_brand_tokens_css(brand_kit or {}, target_canvas={"width": canvas_w, "height": canvas_h})

    # Logo: if brand_kit has a logo path, expose LOGO_HTML for pool templates.
    if is_pool and "LOGO_HTML" not in data and brand_kit:
        logo_path = (brand_kit.get("logo") or {}).get("primary_path") or ""
        if logo_path and Path(logo_path).is_file():
            import base64 as _b64
            suffix = Path(logo_path).suffix.lower().lstrip(".")
            mime = {"svg": "svg+xml", "png": "png", "jpg": "jpeg", "jpeg": "jpeg", "webp": "webp"}.get(suffix, "png")
            data["LOGO_HTML"] = (
                f'<div class="logo"><img src="data:image/{mime};base64,'
                f'{_b64.b64encode(Path(logo_path).read_bytes()).decode()}" alt=""></div>'
            )
        else:
            initial = (brand_kit.get("brand") or "B")[0].upper()
            data["LOGO_HTML"] = f'<div class="logo">{initial}</div>'

    # Resolve IMAGE_SRC → IMAGE_HTML so templates never see a raw path.
    # If IMAGE_HTML is already in data, it wins (caller built custom markup).
    processed = dict(data)

    # Resolve HANDLE_ICON_PATH → HANDLE_ICON_HTML (small inline platform icon
    # rendered next to @handle in the header). Accepts SVG or PNG.
    if "HANDLE_ICON_HTML" not in processed:
        icon_src = processed.get("HANDLE_ICON_PATH", "")
        if icon_src:
            import base64
            icon_path = Path(icon_src).resolve()
            icon_bytes = icon_path.read_bytes()
            suffix = icon_path.suffix.lower().lstrip(".")
            mime = {"svg": "svg+xml", "png": "png"}.get(suffix, "png")
            b64 = base64.b64encode(icon_bytes).decode()
            processed["HANDLE_ICON_HTML"] = f'<img src="data:image/{mime};base64,{b64}" alt="">'
        else:
            processed["HANDLE_ICON_HTML"] = ""

    if "IMAGE_HTML" not in processed:
        src = processed.get("IMAGE_SRC", "")
        if src:
            # Embed as base64 data URI — Playwright blocks file:// URIs when
            # content is loaded via set_content() (no origin / CORS sandbox).
            import base64
            img_path = Path(src).resolve()
            img_bytes = img_path.read_bytes()
            suffix = img_path.suffix.lower().lstrip(".")
            mime = {
                "jpg": "jpeg", "jpeg": "jpeg", "png": "png",
                "webp": "webp", "svg": "svg+xml",
            }.get(suffix, "png")
            b64 = base64.b64encode(img_bytes).decode()
            data_uri = f"data:image/{mime};base64,{b64}"
            # SVG icons need contain, not cover — preserve aspect ratio and don't crop
            object_fit = "contain" if suffix == "svg" else "cover"
            processed["IMAGE_HTML"] = (
                f'<img src="{data_uri}" alt="" '
                f'style="width:100%;height:100%;object-fit:{object_fit};display:block;">'
            )
            # Typed-image-slot pattern (Stage 1+): templates that use
            # {{#IMAGE_PATH}}<img src="{{IMAGE_PATH}}">{{/IMAGE_PATH}}
            # need IMAGE_PATH populated too. Only set if caller didn't already.
            if not processed.get("IMAGE_PATH"):
                processed["IMAGE_PATH"] = data_uri
        else:
            processed["IMAGE_HTML"] = ""

    # Convert all local file paths in *_PATH data keys to base64 data URIs.
    # Playwright's set_content() has no base URL + blocks file://, so any local
    # path leaks as a broken image. This pass embeds BG_SOURCE_PATH, the logo,
    # any image slot _PATH, etc.
    processed = embed_paths_as_data_uris(processed, brand_context, html_path.parent.resolve())

    raw_html = html_path.read_text(encoding="utf-8")

    # Phase 1 — pop parameterization control keys (they shouldn't reach Mustache)
    bg_override = (processed.pop("_BG_OVERRIDE", None) or "").strip()
    omitted_ids = processed.pop("_OMITTED_IDS", None) or []

    # --bg-override: replace `url('bg.png')` references with the override image,
    # inlined DIRECTLY as a base64 data URI. Inlining here (rather than inserting the
    # path and leaning on _inline_relative_urls) is required because that regex stops
    # at whitespace — an absolute override path containing spaces (e.g. "Gustavo
    # Bezerra") would silently fail to resolve and the bg would render blank.
    if bg_override:
        _ov = Path(bg_override)
        if not _ov.is_absolute() and brand_context:
            _cand = (brand_context / bg_override).resolve()
            if _cand.is_file():
                _ov = _cand
        if _ov.is_file():
            import base64 as _b64ov
            _mime = _MEDIA_TYPE_BY_EXT.get(_ov.suffix.lower(), "image/png")
            _ov_uri = f"data:{_mime};base64,{_b64ov.b64encode(_ov.read_bytes()).decode()}"
            raw_html = raw_html.replace("url('bg.png')", f"url('{_ov_uri}')")
            raw_html = raw_html.replace('url("bg.png")', f'url("{_ov_uri}")')
        else:
            print(f"[render_template] --bg-override file not found: {bg_override}", file=sys.stderr)

    # Resolve relative `url('xxx.png')` (CSS) and `<img src="xxx.png">` (HTML)
    # references against the template's containing folder and inline them as base64
    # data URIs. Playwright's set_content() has no base URL — without this,
    # `background: url('bg.png')` and `<img src="../logos/brand.png">` just render
    # broken because file:// is blocked and the relative path doesn't resolve.
    #
    # `html_path.parent` is the right base in all three render modes:
    #   - template_dir mode: `html_path = template_dir / "template.html"` → parent = template_dir
    #   - pool mode:         `html_path` returned by resolve_pool_template → parent = pool template dir
    #   - legacy mode:       `html_path = TEMPLATES_DIR / f"{template}.html"` → parent = TEMPLATES_DIR
    raw_html = _inline_relative_urls(raw_html, html_path.parent.resolve())

    # --slots-omitted: inject a CSS rule that hides matching element IDs.
    # Templates that want slots omittable MUST give each zone an `id="<element-id>"` matching
    # _measurements.yaml. Documented in template-conventions.md.
    if omitted_ids:
        selectors = ", ".join([f"#{eid}" for eid in omitted_ids])
        hide_css = f"<style>{selectors} {{ display: none !important; }}</style>"
        if "</head>" in raw_html:
            raw_html = raw_html.replace("</head>", hide_css + "</head>", 1)
        else:
            raw_html = hide_css + raw_html

    filled = fill(raw_html, {**processed, "BRAND_TOKENS_CSS": tokens})

    output = output.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)

    # Canvas (canvas_w / canvas_h) was resolved above next to the token build.

    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            ctx = browser.new_context(viewport={"width": canvas_w, "height": canvas_h}, device_scale_factor=2)
            page = ctx.new_page()
            page.set_content(filled, wait_until="domcontentloaded")
            # Load the shared/stylesheet — for pool templates this is the
            # pool's _shared/styles.css; for legacy it's family/styles.css.
            # Pool-level shared sheet first (brand @font-face + base classes), then the
            # per-template override (if any) so it wins the cascade.
            if pool_shared_css and Path(pool_shared_css).is_file():
                page.add_style_tag(path=str(pool_shared_css))
            if shared_css_path and shared_css_path.is_file():
                page.add_style_tag(path=str(shared_css_path))
            if tokens:
                # Inject AFTER the shared sheet so brand_kit wins the cascade.
                page.add_style_tag(content=f":root {{ {tokens} }}")
            page.wait_for_load_state("networkidle")
            # Explicitly wait for fonts (Google Fonts @import) — networkidle alone
            # sometimes screenshots before font swap completes, yielding Arial fallback.
            page.evaluate("() => document.fonts.ready")
            page.screenshot(path=str(output), omit_background=False, full_page=False, clip={"x": 0, "y": 0, "width": canvas_w, "height": canvas_h})
        finally:
            browser.close()

    return output


_RELATIVE_URL_RE = re.compile(r"""url\(\s*['"]?(?P<path>[^'")\s]+)['"]?\s*\)""")
_IMG_SRC_RE = re.compile(r"""(?P<lead><img\b[^>]*?\bsrc\s*=\s*)(?P<quote>['"])(?P<path>[^'"\s>]+)(?P=quote)""", re.IGNORECASE)
_MEDIA_TYPE_BY_EXT = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
}


def _inline_relative_urls(html_text: str, base_dir: Path) -> str:
    """Replace `url('xxx.png')` (CSS) and `<img src="xxx.png">` (HTML) with
    base64 data URIs when xxx.png is a local file that exists relative to base_dir.

    Leaves http(s):// and existing data: URIs untouched. Used by template-dir mode
    since Playwright's set_content() can't resolve relative file paths."""
    import base64

    def _resolve_to_data_uri(path_str: str) -> str | None:
        if path_str.startswith(("http://", "https://", "data:", "//", "#")):
            return None
        candidate = (base_dir / path_str).resolve()
        if not candidate.is_file():
            return None
        ext = candidate.suffix.lower()
        media = _MEDIA_TYPE_BY_EXT.get(ext)
        if not media:
            return None
        b64 = base64.b64encode(candidate.read_bytes()).decode("ascii")
        return f"data:{media};base64,{b64}"

    def replace_css(match: re.Match) -> str:
        uri = _resolve_to_data_uri(match.group("path"))
        return f"url('{uri}')" if uri else match.group(0)

    def replace_img(match: re.Match) -> str:
        uri = _resolve_to_data_uri(match.group("path"))
        if not uri:
            return match.group(0)
        return f"{match.group('lead')}{match.group('quote')}{uri}{match.group('quote')}"

    html_text = _RELATIVE_URL_RE.sub(replace_css, html_text)
    html_text = _IMG_SRC_RE.sub(replace_img, html_text)
    return html_text


def load_data_arg(value: str | None) -> dict:
    if not value:
        return {}
    p = Path(value)
    if p.exists():
        return json.loads(p.read_text(encoding="utf-8"))
    return json.loads(value)


def main() -> None:
    parser = argparse.ArgumentParser(description="Render a carousel HTML template to PNG.")
    parser.add_argument("--template", help="Legacy: template name in the form <family>/<page>, e.g. subtle/front")
    parser.add_argument("--template-pool", dest="template_pool", help="Per-skill pool name (e.g., linkedin-carousel)")
    parser.add_argument("--template-id", dest="template_id", help="Template id from the pool's manifest (e.g., hero-typographic)")
    parser.add_argument("--template-dir", dest="template_dir", help="Per-template folder containing template.html (+ optional bg.png, instructions.md). New simplified architecture — preferred over --template-pool/--template-id.")
    parser.add_argument("--use-sample-text", dest="use_sample_text", action="store_true", help="Read sample text from the template's instructions.md slot defaults and merge into data. Works with --template-dir AND --template-pool/--template-id.")
    parser.add_argument("--output", required=True, type=Path, help="Output PNG path")
    parser.add_argument("--data", help="Slide data: either a JSON file path or an inline JSON string")
    parser.add_argument("--brand-kit", dest="brand_kit", help="Brand kit JSON file path or inline JSON; if omitted, loads from <project_root>/brand_context/")
    parser.add_argument("--allow-draft", dest="allow_draft", action="store_true", help="Allow rendering templates with status='draft' (used by Phase 4.5 preview before user acceptance). Default: only 'ready' status.")
    parser.add_argument("--brand-context", dest="brand_context", help="Brand context folder path (overrides auto-detect)")
    parser.add_argument("--canvas", help="Target canvas as WxH (e.g. 1920x1080) for non-carousel formats. Overrides the brand grid; drives token scaling + viewport. Default: brand canvas (1080x1350).")
    parser.add_argument("--image-src", dest="image_src", help="Path to image file to embed in the {{IMAGE_HTML}} slot")
    parser.add_argument("--no-ai-bg", dest="no_ai_bg", action="store_true", help="Skip AI generation for v3 image slots with prompt_pattern. Use when the caller explicitly declines AI bg cost. Default: generate AI images for any image slot lacking a path.")
    # Phase 1 parameterization flags — templates as recipes, not fixed renders
    parser.add_argument("--slots-omitted", dest="slots_omitted", default="", help="Comma-separated list of slot/element ids to OMIT from the render (the corresponding HTML element is hidden via display:none). Used per-post to skip optional slots.")
    parser.add_argument("--bg-override", dest="bg_override", help="Path to a PNG that replaces the template's default bg.png reference (the template's `url('bg.png')` is rewritten to point here). Used per-post for brand-substituted bgs.")
    parser.add_argument("--content-data", dest="content_data", help="JSON file path with per-slot content overrides (equivalent to --data; merged on top of sample text). Convenience flag for clarity in per-post pipelines.")
    args = parser.parse_args()

    if not args.template and not (args.template_pool and args.template_id) and not args.template_dir:
        parser.error("must pass --template-dir (new), OR --template (legacy), OR both --template-pool and --template-id")

    # Load .env from project root (one level above brand_context) so Case B/C
    # subprocesses (generate_image_gpt.py / gemini) inherit API keys.
    if args.brand_context:
        bc = Path(args.brand_context).resolve()
        load_env_file(bc.parent / ".env")

    data = load_data_arg(args.data)

    # Brand kit: explicit > load from brand_context/ > empty
    if args.brand_kit:
        brand_kit = load_data_arg(args.brand_kit)
    else:
        try:
            from brand_kit_loader import load as _load_kit
        except ImportError:
            sys.path.insert(0, str(SCRIPT_DIR))
            from brand_kit_loader import load as _load_kit
        bc = Path(args.brand_context).resolve() if args.brand_context else None
        brand_kit = _load_kit(bc)

    if args.image_src:
        data["IMAGE_SRC"] = args.image_src

    # --use-sample-text: read sample text from the template's instructions.md slot
    # defaults and merge into data (existing data values take precedence). Works in
    # BOTH --template-dir mode and --template-pool/--template-id (pool) mode.
    if args.use_sample_text:
        instructions_path: Path | None = None
        if args.template_dir:
            instructions_path = Path(args.template_dir).resolve() / "instructions.md"
        elif args.template_pool and args.template_id:
            bc = Path(args.brand_context).resolve() if args.brand_context else None
            try:
                _entry, _html_path, _prompt_path, _shared_css = resolve_pool_template(
                    args.template_pool, args.template_id,
                    brand_context=bc,
                    allow_draft=getattr(args, "allow_draft", False),
                )
                if _html_path is not None:
                    instructions_path = _html_path.parent / "instructions.md"
            except Exception as exc:
                print(f"[render_template] --use-sample-text: pool resolve failed: {exc}", file=sys.stderr)
        if instructions_path and instructions_path.exists():
            samples = parse_sample_text_from_instructions(instructions_path)
            for k, v in samples.items():
                if k not in data:
                    data[k] = v

    # --content-data: merge per-slot overrides (alias-style flag for clarity in per-post pipelines)
    if args.content_data:
        content_overrides = load_data_arg(args.content_data)
        data.update(content_overrides)

    # Phase 1 — render-time parameterization (post-process the rendered HTML)
    omitted_ids = [s.strip() for s in (args.slots_omitted or "").split(",") if s.strip()]
    data["_OMITTED_IDS"] = omitted_ids
    data["_BG_OVERRIDE"] = args.bg_override or ""

    target_canvas = None
    if getattr(args, "canvas", None):
        try:
            _cw, _ch = args.canvas.lower().split("x")
            target_canvas = {"width": int(_cw), "height": int(_ch)}
        except ValueError:
            print(f"[render_template] --canvas must be WxH (e.g. 1920x1080); got {args.canvas!r}", file=sys.stderr)
            sys.exit(2)
    result = render(
        args.output, data, brand_kit,
        template=args.template,
        template_pool=args.template_pool,
        template_id=args.template_id,
        template_dir=args.template_dir,
        target_canvas=target_canvas,
        brand_context=Path(args.brand_context).resolve() if args.brand_context else None,
        allow_draft=getattr(args, "allow_draft", False),
        allow_ai_gen=not getattr(args, "no_ai_bg", False),
    )
    print(f"Rendered -> {result}")


def parse_sample_text_from_instructions(path: Path) -> dict:
    """Parse instructions.md `## Slots` block and pull `sample:` values per slot name.
    Returns dict of {SLOT_NAME: sample_text}. Best-effort regex parse — instructions.md
    is human-authored so structure may vary; missing samples are skipped silently.

    Handles slot blocks like:
      - **HERO** — italic preamble
        - bbox: 4% 22% 92% 7%
        - style: display-italic, ...
        - sample: "I never write"
    Where the sample line is an indented bullet (after stripping it becomes
    "- sample: \"I never write\"").
    """
    text = path.read_text(encoding="utf-8", errors="ignore")
    samples = {}
    current_slot = None
    sample_re = re.compile(r"^[-*]?\s*sample\s*:\s*(.*)$", re.IGNORECASE)
    slot_re = re.compile(r"^[-*]\s+\*?\*?([A-Z][A-Z0-9_]+)\*?\*?\s*[—\-]")

    for line in text.splitlines():
        stripped = line.strip()
        m_slot = slot_re.match(stripped)
        if m_slot:
            current_slot = m_slot.group(1)
            continue
        if current_slot:
            m_sample = sample_re.match(stripped)
            if m_sample:
                raw = m_sample.group(1).strip()
                # Strip surrounding quotes if present
                if (raw.startswith('"') and raw.endswith('"')) or (raw.startswith("'") and raw.endswith("'")):
                    raw = raw[1:-1]
                if raw:
                    samples[current_slot] = raw
                current_slot = None  # consume one sample per slot block
    return samples


if __name__ == "__main__":
    main()
