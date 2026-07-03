"""AssemblyAI transcription — word-level timestamps, stdlib only (no pip deps).

Reads ASSEMBLYAI_API_KEY from the environment, or parses it from the project .env
WITHOUT printing it. Extracts audio from the input with ffmpeg, uploads to
AssemblyAI, polls until the transcript is ready, and writes:
  - <out>.words.json : [{"text","start","end","confidence"}, ...] (seconds)
  - <out>.srt        : caption-ready SRT
  - <out>.txt        : plain transcript

Usage:
    python transcribe_assemblyai.py --input master.mp4 --out transcript [--env /path/.env]

Exit codes: 0 ok | 2 no key | 3 api error | 4 ffmpeg error
"""

import argparse
import json
import os
import subprocess
import sys
import time
import urllib.request
import urllib.error

API = "https://api.assemblyai.com/v2"
KEY_NAME = "ASSEMBLYAI_API_KEY"

for _s in (sys.stdout, sys.stderr):
    if hasattr(_s, "reconfigure"):
        _s.reconfigure(encoding="utf-8", errors="replace")


def load_key(env_path):
    """Return the API key from env, else parse it from .env. Never print it."""
    key = os.environ.get(KEY_NAME, "").strip()
    if key:
        return key
    if env_path and os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith(KEY_NAME + "="):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    return ""


def extract_audio(video_path, audio_path):
    cmd = ["ffmpeg", "-y", "-i", video_path, "-ac", "1", "-ar", "16000",
           "-c:a", "libmp3lame", "-q:a", "5", audio_path, "-v", "error"]
    r = subprocess.run(cmd)
    if r.returncode != 0 or not os.path.exists(audio_path):
        print("ffmpeg audio extraction failed", file=sys.stderr)
        sys.exit(4)


def http(method, url, key, data=None, json_body=None):
    headers = {"authorization": key}
    body = data
    if json_body is not None:
        body = json.dumps(json_body).encode()
        headers["content-type"] = "application/json"
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        print(f"AssemblyAI HTTP {e.code}: {e.read().decode()[:300]}", file=sys.stderr)
        sys.exit(3)


def upload(audio_path, key):
    with open(audio_path, "rb") as f:
        data = f.read()
    print(f"  uploading {len(data)/1e6:.1f} MB audio...")
    return http("POST", f"{API}/upload", key, data=data)["upload_url"]


def transcribe(audio_url, key):
    body = {"audio_url": audio_url, "punctuate": True, "format_text": True}
    tid = http("POST", f"{API}/transcript", key, json_body=body)["id"]
    print(f"  transcript id: {tid}, polling...")
    while True:
        t = http("GET", f"{API}/transcript/{tid}", key)
        st = t["status"]
        if st == "completed":
            return t
        if st == "error":
            print(f"AssemblyAI error: {t.get('error')}", file=sys.stderr)
            sys.exit(3)
        time.sleep(3)


def write_srt(words, path):
    def ts(sec):
        h = int(sec // 3600); m = int((sec % 3600) // 60)
        s = int(sec % 60); ms = int(round((sec - int(sec)) * 1000))
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
    # Group words into ~5-word caption lines.
    lines, i, n = [], 0, 0
    while i < len(words):
        grp = words[i:i + 5]
        n += 1
        start = grp[0]["start"]; end = grp[-1]["end"]
        text = " ".join(w["text"] for w in grp)
        lines.append(f"{n}\n{ts(start)} --> {ts(end)}\n{text}\n")
        i += 5
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--env", default=None,
                    help="Override .env path. Defaults to the project root .env, "
                         "resolved from this script's location.")
    args = ap.parse_args()

    # Resolve the project-root .env internally so callers never name it on the CLI.
    if args.env is None:
        root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
        args.env = os.path.join(root, ".env")

    key = load_key(args.env)
    if not key:
        print(f"{KEY_NAME} not found in environment or .env", file=sys.stderr)
        sys.exit(2)

    audio_path = args.out + ".audio.mp3"
    extract_audio(args.input, audio_path)
    url = upload(audio_path, key)
    t = transcribe(url, key)

    words = [{"text": w["text"], "start": w["start"] / 1000.0,
              "end": w["end"] / 1000.0, "confidence": w.get("confidence")}
             for w in t.get("words", [])]
    with open(args.out + ".words.json", "w", encoding="utf-8") as f:
        json.dump({"text": t.get("text", ""), "words": words}, f, indent=2)
    with open(args.out + ".txt", "w", encoding="utf-8") as f:
        f.write(t.get("text", ""))
    write_srt(words, args.out + ".srt")

    dur = words[-1]["end"] if words else 0
    print(f"  done: {len(words)} words, {dur:.1f}s -> {args.out}.words.json / .srt / .txt")
    try:
        os.remove(audio_path)
    except OSError:
        pass


if __name__ == "__main__":
    main()
