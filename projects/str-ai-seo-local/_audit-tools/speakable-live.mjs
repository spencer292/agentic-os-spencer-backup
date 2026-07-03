const UA = 'Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)'
const PAGES = [
  '/mole-control-seattle/', '/mole-control-tacoma/', '/mole-control-bellevue/', // cities
  '/services/total-mole-control-program/',                                       // contrast: service
  '/how-deep-do-moles-dig/',                                                      // contrast: blog
]
function blocks(html){
  const out=[]; const re=/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi; let m
  while((m=re.exec(html))){ try{ const d=JSON.parse(m[1].trim()); const arr=Array.isArray(d)?d:(d['@graph']||[d]); for(const n of arr){ out.push({type:Array.isArray(n['@type'])?n['@type'].join('+'):n['@type'], speakable: !!n.speakable, sel: n.speakable?.cssSelector||null}) } }catch{ out.push({type:'PARSE_ERR'}) } }
  return out
}
for(const p of PAGES){
  const r=await fetch('https://got-moles.com'+p,{headers:{'User-Agent':UA}})
  const html=await r.text()
  const b=blocks(html)
  const anySpeak = /"speakable"/.test(html)
  console.log(`\n${p}  [HTTP ${r.status}]  raw-html-has-"speakable": ${anySpeak}`)
  for(const x of b) console.log(`   ${x.type}${x.speakable?'  ← speakable: '+JSON.stringify(x.sel):''}`)
}
