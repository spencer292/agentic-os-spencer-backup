// LIVE test on last week's completed visits — safe (jobs are done), capped at 5 writes.
// Run: node projects/briefs/technician-route-automation/live-test-lastweek.mjs
const body = { runDate: '2026-07-01', dryRun: false, maxWrites: 5, allowPast: true };
console.log('Firing LIVE write on ' + body.runDate + ' (maxWrites ' + body.maxWrites + ')...');
const res = await fetch('https://gotmoles.app.n8n.cloud/webhook/route-sync-test', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});
console.log('HTTP', res.status);
console.log(await res.text());
