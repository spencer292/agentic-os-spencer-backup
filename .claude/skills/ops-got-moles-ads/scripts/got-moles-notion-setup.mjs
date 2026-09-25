// Got Moles Paid Search Notion setup — creates parent page, Campaigns DB, Ad Groups DB.
// Run once. Saves IDs to .notion-paid-search-state.json for sync script to reuse.
import fs from 'node:fs';

const mcp=JSON.parse(fs.readFileSync('.mcp.json','utf8'));
const TOKEN=mcp.mcpServers['notion-local'].env.NOTION_API_TOKEN;
const PARENT_PAGE='32d3d42c-4a9c-8194-a491-f1de76439ecd'; // Got Moles Website Rebuild
const NV='2026-03-11';
const STATE_FILE='.notion-paid-search-state.json';

const h={Authorization:'Bearer '+TOKEN,'Notion-Version':NV,'Content-Type':'application/json'};
async function notion(method,path,body){
  const r=await fetch('https://api.notion.com/v1'+path,{method,headers:h,body:body?JSON.stringify(body):undefined});
  const j=await r.json();
  if(!r.ok){console.error('FAIL '+method+' '+path+':',JSON.stringify(j,null,2));process.exit(1);}
  return j;
}

let state={};
try{state=JSON.parse(fs.readFileSync(STATE_FILE,'utf8'));}catch{}

// === 1. Create parent page (skip if exists) ===
if(!state.parentPageId){
  console.log('1. Creating parent page...');
  const parentPage=await notion('POST','/pages',{
    parent:{page_id:PARENT_PAGE},
    properties:{title:[{text:{content:'Got Moles — Paid Search Tracking'}}]},
  });
  state.parentPageId=parentPage.id;
  fs.writeFileSync(STATE_FILE,JSON.stringify(state,null,2));
}
console.log('   parent page:',state.parentPageId);
// override: the first run created 3613d42c-... before crashing
if(!state.parentPageId)state.parentPageId='3613d42c-4a9c-8151-99bc-ee3a141e6765';

// === 2. Create Campaigns DB ===
console.log('2. Creating Campaigns DB...');
const campaignsDb=await notion('POST','/databases',{
  parent:{type:'page_id',page_id:state.parentPageId},
  title:[{text:{content:'Campaigns'}}],
  properties:{Name:{title:{}}},
  initial_data_source:{properties:{Name:{title:{}}}},
});
state.campaignsDbId=campaignsDb.id;
state.campaignsDataSourceId=campaignsDb.data_sources?.[0]?.id;
console.log('   db:',state.campaignsDbId,'data_source:',state.campaignsDataSourceId);

// PATCH the data source to add real schema
console.log('   patching Campaigns schema...');
await notion('PATCH','/data_sources/'+state.campaignsDataSourceId,{
  properties:{
    Name:{title:{}},
    'Campaign ID':{rich_text:{}},
    Status:{select:{options:[{name:'ENABLED',color:'green'},{name:'PAUSED',color:'gray'},{name:'REMOVED',color:'red'}]}},
    Type:{select:{options:[{name:'SEARCH',color:'blue'},{name:'PMAX',color:'purple'},{name:'DISPLAY',color:'yellow'}]}},
    'Budget $/day':{number:{format:'dollar'}},
    'Bidding':{select:{options:[{name:'MANUAL_CPC'},{name:'MAXIMIZE_CONVERSIONS'},{name:'MAXIMIZE_CONVERSION_VALUE'},{name:'TARGET_CPA'},{name:'TARGET_ROAS'}]}},
    'Impr 30d':{number:{}},
    'Clicks 30d':{number:{}},
    'CTR 30d %':{number:{format:'percent'}},
    'Spend $ 30d':{number:{format:'dollar'}},
    'Conv 30d':{number:{}},
    'CPL $ 30d':{number:{format:'dollar'}},
    'IS % 30d':{number:{format:'percent'}},
    'Last Sync':{date:{}},
    Notes:{rich_text:{}},
  },
});

// === 3. Create Ad Groups DB ===
console.log('3. Creating Ad Groups DB...');
const adGroupsDb=await notion('POST','/databases',{
  parent:{type:'page_id',page_id:state.parentPageId},
  title:[{text:{content:'Ad Groups'}}],
  properties:{Name:{title:{}}},
  initial_data_source:{properties:{Name:{title:{}}}},
});
state.adGroupsDbId=adGroupsDb.id;
state.adGroupsDataSourceId=adGroupsDb.data_sources?.[0]?.id;
console.log('   db:',state.adGroupsDbId,'data_source:',state.adGroupsDataSourceId);

console.log('   patching Ad Groups schema...');
await notion('PATCH','/data_sources/'+state.adGroupsDataSourceId,{
  properties:{
    Name:{title:{}},
    'Ad Group ID':{rich_text:{}},
    Campaign:{relation:{data_source_id:state.campaignsDataSourceId,type:'single_property',single_property:{}}},
    Status:{select:{options:[{name:'ENABLED',color:'green'},{name:'PAUSED',color:'gray'},{name:'REMOVED',color:'red'}]}},
    City:{select:{options:[{name:'Seattle'},{name:'Tacoma'},{name:'Kent'},{name:'Bellevue'},{name:'Kirkland'},{name:'(legacy)'},{name:'(brand)'}]}},
    'Max CPC $':{number:{format:'dollar'}},
    'Final URL':{url:{}},
    'Impr 30d':{number:{}},
    'Clicks 30d':{number:{}},
    'CTR 30d %':{number:{format:'percent'}},
    'Spend $ 30d':{number:{format:'dollar'}},
    'Conv 30d':{number:{}},
    'CPL $ 30d':{number:{format:'dollar'}},
    'Last Sync':{date:{}},
  },
});

fs.writeFileSync(STATE_FILE,JSON.stringify(state,null,2));
console.log('\nSaved state to '+STATE_FILE);
console.log(JSON.stringify(state,null,2));
