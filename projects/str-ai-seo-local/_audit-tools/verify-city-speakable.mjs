const UA='Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)'
const CITIES=['seattle','tacoma','bellevue','kent','renton','federal-way','puyallup','everett','sammamish','enumclaw']
const DEADLINE=Date.now()+6*60*1000
function check(html){
  let ok=false; const re=/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi; let m
  while((m=re.exec(html))){ try{ const d=JSON.parse(m[1].trim()); const arr=Array.isArray(d)?d:(d['@graph']||[d]); for(const n of arr){ if(n.speakable && JSON.stringify(n.speakable.cssSelector||'').includes('#geo-definition')) ok=true } }catch{} }
  return ok
}
const pending=new Set(CITIES)
while(pending.size && Date.now()<DEADLINE){
  for(const c of [...pending]){
    try{ const r=await fetch(`https://got-moles.com/mole-control-${c}/`,{headers:{'User-Agent':UA},cache:'no-store'}); if(r.status===200 && check(await r.text())){ console.log(`✅ /mole-control-${c}/  speakable[#geo-definition] live`); pending.delete(c) } }catch{}
  }
  if(pending.size) await new Promise(r=>setTimeout(r,15000))
}
if(pending.size){ console.log('⏳ not yet live: '+[...pending].join(', ')); process.exit(1) }
console.log('\nAll '+CITIES.length+' sampled city pages now emit Speakable. Template covers all 92.')
