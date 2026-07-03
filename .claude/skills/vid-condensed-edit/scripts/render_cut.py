#!/usr/bin/env python3
"""Render a condensed edit from a cutlist.

Usage:
  python render_cut.py --video src.mp4 --cutlist cutlist.json --out condensed.mp4

cutlist.json:
  {
    "cold_open": {"start": 123.4, "end": 151.2, "label": "hook"},   # optional
    "segments":  [{"start": 60.1, "end": 245.8, "label": "..."}]
  }

Re-encodes (libx264 crf 18) so cuts are frame-accurate. Audio gets a 30 ms
fade at each joint to avoid clicks.
"""
import argparse, json, subprocess, sys, os

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--cutlist", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--crf", default="18")
    ap.add_argument("--preset", default="fast")
    args = ap.parse_args()

    with open(args.cutlist, encoding="utf-8") as f:
        cl = json.load(f)

    ranges = []
    if cl.get("cold_open"):
        ranges.append(cl["cold_open"])
    ranges += cl.get("segments", [])
    if not ranges:
        sys.exit("cutlist has no ranges")

    for r in ranges:
        if r["end"] <= r["start"]:
            sys.exit(f"bad range: {r}")

    parts_v, parts_a, fc = [], [], []
    for i, r in enumerate(ranges):
        s, e = r["start"], r["end"]
        dur = e - s
        fade_out_at = max(0.0, dur - 0.03)
        fc.append(
            f"[0:v]trim=start={s}:end={e},setpts=PTS-STARTPTS[v{i}];"
            f"[0:a]atrim=start={s}:end={e},asetpts=PTS-STARTPTS,"
            f"afade=t=in:st=0:d=0.03,afade=t=out:st={fade_out_at:.3f}:d=0.03[a{i}]"
        )
        parts_v.append(f"[v{i}]")
        parts_a.append(f"[a{i}]")

    n = len(ranges)
    fc.append("".join(f"{v}{a}" for v, a in zip(parts_v, parts_a)) + f"concat=n={n}:v=1:a=1[outv][outa]")
    filter_complex = ";".join(fc)

    total = sum(r["end"] - r["start"] for r in ranges)
    print(f"Rendering {n} ranges, total {total/60:.1f} min -> {args.out}")

    cmd = [
        "ffmpeg", "-y", "-i", args.video,
        "-filter_complex", filter_complex,
        "-map", "[outv]", "-map", "[outa]",
        "-c:v", "libx264", "-crf", args.crf, "-preset", args.preset,
        "-c:a", "aac", "-b:a", "192k",
        # Zoom sources carry a timecode/data track; without these flags the MP4
        # muxer re-writes it at FULL SOURCE duration and players report the
        # wrong length (e.g. 31:42 on a 13:25 cut).
        "-dn", "-map_metadata", "-1", "-write_tmcd", "0",
        "-movflags", "+faststart",
        args.out,
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(res.stderr[-3000:])
        sys.exit("ffmpeg failed")
    size_mb = os.path.getsize(args.out) / 1048576
    print(f"Done: {args.out} ({size_mb:.0f} MB)")

if __name__ == "__main__":
    main()
