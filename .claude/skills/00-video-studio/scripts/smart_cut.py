"""Phrase-anchored smart cut for talking-head clips.

Given AssemblyAI word timings and a list of keep-segments (each defined by a
start phrase and an end phrase), resolve exact timestamps, extract each segment
frame-accurately, and concatenate into one tight clip — dropping the filler
between segments.

Usage:
    python smart_cut.py --words transcript.words.json --video master.mp4 \
        --plan plan.json --out cut.mp4 [--dry-run] [--pad-in 0.10] [--pad-out 0.15]

plan.json:
    [{"start": "i was nearly scammed", "end": "las vegas book club"},
     {"start": "being from the it background", "end": "meetup is the right place"}]

Matching is case/punctuation-insensitive on token sequences.
"""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

for _s in (sys.stdout, sys.stderr):
    if hasattr(_s, "reconfigure"):
        _s.reconfigure(encoding="utf-8", errors="replace")


def norm(s):
    return re.sub(r"[^a-z0-9 ]", "", s.lower()).split()


def find_span(tokens, times, phrase, search_from=0):
    """Return (start_sec, end_sec, end_index) for the first token-run matching phrase."""
    pt = norm(phrase)
    if not pt:
        return None
    for i in range(search_from, len(tokens) - len(pt) + 1):
        if tokens[i:i + len(pt)] == pt:
            return times[i][0], times[i + len(pt) - 1][1], i + len(pt) - 1
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--words", required=True)
    ap.add_argument("--video", required=True)
    ap.add_argument("--plan", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--pad-in", type=float, default=0.10)
    ap.add_argument("--pad-out", type=float, default=0.18)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    data = json.load(open(args.words, encoding="utf-8"))
    words = data["words"]
    tokens = [norm(w["text"])[0] if norm(w["text"]) else "" for w in words]
    times = [(w["start"], w["end"]) for w in words]
    plan = json.load(open(args.plan, encoding="utf-8"))

    segs, cursor = [], 0
    for k, seg in enumerate(plan):
        s = find_span(tokens, times, seg["start"], cursor)
        if not s:
            print(f"  ! segment {k}: start phrase not found: {seg['start']!r}", file=sys.stderr)
            sys.exit(2)
        e = find_span(tokens, times, seg["end"], s[2])
        if not e:
            print(f"  ! segment {k}: end phrase not found after start: {seg['end']!r}", file=sys.stderr)
            sys.exit(2)
        start = max(0.0, s[0] - args.pad_in)
        end = e[1] + args.pad_out
        segs.append((start, end))
        cursor = e[2] + 1
        print(f"  seg {k}: {start:6.2f}s -> {end:6.2f}s  ({end-start:5.2f}s)  "
              f"\"{seg['start'][:30]}...\" -> \"...{seg['end'][-30:]}\"")

    total = sum(e - s for s, e in segs)
    print(f"  TOTAL: {total:.1f}s across {len(segs)} segments")

    if args.dry_run:
        return

    out = Path(args.out)
    work = out.parent / "_segs"
    work.mkdir(exist_ok=True)
    parts = []
    for i, (s, e) in enumerate(segs):
        p = work / f"seg_{i}.mp4"
        subprocess.run(["ffmpeg", "-y", "-ss", str(s), "-i", args.video, "-t", str(e - s),
                        "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
                        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
                        "-v", "error", str(p)], check=True)
        parts.append(p)

    concat_file = work / "concat.txt"
    concat_file.write_text("".join(f"file '{p.resolve().as_posix()}'\n" for p in parts), encoding="utf-8")
    subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_file),
                    "-c", "copy", "-movflags", "+faststart", "-v", "error", str(out)], check=True)
    print(f"  wrote {out} ({total:.1f}s)")


if __name__ == "__main__":
    main()
