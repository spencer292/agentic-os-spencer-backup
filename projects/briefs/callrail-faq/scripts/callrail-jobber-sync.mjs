// CallRail Voice Assist → Jobber sync.
// Reads structured VA intake (voice_assist_message) from recent calls and creates/repairs
// Jobber clients with the REAL captured data (correct name order, actual street address, email)
// instead of the caller-ID junk the native integration writes.
//
// Usage:
//   node callrail-jobber-sync.mjs                # dry-run (default): print planned actions only
//   node callrail-jobber-sync.mjs --apply        # execute mutations in Jobber
//   node callrail-jobber-sync.mjs --hours 72     # lookback window (default 48)
//
// State: data/sync-state.json tracks processed call IDs (only marked processed on --apply).
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'fs';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../..');
const dataDir = path.resolve(here, '../data');
const stateFile = path.join(dataDir, 'sync-state.json');
const jobberCli = path.join(root, '.claude/skills/tool-jobber/scripts/jobber-api.mjs');

for (const line of readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const key = process.env.CALLRAIL_API_KEY.trim();
const ACCT = 'ACC019dc0126ade7956850fbd40239646af';

const APPLY = process.argv.includes('--apply');
const hoursIdx = process.argv.indexOf('--hours');
const HOURS = hoursIdx > -1 ? Number(process.argv[hoursIdx + 1]) : 48;

const state = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')) : { processed: [] };
const processed = new Set(state.processed);

// ---------- helpers ----------
const cr = async (p, params = {}) => {
  const url = new URL(`https://api.callrail.com/v3/${p}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { headers: { Authorization: `Token token="${key}"` } });
  if (!res.ok) throw new Error(`CallRail ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
};

const jobber = (query) => {
  const out = execFileSync('node', [jobberCli, 'query', query], { encoding: 'utf8', cwd: root });
  const jsonStart = out.indexOf('{');
  if (jsonStart < 0) throw new Error('Jobber CLI returned no JSON: ' + out.slice(0, 200));
  return JSON.parse(out.slice(jsonStart));
};

const gqlStr = (s) => JSON.stringify(String(s ?? ''));

const normPhone = (p) => String(p || '').replace(/\D/g, '').replace(/^1(\d{10})$/, '$1');

function splitName(full) {
  const parts = String(full || '').trim().split(/\s+/);
  if (parts.length < 2) return { firstName: parts[0] || '', lastName: '' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] };
}

const STATE_MAP = { washington: 'WA' };
function parseAddress(raw) {
  if (!raw) return null;
  const s = String(raw).trim().replace(/\.$/, '');
  // "35712 Cumberland Way Southeast, Enumclaw, Washington 98022" | "..., Bellevue, WA 98005" | "..., Edmonds, Washington, 98020"
  const parts = s.split(',').map((x) => x.trim()).filter(Boolean);
  if (parts.length < 2) return { street: s, city: '', province: 'WA', postalCode: '' };
  const street = parts[0];
  let city = '', province = 'WA', postalCode = '';
  const rest = parts.slice(1).join(' ');
  const zipM = rest.match(/(\d{5})(?:-\d{4})?\s*$/);
  if (zipM) postalCode = zipM[1];
  const restNoZip = rest.replace(/(\d{5})(?:-\d{4})?\s*$/, '').trim();
  const stM = restNoZip.match(/\b(washington|wa)\b\.?\s*$/i);
  if (stM) {
    province = STATE_MAP[stM[1].toLowerCase()] || stM[1].toUpperCase();
    city = restNoZip.slice(0, stM.index).replace(/,\s*$/, '').trim();
  } else {
    city = restNoZip;
  }
  return { street, city, province, postalCode };
}

// Known intake keys → semantic slots; anything unrecognized goes into the note verbatim.
function mapContents(contents) {
  const out = { extra: {} };
  for (const [k, v] of Object.entries(contents || {})) {
    if (v == null || v === '') continue;
    const kk = k.toLowerCase().replace(/[^a-z]/g, '');
    if (kk === 'name') out.name = v;
    else if (kk === 'phonenumber' || kk === 'phone') out.phone = v;
    else if (kk === 'email' || kk === 'emailaddress') out.email = v;
    else if (kk === 'address') out.address = v;
    else if (kk === 'purpose' || kk === 'reasonforcontact') out.purpose = v;
    else if (kk.includes('hear') || kk.includes('found')) out.source = v;
    else if (kk.includes('propertysize') || kk === 'size') out.propertySize = v;
    else if (kk.includes('propertytype') || kk === 'type') out.propertyType = v;
    else out.extra[k] = v;
  }
  return out;
}

function findClientByPhone(digits) {
  if (!digits || digits.length < 10) return null;
  const formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  for (const term of [formatted, digits, `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`]) {
    const r = jobber(`query { clients(first: 5, searchTerm: ${gqlStr(term)}) { nodes { id name firstName lastName emails { address } phones { number } properties { id address { street city province postalCode } } } } }`);
    const hits = (r.clients?.nodes || []).filter((c) => (c.phones || []).some((p) => normPhone(p.number) === digits));
    if (hits.length) return hits[0];
  }
  return null;
}

// ---------- main ----------
const since = new Date(Date.now() - HOURS * 3600 * 1000);
const startDate = since.toISOString().slice(0, 10);
const endDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

const calls = await cr(`a/${ACCT}/calls.json`, {
  start_date: startDate, end_date: endDate, per_page: '250',
  fields: 'voice_assist_message,zip_code',
});
const vaCalls = (calls.calls || []).filter((c) => c.voice_assist_message?.contents && new Date(c.start_time) >= since);

console.log(`${APPLY ? 'APPLY' : 'DRY-RUN'} — ${vaCalls.length} Voice Assist calls in last ${HOURS}h, ${vaCalls.filter((c) => !processed.has(c.id)).length} unprocessed\n`);

const actions = [];
for (const call of vaCalls) {
  if (processed.has(call.id)) continue;
  const m = mapContents(call.voice_assist_message.contents);
  const phone = normPhone(m.phone) || normPhone(call.customer_phone_number);
  const { firstName, lastName } = splitName(m.name);
  const addr = parseAddress(m.address);
  const plan = { callId: call.id, when: call.start_time, name: m.name, phone, email: m.email || null, addr, purpose: m.purpose, source: m.source, propertySize: m.propertySize, propertyType: m.propertyType, extra: m.extra, steps: [] };

  if (!m.name && !phone) { plan.steps.push({ op: 'skip', why: 'no name and no phone captured' }); actions.push(plan); continue; }

  let client = null;
  try { client = findClientByPhone(phone); } catch (e) { plan.steps.push({ op: 'error', why: 'Jobber search failed: ' + e.message.slice(0, 120) }); }

  const noteLines = [
    `CallRail Voice Assist intake (${call.start_time}):`,
    m.purpose ? `Reason: ${m.purpose}` : null,
    m.source ? `Heard about us: ${m.source}` : null,
    m.propertySize ? `Property size: ${m.propertySize}` : null,
    m.propertyType ? `Property type: ${m.propertyType}` : null,
    ...Object.entries(m.extra).map(([k, v]) => `${k}: ${v}`),
    `Call: https://app.callrail.com/analytics/a/550369647/activity?call_id=${call.id}`,
  ].filter(Boolean);

  if (!client) {
    plan.steps.push({ op: 'clientCreate', firstName, lastName, email: m.email || null, phone });
    if (addr?.street) plan.steps.push({ op: 'property (with create)', address: addr });
    plan.steps.push({ op: 'clientCreateNote', preview: noteLines.slice(0, 3).join(' | ') });
  } else {
    plan.existing = { id: client.id, name: client.name };
    // Name repair policy:
    //  - exact first/last swap → fix
    //  - obvious caller-ID junk (comma-jammed "Last,First", "N/A" fields, business names from CID) → fix
    //  - anything else that merely differs → leave the record alone, note the stated name instead
    const cFirst = (client.firstName || '').trim();
    const cLast = (client.lastName || '').trim();
    const isSwap = firstName && lastName && cFirst.toLowerCase() === lastName.toLowerCase() && cLast.toLowerCase() === firstName.toLowerCase();
    const isJunk = /,/.test(client.name || '') || /^n\/?a$/i.test(cLast) || /^n\/?a$/i.test(cFirst);
    if (firstName && lastName && (isSwap || isJunk)) {
      plan.steps.push({ op: 'clientEdit: fix ' + (isSwap ? 'swapped' : 'caller-ID junk') + ' name', from: `${client.firstName} ${client.lastName}`, to: `${firstName} ${lastName}` });
    } else if (m.name && m.name.trim().toLowerCase() !== (client.name || '').trim().toLowerCase()) {
      noteLines.splice(1, 0, `Caller stated name: ${m.name} (Jobber record: ${client.name} — not auto-changed)`);
    }
    if (m.email && !(client.emails || []).some((e) => e.address?.toLowerCase() === m.email.toLowerCase())) {
      plan.steps.push({ op: 'clientEdit: add email', email: m.email });
    }
    if (addr?.street) {
      const has = (client.properties || []).some((p) => (p.address?.street || '').toLowerCase().startsWith(addr.street.toLowerCase().slice(0, 12)));
      const junk = (client.properties || []).find((p) => !(p.address?.street || '').trim());
      if (!has && junk) plan.steps.push({ op: 'propertyEdit: fill junk CID-only property', propertyId: junk.id, address: addr });
      else if (!has) plan.steps.push({ op: 'propertyCreate', address: addr });
      else plan.steps.push({ op: 'address already present', street: addr.street });
    }
    plan.steps.push({ op: 'clientCreateNote', preview: noteLines.slice(0, 3).join(' | ') });
  }
  actions.push(plan);

  if (APPLY) {
    try {
      let clientId = client?.id;
      for (const s of plan.steps) {
        if (s.op === 'clientCreate') {
          const emailPart = s.email ? `emails: [{ description: MAIN, primary: true, address: ${gqlStr(s.email)} }],` : '';
          const propPart = addr?.street ? `properties: [{ address: { street1: ${gqlStr(addr.street)}, city: ${gqlStr(addr.city)}, province: ${gqlStr(addr.province)}, postalCode: ${gqlStr(addr.postalCode)}, country: "US" } }],` : '';
          const r = jobber(`mutation { clientCreate(input: { firstName: ${gqlStr(s.firstName)}, lastName: ${gqlStr(s.lastName)}, ${emailPart} ${propPart} phones: [{ description: MAIN, primary: true, number: ${gqlStr(phone)} }] }) { client { id } userErrors { message } } }`);
          if (r.clientCreate?.userErrors?.length) throw new Error(JSON.stringify(r.clientCreate.userErrors));
          clientId = r.clientCreate.client.id;
          s.result = 'created ' + clientId;
        } else if (s.op.startsWith('clientEdit: fix ')) {
          const r = jobber(`mutation { clientEdit(clientId: ${gqlStr(clientId)}, input: { firstName: ${gqlStr(firstName)}, lastName: ${gqlStr(lastName)} }) { client { id } userErrors { message } } }`);
          if (r.clientEdit?.userErrors?.length) throw new Error(JSON.stringify(r.clientEdit.userErrors));
          s.result = 'ok';
        } else if (s.op === 'clientEdit: add email') {
          const r = jobber(`mutation { clientEdit(clientId: ${gqlStr(clientId)}, input: { emailsToAdd: [{ description: MAIN, primary: true, address: ${gqlStr(s.email)} }] }) { client { id } userErrors { message } } }`);
          if (r.clientEdit?.userErrors?.length) throw new Error(JSON.stringify(r.clientEdit.userErrors));
          s.result = 'ok';
        } else if (s.op === 'propertyEdit: fill junk CID-only property') {
          const r = jobber(`mutation { propertyEdit(propertyId: ${gqlStr(s.propertyId)}, input: { address: { street1: ${gqlStr(addr.street)}, city: ${gqlStr(addr.city)}, province: ${gqlStr(addr.province)}, postalCode: ${gqlStr(addr.postalCode)} } }) { property { id } userErrors { message } } }`);
          if (r.propertyEdit?.userErrors?.length) throw new Error(JSON.stringify(r.propertyEdit.userErrors));
          s.result = 'ok';
        } else if (s.op === 'propertyCreate') {
          const r = jobber(`mutation { propertyCreate(clientId: ${gqlStr(clientId)}, input: { properties: [{ address: { street1: ${gqlStr(addr.street)}, city: ${gqlStr(addr.city)}, province: ${gqlStr(addr.province)}, postalCode: ${gqlStr(addr.postalCode)}, country: "US" } }] }) { properties { id } userErrors { message } } }`);
          if (r.propertyCreate?.userErrors?.length) throw new Error(JSON.stringify(r.propertyCreate.userErrors));
          s.result = 'ok';
        } else if (s.op === 'clientCreateNote') {
          const r = jobber(`mutation { clientCreateNote(clientId: ${gqlStr(clientId)}, input: { message: ${gqlStr(noteLines.join('\n'))} }) { clientNote { id } userErrors { message } } }`);
          if (r.clientCreateNote?.userErrors?.length) throw new Error(JSON.stringify(r.clientCreateNote.userErrors));
          s.result = 'ok';
        }
      }
      processed.add(call.id);
    } catch (e) {
      plan.error = e.message.slice(0, 300);
    }
  }
}

// ---------- report ----------
for (const a of actions) {
  console.log(`— ${a.when}  ${a.name || '(no name)'}  ${a.phone || ''}${a.existing ? `  [existing: ${a.existing.name}]` : '  [NEW]'}`);
  if (a.email) console.log(`   email: ${a.email}`);
  if (a.addr?.street) console.log(`   address: ${a.addr.street}, ${a.addr.city}, ${a.addr.province} ${a.addr.postalCode}`);
  for (const s of a.steps) console.log(`   -> ${s.op}${s.result ? ' [' + s.result + ']' : ''}${s.why ? ' (' + s.why + ')' : ''}${s.from ? `: ${s.from} => ${s.to}` : ''}`);
  if (a.error) console.log(`   !! ERROR: ${a.error}`);
  console.log('');
}

if (APPLY) {
  state.processed = [...processed].slice(-2000);
  writeFileSync(stateFile, JSON.stringify(state, null, 2));
  appendFileSync(path.join(dataDir, 'sync-log.md'), `\n## ${new Date().toISOString()} — applied ${actions.filter((a) => !a.error && a.steps.some((s) => s.result)).length}/${actions.length} plans\n` + actions.map((a) => `- ${a.name} (${a.callId})${a.error ? ' ERROR: ' + a.error : ''}`).join('\n') + '\n');
}
console.log(`${APPLY ? 'Applied.' : 'Dry-run only — nothing written to Jobber. Re-run with --apply to execute.'}`);
