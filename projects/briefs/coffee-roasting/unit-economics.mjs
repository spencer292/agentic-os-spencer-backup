#!/usr/bin/env node
/**
 * Coffee roasting unit economics — live model.
 *
 *   node unit-economics.mjs
 *   node unit-economics.mjs --green 6.50 --price 20 --hours 12
 *
 * Edit INPUTS below, or override any of them with a --flag.
 * Every number is an assumption until you replace it with a receipt.
 */

const INPUTS = {
  // --- product ---
  bagOz: 12,            // net roasted weight per bag
  price: 18.00,         // retail price per bag, DTC
  roastLossPct: 15,     // 12-14 light / 15-17 medium / 18-20 dark

  // --- costs ---
  greenPerLb: 9.00,     // small-lot ~9-13, Genuine Origin ~6-9, full bag ~5-8
  packagingPerBag: 0.70, // bag + one-way valve + label
  powerPerBag: 0.05,
  processingPct: 3.0,   // card processing on DTC sales
  shippingPerBag: 0.00, // set to ~7.00 to see what mail order really does

  // --- throughput ---
  lbPerHour: 1.75,      // Behmor realistic incl. cooling. Bullet ~9.
  hoursPerWeek: 10,
  yourTimeValue: 30.00, // $/hr. "Free" as a hobby; not free as a business.

  // --- the Bullet decision ---
  bulletCost: 3800,
  bulletLbPerHour: 9.0,
};

// ---------------------------------------------------------------- arg parsing
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i += 2) {
  const key = argv[i].replace(/^--/, '');
  const val = Number(argv[i + 1]);
  if (key in INPUTS && Number.isFinite(val)) INPUTS[key] = val;
  else if (key === 'green' && Number.isFinite(val)) INPUTS.greenPerLb = val;
  else if (key === 'hours' && Number.isFinite(val)) INPUTS.hoursPerWeek = val;
}

const $ = (n) => `$${n.toFixed(2)}`;
const pct = (n) => `${n.toFixed(1)}%`;
const L = (label, v, note = '') => console.log(`  ${label.padEnd(30)}${String(v).padStart(10)}${note ? '   ' + note : ''}`);
const rule = (s = '') => console.log(s ? `\n${s}\n${'─'.repeat(s.length)}` : '─'.repeat(58));

// ------------------------------------------------------------------ per bag
const i = INPUTS;
const yieldRate = 1 - i.roastLossPct / 100;
const greenLbPerBag = i.bagOz / 16 / yieldRate;
const greenCost = greenLbPerBag * i.greenPerLb;
const processing = i.price * (i.processingPct / 100);
const cogs = greenCost + i.packagingPerBag + i.powerPerBag;
const cashCost = cogs + processing + i.shippingPerBag;
const grossProfit = i.price - cashCost;
const grossMargin = (grossProfit / i.price) * 100;

rule('PER BAG');
console.log(`  ${i.bagOz} oz roasted needs ${greenLbPerBag.toFixed(2)} lb green (${i.roastLossPct}% loss)`);
L(`Green @ ${$(i.greenPerLb)}/lb`, $(greenCost));
L('Packaging', $(i.packagingPerBag));
L('Power', $(i.powerPerBag));
if (i.shippingPerBag) L('Shipping', $(i.shippingPerBag));
L(`Processing (${pct(i.processingPct)})`, $(processing));
console.log(`  ${'-'.repeat(40)}`);
L('Total cash cost', $(cashCost));
L('Price', $(i.price));
L('GROSS PROFIT', $(grossProfit), `(${pct(grossMargin)})`);
L('Per cup (~20 cups/bag)', $(i.price / 20), 'vs ~$6.00 at a counter');

// ------------------------------------------------------------------ monthly
const bagsPerLbRoasted = 16 / i.bagOz;
const weeklyLb = i.lbPerHour * i.hoursPerWeek;
const weeklyBags = weeklyLb * bagsPerLbRoasted;
const monthlyBags = weeklyBags * 4.33;
const monthlyRev = monthlyBags * i.price;
const monthlyGross = monthlyBags * grossProfit;
const monthlyHours = i.hoursPerWeek * 4.33;
const laborCost = monthlyHours * i.yourTimeValue;
const perHour = monthlyGross / monthlyHours;

rule('MONTHLY — at current capacity');
console.log(`  ${i.hoursPerWeek} hr/wk @ ${i.lbPerHour} lb/hr  ->  ${weeklyLb.toFixed(1)} lb/wk, ${monthlyBags.toFixed(0)} bags/mo`);
L('Revenue', $(monthlyRev));
L('Gross profit', $(monthlyGross));
L('Your hours', monthlyHours.toFixed(0));
L('EFFECTIVE $/HOUR', $(perHour), '<- the number that decides this');
L(`If you paid someone ${$(i.yourTimeValue)}/hr`, $(monthlyGross - laborCost),
  monthlyGross - laborCost < 0 ? '(LOSS — you are the subsidy)' : '');

// ------------------------------------------------------------- bullet gate
const bulletWeeklyLb = i.bulletLbPerHour * i.hoursPerWeek;
const bulletMonthlyBags = bulletWeeklyLb * bagsPerLbRoasted * 4.33;
const bulletMonthlyGross = bulletMonthlyBags * grossProfit;
const uplift = bulletMonthlyGross - monthlyGross;
const paybackMonths = i.bulletCost / uplift;

rule('THE BULLET DECISION');
console.log(`  Same ${i.hoursPerWeek} hr/wk at ${i.bulletLbPerHour} lb/hr  ->  ${bulletMonthlyBags.toFixed(0)} bags/mo`);
L('Gross profit uplift', $(uplift), '/mo');
L(`Payback on ${$(i.bulletCost)}`, paybackMonths.toFixed(1), 'months');
console.log(`  ...IF you can sell them. Capacity is not demand.`);
console.log(`  GATE: buy only after 4 CONSECUTIVE sold-out weeks. Not on a deal, not on excitement.`);

// ------------------------------------------------------- green price ladder
rule('WHAT GREEN PRICE DOES TO THE WHOLE THING');
console.log('  $/lb green   COGS/bag   margin   gross/mo @ current hours');
for (const g of [13, 11, 9, 7.5, 6.5, 5.5]) {
  const c = greenLbPerBag * g + i.packagingPerBag + i.powerPerBag + processing + i.shippingPerBag;
  const gp = i.price - c;
  const m = (gp / i.price) * 100;
  const tag = g >= 9 ? 'small lot' : g >= 6.5 ? 'Genuine Origin' : 'full bag';
  console.log(`  ${$(g).padStart(9)}   ${$(c).padStart(8)}   ${pct(m).padStart(6)}   ${$(gp * monthlyBags).padStart(9)}   ${tag}`);
}
console.log('\n  Halving green cost beats any roaster upgrade. Sourcing IS the business.');
rule();
