#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = []
# ///
"""preview_carousel.py — render a self-contained LinkedIn-mock HTML preview of a
generated social-content run.

Canonical Phase 7.5 generator for the 00-social-content pipeline. The orchestrator
calls this instead of authoring index.html inline. Reads everything from the run
folder + brand_context — nothing the orchestrator knows that this can't read.

Usage:
    python preview_carousel.py <run_folder> [--brand-context DIR] [--open]

Reads from <run_folder>:
    slide-*.png        carousel slides (sorted numerically) OR single image.png
    caption.md         post caption (markdown-ish plain text; hashtags trailing)
Reads from brand_context (auto-detected as <run>/../../../../brand_context if not given):
    voice-profile.md                       -> author handle/name (optional)
    visual-identity/tokens.json            -> brand name fallback
    visual-identity/logos/*-transparent.png-> author avatar (optional)

Writes:
    <run_folder>/preview/index.html        self-contained (slides embedded as base64)

Prints the absolute HTML path + a fill-in feedback template to stdout.
"""
import argparse
import base64
import html
import json
import re
import sys
from pathlib import Path


def _b64_img(path: Path) -> str:
    suffix = path.suffix.lower().lstrip(".")
    mime = {"jpg": "jpeg", "jpeg": "jpeg", "png": "png", "webp": "webp", "svg": "svg+xml"}.get(suffix, "png")
    return f"data:image/{mime};base64,{base64.b64encode(path.read_bytes()).decode()}"


def _find_slides(run: Path) -> list[Path]:
    slides = sorted(
        run.glob("slide-*.png"),
        key=lambda p: int(re.search(r"slide-(\d+)", p.name).group(1)) if re.search(r"slide-(\d+)", p.name) else 0,
    )
    if slides:
        return slides
    single = [p for p in (run / "image.png", run / "single.png") if p.exists()]
    return single


def _resolve_brand_context(run: Path, override: str | None) -> Path | None:
    if override:
        bc = Path(override)
        return bc if bc.is_dir() else None
    # run is {output_base}/{date}/{slug}; project root is typically 4 levels up
    for up in range(3, 7):
        cand = run
        for _ in range(up):
            cand = cand.parent
        bc = cand / "brand_context"
        if bc.is_dir():
            return bc
    return None


def _author(run: Path, bc: Path | None) -> tuple[str, str, str | None]:
    """Return (display_name, handle, avatar_data_uri|None)."""
    name, handle, avatar = "", "", None
    if bc:
        vp = bc / "voice-profile.md"
        if vp.is_file():
            txt = vp.read_text(encoding="utf-8", errors="ignore")
            m = re.search(r"(?:brand|name|author)\s*[:=]\s*(.+)", txt, re.IGNORECASE)
            if m:
                name = m.group(1).strip().strip('"')
        tok = bc / "visual-identity" / "tokens.json"
        if tok.is_file() and not name:
            try:
                data = json.loads(tok.read_text(encoding="utf-8"))
                name = data.get("brand") or ""
                handle = data.get("handle") or ""
            except json.JSONDecodeError:
                pass
        logos = list((bc / "visual-identity" / "logos").glob("*-transparent.png")) if (bc / "visual-identity" / "logos").is_dir() else []
        if logos:
            avatar = _b64_img(logos[0])
    name = name or "Your Brand"
    handle = handle or re.sub(r"[^a-z0-9]+", "", name.lower())
    return name, handle, avatar


def _caption_html(run: Path) -> str:
    cap = run / "caption.md"
    if not cap.is_file():
        return "<em>(no caption.md)</em>"
    raw = cap.read_text(encoding="utf-8").strip()
    # Normalise then escape once (quote=False): caption.md is plain text, so any
    # pre-existing entity (e.g. `&#39;` for an apostrophe) is unescaped first to
    # avoid double-escaping into a visible `&#39;`. quote=False keeps apostrophes
    # and quotes literal — they need no escaping inside HTML text content.
    esc = html.escape(html.unescape(raw), quote=False)
    # bold hashtags, preserve line breaks
    esc = re.sub(r"(#\w+)", r'<span class="tag">\1</span>', esc)
    return esc.replace("\n", "<br>")


HTML_TMPL = """<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>LinkedIn preview — {slug}</title>
<style>
  :root {{ --li-bg:#f4f2ee; --card:#fff; --ink:#1b1b1b; --muted:#666; --line:#e0dfdc; --blue:#0a66c2; }}
  * {{ box-sizing:border-box; margin:0; padding:0; }}
  body {{ background:var(--li-bg); font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; color:var(--ink); padding:32px 12px; }}
  .post {{ max-width:555px; margin:0 auto; background:var(--card); border:1px solid var(--line); border-radius:10px; overflow:hidden; }}
  .head {{ display:flex; align-items:center; gap:8px; padding:12px 16px; }}
  .avatar {{ width:48px; height:48px; border-radius:50%; background:#1a1818; object-fit:contain; flex:0 0 auto; }}
  .who {{ line-height:1.25; }}
  .who .name {{ font-weight:600; font-size:14px; }}
  .who .sub {{ color:var(--muted); font-size:12px; }}
  .caption {{ padding:4px 16px 12px; font-size:14px; line-height:1.45; white-space:normal; }}
  .tag {{ color:var(--blue); font-weight:600; }}
  .viewer {{ position:relative; background:#000; }}
  .viewer img {{ display:block; width:100%; height:auto; }}
  .nav {{ position:absolute; top:50%; transform:translateY(-50%); width:40px; height:40px; border-radius:50%; border:none; background:rgba(255,255,255,.92); font-size:20px; cursor:pointer; box-shadow:0 1px 4px rgba(0,0,0,.3); }}
  .prev {{ left:10px; }} .next {{ right:10px; }}
  .counter {{ position:absolute; top:10px; right:12px; background:rgba(0,0,0,.6); color:#fff; font-size:12px; padding:3px 8px; border-radius:10px; }}
  .dots {{ display:flex; gap:6px; justify-content:center; padding:10px; }}
  .dot {{ width:7px; height:7px; border-radius:50%; background:#c9c7c3; }}
  .dot.on {{ background:var(--blue); }}
  .react {{ display:flex; gap:18px; padding:10px 16px; border-top:1px solid var(--line); color:var(--muted); font-size:13px; }}
  .react span {{ cursor:default; }}
  .hint {{ max-width:555px; margin:14px auto 0; color:var(--muted); font-size:12px; text-align:center; }}
  .dlbtn {{ background:var(--blue); color:#fff; border:none; border-radius:24px; padding:10px 18px; font-size:14px; font-weight:600; cursor:pointer; box-shadow:0 1px 4px rgba(0,0,0,.18); }}
  .dlbtn:hover {{ background:#084e96; }}
  .dlbtn:disabled {{ opacity:.6; cursor:default; }}
  .dlnote {{ color:var(--muted); font-size:12px; }}
  .dlbar-bottom {{ max-width:555px; margin:20px auto 48px; display:flex; flex-direction:column; align-items:center; gap:10px; }}
  .dlbtn-lg {{ width:100%; max-width:380px; padding:16px 30px; font-size:17px; border-radius:30px; }}
  .dlbar-bottom .dlnote {{ text-align:center; }}
  .guidelink {{ color:var(--blue); font-size:13px; text-decoration:none; border-bottom:1px solid transparent; cursor:pointer; }}
  .guidelink:hover {{ border-bottom-color:var(--blue); }}
</style></head><body>
<div class="post">
  <div class="head">
    {avatar_html}
    <div class="who"><div class="name">{name}</div><div class="sub">{handle} · 1st</div><div class="sub">now · Edited · 🌐</div></div>
  </div>
  <div class="caption">{caption}</div>
  <div class="viewer">
    <div class="counter"><span id="cur">1</span> / {n}</div>
    {imgs}
    {nav}
  </div>
  <div class="dots">{dots}</div>
  <div class="react"><span>👍❤️💡 {likes}</span><span>{comments} comments</span><span>{reposts} reposts</span></div>
</div>
<div class="hint">Self-contained preview · double-click this file to open · {n} slide(s)</div>
<div class="dlbar-bottom">
  <button id="dlbtn-bottom" class="dlbtn dlbtn-lg">&#x2B07; Install &ldquo;{slug}&rdquo; to a folder</button>
  <span id="dlnote-bottom" class="dlnote"></span>
  <a id="guidelink" class="guidelink" href="#">&#x1F4D6; Editing in Canva? Open the Magic Layers guide</a>
</div>
<script>
  var slides = Array.prototype.slice.call(document.querySelectorAll('.viewer img'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.dot'));
  var cur = 0;
  function show(i){{ cur=(i+slides.length)%slides.length; slides.forEach(function(s,k){{s.style.display=k===cur?'block':'none';}}); dots.forEach(function(d,k){{d.className='dot'+(k===cur?' on':'');}}); document.getElementById('cur').textContent=cur+1; }}
  var p=document.querySelector('.prev'), n=document.querySelector('.next');
  if(p) p.onclick=function(){{show(cur-1);}};
  if(n) n.onclick=function(){{show(cur+1);}};
  document.addEventListener('keydown',function(e){{if(e.key==='ArrowLeft')show(cur-1);if(e.key==='ArrowRight')show(cur+1);}});
  show(0);
</script>
</body></html>"""


# Injected verbatim before </body> AFTER HTML_TMPL.format() runs, so its many `{`/`}`
# never reach str.format (no brace-doubling needed). __DL_SLUG__ / __DL_CAPTION_B64__ /
# __DL_GUIDE_B64__ are filled via str.replace. Writes a real folder ({slug}/ with the PNGs +
# caption.md)
# into a user-chosen location (e.g. Downloads) via the File System Access API, so the
# self-contained preview hands the assets straight to Canva. Chrome/Edge get the folder;
# Safari/Firefox (no API) fall back to downloading each file individually.
DOWNLOAD_SCRIPT = r"""<script>
(function(){
  var DL_SLUG = "__DL_SLUG__";
  var DL_CAPTION_B64 = "__DL_CAPTION_B64__";
  var DL_GUIDE_B64 = "__DL_GUIDE_B64__";

  function b64ToBytes(b64){
    var bin=atob(b64), out=new Uint8Array(bin.length);
    for(var i=0;i<bin.length;i++) out[i]=bin.charCodeAt(i);
    return out;
  }
  function mimeFor(name){
    if(/\.png$/i.test(name)) return "image/png";
    if(/\.jpe?g$/i.test(name)) return "image/jpeg";
    if(/\.webp$/i.test(name)) return "image/webp";
    if(/\.md$/i.test(name)) return "text/markdown";
    return "application/octet-stream";
  }
  function collectFiles(){
    var files=[];
    var imgs=Array.prototype.slice.call(document.querySelectorAll(".viewer img"));
    imgs.forEach(function(im, idx){
      var src=im.getAttribute("src")||"";
      var comma=src.indexOf(",");
      if(src.indexOf("base64")<0 || comma<0) return;
      var name=im.getAttribute("data-name") || ("slide-"+(idx+1)+".png");
      files.push({ name:name, bytes:b64ToBytes(src.slice(comma+1)) });
    });
    if(DL_CAPTION_B64) files.push({ name:"caption.md", bytes:b64ToBytes(DL_CAPTION_B64) });
    return files;
  }
  function downloadOne(name, bytes){
    var blob=new Blob([bytes], {type:mimeFor(name)});
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a");
    a.href=url; a.download=name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 4000);
  }
  function fallbackDownloads(files, note){
    note.textContent="this browser can't create a folder here — downloading "+files.length+" files individually";
    files.forEach(function(f){ downloadOne(f.name, f.bytes); });
  }

  function save(btn, note){
    var files=collectFiles();
    if(!files.length){ note.textContent="nothing to save"; return; }

    if(window.showDirectoryPicker){
      btn.disabled=true; note.textContent="choose a folder (e.g. Downloads)…";
      (async function(){
        try{
          // id makes the browser remember the last-used folder for this preview,
          // so repeat saves jump straight there instead of re-navigating.
          var dir=await window.showDirectoryPicker({ id:"ssc-canva", mode:"readwrite", startIn:"downloads" });
          var sub=await dir.getDirectoryHandle(DL_SLUG, { create:true });
          for(var i=0;i<files.length;i++){
            var fh=await sub.getFileHandle(files[i].name, { create:true });
            var w=await fh.createWritable();
            await w.write(files[i].bytes);
            await w.close();
          }
          note.textContent="✓ installed "+files.length+" files to "+DL_SLUG+"/ in the chosen folder";
        }catch(e){
          if(e && e.name==="AbortError"){ note.textContent="cancelled"; }
          else { fallbackDownloads(files, note); }
        }
        btn.disabled=false;
      })();
      return;
    }

    fallbackDownloads(files, note);
  }

  function bind(btnId, noteId){
    var btn=document.getElementById(btnId), note=document.getElementById(noteId);
    if(btn && note) btn.addEventListener("click", function(){ save(btn, note); });
  }
  bind("dlbtn-bottom", "dlnote-bottom");

  // Canva editing guide — open the embedded PDF via a Blob URL (data: URLs are
  // blocked for top-level navigation in Chrome; blob: opened on a click gesture is fine).
  var glink=document.getElementById("guidelink");
  if(glink){
    if(!DL_GUIDE_B64){ glink.style.display="none"; }
    else glink.addEventListener("click", function(ev){
      ev.preventDefault();
      var blob=new Blob([b64ToBytes(DL_GUIDE_B64)], {type:"application/pdf"});
      window.open(URL.createObjectURL(blob), "_blank");
    });
  }
})();
</script>"""


def main() -> int:
    ap = argparse.ArgumentParser(description="Generate a LinkedIn-mock HTML preview of a social-content run.")
    ap.add_argument("run_folder")
    ap.add_argument("--brand-context", default=None)
    args = ap.parse_args()

    run = Path(args.run_folder).resolve()
    if not run.is_dir():
        print(f"ERROR: run folder not found: {run}", file=sys.stderr)
        return 1

    slides = _find_slides(run)
    if not slides:
        print(f"ERROR: no slide-*.png or image.png in {run}", file=sys.stderr)
        return 1

    bc = _resolve_brand_context(run, args.brand_context)
    name, handle, avatar = _author(run, bc)

    imgs = "\n".join(
        f'<img src="{_b64_img(p)}" data-name="{p.name}" alt="slide {i+1}">'
        for i, p in enumerate(slides)
    )
    dots = "".join(f'<div class="dot{" on" if i==0 else ""}"></div>' for i in range(len(slides)))
    nav = '<button class="nav prev">‹</button><button class="nav next">›</button>' if len(slides) > 1 else ""
    avatar_html = f'<img class="avatar" src="{avatar}" alt="">' if avatar else '<div class="avatar"></div>'

    out_dir = run / "preview"
    out_dir.mkdir(exist_ok=True)
    out = out_dir / "index.html"

    html_out = HTML_TMPL.format(
        slug=run.name, name=html.escape(html.unescape(name), quote=False),
        handle="@" + html.escape(html.unescape(handle), quote=False), caption=_caption_html(run),
        n=len(slides), imgs=imgs, dots=dots, nav=nav, avatar_html=avatar_html,
        likes=247, comments=31, reposts=12,
    )

    # "Add to Downloads Folder" button — writes {slug}/ (slide PNGs + caption.md) into a
    # user-chosen folder client-side, so the user can go straight from preview to Canva.
    # caption.md is embedded base64 so any `{}` in the caption can't break the str.replace.
    cap_file = run / "caption.md"
    caption_raw = cap_file.read_text(encoding="utf-8").strip() if cap_file.is_file() else ""
    caption_b64 = base64.b64encode(caption_raw.encode("utf-8")).decode("ascii")
    slug_js = run.name.replace("\\", "").replace('"', "").replace("\n", "")

    # Canva Magic Layers editing guide — embedded so the preview can open it (Blob URL)
    # after generation, when the user needs to tweak the post in Canva. Ships with the
    # skill (references/), resolved relative to this script so it's portable.
    guide_pdf = Path(__file__).resolve().parent.parent / "references" / "canva-magiclayers-guide.pdf"
    guide_b64 = base64.b64encode(guide_pdf.read_bytes()).decode("ascii") if guide_pdf.is_file() else ""

    download_js = (DOWNLOAD_SCRIPT
                   .replace("__DL_SLUG__", slug_js)
                   .replace("__DL_CAPTION_B64__", caption_b64)
                   .replace("__DL_GUIDE_B64__", guide_b64))
    html_out = html_out.replace("</body>", download_js + "\n</body>")

    out.write_text(html_out, encoding="utf-8")

    uri = out.as_uri()
    print(f"Preview generated: {out}")
    print(f"Open with: {uri}")
    print("In the preview, click 'Add to Downloads Folder' to save the slides + caption.md into a folder (for Canva).")
    print()
    print("-" * 60)
    print("FEEDBACK TEMPLATE - fill in only the lines you care about, paste back in chat.")
    print("-" * 60)
    print("CAPTION:        [ ok | change to: ... ]")
    for i in range(len(slides)):
        print(f"SLIDE {i+1}:        [ ok | headline: ... | visual: ... | drop ]")
    print("ORDER:          [ ok | reorder: ... ]")
    print("OVERALL:        [ approve | ... ]")
    print("-" * 60)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
