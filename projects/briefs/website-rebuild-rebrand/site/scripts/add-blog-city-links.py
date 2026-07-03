"""
Phase 5 — Add city-page internal links to every blog post.

Reads src/lib/blog-data.ts, finds each post's sections array, and inserts a
closing "Service Areas" section with 3 rotating city links + 1 service link
+ 1 related blog link. Anchor text varied. Cities rotate cyclically so each
top city gets roughly equal inbound equity.

Idempotent: if a post already has a section whose heading starts with
"Got Moles Serves" or "Serving" or "Where We Work", skip it.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BLOG_DATA = ROOT / "src" / "lib" / "blog-data.ts"

# Top-20 cities by priority (King + Pierce + Snohomish + Thurston)
CITIES = [
    ("Seattle", "seattle"),
    ("Bellevue", "bellevue"),
    ("Tacoma", "tacoma"),
    ("Sammamish", "sammamish"),
    ("Issaquah", "issaquah"),
    ("Puyallup", "puyallup"),
    ("Federal Way", "federal-way"),
    ("Renton", "renton"),
    ("Kent", "kent"),
    ("Enumclaw", "enumclaw"),
    ("Burien", "burien"),
    ("Auburn", "auburn"),
    ("Kirkland", "kirkland"),
    ("Redmond", "redmond"),
    ("Bothell", "bothell"),
    ("Maple Valley", "maple-valley"),
    ("Covington", "covington"),
    ("Mercer Island", "mercer-island"),
    ("Snoqualmie", "snoqualmie"),
    ("Black Diamond", "black-diamond"),
]

# Service pages rotated by cluster-ish keyword in slug
SERVICES = [
    ("Total Mole Control Program", "total-mole-control-program"),
    ("One-Time Mole Removal", "one-time-mole-removal"),
    ("Commercial Mole Control", "commercial-mole-control"),
]

HEADINGS = [
    "Got Moles Serves Western Washington",
    "Local Mole Control Across King, Pierce, and Snohomish",
    "Where Got Moles Works",
    "Mole Control Near You in Western Washington",
    "Serving Your Neighborhood",
]


def build_section_body(idx: int, slug: str) -> tuple[str, str]:
    """Return (heading, body) for the appended section."""
    heading = HEADINGS[idx % len(HEADINGS)]

    # 3 rotating cities — offset by post index so distribution is even
    city_slice = [CITIES[(idx * 3 + n) % len(CITIES)] for n in range(3)]
    c1, c2, c3 = city_slice

    # Service pick — rotate but bias TMCP for "prevention/year-round" type slugs
    prevention_hints = ("attracts", "keep-coming-back", "eats", "species", "groups")
    if any(h in slug for h in prevention_hints):
        service = SERVICES[0]  # TMCP
    elif any(h in slug for h in ("cost", "removal", "get-rid", "bite", "diseases", "vinegar")):
        service = SERVICES[1]  # One-Time
    else:
        service = SERVICES[idx % len(SERVICES)]

    body = (
        f"Got Moles is a mole-only specialist covering King, Pierce, Snohomish, "
        f"and Thurston counties — the heart of Western Washington. We've trapped "
        f"moles on nearly 5,000 properties since 2017, chemical-free, with 219+ "
        f"five-star Google reviews across three local offices.\n\n"
        f"Local service areas include "
        f"[mole control in {c1[0]}](/mole-control-{c1[1]}/), "
        f"[{c2[0]} mole removal](/mole-control-{c2[1]}/), and "
        f"[mole control near {c3[0]}](/mole-control-{c3[1]}/) — plus every "
        f"neighboring city on our [service areas map](/service-areas/).\n\n"
        f"If moles have moved into your yard, the fastest path to a solved problem "
        f"is our [{service[0]}](/services/{service[1]}/) or a direct conversation: "
        f"call (253) 750-0211 or use our [contact form](/contact/)."
    )
    return heading, body


def main() -> None:
    text = BLOG_DATA.read_text(encoding="utf-8")

    # Find every post block: slug: '...' + sections: [ ... ],\n    faqs:
    slug_pattern = re.compile(r"^    slug: '([^']+)',$", re.MULTILINE)
    sections_end = "    ],\n    faqs:"

    slug_matches = list(slug_pattern.finditer(text))
    print(f"Found {len(slug_matches)} posts")

    # Walk backwards so insertions don't break earlier offsets
    inserted = 0
    skipped = 0
    for idx, m in reversed(list(enumerate(slug_matches))):
        slug = m.group(1)
        start = m.end()
        # Find next `    ],\n    faqs:` after this slug
        end_idx = text.find(sections_end, start)
        if end_idx == -1:
            print(f"  ! {slug}: no sections end found — skipping")
            continue

        # Check idempotency — skip if we've already inserted one of our headings OR
        # the block already contains a `/mole-control-{slug}/` city link.
        block = text[start:end_idx]
        has_city_link = bool(re.search(r"/mole-control-[a-z-]+/\)", block)) and \
            any(f"/mole-control-{c[1]}/" in block for c in CITIES[:20])
        if any(h in block for h in HEADINGS) or has_city_link:
            skipped += 1
            print(f"  - {slug}: already has city links, skip")
            continue

        heading, body = build_section_body(idx, slug)
        # TS source uses "..." double-quoted strings — escape " and encode newlines as \n
        body_escaped = (
            body.replace("\\", "\\\\")
                .replace('"', '\\"')
                .replace("\n", "\\n")
        )
        heading_escaped = heading.replace('"', '\\"')
        insertion = (
            f'      {{ heading: "{heading_escaped}", body: "{body_escaped}" }},\n'
        )
        text = text[:end_idx] + insertion + text[end_idx:]
        inserted += 1
        print(f"  + {slug}: added ({len(body)} chars)")

    BLOG_DATA.write_text(text, encoding="utf-8")
    print(f"\nDone. Inserted into {inserted} posts, skipped {skipped}.")


if __name__ == "__main__":
    main()
