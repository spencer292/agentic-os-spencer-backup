import fs from 'node:fs';
const P = JSON.parse(fs.readFileSync(new URL('../data/products.json', import.meta.url)));
const strip = h => (h || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

// `vendor` is unreliable on this store: it is set to "Syperformance" on obvious resold
// goods (Walbro pumps, Mickey Thompson tires, Hondata KPro). Classify on title + vendor.
const RESOLD_BRANDS = ['Pulsar', 'Koyo', 'Rywire', 'Blox', 'FIC', 'Fuel Injector Clinic', 'Injector Dynamics', 'DeatschWerks', 'Deatsch', 'Walbro', 'AEM', 'Hondata', 'KPro', 'Vibrant', 'Mickey Thompson', 'Competition Clutch', 'BF Gears', 'Translab', 'Wiseco', 'ARP', 'Skunk2', 'Exedy', 'Turbosmart', 'Tial', 'Garrett', 'Precision Turbo', 'Bosch', 'NGK', 'Mishimoto', 'Radium', 'Chase Bays', 'K-Tuned', 'Ktuned', 'PRL', 'Golden Eagle', 'Supertech', 'Ferrea', 'Brian Crower', 'Drag Cartel', 'Innovative', 'Hasport', 'Kaaz', 'OS Giken', 'Clutch Masters', 'Fidanza', 'Grams', 'Haltech', 'Racepak', 'Sparco', 'Braille', 'XS Power', 'Odyssey', 'Setrab', 'Aeromotive', 'Snow Performance', 'Moroso', 'Canton', 'Peterson'];
const RESOLD_RE = new RegExp('\\b(' + RESOLD_BRANDS.join('|') + ')\\b', 'i');
const HOUSE_PART = /billet|halfshaft|half shaft|carrier|bellhousing|bell housing|transfer case|block ?off|single lobe|rocker|manifold|intercooler|vband|v-band|vanjen|flex bellow|mandrel|pie cut|flange|gearset|gear set|synchro|slider|\bhub|collar|shift selector|dust boot|speedo ring|reverse gear|clamp|titanium|cooling fab|weld on|dogbox|\blsd\b|differential|downpipe|charge pipe|coolant|hot part|dump tube|\bbung/i;

function classify(p) {
  const t = p.title, v = (p.vendor || '').trim();
  if (/synchro solution[sz]/i.test(v) || /synchro solution[sz]/i.test(t)) return ['IN-HOUSE', 'Synchro Solutionz', ''];
  if (/comp ?1\b/i.test(t)) return ['IN-HOUSE', 'Comp 1 Clutch', ''];
  const hit = RESOLD_RE.exec(t) || RESOLD_RE.exec(v);
  if (hit) return ['RESOLD', hit[1], ''];
  if (/^(syperformance|syp)\b/i.test(v) && HOUSE_PART.test(t)) return ['IN-HOUSE', 'SYPerformance', ''];
  if (/^(syperformance|syp)\b/i.test(v)) return ['UNKNOWN', 'SYPerformance', 'vendor=SYP but title is not a known in-house part family - owner must confirm'];
  return ['RESOLD', v || '(no vendor)', ''];
}

function platform(p) {
  const s = (p.title + ' ' + p.tags.join(' ') + ' ' + p.product_type).toLowerCase();
  const hits = [];
  if (/\bk[\s-]?series|\bk20|\bk24|k[\s-]?swap|\bdc5\b|\bep3\b|\brsx\b|civic si/.test(s)) hits.push('Honda K');
  if (/\bb[\s-]?series|\bb16|\bb18|\bb20|\bgsr\b|ls\/?vtec|\bteg\b|\bdc2\b/.test(s)) hits.push('Honda B');
  if (/\bd[\s-]?series|\bd16/.test(s)) hits.push('Honda D');
  if (/\b[hf][\s-]?series|\bh22|\bf20|\bf22|s2000/.test(s)) hits.push('Honda H/F');
  if (/evo ?x\b|evo ?10|cz4a/.test(s)) hits.push('Evo X');
  if (/evo ?[789]\b|4g63/.test(s)) hits.push('Evo 8/9');
  if (/\bb58|\bb48|\bs58|supra|\ba90\b|\ba91\b|\bbmw\b|toyota/.test(s)) hits.push('B58/BMW-Toyota');
  if (!hits.length && /universal|mandrel|pie cut|flange|bellow|clamp|titanium|vband|v-band|bung|weld on/.test(s)) hits.push('Universal / fab');
  return hits.length ? hits.join(' + ') : 'Unclassified';
}

const titleIssues = t => {
  const i = [];
  const letters = t.replace(/[^A-Za-z]/g, '');
  if (letters.length > 3 && letters === letters.toUpperCase()) i.push('ALL-CAPS');
  if (/^syp\b/i.test(t)) i.push('SYP-abbrev');
  if (/^syperformance/i.test(t)) i.push('brand-prefixed');
  if (/\s{2,}/.test(t)) i.push('double-space');
  if (/[“”‘’]/.test(t)) i.push('smart-quotes');
  if (/\b[a-z]/.test(t) && /\b[A-Z]{3,}\b/.test(t)) i.push('mixed-case-inconsistent');
  return i;
};

const rows = P.map(p => {
  const desc = strip(p.body_html);
  const prices = p.variants.map(v => parseFloat(v.price));
  const disc = p.variants.filter(v => v.compare_at_price && parseFloat(v.compare_at_price) > parseFloat(v.price));
  const c = classify(p);
  return {
    id: p.id, handle: p.handle, title: p.title, vendor: p.vendor,
    origin: c[0], brand: c[1], originNote: c[2], inHouse: c[0] === 'IN-HOUSE',
    platform: platform(p),
    type: p.product_type || '', tags: p.tags.join('|'),
    variants: p.variants.length,
    priceMin: Math.min.apply(null, prices), priceMax: Math.max.apply(null, prices),
    discounted: disc.length > 0,
    discPct: disc.length ? Math.round((1 - parseFloat(disc[0].price) / parseFloat(disc[0].compare_at_price)) * 100) : 0,
    compareAt: disc.length ? disc[0].compare_at_price : '',
    available: p.variants.some(v => v.available),
    images: p.images.length,
    descChars: desc.length,
    descState: desc.length === 0 ? 'EMPTY' : desc.length < 120 ? 'STUB' : desc.length < 400 ? 'THIN' : 'OK',
    skuMissing: p.variants.filter(v => !v.sku).length,
    titleIssues: titleIssues(p.title).join('|'),
    created: p.created_at.slice(0, 10)
  };
});

const cols = Object.keys(rows[0]);
const esc = v => /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
const csv = [cols.join(',')].concat(rows.map(r => cols.map(c => esc(String(r[c] == null ? '' : r[c]))).join(','))).join('\n');
fs.writeFileSync(new URL('../data/product-audit.csv', import.meta.url), csv);
fs.writeFileSync(new URL('../data/product-audit.json', import.meta.url), JSON.stringify(rows, null, 2));

const tally = f => rows.reduce((a, r) => { const k = f(r); a[k] = (a[k] || 0) + 1; return a; }, {});
const show = (l, o) => { console.log('\n== ' + l + ' =='); Object.entries(o).sort((a, b) => b[1] - a[1]).forEach(e => console.log(String(e[1]).padStart(4) + '  ' + e[0])); };

console.log('TOTAL PRODUCTS', rows.length);
show('origin', tally(r => r.origin === 'IN-HOUSE' ? 'IN-HOUSE - ' + r.brand : r.origin === 'UNKNOWN' ? 'NEEDS OWNER REVIEW' : 'RESOLD'));
show('resold brands', rows.filter(r => r.origin === 'RESOLD').reduce((a, r) => { a[r.brand] = (a[r.brand] || 0) + 1; return a; }, {}));
show('platform', tally(r => r.platform));
show('description state', tally(r => r.descState));
show('title issues', rows.reduce((a, r) => { (r.titleIssues ? r.titleIssues.split('|') : ['(clean)']).forEach(k => a[k] = (a[k] || 0) + 1); return a; }, {}));
show('images', tally(r => r.images === 0 ? '0 images' : r.images === 1 ? '1 image' : r.images < 4 ? '2-3 images' : '4+ images'));
console.log('');
console.log('Discounted (compare-at set):', rows.filter(r => r.discounted).length, '| in-house of those:', rows.filter(r => r.discounted && r.inHouse).length);
console.log('Missing SKU on at least one variant:', rows.filter(r => r.skuMissing > 0).length);
console.log('Empty product_type:', rows.filter(r => !r.type).length, '| distinct non-empty:', new Set(rows.filter(r => r.type).map(r => r.type)).size);
console.log('Untagged:', rows.filter(r => !r.tags).length);
console.log('Unavailable:', rows.filter(r => !r.available).length);
const ih = rows.filter(r => r.inHouse), rs = rows.filter(r => r.origin === 'RESOLD');
console.log('In-house avg price:', Math.round(ih.reduce((a, r) => a + r.priceMin, 0) / ih.length), '| Resold avg:', Math.round(rs.reduce((a, r) => a + r.priceMin, 0) / rs.length));
