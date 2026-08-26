// Turns the measured metrics into Lighthouse performance scores.
//
// We cannot run Lighthouse itself: it needs a local install (checklist 6.3, still
// awaiting approval) and the PageSpeed API cannot reach a password-protected
// development store. What we can do is apply Lighthouse's own published scoring
// maths to metrics captured under its own mobile throttling — 4x CPU, 1.6 Mbps,
// 150 ms RTT — which is exactly what perf-baseline.mjs and perf-measure.mjs do.
//
// Lighthouse scores each metric with a log-normal curve defined by a median and a
// p10 point, then takes a weighted sum. Constants below are Lighthouse 10/11/12
// mobile (lighthouse/core/audits/metrics/*.js). Speed Index is not measured here,
// so its 10% is reported separately rather than guessed — the score shown is over
// the 90% we did measure, renormalised, and that is stated in the output.
//
//   node scripts/perf-score.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = path.join(path.dirname(path.dirname(fileURLToPath(import.meta.url))), 'data');

// [median, p10] in ms (or unitless for CLS), Lighthouse mobile.
const CURVES = {
  fcpMs: [3000, 1800],
  lcpMs: [4000, 2500],
  blockingTimeMs: [600, 200],
  cls: [0.25, 0.1]
};
const WEIGHTS = { fcpMs: 0.10, lcpMs: 0.25, blockingTimeMs: 0.30, cls: 0.25 };
const SPEED_INDEX_WEIGHT = 0.10; // not measured — see header

// Lighthouse's log-normal CDF scoring.
function score(value, [median, p10]) {
  if (value <= 0) return 1;
  const LN2 = Math.SQRT2;
  const logRatio = Math.log(value / median);
  const shape = Math.abs(Math.log(p10 / median)) / (LN2 * 0.9061938024368232);
  const x = logRatio / (shape * LN2);
  const cdf = 0.5 * (1 - erf(x));
  return Math.min(1, Math.max(0, cdf));
}
// Abramowitz & Stegun 7.1.26
function erf(x) {
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return sign * y;
}

function overall(m) {
  let sum = 0;
  const parts = {};
  for (const [k, w] of Object.entries(WEIGHTS)) {
    const s = score(m[k], CURVES[k]);
    parts[k] = s;
    sum += s * w;
  }
  const measuredWeight = 1 - SPEED_INDEX_WEIGHT;
  return { parts, score: Math.round(100 * sum / measuredWeight) };
}

const label = { fcpMs: 'FCP', lcpMs: 'LCP', blockingTimeMs: 'TBT', cls: 'CLS' };

function load(file) {
  const p = path.join(DATA, file);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
}

const SETS = [
  ['Phase 0 baseline — live syperformance.net (Dawn)', load('perf-baseline.json')],
  ['Phase 8 before — rebuilt theme, pre-optimisation', load('perf-phase8-before.json')],
  ['Phase 8 after — rebuilt theme, optimised', load('perf-phase8-after.json')],
  ['Phase 8 after, published-theme estimate', load('perf-phase8-after-published.json')]
];

for (const [name, data] of SETS) {
  if (!data) continue;
  console.log(`\n${name}`);
  console.log('  page        FCP     LCP     TBT    CLS   |  FCP  LCP  TBT  CLS  |  score');
  for (const key of ['home/mobile', 'collection/mobile', 'product/mobile']) {
    const m = data[key];
    if (!m || m.error) continue;
    const r = overall(m);
    const pct = k => String(Math.round(r.parts[k] * 100)).padStart(4);
    console.log(
      `  ${key.replace('/mobile', '').padEnd(11)}` +
      `${String(m.fcpMs).padStart(5)}ms ${String(m.lcpMs).padStart(5)}ms ${String(m.blockingTimeMs).padStart(5)}ms ${String(m.cls).padStart(6)}  |` +
      `${pct('fcpMs')}${pct('lcpMs')}${pct('blockingTimeMs')}${pct('cls')}  |  ${String(r.score).padStart(3)}`
    );
  }
}

console.log(`
Scores are computed from measured metrics using Lighthouse's own log-normal curves
and weights, not produced by running Lighthouse. Speed Index (10% of the real score)
is not measured, so these are over the remaining 90%, renormalised. Treat them as a
close estimate and confirm with a real Lighthouse run once the theme is published.`);
