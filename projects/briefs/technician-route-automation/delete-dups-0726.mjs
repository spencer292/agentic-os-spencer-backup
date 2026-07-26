#!/usr/bin/env node
// Duplicate-visit cleanup, week of 7/27. Spencer-approved 2026-07-26.
// Keeper chosen by TERRITORY-GRID DAY (grid day for the zip wins), then:
//   non-working tech (Tavis) loses > Spencer-on-non-peninsula loses > lowest visit id wins.
// Usage: node delete-dups-0726.mjs dry|live
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env={};for(const l of fs.readFileSync(path.resolve(__dirname,'../../../.env'),'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
const mode=process.argv[2]; if(!['dry','live'].includes(mode)){console.log('Usage: dry|live');process.exit(1);}
const W=JSON.parse(fs.readFileSync(path.join(__dirname,'week-visits-0727.json'),'utf8'));

// visitNum -> reason
const DELETE={
 '2262158754':'5139 Aly Mendez — exact dup (both wed, grid=thu; kept 2254047380)',
 '1912213813':'5947 Neil Kanungo — TAVIS not working (kept Cammeron 2260866715)',
 '2264419945':'7199 Glen Smith — exact dup (kept 2256731302)',
 '2264828649':'7365 Paul Hwang — exact dup (kept 2264814767)',
 '2262944954':'7697 Jennifer Cramer — exact dup (kept 2262915173)',
 '2063540939':'7744 GC Bellefield — TAVIS not working (kept Cory 2259670489)',
 '2086100541':'7788 Bonnie Mccracken — TAVIS not working (kept Cammeron 2260306106)',
 '2259347293':'8060 Blake Diers — 00:00 regeneration (kept original 2231424519)',
 '2261779855':'8072 Prologis TMC — 00:00 regeneration (kept original 2232222180)',
 '2240794182':'8113 Max Ye — GRID FLIP: 7/28 tue wrong, zip 98006=thu (kept 7/30 2263156198)',
 '2248825799':'8155 Bac Walker — GRID FLIP: 7/30 thu wrong, zip 98032=wed (kept 7/29 2261677657)',
 '2251433823':'8163 Ryan Jaffe — Spencer dup, non-peninsula (kept Cammeron 2260186568)',
 '2262205860':'8170 Ross Luo — exact dup (kept 2253064121)',
 '2259459296':'8190 Kevin Bohnert — GRID FLIP: 7/30 thu wrong, zip 98166=tue (kept 7/28 2260388791)',
 '2261970930':'8200 GenCare — 00:00 regeneration (kept original 2259576110)',
 '2263134436':'8202 Amy Collins — 1 of 3 (kept 2259592941)',
 '2263135628':'8202 Amy Collins — 2 of 3 (kept 2259592941)',
 '2262025055':'8214 Joseph Lee — 7/29 wed wrong, zip 98059=thu (kept 7/30 2261163059)',
};
// resolve encoded ids from the audited snapshot
const idx={};
for(const [jn,vs] of Object.entries(W)) for(const v of vs){
  let n; try{n=Buffer.from(v.id,'base64').toString('utf8').split('/').pop()}catch{}
  if(n) idx[n]={enc:v.id, job:jn, title:v.title, startAt:v.startAt, complete:v.isComplete};
}
const targets=[], missing=[];
for(const [n,why] of Object.entries(DELETE)){
  if(!idx[n]) { missing.push(n); continue; }
  if(idx[n].complete){ missing.push(n+' (COMPLETE — refusing)'); continue; }
  targets.push({num:n, ...idx[n], why});
}
console.log(`Resolved ${targets.length}/18 visits to delete${missing.length?`; UNRESOLVED: ${missing.join(', ')}`:''}\n`);
for(const t of targets) console.log(`  del ${t.num}  ${new Date(t.startAt).toLocaleString('sv-SE',{timeZone:'America/Los_Angeles'}).slice(0,16)}  ${t.why}`);
if(targets.length!==18){ console.error('\n!! expected 18 — ABORT'); process.exit(1); }
fs.writeFileSync(path.join(__dirname,'deleted-visits-0726.json'),JSON.stringify(targets,null,1));
if(mode==='dry'){ console.log('\nDRY — nothing deleted. Snapshot of targets saved.'); process.exit(0); }

const tr=await(await fetch('https://api.getjobber.com/api/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
 body:new URLSearchParams({client_id:env.JOBBER_CLIENT_ID,client_secret:env.JOBBER_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:env.JOBBER_REFRESH_TOKEN})})).json();
const tok=tr.access_token;
async function gql(query,variables){const r=await fetch('https://api.getjobber.com/api/graphql',{method:'POST',
 headers:{Authorization:`Bearer ${tok}`,'Content-Type':'application/json','X-JOBBER-GRAPHQL-VERSION':'2023-11-15'},body:JSON.stringify({query,variables})});return r.json();}
let ok=0, fail=0;
for(const t of targets){
  const j=await gql(`mutation($ids:[EncodedId!]!){ visitDelete(visitIds:$ids){ userErrors{ message } } }`,{ids:[t.enc]});
  const errs=j.errors||j.data?.visitDelete?.userErrors||[];
  if(errs.length){ fail++; console.log(`  FAIL ${t.num}: ${JSON.stringify(errs).slice(0,160)}`); }
  else { ok++; console.log(`  deleted ${t.num}  (${t.job})`); }
  await new Promise(r=>setTimeout(r,450));
}
console.log(`\nDONE — deleted ${ok}, failed ${fail} of ${targets.length}`);
