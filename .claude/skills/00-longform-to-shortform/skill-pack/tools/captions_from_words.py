"""Generate ASS subtitles from word-level JSON (WhisperX / tool-transcription).

Phrase-grouped karaoke-style captions: each phrase shows 3-4 words, all
visible, with the currently-spoken word highlighted. Optional title-card hook
for the first N seconds.

This is the words-json counterpart to the (documented but unshipped)
words_to_ass.py. Input is the {"words":[{start,end,word}]} format produced by
tool-transcription --output words-json.

Usage:
    python captions_from_words.py WORDS.json OUT.ass \
        --font "Montserrat" --font-size 120 \
        --highlight "#F8D481" --alignment 5 --margin-v 0 \
        --box-style backed --hook "AI Is A 60% Tool" --hook-duration 3.0

Colors are given as #RRGGBB and converted to ASS &HBBGGRR&.
"""

import argparse
import json
import sys


def hex_to_ass(hex_color, alpha="00"):
    """#RRGGBB -> &HAABBGGRR& for STYLE colour fields (BGR, leading alpha)."""
    h = hex_color.lstrip("#")
    r, g, b = h[0:2], h[2:4], h[4:6]
    return f"&H{alpha}{b}{g}{r}".upper() + "&"


def hex_to_inline(hex_color):
    """#RRGGBB -> &HBBGGRR& for inline \\c override tags (6 hex digits)."""
    h = hex_color.lstrip("#")
    r, g, b = h[0:2], h[2:4], h[4:6]
    return f"&H{b}{g}{r}".upper() + "&"


def ass_time(t):
    """seconds -> H:MM:SS.cc"""
    if t < 0:
        t = 0
    cs = int(round(t * 100))
    h, cs = divmod(cs, 360000)
    m, cs = divmod(cs, 6000)
    s, cs = divmod(cs, 100)
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def group_phrases(words, max_words=4, max_gap=0.8):
    """Group words into phrases of up to max_words, breaking on sentence-end
    punctuation or a long pause."""
    phrases, cur = [], []
    for w in words:
        if w.get("start") is None:
            if cur:
                cur[-1]["word"] += w.get("word", "")
            continue
        if cur:
            gap = w["start"] - cur[-1]["end"]
            prev = cur[-1]["word"].strip()
            if len(cur) >= max_words or gap > max_gap or prev.endswith((".", "!", "?")):
                phrases.append(cur)
                cur = []
        cur.append(dict(w))
    if cur:
        phrases.append(cur)
    return phrases


def esc(text):
    return text.replace("{", "(").replace("}", ")").strip()


def build_ass(words, args):
    white = hex_to_ass("#FFFFFF")
    hi = hex_to_ass(args.highlight)
    white_i = hex_to_inline("#FFFFFF")
    hi_i = hex_to_inline(args.highlight)
    hook_size = min(int(args.font_size * 1.3), 132)
    box = args.box_style == "backed"
    border_style = 3 if box else 1
    back = "&H8C000000&" if box else "&H00000000&"
    outline = 0 if box else 3

    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{args.font},{args.font_size},{white},{white},&H00000000&,{back},1,0,0,0,100,100,0,0,{border_style},{outline},0,{args.alignment},80,80,{args.margin_v},1
Style: Hook,{args.font},{hook_size},{white},{white},&H00000000&,&HB0000000&,1,0,0,0,100,100,0,0,3,0,0,8,60,60,90,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    lines = []

    kinetic = getattr(args, "kinetic", False)

    # Hook title card (first N seconds)
    if args.hook and args.hook_duration > 0:
        hook_tags = (
            "{\\fad(150,250)\\fscx70\\fscy70\\t(0,200,\\fscx100\\fscy100)}"
            if kinetic else "{\\fad(200,300)}"
        )
        lines.append(
            f"Dialogue: 0,{ass_time(0)},{ass_time(args.hook_duration)},Hook,,0,0,0,,"
            f"{hook_tags}{esc(args.hook).upper()}"
        )

    sub_start = args.hook_duration + 0.5 if args.hook else 0.0

    phrases = group_phrases(words)
    for phrase in phrases:
        full = [esc(w["word"]) for w in phrase]
        phrase_end = phrase[-1]["end"] + 0.15        # brief hold on last word
        for i, w in enumerate(phrase):
            # Each word stays on screen until the NEXT word begins, so the
            # whole phrase is continuously visible with the highlight moving.
            st = max(w["start"], sub_start)
            en = phrase[i + 1]["start"] if i + 1 < len(phrase) else phrase_end
            if en <= st:
                continue
            parts = []
            for j, tok in enumerate(full):
                if j == i:
                    parts.append(f"{{\\c{hi_i}}}{tok}{{\\c{white_i}}}")
                else:
                    parts.append(tok)
            text = " ".join(parts)
            # Kinetic: the first word of each phrase pops the whole line in.
            if kinetic and i == 0:
                text = "{\\fad(40,0)\\fscx86\\fscy86\\t(0,110,\\fscx100\\fscy100)}" + text
            lines.append(
                f"Dialogue: 0,{ass_time(st)},{ass_time(en)},Default,,0,0,0,,{text}"
            )

    return head + "\n".join(lines) + "\n"


def main():
    p = argparse.ArgumentParser()
    p.add_argument("words")
    p.add_argument("out")
    p.add_argument("--font", default="Montserrat")
    p.add_argument("--font-size", type=int, default=120)
    p.add_argument("--highlight", default="#F8D481")
    p.add_argument("--alignment", type=int, default=5)
    p.add_argument("--margin-v", type=int, default=0)
    p.add_argument("--box-style", default="backed", choices=["backed", "none"])
    p.add_argument("--hook", default="")
    p.add_argument("--hook-duration", type=float, default=3.0)
    p.add_argument("--kinetic", action="store_true", help="Pop-in animation on hook and each phrase")
    args = p.parse_args()

    data = json.load(open(args.words, encoding="utf-8"))
    words = data["words"] if isinstance(data, dict) else data
    words = [w for w in words if w.get("word", "").strip()]
    if not words:
        print("No words found", file=sys.stderr)
        sys.exit(1)

    ass = build_ass(words, args)
    with open(args.out, "w", encoding="utf-8") as f:
        f.write(ass)
    print(f"Wrote {args.out} ({len(words)} words)")


if __name__ == "__main__":
    main()
