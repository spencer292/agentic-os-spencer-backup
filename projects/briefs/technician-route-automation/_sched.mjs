import fs from 'node:fs';
const ENV='../../../.env';
const env={};for(const l of fs.readFileSync(ENV,'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
let tok=null;
async function token(){const r=await fetch('https://api.getjobber.com/api/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.JOBBER_CLIENT_ID,client_secret:env.JOBBER_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:env.JOBBER_REFRESH_TOKEN})});const d=await r.json();
 if(d.refresh_token&&d.refresh_token!==env.JOBBER_REFRESH_TOKEN){let t=fs.readFileSync(ENV,'utf8');t=t.replace(/^JOBBER_REFRESH_TOKEN=.*$/m,'JOBBER_REFRESH_TOKEN='+d.refresh_token);fs.writeFileSync(ENV,t);}tok=d.access_token;return tok;}
async function g(q){const t=tok||await token();const r=await fetch('https://api.getjobber.com/api/graphql',{method:'POST',headers:{Authorization:'Bearer '+t,'Content-Type':'application/json','X-JOBBER-GRAPHQL-VERSION':'2025-04-16'},body:JSON.stringify({query:q})});return r.json();}
const d=await g('query { __type(name:"Visit"){ fields{ name type{ kind name ofType{ name } } } } }');
const f=(d.data&&d.data.__type&&d.data.__type.fields)||[];
console.log('Visit fields mentioning time/complete/duration:');
for(const x of f){ if(/time|complet|durat|start|end|actual/i.test(x.name)) console.log('   '+x.name.padEnd(26)+(x.type.name||x.type.ofType&&x.type.ofType.name||x.type.kind)); }
const t2=await g('query { __type(name:"TimeSheetEntry"){ fields{ name type{ kind name ofType{ name } } } } }');
const f2=(t2.data&&t2.data.__type&&t2.data.__type.fields)||[];
if(f2.length){ console.log('\nTimeSheetEntry fields:'); for(const x of f2.slice(0,18)) console.log('   '+x.name.padEnd(24)+(x.type.name||x.type.ofType&&x.type.ofType.name||x.type.kind)); }
