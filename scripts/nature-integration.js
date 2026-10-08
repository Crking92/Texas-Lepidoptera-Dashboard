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

/* Plant-first bee discovery: separate Fowler pollen-specialist counts from
   Texas UDELep caterpillar hosts and iNaturalist county occurrences. */
function beePollenConnectionCount(genus){
  return new Set((BEE_HOST_INDEX[genus]||[]).map(item=>item.name)).size;
}
function initBeePlantVisibility(){
  const infoText='Source: Fowler pollen-specialist bee relationships for bees listed in Texas. These are not Hays County sightings or proof of local pollen collection.';
  const supported=genus=>beePollenConnectionCount(genus)>0;
  const details=(genus,event)=>{
    event?.stopPropagation();
    openBeePlant(genus);
  };
  function beeCountElement(genus,kind){
    const count=beePollenConnectionCount(genus),el=document.createElement('div');
    el.className='bee-pollen-metric '+kind;
    el.dataset.beeGenus=genus;
    el.title=infoText;
    const label=document.createElement('span');label.className='bee-pollen-label';
    if(count){
      const amount=document.createElement('strong');amount.textContent='🐝 '+count;
      label.textContent=' TX-listed pollen-specialist '+(count===1?'bee':'bees');
      el.append(amount,label);
    }else{
      label.textContent='🐝 No specialist-bee relationship listed in this source';
      el.classList.add('bee-pollen-unlisted');el.append(label);
    }
    return el;
  }
  function beeAction(genus){
    const button=document.createElement('button');
    button.type='button';button.className='button small bee-connection-action';
    button.textContent='Meet the bees →';
    button.title=infoText;
    button.addEventListener('click',event=>details(genus,event));
    return button;
  }
  function decorateHostCards(){
    document.querySelectorAll('#hostGrid .host-card').forEach(card=>{
      const genus=card.querySelector('.garden-toggle[data-genus]')?.dataset.genus||
                  card.querySelector('.host-name')?.textContent?.trim();
      if(!genus)return;
      const original=card.querySelector('.host-count'),copy=original?.parentElement;
      if(!original||!copy)return;
      let row=card.querySelector('.host-count-pair');
      if(!row){
        const label=original.nextElementSibling?.classList.contains('microcopy')?original.nextElementSibling:null;
        row=document.createElement('div');row.className='host-count-pair';
        const statewide=document.createElement('div');statewide.className='host-texas-metric';
        original.before(row);statewide.append(original);
        if(label){label.title=label.textContent;label.textContent='TX butterfly + moth hosts';statewide.append(label)}
        row.append(statewide);
      }else{
        const label=row.querySelector('.host-texas-metric .microcopy');
        if(label){label.title='Texas-range butterfly and moth taxa linked to this plant genus in UDELep';label.textContent='TX butterfly + moth hosts'}
      }
      if(!row.querySelector('.host-bee-metric')){
        const metric=document.createElement('div'),number=document.createElement('strong'),label=document.createElement('span');
        metric.className='host-bee-metric bee-pollen-metric';
        metric.title=infoText;
        const count=beePollenConnectionCount(genus);
        number.textContent=count?fmt.format(count):'—';
        label.className='bee-pollen-label';
        label.textContent=count?'TX specialist bees':'No bees listed';
        metric.setAttribute('aria-label',count?count+' Texas-listed pollen-specialist bees linked to '+genus:'No specialist bees listed for '+genus+' in the current source');
        metric.append(number,label);
        row.append(metric);
      }
      // The separate number button duplicates this column. Keep its click
      // handler so users can still open the full bee explorer.
      const buttons=[...card.querySelectorAll('.host-card-actions button')];
      const existing=buttons.find(button=>/^\d+ bee connections$/i.test(button.textContent.trim()));
      if(existing){existing.textContent='Meet the bees →';existing.title=infoText}
      if(supported(genus)&&!buttons.some(button=>/bee connections|meet the bees/i.test(button.textContent||''))){
        card.querySelector('.host-card-actions')?.append(beeAction(genus));
      }
    });
  }
  function decorateFeatured(){
    document.querySelectorAll('#featuredNativeGrid .featured-native-card').forEach(card=>{
      const genus=card.querySelector('.featured-native-name')?.textContent?.trim();
      if(!genus||card.querySelector('.bee-pollen-metric'))return;
      const metric=beeCountElement(genus,'bee-featured-metric');
      card.querySelector('.featured-native-stats')?.after(metric);
      if(supported(genus))card.querySelector('.featured-native-actions')?.append(beeAction(genus));
    });
  }
  function decorateCollections(){
    document.querySelectorAll('.collection-card,.compare-card').forEach(card=>{
      const genus=card.querySelector('.collection-name')?.textContent?.trim();
      if(!genus||card.querySelector('.bee-pollen-metric'))return;
      const metrics=card.querySelector('.collection-metrics');
      if(!metrics)return;
      metrics.append(beeCountElement(genus,'bee-collection-metric'));
      if(supported(genus))card.querySelector('.collection-actions')?.append(beeAction(genus));
    });
  }
  function decorateSpotlights(){
    ['hostPlantSpotlight','plantSpotlight'].forEach(id=>{
      const target=document.getElementById(id),genus=target?.dataset.genus;
      if(!target||!genus||!target.querySelector('.spotlight-head')||target.querySelector('.bee-pollen-metric'))return;
      const copy=target.querySelector('.spotlight-head>div');
      if(!copy)return;
      const count=beePollenConnectionCount(genus),extra=document.createElement('p');
      extra.className='bee-spotlight-note';
      extra.textContent=count?
        '🐝 '+count+' Texas-listed pollen-specialist '+(count===1?'bee is':'bees are')+' linked to '+genus+' in Fowler’s source (not county sightings).':
        '🐝 No pollen-specialist bee relationship is listed for this genus in the current source; this is not a measure of all bee visits.';
      extra.title=infoText;extra.classList.add('bee-pollen-metric');copy.append(extra);
      if(count)target.querySelector('.spotlight-actions')?.append(beeAction(genus));
    });
  }
  function decorateCompareTable(){
    const wrap=document.getElementById('compareTableWrap'),table=wrap?.querySelector('table');
    if(!table||table.querySelector('.bee-pollen-table-row'))return;
    const cells=[...table.querySelectorAll('thead th')].slice(1),row=document.createElement('tr');
    row.className='bee-pollen-table-row';
    const first=document.createElement('td');first.textContent='🐝 TX-listed pollen-specialist bees';first.title=infoText;row.append(first);
    cells.forEach(cell=>{
      const genus=cell.textContent.trim(),amount=document.createElement('td');
      const n=beePollenConnectionCount(genus);
      amount.textContent=n?String(n):'Not listed';
      row.append(amount);
    });
    table.querySelector('tbody')?.append(row);
  }
  // Plants appearing in the bee dataset but not in UDELep should still be
  // findable from the main plant search instead of disappearing altogether.
  const hostResults=document.getElementById('hostResultsPanel'),search=document.getElementById('hostSearch');
  let beeOnlyPanel=null;
  if(hostResults&&search){
    beeOnlyPanel=document.createElement('section');
    beeOnlyPanel.id='beeOnlyPlantMatches';beeOnlyPanel.className='bee-only-matches';beeOnlyPanel.hidden=true;
    beeOnlyPanel.setAttribute('aria-label','Additional pollen-specialist plant results');
    hostResults.insertAdjacentElement('afterend',beeOnlyPanel);
  }
  function renderBeeOnlyMatches(){
    if(!beeOnlyPanel||!search)return;
    const query=search.value.toLowerCase().trim();
    beeOnlyPanel.replaceChildren();
    if(query.length<2){beeOnlyPanel.hidden=true;return}
    const matched=Object.keys(BEE_HOST_INDEX).filter(genus=>
      !hosts.some(h=>h.genus===genus)&&
      (genus.toLowerCase().includes(query)||(POPULAR_HOST_NAMES[genus]||'').toLowerCase().includes(query))
    ).sort((a,b)=>beePollenConnectionCount(b)-beePollenConnectionCount(a)).slice(0,12);
    beeOnlyPanel.hidden=!matched.length;
    if(!matched.length)return;
    const heading=document.createElement('h3');heading.textContent='More plants with bee pollen connections';
    const explanation=document.createElement('p');explanation.className='microcopy';
    explanation.textContent='These plants have bee relationships in Fowler’s source but no matching Texas UDELep caterpillar-host genus in this dashboard. They are not zero-value plants.';
    const grid=document.createElement('div');grid.className='bee-only-grid';
    matched.forEach(genus=>{
      const card=document.createElement('article');card.className='bee-only-card';
      const title=document.createElement('strong');title.textContent=genus;
      const label=document.createElement('span');label.textContent='🐝 '+beePollenConnectionCount(genus)+' specialist bees';
      card.append(title,label,beeAction(genus));grid.append(card);
    });
    beeOnlyPanel.append(heading,explanation,grid);
  }
  let scheduled=false;
  function paint(){
    if(scheduled)return;
    scheduled=true;
    queueMicrotask(()=>{
      scheduled=false;
      decorateHostCards();
      decorateFeatured();
      decorateCollections();
      decorateSpotlights();
      decorateCompareTable();
    });
  }
  ['hostGrid','featuredNativeGrid','gardenGrid','gardenRecommendations','compareGrid',
   'compareTableWrap','hostPlantSpotlight','plantSpotlight'].forEach(id=>{
    const root=document.getElementById(id);
    if(root)new MutationObserver(paint).observe(root,{childList:true});
  });
  // Input and submit both update supplementary bee-only plant search results.
  if(search){
    search.addEventListener('input',()=>queueMicrotask(renderBeeOnlyMatches));
    document.getElementById('heroHostSearchForm')?.addEventListener('submit',()=>queueMicrotask(renderBeeOnlyMatches));
  }
  renderBeeOnlyMatches();
  paint();
}
function initCombinedSortAndBeeCredit(){
  const sorter=document.getElementById('hostSort'),results=document.getElementById('hostResultsPanel');
  if(!sorter||!results)return;
  if(!sorter.querySelector('option[value="both"]')){
    const option=document.createElement('option');
    option.value='both';option.textContent='Strongest for both 🦋🐝';
    sorter.append(option);
  }
  // Credit is visible on the main plant explorer, not buried inside the bee tab.
  if(document.getElementById('beeSourceMainCredit'))return;
  const source=document.createElement('p');
  source.id='beeSourceMainCredit';
  source.className='bee-source-main-credit';
  source.append('🐝 Specialist-bee relationships adapted from ');
  const link=document.createElement('a');
  link.href='https://jarrodfowler.com/bees_pollen.html';
  link.target='_blank';link.rel='noopener noreferrer';
  link.textContent='Jarrod Fowler (2020), Pollen Specialist Bees of the Central United States ↗';
  source.append(link,'. Bees are Texas-listed in that source; these are not Hays County sightings.');
  const note=document.createElement('p');
  note.id='jointSortExplanation';
  note.className='joint-sort-explanation';
  note.hidden=true;
  note.textContent='Strongest for both ranks plant genera by Texas-range caterpillar-host taxa × Texas-listed specialist-bee species. This helps find overlap between datasets, but is not a planting-value score or a claim that every species in the genus hosts every insect.';
  const update=()=>{note.hidden=sorter.value!=='both'};
  sorter.addEventListener('change',update);
  update();
  results.prepend(note);
  results.prepend(source);
}
function initNatureIntegration(){
initCombinedSortAndBeeCredit();
initCountyDiscovery();
initBeePlantVisibility();
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
      const genus=card.querySelector('.garden-toggle[data-genus]')?.dataset.genus||card.querySelector('.host-name')?.textContent?.trim();
      const original=card.querySelector('.host-count');if(!genus||!original)return;
      let row=card.querySelector('.host-count-pair');
      if(!row&&!county)return; // Bee layout creates the statewide + bee row.
      if(!row){
        const oldLabel=original.nextElementSibling?.classList.contains('microcopy')?original.nextElementSibling:null;
        row=document.createElement('div');row.className='host-count-pair';
        const statewide=document.createElement('div');statewide.className='host-texas-metric';
        original.before(row);statewide.append(original);if(oldLabel)statewide.append(oldLabel);
        row.append(statewide);
      }
      row.classList.toggle('has-county',Boolean(county));
      let local=row.querySelector('.host-county-metric');
      if(!county){local?.remove();return}
      if(!local){
        local=document.createElement('div');local.className='host-county-metric';
        local.append(document.createElement('strong'),document.createElement('span'));
        row.insertBefore(local,row.querySelector('.host-bee-metric'));
      }
      local.querySelector('strong').textContent=ready?fmt.format(countFor(genus)):pending?'…':'—';
      local.querySelector('span').textContent=county+' Co. observed';
      local.title='UDELep-linked butterflies and moths with Research Grade iNaturalist records in '+county+' County; this does not verify caterpillar feeding there.';
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
