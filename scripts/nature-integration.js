// Same-origin bee module shares the existing garden; source counts stay separate.
function openBeePlant(genus) {
  switchTab('bees');
  const frame=document.getElementById('beeExplorer');
  if(frame.contentWindow && typeof frame.contentWindow.openPlant==='function') frame.contentWindow.openPlant(genus);
  else frame.src='bees/index.html?embedded=1&plant='+encodeURIComponent(genus);
  frame.scrollIntoView({behavior:'smooth',block:'start'});
}
function renderGardenBeeConnections(){
  const unique=new Map(), available=[...gardenPlants].filter(g=>BEE_HOST_INDEX[g]);
  available.forEach(g=>BEE_HOST_INDEX[g].forEach(b=>unique.set(b.name,b)));
  document.getElementById('gardenBeeSummary').textContent=`${unique.size} different bees linked to ${available.length} saved plant groups. Butterfly and moth totals remain separate below.`;
  const plants=document.getElementById('gardenBeePlants');plants.replaceChildren();
  [...gardenPlants].sort().forEach(g=>{const card=node('div','shared-bee-plant');const copy=node('span','',`${POPULAR_HOST_NAMES[g]||g} · ${g}`);card.append(copy);const count=BEE_HOST_INDEX[g]?.length||0;if(count){const button=node('button','button small',`${count} bees →`);button.onclick=()=>openBeePlant(g);card.append(button)}else card.append(node('span','microcopy','No counted bee link in this source'));if(!hosts.some(h=>h.genus===g)){const remove=node('button','button small','Remove');remove.onclick=()=>toggleGarden(g);card.append(remove)}plants.append(card)});
  const list=document.getElementById('gardenBeeList');list.replaceChildren();
  [...unique.values()].sort((a,b)=>a.name.localeCompare(b.name)).forEach(b=>{const row=node('button','button small',`${b.name} · ${b.family}`);row.onclick=()=>{switchTab('bees');const frame=document.getElementById('beeExplorer');const open=()=>frame.contentWindow.openBee(b.name);if(typeof frame.contentWindow.openBee==='function')open();else frame.addEventListener('load',open,{once:true})};list.append(row)});
}
function renderCompareBeeConnections(names){
  let box=document.getElementById('compareBeeSummary');
  if(!box){box=node('div','callout');box.id='compareBeeSummary';document.querySelector('.compare-builder').append(box)}
  const sets=names.map(g=>new Set((BEE_HOST_INDEX[g]||[]).map(b=>b.name))), union=new Set(sets.flatMap(s=>[...s])), shared=sets.length?[...sets[0]].filter(n=>sets.every(s=>s.has(n))).length:0;
  box.textContent=names.length?`Bee pollen connections: ${union.size} different bees across these plant groups · ${shared} shared by every group. Caterpillar-host results below use UDELep separately.`:'Choose plant groups to compare their caterpillar hosts and bee pollen connections.';
}
function syncBeeTheme(){const frame=document.getElementById('beeExplorer');if(frame.contentDocument?.body)frame.contentDocument.body.classList.toggle('dark',document.documentElement.dataset.theme==='dark')}
function initNatureIntegration(){
initCountyDiscovery();
const beeFrame=document.getElementById('beeExplorer');beeFrame.addEventListener('load',syncBeeTheme);
document.getElementById('themeToggle').addEventListener('click',syncBeeTheme);
window.addEventListener('storage',event=>{if(event.key==='txlep-garden'){gardenPlants.clear();readStoredArray('txlep-garden').forEach(g=>gardenPlants.add(g));renderGarden();renderComparison()}});
renderGardenBeeConnections();renderCompareBeeConnections(comparePlants.filter(Boolean));

}


/* County quick-filter is NOT the "Check My Area" map.
   UDELep = Texas-range host associations; iNaturalist = county occurrence evidence. */
function initCountyDiscovery(){
  const hero=document.querySelector('.hero-search')||document.getElementById('heroHostSearchForm');
  if(!hero||document.getElementById('countyQuickSelect'))return;
  const chooser=document.createElement('div');chooser.className='county-discovery';
  const label=document.createElement('label');label.htmlFor='countyQuickSelect';label.textContent='Explore by county';
  const select=document.createElement('select');select.id='countyQuickSelect';select.className='control';
  const counties=['Hays','Travis','Comal','Blanco','Caldwell','Guadalupe','Bexar','Kendall','Burnet','Gillespie','Llano','Kerr','Bandera','Medina','San Saba','Mason','Kimble','Sutton','Edwards','Real','Uvalde','McCulloch','Concho','Tom Green','Menard','Schleicher'].sort((a,b)=>a.localeCompare(b));
  [['','All of Texas'],...counties.map(name=>[name,name+' County'])].forEach(([value,title])=>{const option=document.createElement('option');option.value=value;option.textContent=title;select.append(option)});
  const note=document.createElement('p');note.className='microcopy';note.textContent='Compare each plant’s Texas-wide host count with the subset of linked butterfly and moth species documented in your county. County observations do not prove local caterpillar feeding.';
  const output=document.createElement('div');output.id='countyQuickSummary';output.className='county-quick-summary';output.setAttribute('role','status');output.setAttribute('aria-live','polite');
  chooser.append(label,select,note,output);hero.insertAdjacentElement('afterend',chooser);

  const api='https://api.inaturalist.org/v1/', cachePrefix='txlep-county-overlap-v3-', maxAge=30*86400000;
  let county='',revision=0,aborter=null,ready=false,matchedIds=new Set(),pending=false,failed=false;
  const normalizedSpecies=name=>{
    const match=String(name||'').trim().match(/^([A-Z][a-z-]+)\s+([a-z][a-z-]+)/);
    return match?(match[1]+' '+match[2]).toLowerCase():null;
  };
  // Match research-grade county taxon names to actual UDELep rows, not to
  // the total number of moth observations or the number of plant observations.
  const nameToRecords=new Map();
  if(typeof records!=='undefined'){
    records.filter(r=>['established','both'].includes(r.statusKey)).forEach(r=>{
      const names=[r.species,...(String(r.synonyms||'').match(/[A-Z][a-z-]+\s+[a-z][a-z-]+/g)||[])];
      for(const name of names){
        const key=normalizedSpecies(name);if(!key)continue;
        if(!nameToRecords.has(key))nameToRecords.set(key,new Set());
        nameToRecords.get(key).add(String(r.id));
      }
    });
  }
  window.__countyQuickDiagnostic={sourceVisible:typeof records,hostMapVisible:typeof hostRecordMap,indexSize:nameToRecords.size,stryIds:[...(nameToRecords.get('strymon melinus')||[])],oakStryIds:typeof hostRecordMap!=='undefined'?(hostRecordMap.get('Quercus')||[]).filter(r=>/^Strymon melinus/.test(r.species)).map(r=>String(r.id)):[]};
  const countFor=genus=>{
    if(!ready||typeof hostRecordMap==='undefined')return null;
    const rows=hostRecordMap.get(genus)||[];
    return new Set(rows.filter(r=>matchedIds.has(String(r.id))).map(r=>String(r.id))).size;
  };
  function addMetric(container,className,labelText,valueText){
    if(!container)return;
    let metric=container.querySelector('.county-added-metric');
    if(!county){metric?.remove();return}
    if(!metric){
      metric=document.createElement('div');metric.className='county-added-metric '+className;
      const number=document.createElement('strong');number.className='county-added-number';
      const label=document.createElement('span');label.className='county-added-label';
      metric.append(number,label);container.append(metric);
    }
    metric.querySelector('.county-added-number').textContent=valueText;
    metric.querySelector('.county-added-label').textContent=labelText;
  }
  function paintHostCards(){
    const grid=document.getElementById('hostGrid');if(!grid)return;
    grid.querySelectorAll('.host-card').forEach(card=>{
      const genus=card.querySelector('.host-name')?.textContent?.trim();
      const original=card.querySelector('.host-count');if(!genus||!original)return;
      let pair=card.querySelector('.host-count-pair');
      if(!county){
        if(pair){const texas=pair.querySelector('.host-texas-metric');if(texas)pair.replaceWith(...texas.childNodes)}
        return;
      }
      if(!pair){
        const formerLabel=original.nextElementSibling?.classList.contains('microcopy')?original.nextElementSibling:null;
        pair=document.createElement('div');pair.className='host-count-pair';
        const texas=document.createElement('div');texas.className='host-texas-metric';
        original.before(pair);texas.append(original);if(formerLabel)texas.append(formerLabel);
        const local=document.createElement('div');local.className='host-county-metric';
        local.append(document.createElement('strong'),document.createElement('span'));
        pair.append(texas,local);
      }
      const local=pair.querySelector('.host-county-metric');
      local.querySelector('strong').textContent=ready?fmt.format(countFor(genus)):pending?'…':'—';
      local.querySelector('span').textContent=county+' County observed';
    });
  }
  function paintOtherCards(){
    const value=genus=>ready?fmt.format(countFor(genus)):pending?'…':'—';
    document.querySelectorAll('.featured-native-card').forEach(card=>{
      const genus=card.querySelector('.featured-native-name')?.textContent?.trim();
      if(genus)addMetric(card.querySelector('.featured-native-stats'),'featured-stat',county+' Co. observed',value(genus));
    });
    document.querySelectorAll('.collection-card').forEach(card=>{
      const genus=card.querySelector('.collection-name')?.textContent?.trim();
      if(genus)addMetric(card.querySelector('.collection-metrics'),'mini-metric',county+' Co. observed',value(genus));
    });
    document.querySelectorAll('.compare-card').forEach(card=>{
      const genus=card.querySelector('.collection-name')?.textContent?.trim();
      if(genus)addMetric(card.querySelector('.compare-metrics')||card,'county-compare-metric',county+' Co. observed',value(genus));
    });
  }
  function paint(){paintHostCards();paintOtherCards()}
  // Core pagination, searching and My Garden replace cards. Reapply only
  // when direct card children change, not when the county label changes.
  ['hostGrid','featuredNativeGrid','gardenGrid','gardenRecommendations','compareGrid'].forEach(id=>{
    const grid=document.getElementById(id);if(grid)new MutationObserver(paint).observe(grid,{childList:true});
  });
  const apiGet=async(path,signal)=>{
    const result=await fetch(api+path,{signal});
    if(!result.ok)throw Error('iNaturalist returned '+result.status);
    return result.json();
  };
  async function resolveCounty(name,signal){
    if(name==='Hays')return 326; // Verified iNaturalist place: Hays County, US, TX
    const expected=(name+' County').toLowerCase();
    const isName=p=>{
      const raw=String(p.name||p.display_name||'').trim().toLowerCase();
      return raw===expected||raw.startsWith(expected+',')||raw.startsWith(expected+' ');
    };
    const texas=p=>/texas|(?:^|,\s*)tx(?:$|,)/i.test([p.display_name,p.name].filter(Boolean).join(' '))||
      String(p.ancestry||'').split('/').includes('18')||
      p.parent_id===18||
      (Array.isArray(p.ancestor_place_ids)&&p.ancestor_place_ids.includes(18))||
      (Array.isArray(p.ancestors)&&p.ancestors.some(a=>a.id===18||a.name==='Texas'));
    // Autocomplete can return e.g. "Travis County, US, TX" in the name,
    // so exact equality alone incorrectly rejects genuine county places.
    const lookup=await apiGet('places/autocomplete?q='+encodeURIComponent(name+' County'),signal);
    const candidates=(lookup.results||[]).filter(isName);
    let match=candidates.find(texas);
    if(!match)for(const candidate of candidates){
      const detail=await apiGet('places/'+candidate.id,signal);
      const place=detail.results?.[0];
      if(place&&texas(place)){match=candidate;break}
    }
    // If autocomplete did not find it, query counties already constrained to
    // the Texas ancestor; no ambiguous out-of-state match can slip through.
    if(!match){
      for(let page=1;page<=3;page++){
        const data=await apiGet('places?ancestor_id=18&place_type=County&per_page=200&page='+page,signal);
        match=(data.results||[]).find(isName);
        if(match)break;
        if((data.results||[]).length<200)break;
      }
    }
    if(!match)throw Error('Texas county place was not resolved by iNaturalist');
    return match.id;
  }
  function cached(name){
    try{
      const item=JSON.parse(localStorage.getItem(cachePrefix+name)||'null');
      return item&&item.source===stats.sourceDate&&Date.now()-item.saved<maxAge&&Array.isArray(item.ids)&&!(name==='Hays'&&item.total>100&&item.ids.length===0)?item:null;
    }catch(_){return null}
  }
  async function loadCounty(name,token){
    const saved=cached(name);
    if(saved){matchedIds=new Set(saved.ids);ready=true;pending=false;paint();output.textContent=name+' County · '+saved.total+' Research Grade butterfly/moth taxa checked · cached '+new Date(saved.saved).toLocaleDateString()+'. County figures are observed UDELep-linked species, not local host-use confirmations.';return}
    aborter=new AbortController();
    try{
      const signal=aborter.signal,place=await resolveCounty(name,signal);
      if(token!==revision)return;
      const found=new Set(),perPage=200,maxPages=75;
      for(let page=1;page<=maxPages;page++){
        const params=new URLSearchParams({place_id:String(place),taxon_id:'47157',quality_grade:'research',per_page:String(perPage),page:String(page)});
        const result=await apiGet('observations/species_counts?'+params,signal);
        if(token!==revision)return;
        for(const item of result.results||[]){
          const key=normalizedSpecies(item.taxon?.name);
          if(key)for(const id of nameToRecords.get(key)||[])found.add(id);
        }
        output.textContent='Checking '+name+' County observations… page '+page;
        if(page*perPage>=Number(result.total_results||0)){
          // Hays has extensive known Lepidoptera/UDELep overlap. An empty match
          // here signals a failed scientific-name join, never a genuine zero.
          if(name==='Hays'&&Number(result.total_results||0)>100&&found.size===0){
            throw Error('County taxa were returned but did not match UDELep names');
          }
          matchedIds=found;ready=true;pending=false;
          const saved={source:stats.sourceDate,saved:Date.now(),ids:[...found],total:Number(result.total_results||0)};
          try{localStorage.setItem(cachePrefix+name,JSON.stringify(saved))}catch(_){}
          output.textContent=name+' County · '+saved.total+' butterfly/moth taxa checked. Each plant now shows Texas-wide host taxa beside the matching species documented in this county. Observation does not prove feeding.';
          paint();return;
        }
        if(page===maxPages)throw Error('County list exceeded complete scan limit');
        await new Promise(resolve=>setTimeout(resolve,250));
      }
    }catch(error){
      if(token!==revision||error.name==='AbortError')return;
      ready=false;pending=false;failed=true;paint();
      output.textContent='County counts could not be loaded completely ('+error.message+'). Texas host numbers remain valid. Try selecting the county again.';
    }
  }
  select.addEventListener('change',()=>{
    county=select.value;revision++;aborter?.abort();aborter=null;
    matchedIds=new Set();ready=false;pending=!!county;failed=false;
    try{localStorage.setItem('txlep-quick-county',county)}catch(_){}
    paint();
    if(!county){output.textContent='Showing all of Texas. Select a county to compare local observation evidence. The map and polygon tools are under Check My Area.';return}
    output.textContent='Loading '+county+' County butterfly and moth records…';
    loadCounty(county,revision);
  });
  try{const previous=localStorage.getItem('txlep-quick-county');if(counties.includes(previous))select.value=previous}catch(_){}
  if(select.value)select.dispatchEvent(new Event('change'));else{output.textContent='Showing all of Texas. County selection updates plant counts here; it does not open a map.';paint()}
}
