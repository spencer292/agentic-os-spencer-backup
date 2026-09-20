// Phase 4: Append 37 new campaign-level negative keywords to T1.
// Skip any that already exist.
import fs from 'node:fs';import path from 'node:path';
const env={};for(const line of fs.readFileSync(path.resolve('.env'),'utf8').split(/\r?\n/)){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);if(!m)continue;let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);env[m[1]]=v;}
const V='v23',CUST='1665761172',MCC=env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,CAMP='23815936218';
const tk=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_ADS_CLIENT_ID,client_secret:env.GOOGLE_ADS_CLIENT_SECRET,refresh_token:env.GOOGLE_ADS_REFRESH_TOKEN,grant_type:'refresh_token'})});
const at=(await tk.json()).access_token;

const NEW=['poison','repellent','sonic','DIY','do it yourself','how to trap','mole trap','mole bait','job','jobs','salary','career','hiring','free','cheap','low cost','discount','coupon','mole as pet','pet mole','skin mole','mole removal dermatology','apple cider vinegar','castor oil','moth balls','ultrasonic','amazon','walmart','home depot','lowes','how to get rid of moles yourself','best mole trap','mole trap reviews','mole poison','mole repellent','sonic mole repeller'];

// Get existing negatives to skip duplicates
const r=await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/googleAds:search`,{method:'POST',headers:{'Authorization':`Bearer ${at}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':MCC,'Content-Type':'application/json'},body:JSON.stringify({query:`SELECT campaign_criterion.keyword.text, campaign_criterion.keyword.match_type FROM campaign_criterion WHERE campaign.id=${CAMP} AND campaign_criterion.negative=TRUE AND campaign_criterion.type='KEYWORD'`})});
const existing=new Set();
((await r.json()).results||[]).forEach(x=>existing.add(`${x.campaignCriterion.keyword.text.toLowerCase()}|${x.campaignCriterion.keyword.matchType}`));
console.log(`Existing negatives: ${existing.size}`);

const toAdd=NEW.filter(kw=>!existing.has(`${kw.toLowerCase()}|BROAD`));
console.log(`After dedupe: ${toAdd.length} of ${NEW.length} new`);

if(toAdd.length===0){console.log('Nothing to add.');process.exit(0);}

const ops=toAdd.map(kw=>({create:{campaign:`customers/${CUST}/campaigns/${CAMP}`,negative:true,keyword:{text:kw,matchType:'BROAD'}}}));
const r2=await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/campaignCriteria:mutate`,{method:'POST',headers:{'Authorization':`Bearer ${at}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':MCC,'Content-Type':'application/json'},body:JSON.stringify({operations:ops})});
const j2=await r2.json();
if(!r2.ok){console.error('FAIL:',JSON.stringify(j2,null,2));process.exit(1);}
console.log(`Added ${j2.results.length} negatives`);
console.log('Skipped (already present):',NEW.filter(kw=>existing.has(`${kw.toLowerCase()}|BROAD`)));
