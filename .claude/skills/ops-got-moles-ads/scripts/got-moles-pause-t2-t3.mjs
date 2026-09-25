// Pause T2 + T3 campaigns per Roy's direction 2026-05-09.
import fs from 'node:fs';
const env={};for(const l of fs.readFileSync('.env','utf8').split(/\r?\n/)){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);if(!m)continue;let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);env[m[1]]=v;}
const targetId='1665761172';
const tk=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_ADS_CLIENT_ID,client_secret:env.GOOGLE_ADS_CLIENT_SECRET,refresh_token:env.GOOGLE_ADS_REFRESH_TOKEN,grant_type:'refresh_token'})});
const at=(await tk.json()).access_token;

const ops = [
  { update: { resourceName: `customers/${targetId}/campaigns/23816201508`, status: 'PAUSED' }, updateMask: 'status' }, // T2
  { update: { resourceName: `customers/${targetId}/campaigns/23816220669`, status: 'PAUSED' }, updateMask: 'status' }, // T3
];

const r = await fetch(`https://googleads.googleapis.com/v23/customers/${targetId}/campaigns:mutate`, {
  method:'POST',
  headers:{'Authorization':'Bearer '+at,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,'Content-Type':'application/json'},
  body: JSON.stringify({ operations: ops }),
});
const txt = await r.text();
if (!r.ok) { console.error('FAIL:', txt); process.exit(1); }
const j = JSON.parse(txt);
console.log(`✅ Paused ${j.results?.length||0} campaigns:`);
console.log('   - T2 - Problem Aware (Stream 2) (23816201508) → PAUSED');
console.log('   - T3 - Solution Research (Stream 2) (23816220669) → PAUSED');
console.log('\nStill ENABLED: Brand (23819590031, $10/d), T1 - Buyer Intent (23815936218, $30/d)');
