// Build a Shopify product-import CSV from the Phase 0 public catalog capture.
// Mirrors the live store exactly - including its data problems (wrong vendors,
// ALL-CAPS titles, missing SKUs). The replica has to reflect reality so the theme
// is built against real conditions; data fixes are a deliberate Phase 7 step.
import fs from 'node:fs';

const P = JSON.parse(fs.readFileSync(new URL('../data/products.json', import.meta.url)));

const COLS = [
  'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Type', 'Tags', 'Published',
  'Option1 Name', 'Option1 Value', 'Option2 Name', 'Option2 Value', 'Option3 Name', 'Option3 Value',
  'Variant SKU', 'Variant Grams', 'Variant Inventory Tracker', 'Variant Inventory Qty',
  'Variant Inventory Policy', 'Variant Fulfillment Service', 'Variant Price',
  'Variant Compare At Price', 'Variant Requires Shipping', 'Variant Taxable',
  'Image Src', 'Image Position', 'Image Alt Text', 'Gift Card', 'Status'
];

const esc = v => {
  const s = String(v == null ? '' : v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

const rows = [];
let variantRows = 0, imageOnlyRows = 0;

for (const p of P) {
  const optNames = (p.options || []).map(o => o.name);
  const variants = p.variants;
  const images = p.images;
  // A product occupies max(variants, images) rows: variant data on the first N,
  // image data on the first M, product-level fields only on row 0.
  const n = Math.max(variants.length, images.length);

  for (let i = 0; i < n; i++) {
    const v = variants[i];
    const img = images[i];
    const first = i === 0;
    const r = {};
    r['Handle'] = p.handle;
    r['Title'] = first ? p.title : '';
    r['Body (HTML)'] = first ? (p.body_html || '') : '';
    r['Vendor'] = first ? p.vendor : '';
    r['Type'] = first ? (p.product_type || '') : '';
    r['Tags'] = first ? p.tags.join(', ') : '';
    r['Published'] = first ? 'TRUE' : '';
    r['Status'] = first ? 'active' : '';
    r['Gift Card'] = first ? 'FALSE' : '';

    if (v) {
      // Option names repeat on every variant row; Shopify requires this.
      r['Option1 Name'] = optNames[0] || 'Title';
      r['Option1 Value'] = v.option1 || 'Default Title';
      r['Option2 Name'] = optNames[1] || '';
      r['Option2 Value'] = v.option2 || '';
      r['Option3 Name'] = optNames[2] || '';
      r['Option3 Value'] = v.option3 || '';
      r['Variant SKU'] = v.sku || '';
      r['Variant Grams'] = v.grams != null ? v.grams : '';
      r['Variant Inventory Tracker'] = '';           // no tracking - dev replica
      r['Variant Inventory Qty'] = '';
      r['Variant Inventory Policy'] = 'continue';     // never block add-to-cart on the replica
      r['Variant Fulfillment Service'] = 'manual';
      r['Variant Price'] = v.price;
      r['Variant Compare At Price'] = v.compare_at_price || '';
      r['Variant Requires Shipping'] = v.requires_shipping ? 'TRUE' : 'FALSE';
      r['Variant Taxable'] = v.taxable ? 'TRUE' : 'FALSE';
      variantRows++;
    } else {
      imageOnlyRows++;
    }

    if (img) {
      r['Image Src'] = img.src;
      r['Image Position'] = i + 1;
      // The live store has no alt text on most images. Seed the product title so the
      // replica is at least accessible; real alt text is a Phase 4 content task.
      r['Image Alt Text'] = p.title;
    }

    rows.push(COLS.map(c => esc(r[c])).join(','));
  }
}

const csv = [COLS.join(',')].concat(rows).join('\n');
fs.writeFileSync(new URL('../data/shopify-import-products.csv', import.meta.url), csv);

console.log('products      :', P.length);
console.log('CSV rows      :', rows.length, '(' + variantRows + ' variant rows, ' + imageOnlyRows + ' image-only rows)');
console.log('total variants:', P.reduce((a, p) => a + p.variants.length, 0));
console.log('total images  :', P.reduce((a, p) => a + p.images.length, 0));
console.log('file size     :', Math.round(csv.length / 1024) + ' KB');
console.log('\nwrote data/shopify-import-products.csv');
