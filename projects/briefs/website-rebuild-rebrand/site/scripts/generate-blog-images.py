"""
Generate missing dedicated featured images for Got Moles blog posts.

Reads GEMINI_API_KEY from the client .env, calls Gemini 3 Pro Image,
saves each result as 1200x669 WebP under 150KB to public/images/.
"""
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "google-genai>=1.0.0",
#     "pillow>=10.0.0",
#     "python-dotenv>=1.0.0",
# ]
# ///

import io
import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types
from PIL import Image

# Force UTF-8 stdout to avoid Windows cp1252 issues
sys.stdout.reconfigure(encoding="utf-8")

# Load env from client root
CLIENT_ENV = Path("C:/Claude/agent-os/clients/got-moles/.env")
SITE_ROOT = Path("C:/Claude/agent-os/clients/got-moles/projects/briefs/website-rebuild-rebrand/site")
IMAGES_OUT = SITE_ROOT / "public" / "images"
IMAGES_OUT.mkdir(parents=True, exist_ok=True)

load_dotenv(CLIENT_ENV)
API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    print("ERROR: GEMINI_API_KEY not found in .env")
    sys.exit(1)

print(f"API key loaded ({len(API_KEY)} chars)")

# Post -> prompt mapping. Style: photorealistic PNW residential yard,
# 16:9, editorial magazine quality, no text/logos/people/animals.
POSTS = {
    "what-species-of-moles-live-in-washington-state": (
        "Photorealistic wide-angle landscape photograph of a lush Pacific Northwest "
        "meadow edge transitioning into dense conifer forest. Moss-covered ground, "
        "fern understory, soft dappled morning light filtering through Douglas fir "
        "canopy. Rich green grass in foreground. Editorial nature-magazine quality."
    ),
    "are-moles-poisonous-or-venomous": (
        "Photorealistic wide-angle landscape photograph of a pristine Pacific "
        "Northwest suburban backyard lawn at golden hour. Warm soft light on "
        "manicured grass. Garden bed with ornamental plants in background. "
        "Family-friendly suburban feel. No people, no animals. Editorial quality."
    ),
    "can-moles-swim": (
        "Photorealistic wide-angle landscape photograph of a Pacific Northwest "
        "suburban lawn after heavy rain. Glistening wet grass, small puddles "
        "reflecting morning light, mist rising. Conifer trees in soft-focus "
        "background. Editorial nature-magazine atmosphere."
    ),
    "do-moles-live-in-groups": (
        "Photorealistic wide-angle landscape photograph of a single fresh "
        "volcano-shaped molehill on an otherwise pristine Pacific Northwest "
        "suburban lawn. Isolated subject, rest of lawn perfectly manicured. "
        "Golden hour soft light, conifers in soft-focus background. No text."
    ),
    "how-deep-do-moles-dig": (
        "Photorealistic cross-section-style landscape photograph of a Pacific "
        "Northwest lawn showing soil depth. Manicured grass surface in top "
        "third, rich dark topsoil in middle, denser subsoil layer at bottom. "
        "Editorial earth-science-magazine aesthetic. Natural light. No text."
    ),
    "how-many-babies-do-moles-have": (
        "Photorealistic wide-angle landscape photograph of a Pacific Northwest "
        "suburban lawn in early spring. Fresh bright green grass emerging, "
        "delicate daffodils blooming at lawn edge, soft morning light. "
        "Clean manicured feel. Editorial garden-magazine quality."
    ),
    "is-a-mole-a-rodent": (
        "Photorealistic close-up landscape photograph of Pacific Northwest "
        "forest floor, rich dark soil with moss patches, fallen conifer "
        "needles, fern fronds. Natural understory detail, scientific "
        "nature-documentary aesthetic. Soft dappled light. No animals visible."
    ),
    "what-attracts-moles-to-your-yard": (
        "Photorealistic wide-angle landscape photograph of a perfectly "
        "manicured Pacific Northwest suburban lawn with a sprinkler misting "
        "water in sunlight, creating visible droplets and rainbow sparkle. "
        "Lush green grass. Editorial lawn-care magazine quality. Warm light."
    ),
    "what-do-mole-holes-look-like": (
        "Photorealistic close-up landscape photograph of a fresh volcano-"
        "shaped molehill on a manicured Pacific Northwest lawn. Dark rich "
        "soil cone, perfectly-struck golden-hour sidelight showing texture. "
        "Shallow depth of field, rest of lawn softly blurred. Editorial quality."
    ),
    "what-eats-moles": (
        "Photorealistic wide-angle landscape photograph of a Pacific Northwest "
        "forest edge at dusk. Mist rising between Douglas fir trunks, soft "
        "fading light, silhouette of conifers against warm sky. Wild "
        "predator-territory feel. Editorial nature-magazine aesthetic. No animals."
    ),
    "why-do-moles-make-molehills": (
        "Photorealistic wide-angle landscape photograph of a Pacific Northwest "
        "suburban lawn with multiple fresh volcano-shaped molehills scattered "
        "across manicured grass. Morning golden-hour light, soft conifer "
        "background. Problem-state feel. Editorial quality. No text, no people."
    ),
}


def generate_and_save(slug: str, prompt: str, client: genai.Client) -> bool:
    """Generate one image, resize + convert to WebP, save to public/images/."""
    out_webp = IMAGES_OUT / f"blog-{slug}.webp"
    print(f"\n[{slug}]")
    print(f"  Prompt: {prompt[:80]}...")

    try:
        response = client.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=[prompt],
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
                image_config=types.ImageConfig(
                    aspect_ratio="16:9",
                    image_size="1K",
                ),
            ),
        )
    except Exception as exc:  # pragma: no cover — diagnostic only
        print(f"  API error: {exc}")
        return False

    # Pull image bytes from response
    image_bytes = None
    for candidate in response.candidates:
        for part in candidate.content.parts:
            if part.inline_data and part.inline_data.data:
                image_bytes = part.inline_data.data
                break
        if image_bytes:
            break

    if not image_bytes:
        print(f"  No image in response")
        return False

    # Open, resize to 1200 wide, save as WebP under 150KB
    img = Image.open(io.BytesIO(image_bytes))
    if img.width > 1200:
        ratio = 1200 / img.width
        img = img.resize(
            (1200, int(img.height * ratio)),
            Image.Resampling.LANCZOS,
        )

    # Try quality=80 first, step down if too big
    for quality in [80, 72, 65, 58]:
        img.save(out_webp, "WEBP", quality=quality, method=6)
        size_kb = out_webp.stat().st_size / 1024
        if size_kb <= 150:
            print(f"  Saved {out_webp.name} ({size_kb:.0f}KB @ q{quality})")
            return True
    print(f"  Saved {out_webp.name} but still {size_kb:.0f}KB @ q58")
    return True


def main() -> None:
    client = genai.Client(api_key=API_KEY)
    successes = 0
    failures: list[str] = []

    for slug, prompt in POSTS.items():
        ok = generate_and_save(slug, prompt, client)
        if ok:
            successes += 1
        else:
            failures.append(slug)
        # Rate-limit gap
        time.sleep(3)

    print(f"\n{'=' * 50}")
    print(f"Done: {successes} generated, {len(failures)} failed")
    if failures:
        print("Failed:", ", ".join(failures))


if __name__ == "__main__":
    main()
