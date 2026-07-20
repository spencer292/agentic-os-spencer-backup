// build-delivery-pdf.mjs — generate the "Start Here" delivery HTML for the Cleaning Business
// Starter Kit from copy-links.json, then print to PDF with headless Chrome.
// Usage: node build-delivery-pdf.mjs   (from this folder or repo root)
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const here = dirname(fileURLToPath(import.meta.url));
const links = JSON.parse(readFileSync(resolve(here, 'copy-links.json'), 'utf8'));
const outDir = resolve(here, 'delivery');
mkdirSync(outDir, { recursive: true });

const byName = Object.fromEntries(links.map(l => [l.name, l]));
const item = (name, title, desc) => {
  const l = byName[name];
  if (!l) throw new Error('missing link: ' + name);
  return `<div class="item">
    <div class="item-head"><span class="badge">${l.type === 'sheet' ? 'SHEET' : 'DOC'}</span> <strong>${title}</strong></div>
    <p class="desc">${desc}</p>
    <p class="link"><a href="${l.copy_link}">${l.copy_link}</a></p>
  </div>`;
};

const GREEN = '#1a7f4b';
const html = `<!doctype html><html><head><meta charset="utf-8"><title>Route Ready — Start Here</title>
<style>
@page { size: Letter; margin: 16mm 15mm; }
* { box-sizing: border-box; }
body { font-family: Georgia, 'Times New Roman', serif; color: #1c1c1c; line-height: 1.55; font-size: 11.5pt; margin: 0; }
h1 { font-family: Arial, Helvetica, sans-serif; color: ${GREEN}; font-size: 24pt; margin: 0 0 2px; }
.tagline { color: #555; margin: 0 0 18px; font-style: italic; }
h2 { font-family: Arial, Helvetica, sans-serif; color: ${GREEN}; font-size: 14pt; border-bottom: 2px solid ${GREEN}; padding-bottom: 3px; margin: 22px 0 10px; page-break-after: avoid; }
.item { margin: 0 0 12px; page-break-inside: avoid; }
.item-head { font-family: Arial, sans-serif; font-size: 11pt; }
.badge { display: inline-block; background: ${GREEN}; color: #fff; font-size: 7.5pt; font-weight: bold; padding: 1px 6px; border-radius: 3px; vertical-align: 1px; margin-right: 4px; }
.desc { margin: 2px 0; color: #333; }
.link { margin: 0; font-size: 9pt; word-break: break-all; }
.link a { color: ${GREEN}; }
.box { background: #f0f7f3; border-left: 4px solid ${GREEN}; padding: 10px 14px; margin: 14px 0; page-break-inside: avoid; }
.small { font-size: 9pt; color: #666; }
ol li { margin-bottom: 4px; }
.footer { margin-top: 26px; border-top: 1px solid #ccc; padding-top: 8px; font-size: 9pt; color: #666; }
</style></head><body>

<h1>Cleaning Business Starter Kit</h1>
<p class="tagline">Route Ready &mdash; routereadykits.com &mdash; built by an operator, not a template shop.</p>

<div class="box">
<strong>How this works (read this first).</strong>
Every file below is a link. Click it, and Google will offer to make <em>your own copy</em> in your
Google account &mdash; yours to edit, rename, and use forever. Nothing is shared back to us; your numbers
stay your numbers. You'll need a free Google account. Prefer Excel/Word? After copying, use
File &rarr; Download in Google to export any file.
</div>

<h2>Start in this order</h2>
<ol>
<li><strong>Pricing Calculator</strong> &mdash; set your rate, floor, and production speeds. Every quote flows from this.</li>
<li><strong>Startup Checklist</strong> &mdash; registration, insurance, supplies, first clients.</li>
<li><strong>Residential Service Agreement + Intake Form</strong> &mdash; ready before your first walkthrough.</li>
<li>Everything else as the work shows up.</li>
</ol>

<h2>Price it right</h2>
${item('route-ready-pricing-calculator', 'Pricing Calculator', 'Square footage in, flat-rate quote out — with a minimum-job floor the sheet won’t quote below and a margin check that flags money-losers in red.')}
${item('route-ready-job-costing', 'Job Costing Sheet', 'Your true hourly per job including drive time, and a client ranking that tells you who to keep, re-price, or release.')}
${item('route-ready-income-expense-tracker', 'Income & Expense Tracker', 'Monthly P&L plus common tax-deduction categories (confirm specifics with your tax pro).')}

<h2>Protect the work</h2>
${item('route-ready-residential-service-agreement', 'Residential Service Agreement', 'Scope, access, breakage policy with liability caps, cancellation and lockout fees, re-clean guarantee.')}
${item('route-ready-commercial-cleaning-contract', 'Commercial Cleaning Contract', 'Frequency schedule exhibit, COI language, annual escalator, inspection and cure terms, renewal and termination.')}
${item('route-ready-quote-estimate', 'Quote / Estimate Template', 'Recurring and one-time sections, add-on upsell menu, 30-day validity, acceptance block.')}
${item('route-ready-invoice', 'Invoice Template', 'Clean invoice with payment methods, late-fee line, and a built-in review ask.')}
${item('route-ready-policies-and-letters', 'Policies & Letters', 'Cancellation/no-show policy insert, price-increase letter, and three complaint-response email templates.')}

<h2>Run the route</h2>
${item('route-ready-route-tracker', 'Recurring Client & Route Tracker', 'Client roster, day-of-week route grid, and revenue per route day — see which days earn and which days drive.')}
${item('route-ready-client-intake-forms', 'Client Intake Forms', 'Residential and commercial versions — capture pets, access, priorities, and budget before you quote.')}
${item('route-ready-client-welcome-packet', 'Client Welcome Packet', 'What new clients can expect, policies in plain language, and how to flag issues — ends with a review ask.')}
${item('route-ready-cleaning-checklists', 'Cleaning Checklists (3-in-1)', 'Standard, deep, and move-out checklists, crew-ready, ordered the way an efficient cleaner actually moves.')}
${item('route-ready-startup-checklist', 'Startup Checklist', 'Zero to first client: registration, insurance, supplies budget, and a first-10-clients plan.')}

<h2>Bonus</h2>
${item('route-ready-pricing-cheat-sheet', 'Pricing Cheat Sheet', 'The 2-page pricing formula and route-density rule — works for any local service trade. Share it with a friend starting out.')}

<div class="box small">
<strong>The templates are starting points, not legal advice.</strong> Contracts and policies vary by state and
county &mdash; have a local attorney review anything you’ll sign clients to. Tax categories are common
examples, not tax guidance.
</div>

<p class="footer">Questions or a broken link? Email us &mdash; we fix fast. &nbsp;|&nbsp; Route Ready &mdash; routereadykits.com &nbsp;|&nbsp; &copy; 2026 Route Ready. For the buyer’s business use; please don’t redistribute the files or links.</p>

</body></html>`;

const htmlPath = resolve(outDir, 'route-ready-start-here.html');
writeFileSync(htmlPath, html);

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const pdfPath = resolve(outDir, 'route-ready-start-here.pdf');
execFileSync(chrome, [
  '--headless=new', '--disable-gpu', '--no-pdf-header-footer',
  `--print-to-pdf=${pdfPath}`,
  'file:///' + htmlPath.replace(/\\/g, '/'),
], { stdio: 'pipe', timeout: 60000 });
console.log('PDF written: ' + pdfPath);
