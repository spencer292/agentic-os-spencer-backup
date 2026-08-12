import fs from 'node:fs';
const ENV='../../../.env';
const env={};for(const l of fs.readFileSync(ENV,'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
let tok=null;
async function token(){const r=await fetch('https://api.getjobber.com/api/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.JOBBER_CLIENT_ID,client_secret:env.JOBBER_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:env.JOBBER_REFRESH_TOKEN})});const d=await r.json();
 if(d.refresh_token&&d.refresh_token!==env.JOBBER_REFRESH_TOKEN){let t=fs.readFileSync(ENV,'utf8');t=t.replace(/^JOBBER_REFRESH_TOKEN=.*$/m,'JOBBER_REFRESH_TOKEN='+d.refresh_token);fs.writeFileSync(ENV,t);}tok=d.access_token;return tok;}
async function g(q){const t=tok||await token();const r=await fetch('https://api.getjobber.com/api/graphql',{method:'POST',headers:{Authorization:'Bearer '+t,'Content-Type':'application/json','X-JOBBER-GRAPHQL-VERSION':'2025-04-16'},body:JSON.stringify({query:q})});return r.json();}
const q = 'query { A: __type(name:"VisitEditAssignedUsersInput"){ inputFields{ name type{ kind name ofType{ kind name enumValues{name} } enumValues{name} } } } B: __type(name:"VisitEditAttributes"){ inputFields{ name type{ kind name ofType{ kind name enumValues{name} } enumValues{name} } } } }';
const d = await g(q);
for (const key of ['A','B']) {
  const t = d.data ? d.data[key] : null;
  console.log('=== ' + (key==='A' ? 'VisitEditAssignedUsersInput' : 'VisitEditAttributes') + ' ===');
  if (!t) { console.log('  (not found)', JSON.stringify(d.errors || '').slice(0,200)); continue; }
  for (const f of (t.inputFields || [])) {
    const ty = f.type; const nm = ty.name || (ty.ofType && ty.ofType.name) || ty.kind;
    const ev = ((ty.enumValues) || (ty.ofType && ty.ofType.enumValues) || []).map(e => e.name);
    console.log('   ', f.name, ':', nm, ev.length ? '[' + ev.join(' | ') + ']' : '');
  }
}
