// Menu changes from Spencer's review, 2026-08-26:
//
//   1. Suspension and Exterior were sitting under ENGINE. They are chassis parts;
//      a coilover is not an engine part. Both move out to a new top-level
//      "Chassis & Suspension".
//   2. The Brands menu listed two brands when the catalogue carries twelve.
//      Translab, Blox, AEM, Pulsar, Turbosmart, Rywire, Vibrant, Honda, Mickey
//      Thompson and Competition Clutch all added.
//
// Note Comp 1 Clutch and Competition Clutch are DIFFERENT brands, both stocked.
//
//   node scripts/apply-menu-brands-chassis.mjs           # dry run
//   node scripts/apply-menu-brands-chassis.mjs --apply
//
// As with the other menu script: menuUpdate replaces the whole tree, so this reads
// the live menu and writes it back with the changes grafted on.
import fs from 'node:fs';
const E={};
for (const line of fs.readFileSync('C:/Agentic-os-got-moles/.env','utf8').split(/\r?\n/)) {
  const eq=line.indexOf('='); if(eq<1||line.trimStart().startsWith('#'))continue;
  const k=line.slice(0,eq).trim(); if(/^[A-Z0-9_]+$/.test(k)) E[k]=line.slice(eq+1).trim();
}
if(E.SHOPIFY_BUILD_STORE!=='syperformance-build.myshopify.com'){console.error('wrong store');process.exit(1);}
const API=`https://${E.SHOPIFY_BUILD_STORE}/admin/api/2025-07/graphql.json`;
const gql=async(q,v={})=>{const r=await fetch(API,{method:'POST',headers:{'X-Shopify-Access-Token':E.SHOPIFY_BUILD_ADMIN_TOKEN,'content-type':'application/json'},body:JSON.stringify({query:q,variables:v})});const j=await r.json(); if(j.errors) throw new Error(JSON.stringify(j.errors)); return j.data;};
const APPLY=process.argv.includes('--apply');

const gid={}; let c=null;
do{const d=await gql(`query($c:String){ collections(first:100, after:$c){ pageInfo{hasNextPage endCursor} nodes{ id handle } } }`,{c});
 for(const n of d.collections.nodes) gid[n.handle]=n.id;
 c=d.collections.pageInfo.hasNextPage?d.collections.pageInfo.endCursor:null;}while(c);

const d=await gql(`{ menus(first:10){ nodes{ id handle title items{ id title type url resourceId tags items{ id title type url resourceId tags items{ id title type url resourceId tags } } } } } }`);
const menu=d.menus.nodes.find(m=>m.handle==='main-menu');
const inp=i=>{const o={id:i.id,title:i.title,type:i.type}; if(i.resourceId)o.resourceId=i.resourceId; else o.url=i.url; if(i.tags&&i.tags.length)o.tags=i.tags; return o;};
const mk=(t,h)=>({title:t,type:'COLLECTION',resourceId:gid[h]});

// 1. pull Suspension + Exterior out of Engine
let moved=[];
const items=menu.items.map(top=>{
  const node=inp(top);
  let kids=(top.items||[]);
  if(top.title==='Engine'){
    const keep=[], take=[];
    for(const k of kids) (['Chassis & Suspension','Exterior','Suspension'].includes(k.title)?take:keep).push(k);
    moved=take.map(k=>k.title);
    kids=keep;
  }
  const built=kids.map(k=>{ const n=inp(k); const g=(k.items||[]).map(inp); if(g.length)n.items=g; return n; });
  if(built.length) node.items=built;
  return node;
});

// 2. new top-level Chassis & Suspension, before Brands
const BRAND_ITEMS=[['Synchro Solutionz','synchro-solutionz'],['Comp 1 Clutch','comp-1-clutch'],['Translab','brand-translab'],['Blox','brand-blox'],['AEM','brand-aem'],['Pulsar','brand-pulsar'],['Turbosmart','brand-turbosmart'],['Rywire','brand-rywire'],['Vibrant','brand-vibrant'],['Honda','brand-honda'],['Mickey Thompson','brand-mickey-thompson'],['Competition Clutch','brand-competition-clutch']];
const chassis={title:'Chassis & Suspension',type:'COLLECTION',resourceId:gid['suspension'],items:[mk('Suspension','suspension'),mk('Exterior','exterior')]};

const out=[];
for(const it of items){
  if(it.title==='Brands'){
    if(!items.some(x=>x.title==='Chassis & Suspension')) out.push(chassis);
    const node={...it};
    const have=new Set((node.items||[]).map(x=>x.title));
    node.items=[...(node.items||[])];
    for(const [t,h] of BRAND_ITEMS){ if(!have.has(t) && gid[h]) node.items.push(mk(t,h)); }
    out.push(node);
  } else out.push(it);
}

console.log('moved out of Engine:', moved.join(', ')||'(none)');
const brandsNode=out.find(x=>x.title==='Brands');
console.log('Brands children:', brandsNode.items.map(x=>x.title).join(', '));
console.log('top level:', out.map(x=>x.title).join(' | '));
if(!APPLY){ console.log('\nDry run.'); process.exit(0); }
const r=await gql(`mutation($id:ID!,$t:String!,$h:String!,$i:[MenuItemUpdateInput!]!){ menuUpdate(id:$id,title:$t,handle:$h,items:$i){ userErrors{field message} } }`,
 {id:menu.id,t:menu.title,h:menu.handle,i:out});
console.log(r.menuUpdate.userErrors.length? 'FAILED '+JSON.stringify(r.menuUpdate.userErrors) : 'menu updated');
