'use strict';
const fs=require('node:fs');
const raw=fs.readFileSync('index.html','utf8');
const hit=raw.match(/<script\b[^>]*\bid=["']dashboardData["'][^>]*>([\s\S]*?)<\/script>/i);
if(!hit)throw Error('Embedded UDELep dataset not found');
const data=JSON.parse(hit[1]);
const records=data.records||[];
console.log('UDELep snapshot:',data.stats?.sourceDate,'records:',records.length);
console.log('Record field names:',Object.keys(records[0]||{}).join(', '));
console.log('Sample Lepidoptera:',records.slice(0,3).map(r=>({species:r.species,synonyms:r.synonyms,hostGenera:r.hostGenera,statusKey:r.statusKey})));
const oak=records.filter(r=>['established','both'].includes(r.statusKey)&&r.hostGenera?.includes('Quercus'));
console.log('Quercus UDELep rows:',oak.length,'sample:',oak.slice(0,5).map(r=>r.species));
const api='https://api.inaturalist.org/v1/';
async function req(path){
 const ctrl=new AbortController(),time=setTimeout(()=>ctrl.abort(),20000);
 try{
  const resp=await fetch(api+path,{signal:ctrl.signal,headers:{'User-Agent':'Texas-Lepidoptera-Dashboard diagnostics'}});
  if(!resp.ok)throw Error(path+' status '+resp.status);
  return resp.json();
 }finally{clearTimeout(time)}
}
async function main(){
 const place=await req('places/326');
 console.log('iNat place 326:',place.results?.[0]&&{name:place.results[0].name,display_name:place.results[0].display_name,ancestry:place.results[0].ancestry});
 const p='observations/species_counts?place_id=326&taxon_id=47157&quality_grade=research&per_page=200&page=';
 const first=await req(p+'1');
 console.log('Hays butterfly/moth species_count total_results:',first.total_results);
 console.log('iNat sample:',(first.results||[]).slice(0,7).map(x=>x.taxon?.name));
 const normalize=name=>{const m=String(name||'').trim().match(/^([A-Z][a-z-]+)\s+([a-z][a-z-]+)/);return m?(m[1]+' '+m[2]).toLowerCase():null};
 const oakNames=new Set(oak.map(r=>normalize(r.species)).filter(Boolean));
 console.log('Normalized UDELep oak sample:',[...oakNames].slice(0,8));
 const matched=[],allSpecies=new Set();
 const number=Math.min(75,Math.ceil((first.total_results||0)/200));
 for(let i=1;i<=number;i++){
  const page=i===1?first:await req(p+i);
  for(const item of page.results||[]){
    const name=normalize(item.taxon?.name);if(!name)continue;allSpecies.add(name);
    if(oakNames.has(name))matched.push(name);
  }
  if(i%10===0)console.log('Scanned pages',i,'match count',matched.length);
 }
 console.log('FINAL: observed species',allSpecies.size,'Quercus NORMALIZED binomial matches',matched.length,'examples',matched.slice(0,30));
 if(!first.total_results)throw Error('Hays returned 0 Lepidoptera species. API/place filter issue');
}
main().catch(e=>{console.error('DIAGNOSTIC FAILED:',e.stack||e);process.exitCode=1});
