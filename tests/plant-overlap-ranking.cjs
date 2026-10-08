'use strict';
const fs=require('node:fs');
const raw=fs.readFileSync('index.html','utf8');
const hit=raw.match(/<script\b[^>]*\bid=["']dashboardData["'][^>]*>([\s\S]*?)<\/script>/i);
if(!hit)throw Error('Missing embedded dashboardData');
const data=JSON.parse(hit[1]);
const beeRaw=fs.readFileSync('scripts/bee-host-index.js','utf8');
const bees=JSON.parse(beeRaw.slice(beeRaw.indexOf('=')+1).trim().replace(/;$/,''));
const records=data.records.filter(r=>['established','both'].includes(r.statusKey));
const hostMap=new Map();
for(const r of records){
 for(const g of r.hostGenera||[]){
  if(!hostMap.has(g))hostMap.set(g,new Set());
  hostMap.get(g).add(String(r.id));
 }
}
const rows=(data.hosts||[]).map(h=>({
 genus:h.genus,
 lepidoptera:h.establishedCount,
 bees:new Set((bees[h.genus]||[]).map(x=>x.name)).size,
 linkedIds:hostMap.get(h.genus)||new Set()
})).filter(x=>x.lepidoptera>0&&x.bees>0);
const print=(title,array)=>{
 console.log('\n=== '+title+' ===');
 array.slice(0,45).forEach((x,i)=>console.log(String(i+1).padStart(2)+' '+x.genus.padEnd(23)+' TX Lep='+String(x.lepidoptera).padStart(4)+' specialist bees='+String(x.bees).padStart(3)+(x.hays!==undefined?' Hays Lep='+String(x.hays).padStart(3):'')));
};
console.log('DATA SNAPSHOT',data.stats?.sourceDate,'UDELep records',data.records.length,'bee indexed genera',Object.keys(bees).length,'both-linked genera',rows.length);
print('TOP TEXAS-LEPIDOPTERA GENERA WITH NONZERO SPECIALIST BEES',[...rows].sort((a,b)=>b.lepidoptera-a.lepidoptera));
print('TOP SPECIALIST-BEE GENERA WITH NONZERO TEXAS LEPIDOPTERA',[...rows].sort((a,b)=>b.bees-a.bees));
print('HIGH JOINT PRODUCT (SORTING HEURISTIC, NOT ECOLOGICAL SCORE)',[...rows].sort((a,b)=>b.lepidoptera*b.bees-a.lepidoptera*a.bees));
const norm=s=>{const m=String(s||'').trim().match(/^([A-Z][a-z-]+)\s+([a-z][a-z-]+)/);return m?(m[1]+' '+m[2]).toLowerCase():null};
const byName=new Map();
for(const r of records){
 const names=[r.species,...(String(r.synonyms||'').match(/[A-Z][a-z-]+\s+[a-z][a-z-]+/g)||[])];
 for(const n of names){
  const key=norm(n);
  if(!key)continue;
  if(!byName.has(key))byName.set(key,new Set());
  byName.get(key).add(String(r.id));
 }
}
async function hays(){
 const joined=new Set();
 const root='https://api.inaturalist.org/v1/observations/species_counts?place_id=326&taxon_id=47157&quality_grade=research&per_page=200&page=';
 let total=0;
 for(let page=1;page<=75;page++){
  const res=await fetch(root+page,{signal:AbortSignal.timeout(18000)});
  if(!res.ok)throw Error('iNaturalist responded '+res.status+' at page '+page);
  const body=await res.json();total=body.total_results||0;
  for(const item of body.results||[]){
   const key=norm(item.taxon?.name);
   for(const id of byName.get(key)||[])joined.add(id);
  }
  if(page*200>=total)break;
  if(page===75)throw Error('Incomplete iNaturalist pagination');
 }
 for(const x of rows)x.hays=[...x.linkedIds].filter(id=>joined.has(id)).length;
 console.log('\nHAYS County research grade iNaturalist reported taxa',total,'joined to UDELep IDs',joined.size);
 print('STRONG HAYS OBSERVATIONS + BOTH LINKED, ranked Hays count',[...rows].sort((a,b)=>b.hays-a.hays));
 print('TOP JOINT TEXAS PRODUCT including Hays',[...rows].sort((a,b)=>b.lepidoptera*b.bees-a.lepidoptera*a.bees));
}
hays().catch(e=>console.log('Live Hays lookup unavailable: '+(e.message||e)));