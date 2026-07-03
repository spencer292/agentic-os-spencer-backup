// One-off: trash all rows in Campaigns + Ad Groups DBs so we can re-sync clean.
import fs from 'node:fs';
const mcp=JSON.parse(fs.readFileSync('.mcp.json','utf8'));
const TOKEN=mcp.mcpServers['notion-local'].env.NOTION_API_TOKEN;
const state=JSON.parse(fs.readFileSync('.notion-paid-search-state.json','utf8'));
const NV='2026-03-11';
const h={Authorization:'Bearer '+TOKEN,'Notion-Version':NV,'Content-Type':'application/json'};
async function notion(method,p,body){
  const r=await fetch('https://api.notion.com/v1'+p,{method,headers:h,body:body?JSON.stringify(body):undefined});
  const j=await r.json();if(!r.ok){console.error('FAIL '+method+' '+p+':',JSON.stringify(j,null,2));process.exit(1);}
  return j;
}

for(const dsId of [state.campaignsDataSourceId,state.adGroupsDataSourceId]){
  const j=await notion('POST','/data_sources/'+dsId+'/query',{page_size:100});
  console.log(`DS ${dsId}: ${j.results.length} rows`);
  for(const p of j.results){
    await notion('PATCH','/pages/'+p.id,{in_trash:true});
  }
  console.log('  trashed.');
}
