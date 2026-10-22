// Builds ArtifactData batch ops for the Whale Hunt app from dossiers/*.card.json.
// Usage: node build-seed.mjs > seed.json
import fs from "node:fs";
import path from "node:path";
const dir = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1")), "../dossiers");
const TRACK = {
  hunt: ["associa","oki-golf","landcare","kappes-miller","kempersports","metro-parks-tacoma","starfire","cre-facilities","pacific-landscape","lake-washington-sd"],
  maintain: ["management-trust","vis-group","prologis","arcis-golf","sahalee","king-county-parks","brightview"],
  bench: ["firstservice","wa-state-fair"],
};
// Contact made before the program started, so "last touch" is honest from day one.
const PRIOR = {
  landcare: [
    {date:"2026-08-31",channel:"LinkedIn DM",summary:"Intro DM to Patrick (hub ask)",response:""},
    {date:"2026-09-09",channel:"LinkedIn DM",summary:"Fall-push offer: send me the address",response:""},
    {date:"2026-10-14",channel:"LinkedIn DM",summary:"Rain's back, offer still stands",response:"No reply to any of 3"}],
  "oki-golf": [{date:"2026-09-10",channel:"LinkedIn DM",summary:"Invite with note to Justin Kochevar (Redmond Ridge)",response:"Pending"}],
  kempersports: [{date:"2026-10-14",channel:"LinkedIn DM",summary:"Connection invite to Eric Johnson",response:"Pending"}],
  "metro-parks-tacoma": [{date:"2026-10-20",channel:"LinkedIn DM",summary:"Bare connection invite to George Schaaf",response:"Pending"}],
  "kappes-miller": [{date:"2026-09-09",channel:"LinkedIn DM",summary:"Connection invite to Mark Johnson (CAM, not the owner)",response:"Pending"}],
  "lake-washington-sd": [{date:"2026-10-20",channel:"LinkedIn DM",summary:"Connection invite to Jesse Hoffman",response:"Pending"}],
  "pacific-landscape": [{date:"2026-10-20",channel:"LinkedIn DM",summary:"Connection invite to Gabriel Phillips",response:"Pending"}],
};
const ops = [];
for (const [track, slugs] of Object.entries(TRACK)) for (const slug of slugs) {
  const f = path.join(dir, slug + ".card.json");
  if (!fs.existsSync(f)) { console.error("missing " + slug); continue; }
  const c = JSON.parse(fs.readFileSync(f, "utf8"));
  const touches = [...(PRIOR[slug] || [])];
  if (c.last_touch?.date && !touches.some(t => t.date === c.last_touch.date))
    touches.push({date:c.last_touch.date, channel:c.last_touch.channel||"", summary:c.last_touch.summary||"", response:""});
  const li = c.primary?.linkedin || "";
  ops.push({op:"set", collection:"whales", doc_id:slug, data:{
    id:slug, track, status:"active", company:c.company, segment:c.segment, why_whale:c.why_whale||"",
    primary:{...c.primary, linkedin: li && !li.startsWith("http") && li.startsWith("/in/") ? "https://www.linkedin.com"+li : li},
    others:c.others||[], warm_paths:c.warm_paths||"", lunch_angle:c.lunch_angle||"", gives:c.gives||[],
    next_touch: c.week1_touch?.idea ? {week:1, channel:c.week1_touch.channel, idea:c.week1_touch.idea} : {},
    touches, dossier:`projects/briefs/whale-hunt/dossiers/${slug}.md`,
  }});
}
process.stdout.write(JSON.stringify(ops, null, 1));
