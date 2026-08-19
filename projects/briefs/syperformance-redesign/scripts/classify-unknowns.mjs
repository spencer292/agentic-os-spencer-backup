// Second-pass classification of the 52 products the automatic classifier could not call.
// Each call below is reasoned from the part family, naming conventions, and known
// aftermarket product lines. Confidence is explicit so the owner only has to
// adjudicate the genuinely ambiguous ones.
import fs from 'node:fs';

const CALLS = {
  // --- HIGH confidence IN-HOUSE: fab/billet work in SY's known families ---
  'evo-7-8-9-bottom-mount-turbo-kit': ['IN-HOUSE', 'high', 'Turbo kit built around SY Evo manifolds; no third-party brand anywhere'],
  'evo-7-8-9-forward-facing-turbo-kit': ['IN-HOUSE', 'high', 'Same family as the SY Evo forward-facing manifold'],
  'evo-7-8-9-forward-facing-turbo-kit-up-pipes': ['IN-HOUSE', 'high', 'Fabricated up-pipes, same kit family'],
  'syp-2021-toyota-supra-a90-b58-3-0-6-port-turbo-kit': ['IN-HOUSE', 'high', 'Title carries SYP; matches the B58 6-port manifold already confirmed in-house'],
  'evo-7-8-9-down-pipe-stock-frame-stock-location': ['IN-HOUSE', 'high', 'Fabricated downpipe, stock-frame family SY already sells'],
  'b58-supra-bmw-port-injection': ['IN-HOUSE', 'high', 'Machined port-injection setup, B58 family'],
  'syp-catch-can-overflow-combo': ['IN-HOUSE', 'high', 'Title carries SYP'],
  'syp-k-series-fuel-rail': ['IN-HOUSE', 'high', 'Title carries SYP'],
  'b16-race-fill-pot': ['IN-HOUSE', 'high', 'Fill pot family; K Series Coolant Fill Pot already confirmed in-house'],
  'b18-gsr-fill-pot': ['IN-HOUSE', 'high', 'Same fill pot family'],
  'honda-k-series-water-necks': ['IN-HOUSE', 'high', 'Billet coolant hardware, same family as the confirmed block-offs'],
  'honda-k-series-rbc-rbb-water-plate': ['IN-HOUSE', 'high', 'Billet plate, K-series coolant family'],
  'k-series-rbb-rbc-water-bypass': ['IN-HOUSE', 'high', 'Billet coolant family'],
  'prb-water-housing': ['IN-HOUSE', 'high', 'Billet coolant family'],
  'rbc-rbb-throttle-body-adapter-plate-kit': ['IN-HOUSE', 'high', 'Billet adapter plate'],
  'k-series-adjustable-idler-pulley-kit': ['IN-HOUSE', 'high', 'Billet pulley kit'],
  'alternator-relocation-kit-k-series': ['IN-HOUSE', 'high', 'Fabricated bracket kit'],
  'k-series-steel-tapped-oil-pan': ['IN-HOUSE', 'high', 'Fabricated/modified pan'],
  'scatter-sheild': ['IN-HOUSE', 'high', 'Fabricated bellhousing shield; has its own collection'],
  'b58-turbo-oil-drain-10an': ['IN-HOUSE', 'high', 'Machined AN fitting, B58 family'],
  'b58-oil-feed-4an': ['IN-HOUSE', 'high', 'Machined AN fitting, B58 family'],
  'b58-crank-case-vent-fitting-ccv': ['IN-HOUSE', 'high', 'Machined fitting, B58 family'],
  'honda-k-series-thermostat-heater-plug': ['IN-HOUSE', 'high', 'Machined plug, same family as transfer case block-offs'],
  'vacuum-block': ['IN-HOUSE', 'high', 'Billet vacuum manifold'],
  '2-5-stainless-uj-bend': ['IN-HOUSE', 'high', 'Stainless fab stock, same family as Mandrel Bends / Pie Cuts'],

  // --- MEDIUM confidence IN-HOUSE ---
  'honda-insane-shaft-swap-axles': ['IN-HOUSE', 'medium', 'Drivetrain/axle family is the core moat, but "Insane Shaft" may be a supplier brand - CONFIRM'],
  'honda-k-series-type-s-tucked-engine-harness': ['IN-HOUSE', 'medium', 'Tucked harnesses are usually built in-house, but Rywire is a known supplier and is resold here - CONFIRM'],
  'turbo-oil-drain-line-kit': ['IN-HOUSE', 'medium', 'Assembled line kit; could be resold components'],
  'turbo-oil-feed-line-kit': ['IN-HOUSE', 'medium', 'Assembled line kit; could be resold components'],
  'boost-solenoid-pushloc-kit': ['IN-HOUSE', 'medium', 'Assembled kit around a bought-in solenoid'],
  '02-04-rsx-to-05-06-vss-jumper-harness': ['IN-HOUSE', 'medium', 'Small harness, likely built in-house'],
  'k-series-to-b-series-tps-jumper-harness': ['IN-HOUSE', 'medium', 'Small harness, likely built in-house'],
  'flush-mount-hood-pins': ['IN-HOUSE', 'medium', 'Simple machined part, but widely resold - CONFIRM'],

  // --- HIGH confidence RESOLD ---
  'pte-turbos': ['RESOLD', 'high', 'PTE = Precision Turbo & Engine'],
  'drag-pro-series-coilovers-92-00-civic-eg-ek-94-01-integra-dc': ['RESOLD', 'high', 'Blox Racing "Drag Pro Series" product line'],
  'street-series-ii-plus-coilovers-92-00-civic-94-01-integra': ['RESOLD', 'high', 'Blox Racing "Street Series II" product line'],
  'competition-series-coilovers-92-00-civic-94-01-integra': ['RESOLD', 'high', 'Blox Racing "Competition Series" product line'],
  'tuner-series-throttle-body-honda-b-d-f-h-series': ['RESOLD', 'high', 'Blox Racing "Tuner Series" product line'],
  'competition-series-qr-s2000-clutch-master-cylinder': ['RESOLD', 'high', 'Blox Racing "Competition Series" product line'],
  'traction-bar-kit-92-00-civic-94-01-integra': ['RESOLD', 'high', 'Blox Racing traction bar kit'],
  'rear-camber-kit-88-00-civic-90-01-integra': ['RESOLD', 'high', 'Blox Racing camber kit'],
  'honda-k-series-oem-2nd-gear-type-s': ['RESOLD', 'high', 'OEM Honda gear'],
  'rsx-oem-spec-shifter-cables': ['RESOLD', 'high', 'OEM-spec replacement cables'],
  'civic-integra-throttle-cable': ['RESOLD', 'high', 'OEM-spec replacement cable'],
  'turbo-blanket': ['RESOLD', 'high', 'Bought-in turbo blanket'],
  'electronic-boost-control-solenoid': ['RESOLD', 'high', 'Bought-in MAC-style solenoid'],
  '2020-2024-a90-supra-carbon-fiber-fenders': ['RESOLD', 'high', 'Carbon body panel - SY does metal, not composites'],
  '2020-2024-a90-supra-carbon-door-guard-trim': ['RESOLD', 'high', 'Carbon trim'],
  '2020-2024-a90-supra-carbon-fiber-trunk-spoiler': ['RESOLD', 'high', 'Carbon body panel'],
  '92-00-honda-civic-2dr-quick-release-hood-hinges': ['RESOLD', 'high', 'Common resold item'],

  'syp-2021-toyota-supra-a90-a91-3-0-6-port-turbo-kit': ['IN-HOUSE', 'high', 'Title carries SYP; B58 6-port kit'],
  'evo-7-8-9-forward-facing-turbo-kit-1': ['IN-HOUSE', 'high', 'SY-fabricated 304 manifold kit; bundles a bought-in Pulsar or PTE turbo. Handle suffix -1 is a stale-handle artifact, not a duplicate product'],
  'electronic-boost-controller': ['RESOLD', 'high', 'Bought-in boost controller'],

  // --- GENUINELY AMBIGUOUS - owner must decide ---
  'k-series-type-s-oil-pump-kit': ['ASK', 'low', 'Could be an OEM pump resold, or an SY-assembled kit'],
  'toyota-supra-a90-bmw-z4-b58-3-0l-turbo-cold-air-intake-system': ['ASK', 'low', 'SY fabricates intakes, but this is also a heavily resold category'],
  'flywheels': ['ASK', 'low', 'No brand, no platform, no description - could be Comp 1, could be resold'],
};

const rows = JSON.parse(fs.readFileSync(new URL('../data/product-audit.json', import.meta.url)));
const members = JSON.parse(fs.readFileSync(new URL('../data/collection-members.json', import.meta.url)));
const sale = new Set(members['sale-special']);

const unknowns = rows.filter(r => r.origin === 'UNKNOWN');
const out = unknowns.map(r => {
  const c = CALLS[r.handle] || ['ASK', 'low', 'No call made'];
  return {
    handle: r.handle, title: r.title, price: r.priceMin,
    inSaleSpecial: sale.has(r.handle) ? 'yes' : 'no',
    suggested: c[0], confidence: c[1], reasoning: c[2],
    ownerDecision: '', descChars: r.descChars, images: r.images
  };
});
out.sort((a, b) => (a.suggested === 'ASK' ? -1 : 1) - (b.suggested === 'ASK' ? -1 : 1) || b.price - a.price);

const cols = Object.keys(out[0]);
const esc = v => /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
fs.writeFileSync(new URL('../data/unknowns-review.csv', import.meta.url),
  [cols.join(',')].concat(out.map(r => cols.map(c => esc(String(r[c]))).join(','))).join('\n'));

const t = s => out.filter(r => r.suggested === s).length;
console.log('52 unknowns resolved:');
console.log('  IN-HOUSE (high confidence):', out.filter(r => r.suggested === 'IN-HOUSE' && r.confidence === 'high').length);
console.log('  IN-HOUSE (medium, confirm):', out.filter(r => r.suggested === 'IN-HOUSE' && r.confidence === 'medium').length);
console.log('  RESOLD   (high confidence):', out.filter(r => r.suggested === 'RESOLD' && r.confidence === 'high').length);
console.log('  ASK owner                 :', t('ASK'));
console.log('\nUncalled (not in CALLS map):', unknowns.filter(r => !CALLS[r.handle]).map(r => r.handle));
console.log('\nRevised in-house total would be:',
  rows.filter(r => r.inHouse).length + out.filter(r => r.suggested === 'IN-HOUSE').length,
  'of', rows.length);
