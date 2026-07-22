// analyze-baseline.mjs — aggregate the Phase 0 diagnostic pulls into the numbers
// the baseline model needs. Pure local computation over data/*.jsonl.
// Usage: node projects/briefs/got-moles-scale/scripts/analyze-baseline.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(here, '..', 'data');
const load = (f) => {
  const p = path.join(dataDir, f);
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
};

const invoices = load('invoices.jsonl');
const clients = load('clients.jsonl');
const quotes = load('quotes.jsonl');
const visits = load('visits.jsonl');
const callrail = fs.existsSync(path.join(dataDir, 'callrail-volume.json'))
  ? JSON.parse(fs.readFileSync(path.join(dataDir, 'callrail-volume.json'), 'utf8')) : [];

const out = { generated_at: new Date().toISOString(), row_counts: { invoices: invoices.length, clients: clients.length, quotes: quotes.length, visits: visits.length } };

// ---- Revenue by month (issued, non-draft) ----
const REAL = new Set(['awaiting_payment', 'paid', 'past_due', 'sent_not_due']);
const byMonth = {};
let badDebt = 0;
for (const inv of invoices) {
  const st = inv.invoiceStatus;
  if (st === 'draft') continue;
  const m = (inv.issuedDate || '').slice(0, 7);
  if (!m) continue;
  const t = inv.amounts?.total || 0;
  if (st === 'bad_debt') { badDebt += t; continue; }
  byMonth[m] = byMonth[m] || { total: 0, count: 0 };
  byMonth[m].total = Math.round((byMonth[m].total + t) * 100) / 100;
  byMonth[m].count++;
}
out.revenue_by_month = byMonth;
out.bad_debt_total = Math.round(badDebt * 100) / 100;

// Trailing 12-month run rate
const monthsSorted = Object.keys(byMonth).sort();
const last12 = monthsSorted.slice(-13, -1); // exclude current partial month
out.trailing_12mo_revenue = Math.round(last12.reduce((s, m) => s + byMonth[m].total, 0) * 100) / 100;
out.trailing_12mo_months = last12;

// ---- AR / leakage ----
let arTotal = 0, arCount = 0, pastDue = 0, pastDueCount = 0;
for (const inv of invoices) {
  const bal = inv.amounts?.invoiceBalance || 0;
  if (bal > 0 && REAL.has(inv.invoiceStatus)) { arTotal += bal; arCount++; }
  if (inv.invoiceStatus === 'past_due') { pastDue += bal; pastDueCount++; }
}
out.ar = { open_balance_total: Math.round(arTotal * 100) / 100, open_invoices: arCount, past_due_total: Math.round(pastDue * 100) / 100, past_due_invoices: pastDueCount };

// ---- Line-item name census (for service-line classification) ----
const itemNames = {};
for (const inv of invoices) {
  for (const li of inv.lineItems?.nodes || []) {
    const n = (li.name || '').trim().toLowerCase().slice(0, 60);
    itemNames[n] = itemNames[n] || { count: 0, revenue: 0 };
    itemNames[n].count++;
    itemNames[n].revenue = Math.round((itemNames[n].revenue + (li.totalPrice || 0)) * 100) / 100;
  }
}
out.top_line_items = Object.entries(itemNames).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 40)
  .map(([name, v]) => ({ name, ...v }));

// ---- Per-client revenue (LTV inputs) ----
const perClient = {};
for (const inv of invoices) {
  if (!REAL.has(inv.invoiceStatus)) continue;
  const id = inv.client?.id;
  if (!id) continue;
  perClient[id] = perClient[id] || { revenue: 0, invoices: 0, firstMonth: '9999', lastMonth: '0000' };
  const m = (inv.issuedDate || '').slice(0, 7);
  perClient[id].revenue += inv.amounts?.total || 0;
  perClient[id].invoices++;
  if (m && m < perClient[id].firstMonth) perClient[id].firstMonth = m;
  if (m && m > perClient[id].lastMonth) perClient[id].lastMonth = m;
}
const clientRevs = Object.values(perClient);
const activeCutoff = monthsSorted.slice(-4)[0]; // invoiced in last ~3 months
out.clients_invoiced_24mo = clientRevs.length;
out.clients_active_last3mo = clientRevs.filter((c) => c.lastMonth >= activeCutoff).length;
out.avg_revenue_per_invoiced_client_24mo = clientRevs.length ? Math.round(clientRevs.reduce((s, c) => s + c.revenue, 0) / clientRevs.length) : 0;
const sortedRev = clientRevs.map((c) => c.revenue).sort((a, b) => b - a);
out.client_revenue_p50 = sortedRev[Math.floor(sortedRev.length / 2)] || 0;
out.client_revenue_top10pct_share = sortedRev.length
  ? Math.round(100 * sortedRev.slice(0, Math.ceil(sortedRev.length / 10)).reduce((s, v) => s + v, 0) / sortedRev.reduce((s, v) => s + v, 0)) : 0;

// ---- Clients file: tags, lead sources, cohorts ----
if (clients.length) {
  const tagCounts = {}, sources = {}, cohorts = {};
  let leads = 0, archived = 0, withBalance = 0;
  for (const c of clients) {
    if (c.isLead) leads++;
    if (c.isArchived) archived++;
    if ((c.balance || 0) > 0) withBalance++;
    for (const t of c.tags?.nodes || []) tagCounts[t.label] = (tagCounts[t.label] || 0) + 1;
    const src = (c.leadSource || 'unknown').toLowerCase();
    sources[src] = (sources[src] || 0) + 1;
    const m = (c.createdAt || '').slice(0, 7);
    if (m >= '2024-08') cohorts[m] = (cohorts[m] || 0) + 1;
  }
  out.clients_total = clients.length;
  out.clients_leads = leads;
  out.clients_archived = archived;
  out.clients_with_open_balance = withBalance;
  out.tag_counts = Object.fromEntries(Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 25));
  out.lead_sources = Object.fromEntries(Object.entries(sources).sort((a, b) => b[1] - a[1]).slice(0, 20));
  out.new_clients_by_month = cohorts;
}

// ---- Quotes funnel ----
if (quotes.length) {
  const byStatus = {};
  let sentValue = 0, wonValue = 0;
  for (const q of quotes) {
    byStatus[q.quoteStatus] = (byStatus[q.quoteStatus] || 0) + 1;
    const v = q.amounts?.total || 0;
    if (q.quoteStatus !== 'draft') sentValue += v;
    if (q.quoteStatus === 'approved' || q.quoteStatus === 'converted') wonValue += v;
  }
  const sent = quotes.filter((q) => q.quoteStatus !== 'draft').length;
  const won = (byStatus.approved || 0) + (byStatus.converted || 0);
  out.quotes = {
    total_12mo: quotes.length, by_status: byStatus,
    close_rate_pct: sent ? Math.round(100 * won / sent) : null,
    avg_quote_value: sent ? Math.round(sentValue / sent) : null,
    won_value_12mo: Math.round(wonValue),
  };
}

// ---- Capacity (visits last 12 weeks) ----
if (visits.length) {
  const perTechWeek = {};
  let completed = 0, durTotal = 0, durCount = 0;
  for (const v of visits) {
    if (!v.isComplete) continue;
    completed++;
    if (v.duration) { durTotal += v.duration; durCount++; }
    const week = v.startAt?.slice(0, 10);
    const wk = week ? `${week.slice(0, 4)}-W${Math.ceil((new Date(week).getUTCDate()) / 7)}` : 'unk';
    for (const u of v.assignedUsers?.nodes || []) {
      const name = u.name?.full || 'unassigned';
      perTechWeek[name] = perTechWeek[name] || {};
      perTechWeek[name][v.startAt.slice(0, 10)] = (perTechWeek[name][v.startAt.slice(0, 10)] || 0) + 1;
    }
  }
  const techSummary = {};
  for (const [tech, days] of Object.entries(perTechWeek)) {
    const totalVisits = Object.values(days).reduce((s, n) => s + n, 0);
    techSummary[tech] = { visits_12wk: totalVisits, per_week: Math.round(totalVisits / 12) };
  }
  out.capacity = {
    completed_visits_12wk: completed,
    avg_visit_minutes: durCount ? Math.round(durTotal / durCount / 60) : null,
    per_tech: techSummary,
  };
}

// ---- CallRail ----
if (callrail.length) {
  out.calls_by_month = Object.fromEntries(callrail.filter((m) => m.total_calls).map((m) => [m.month, m.total_calls]));
}

fs.writeFileSync(path.join(dataDir, 'baseline-aggregates.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2).slice(0, 3000));
console.log('\nSaved -> data/baseline-aggregates.json');
