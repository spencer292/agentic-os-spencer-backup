// Turn the scraped GBP review JSON into website-ready markdown + CSV.
//   node scripts/gbp-format-reviews.mjs

import fs from 'node:fs';
import path from 'node:path';

const DIR = path.join(process.cwd(), 'projects', 'str-gbp-optimization', 'reviews');
const STAMP = process.env.RUN_DATE || '2026-07-31';
const src = JSON.parse(fs.readFileSync(path.join(DIR, `${STAMP}_google-reviews.json`), 'utf8'));

const esc = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

let all = [];
for (const l of src.locations) all.push(...l.reviews.map((r) => ({ ...r, loc: l.key, locLabel: l.label })));

const total = all.length;
const withWords = all.filter((r) => r.text).length;
const starOnly = total - withWords;
const dist = {};
all.forEach((r) => { dist[r.rating] = (dist[r.rating] || 0) + 1; });
const avg = (all.reduce((s, r) => s + r.rating, 0) / total).toFixed(2);

// ---------- Markdown ----------
const md = [];
md.push(`# Got Moles — Complete Google Review Export`);
md.push('');
md.push(`**Pulled:** ${STAMP} · **Source:** the three live Google Business Profiles (Google Maps public review panes)`);
md.push('');
md.push(`## Totals`);
md.push('');
md.push(`| Metric | Count |`);
md.push(`|---|---|`);
md.push(`| **Total reviews across all 3 profiles** | **${total}** |`);
md.push(`| Reviews with written text | ${withWords} |`);
md.push(`| Star-rating only (no words) | ${starOnly} |`);
md.push(`| 5-star | ${dist[5] || 0} |`);
md.push(`| 4-star | ${dist[4] || 0} |`);
md.push(`| 3-star | ${dist[3] || 0} |`);
md.push(`| 2-star | ${dist[2] || 0} |`);
md.push(`| 1-star | ${dist[1] || 0} |`);
md.push(`| Average rating | ${avg} |`);
md.push('');
md.push(`### By profile`);
md.push('');
md.push(`| Profile | Reviews scraped | Google's displayed count | Displayed rating |`);
md.push(`|---|---|---|---|`);
for (const l of src.locations) {
  md.push(`| ${l.label} | ${l.reviews.length} | ${l.reportedReviewCount || '?'} | ${l.reportedRating || '?'} |`);
}
md.push('');
md.push('---');
md.push('');

for (const l of src.locations) {
  const words = l.reviews.filter((r) => r.text).length;
  md.push(`## ${l.label}`);
  md.push('');
  md.push(`${l.reviews.length} reviews · ${words} with written text · ${l.reportedRating}★ average`);
  md.push('');
  md.push(`[View on Google Maps](${l.url})`);
  md.push('');
  let i = 0;
  for (const r of l.reviews) {
    i++;
    md.push(`### ${i}. ${r.author}`);
    const meta = [stars(r.rating) + ` (${r.rating}/5)`, r.when, r.authorMeta].filter(Boolean).join(' · ');
    md.push(`*${meta}*`);
    md.push('');
    if (r.text) {
      md.push(r.text.split('\n').map((line) => (line.trim() ? `> ${line}` : '>')).join('\n'));
    } else {
      md.push(`> *(star rating only — no written review)*`);
    }
    md.push('');
    if (r.ownerResponse) {
      md.push(`**Owner response:** ${r.ownerResponse.replace(/\n+/g, ' ')}`);
      md.push('');
    }
  }
  md.push('---');
  md.push('');
}

fs.writeFileSync(path.join(DIR, `${STAMP}_google-reviews.md`), md.join('\n'), 'utf8');

// ---------- CSV (website / CMS import) ----------
const rows = [['profile', 'author', 'rating', 'when', 'review_text', 'has_text', 'owner_response', 'author_meta', 'review_id']];
for (const r of all) {
  rows.push([r.locLabel, r.author, r.rating, r.when, r.text, r.text ? 'yes' : 'no', r.ownerResponse, r.authorMeta, r.reviewId]);
}
fs.writeFileSync(
  path.join(DIR, `${STAMP}_google-reviews.csv`),
  '﻿' + rows.map((row) => row.map(esc).join(',')).join('\r\n'),
  'utf8'
);

// ---------- Text-only file, ready to drop into a testimonial component ----------
const testimonials = all
  .filter((r) => r.text && r.rating === 5)
  .map((r) => ({ author: r.author, rating: r.rating, when: r.when, quote: r.text.trim(), profile: r.locLabel }));
fs.writeFileSync(
  path.join(DIR, `${STAMP}_testimonials-5star.json`),
  JSON.stringify(testimonials, null, 2),
  'utf8'
);

console.log(`total=${total} withWords=${withWords} starOnly=${starOnly} avg=${avg} fiveStar=${dist[5] || 0}`);
console.log(`5-star with text (testimonial pool): ${testimonials.length}`);
console.log('Wrote:');
for (const f of ['md', 'csv'].map((e) => `${STAMP}_google-reviews.${e}`).concat(`${STAMP}_testimonials-5star.json`)) {
  console.log('  ' + path.join(DIR, f));
}
