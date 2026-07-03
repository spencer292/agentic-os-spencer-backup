import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

tmpl = (Path(__file__).parent / "render_template.html").resolve().as_uri()
fails, consoles, errors = [], [], []
with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_page()
    pg.on("console", lambda m: consoles.append(f"{m.type}: {m.text[:160]}"))
    pg.on("pageerror", lambda e: errors.append(str(e)[:300]))
    pg.on("requestfailed", lambda r: fails.append(f"{r.failure} :: {r.url[:110]}"))
    pg.goto(tmpl)
    ok = False
    try:
        pg.wait_for_function("window.__moduleReady === true", timeout=25000)
        ok = True
    except Exception:
        pass
    print("MODULE READY:", ok)
    print("__moduleReady value:", pg.evaluate("window.__moduleReady"))
    print("\n--- requestfailed (%d) ---" % len(fails))
    for f in fails[:25]:
        print(" ", f)
    print("\n--- pageerror (%d) ---" % len(errors))
    for e in errors[:10]:
        print(" ", e)
    print("\n--- console (%d, last 10) ---" % len(consoles))
    for c in consoles[-10:]:
        print(" ", c)
    b.close()
