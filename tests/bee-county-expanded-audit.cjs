'use strict';
// Evidence-only audit: no dashboard counts are changed by this script.
// County presence requires a named species recorded anywhere in Hays County,
// independently of the plant on which an observation was made.
const fs=require('node:fs'),vm=require('node:vm');
const context={};
vm.runInNewContext(fs.readFileSync('scripts/bee-host-index.js','utf8')+';globalThis.index=BEE_HOST_INDEX;',context,{timeout:4000});
const sunflower=context.index.Helianthus.map(row=>row.name);
const norm=value=>{const m=String(value||'').trim().match(/^([A-Z][a-z-]+)\s+([a-z][a-z-]+)/);return m?(m[1]+' '+m[2]).toLowerCase():null;};
const targets=new Set(sunflower.map(norm));
const knownRG=new Set(['diadasia enavata','megachile fortis','megachile inimica','megachile parallela']);
const knownVerifiable=new Set([...knownRG,'dianthidium curvatum']);
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function get(url,{retries=3}={}){
 let error;
 for(let attempt=1;attempt<=retries;attempt++){
   const controller=new AbortController();
   const timer=setTimeout(()=>controller.abort(),22000);
   try{
     const response=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json','User-Agent':'TX Lepidoptera County Evidence Audit (noncommercial, read-only)'}});
     if(!response.ok)throw Error(response.status+' '+url);
     return await response.json();
   }catch(e){error=e;await pause(700*attempt)}finally{clearTimeout(timer)}
 }
 throw error;
}
async function inatSynonyms(){
 const aliases=[];
 const misses=[],errors=[];
 for(let i=0;i<sunflower.length;i++){
   const source=sunflower[i];
   try{
     const q=new URLSearchParams({q:source,per_page:'10'});
     const data=await get('https://api.inaturalist.org/v1/taxa/autocomplete?'+q);
     const results=data.results||[];
     const direct=results.filter(t=>t.rank==='species'&&(norm(t.matched_term)===norm(source)||norm(t.name)===norm(source)));
     if(direct.length===1){
       const t=direct[0],canonical=norm(t.name);
       if(canonical&&canonical!==norm(source))
         aliases.push({source,accepted:t.name,taxonId:t.id,matchedTerm:t.matched_term||null,haysResearch:knownRG.has(canonical),haysVerifiable:knownVerifiable.has(canonical),active:t.is_active});
     }else if(direct.length>1)errors.push({source,reason:'ambiguous autocomplete synonym',taxa:direct.map(x=>({id:x.id,name:x.name}))});
     else misses.push(source);
   }catch(e){errors.push({source,reason:String(e.message||e)})}
   await pause(1100); // respect iNaturalist approx 1 API call per second
 }
 console.log('INAT SOURCE NAMES:',sunflower.length,'synonym candidates',aliases.length,'unresolved',misses.length,'errors/ambiguous',errors.length);
 console.log('INAT ALIAS CANDIDATES:',JSON.stringify(aliases));
 console.log('INAT ALIAS OVERLAP WITH RG:',JSON.stringify(aliases.filter(a=>a.haysResearch)));
 console.log('INAT ALIAS OVERLAP WITH VERIFIABLE:',JSON.stringify(aliases.filter(a=>a.haysVerifiable)));
 console.log('INAT UNRESOLVED names sample:',JSON.stringify(misses.slice(0,20)));
 console.log('INAT ERRORS:',JSON.stringify(errors));
 return aliases;
}
const families=['Apidae','Andrenidae','Colletidae','Halictidae','Megachilidae','Melittidae'];
const countyOK=x=>String(x||'').trim().toLowerCase().replace(/\s+county$/,'')==='hays';
const texasOK=x=>/texas|^tx$/i.test(String(x||'').trim());
async function gbifSpecimens(){
 const specimens=[];
 for(const family of families){
   const taxon=await get('https://api.gbif.org/v1/species/match?'+new URLSearchParams({name:family,rank:'FAMILY'}));
   const familyKey=taxon.usageKey;
   if(!familyKey||taxon.rank!=='FAMILY')throw Error('GBIF family match failed for '+family+': '+JSON.stringify(taxon).slice(0,300));
   // GBIF /occurrence/search does not filter directly by county text.
   // Search a generous Hays-region rectangle, then require the ORIGINAL
   // individual voucher county/state fields to explicitly say Hays, Texas.
   // Coordinate-less museum records are not captured by this method.
   const geometry='POLYGON((-98.65 29.60,-97.55 29.60,-97.55 30.50,-98.65 30.50,-98.65 29.60))';
   const base={country:'US',stateProvince:'Texas',geometry,familyKey:String(familyKey),basisOfRecord:'PRESERVED_SPECIMEN',limit:'300'};
   let total=null,kept=0,seen=0,complete=false;
   for(let page=0;page<35;page++){
     const query=new URLSearchParams({...base,offset:String(page*300)});
     const payload=await get('https://api.gbif.org/v1/occurrence/search?'+query);
     if(total===null)total=payload.count||0;
     for(const row of payload.results||[]){
       seen++;
       if(!countyOK(row.county)||!texasOK(row.stateProvince)||row.countryCode!=='US')continue;
       if(row.basisOfRecord!=='PRESERVED_SPECIMEN')continue;
       const name=norm(row.species||row.acceptedScientificName||row.scientificName);
       if(!name||!targets.has(name))continue;
       specimens.push({
         species:name,key:row.key,recordedAs:row.scientificName,
         date:row.eventDate||null,dataset:row.datasetName||null,
         collection:row.institutionCode||null,catalog:row.catalogNumber||null,
         county:row.county,state:row.stateProvince,
         country:row.countryCode,url:'https://www.gbif.org/occurrence/'+row.key
       });
       kept++;
     }
     if(payload.endOfRecords||((page+1)*300>=total)){complete=true;break}
   }
   console.log('GBIF GEO SEARCH:',family,'regional records',total,'rows processed',seen,'complete',complete,'explicit Hays sunflower vouchers',kept);
   if(!complete)console.log('INCOMPLETE GBIF FAMILY: candidate list is partial, not proof of absence',family);
 }
 const unique=new Map();
 for(const record of specimens)unique.set(String(record.key),record);
 const records=[...unique.values()];
 const evidence=new Map();
 for(const r of records){
   const item=evidence.get(r.species)||[];
   if(item.length<4)item.push(r);
   evidence.set(r.species,item);
 }
 console.log('GBIF VERIFIED SPECIMEN SPECIES matching sunflower list:',evidence.size);
 console.log('GBIF SPECIES WITH SPECIMEN LINKS:',JSON.stringify([...evidence].sort((a,b)=>a[0].localeCompare(b[0])).map(([name,records])=>({name,newVsRG:!knownRG.has(name),records}))));
 console.log('GBIF NEW SPECIMEN SPECIES NOT IN INAT RG:',JSON.stringify([...evidence.keys()].filter(name=>!knownRG.has(name)).sort()));
 return evidence;
}
(async()=>{
 console.log('HAYS SUNFLOWER BEE SUPPLEMENTAL EVIDENCE AUDIT');
 console.log('Baseline: 72 Fowler-listed Helianthus bees; 4 Hays Research Grade matches, 5 Hays verifiable matches');
 const aliases=await inatSynonyms();
 const specimens=await gbifSpecimens();
 const newAlias=aliases.filter(a=>a.haysResearch);
 console.log('AUDIT SUMMARY:',JSON.stringify({sunflowerSourceSpecies:sunflower.length,gbifSpecimenSpecies:specimens.size,specimenOnlyNewVsResearch:[...specimens.keys()].filter(n=>!knownRG.has(n)).length,inatAliasesOverlappingKnownRG:newAlias.length}));
 console.log('PROVENANCE: GBIF museum vouchers are supporting candidates, not automatically promoted into the live dashboard. Synonym candidates need taxon-concept review.');
})().catch(err=>{console.error('EXPANDED AUDIT FAILED',err.stack||err);process.exitCode=1});
