// Got Moles — build 6 themed SHARED negative-keyword lists (reusable, attach later).
// SAFE: creates shared sets + criteria only. Attaches to NOTHING (no serving/spend effect).
// match type: multi-word -> PHRASE, single word -> BROAD. Protects positives (mole removal/control/exterminator {city}).
// Also writes a readable doc. Usage: node scripts/got-moles-build-negative-lists.mjs
import fs from 'node:fs'; import path from 'node:path'
const env = {}; for (const l of fs.readFileSync(path.resolve('.env'), 'utf8').split(/\r?\n/)) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/); if (!m) continue; let v = m[2].trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); env[m[1]] = v }
const V = 'v23', CUST = '1665761172', MCC = env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
const at = (await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.GOOGLE_ADS_CLIENT_ID, client_secret: env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' }) })).json()).access_token
async function mut(ep, ops) { const r = await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/${ep}:mutate`, { method: 'POST', headers: { Authorization: `Bearer ${at}`, 'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN, 'login-customer-id': MCC, 'Content-Type': 'application/json' }, body: JSON.stringify({ operations: ops }) }); const j = await r.json(); if (!r.ok) { console.error(`${ep} FAIL:`, JSON.stringify(j, null, 2)); process.exit(1) } return j }

const LISTS = {
  'GM Neg — Wrong Meaning': [
    // mold (the #1 miss)
    'mold','molds','mould','mildew','remediation','mold removal','black mold','mold inspection','mold test','mold remediation',
    // dental
    'molar','molars','molar removal','molar extraction','wisdom tooth','wisdom teeth','dental','dentist','tooth extraction','tooth removal',
    // skin / derm / cosmetic
    'skin','skin mole','skin moles','skin tag','skin tags','skin cancer','skin check','dermatologist','dermatology','melanoma','biopsy','mole biopsy','cancerous','cancerous mole','atypical','dysplastic','freckle','freckles','mole on','mole on face','mole on back','mole on arm','mole on neck','mole on scalp','mole on chest','mole removal surgery','mole removal scar','mole removal cream','mole removal pen','mole removal dermatology','removal cream','removal pen','cosmetic','cosmetic mole','facial mole','face','face mole','laser','laser mole','laser removal','cryotherapy','excision','shave excision','cyst','lesion','wart','warts','wart removal','keratosis','seborrheic keratosis','itchy mole','bleeding mole','raised mole','changing mole','new mole','mole mapping','mole check','beauty','beauty mark','beauty marks','beauty spot','beauty spots','body mole','mole on body','remove moles from body','remove moles from face','remove moles from skin','skin moles removal',
    // chemistry / units
    'avogadro','molar mass','moles to grams','grams to moles','mole calculator','molarity','stoichiometry','mole fraction','mole ratio','mole concept','mole chemistry','number of moles','mole conversion','one mole','mole unit',
    // food
    'mole sauce','mole poblano','poblano','mole recipe','chicken mole','mole negro','mole verde','dona maria','mexican mole','mole paste','enchilada','guacamole',
    // pop culture / media / spy
    'the mole','the mole netflix','mole netflix','mole tv show','mole show','mole season','naked mole rat','mole rat','star nosed mole','star-nosed mole','mole agent','adrian mole','monty mole','mole national park','mole man marvel','wind in the willows','double agent','spy','molly','molotov',
    // astrology / meaning
    'mole meaning','mole on face meaning','mole astrology','mole reading','lucky mole','mole on body meaning','moles on face meaning','what does a mole mean','mole superstition',
  ],
  'GM Neg — Wrong Species & Other Pests': [
    'gopher','gophers','pocket gopher','vole','voles','shrew','shrews','mouse','mice','rat','rats','groundhog','woodchuck','chipmunk','chipmunks','ground squirrel','squirrel','squirrels','skunk','beaver','rabbit','rabbits','raccoon','opossum','possum','nutria','muskrat','marmot','prairie dog','snake','snakes',
    'ant','ants','termite','termites','bed bug','bed bugs','bedbug','cockroach','roach','roaches','flea','fleas','tick','ticks','mosquito','mosquitoes','spider','spiders','wasp','wasps','hornet','yellow jacket','bee','bees','silverfish','earwig','centipede','beetle','beetles','aphid','aphids','grub','grubs','fly','flies','wildlife','bat','bats','bird','birds','pigeon',
  ],
  'GM Neg — DIY & Products': [
    'castor oil','castor','castor bean','vinegar','apple cider vinegar','dawn','dish soap','garlic','moth balls','mothballs','cayenne','cayenne pepper','coffee grounds','predator urine','fox urine','coyote urine','epsom salt','ammonia','bleach','gasoline','petrol','flooding','drowning','smoke bomb','road flare','flare','flares','marshmallow','marshmallows','tin foil','aluminum foil','broken glass','cat litter','kitty litter','human hair','peppermint oil','peppermint','eucalyptus','tea tree','neem','diatomaceous earth','milky spore','nematodes','beneficial nematodes','daffodil','daffodils','allium','marigold','juicy fruit','gum','chewing gum','dry ice','co2','baking soda',
    'repellent','repellents','deterrent','deterrents','sonic','ultrasonic','sonic repeller','ultrasonic repeller','vibration stake','vibration stakes','solar repeller','electronic','scram','plants that repel','plants to deter','plants repel',
    'trap','traps','mole trap','mole traps','trap for sale','best mole trap','victor','tomcat','sweeney','sweeneys','cinch','nash','out o sleep','wire trap','gopherhawk','molecat','bunker blaster','molemax','molenet','talpirid','ortho','bonide','12 gauge mole trap',
    'bait','baits','mole bait','pellet','pellets','granule','granules','warfarin','bromethalin','strychnine','zinc phosphide',
    'amazon','ebay','etsy','walmart','home depot','lowes','best buy','costco','target','tractor supply','ace hardware','harbor freight','menards',
    'kit','kits','diy','do it yourself','homemade','home remedy','home remedies','natural','naturally','remedy','remedies','how to make','how to build','how to trap','how to catch',
  ],
  'GM Neg — Out of Area': [
    'alabama','alaska','arizona','arkansas','california','colorado','connecticut','delaware','florida','georgia','hawaii','idaho','illinois','indiana','iowa','kansas','kentucky','louisiana','maine','maryland','massachusetts','michigan','minnesota','mississippi','missouri','montana','nebraska','nevada','new hampshire','new jersey','new mexico','new york','north carolina','north dakota','ohio','oklahoma','oregon','pennsylvania','rhode island','south carolina','south dakota','tennessee','texas','utah','vermont','virginia','west virginia','wisconsin','wyoming',
    'fairfax','arlington','denver','portland','vancouver bc','vancouver wa','vancouver washington',
    'uk','britain','great britain','england','scotland','wales','ireland','canada','australia','new zealand','india','europe','mexico','london','united kingdom',
    'spokane','yakima','wenatchee','bellingham','walla walla','tri cities','tri-cities','kennewick','richland','pasco','moses lake','ellensburg','port angeles','aberdeen','longview','chelan','leavenworth','pullman','mount vernon','oak harbor',
  ],
  'GM Neg — Non-Buyer': [
    'job','jobs','career','careers','salary','wage','employment','hiring','hire me','how to become','indeed','ziprecruiter','glassdoor','technician','pest control technician','training','certification','certified','license','licensing','internship','help wanted','resume',
    'do moles bite','are moles blind','are moles nocturnal','how many eyes','what do moles look like','what do moles eat','what do they eat','baby mole','baby moles','pet mole','mole as pet','what is a mole','mole facts','where do moles live','how long do moles live','mole lifespan','are moles dangerous','are moles good','do moles hibernate','mole sound','mole noise','what eats moles','mole predators','mole habitat','mole diet','mole vs gopher','mole vs vole','difference between mole','mole pictures','mole images','mole video','mole information','facts about moles','do moles carry','do moles carry disease','are moles poisonous','are moles aggressive','wikipedia','youtube',
    'i-713','i713','rcw','wac','wdfw','law','laws','legal','illegal','is it legal','regulation','regulations','ban','banned','lawsuit','attorney','lawyer','permit','statute',
    'free','cheap','low cost','for free','discount','coupon','coupons','deal','deals',
    'whack a mole','whack-a-mole','game','games','online game','arcade','toy','toys','cartoon','coloring','coloring page','kids','mole mania','puzzle','song','lyrics','definition','define',
  ],
  'GM Neg — Mechanism & Poison (Posture A)': [
    'kill','kills','killed','killing','killer','mole killer','best mole killer','kill moles','kill mole','how to kill','ways to kill','kill ground moles','poison','poisons','poisoned','mole poison','poison moles','lethal','body gripping','body-gripping','scissor','scissor trap','harpoon','spear','spear trap','spike','spikes','plunger','choker','12 gauge','mole gun','electrocute','suffocate','drown moles','drown mole','gas moles','exterminate moles','exterminate ground moles','eradicate','eradicate moles','euthanize','snap trap','shoot moles','shoot a mole',
  ],
}

const doc = ['# Got Moles — Negative Keyword Shared Lists', '', 'Built 2026-05-24. 6 themed shared negative lists (reusable across campaigns + Bing). Match: multi-word=PHRASE, single=BROAD.', '']
let grandTotal = 0
for (const [name, terms] of Object.entries(LISTS)) {
  const uniq = [...new Set(terms.map(t => t.toLowerCase().trim()))]
  console.log(`\nCreating shared set: ${name} (${uniq.length} terms)`)
  const setJ = await mut('sharedSets', [{ create: { name, type: 'NEGATIVE_KEYWORDS' } }])
  const setRes = setJ.results[0].resourceName
  const ops = uniq.map(t => ({ create: { sharedSet: setRes, keyword: { text: t, matchType: t.includes(' ') ? 'PHRASE' : 'BROAD' } } }))
  // batch in chunks of 1000
  let added = 0
  for (let i = 0; i < ops.length; i += 1000) { const c = await mut('sharedCriteria', ops.slice(i, i + 1000)); added += c.results.length }
  console.log(`  ${setRes.split('/').pop()} -> ${added} criteria`)
  grandTotal += added
  doc.push(`## ${name} (${uniq.length})`, '', '`' + uniq.join('` · `') + '`', '')
}
console.log(`\nDONE. ${Object.keys(LISTS).length} shared lists, ${grandTotal} total negatives. Attached to NOTHING (safe).`)
fs.writeFileSync('projects/briefs/got-moles-paid-search/2026-05-24_negative-keyword-lists.md', doc.join('\n'))
console.log('Doc: projects/briefs/got-moles-paid-search/2026-05-24_negative-keyword-lists.md')
