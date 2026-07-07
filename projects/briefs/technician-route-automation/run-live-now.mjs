// Trigger the FIRST live weekly run right now (instead of waiting for the 5am schedule),
// so you can watch the first real backfill and review the Notion row immediately.
// Run:  node projects/briefs/technician-route-automation/run-live-now.mjs
// It runs LIVE (writes tomorrow..+7 into Jobber, 500/day cap, freeze-today protected).
console.log('Firing the first LIVE weekly run (tomorrow..+7)... this takes a few minutes.');
const res = await fetch('https://gotmoles.app.n8n.cloud/webhook/route-sync-week', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ days: 7 }),
});
console.log('HTTP', res.status);
console.log((await res.text()).slice(0, 300));
console.log('\nDone — check the 🚚 Route Sync Log in Notion for the row.');
