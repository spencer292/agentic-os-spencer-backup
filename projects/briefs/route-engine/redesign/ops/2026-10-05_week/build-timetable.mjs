// Builds timetable-2026-10-05.csv and the data block for the timetable page from routes-*.json.
import fs from 'node:fs';
const DATES = ['2026-10-05','2026-10-06','2026-10-07','2026-10-08','2026-10-09'];
const days = [], csv = ['date,tech,stop,arrival,window_end,client,job,address,drive_min'];
for (const d of DATES) {
  const r = JSON.parse(fs.readFileSync(`routes-${d}.json`, 'utf8'));
  const routes = (r.routes || []).map(rt => {
    const stops = (rt.stops || []).filter(s => s.orderNo).map(s => {
      const [client, job] = String(s.locationName).split(' · #');
      const t = String(s.scheduledAtDt).slice(11, 16); const [h, m] = t.split(':').map(Number);
      const end = `${String(h + 3).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const parts = String(s.address).split(', '); const city = parts.length >= 3 ? parts[parts.length - 3] : '';
      const row = { n: s.stopNumber, t, end, client: client.trim(), job: job || '', city, street: parts[0], drive: Math.round((s.travelTime || 0) / 60) };
      csv.push([d, rt.driverName, row.n, t, end, `"${row.client.replace(/"/g, '""')}"`, row.job, `"${s.address}"`, row.drive].join(','));
      return row;
    });
    return { tech: rt.driverName, min: rt.duration, km: Math.round(rt.distance), stops };
  }).sort((a, b) => a.tech.localeCompare(b.tech));
  days.push({ date: d, routes });
}
fs.writeFileSync('timetable-2026-10-05.csv', csv.join('\n') + '\n');
fs.writeFileSync('timetable-data.json', JSON.stringify(days));
console.log(csv.length - 1, 'rows');
