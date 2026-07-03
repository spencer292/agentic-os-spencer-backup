// Create the "2026-05-15 T1 Restructure" readme page under the Paid Search Tracking parent.
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

const p=(text,bold=false)=>({type:'paragraph',paragraph:{rich_text:[{type:'text',text:{content:text},annotations:bold?{bold:true}:{}}]}});
const h2=t=>({type:'heading_2',heading_2:{rich_text:[{type:'text',text:{content:t}}]}});
const h3=t=>({type:'heading_3',heading_3:{rich_text:[{type:'text',text:{content:t}}]}});
const bullet=t=>({type:'bulleted_list_item',bulleted_list_item:{rich_text:[{type:'text',text:{content:t}}]}});
const callout=(t,icon='⚠️')=>({type:'callout',callout:{rich_text:[{type:'text',text:{content:t}}],icon:{type:'emoji',emoji:icon},color:'yellow_background'}});
const divider=()=>({type:'divider',divider:{}});
const linked=(dsId,title)=>({type:'link_to_page',link_to_page:{type:'database_id',database_id:dsId}}); // unused

const page=await notion('POST','/pages',{
  parent:{type:'page_id',page_id:state.parentPageId},
  properties:{title:[{text:{content:'T1 Restructure — 2026-05-15 (5-city ad-group rebuild)'}}]},
  children:[
    callout('T1 Buyer-Intent restructured today. 5 city-specific ad groups (Seattle/Tacoma/Kent/Bellevue/Kirkland) replace the single legacy ad group. Live on Google Ads now. Live tracking via the two DBs in this parent page.','🟢'),

    h2('Summary'),
    p('On 2026-05-15 T1 was restructured from 1 ad group → 5 city-specific ad groups, each with 1 RSA pointed at its own /lp/{city}/ landing page. Budget raised $30 → $150/day. Locations narrowed from 88 WA cities → 5 cities + 15mi radius. New ad schedule + mobile +20%. 19 net-new campaign-level negatives added.'),

    h2('Why we restructured'),
    bullet('30d performance pre-rebuild: $334 spend / 2.5 conv = $134 CPA (13× the $10.28 historical vendor floor)'),
    bullet('Impression Share was 9.99% — Google was barely showing the ads'),
    bullet('66% of T1 spend was going to one phrase keyword (ground moles removal) with 0.5 conv'),
    bullet('The only converting city keyword was mole removal kirkland — validated the city-exact thesis'),
    bullet('13 of top 20 search terms were informational junk (how-to / DIY / repellents / out-of-area)'),

    h2('What changed (settings)'),
    bullet('Budget: $30 → $150/day'),
    bullet('Bidding: Manual CPC (retained — auto-bid blocked until ≥30 conv/30d)'),
    bullet('Locations: removed 88 city criteria, added 5 proximity targets (Seattle/Tacoma/Kent/Bellevue/Kirkland + 15mi), excluded Oregon + Idaho'),
    bullet('Ad schedule: Mon-Fri 7am-8pm, Sat-Sun 8am-6pm (was: 24/7)'),
    bullet('Mobile bid modifier: +20% (was: 0%)'),
    bullet('Networks: Search only, Search Partners + Display already off (no change)'),

    h2('What changed (structure)'),
    bullet('1 ad group (legacy) → 5 ad groups (one per city), legacy paused as fallback'),
    bullet('All city ad groups have 3 keywords: [mole removal {city}] exact, [mole control {city}] exact, "moles in yard {city}" phrase'),
    bullet('Each ad group has 1 RSA with 15 headlines (all ≤30 chars) + 4 descriptions (all ≤90 chars)'),
    bullet('Per-city CPC: Seattle/Bellevue/Kirkland $14, Tacoma $12, Kent $10'),
    bullet('Per-city Final URL: /lp/{city}/ on got-moles.com (Roy built these LPs today, all audited clean)'),
    bullet('Negatives: 167 → 186 (+19 new, 17 dedupe-skipped from the 36-item list)'),

    h2('Live tracking'),
    p('The two databases in this parent page are synced from Google Ads API. Run `node scripts/got-moles-notion-sync.mjs` to refresh.'),
    bullet('Campaigns DB — 4 active campaigns (T1, T2, T3, Brand) with 30d perf'),
    bullet('Ad Groups DB — 9 ad groups linked back to campaigns'),

    h2('Pricing mechanic on the LPs + ad copy'),
    callout('$150 deposit upfront → 4-5 week trapping → if no moles caught, customer pays nothing more (total = $150). If caught, $300 additional charged (total = $450). The "no catch, no charge" risk reversal is the lead angle. (Confirmed by Roy 2026-05-15.)','💰'),

    h2('Posture A reminder'),
    p('All RSA copy + LP copy is silent on trap mechanism. No body-gripping / scissor / harpoon / spear / spike / kill / lethal language anywhere. "Trapping" the generic verb is fine. Approved trust signals: chemical-free, professional, mechanical, kid/pet-safe, same-day call-back, 15+ years, 5,000 yards, 219+ reviews, veteran-owned.'),

    h2('What still needs the Google Ads UI'),
    bullet('Verify First Time Phone Call = Primary in Tools → Conversions (API does not expose the "Include in Conversions" toggle cleanly)'),
    bullet('Confirm CallRail → Google Ads integration shows Active'),
    bullet('Watch the 5 RSAs move from "Under review" → "Eligible" over the next ~few hours'),

    h2('Phase 2 (after T1 City Exact proves)'),
    bullet('Week 3: add Urgent Intent ad group with "near me" keywords (single RSA, location-targeted)'),
    bullet('Week 3: build /lp/enumclaw/ + add 6th ad group (Enumclaw is the confirmed GBP with 27 5-star reviews)'),
    bullet('Week 4: Damage-Focused ad group if T2 keyword volume justifies'),
    bullet('Week 4: Customer Match upload if unlocked'),
    bullet('Week 5: Phase 2 city LPs (Renton, Issaquah, Puyallup)'),

    h2('Source of truth (local)'),
    bullet('Build spec: projects/briefs/got-moles-paid-search/2026-05-15_google-ads-5-ad-group-build-spec.md'),
    bullet('Project brief: projects/briefs/got-moles-paid-search/brief.md (LP URL routing map updated 2026-05-15)'),
    bullet('Sync script: scripts/got-moles-notion-sync.mjs'),
    bullet('Phase scripts: scripts/got-moles-t1-restructure-phase{1..4}*.mjs'),
  ],
});

console.log('Created readme page:',page.id);
console.log('URL fragment:',page.url||page.id);
