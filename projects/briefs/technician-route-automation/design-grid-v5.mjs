#!/usr/bin/env node
// TERRITORY GRID v5 — Spencer's 2026-08-01 four-way re-cut for the week of 2026-08-03.
//
//   Alias Franks       -> NORTH (Seattle north, Eastside, Snoqualmie Valley)
//   Cory Ventura       -> everything Cammeron ran last week (South King: Seattle-west/Burien/
//                         SeaTac -> Kent/Renton/Covington/Maple Valley/Newcastle)
//   Cammeron + Luke    -> split the SOUTH route
//                           Cammeron = south-EAST  (Auburn/Pacific, Enumclaw plateau, Buckley,
//                                                   Bonney Lake, Sumner/Orting/Edgewood)
//                           Luke     = south-WEST  (I-5 Tacoma, Puyallup, Thurston, peninsula,
//                                                   Federal Way/Milton)
//
// Day structure is built from the LIVE 8/3-8/7 Jobber snapshot so each tech-day is a tight
// geographic cluster of roughly even size. Cities/volumes are carried over from v4/v2 so no zip
// silently drops out of the grid (a zip the grid doesn't know = an unassigned order).
//
// Usage: node design-grid-v5.mjs            (writes territory-grid-v5.json + prints the load table)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const R = f => JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8'));

const v4 = R('territory-grid-v4.json');
const v2 = R('territory-grid.json');
const next = R('week-visits-0803-live2.json');

// ---------- the re-cut: tech -> day -> zips ----------
const PLAN = {
  // NORTH — deliberately the day structure the north has always run (old Cory grid + Spencer's
  // I-90 Friday), NOT a fresh geographic cut. Spencer 2026-08-01: "that's where those people think
  // they're getting their visit." Every one of the 11 stops the optimizer could not route on the
  // first cut was a north job booked on its old day; this restores all of them.
  'Alias Franks': {
    // 98008 Lake Hills sits on MONDAY (Spencer 2026-08-01) � Tom Hopson and Dennis McCreery. It
    // adjoins Bellevue 98005 on this day, not the Sammamish/Redmond Thursday.
    // 98005 Bellevue and 98008 Lake Hills went to Cory's Thursday (Spencer 2026-08-01): Alias's
    // jobs run long, so his real week is ~46h against a 42h ceiling. The rebalancer's cheapest 17
    // handovers were 8 Bellevue/Lake Hills jobs, so the zips move rather than the jobs. Reverses the
    // earlier 'Bellevue stays with Alias' call, which was made on the 10-min-per-stop estimate.
    mon: ['98004', '98007', '98033', '98034', '98039'],
    tue: ['98102', '98105', '98109', '98112', '98115', '98117', '98119', '98125', '98133', '98155', '98177', '98199'],
    // 98053 Redmond/Union Hill mon -> wed (Spencer 2026-08-01): his Monday ran 37 stops / 10.0h and
    // dropped 4 Kirkland stops the optimizer could not fit. Union Hill adjoins the Woodinville end
    // of the Wednesday loop.
    // 98053 Redmond/Union Hill left again (Spencer 2026-08-01): this day was 36 stops / 10.4h, the
    // worst in the fleet. Union Hill borders Sammamish, so it rides Thursday instead. NOT the Monday
    // Redmond group — 98052 (Pacharu, Abraham + two more) stays on Monday as promised.
    wed: ['98011', '98012', '98014', '98019', '98021', '98028', '98072', '98077', '98272', '98296'],
    // THURSDAY I-90 RULE (Spencer 2026-08-01, standing until Cory is replaced): on Thursday Cory
    // takes everything SOUTH of I-90 and Alias everything NORTH. South = 98006 Bellevue-S
    // (Factoria/Newport/Somerset) + 98040 Mercer Island, which join Cory's Newcastle/Renton
    // highlands. North = 98008 Lake Hills, 98029 Issaquah Highlands, 98074/98075 Sammamish.
    // 98008 Lake Hills went to Cory's Thursday (2026-08-01): Alias landed at 40.1h once Bellevue
    // came back, and a whole-zip move was the only way under 40 without re-splitting a zip.
    // ALL Sammamish and Issaquah on Thursday (Spencer 2026-08-01) � 98027 came off Cory's Friday
    // (Tino Perrina #7472 is in it), 98029 off Alias's own Friday.
    thu: ['98053', '98074'],
    // Issaquah 98027/98029 went to Cory's Friday (Spencer 2026-08-01) to keep Alias out of overtime.
    // 98027 Issaquah moved here from Thursday (Spencer 2026-08-01) � Tino Perrina #7472, Don
    // Petricic #6663, Jason Nault #7382, Kristin Cruse #8254. Issaquah sits on I-90 between
    // Bellevue and the valley, so it runs with Fall City / Snoqualmie / North Bend.
    fri: ['98024', '98027', '98045', '98065'],
  },
  'Cory Ventura': {
    // Spencer 2026-08-01: Cory's Monday (West Seattle, 20 stops / 3.9h — the lightest day in the
    // fleet) folds into his Tuesday. West Seattle, Burien, SeaTac, Tukwila and Normandy Park are
    // one contiguous belt, so it runs as a single day. This LEAVES CORY WITH NO MONDAY WORK.
    // ...then Spencer 2026-08-01 pulled Tuesday stops 1-6 back onto Monday: all of 98198
    // (SeaTac/Normandy Park/Des Moines) plus three 98166 jobs, which are job-level below. Monday
    // otherwise held only two pinned stops for a 44-mile drive.
    // ...then Luke's Tuesday stops 1-9 joined it (Spencer 2026-08-01): Federal Way 98003/98023,
    // Milton 98354 and NE Tacoma 98422 came off Luke's I-5 day. Cory's Monday is now one belt down
    // I-5 — Des Moines/Normandy Park -> Federal Way -> Milton -> NE Tacoma. Luke's Tuesday 23 -> 14.
    // ...then Cammeron's Monday stops 5-11 (Spencer 2026-08-01): Auburn 98001 as a zip, plus two
    // Edgewood jobs job-level below. Auburn sits just east of Federal Way, so it extends the belt.
    // ...and finally Tuesday stops 1-8 (Spencer 2026-08-01): the rest of Normandy Park/Burien
    // 98166 and the single 98148 job. Both move whole, so the three 98166 job overrides that were
    // splitting the zip are gone — Monday now owns Normandy Park and Burien outright.
    // 98047 Pacific added for #7820 David Sprague (Spencer 2026-08-01) — as a zip, not an override:
    // Pacific is a single-job zip wedged between Auburn 98001 and Sumner, so it belongs to whoever
    // has Auburn, and that is now Cory's Monday.
    // 98371 came OUT again (Spencer 2026-08-01): like 98372, that zip straddles SR-167 — Edgewood
    // north of it, Puyallup south. Cory takes nothing south of 167, so the zip goes back to Luke and
    // only the Edgewood-addressed job rides job-level below. Both Edgewood zips are city-split.
    mon: ['98003', '98023', '98047', '98148', '98166', '98198', '98354', '98422'],
    tue: ['98106', '98108', '98116', '98118', '98126', '98136', '98144', '98146',
          '98168', '98178', '98188'],
    // + Newcastle 98056 off Friday (2026-08-02): Cory's Wed was 4.8h against a 6.7h Fri and 8.7h
    // Thu. Newcastle is ~8 min from the Renton valley end of this day.
    wed: ['98030', '98031', '98032', '98055', '98056', '98057', '98058'],
    // + the south-of-I-90 Thursday block (Spencer 2026-08-01): Bellevue-S and Mercer Island sit on
    // the same arc as Newcastle and Renton highlands.
    // Renton highlands 98059 went to Cammeron, same day — his Thursday was 46 stops / 10.7h and
    // Cammeron's was 21 / 4.8h. SR-169 runs Renton -> Maple Valley -> Black Diamond into his belt.
    // + Renton highlands 98059 off Cammeron's Friday � it belongs with Newcastle on this arc.
    thu: ['98006', '98040'],
    // Covington 98042 went to Cammeron, same day. Issaquah 98027/98029 came in off Alias — 15 mi
    // from Maple Valley down I-90/SR-18 (Spencer 2026-08-01).
    // Newcastle + Renton Highlands, Friday outright. They were two-day zones across thu+fri, but
    // Thursday already carries the whole of Bellevue � the split only ever worked because the
    // optimizer was force-balancing. Fixed in the grid instead (2026-08-01).
    // Renton Highlands + Bellevue 98005 (~12 min apart on the I-405 corridor).
    fri: ['98005', '98059'],
  },
  'Cammeron Anderson': {
    // 98001 Auburn moved to Cory's Monday (Spencer 2026-08-01, Cammeron stops 7-11).
    // Auburn + Sumner + Edgewood-Puyallup, all within 8 mi of each other on SR-167.
    mon: ['98002', '98092', '98372', '98390'],
    // Orting went BACK to Thursday (Spencer 2026-08-01): on Tuesday it cost 57 extra miles for 6
    // stops and pushed that day to 9.8h. It belongs with Bonney Lake on the SR-410/162 side.
    tue: ['98010', '98022', '98051'],
    wed: ['98321', '98385', '98396'],
    // Renton highlands 98059 and Covington 98042 came off Cory (Spencer 2026-08-01) to level the
    // fleet — Cammeron was 27.0h against Alias 43.8h. Both keep their day; only the tech changes.
    // Spencer 2026-08-01: Friday stops 1-16 (Orting 98360, Puyallup 98372, Sumner 98390) joined the
    // Bonney Lake/Lake Tapps day. All four zips sit on the SR-410 / SR-162 / SR-167 triangle — the
    // tightest cluster in his territory, and Thursday was down to 21 stops / 4.8h.
    // Bonney Lake / Lake Tapps + Orting, one SR-410/162 run.
    thu: ['98360', '98391'],
    // Renton highlands. Covington shares this day with Monday — see TWO_DAY below.
    // Maple Valley off Cory (Spencer 2026-08-01). Covington shares this day with Monday.
    fri: ['98038'],
  },
  'Luke LaVergne': {
    // THURSTON SPLIT (Spencer 2026-08-01): the Olympia-Lacey-Tumwater-DuPont-Steilacoom-Nisqually
    // route runs TWO days, divided at Olympia by US-101 and I-5.
    //   Monday  = north of Olympia / north of 101 and I-5 — west+north Olympia, Hawks Prairie and
    //             Nisqually, then up the I-5 corridor through DuPont to Steilacoom.
    //   Thursday = south of Olympia / south of 101 and I-5 (below).
    // I-5 SOUTH CORRIDOR: Lakewood, Steilacoom, DuPont, Nisqually/Hawks Prairie, finishing in
    // west/north Olympia. North Tacoma/Ruston went to Wednesday instead (Spencer 2026-08-01) —
    // they sit at the Narrows end and belong with Gig Harbor, not with the run down to Olympia.
    mon: ['98327', '98388', '98498', '98499', '98502', '98506', '98516'],
    // East/south Tacoma and Fife, plus Puyallup and South Hill 98373/98374 displaced from the old
    // Thursday — Puyallup sits directly east of Tacoma on the same run. North Tacoma left for Monday.
    tue: ['98363', '98371', '98373', '98374', '98404', '98405', '98424', '98443', '98445', '98446'],
    // NARROWS DAY (Spencer 2026-08-01): the peninsula — Gig Harbor, Fox Island, Olalla, Longbranch,
    // Vaughn, Bremerton, Port Orchard — together with the Tacoma side of the bridge: north Tacoma
    // and Ruston 98403/98406/98407, west Tacoma 98465, University Place and Fircrest 98466/98467.
    // DuPont, Steilacoom and Lakewood stay on the Monday I-5 run instead.
    wed: ['98310', '98312', '98329', '98332', '98333', '98335', '98351', '98359', '98367', '98394',
          '98403', '98406', '98407', '98465', '98466', '98467'],
    // Thursday = the south half of the Thurston route ONLY: central/south Olympia, Tumwater, Lacey,
    // Tenino. Yelm and Roy are NOT Olympia work (Spencer 2026-08-01) — they sit on the SR-507
    // corridor and moved to the Friday plateau day.
    thu: ['98501', '98503', '98512', '98513', '98589'],
    // Friday = its own day for the SR-507 / SR-161 plateau: Yelm, Roy, Spanaway, Frederickson,
    // Elk Plain, Graham, Eatonville (Spencer 2026-08-01). Frederickson and Elk Plain are not their
    // own zips — they fall inside 98375, 98387 and 98338.
    fri: ['98328', '98338', '98580', '98597'],
  },
};

// TWO-DAY ZONES — a zip the optimizer may split across two of the same tech's days. Used when a
// zip fits neither neighbouring day on its own. Covington 98042 (15 stops) is the case: Cammeron's
// zips are lumpy (17/15/21/25/27/21/6/6/4) and every whole-zip partition leaves one day at 36+.
// Covington adjoins Auburn on Monday (8 mi, SR-18) and Renton Highlands on Friday (SR-169), so it
// balances between them (Spencer 2026-08-01).
const TWO_DAY = {
  '98042': { tech: 'Cammeron Anderson', days: ['mon', 'fri'],
             note: 'Covington — two-day zone, splits between Cammeron mon (Auburn) and fri (Renton Highlands)' },
  // DAY-LEVELLING (rule 8, Spencer 2026-08-01): slide work between one tech's own days where the
  // drive allows, to kill 9h-next-to-5h. Both of these are inside the 15-minute ceiling.
  // Cory: mon 9.2h vs wed 4.4h. Auburn is ~12 min from the Kent cluster that anchors his Wednesday.
  '98001': { tech: 'Cory Ventura', days: ['mon', 'wed'],
             note: 'Auburn — day-levelling zone: Cory mon (I-5 belt) <-> wed (Kent/Renton), ~12 min apart' },
  // Luke: fri 9.5h vs tue 5.4h. Spanaway and Frederickson sit ~10-12 min from his South Hill Tuesday.
  // Cory: thu 40 stops vs fri 7 once Maple Valley left and Renton highlands arrived. Newcastle and
  // Renton Highlands both reach Issaquah on I-90 inside the 15-minute ceiling, so they float across
  // his Thursday and Friday and the optimizer finds the balance.
  // Alias: Lake Hills on Monday pushes that day up while Thursday has room. Redmond 98052 pairs
  // with 98053 on Thursday � same city, so it floats between his Monday and Thursday.
  // Alias thu was 39 stops / 10.5h against a 6.6h Friday. Issaquah 98029 and Sammamish 98075 both
  // reach the Snoqualmie Valley Friday run on I-90 / Duthie Hill inside the 15-minute ceiling, so
  // they float across those two days and the optimizer levels them (Spencer 2026-08-01, rule 8).
  '98029': { tech: 'Alias Franks', days: ['thu', 'fri'],
             note: 'Issaquah � day-levelling zone: Alias thu (Sammamish) <-> fri (I-90 valley)' },
  '98075': { tech: 'Alias Franks', days: ['thu', 'fri'],
             note: 'Sammamish S � day-levelling zone: Alias thu <-> fri, Duthie Hill to Fall City' },
  '98052': { tech: 'Alias Franks', days: ['mon', 'thu'],
             note: 'Redmond � day-levelling zone: Alias mon (Bellevue/Kirkland) <-> thu (Redmond/Sammamish)' },
  '98387': { tech: 'Luke LaVergne', days: ['tue', 'fri'],
             note: 'Spanaway — day-levelling zone: Luke tue (South Hill) <-> fri (plateau), ~12 min apart' },
  '98375': { tech: 'Luke LaVergne', days: ['tue', 'fri'],
             note: 'Frederickson — day-levelling zone: Luke tue (South Hill) <-> fri (plateau), ~10 min apart' },
};

const NOTE = {
  'Alias Franks|mon': 'North route — Bellevue/Kirkland/Redmond/Medina (standing Monday)',
  'Alias Franks|tue': 'North route — Seattle north of the Ship Canal + Shoreline (standing Tuesday)',
  'Alias Franks|wed': 'North route — Bothell/Kenmore/Woodinville/Duvall/Carnation/Snohomish (standing Wednesday)',
  'Alias Franks|thu': 'North route — Sammamish/Issaquah + Bellevue-S/Mercer Island (standing Thursday)',
  'Alias Franks|fri': 'North route — I-90: Issaquah/Fall City/Snoqualmie/North Bend (standing Friday)',
  'Cory Ventura|mon': 'unassigned — Monday folded into Tuesday (Spencer 2026-08-01)',
  'Cory Ventura|tue': "Cammeron's last-week belt — West Seattle/Burien/Normandy Park/SeaTac/Tukwila (Mon+Tue combined)",
  'Cory Ventura|wed': "Cammeron's last-week belt — Kent + Renton valley",
  'Cory Ventura|thu': "Cammeron's last-week belt — Renton highlands/Newcastle",
  'Cory Ventura|fri': "Cammeron's last-week belt — Covington/Maple Valley",
  'Cammeron Anderson|mon': 'South route (east half) — Auburn/Pacific',
  'Cammeron Anderson|tue': 'South route (east half) — Enumclaw plateau/Black Diamond/Ravensdale',
  'Cammeron Anderson|wed': 'South route (east half) — Buckley/South Prairie/Wilkeson',
  'Cammeron Anderson|thu': 'South route (east half) — Bonney Lake/Lake Tapps',
  'Cammeron Anderson|fri': 'South route (east half) — Sumner/Orting/Edgewood',
  'Luke LaVergne|mon': 'South route (west half) — Thurston: Olympia/Tumwater',
  'Luke LaVergne|tue': 'South route (west half) — I-5: Tacoma/Fife/Milton/Federal Way',
  'Luke LaVergne|wed': 'South route (west half) — peninsula + University Place/Steilacoom/Lakewood',
  'Luke LaVergne|thu': 'South route (west half) — Puyallup/South Hill/Spanaway',
  'Luke LaVergne|fri': 'South route (west half) — Graham/Eatonville/Yelm/Roy/Lacey',
};

// ---------- carry city/volume metadata forward ----------
const meta = {};
for (const [z, v] of Object.entries(v2.zips)) meta[z] = { cities: v.cities || '', visitsPerYear: v.visitsPerYear };
for (const [z, v] of Object.entries(v4.zips)) meta[z] = { cities: v.cities || meta[z]?.cities || '', visitsPerYear: meta[z]?.visitsPerYear, visitsNextWeek: v.visitsNextWeek };

// ---------- live next-week volume per zip ----------
const vol = {}, cityOf = {};
for (const v of next) {
  const z = (v.property?.address?.postalCode || '').trim().slice(0, 5);
  if (!z) continue;
  vol[z] = (vol[z] || 0) + 1;
  cityOf[z] ||= v.property?.address?.city || '';
}

const zips = {};
for (const [tech, days] of Object.entries(PLAN)) {
  for (const [day, list] of Object.entries(days)) {
    for (const z of list) {
      if (zips[z]) throw new Error(`zip ${z} assigned twice (${zips[z].tech} and ${tech})`);
      zips[z] = {
        day, tech,
        cities: meta[z]?.cities || cityOf[z] || '',
        visitsPerYear: meta[z]?.visitsPerYear,
        visitsNextWeek: vol[z] || 0,
        decided: true,
        note: NOTE[`${tech}|${day}`],
      };
    }
  }
}

for (const [z, cfg] of Object.entries(TWO_DAY)) {
  if (zips[z]) throw new Error(`zip ${z} is in both PLAN and TWO_DAY`);
  zips[z] = {
    days: cfg.days, tech: cfg.tech,
    cities: meta[z]?.cities || cityOf[z] || '',
    visitsPerYear: meta[z]?.visitsPerYear,
    visitsNextWeek: vol[z] || 0,
    decided: true, note: cfg.note,
  };
}

// ---------- coverage check against the live week ----------
const missing = Object.keys(vol).filter(z => !zips[z]).sort();
const dropped = [...new Set([...Object.keys(v2.zips), ...Object.keys(v4.zips)])].filter(z => !zips[z]).sort();

const grid = {
  _comment:
    'TERRITORY GRID v5 (Spencer 2026-08-01) — four-way re-cut for the week of 08-03. ' +
    'Alias Franks = NORTH (Seattle north, Eastside, Snoqualmie Valley). ' +
    'Cory Ventura = everything Cammeron ran last week (South King: West Seattle/Burien/SeaTac -> Kent/Renton/Covington/Maple Valley/Newcastle). ' +
    'Cammeron Anderson + Luke LaVergne SPLIT the south route: Cammeron takes the east half (Auburn/Pacific, Enumclaw plateau, Buckley, Bonney Lake, Sumner/Orting/Edgewood), Luke the west half (I-5 Tacoma, Puyallup, Thurston, peninsula, Federal Way/Milton). ' +
    'Spencer Hill out of field (permanent, 2026-07-29). Tavis Alexander not working. Robert Norton rides along, never his own truck. ' +
    'jobOverrides deliberately EMPTY: every v4 override came from the 2026-07-26 day-review of a three-truck structure that no longer exists, and each one would now pull a stop across the new territory lines. SETs keep their day through push-week\'s pin rule, not through overrides.',
  generated: '2026-08-01',
  basedOn: 'week-visits-0803-live2.json (live Jobber snapshot 2026-07-31)',
  works: {
    'Alias Franks': ['mon', 'tue', 'wed', 'thu', 'fri'],
    'Cory Ventura': ['mon', 'tue', 'wed', 'thu', 'fri'],
    'Cammeron Anderson': ['mon', 'tue', 'wed', 'thu', 'fri'],
    'Luke LaVergne': ['mon', 'tue', 'wed', 'thu', 'fri'],
  },
  notWorking: ['Spencer Hill', 'Tavis Alexander', 'Robert Norton'],
  zips,
  jobOverrides: {
    // Spencer 2026-08-01, off Alias's Monday: stops 16-27 go to Wednesday. Stops 17-27 are the
    // whole of 98053 and moved as a zip; #7116 is the one 98052 job in that block, so it moves
    // job-level and the rest of Redmond 98052 keeps its standing Monday.
    '7116': {
      client: 'Sherry Lotze', zip: '98052', city: 'Redmond',
      gridSays: 'mon/Alias Franks', tech: 'Alias Franks', day: 'wed', decided: true,
      note: 'Monday stop 16 of 37 — moved with the 98053 block (Spencer 2026-08-01).',
    },
    // Spencer 2026-08-01. BREAKS A COMMITTED WINDOW: this visit carries a Mon 08-03 18:00-20:00
    // arrival window. Moving it to Thursday voids that window — the customer must be re-notified.
    // 98006 is a Thursday zip anyway; the pin is the only thing that was holding it on Monday.
    '8102': {
      client: 'Heidi Wilson', zip: '98006', city: 'Bellevue',
      gridSays: 'thu/Cory Ventura', tech: 'Cory Ventura', day: 'thu', decided: true,
      wasCommitted: '2026-08-03 18:00-20:00 PT',
      note: 'Alias Monday stop 1 -> Thursday (Spencer 2026-08-01). The override exists only to beat '
          + 'the committed-window pin; the tech follows the Thursday I-90 rule (98006 = Cory).',
    },
    // Spencer 2026-08-01: three Bothell/Kenmore jobs off the Wednesday loop onto Alias's Monday,
    // which the 98053 move left at 29 stops / 7.9h. All three were unrouted or off-roster.
    '7624': {
      client: 'Greg Thoreson', zip: '98011', city: 'Bothell',
      gridSays: 'wed/Alias Franks', tech: 'Alias Franks', day: 'mon', decided: true,
      note: 'Moved to Alias Monday (Spencer 2026-08-01). Was still assigned to Tavis Alexander.',
    },
    '8139': {
      client: 'David Jones', zip: '98028', city: 'Kenmore',
      gridSays: 'wed/Alias Franks', tech: 'Alias Franks', day: 'mon', decided: true,
      note: 'Moved to Alias Monday (Spencer 2026-08-01). Was unrouted on Monday under Cory.',
    },
    '8255': {
      client: 'Vishal Jain', zip: '98021', city: 'Bothell',
      gridSays: 'wed/Alias Franks', tech: 'Alias Franks', day: 'mon', decided: true,
      note: 'Moved to Alias Monday (Spencer 2026-08-01). Was unrouted on Monday.',
    },
    // (Brian Beans / Hannah Jacobson / Ryan Jaffe no longer need overrides — 98166 is a Monday zip.)
    // Spencer 2026-08-01: two singles pulled onto Cory's Monday from other techs' days. Job-level
    // because their zips stay where they are — 98032 Kent is Cory/wed, 98371 Edgewood is Luke/thu.
    // REMOVED 2026-08-01: GC Bellefield, Judy Revas, Noel Murphy and Terry Wirth were briefly moved
    // to Cory's Thursday to pull Alias out of overtime. The day-levelling zones did that job instead,
    // so Bellevue 98004/98005 goes back to being Alias's alone — one tech per zip (Spencer).
    // REMOVED 2026-08-01: Jim Vaughn, Jessica Rakos (Orting) and Dave Belmont, Nancy Price
    // (Enumclaw) were briefly overridden onto Luke's Tuesday. That put two trucks in Enumclaw on the
    // same day — Cammeron with 15 stops, Luke driving 30 min from Orting for 2 — and split Orting
    // three ways. Both zips belong to Cammeron and he is right there. Lesson: a job-level override
    // that lands a tech inside another tech's live cluster is always wrong, whatever prompted it.
    '8053': {
      client: 'Vicky Dougan', zip: '98360', city: 'Orting',
      gridSays: 'thu/Cammeron Anderson', tech: 'Cammeron Anderson', day: 'wed', decided: true,
      note: 'To Cammeron Wednesday (Spencer 2026-08-01) — Orting is 8 mi from his Buckley day.',
    },
    // Spencer 2026-08-01: two Redmond Ridge jobs onto Alias's Wednesday. Redmond Ridge is the east
    // end of 98053, ~10 min from the Duvall/Carnation loop; the rest of 98053 stays Thursday.
    '6329': { client: 'Akanksha Singh', zip: '98053', city: 'Redmond',
              gridSays: 'thu/Alias Franks', tech: 'Alias Franks', day: 'wed', decided: true,
              note: 'Redmond Ridge -> Alias Wednesday (Spencer 2026-08-01).' },
    '7869': { client: 'Shelley Ryan', zip: '98053', city: 'Redmond',
              gridSays: 'thu/Alias Franks', tech: 'Alias Franks', day: 'wed', decided: true,
              note: 'Redmond Ridge -> Alias Wednesday (Spencer 2026-08-01).' },
    // AUTO-REBALANCE (rebalance-overflow.mjs, 2026-08-01). Alias was 42.9h against a 42h ceiling
    // (40h target + the 2h/week overtime Spencer approved). These six are the jobs of his that sit
    // closest to another tech's ACTUAL route � 2 to 4 minutes of detour each, chosen by measured
    // insertion cost. Letting the day shift is what makes them this cheap: an earlier same-day-only
    // pass could only find 9-14 minute handovers.
    '5022': { client: 'Liz Jones', tech: 'Cammeron Anderson', day: 'fri', decided: true,
              note: 'Overflow from Alias � 2 min detour for the receiving route (auto-rebalance).' },
    '8247': { client: 'Terry Wirth', tech: 'Cory Ventura', day: 'thu', decided: true,
              note: 'Overflow from Alias � 3 min detour for the receiving route (auto-rebalance).' },
    '5152': { client: 'Jenny Roy', tech: 'Cammeron Anderson', day: 'fri', decided: true,
              note: 'Overflow from Alias � 3 min detour for the receiving route (auto-rebalance).' },
    '8169': { client: 'Donna Jensen', tech: 'Cory Ventura', day: 'thu', decided: true,
              note: 'Overflow from Alias � 3 min detour for the receiving route (auto-rebalance).' },
    '6475': { client: 'Amber Owen', tech: 'Cammeron Anderson', day: 'fri', decided: true,
              note: 'Overflow from Alias � 4 min detour for the receiving route (auto-rebalance).' },
    '6116': { client: 'Noel Murphy', tech: 'Cory Ventura', day: 'thu', decided: true,
              note: 'Overflow from Alias � 4 min detour for the receiving route (auto-rebalance).' },
    // Second rebalance pass on the levelled routes: three more Bellevue/Lake Hills jobs onto Cory's
    // Thursday at 2-3 min each, closing the last 0.4h of Alias's overflow.
    '8189': { client: 'Judy Revas', tech: 'Cory Ventura', day: 'fri', decided: true,
              note: 'Overflow from Alias � 2 min detour for Cory (auto-rebalance).' },
    '7744': { client: 'GC Bellefield, LLC.', tech: 'Cory Ventura', day: 'thu', decided: true,
              note: 'Overflow from Alias � 2 min detour for Cory (auto-rebalance).' },
    '7525': { client: 'Denica Bucklin', tech: 'Cory Ventura', day: 'thu', decided: true,
              note: 'Overflow from Alias � 3 min detour for Cory (auto-rebalance).' },
    // Spencer 2026-08-01: David Marsh is a problem job and needs Cory. Bob Roggenbach is a mile away
    // on the same street grid, so he rides along. Both priced against all five of Cory's days �
    // Wednesday (Kent/Renton valley) takes them for +0 and +1 minutes and is his lightest day.
    '7971': { client: 'David Marsh (problem job)', zip: '98042', city: 'Kent',
              gridSays: 'mon,fri/Cammeron Anderson', tech: 'Cory Ventura', day: 'wed', decided: true,
              note: 'Problem job -> Cory (Spencer 2026-08-01). +0 min on his Wednesday.' },
    '8122': { client: 'Bob Roggenbach', zip: '98042', city: 'Kent',
              gridSays: 'mon,fri/Cammeron Anderson', tech: 'Cory Ventura', day: 'wed', decided: true,
              note: 'Moved with David Marsh (Spencer 2026-08-01). +1 min on Cory Wednesday.' },
    // PROBLEM JOBS GO TO CORY (Spencer 2026-08-01). Seven jobs carry "(problem job)" in the title;
    // five already sat with him. These are the two that did not. This is a capability call, not a
    // geographic one � the rebalancer only sees coordinates and would hand them to whoever is
    // nearest, so they are pinned here.
    '5300': { client: 'Terry Williams (problem Job)', zip: '98391', city: 'Bonney Lake',
              gridSays: 'thu/Cammeron Anderson', tech: 'Cory Ventura', day: 'mon', decided: true,
              note: 'Problem job -> Cory (Spencer 2026-08-01). +12 min on his Monday I-5 belt; every '
                  + 'other day of his is 34-56 min away.' },
    // AUTO-REBALANCE (rebalance-overflow.mjs --cap=38, 2026-08-01). Cap tightened from 42 to 38
    // because Alias's jobs run long: the flat 10-min service estimate understates his week by
    // ~11%, so 38 model hours is roughly 42 real. Inserted FIRST so Spencer's explicit overrides
    // below win on any job appearing in both.
    '7382': { client: "Jason Nault", tech: "Cammeron Anderson", day: 'fri', decided: true,
              note: 'Overflow from Alias Franks — 3 min detour for the receiving route (auto-rebalance 2026-08-03).' },
    '6810': { client: "Doug Schutt", tech: "Cory Ventura", day: 'thu', decided: true,
              note: 'Overflow from Alias Franks — 4 min detour for the receiving route (auto-rebalance 2026-08-03).' },
    '8265': { client: "Jepson Fuller", tech: "Cory Ventura", day: 'thu', decided: true,
              note: 'Overflow from Alias Franks — 5 min detour for the receiving route (auto-rebalance 2026-08-03).' },
    '6663': { client: "Don Petricic", tech: "Cammeron Anderson", day: 'fri', decided: true,
              note: 'Overflow from Alias Franks — 5 min detour for the receiving route (auto-rebalance 2026-08-03).' },
    '7267': { client: "Dennis Mccreery", tech: "Cory Ventura", day: 'thu', decided: true,
              note: 'Overflow from Alias Franks — 6 min detour for the receiving route (auto-rebalance 2026-08-03).' },
    '7834': { client: "Ganesh Thirumalai", tech: "Cory Ventura", day: 'fri', decided: true,
              note: 'Overflow from Alias Franks — 7 min detour for the receiving route (auto-rebalance 2026-08-03).' },
    '7285': { client: "Andrea Estes", tech: "Cory Ventura", day: 'fri', decided: true,
              note: 'Overflow from Alias Franks — 8 min detour for the receiving route (auto-rebalance 2026-08-03).' },
    '8236': { client: "Tom Hopson", tech: "Cory Ventura", day: 'thu', decided: true,
              note: 'Overflow from Alias Franks — 8 min detour for the receiving route (auto-rebalance 2026-08-03).' },
    '5355': { client: "Debra Chrapaty", tech: "Cory Ventura", day: 'fri', decided: true,
              note: 'Overflow from Alias Franks — 8 min detour for the receiving route (auto-rebalance 2026-08-03).' },
    '6545': { client: "Rosemarie Havranek", tech: "Cory Ventura", day: 'thu', decided: true,
              note: 'Overflow from Alias Franks — 9 min detour for the receiving route (auto-rebalance 2026-08-03).' },
    '6492': { client: "Greg Hastings", tech: "Cory Ventura", day: 'thu', decided: true,
              note: 'Overflow from Alias Franks — 10 min detour for the receiving route (auto-rebalance 2026-08-03).' },
    '8149': { client: "Shielin Tzong", tech: "Cory Ventura", day: 'fri', decided: true,
              note: 'Overflow from Alias Franks — 10 min detour for the receiving route (auto-rebalance 2026-08-03).' },
    '7384': { client: "Kevin Chen", tech: "Cory Ventura", day: 'thu', decided: true,
              note: 'Overflow from Alias Franks — 10 min detour for the receiving route (auto-rebalance 2026-08-03).' },
    '6392': { client: "Dan Hazen", tech: "Cory Ventura", day: 'thu', decided: true,
              note: 'Overflow from Alias Franks — 10 min detour for the receiving route (auto-rebalance 2026-08-03).' },
    '8014': { client: "Paul Latham", tech: "Cory Ventura", day: 'thu', decided: true,
              note: 'Overflow from Alias Franks — 10 min detour for the receiving route (auto-rebalance 2026-08-03).' },
    '8282': { client: "Ryan Belmont (SET)", tech: "Cory Ventura", day: 'tue', decided: true,
              note: 'Overflow from Alias Franks — 10 min detour for the receiving route (auto-rebalance 2026-08-03).' },
    '7404': { client: "Wendi Wang", tech: "Cory Ventura", day: 'fri', decided: true,
              note: 'Overflow from Alias Franks — 10 min detour for the receiving route (auto-rebalance 2026-08-03).' },
    '8281': { client: "James Paxton (SET)", tech: "Cory Ventura", day: 'thu', decided: true,
              note: 'Overflow from Alias Franks — 11 min detour for the receiving route (auto-rebalance 2026-08-03).' },
    '8138': { client: "Kalhan Ajay", tech: "Cory Ventura", day: 'thu', decided: true,
              note: 'Overflow from Alias Franks — 11 min detour for the receiving route (auto-rebalance 2026-08-03).' },
    '8155': {
      client: 'Bac Walker', zip: '98032', city: 'Kent',
      gridSays: 'wed/Cory Ventura', tech: 'Cory Ventura', day: 'mon', decided: true,
      note: 'To Cory Monday (Spencer 2026-08-01). Duplicate second visit deleted — one visit only.',
    },
    '8134': {
      client: 'Riena Terada (5th Visit)', zip: '98032', city: 'Kent',
      gridSays: 'wed/Cory Ventura', tech: 'Cory Ventura', day: 'mon', decided: true,
      note: 'To Cory Monday (Spencer 2026-08-01). Was Cammeron Thursday.',
    },
    '7951': {
      client: 'Peter Kupu', zip: '98371', city: 'Edgewood',
      gridSays: 'tue/Luke LaVergne', tech: 'Cory Ventura', day: 'mon', decided: true,
      note: 'The one Edgewood-addressed job in 98371 (Spencer 2026-08-01). The Puyallup-addressed '
          + 'jobs in the same zip are south of SR-167 and stay with Luke.',
    },
    // Zip 98372 straddles TWO cities — Edgewood and Puyallup — so it cannot move as a zip. The
    // Edgewood-addressed jobs belong on Cory's Monday with the rest of Edgewood (98371); the
    // Puyallup-addressed ones stay on Cammeron's Friday. That split is only expressible job-level.
    ...Object.fromEntries([
      ['8218', 'Tim Wickland'], ['8211', 'Vicki Yoshioka'],
      ['5369', 'Chris Doll'], ['5438', 'Jan Stanfield'], ['7774', 'Kyle Hardtke'],
    ].map(([job, client]) => [job, {
      client, zip: '98372', city: 'Edgewood',
      gridSays: 'fri/Cammeron Anderson', tech: 'Cory Ventura', day: 'mon', decided: true,
      note: 'Edgewood-addressed 98372 job -> Cory Monday (Spencer 2026-08-01).',
    }])),
    // The Bellevue-S block and Mercer Island are handled by the Thursday I-90 zip rule above, not
    // by job overrides — 98006 and 98040 belong to Cory's Thursday outright, so Danielle Steele
    // and every future 98006 visit follow automatically instead of needing a new override each week.
  },
};

fs.writeFileSync(path.join(__dirname, 'territory-grid-v5.json'), JSON.stringify(grid, null, 1));

// ---------- report ----------
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];
const TECHS = Object.keys(PLAN);
const cell = {};
for (const [z, v] of Object.entries(zips)) cell[`${v.day}|${v.tech}`] = (cell[`${v.day}|${v.tech}`] || 0) + (vol[z] || 0);
console.log('NEXT-WEEK STOPS PER TECH-DAY (live 8/3-8/7 volume against grid v5)\n');
console.log('      ' + TECHS.map(t => t.split(' ')[0].padStart(12)).join('') + '        TOTAL');
for (const d of DAYS) {
  const row = TECHS.map(t => String(cell[`${d}|${t}`] || 0).padStart(12)).join('');
  const tot = TECHS.reduce((s, t) => s + (cell[`${d}|${t}`] || 0), 0);
  console.log(`${d}  ${row}` + String(tot).padStart(13));
}
console.log('      ' + TECHS.map(t => String(DAYS.reduce((s, d) => s + (cell[`${d}|${t}`] || 0), 0)).padStart(12)).join('')
  + String(Object.entries(zips).reduce((s, [z]) => s + (vol[z] || 0), 0)).padStart(13));

console.log(`\nzips in grid: ${Object.keys(zips).length}`);
if (missing.length) console.log(`!! LIVE ZIPS NOT IN GRID (${missing.length}): ` + missing.map(z => `${z} ${cityOf[z]}:${vol[z]}`).join(', '));
else console.log('every zip with a visit next week is in the grid');
if (dropped.length) console.log(`zips carried in v2/v4 but not v5: ${dropped.join(', ')}`);
console.log(`\nwrote territory-grid-v5.json`);
