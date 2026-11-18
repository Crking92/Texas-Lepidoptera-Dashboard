'use strict';
// Read-only field audit: compare Fowler source names to public iNaturalist
// Hays County (place 326) species counts; never changes any dashboard counts.
const fs=require('node:fs');
const vm=require('node:vm');
const raw=fs.readFileSync('scripts/bee-host-index.js','utf8');
const context={};
vm.runInNewContext(raw+';globalThis.index = BEE_HOST_INDEX;',context,{timeout:4000});
const all=context.index;
const sunflower=(all.Helianthus||[]).map(x=>x.name);
const normalize=value=>{
  const m=String(value||'').trim().match(/^([A-Z][a-z-]+)\s+([a-z][a-z-]+)/);
  return m?(m[1]+' '+m[2]).toLowerCase():null;
};
const sunflowerSet=new Set(sunflower.map(normalize));
async function get(path){
  let last;
  for(let attempt=1;attempt<=3;attempt++){
    const ctrl=new AbortController();
    const timeout=setTimeout(()=>ctrl.abort(),22000);
    try{
      const response=await fetch('https://api.inaturalist.org/v1/'+path,{
        headers:{'Accept':'application/json','User-Agent':'Texas-Lepidoptera-Dashboard Hays bee evidence audit'},
        signal:ctrl.signal
      });
      if(!response.ok)throw Error('iNaturalist HTTP '+response.status);
      return await response.json();
    }catch(err){
      last=err;
      if(attempt<3)await new Promise(resolve=>setTimeout(resolve,attempt*1200));
    }finally{clearTimeout(timeout)}
  }
  throw last;
}
async function scan(params,label){
  const names=new Set(),reported=[];
  let total=null;
  for(let page=1;page<=25;page++){
    const query=new URLSearchParams(Object.assign({place_id:'326',taxon_id:'630955',per_page:'200',page:String(page)},params));
    const result=await get('observations/species_counts?'+query.toString());
    if(!Array.isArray(result.results)||!Number.isInteger(result.total_results)||result.total_results<0)
      throw Error(label+' returned invalid/incomplete species-count response');
    if(total===null)total=result.total_results;
    if(total!==result.total_results)throw Error(label+' changed total mid-scan; retry later');
    for(const item of result.results){
      const normalized=normalize(item.taxon&&item.taxon.name);
      if(normalized)names.add(normalized);
    }
    reported.push(result.results.length);
    if(page*200>=total){
      if(names.size>total)throw Error('More distinct names than reported taxa');
      return {names,total,pages:page,perPageResults:reported};
    }
  }
  throw Error(label+' exceeded 25-page limit; no count is trustworthy');
}
async function main(){
  const place=await get('places/326');
  const p=place.results&&place.results[0];
  if(!p||!/Hays/i.test(p.name||p.display_name||'')||!/TX|Texas/i.test([p.name,p.display_name].join(' ')))
    throw Error('Place 326 was not identified as Hays County, Texas: '+JSON.stringify(p&&{name:p.name,display_name:p.display_name}));
  console.log('HAYS BEE AUDIT 2026-11-18');
  console.log('iNaturalist place:',p.name,'(',p.display_name,')');
  console.log('iNaturalist taxon: 630955 Anthophila; source Fowler snapshot: October 7, 2026');
  console.log('Helianthus Fowler source species:',sunflowerSet.size);
  const research=await scan({quality_grade:'research'},'Research Grade');
  const researchMatches=[...research.names].filter(n=>sunflowerSet.has(n)).sort();
  console.log('RESEARCH GRADE bees returned:',research.total,'records across',research.pages,'pages,',research.names.size,'normalized species names');
  console.log('RESEARCH GRADE DIRECT Helianthus matches:',researchMatches.length);
  console.log('RESEARCH GRADE MATCH NAMES:',JSON.stringify(researchMatches));
  const allObs=await scan({verifiable:'true'},'Verifiable (including Needs ID)');
  const broadMatches=[...allObs.names].filter(n=>sunflowerSet.has(n)).sort();
  console.log('VERIFIABLE bee taxa returned:',allObs.total,'across',allObs.pages,'pages');
  console.log('VERIFIABLE DIRECT Helianthus matches:',broadMatches.length);
  console.log('VERIFIABLE MATCH NAMES:',JSON.stringify(broadMatches));
  console.log('NOT RESEARCH GRADE BUT IN VERIFIABLE:',JSON.stringify(broadMatches.filter(x=>!research.names.has(x))));
  const sunflowerGenera=new Set(sunflower.map(n=>n.split(' ')[0].toLowerCase()));
  const sameGenera=[...research.names].filter(n=>sunflowerGenera.has(n.split(' ')[0])&&!sunflowerSet.has(n)).sort();
  console.log('Hays RESEARCH GRADE bees in same genera but not matching Fowler sunflower species (not counted):',JSON.stringify(sameGenera));
  if(!research.total)throw Error('No bee taxa returned for Hays; county filter may be broken');
  console.log('AUDIT COMPLETE: no dashboard source data changed.');
}
main().catch(err=>{console.error('AUDIT FAILED:',err.stack||err);process.exitCode=1});
