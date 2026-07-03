"""
Full redirect audit:
1. Collect every URL the old site surfaces (page-sitemap + city-sitemap + post-sitemap)
2. Collect every URL from the previous agency's Rankings sheet
3. Dedupe
4. Test each against the new-build redirect behavior via project-pf8c6.vercel.app
5. Categorize: 200 direct / 301 → destination / 404 gap
6. Cross-reference each URL with keyword counts from the Rankings sheet
7. Write a CSV + JSON summary that the report generator can ingest
"""

import openpyxl
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
import re
import json
import time
from pathlib import Path

SPREADSHEET = Path(r'C:\Claude\agent-os\clients\got-moles\projects\briefs\website-rebuild-rebrand\Got Moles - PPC Growth YoY + SEO Progress and Fruits.xlsx')
STAGING = 'https://project-pf8c6.vercel.app'
OLD_HOST = 'https://got-moles.com'
OUT_DIR = Path(__file__).parent

HDRS = {'User-Agent': 'Mozilla/5.0 (seo-audit-bot)'}


def fetch_text(url: str, timeout: int = 15) -> str:
    req = urllib.request.Request(url, headers=HDRS)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode('utf-8', errors='replace')


def fetch_sitemap_urls(sitemap_url: str) -> list[str]:
    xml = fetch_text(sitemap_url)
    # Strip XML namespace for simple parsing
    xml = re.sub(r'\sxmlns="[^"]+"', '', xml, count=1)
    root = ET.fromstring(xml)
    return [loc.text.strip() for loc in root.iter('loc') if loc.text]


def head_probe(url: str, timeout: int = 15, max_hops: int = 5) -> tuple[int, str, list[str]]:
    """Follow redirect chain manually. Return (final_status, final_location_or_empty, chain).
    chain = list of (status, url) tuples showing what happened."""
    chain = []
    current = url
    for hop in range(max_hops):
        try:
            req = urllib.request.Request(current, headers=HDRS, method='HEAD')
            class NoRedir(urllib.request.HTTPRedirectHandler):
                def redirect_request(self, req, fp, code, msg, headers, newurl):
                    return None
            opener = urllib.request.build_opener(NoRedir())
            try:
                with opener.open(req, timeout=timeout) as r:
                    chain.append(f'{r.status} {current}')
                    return (r.status, '', chain)
            except urllib.error.HTTPError as e:
                status = e.code
                loc = ''
                if e.headers:
                    loc = e.headers.get('Location') or ''
                chain.append(f'{status} {current} -> {loc}')
                if status in (301, 302, 307, 308) and loc:
                    # Resolve relative
                    if loc.startswith('/'):
                        from urllib.parse import urlparse
                        p = urlparse(current)
                        loc = f'{p.scheme}://{p.netloc}{loc}'
                    current = loc
                    continue
                else:
                    return (status, loc, chain)
        except Exception as e:
            chain.append(f'ERR {current} {e}')
            return (-1, str(e)[:80], chain)
    return (-2, 'max_hops_exceeded', chain)


def main():
    # --- 1. Old site URL inventory ---
    print('Fetching old site sitemaps…')
    old_urls = set()
    for sm in ['page-sitemap.xml', 'city-sitemap.xml', 'post-sitemap.xml', 'service-sitemap.xml']:
        try:
            for u in fetch_sitemap_urls(f'{OLD_HOST}/{sm}'):
                old_urls.add(u)
            print(f'  {sm}: OK')
        except Exception as e:
            print(f'  {sm}: ERR {e}')

    # --- 2. Rankings sheet URLs ---
    print('Parsing Rankings sheet…')
    wb = openpyxl.load_workbook(SPREADSHEET, data_only=True)
    rankings_sheet = wb['Rankings']
    # Columns: A=Keyword, B=SERP Url, C=most recent rank (04.12.2025)
    ranking_url_keywords: dict[str, int] = {}  # url → keyword count
    ranking_url_top3: dict[str, int] = {}
    for row in rankings_sheet.iter_rows(min_row=2, values_only=True):
        url, rank = row[1], row[2]
        if not url or not isinstance(url, str):
            continue
        url = url.strip()
        if not url.startswith('http'):
            continue
        # Normalize — some are truncated (e.g. /algona-mole-contro without trailing l/)
        # Keep raw for now and normalize later
        ranking_url_keywords[url] = ranking_url_keywords.get(url, 0) + 1
        try:
            r = float(rank) if rank not in ('NA', None, '>100') else 999
            if r <= 3:
                ranking_url_top3[url] = ranking_url_top3.get(url, 0) + 1
        except (ValueError, TypeError):
            pass
    for url in ranking_url_keywords:
        old_urls.add(url)
    print(f'  Rankings sheet: {len(ranking_url_keywords)} unique URLs, {sum(ranking_url_keywords.values())} total keyword rows')

    # --- Remove non-audit URLs (sitemap links, images, etc) ---
    old_urls = {u for u in old_urls if u.startswith(OLD_HOST) and not any(
        u.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.xml', '.pdf']
    )}
    # Normalize trailing slash — test both, prefer with-slash as canonical
    print(f'\nTotal unique old URLs to test: {len(old_urls)}')

    # --- 3. Probe each against staging (same redirects.ts as prod) ---
    print('\nProbing each URL against new build…')
    results = []
    for i, old_url in enumerate(sorted(old_urls), 1):
        path = old_url.replace(OLD_HOST, '')
        staging_url = STAGING + path
        status, loc, chain = head_probe(staging_url)
        # Determine final destination path for reporting
        # The chain may be: 308 trailing-slash -> 301 real-redirect -> 200 final OR 404
        # Find the FIRST non-308 status in the chain (that's the "real" behavior)
        real_status = status
        real_loc = loc
        for hop in chain:
            if hop.startswith(('301 ', '302 ', '307 ', '404 ', '200 ')):
                parts = hop.split(' ', 2)
                real_status = int(parts[0])
                if len(parts) >= 3 and '->' in parts[2]:
                    real_loc = parts[2].split('-> ')[1] if '-> ' in parts[2] else ''
                else:
                    real_loc = ''
                break
        results.append({
            'old_url': old_url,
            'path': path,
            'final_status': status,
            'final_location': loc,
            'real_status': real_status,
            'real_location': real_loc,
            'chain': chain,
            'keyword_count': ranking_url_keywords.get(old_url, 0),
            'top3_count': ranking_url_top3.get(old_url, 0),
        })
        if i % 50 == 0:
            print(f'  {i}/{len(old_urls)} last: {path[:50]} -> {status}')
        time.sleep(0.12)

    # --- 4. Summarize ---
    print('\nSummarizing…')
    by_status: dict[int, int] = {}
    for r in results:
        by_status[r['final_status']] = by_status.get(r['final_status'], 0) + 1
    print(f'FINAL status breakdown: {by_status}')

    by_real: dict[int, int] = {}
    for r in results:
        by_real[r['real_status']] = by_real.get(r['real_status'], 0) + 1
    print(f'REAL (first non-308) status breakdown: {by_real}')

    # Save raw
    with open(OUT_DIR / 'redirect-matrix.json', 'w') as f:
        json.dump({
            'tested_at': time.strftime('%Y-%m-%d %H:%M:%S'),
            'staging_url': STAGING,
            'old_host': OLD_HOST,
            'total_tested': len(results),
            'by_status': by_status,
            'results': results,
        }, f, indent=2)

    # Also write a CSV for readability
    import csv
    with open(OUT_DIR / 'redirect-matrix.csv', 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['old_url', 'final_status', 'final_path', 'chain', 'ranked_keywords', 'top3_keywords', 'verdict'])
        for r in sorted(results, key=lambda x: (-x['top3_count'], -x['keyword_count'], x['old_url'])):
            final = r['final_status']
            # Derive final path (from last hop in chain that's 200 or 404)
            final_path = ''
            for hop in r['chain']:
                if hop.startswith('200 '):
                    final_path = hop.split(' ', 1)[1]
                    break
                if hop.startswith('404 '):
                    final_path = hop.split(' ', 1)[1].split(' ->')[0]
                    break
            verdict = ''
            if final == 200:
                # Did it change URL (301 in chain) or stay the same?
                had_real_redirect = any(h.startswith(('301 ', '302 ', '307 ')) for h in r['chain'])
                if had_real_redirect:
                    verdict = 'REDIRECTED 301 -> 200 (link equity preserved)'
                else:
                    # Only 308 trailing-slash normalization
                    verdict = 'SAME URL (identical pattern on new site)'
            elif final == 404:
                verdict = 'GAP - no redirect, 404 on new site'
            elif final == -1:
                verdict = 'ERROR'
            else:
                verdict = f'HTTP {final}'
            w.writerow([
                r['old_url'], final, final_path,
                ' | '.join(r['chain'])[:500],
                r['keyword_count'], r['top3_count'], verdict
            ])

    print(f'\nWrote: {OUT_DIR / "redirect-matrix.json"}')
    print(f'Wrote: {OUT_DIR / "redirect-matrix.csv"}')
    print('Done.')


if __name__ == '__main__':
    main()
