"""Highlight selection for action / B-roll footage.

Finds the most watchable segments of a video WITHOUT relying on speech. Scores
every scene by a blend of motion energy (how much is moving) and audio energy
(engine notes, cheers, impacts, reactions), then greedily picks the strongest
non-overlapping segments to fill a target duration.

Standalone — no cross-package imports. Deps: opencv-python, numpy, ffmpeg.

Usage:
    python highlight_select.py --video IN.mp4 --target 30 \
        --min-seg 1.5 --max-seg 6 --motion-weight 0.55 --audio-weight 0.45 \
        --out clips.json

Output JSON:
    {"video_duration": 142.3,
     "clips": [{"start": 12.4, "end": 17.0, "score": 0.81,
                "motion": 0.74, "audio": 0.90}, ...]}
"""

import argparse
import json
import subprocess
import sys

import cv2
import numpy as np

for _s in (sys.stdout, sys.stderr):
    if hasattr(_s, "reconfigure"):
        _s.reconfigure(encoding="utf-8", errors="replace")

SAMPLE_W = 320          # downscaled analysis width
FRAME_STRIDE = 5        # analyse every Nth frame for speed
AUDIO_SR = 16000        # mono PCM sample rate for energy
AUDIO_WIN = 0.5         # seconds per audio RMS window


def probe(path):
    cmd = ["ffprobe", "-v", "quiet", "-print_format", "json",
           "-show_format", "-show_streams", str(path)]
    data = json.loads(subprocess.run(cmd, capture_output=True, text=True).stdout)
    vs = next(s for s in data["streams"] if s["codec_type"] == "video")
    num, den = vs["r_frame_rate"].split("/")
    fps = int(num) / int(den)
    duration = float(data["format"]["duration"])
    has_audio = any(s["codec_type"] == "audio" for s in data["streams"])
    return fps, duration, has_audio


def analyse_video(path, fps, duration):
    # Determine scaled dimensions up front.
    vs_cmd = ["ffprobe", "-v", "quiet", "-select_streams", "v:0",
              "-show_entries", "stream=width,height", "-print_format", "json", str(path)]
    dims = json.loads(subprocess.run(vs_cmd, capture_output=True, text=True).stdout)["streams"][0]
    w, h = int(dims["width"]), int(dims["height"])
    sh = int(h * SAMPLE_W / w)
    frame_bytes = SAMPLE_W * sh * 3

    cmd = ["ffmpeg", "-i", str(path),
           "-vf", f"select=not(mod(n\\,{FRAME_STRIDE})),scale={SAMPLE_W}:{sh}",
           "-vsync", "vfr", "-f", "rawvideo", "-pix_fmt", "bgr24", "-v", "quiet", "-"]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE)

    prev_gray = None
    prev_hist = None
    motion = []   # (time, score)
    cuts = []     # seconds
    idx = 0
    sample_dt = FRAME_STRIDE / fps

    while True:
        raw = proc.stdout.read(frame_bytes)
        if len(raw) < frame_bytes:
            break
        frame = np.frombuffer(raw, np.uint8).reshape(sh, SAMPLE_W, 3)
        t = idx * sample_dt
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        if prev_gray is not None:
            motion.append((t, float(np.mean(cv2.absdiff(gray, prev_gray)))))
        prev_gray = gray

        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        hist = cv2.calcHist([hsv], [0, 1], None, [32, 32], [0, 180, 0, 256])
        cv2.normalize(hist, hist)
        if prev_hist is not None:
            if cv2.compareHist(prev_hist, hist, cv2.HISTCMP_BHATTACHARYYA) > 0.4:
                cuts.append(t)
        prev_hist = hist
        idx += 1

    proc.wait()
    return motion, cuts


def audio_energy(path, duration):
    """Return list of (time, rms) over AUDIO_WIN windows. Empty if no audio."""
    cmd = ["ffmpeg", "-i", str(path), "-ac", "1", "-ar", str(AUDIO_SR),
           "-f", "s16le", "-v", "quiet", "-"]
    raw = subprocess.run(cmd, capture_output=True).stdout
    if not raw:
        return []
    samples = np.frombuffer(raw, np.int16).astype(np.float32) / 32768.0
    win = int(AUDIO_SR * AUDIO_WIN)
    out = []
    for i in range(0, len(samples) - win, win):
        chunk = samples[i:i + win]
        out.append((i / AUDIO_SR, float(np.sqrt(np.mean(chunk ** 2)))))
    return out


def normalise(vals):
    if not vals:
        return vals
    lo, hi = min(vals), max(vals)
    if hi - lo < 1e-9:
        return [0.0 for _ in vals]
    return [(v - lo) / (hi - lo) for v in vals]


def sample_at(series, t):
    """Nearest-value lookup in a (time, value) series."""
    if not series:
        return 0.0
    times = [s[0] for s in series]
    i = min(range(len(times)), key=lambda k: abs(times[k] - t))
    return series[i][1]


def build_segments(duration, cuts, min_seg, max_seg):
    """Turn cut points into candidate segments, splitting any over max_seg."""
    bounds = [0.0] + [c for c in cuts if 0 < c < duration] + [duration]
    bounds = sorted(set(round(b, 2) for b in bounds))
    segs = []
    for a, b in zip(bounds, bounds[1:]):
        length = b - a
        if length < min_seg:
            continue
        if length <= max_seg:
            segs.append((a, b))
        else:
            n = int(np.ceil(length / max_seg))
            step = length / n
            for k in range(n):
                segs.append((a + k * step, a + (k + 1) * step))
    return segs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--target", type=float, default=30.0)
    ap.add_argument("--min-seg", type=float, default=1.5)
    ap.add_argument("--max-seg", type=float, default=6.0)
    ap.add_argument("--motion-weight", type=float, default=0.55)
    ap.add_argument("--audio-weight", type=float, default=0.45)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    fps, duration, has_audio = probe(args.video)
    motion, cuts = analyse_video(args.video, fps, duration)
    audio = audio_energy(args.video, duration) if has_audio else []

    # Normalise the two signals independently.
    m_norm = list(zip([m[0] for m in motion], normalise([m[1] for m in motion])))
    a_norm = list(zip([a[0] for a in audio], normalise([a[1] for a in audio]))) if audio else []

    mw, aw = args.motion_weight, args.audio_weight
    if not audio:
        mw, aw = 1.0, 0.0  # silent footage: motion is everything

    segs = build_segments(duration, cuts, args.min_seg, args.max_seg)
    scored = []
    for a, b in segs:
        mid = (a + b) / 2.0
        mscore = sample_at(m_norm, mid)
        ascore = sample_at(a_norm, mid)
        score = mw * mscore + aw * ascore
        scored.append({"start": round(a, 2), "end": round(b, 2),
                       "score": round(score, 3),
                       "motion": round(mscore, 3), "audio": round(ascore, 3)})

    scored.sort(key=lambda s: s["score"], reverse=True)

    # Greedily fill the target duration with the strongest segments,
    # then re-sort the chosen set back into chronological order.
    picked, total = [], 0.0
    for s in scored:
        if total >= args.target:
            break
        picked.append(s)
        total += s["end"] - s["start"]
    picked.sort(key=lambda s: s["start"])

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump({"video_duration": round(duration, 2),
                   "selected_duration": round(total, 2),
                   "has_audio": has_audio,
                   "clips": picked}, f, indent=2)
    print(f"  Selected {len(picked)} segments, {total:.1f}s of {duration:.1f}s -> {args.out}")


if __name__ == "__main__":
    main()
