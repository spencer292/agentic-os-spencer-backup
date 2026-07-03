"""Inventory every old-site blog post for migration decision.

For each of the 26 blog URLs:
  - title (H1)
  - publication date
  - author
  - word count (approximate — counts text nodes)
  - first 200 chars of content
  - internal link count
  - image count
  - has FAQ section? (heuristic)
  - key headings
  - has table?
  - has numbered list?
  - rank value from Rankings sheet (ranked_kw, top3)
"""

import urllib.request
import re
import json
import time
import csv
from pathlib import Path

HDRS = {'User-Agent': 'Mozilla/5.0 (content-audit)'}
OUT = Path(__file__).parent

OLD_BLOGS = [
    '/what-do-mole-holes-look-like/',
    '/what-attracts-moles-to-your-yard/',
    '/can-moles-swim/',
    '/what-species-of-moles-live-in-washington-state/',
    '/how-to-get-rid-of-ground-moles-with-vinegar/',
    '/do-moles-hibernate/',
    '/is-a-mole-a-rodent/',
    '/how-deep-do-moles-dig/',
    '/how-many-eyes-do-moles-have/',
    '/what-do-moles-eat/',
    '/do-moles-carry-diseases/',
    '/do-moles-bite/',
    '/voles-vs-moles-whats-the-difference/',
    '/moles-vs-gopher-mounds/',
    '/are-moles-nocturnal/',
    '/how-to-get-rid-of-moles-in-your-yard/',
    '/what-works-for-mole-extermination/',
    '/when-are-moles-most-active/',
    '/why-do-moles-make-molehills/',
    '/olympia-mole-exterminator/',  # weird — this one is in blog sitemap despite looking like a city×service
    '/what-eats-moles/',
    '/are-moles-venomous/',
    '/how-many-babies-do-moles-have/',
    '/do-moles-live-in-groups/',
    '/are-moles-poisonous-or-venomous/',
]

# Rank value from redirect-matrix.csv
rank_map = {}
with open(OUT / 'redirect-matrix.csv', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        path = row['old_url'].replace('https://got-moles.com', '')
        if path in OLD_BLOGS or path + '/' in OLD_BLOGS:
            if not path.endswith('/'): path += '/'
            rank_map[path] = (int(row['ranked_keywords']), int(row['top3_keywords']))

def fetch(url):
    req = urllib.request.Request(url, headers=HDRS)
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read().decode('utf-8', errors='replace')

def extract_info(html, url):
    # H1
    h1m = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.DOTALL)
    h1 = re.sub(r'<[^>]+>', '', h1m.group(1)).strip()[:200] if h1m else ''

    # Publication / modified date from schema or visible date
    pub_date = ''
    date_matches = [
        re.search(r'"datePublished"\s*:\s*"([^"]+)"', html),
        re.search(r'"dateModified"\s*:\s*"([^"]+)"', html),
        re.search(r'<time[^>]*datetime="([^"]+)"', html),
        re.search(r'Published[:\s]+([A-Z][a-z]+ \d{1,2},?\s*\d{4})', html),
    ]
    for m in date_matches:
        if m:
            pub_date = m.group(1)[:30]
            break

    # Author
    author = ''
    a_match = re.search(r'"author"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"', html)
    if a_match: author = a_match.group(1)[:80]

    # Content area — crude: strip script/style/nav/footer, then strip tags
    body = re.sub(r'<script\b[^>]*>.*?</script>', '', html, flags=re.DOTALL)
    body = re.sub(r'<style\b[^>]*>.*?</style>', '', body, flags=re.DOTALL)
    body = re.sub(r'<(nav|header|footer|aside)\b[^>]*>.*?</\1>', '', body, flags=re.DOTALL)
    # Extract main/article if present
    main_m = re.search(r'<(?:main|article)\b[^>]*>(.*?)</(?:main|article)>', body, re.DOTALL)
    if main_m:
        body = main_m.group(1)

    # Strip remaining HTML
    text = re.sub(r'<[^>]+>', ' ', body)
    text = re.sub(r'\s+', ' ', text).strip()
    word_count = len(text.split())

    # First 200 chars of content (after H1)
    first_chars = text[:300]

    # Headings
    h2s = [re.sub(r'<[^>]+>', '', h).strip()[:120] for h in re.findall(r'<h2[^>]*>(.*?)</h2>', html, re.DOTALL)]
    h3s = [re.sub(r'<[^>]+>', '', h).strip()[:120] for h in re.findall(r'<h3[^>]*>(.*?)</h3>', html, re.DOTALL)]

    # Internal link count (links to got-moles.com)
    internal_links = len(re.findall(r'href=["\']https?://got-moles\.com', html))

    # Image count in content
    images = len(re.findall(r'<img\b[^>]*>', body))

    # FAQ heuristic: presence of "Frequently Asked" or ≥3 H3s that look like questions
    question_h3s = [h for h in h3s if h.endswith('?')]
    has_faq = 'Frequently Asked' in body or 'FAQ' in body or len(question_h3s) >= 3

    # Tables / numbered lists
    has_table = '<table' in body.lower()
    num_lists = len(re.findall(r'<ol\b', body, re.IGNORECASE))
    bullet_lists = len(re.findall(r'<ul\b', body, re.IGNORECASE))

    return {
        'h1': h1,
        'pub_date': pub_date,
        'author': author,
        'word_count': word_count,
        'first_chars': first_chars,
        'h2s': h2s[:8],
        'h3s': h3s[:8],
        'internal_links': internal_links,
        'images': images,
        'has_faq': has_faq,
        'has_table': has_table,
        'num_ordered_lists': num_lists,
        'num_bullet_lists': bullet_lists,
    }

results = []
for i, path in enumerate(OLD_BLOGS, 1):
    print(f'{i}/{len(OLD_BLOGS)} {path}')
    try:
        html = fetch('https://got-moles.com' + path)
        info = extract_info(html, path)
        kw, top3 = rank_map.get(path, (0, 0))
        info['url'] = path
        info['ranked_kw'] = kw
        info['top3_kw'] = top3
        results.append(info)
    except Exception as e:
        print(f'  ERR: {e}')
        results.append({'url': path, 'error': str(e)[:100], 'ranked_kw': 0, 'top3_kw': 0})
    time.sleep(0.4)

# Save JSON
with open(OUT / 'old-blog-inventory.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, default=str)

# Save summary CSV
with open(OUT / 'old-blog-inventory.csv', 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['url', 'h1', 'word_count', 'ranked_kw', 'top3_kw', 'pub_date', 'author',
                'has_faq', 'has_table', 'internal_links', 'images', 'h2_count', 'first_100'])
    # Sort by top3 desc then ranked_kw desc
    for r in sorted(results, key=lambda x: (-x.get('top3_kw',0), -x.get('ranked_kw',0))):
        w.writerow([
            r['url'],
            r.get('h1','')[:80],
            r.get('word_count',0),
            r.get('ranked_kw',0),
            r.get('top3_kw',0),
            r.get('pub_date',''),
            r.get('author',''),
            r.get('has_faq',''),
            r.get('has_table',''),
            r.get('internal_links',0),
            r.get('images',0),
            len(r.get('h2s',[])),
            r.get('first_chars','')[:120],
        ])

print('\nDone.')
print(f'Wrote: {OUT / "old-blog-inventory.json"}')
print(f'Wrote: {OUT / "old-blog-inventory.csv"}')
