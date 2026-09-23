#!/usr/bin/env node
/**
 * S3a - derive-territory.mjs
 *
 * Derives the territory geometry that actually emerged in the field, from the
 * as-built master alone. No rulebook is read; no boundary is imposed.
 *
 * Input:  redesign/data/master-asbuilt.json
 * Output: redesign/data/territory-asbuilt.json
 *         redesign/data/territory-asbuilt.geojson
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const DATA = path.join(ROOT, 'redesign', 'data');

const WORKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];
const SEAM_KM = 1.5;
const NEIGHBOURS = 10;
const CLUSTER_KM = 2.5;

const log = [];
const say = (...a) => {
  const s = a.join(' ');
  log.push(s);
  console.log(s);
};

const hav = (a, b) => {
  const R = 6371;
  const p = Math.PI / 180;
  const dLat = (b.lat - a.lat) * p;
  const dLng = (b.lng - a.lng) * p;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * p) * Math.cos(b.lat * p) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

const tally = (xs) => xs.reduce((a, x) => ((a[x] = (a[x] || 0) + 1), a), {});
const topN = (t, n = 6) => Object.entries(t).sort((a, b) => b[1] - a[1]).slice(0, n);
const top1 = (t) => {
  const e = topN(t, 1);
  return e.length ? { value: e[0][0], count: e[0][1] } : { value: null, count: 0 };
};

// Andrew monotone chain, on (lng, lat) - fine at this latitude and scale
const hull = (pts) => {
  if (pts.length < 3) return pts.map((p) => [p.lng, p.lat]);
  const P = pts.map((p) => [p.lng, p.lat]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of P) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0)
      lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = P.length - 1; i >= 0; i--) {
    const p = P[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0)
      upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
};

// hull area in km^2 (shoelace on a local equirectangular projection)
const hullAreaKm2 = (ring) => {
  if (ring.length < 3) return 0;
  const lat0 = (ring.reduce((a, p) => a + p[1], 0) / ring.length) * (Math.PI / 180);
  const kx = 111.32 * Math.cos(lat0);
  const ky = 110.57;
  let s = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    s += a[0] * kx * (b[1] * ky) - b[0] * kx * (a[1] * ky);
  }
  return Math.abs(s / 2);
};

const closeRing = (ring) => (ring.length >= 3 ? [...ring, ring[0]] : ring);

// ---------------------------------------------------------------- load
const master = JSON.parse(fs.readFileSync(path.join(DATA, 'master-asbuilt.json'), 'utf8'));
const jobs = master.jobs.filter((j) => j.lat != null && j.routeDay);
say(`[load] ${master.jobs.length} jobs, ${jobs.length} geocoded and route-dayed`);

const stableJobs = jobs.filter((j) => j.stability === 'STABLE');
say(`[load] ${stableJobs.length} STABLE jobs define the geometry`);

const TECHS = [...new Set(jobs.map((j) => j.dominantTech))].sort();

// ---------------------------------------------------------------- per tech
const territories = [];
for (const tech of TECHS) {
  const mine = jobs.filter((j) => j.dominantTech === tech);
  const stable = stableJobs.filter((j) => j.dominantTech === tech);
  const ring = hull(stable);
  const byDay = {};
  for (const d of WORKDAYS) {
    const dayStable = stable.filter((j) => j.dominantWeekday === d);
    const dayAll = mine.filter((j) => j.dominantWeekday === d);
    const dRing = hull(dayStable);
    byDay[d] = {
      weekday: d,
      jobs: dayAll.length,
      stableJobs: dayStable.length,
      weeklyEqVisits: +dayAll.reduce((a, j) => a + (j.weeklyEq || 0), 0).toFixed(1),
      centroid: dayAll.length
        ? {
            lat: +(dayAll.reduce((a, j) => a + j.lat, 0) / dayAll.length).toFixed(5),
            lng: +(dayAll.reduce((a, j) => a + j.lng, 0) / dayAll.length).toFixed(5),
          }
        : null,
      hullAreaKm2: +hullAreaKm2(dRing).toFixed(1),
      hull: closeRing(dRing),
      topCities: topN(tally(dayAll.map((j) => j.city).filter(Boolean))),
      topZips: topN(tally(dayAll.map((j) => j.zip).filter(Boolean))),
    };
  }
  territories.push({
    tech,
    jobs: mine.length,
    stableJobs: stable.length,
    stableShare: +(stable.length / mine.length).toFixed(3),
    weeklyEqVisits: +mine.reduce((a, j) => a + (j.weeklyEq || 0), 0).toFixed(1),
    centroid: {
      lat: +(mine.reduce((a, j) => a + j.lat, 0) / mine.length).toFixed(5),
      lng: +(mine.reduce((a, j) => a + j.lng, 0) / mine.length).toFixed(5),
    },
    hullAreaKm2: +hullAreaKm2(ring).toFixed(1),
    hull: closeRing(ring),
    topCities: topN(tally(mine.map((j) => j.city).filter(Boolean)), 12),
    topZips: topN(tally(mine.map((j) => j.zip).filter(Boolean)), 12),
    byWeekday: byDay,
  });
}

// ---------------------------------------------------------------- overlaps
// A customer sits in an overlap zone when its 10 nearest STABLE neighbours do
// not agree on a tech.
const overlaps = [];
for (const j of jobs) {
  const near = stableJobs
    .filter((s) => s.jobNumber !== j.jobNumber)
    .map((s) => ({ s, d: hav(j, s) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, NEIGHBOURS);
  if (near.length < NEIGHBOURS) continue;
  const t = tally(near.map((n) => n.s.dominantTech));
  const ranked = Object.entries(t).sort((a, b) => b[1] - a[1]);
  if (ranked.length < 2) continue;
  const [a, b] = ranked;
  if (b[1] < 3) continue; // a lone dissenting neighbour is not an overlap
  overlaps.push({
    jobNumber: j.jobNumber,
    client: j.client,
    city: j.city,
    zip: j.zip,
    street: j.street,
    lat: j.lat,
    lng: j.lng,
    assignedTech: j.dominantTech,
    assignedWeekday: j.dominantWeekday,
    stability: j.stability,
    inferred: j.inferred,
    neighbourSplit: Object.fromEntries(ranked),
    techA: a[0],
    countA: a[1],
    techB: b[0],
    countB: b[1],
    neighbourRadiusKm: +near[near.length - 1].d.toFixed(2),
    assignedMatchesMajority: j.dominantTech === a[0],
  });
}
say(`[overlap] ${overlaps.length} customers sit where the nearest stable work splits across techs`);

const overlapZones = {};
for (const o of overlaps) {
  const k = [o.techA, o.techB].sort().join(' / ');
  overlapZones[k] ||= { pair: k, customers: 0, cities: {}, zips: {}, againstMajority: 0 };
  overlapZones[k].customers++;
  if (o.city) overlapZones[k].cities[o.city] = (overlapZones[k].cities[o.city] || 0) + 1;
  if (o.zip) overlapZones[k].zips[o.zip] = (overlapZones[k].zips[o.zip] || 0) + 1;
  if (!o.assignedMatchesMajority) overlapZones[k].againstMajority++;
}
const overlapZoneList = Object.values(overlapZones)
  .map((z) => ({
    ...z,
    cities: topN(z.cities, 8),
    zips: topN(z.zips, 8),
  }))
  .sort((a, b) => b.customers - a.customers);

// ---------------------------------------------------------------- per zip
const zipRows = {};
for (const j of jobs) {
  if (!j.zip) continue;
  zipRows[j.zip] ||= { zip: j.zip, cities: {}, jobs: 0, techs: {}, days: {}, visits: 0, lat: 0, lng: 0 };
  const z = zipRows[j.zip];
  z.jobs++;
  z.visits += j.completedCount;
  z.lat += j.lat;
  z.lng += j.lng;
  if (j.city) z.cities[j.city] = (z.cities[j.city] || 0) + 1;
  // weight the dominance vote by how much work the customer actually generates
  z.techs[j.dominantTech] = (z.techs[j.dominantTech] || 0) + 1;
  z.days[j.dominantWeekday] = (z.days[j.dominantWeekday] || 0) + 1;
}
const zips = Object.values(zipRows)
  .map((z) => {
    const t = top1(z.techs);
    const d = top1(z.days);
    return {
      zip: z.zip,
      city: top1(z.cities).value,
      jobs: z.jobs,
      completedVisits: z.visits,
      centroid: { lat: +(z.lat / z.jobs).toFixed(5), lng: +(z.lng / z.jobs).toFixed(5) },
      dominantTech: t.value,
      techShare: +(t.count / z.jobs).toFixed(3),
      techSplit: topN(z.techs, 5),
      dominantWeekday: d.value,
      weekdayShare: +(d.count / z.jobs).toFixed(3),
      weekdaySplit: topN(z.days, 5),
      split: t.count / z.jobs < 0.8 || d.count / z.jobs < 0.8,
    };
  })
  .sort((a, b) => b.jobs - a.jobs);
say(
  `[zip] ${zips.length} zips; ${zips.filter((z) => z.techShare < 0.8).length} are not tech-clean, ${
    zips.filter((z) => z.weekdayShare < 0.8).length
  } are not day-clean`
);

// ---------------------------------------------------------------- seams
// A seam is where two techs' customers sit within SEAM_KM of each other.
const pairsFor = (keyOf, pool, km = SEAM_KM) => {
  const out = [];
  for (let i = 0; i < pool.length; i++) {
    for (let k = i + 1; k < pool.length; k++) {
      const a = pool[i];
      const b = pool[k];
      if (keyOf(a) === keyOf(b)) continue;
      const d = hav(a, b);
      if (d <= km) out.push({ a, b, d: +d.toFixed(3) });
    }
  }
  return out;
};

// cluster seam points so the seam can be described as a place, not a list
const clusterPoints = (pts) => {
  const unused = [...pts];
  const clusters = [];
  while (unused.length) {
    const seed = unused.shift();
    const c = [seed];
    for (let i = unused.length - 1; i >= 0; i--) {
      if (hav(seed, unused[i]) <= CLUSTER_KM) c.push(unused.splice(i, 1)[0]);
    }
    clusters.push(c);
  }
  return clusters.sort((a, b) => b.length - a.length);
};

const streetName = (s) =>
  (s || '')
    .replace(/^[0-9-]+\s+/, '')
    .replace(/\s+(Apt|Unit|Ste|#).*$/i, '')
    .trim();

const describeCluster = (c) => {
  const cities = topN(tally(c.map((p) => p.city).filter(Boolean)), 4);
  const zipsIn = topN(tally(c.map((p) => p.zip).filter(Boolean)), 4);
  const streets = topN(tally(c.map((p) => streetName(p.street)).filter(Boolean)), 5);
  const lat = c.reduce((a, p) => a + p.lat, 0) / c.length;
  const lng = c.reduce((a, p) => a + p.lng, 0) / c.length;
  const cityWords = cities.map(([n, k]) => `${n} (${k})`).join(', ');
  return {
    customers: c.length,
    centroid: { lat: +lat.toFixed(5), lng: +lng.toFixed(5) },
    cities,
    zips: zipsIn,
    streets,
    describedAs: `${cityWords || 'unknown'} around ${streets
      .slice(0, 3)
      .map(([s]) => s)
      .join(' / ') || 'no common street'}`,
  };
};

// The STABLE subset alone is too sparse for a 1.5 km test: its closest
// cross-tech pair is 1.94 km apart, so a stable-only seam scan returns nothing.
// Primary seam scan therefore runs over every assigned customer at 1.5 km;
// a stable-only scan at STABLE_SEAM_KM is reported alongside as the confident tier.
const STABLE_SEAM_KM = 3.0;
const stableGeo = jobs;
const techSeamPairs = pairsFor((j) => j.dominantTech, stableGeo);
say(
  `[seam] ${techSeamPairs.length} assigned-customer pairs within ${SEAM_KM} km across different techs (all ${jobs.length} customers)`
);
const stableOnlySeamPairs = pairsFor((j) => j.dominantTech, stableJobs, STABLE_SEAM_KM);
say(
  `[seam] stable-only tier: ${stableOnlySeamPairs.length} pairs within ${STABLE_SEAM_KM} km (0 within ${SEAM_KM} km — closest stable cross-tech pair is 1.94 km)`
);

const techSeams = {};
for (const p of techSeamPairs) {
  const k = [p.a.dominantTech, p.b.dominantTech].sort().join(' | ');
  techSeams[k] ||= { pair: k, pairCount: 0, minKm: Infinity, points: new Map() };
  const s = techSeams[k];
  s.pairCount++;
  s.minKm = Math.min(s.minKm, p.d);
  for (const j of [p.a, p.b]) s.points.set(j.jobNumber, j);
}

const techSeamList = Object.values(techSeams)
  .map((s) => {
    const pts = [...s.points.values()];
    const clusters = clusterPoints(pts).slice(0, 6).map(describeCluster);
    const [t1, t2] = s.pair.split(' | ');
    return {
      pair: s.pair,
      techA: t1,
      techB: t2,
      pairCount: s.pairCount,
      customersInvolved: pts.length,
      minKm: +s.minKm.toFixed(3),
      cities: topN(tally(pts.map((p) => p.city).filter(Boolean)), 8),
      zips: topN(tally(pts.map((p) => p.zip).filter(Boolean)), 8),
      clusters,
      examples: pts
        .slice(0, 0)
        .map(() => null),
    };
  })
  .sort((a, b) => b.pairCount - a.pairCount);

// add concrete example pairs per seam, nearest first
{
  const byPair = {};
  for (const p of techSeamPairs) {
    const k = [p.a.dominantTech, p.b.dominantTech].sort().join(' | ');
    (byPair[k] ||= []).push(p);
  }
  for (const s of techSeamList) {
    s.examples = (byPair[s.pair] || [])
      .sort((x, y) => x.d - y.d)
      .slice(0, 8)
      .map((p) => ({
        km: p.d,
        a: `#${p.a.jobNumber} ${p.a.client} — ${p.a.street}, ${p.a.city} ${p.a.zip} (${p.a.dominantTech} ${p.a.dominantWeekday})`,
        b: `#${p.b.jobNumber} ${p.b.client} — ${p.b.street}, ${p.b.city} ${p.b.zip} (${p.b.dominantTech} ${p.b.dominantWeekday})`,
      }));
  }
}

// weekday seams inside each tech
const weekdaySeams = [];
for (const tech of TECHS) {
  const mine = jobs.filter((j) => j.dominantTech === tech);
  const prs = pairsFor((j) => j.dominantWeekday, mine);
  const byPair = {};
  for (const p of prs) {
    const k = [p.a.dominantWeekday, p.b.dominantWeekday].sort().join(' | ');
    byPair[k] ||= { pair: k, pairCount: 0, minKm: Infinity, points: new Map(), raw: [] };
    const s = byPair[k];
    s.pairCount++;
    s.minKm = Math.min(s.minKm, p.d);
    s.raw.push(p);
    for (const j of [p.a, p.b]) s.points.set(j.jobNumber, j);
  }
  weekdaySeams.push({
    tech,
    totalCrossDayPairs: prs.length,
    seams: Object.values(byPair)
      .map((s) => {
        const pts = [...s.points.values()];
        return {
          pair: s.pair,
          pairCount: s.pairCount,
          customersInvolved: pts.length,
          minKm: +s.minKm.toFixed(3),
          cities: topN(tally(pts.map((p) => p.city).filter(Boolean)), 6),
          zips: topN(tally(pts.map((p) => p.zip).filter(Boolean)), 6),
          clusters: clusterPoints(pts).slice(0, 3).map(describeCluster),
          examples: s.raw
            .sort((x, y) => x.d - y.d)
            .slice(0, 4)
            .map((p) => ({
              km: p.d,
              a: `#${p.a.jobNumber} ${p.a.street}, ${p.a.city} ${p.a.zip} (${p.a.dominantWeekday})`,
              b: `#${p.b.jobNumber} ${p.b.street}, ${p.b.city} ${p.b.zip} (${p.b.dominantWeekday})`,
            })),
        };
      })
      .sort((a, b) => b.pairCount - a.pairCount),
  });
}

// ---------------------------------------------------------------- write
const out = {
  generatedAt: new Date().toISOString(),
  source: 'master-asbuilt.json; geometry from STABLE customers only; no rulebook consulted',
  window: master.window,
  method: {
    hull: 'convex hull of STABLE customers (per tech, and per tech x weekday)',
    overlap: `${NEIGHBOURS} nearest STABLE neighbours; flagged when the runner-up tech holds >= 3 of them`,
    seam: `pairs of assigned customers within ${SEAM_KM} km belonging to different techs (or, within a tech, different weekdays); STABLE-only customers are too sparse for this radius, so a stable-only tier at ${STABLE_SEAM_KM} km is reported separately`,
    cluster: `${CLUSTER_KM} km greedy clustering of seam customers, described by their cities and streets`,
    zip: 'dominance by job count, not visit count',
  },
  summary: {
    techs: TECHS.length,
    stableJobs: stableJobs.length,
    overlapCustomers: overlaps.length,
    overlapAgainstMajority: overlaps.filter((o) => !o.assignedMatchesMajority).length,
    zips: zips.length,
    zipsNotTechClean: zips.filter((z) => z.techShare < 0.8).length,
    zipsNotDayClean: zips.filter((z) => z.weekdayShare < 0.8).length,
    techSeamPairs: techSeamPairs.length,
    stableOnlySeamPairs: stableOnlySeamPairs.length,
    stableOnlySeamKm: STABLE_SEAM_KM,
  },
  stableOnlySeams: Object.values(
    stableOnlySeamPairs.reduce((acc, p) => {
      const k = [p.a.dominantTech, p.b.dominantTech].sort().join(' | ');
      acc[k] ||= { pair: k, pairCount: 0, minKm: Infinity, cities: {} };
      acc[k].pairCount++;
      acc[k].minKm = Math.min(acc[k].minKm, p.d);
      for (const j of [p.a, p.b]) if (j.city) acc[k].cities[j.city] = (acc[k].cities[j.city] || 0) + 1;
      return acc;
    }, {})
  )
    .map((s) => ({ ...s, minKm: +s.minKm.toFixed(3), cities: topN(s.cities, 6) }))
    .sort((a, b) => b.pairCount - a.pairCount),
  territories,
  zips,
  overlapZones: overlapZoneList,
  overlaps,
  techSeams: techSeamList,
  weekdaySeams,
};

fs.writeFileSync(path.join(DATA, 'territory-asbuilt.json'), JSON.stringify(out, null, 1));

// GeoJSON: tech hulls, tech-weekday hulls, seam points, overlap points
const features = [];
for (const t of territories) {
  if (t.hull.length >= 4)
    features.push({
      type: 'Feature',
      properties: {
        kind: 'tech-hull',
        tech: t.tech,
        jobs: t.jobs,
        stableJobs: t.stableJobs,
        areaKm2: t.hullAreaKm2,
      },
      geometry: { type: 'Polygon', coordinates: [t.hull] },
    });
  for (const d of WORKDAYS) {
    const w = t.byWeekday[d];
    if (w.hull.length >= 4)
      features.push({
        type: 'Feature',
        properties: {
          kind: 'tech-weekday-hull',
          tech: t.tech,
          weekday: d,
          jobs: w.jobs,
          stableJobs: w.stableJobs,
          areaKm2: w.hullAreaKm2,
        },
        geometry: { type: 'Polygon', coordinates: [w.hull] },
      });
  }
}
for (const s of techSeamList) {
  for (const c of s.clusters) {
    features.push({
      type: 'Feature',
      properties: {
        kind: 'tech-seam-cluster',
        pair: s.pair,
        customers: c.customers,
        describedAs: c.describedAs,
      },
      geometry: { type: 'Point', coordinates: [c.centroid.lng, c.centroid.lat] },
    });
  }
}
for (const o of overlaps) {
  features.push({
    type: 'Feature',
    properties: {
      kind: 'overlap-customer',
      jobNumber: o.jobNumber,
      client: o.client,
      assignedTech: o.assignedTech,
      techA: o.techA,
      techB: o.techB,
      againstMajority: !o.assignedMatchesMajority,
    },
    geometry: { type: 'Point', coordinates: [o.lng, o.lat] },
  });
}
fs.writeFileSync(
  path.join(DATA, 'territory-asbuilt.geojson'),
  JSON.stringify({ type: 'FeatureCollection', features }, null, 1)
);

// ---------------------------------------------------------------- report
say('');
say('=== TERRITORY (from STABLE customers) ===');
say('  tech                jobs  stable  share  hull km2   top cities');
for (const t of territories)
  say(
    `  ${t.tech.padEnd(18)} ${String(t.jobs).padStart(5)} ${String(t.stableJobs).padStart(
      7
    )} ${String((t.stableShare * 100).toFixed(0) + '%').padStart(6)} ${String(t.hullAreaKm2).padStart(
      9
    )}   ${t.topCities.slice(0, 5).map(([c, n]) => `${c}:${n}`).join(' ')}`
  );

say('');
say('=== OVERLAP ZONES ===');
for (const z of overlapZoneList)
  say(
    `  ${z.pair.padEnd(34)} ${String(z.customers).padStart(4)} customers, ${String(
      z.againstMajority
    ).padStart(3)} assigned against their neighbours | ${z.cities
      .slice(0, 5)
      .map(([c, n]) => `${c}:${n}`)
      .join(' ')}`
  );

say('');
say('=== TECH SEAMS ===');
for (const s of techSeamList) {
  say(
    `  ${s.pair.padEnd(34)} ${String(s.pairCount).padStart(4)} pairs, ${String(
      s.customersInvolved
    ).padStart(4)} customers, closest ${s.minKm} km`
  );
  for (const c of s.clusters.slice(0, 3)) say(`      - ${c.customers}: ${c.describedAs}`);
}

say('');
say('=== WEEKDAY SEAMS (within a tech) ===');
for (const w of weekdaySeams) {
  say(`  ${w.tech}: ${w.totalCrossDayPairs} cross-day pairs within ${SEAM_KM} km`);
  for (const s of w.seams.slice(0, 4))
    say(
      `      ${s.pair.padEnd(11)} ${String(s.pairCount).padStart(4)} pairs | ${s.cities
        .slice(0, 4)
        .map(([c, n]) => `${c}:${n}`)
        .join(' ')}`
    );
}

say('');
say('=== ZIPS THAT ARE NOT CLEAN ===');
for (const z of zips.filter((x) => x.techShare < 0.8).slice(0, 20))
  say(
    `  ${z.zip} ${(z.city || '').padEnd(16)} ${String(z.jobs).padStart(3)} jobs | tech ${z.techSplit
      .map(([t, n]) => `${t.split(' ')[0]}:${n}`)
      .join(' ')} | day ${z.weekdaySplit.map(([d, n]) => `${d}:${n}`).join(' ')}`
  );

say('');
say(`wrote ${path.join(DATA, 'territory-asbuilt.json')}`);
say(`wrote ${path.join(DATA, 'territory-asbuilt.geojson')}`);

fs.writeFileSync(path.join(DATA, 'derive-territory.log'), log.join('\n') + '\n');
