// Got Moles paid search Notion sync.
// Pulls all campaigns + ad groups from Google Ads API (30d metrics) and upserts into Notion DBs.
// Idempotent: matches by Campaign ID / Ad Group ID.
// Run manually for now: `node scripts/got-moles-notion-sync.mjs`
import fs from 'node:fs';import path from 'node:path';

const env={};for(const line of fs.readFileSync(path.resolve('.env'),'utf8').split(/\r?\n/)){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);if(!m)continue;let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);env[m[1]]=v;}
const mcp=JSON.parse(fs.readFileSync('.mcp.json','utf8'));
const NTOKEN=mcp.mcpServers['notion-local'].env.NOTION_API_TOKEN;
const state=JSON.parse(fs.readFileSync('.notion-paid-search-state.json','utf8'));
const NV='2026-03-11';

const V='v23',CUST='1665761172',MCC=env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
const tk=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_ADS_CLIENT_ID,client_secret:env.GOOGLE_ADS_CLIENT_SECRET,refresh_token:env.GOOGLE_ADS_REFRESH_TOKEN,grant_type:'refresh_token'})});
const at=(await tk.json()).access_token;
async function gaql(query){
  const r=await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/googleAds:search`,{method:'POST',headers:{'Authorization':`Bearer ${at}`,'developer-token':env.GOOGLE_ADS_DEVELOPER_TOKEN,'login-customer-id':MCC,'Content-Type':'application/json'},body:JSON.stringify({query})});
  const j=await r.json();if(!r.ok){console.error('GAQL FAIL:',JSON.stringify(j,null,2));process.exit(1);}
  return j.results||[];
}

const nh={Authorization:'Bearer '+NTOKEN,'Notion-Version':NV,'Content-Type':'application/json'};
async function notion(method,p,body){
  const r=await fetch('https://api.notion.com/v1'+p,{method,headers:nh,body:body?JSON.stringify(body):undefined});
  const j=await r.json();if(!r.ok){console.error('NOTION FAIL '+method+' '+p+':',JSON.stringify(j,null,2));process.exit(1);}
  return j;
}

const now=new Date().toISOString();
const STATUS={2:'ENABLED',3:'PAUSED',4:'REMOVED','ENABLED':'ENABLED','PAUSED':'PAUSED','REMOVED':'REMOVED'};
const TYPE_MAP={'SEARCH':'SEARCH','PERFORMANCE_MAX':'PMAX','DISPLAY':'DISPLAY','VIDEO':'SEARCH','SHOPPING':'SEARCH'};

// === 1. Pull all campaigns + 30d metrics (exclude REMOVED) ===
console.log('Fetching campaigns + 30d metrics...');
const camps=await gaql(`
  SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type,
         campaign.bidding_strategy_type, campaign_budget.amount_micros,
         metrics.impressions, metrics.clicks, metrics.ctr, metrics.cost_micros,
         metrics.conversions, metrics.search_impression_share
  FROM campaign
  WHERE segments.date DURING LAST_30_DAYS AND campaign.status != 'REMOVED'
`);
const campRows=new Map(); // by id
for(const r of camps){
  const id=r.campaign.id;
  if(!campRows.has(id)){
    campRows.set(id,{
      id,
      name:r.campaign.name,
      status:STATUS[r.campaign.status]||r.campaign.status,
      type:TYPE_MAP[r.campaign.advertisingChannelType]||r.campaign.advertisingChannelType,
      bidding:r.campaign.biddingStrategyType,
      budget:Number(r.campaignBudget?.amountMicros||0)/1e6,
      impr:0,clicks:0,cost:0,conv:0,is:0,
    });
  }
  const row=campRows.get(id);
  row.impr+=Number(r.metrics?.impressions||0);
  row.clicks+=Number(r.metrics?.clicks||0);
  row.cost+=Number(r.metrics?.costMicros||0)/1e6;
  row.conv+=Number(r.metrics?.conversions||0);
  row.is=Number(r.metrics?.searchImpressionShare||0);
}
// Also include campaigns with no 30d activity (so we still see brand/paused)
const all=await gaql(`
  SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type,
         campaign.bidding_strategy_type, campaign_budget.amount_micros
  FROM campaign
  WHERE campaign.status != 'REMOVED'
`);
for(const r of all){
  if(!campRows.has(r.campaign.id)){
    campRows.set(r.campaign.id,{
      id:r.campaign.id,name:r.campaign.name,status:STATUS[r.campaign.status]||r.campaign.status,
      type:TYPE_MAP[r.campaign.advertisingChannelType]||r.campaign.advertisingChannelType,
      bidding:r.campaign.biddingStrategyType,budget:Number(r.campaignBudget?.amountMicros||0)/1e6,
      impr:0,clicks:0,cost:0,conv:0,is:0,
    });
  }
}
console.log(`  ${campRows.size} campaigns`);

// === 2. Pull all ad groups + 30d metrics ===
console.log('Fetching ad groups + 30d metrics...');
const ags=await gaql(`
  SELECT ad_group.id, ad_group.name, ad_group.status, ad_group.cpc_bid_micros,
         campaign.id,
         metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions
  FROM ad_group
  WHERE segments.date DURING LAST_30_DAYS AND ad_group.status != 'REMOVED' AND campaign.status != 'REMOVED'
`);
const agRows=new Map();
for(const r of ags){
  const id=r.adGroup.id;
  if(!agRows.has(id)){
    agRows.set(id,{
      id,
      name:r.adGroup.name,
      status:STATUS[r.adGroup.status]||r.adGroup.status,
      cpc:Number(r.adGroup.cpcBidMicros||0)/1e6,
      campId:r.campaign.id,
      impr:0,clicks:0,cost:0,conv:0,
    });
  }
  const row=agRows.get(id);
  row.impr+=Number(r.metrics?.impressions||0);
  row.clicks+=Number(r.metrics?.clicks||0);
  row.cost+=Number(r.metrics?.costMicros||0)/1e6;
  row.conv+=Number(r.metrics?.conversions||0);
}
const allAg=await gaql(`SELECT ad_group.id, ad_group.name, ad_group.status, ad_group.cpc_bid_micros, campaign.id FROM ad_group WHERE campaign.id IN (${[...campRows.keys()].join(',')}) AND ad_group.status != 'REMOVED'`);
for(const r of allAg){
  if(!agRows.has(r.adGroup.id)){
    agRows.set(r.adGroup.id,{
      id:r.adGroup.id,name:r.adGroup.name,status:STATUS[r.adGroup.status]||r.adGroup.status,
      cpc:Number(r.adGroup.cpcBidMicros||0)/1e6,campId:r.campaign.id,
      impr:0,clicks:0,cost:0,conv:0,
    });
  }
}

// Ad-group final URL (from primary RSA)
const adsR=await gaql(`SELECT ad_group.id, ad_group_ad.ad.final_urls, ad_group_ad.status FROM ad_group_ad WHERE ad_group_ad.status='ENABLED'`);
for(const r of adsR){
  const ag=agRows.get(r.adGroup.id);
  if(ag&&!ag.finalUrl)ag.finalUrl=(r.adGroupAd.ad.finalUrls||[])[0];
}
console.log(`  ${agRows.size} ad groups`);

// === 3. Query existing Notion rows by IDs ===
console.log('Querying existing Notion rows...');
async function queryAll(dataSourceId){
  const out=[];let cursor;
  do{
    const j=await notion('POST','/data_sources/'+dataSourceId+'/query',{start_cursor:cursor,page_size:100});
    out.push(...j.results);cursor=j.has_more?j.next_cursor:null;
  }while(cursor);
  return out;
}
const existCamps=await queryAll(state.campaignsDataSourceId);
const existAg=await queryAll(state.adGroupsDataSourceId);
const campByGId=new Map(); // gads campaign id -> notion page id
for(const p of existCamps){
  const cid=p.properties['Campaign ID']?.rich_text?.[0]?.plain_text;
  if(cid)campByGId.set(cid,p.id);
}
const agByGId=new Map();
for(const p of existAg){
  const aid=p.properties['Ad Group ID']?.rich_text?.[0]?.plain_text;
  if(aid)agByGId.set(aid,p.id);
}
console.log(`  ${campByGId.size} existing campaign rows, ${agByGId.size} existing ad group rows`);

// === 4. Upsert campaigns ===
console.log('Upserting campaigns...');
const campNotionByGId=new Map(); // gads id -> notion page id (for relation)
for(const c of campRows.values()){
  const ctr=c.impr>0?c.clicks/c.impr:0;
  const cpl=c.conv>0?c.cost/c.conv:0;
  const props={
    Name:{title:[{text:{content:c.name}}]},
    'Campaign ID':{rich_text:[{text:{content:c.id}}]},
    Status:{select:{name:c.status}},
    Type:{select:{name:c.type}},
    'Budget $/day':{number:c.budget},
    'Bidding':c.bidding?{select:{name:c.bidding}}:{select:null},
    'Impr 30d':{number:c.impr},
    'Clicks 30d':{number:c.clicks},
    'CTR 30d %':{number:ctr},
    'Spend $ 30d':{number:Math.round(c.cost*100)/100},
    'Conv 30d':{number:c.conv},
    'CPL $ 30d':{number:Math.round(cpl*100)/100},
    'IS % 30d':{number:c.is},
    'Last Sync':{date:{start:now}},
  };
  let pageId;
  if(campByGId.has(c.id)){
    pageId=campByGId.get(c.id);
    await notion('PATCH','/pages/'+pageId,{properties:props});
    console.log(`  PATCH ${c.name}`);
  }else{
    const created=await notion('POST','/pages',{parent:{type:'data_source_id',data_source_id:state.campaignsDataSourceId},properties:props});
    pageId=created.id;
    console.log(`  CREATE ${c.name}`);
  }
  campNotionByGId.set(c.id,pageId);
}

// === 5. Upsert ad groups (with Campaign relation) ===
console.log('Upserting ad groups...');
const CITY_MAP={'Seattle':'Seattle','Tacoma':'Tacoma','Kent':'Kent','Bellevue':'Bellevue','Kirkland':'Kirkland'};
for(const ag of agRows.values()){
  const camp=campRows.get(ag.campId);
  const isLegacy=ag.name==='T1 - Buyer Intent'&&ag.status==='PAUSED';
  const isBrand=(camp?.name||'').toLowerCase().includes('brand');
  const city=CITY_MAP[ag.name]||(isLegacy?'(legacy)':(isBrand?'(brand)':null));
  const ctr=ag.impr>0?ag.clicks/ag.impr:0;
  const cpl=ag.conv>0?ag.cost/ag.conv:0;
  const props={
    Name:{title:[{text:{content:ag.name}}]},
    'Ad Group ID':{rich_text:[{text:{content:ag.id}}]},
    Campaign:campNotionByGId.has(ag.campId)?{relation:[{id:campNotionByGId.get(ag.campId)}]}:{relation:[]},
    Status:{select:{name:ag.status}},
    City:city?{select:{name:city}}:{select:null},
    'Max CPC $':{number:Math.round(ag.cpc*100)/100},
    'Final URL':ag.finalUrl?{url:ag.finalUrl}:{url:null},
    'Impr 30d':{number:ag.impr},
    'Clicks 30d':{number:ag.clicks},
    'CTR 30d %':{number:ctr},
    'Spend $ 30d':{number:Math.round(ag.cost*100)/100},
    'Conv 30d':{number:ag.conv},
    'CPL $ 30d':{number:Math.round(cpl*100)/100},
    'Last Sync':{date:{start:now}},
  };
  if(agByGId.has(ag.id)){
    await notion('PATCH','/pages/'+agByGId.get(ag.id),{properties:props});
    console.log(`  PATCH ${ag.name} (${camp?.name||'?'})`);
  }else{
    await notion('POST','/pages',{parent:{type:'data_source_id',data_source_id:state.adGroupsDataSourceId},properties:props});
    console.log(`  CREATE ${ag.name} (${camp?.name||'?'})`);
  }
}

console.log('\nSync complete.');
