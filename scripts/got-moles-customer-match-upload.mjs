// Got Moles Customer Match upload.
// Reads a CSV (first column = email, header row OK), normalises, SHA256-hashes,
// creates a user list (or reuses one by ID), creates an offline user-data job,
// uploads in batches of 10,000, runs the job, polls until done.
//
// Usage:
//   node scripts/got-moles-customer-match-upload.mjs --csv path/to/emails.csv --name "Got Moles Customers 2026-05-15"
//   node scripts/got-moles-customer-match-upload.mjs --csv path/to/emails.csv --list-id 9387400828   (reuse existing list)
//
// Required:
//   --csv     path to CSV (first column = email, or column header "email"/"Email")
// One of:
//   --name        new user list name (creates a list)
//   --list-id     existing user list id (appends to it)

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const env={};for(const line of fs.readFileSync(path.resolve('.env'),'utf8').split(/\r?\n/)){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);if(!m)continue;let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);env[m[1]]=v;}

const V='v23',CUST='1665761172',MCC=env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
const args={};
for(let i=2;i<process.argv.length;i+=2){args[process.argv[i].replace(/^--/,'')]=process.argv[i+1];}
if(!args.csv){console.error('Missing --csv path');process.exit(1);}
if(!args.name&&!args['list-id']){console.error('Need --name "List Name" (creates) or --list-id <id> (reuses)');process.exit(1);}

const tk=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_ADS_CLIENT_ID,client_secret:env.GOOGLE_ADS_CLIENT_SECRET,refresh_token:env.GOOGLE_ADS_REFRESH_TOKEN,grant_type:'refresh_token'})});
const at=(await tk.json()).access_token;
async function api(endpoint,body,method='POST'){
  const r=await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/${endpoint}`,{method,headers:{'Authorization':`Bearer ${at}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':MCC,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
  const j=await r.json();if(!r.ok){console.error(`API FAIL ${endpoint}:`,JSON.stringify(j,null,2));process.exit(1);}
  return j;
}

// 1. Parse CSV
console.log(`Reading ${args.csv}...`);
const raw=fs.readFileSync(path.resolve(args.csv),'utf8').split(/\r?\n/).filter(l=>l.trim());
if(!raw.length){console.error('CSV empty');process.exit(1);}
let startIdx=0;
const first=raw[0].split(',')[0].trim().toLowerCase();
if(['email','e-mail','emailaddress','email_address'].includes(first.replace(/['"]/g,''))){startIdx=1;console.log('  Header row detected: skipping.');}
const rawEmails=raw.slice(startIdx).map(l=>l.split(',')[0].trim().replace(/^["']|["']$/g,''));
console.log(`  ${rawEmails.length} raw rows`);

// 2. Normalise + dedupe + hash
function normalizeEmail(e){
  e=e.trim().toLowerCase();
  if(!e.includes('@'))return null;
  const [user,domain]=e.split('@');
  let normUser=user;
  if(domain==='gmail.com'||domain==='googlemail.com'){
    normUser=user.replace(/\./g,'').split('+')[0];
  }
  return `${normUser}@${domain}`;
}
function sha256(s){return crypto.createHash('sha256').update(s,'utf8').digest('hex');}

const seen=new Set();
const invalid=[];
const hashes=[];
for(const raw of rawEmails){
  const norm=normalizeEmail(raw);
  if(!norm){invalid.push(raw);continue;}
  if(seen.has(norm))continue;
  seen.add(norm);
  hashes.push({hashedEmail:sha256(norm)});
}
console.log(`  ${hashes.length} valid+deduped emails, ${invalid.length} invalid (no @)`);
if(invalid.length<=5)console.log('  invalid samples:',invalid.slice(0,5));
if(hashes.length<100){console.error('FATAL: <100 valid emails — Google Ads minimum is 100. Abort.');process.exit(1);}

// 3. Get or create user list
let userListResource;
if(args['list-id']){
  userListResource=`customers/${CUST}/userLists/${args['list-id']}`;
  console.log(`Reusing list: ${userListResource}`);
}else{
  console.log(`Creating user list: "${args.name}"...`);
  const j=await api('userLists:mutate',{
    operations:[{create:{
      name:args.name,
      description:`Customer Match upload ${new Date().toISOString().slice(0,10)}. ${hashes.length} hashed emails.`,
      membershipLifeSpan:540,
      crmBasedUserList:{uploadKeyType:'CONTACT_INFO',dataSourceType:'FIRST_PARTY'},
    }}],
  });
  userListResource=j.results[0].resourceName;
  console.log(`  Created: ${userListResource}`);
}

// 4. Create offline user data job
console.log('Creating offline user data job...');
const jobJ=await api('offlineUserDataJobs:create',{
  job:{type:'CUSTOMER_MATCH_USER_LIST',customerMatchUserListMetadata:{userList:userListResource},
    consent:{adUserData:'GRANTED',adPersonalization:'GRANTED'},
  },
});
const jobResource=jobJ.resourceName;
console.log(`  Job: ${jobResource}`);

// 5. Add operations in batches of 10,000
const BATCH=10000;
console.log(`Adding ${hashes.length} hashed emails in batches of ${BATCH}...`);
for(let i=0;i<hashes.length;i+=BATCH){
  const slice=hashes.slice(i,i+BATCH);
  const ops=slice.map(h=>({create:{userIdentifiers:[{hashedEmail:h.hashedEmail}]}}));
  await fetch(`https://googleads.googleapis.com/${V}/${jobResource}:addOperations`,{
    method:'POST',
    headers:{'Authorization':`Bearer ${at}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':MCC,'Content-Type':'application/json'},
    body:JSON.stringify({operations:ops,enablePartialFailure:true}),
  }).then(async r=>{if(!r.ok){console.error('addOps FAIL:',await r.text());process.exit(1);}});
  console.log(`  batch ${Math.floor(i/BATCH)+1}: ${slice.length} ops`);
}

// 6. Run the job
console.log('Running job...');
await fetch(`https://googleads.googleapis.com/${V}/${jobResource}:run`,{
  method:'POST',
  headers:{'Authorization':`Bearer ${at}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':MCC,'Content-Type':'application/json'},
  body:JSON.stringify({}),
}).then(async r=>{if(!r.ok){console.error('run FAIL:',await r.text());process.exit(1);}});

// 7. Poll status
console.log('Polling job status...');
for(let attempt=0;attempt<20;attempt++){
  await new Promise(r=>setTimeout(r,5000));
  const sr=await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/googleAds:search`,{method:'POST',headers:{'Authorization':`Bearer ${at}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':MCC,'Content-Type':'application/json'},body:JSON.stringify({query:`SELECT offline_user_data_job.status, offline_user_data_job.failure_reason, offline_user_data_job.operation_metadata.matched_user_count_range_min, offline_user_data_job.operation_metadata.matched_user_count_range_max FROM offline_user_data_job WHERE offline_user_data_job.resource_name='${jobResource}'`})});
  const sj=await sr.json();
  const job=sj.results?.[0]?.offlineUserDataJob;
  if(!job){console.log(`  attempt ${attempt+1}: no result yet`);continue;}
  console.log(`  attempt ${attempt+1}: ${job.status} reason=${job.failureReason||'-'} matchRange=${job.operationMetadata?.matchedUserCountRangeMin||'?'}-${job.operationMetadata?.matchedUserCountRangeMax||'?'}`);
  if(job.status==='SUCCESS'){console.log('\nDone. Audience will activate (be eligible to target) within ~24-48 hours.');break;}
  if(job.status==='FAILED'){console.error('Job FAILED:',job.failureReason);process.exit(1);}
}

console.log('\nList resource:',userListResource);
