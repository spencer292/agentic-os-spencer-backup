#!/usr/bin/env python3
"""Thumbnail contact sheet — candidate frames for the user to choose from.

Usage:
  python contact_sheet.py --video condensed.mp4 --count 12 --out thumbs/

Writes thumbs/frame_{seconds}s.jpg for each candidate plus thumbs/sheet.jpg
(numbered grid). The USER picks the frame — never auto-select.
"""
import argparse, subprocess, sys, os, json, math

def probe_duration(video):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", video],
        capture_output=True, text=True)
    return float(json.loads(out.stdout)["format"]["duration"])

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--count", type=int, default=12)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)
    dur = probe_duration(args.video)
    # skip first/last 3% (title cards, end screens)
    lo, hi = dur * 0.03, dur * 0.97
    times = [lo + (hi - lo) * i / (args.count - 1) for i in range(args.count)]

    files = []
    for t in times:
        fname = os.path.join(args.out, f"frame_{int(t)}s.jpg")
        subprocess.run(["ffmpeg", "-y", "-ss", f"{t:.2f}", "-i", args.video,
                        "-frames:v", "1", "-q:v", "2", fname],
                       capture_output=True)
        files.append(fname)

    cols = 4
    rows = math.ceil(len(files) / cols)
    inputs = []
    for f in files:
        inputs += ["-i", f]
    labeled = ";".join(
        f"[{i}:v]scale=480:-1,drawtext=text='{os.path.basename(f)}':x=10:y=10:fontsize=28:fontcolor=yellow:box=1:boxcolor=black@0.6[l{i}]"
        for i, f in enumerate(files))
    grid_in = "".join(f"[l{i}]" for i in range(len(files)))
    fc = f"{labeled};{grid_in}xstack=inputs={len(files)}:layout=" + "|".join(
        f"{(i % cols)}_{(i // cols)}".replace(
            f"{i % cols}", f"{(i % cols)}*w0").replace(
            f"{i // cols}", f"{(i // cols)}*h0")
        for i in range(len(files))) + "[out]"
    sheet = os.path.join(args.out, "sheet.jpg")
    res = subprocess.run(["ffmpeg", "-y", *inputs, "-filter_complex", fc,
                          "-map", "[out]", "-q:v", "3", sheet],
                         capture_output=True, text=True)
    if res.returncode != 0:
        # fall back: tile filter (simpler, no labels)
        res2 = subprocess.run(
            ["ffmpeg", "-y", "-pattern_type", "none", *inputs,
             "-filter_complex",
             "".join(f"[{i}:v]scale=480:-1[s{i}];" for i in range(len(files))) +
             "".join(f"[s{i}]" for i in range(len(files))) +
             f"xstack=inputs={len(files)}:grid={cols}x{rows}[out]",
             "-map", "[out]", "-q:v", "3", sheet],
            capture_output=True, text=True)
        if res2.returncode != 0:
            print(res2.stderr[-1500:])
            print("grid failed — individual frames are still in", args.out)
            sys.exit(0)
    print(f"Wrote {len(files)} frames + {sheet}")

if __name__ == "__main__":
    main()
