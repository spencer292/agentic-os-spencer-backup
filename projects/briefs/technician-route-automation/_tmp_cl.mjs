import fs from 'node:fs';
const ENV='../../../.env';
const env={};for(const l of fs.readFileSync(ENV,'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
let tok=null;
async function token(){const r=await fetch('https://api.getjobber.com/api/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.JOBBER_CLIENT_ID,client_secret:env.JOBBER_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:env.JOBBER_REFRESH_TOKEN})});const d=await r.json();
 if(d.refresh_token&&d.refresh_token!==env.JOBBER_REFRESH_TOKEN){let t=fs.readFileSync(ENV,'utf8');t=t.replace(/^JOBBER_REFRESH_TOKEN=.*$/m,'JOBBER_REFRESH_TOKEN='+d.refresh_token);fs.writeFileSync(ENV,t);}tok=d.access_token;return tok;}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function g(q,v,a=0){const t=tok||await token();const r=await fetch('https://api.getjobber.com/api/graphql',{method:'POST',headers:{Authorization:'Bearer '+t,'Content-Type':'application/json','X-JOBBER-GRAPHQL-VERSION':'2025-04-16'},body:JSON.stringify({query:q,variables:v})});
 const d=await r.json().catch(()=>({}));if(d.errors&&JSON.stringify(d.errors).includes('THROTTLED')&&a<8){await sleep(2500*2**a);return g(q,v,a+1);}return d;}
for (const term of ['Argus','Velia','Nicola','Veila','Argus Ranch']) {
  const d = await g(`query($s:String){ clients(first:10, searchTerm:$s){ nodes{ id name isArchived
     properties{ address{ street city postalCode } } } } }`, {s:term});
  const ns = d.data?.clients?.nodes || [];
  console.log(`\n"${term}" -> ${ns.length} match(es)` + (d.errors?'  ERR '+JSON.stringify(d.errors).slice(0,120):''));
  for (const c of ns) {
    const p = c.properties?.[0]?.address || c.properties?.address;
    console.log('   ', c.name.padEnd(28), c.isArchived?'[ARCHIVED]':'', p? p.street+', '+p.city+' '+p.postalCode : '(no property)');
  }
  await sleep(400);
}
