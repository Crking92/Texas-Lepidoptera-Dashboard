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
  async function update(){
    const token=++revision;
    if(!countyName){output.textContent='Showing Texas-wide UDELep host relationships. Use Check My Area for a map, circles, and polygons.';return}
    output.textContent='Looking for county records…';
    try{
      if(!placeId){
        const places=await load(endpoint+'places/autocomplete?q='+encodeURIComponent(countyName+' County, Texas'));
        if(token!==revision)return;
        const match=(places.results||[]).find(p=>p.name&&p.name.toLowerCase().includes(countyName.toLowerCase())&&/texas|tx/i.test([p.display_name,p.name].join(' ')));
        if(!match){output.textContent='County boundary not confirmed. Use Check My Area to choose the correct named place.';return}
        placeId=match.id;
      }
      const input=document.getElementById('hostSearch')||document.querySelector('#heroHostSearchForm input');
      const query=(input?.value||'').trim();
      if(!query){output.textContent=countyName+' County selected. Search for a plant above to check its local observation evidence. Texas host totals remain unchanged.';return}
      const genus=(typeof hosts!=='undefined'&&hosts.find(h=>h.genus.toLowerCase()===query.toLowerCase())?.genus)||query.split(/\\s+/)[0];
      const data=await load(endpoint+'observations/species_counts?place_id='+encodeURIComponent(placeId)+'&taxon_name='+encodeURIComponent(genus)+'&per_page=1');
      if(token!==revision)return;
      const count=Number(data.total_results)||0;
      output.textContent=count?genus+': '+count+' observed taxa returned in '+countyName+' County by iNaturalist. This is a plant-occurrence indicator, not the number of Lepidoptera hosted here.':'No matching observed taxa returned for '+genus+' in '+countyName+' County. This does not mean the plant is absent.';
    }catch(e){if(token===revision)output.textContent='County records could not load. Texas host totals remain available; try again or use Check My Area.'}
  }
  select.addEventListener('change',()=>{countyName=select.value;placeId=null;update()});
  const form=document.getElementById('heroHostSearchForm');
  form?.addEventListener('submit',()=>{if(countyName)setTimeout(update,0)});
  const input=document.getElementById('hostSearch');
  input?.addEventListener('change',()=>{if(countyName)update()});
  update();
}
