// Pause the 4 old RSAs that contained free-inspection claims, now superseded.
import fs from 'node:fs';
import path from 'node:path';

const env={};for(const l of fs.readFileSync('.env','utf8').split(/\r?\n/)){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);if(!m)continue;let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);env[m[1]]=v;}
const targetId='1665761172';
const mccId=env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
const VERSION='v23';

const tk=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_ADS_CLIENT_ID,client_secret:env.GOOGLE_ADS_CLIENT_SECRET,refresh_token:env.GOOGLE_ADS_REFRESH_TOKEN,grant_type:'refresh_token'})});
const at=(await tk.json()).access_token;

// adGroupId, adId pairs for the 4 old RSAs (per stage-2 output)
const OLD = [
  { name:'T3', agId:'191443002130', adId:'807929337485' },
  { name:'T2', agId:'194948641886', adId:'807846403384' },
  { name:'Brand', agId:'196657777816', adId:'807751130058' },
  { name:'T1', agId:'201392096612', adId:'807838078729' },
];

const ops = OLD.map(o => ({
  update: {
    resourceName: `customers/${targetId}/adGroupAds/${o.agId}~${o.adId}`,
    status: 'PAUSED',
  },
  updateMask: 'status',
}));

const r = await fetch(`https://googleads.googleapis.com/${VERSION}/customers/${targetId}/adGroupAds:mutate`, {
  method:'POST',
  headers:{'Authorization':`Bearer ${at}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':mccId,'Content-Type':'application/json'},
  body: JSON.stringify({ operations: ops }),
});
const txt = await r.text();
if (!r.ok) { console.error('FAIL:', txt); process.exit(1); }
const j = JSON.parse(txt);
console.log(`✅ Paused ${j.results?.length||0} old ads:`);
for (let i = 0; i < j.results.length; i++) console.log(`   ${OLD[i].name} (ad ${OLD[i].adId}) → PAUSED`);
