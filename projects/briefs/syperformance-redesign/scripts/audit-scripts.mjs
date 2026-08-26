// Phase 8: which of the module scripts loaded by snippets/scripts.liquid are
// actually used on each template?
//
// Each script registers one or more custom elements. Fetch every template from
// the build store and report, per script, which templates contain at least one
// of its elements. Anything with no hits on any template is dead weight on every
// page; anything hitting one template should be gated to that template.
//
//   node scripts/audit-scripts.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE, STORE, THEME_ID, authenticate } from './_build-store.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// Scripts snippets/scripts.liquid loads unconditionally, plus the ones it already gates.
const SCRIPTS = [
  'popover-polyfill.js', 'overflow-list.js', 'quick-add.js', 'dialog.js', 'variant-picker.js',
  'product-card.js', 'product-form.js', 'fly-to-cart.js', 'accordion-custom.js', 'media.js',
  'product-price.js', 'product-sku.js', 'product-inventory.js', 'show-more.js', 'slideshow.js',
  'layered-slideshow.js', 'anchored-popover.js', 'floating-panel.js', 'video-background.js',
  'component-quantity-selector.js', 'media-gallery.js', 'rte-formatter.js', 'volume-pricing.js',
  'price-per-item.js', 'volume-pricing-info.js', 'sticky-add-to-cart.js', 'cart-discount.js',
  'localization.js', 'comparison-slider.js'
];

const TEMPLATES = {
  index: '/',
  collection: '/collections/syp-billet',
  'collection-list': '/collections',
  product: '/products/k-series-single-lobe-billet-rockers',
  search: '/search?q=billet',
  cart: '/cart',
  blog: '/blogs/news',
  'page-about': '/pages/about',
  'page-dealer': '/pages/dealer',
  'page-warranty': '/pages/warranty',
  'page-lead-times': '/pages/lead-times',
  'page-contact': '/pages/contact',
  404: '/does-not-exist-404'
};

// element tags each script registers, read straight from the asset
function elementsFor(file) {
  const p = path.join(ROOT, 'theme', 'assets', file);
  if (!fs.existsSync(p)) return [];
  const src = fs.readFileSync(p, 'utf8');
  return [...new Set([...src.matchAll(/customElements\.define\(\s*['"]([a-z0-9-]+)['"]/g)].map(m => m[1]))];
}

const { cookieHeader, cdpCookies } = await authenticate();

const html = {};
for (const [name, url] of Object.entries(TEMPLATES)) {
  const res = await fetch(BASE + url, { headers: { cookie: cookieHeader } });
  html[name] = await res.text();
  process.stderr.write(`${res.status} ${name} ${url}\n`);
}

console.log('\nscript                          elements                                    templates that use it');
console.log('-'.repeat(120));
const unused = [];
for (const file of SCRIPTS) {
  const els = elementsFor(file);
  const hits = Object.keys(html).filter(t => els.some(el => new RegExp(`<${el}[\\s>]`).test(html[t])));
  if (!hits.length) unused.push(file);
  console.log(
    file.padEnd(31) + els.join(' ').slice(0, 43).padEnd(44) + (hits.join(' ') || '— NONE —')
  );
}
console.log('\nLoaded on every page, used on none: ' + (unused.join(', ') || '(none)'));
