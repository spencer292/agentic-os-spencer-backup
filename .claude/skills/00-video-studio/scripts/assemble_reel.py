"""Assembly compositor for the studio lane (highlight/assembly path).

Takes an ordered plan of video segments + photos and builds one 9:16 reel:
  - every item normalised to 1080x1920 / 30fps / yuv420p / 48k stereo
    (cover-crop fills the frame for ANY source aspect — landscape GoPro,
     portrait phone, square — so mixed orientations concatenate cleanly)
  - photos become Ken-Burns clips (slow zoom)
  - silent clips get a silent audio track so streams stay uniform
  - segments concatenated (re-encoded for reliability) into the base reel
  - optional music bed mixed underneath at a set gain, looped/trimmed to length

Usage:
    python assemble_reel.py --plan plan.json --srcdir <source/> --out reel.mp4

plan.json:
    {
      "items": [
        {"type": "video", "file": "clip01.mp4", "start": 12.4, "end": 17.0, "mute": false},
        {"type": "photo", "file": "shot01.jpg", "duration": 2.5},
        {"type": "video", "file": "clip02.mov", "start": 3.0,  "end": 8.5, "mute": true}
      ],
      "music": "6_Assets/music/track.mp3",   // or null
      "music_gain_db": -12
    }

HEIC photos are auto-converted to JPG if ffmpeg can read them; if not, the item
is skipped with a warning (convert upstream).
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path

for _s in (sys.stdout, sys.stderr):
    if hasattr(_s, "reconfigure"):
        _s.reconfigure(encoding="utf-8", errors="replace")

W, H, FPS = 1080, 1920, 30
# Fill-the-frame for any input aspect, then lock fps/pixfmt/SAR.
VFILTER = (f"scale={W}:{H}:force_original_aspect_ratio=increase,"
           f"crop={W}:{H},fps={FPS},format=yuv420p,setsar=1")


def run(cmd):
    r = subprocess.run(cmd)
    if r.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {' '.join(str(c) for c in cmd[:8])}...")


def normalize_video_safe(src, start, end, mute, out):
    """Robust path: cover-crop video; always attach a fresh silent OR real stereo track.

    We probe for audio; if absent or mute requested, synthesize silence so every
    normalized clip has identical stream layout for a clean concat.
    """
    has_audio = bool(subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries",
         "stream=index", "-of", "csv=p=0", str(src)],
        capture_output=True, text=True).stdout.strip())
    dur = end - start
    if mute or not has_audio:
        run(["ffmpeg", "-y", "-ss", str(start), "-i", str(src), "-t", str(dur),
             "-f", "lavfi", "-t", str(dur), "-i", "anullsrc=r=48000:cl=stereo",
             "-vf", VFILTER, "-map", "0:v:0", "-map", "1:a:0",
             "-c:v", "libx264", "-preset", "medium", "-crf", "20",
             "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2",
             "-shortest", "-movflags", "+faststart", "-v", "error", str(out)])
    else:
        run(["ffmpeg", "-y", "-ss", str(start), "-i", str(src), "-t", str(dur),
             "-vf", VFILTER, "-af", "aresample=48000", "-ac", "2",
             "-c:v", "libx264", "-preset", "medium", "-crf", "20",
             "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2",
             "-movflags", "+faststart", "-v", "error", str(out)])


def normalize_photo(src, duration, out):
    """Ken-Burns: slow zoom on the still, scaled up first to avoid jitter."""
    frames = int(duration * FPS)
    vf = (f"scale={W*2}:{H*2}:force_original_aspect_ratio=increase,crop={W*2}:{H*2},"
          f"zoompan=z='min(zoom+0.0012,1.18)':d={frames}:s={W}x{H}:fps={FPS},"
          f"format=yuv420p,setsar=1")
    run(["ffmpeg", "-y", "-loop", "1", "-i", str(src), "-t", str(duration),
         "-f", "lavfi", "-t", str(duration), "-i", "anullsrc=r=48000:cl=stereo",
         "-vf", vf, "-map", "0:v:0", "-map", "1:a:0",
         "-c:v", "libx264", "-preset", "medium", "-crf", "20",
         "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2",
         "-shortest", "-movflags", "+faststart", "-v", "error", str(out)])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--plan", required=True)
    ap.add_argument("--srcdir", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    plan = json.load(open(args.plan, encoding="utf-8"))
    srcdir = Path(args.srcdir)
    out = Path(args.out)
    work = out.parent / "_assemble"
    work.mkdir(parents=True, exist_ok=True)

    parts = []
    for i, item in enumerate(plan["items"]):
        dst = work / f"part_{i:02d}.mp4"
        src = srcdir / item["file"]
        if not src.exists():
            print(f"  ! item {i}: missing {src}, skipped", file=sys.stderr)
            continue
        try:
            if item["type"] == "video":
                normalize_video_safe(src, item["start"], item["end"], item.get("mute", False), dst)
            elif item["type"] == "photo":
                normalize_photo(src, item.get("duration", 2.5), dst)
            else:
                print(f"  ! item {i}: unknown type {item['type']}", file=sys.stderr); continue
            parts.append(dst)
            print(f"  normalized item {i} ({item['type']}: {item['file']})")
        except Exception as e:
            print(f"  ! item {i}: failed ({e}), skipped", file=sys.stderr)

    if not parts:
        print("no parts produced", file=sys.stderr); sys.exit(2)

    # Concat (re-encode for reliability across mixed sources).
    concat_file = work / "concat.txt"
    concat_file.write_text("".join(f"file '{p.resolve().as_posix()}'\n" for p in parts), encoding="utf-8")
    base = work / "base.mp4"
    run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_file),
         "-c:v", "libx264", "-preset", "medium", "-crf", "20",
         "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2",
         "-movflags", "+faststart", "-v", "error", str(base)])

    music = plan.get("music")
    if music and Path(music).exists():
        gain = plan.get("music_gain_db", -12)
        duck = plan.get("duck", False)
        if duck:
            # Sidechain: music ducks under the base audio (voice + engine), swells in
            # the silent montage gaps. "Voice up, music ducks, then music pulls back."
            fc = (f"[0:a]asplit=2[base][key];"
                  f"[1:a]volume={gain}dB[mus];"
                  f"[mus][key]sidechaincompress=threshold=0.02:ratio=12:attack=15:release=350[md];"
                  f"[base][md]amix=inputs=2:duration=first:dropout_transition=2,dynaudnorm=f=200[a]")
        else:
            fc = (f"[1:a]volume={gain}dB[m];"
                  f"[0:a][m]amix=inputs=2:duration=first:dropout_transition=2,dynaudnorm[a]")
        run(["ffmpeg", "-y", "-i", str(base), "-stream_loop", "-1", "-i", str(music),
             "-filter_complex", fc,
             "-map", "0:v:0", "-map", "[a]",
             "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-shortest",
             "-movflags", "+faststart", "-v", "error", str(out)])
        print(f"  mixed music bed ({gain} dB, duck={duck}) -> {out}")
    else:
        if music:
            print(f"  ! music file not found ({music}); writing without bed", file=sys.stderr)
        run(["ffmpeg", "-y", "-i", str(base), "-c", "copy", "-movflags", "+faststart",
             "-v", "error", str(out)])
        print(f"  wrote {out} (no music)")

    dur = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "csv=p=0", str(out)], capture_output=True, text=True).stdout.strip()
    print(f"  reel duration: {dur}s, {len(parts)} segments")


if __name__ == "__main__":
    main()
