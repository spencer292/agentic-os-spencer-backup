#!/usr/bin/env node
// GEO SIDE — decide which side of a highway boundary an address falls on.
//
// Exists because Spencer's boundaries are HIGHWAYS and highways cut through zip codes. The Olympia
// split (north of I-5 / US-101 vs south) puts 98501, 98502, 98503 and 98513 on BOTH sides — a zip
// rule misplaces about a third of the work. So membership is decided per address, from the real
// coordinates OptimoRoute geocodes, and cached.
//
// Used by rebalance-week.mjs to pick which of two shared-zip regions a visit belongs to, and so
// which DAY it runs. It never affects which TECHNICIAN owns the stop — both sides of a geoSplit
// have the same owner by construction.
//
// Cache: geo-side-cache.json, keyed by "<normalised street>|<zip>". Refresh with
//   node thurston-split.mjs --write-cache --from=... --to=...
// An address with no cached entry falls back to its zip's fallbackSide and is reported by the
// caller, so a new customer degrades to the old zip behaviour instead of blocking a plan.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = path.join(__dirname, 'geo-side-cache.json');

export function normAddr(street, zip) {
  const s = String(street || '')
    .toLowerCase()
    .replace(/\b(unit|apt|apartment|suite|ste|#)\s*[\w-]+/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  return `${s}|${String(zip || '').trim().slice(0, 5)}`;
}

export function loadCache() {
  try { return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')); } catch { return { entries: {} }; }
}
export function saveCache(cache) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

// Which side of the piecewise boundary line a point sits on.
export function classifyPoint(line, lat, lon) {
  if (lat == null || lon == null) return null;
  let seg = null;
  for (const s of line.segments) {
    const okLo = s.appliesWhenLonAtLeast == null || lon >= s.appliesWhenLonAtLeast;
    const okHi = s.appliesWhenLonBelow == null || lon < s.appliesWhenLonBelow;
    if (okLo && okHi) { seg = s; break; }
  }
  if (!seg) seg = line.segments[line.segments.length - 1];
  const t = (lon - seg.from.lon) / (seg.to.lon - seg.from.lon);
  const boundaryLat = seg.from.lat + t * (seg.to.lat - seg.from.lat);
  const marginMi = (lat - boundaryLat) * 69;
  return { side: marginMi >= 0 ? 'NORTH' : 'SOUTH', marginMi: +marginMi.toFixed(2), corridor: seg.corridor };
}

// The lookup rebalance-week uses. Returns { side, source } — source is 'cache' or 'fallback'.
export function sideOf(lineName, line, street, zip, cache = loadCache()) {
  const key = normAddr(street, zip);
  const hit = cache.entries?.[key];
  if (hit && hit.line === lineName && hit.side) return { side: hit.side, source: 'cache' };
  const fb = line.fallbackSide?.[String(zip || '').trim().slice(0, 5)];
  return { side: fb || null, source: fb ? 'fallback' : 'none' };
}
