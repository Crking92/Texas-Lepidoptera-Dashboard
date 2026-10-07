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


/* Quick county context is separate from the detailed Check My Area map scanner.
   UDELep host counts remain Texas-wide; county presence is iNaturalist evidence. */
function initCountyDiscovery(){
  const heroSearch=document.querySelector('.hero-search')||document.getElementById('heroHostSearchForm');
  if(!heroSearch||document.getElementById('countyQuickSelect'))return;
  const chooser=document.createElement('div');chooser.className='county-discovery';
  const label=document.createElement('label');label.htmlFor='countyQuickSelect';label.textContent='Explore by county';
  const select=document.createElement('select');select.id='countyQuickSelect';select.className='control';
  const counties=['Hays','Travis','Comal','Blanco','Caldwell','Guadalupe','Bexar','Kendall','Burnet','Gillespie','Llano','Kerr','Bandera','Medina','San Saba','Mason','Kimble','Sutton','Edwards','Real','Uvalde','McCulloch','Concho','Tom Green','Menard','Schleicher'];
  [['','All of Texas'],...counties.map(name=>[name,name+' County'])].forEach(([value,title])=>{const option=document.createElement('option');option.value=value;option.textContent=title;select.append(option)});
  const note=document.createElement('p');note.className='microcopy';note.textContent='Texas host totals stay visible. Choose a county to check local plant records from iNaturalist—these are not confirmed local caterpillar-host counts.';
  const output=document.createElement('div');output.id='countyQuickSummary';output.className='county-quick-summary';output.setAttribute('role','status');output.setAttribute('aria-live','polite');
  chooser.append(label,select,note,output);heroSearch.insertAdjacentElement('afterend',chooser);
  let revision=0,placeId=null,countyName='';
  const endpoint='https://api.inaturalist.org/v1/';
  const load=async(url)=>{const response=await fetch(url);if(!response.ok)throw Error('iNaturalist is temporarily unavailable');return response.json()};
  // UDELep rows are the host-association authority. Never infer a host from
  // county presence alone, and never count observations as unique species.
  function sourceSpeciesFor(genus){
    if(typeof records==='undefined'||!Array.isArray(records))return null;
    const exact=new Set(), plant=genus.toLowerCase();
    const scientific=/^[A-Z][a-z-]+\\s+[a-z][a-z-]+(?:\\s+.*)?$/;
    const plantFields=['host_genus','hostGenus','plant_genus','plantGenus','host_plant_genus','hostPlantGenus','host_plant','hostPlant'];
    const insectFields=['scientific_name','scientificName','species','species_name','speciesName','lepidoptera','lepidoptera_name','taxon_name','taxonName'];
    for(const row of records){
      if(!row||typeof row!=='object')continue;
      const plants=plantFields.map(k=>row[k]).filter(v=>typeof v==='string');
      if(!plants.some(v=>v.toLowerCase().split(/[,;|]/).some(x=>x.trim().split(/\\s+/)[0]===plant)))continue;
      const names=insectFields.map(k=>row[k]).filter(v=>typeof v==='string');
      names.forEach(name=>{const parts=name.trim().match(/^([A-Z][a-z-]+\\s+[a-z][a-z-]+)/);if(parts&&scientific.test(parts[1]))exact.add(parts[1].toLowerCase())});
    }
    return exact.size?exact:null;
  }
  async function countyLepidoptera(place,species,token){
    // iNaturalist Lepidoptera taxon ID. Page until complete or the safety cap.
    const matched=new Set(),limit=12;
    for(let page=1;page<=limit;page++){
      const url=endpoint+'observations/species_counts?place_id='+encodeURIComponent(place)+'&taxon_id=47157&quality_grade=research&per_page=500&page='+page;
      const data=await load(url);
      if(token!==revision)return null;
      for(const item of data.results||[]){
        const name=item.taxon?.name?.match(/^([A-Z][a-z-]+\\s+[a-z][a-z-]+)/)?.[1]?.toLowerCase();
        if(name&&species.has(name))matched.add(name);
      }
      if(page*500>=Number(data.total_results||0))return {count:matched.size,complete:true};
    }
    return {count:matched.size,complete:false};
  }
  async function update(){
    const token=++revision;
    if(!countyName){output.textContent='All of Texas · The plant cards show statewide UDELep host relationships. Check My Area remains your map and polygon tool.';return}
    output.textContent='Looking up local records…';
    try{
      if(!placeId){
        // iNaturalist often names counties without a "Texas" suffix.
        // Search the county name first, then prefer its explicit Texas ancestry.
        const places=await load(endpoint+'places/autocomplete?q='+encodeURIComponent(countyName+' County'));
        if(token!==revision)return;
        const normalized=countyName.toLowerCase()+' county';
        const candidates=(places.results||[]).filter(p=>String(p.name||'').trim().toLowerCase()===normalized);
        const inTexas=p=>/texas|(?:^|,\\s*)tx(?:$|,)/i.test([p.display_name,p.name,p.place_guess].filter(Boolean).join(' '))||
          (Array.isArray(p.ancestor_place_ids)&&p.ancestor_place_ids.includes(18));
        const match=candidates.find(inTexas)||(candidates.length===1?candidates[0]:null);
        if(!match){
          output.textContent=candidates.length>1
            ?'More than one county matched. Use Check My Area to select the Texas boundary.'
            :'Could not locate this county in iNaturalist right now. Please try again.';
          return;
        }
        placeId=match.id;
      }
      const input=document.getElementById('hostSearch')||document.querySelector('#heroHostSearchForm input');
      const query=(input?.value||'').trim();
      if(!query){output.textContent=countyName+' County selected. Search a host plant above to compare Texas-wide host relationships with county-documented butterflies and moths.';return}
      const genus=(typeof hosts!=='undefined'&&hosts.find(h=>h.genus.toLowerCase()===query.toLowerCase())?.genus)||query.split(/\\s+/)[0];
      const source=sourceSpeciesFor(genus);
      if(!source){output.textContent='Texas host totals are still shown on the plant cards. A reliable species-level UDELep crosswalk for '+genus+' was not found in the quick lookup; use Check My Area for a more detailed analysis.';return}
      const county=await countyLepidoptera(placeId,source,token);
      if(token!==revision||!county)return;
      output.textContent=genus+' · '+countyName+' County: '+county.count+(county.complete?'':' or more')+' UDELep-linked butterfly/moth species with Research Grade iNaturalist records here ('+(county.complete?'county result pages complete':'county result pages incomplete')+'). Texas-wide host potential remains separate on the plant cards. Local observation does not prove local host use.';
    }catch(e){if(token===revision)output.textContent='Local comparison could not load. Texas host totals remain available; the map scanner is unchanged.'}
  }
  select.addEventListener('change',()=>{countyName=select.value;placeId=null;update()});
  const form=document.getElementById('heroHostSearchForm');
  form?.addEventListener('submit',()=>{if(countyName)setTimeout(update,0)});
  const input=document.getElementById('hostSearch');
  input?.addEventListener('change',()=>{if(countyName)update()});
  update();
}
