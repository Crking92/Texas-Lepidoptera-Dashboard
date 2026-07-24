(function(){
'use strict';
const TEXAS_COUNTIES=["Anderson","Andrews","Angelina","Aransas","Archer","Armstrong","Atascosa","Austin","Bailey","Bandera","Bastrop","Baylor","Bee","Bell","Bexar","Blanco","Borden","Bosque","Bowie","Brazoria","Brazos","Brewster","Briscoe","Brooks","Brown","Burleson","Burnet","Caldwell","Calhoun","Callahan","Cameron","Camp","Carson","Cass","Castro","Chambers","Cherokee","Childress","Clay","Cochran","Coke","Coleman","Collin","Collingsworth","Colorado","Comal","Comanche","Concho","Cooke","Coryell","Cottle","Crane","Crockett","Crosby","Culberson","Dallam","Dallas","Dawson","Deaf Smith","Delta","Denton","DeWitt","Dickens","Dimmit","Donley","Duval","Eastland","Ector","Edwards","Ellis","El Paso","Erath","Falls","Fannin","Fayette","Fisher","Floyd","Foard","Fort Bend","Franklin","Freestone","Frio","Gaines","Galveston","Garza","Gillespie","Glasscock","Goliad","Gonzales","Gray","Grayson","Gregg","Grimes","Guadalupe","Hale","Hall","Hamilton","Hansford","Hardeman","Hardin","Harris","Harrison","Hartley","Haskell","Hays","Hemphill","Henderson","Hidalgo","Hill","Hockley","Hood","Hopkins","Houston","Howard","Hudspeth","Hunt","Hutchinson","Irion","Jack","Jackson","Jasper","Jeff Davis","Jefferson","Jim Hogg","Jim Wells","Johnson","Jones","Karnes","Kaufman","Kendall","Kenedy","Kent","Kerr","Kimble","King","Kinney","Kleberg","Knox","Lamar","Lamb","Lampasas","La Salle","Lavaca","Lee","Leon","Liberty","Limestone","Lipscomb","Live Oak","Llano","Loving","Lubbock","Lynn","Madison","Marion","Martin","Mason","Matagorda","Maverick","McCulloch","McLennan","McMullen","Medina","Menard","Midland","Milam","Mills","Mitchell","Montague","Montgomery","Moore","Morris","Motley","Nacogdoches","Navarro","Newton","Nolan","Nueces","Ochiltree","Oldham","Orange","Palo Pinto","Panola","Parker","Parmer","Pecos","Polk","Potter","Presidio","Rains","Randall","Reagan","Real","Red River","Reeves","Refugio","Roberts","Robertson","Rockwall","Runnels","Rusk","Sabine","San Augustine","San Jacinto","San Patricio","San Saba","Schleicher","Scurry","Shackelford","Shelby","Sherman","Smith","Somervell","Starr","Stephens","Sterling","Stonewall","Sutton","Swisher","Tarrant","Taylor","Terrell","Terry","Throckmorton","Titus","Tom Green","Travis","Trinity","Tyler","Upshur","Upton","Uvalde","Val Verde","Van Zandt","Victoria","Walker","Waller","Ward","Washington","Webb","Wharton","Wheeler","Wichita","Wilbarger","Willacy","Williamson","Wilson","Winkler","Wise","Wood","Yoakum","Young","Zapata","Zavala"];
const LEPIDOPTERA_TAXON_ID=47157;
const COUNTY_CACHE_TTL=30*24*60*60*1000;
const countyState={county:'',placeId:null,mode:safeGet('txlep-county-mode')||'recorded',taxa:new Map(),recordIds:new Set(),matchedTaxa:0,returnedTaxa:0,fetchedAt:0,loading:false,source:'',stale:false};
const statewideHostSnapshot=new Map(hosts.map(h=>[h.genus,{establishedCount:h.establishedCount,totalCount:h.totalCount,topFamilies:[...(h.topFamilies||[])],examples:[...(h.examples||[])]}]));
const baseRecordsForHost=recordsForHost;
const baseApplyFilters=applyFilters;
const baseRenderTable=renderTable;
const baseRenderHosts=renderHosts;
const baseRenderHostCards=renderHostCards;
const baseRenderHostKpis=renderHostKpis;
const baseRenderFeaturedPlants=renderFeaturedPlants;
const baseRenderPlantSpotlight=renderPlantSpotlight;
const baseApplyResourceFilters=applyResourceFilters;
const baseRenderResourceTable=renderResourceTable;
const baseRenderResourceKpis=renderResourceKpis;
const baseOpenModal=openModal;
const baseMakePlantCollectionCard=makePlantCollectionCard;
const baseRenderGarden=renderGarden;
const baseRenderComparison=renderComparison;
const baseRenderCompareTable=renderCompareTable;
const binomialPattern=/\b([A-Z][A-Za-z-]+)\s+([a-z][A-Za-z-]+)\b/g;

function normalizeCounty(value){return String(value||'').trim().replace(/\s+county$/i,'').toLowerCase()}
function normalizeTaxon(value){const clean=String(value||'').replace(/[\[\](){}]/g,' ').replace(/\s+/g,' ').trim();const match=clean.match(/\b([A-Z][A-Za-z-]+)\s+([a-z][A-Za-z-]+)\b/);return match?`${match[1]} ${match[2]}`.toLowerCase():clean.split(' ').slice(0,2).join(' ').toLowerCase()}
function recordTaxonNames(record){if(record._countyTaxonNames)return record._countyTaxonNames;const names=new Set();const primary=normalizeTaxon(record.species);if(primary)names.add(primary);const source=`${record.species||''}; ${record.synonyms||''}`;let match;while((match=binomialPattern.exec(source))!==null)names.add(`${match[1]} ${match[2]}`.toLowerCase());binomialPattern.lastIndex=0;record._countyTaxonNames=[...names];return record._countyTaxonNames}
function countyMatch(record){if(!countyState.county||!countyState.taxa.size)return null;let best=null;for(const name of recordTaxonNames(record)){const hit=countyState.taxa.get(name);if(hit&&(!best||hit.count>best.count))best=hit}return best}
function countyActive(){return Boolean(countyState.county&&countyState.placeId&&countyState.fetchedAt)}
function recordInCounty(record){return Boolean(countyMatch(record))}
function countyRecordCount(record){const hit=countyMatch(record);return hit?hit.count:0}
function countyLabel(){return countyState.county?`${countyState.county} County`:'Texas statewide'}
function observationWord(count){return `${fmt.format(count)} research-grade ${count===1?'observation':'observations'}`}
function countySourceURL(taxonId=''){const params=new URLSearchParams({place_id:String(countyState.placeId||18),taxon_id:String(taxonId||LEPIDOPTERA_TAXON_ID),verifiable:'true',quality_grade:'research'});return `https://www.inaturalist.org/observations?${params.toString()}`}
function hostCountyRecords(genus){return (hostRecordMap.get(genus)||[]).filter(recordInCounty)}
function mostCommon(values,limit=3){const counts=new Map();values.forEach(v=>{if(v)counts.set(v,(counts.get(v)||0)+1)});return [...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,limit).map(([name])=>name)}
function updateHostDataset(){
  hosts.forEach(host=>{const saved=statewideHostSnapshot.get(host.genus);if(!saved)return;if(!countyActive()){host.establishedCount=saved.establishedCount;host.totalCount=saved.totalCount;host.topFamilies=[...saved.topFamilies];host.examples=[...saved.examples];return}const linked=hostCountyRecords(host.genus);host.establishedCount=linked.length;host.totalCount=linked.length;host.topFamilies=mostCommon(linked.map(r=>r.family));host.examples=linked.slice().sort((a,b)=>friendlyCommonName(a.common).localeCompare(friendlyCommonName(b.common))).slice(0,4).map(r=>r.species)});
}
function rerenderAll(){
  updateHostDataset();
  state.page=1;state.hostPage=1;state.resourcePage=1;
  applyFilters();renderHosts();renderHostKpis();renderFeaturedPlants();renderGarden();renderComparison();renderResourceKpis();applyResourceFilters();
  updateCountyUI();
}

recordsForHost=function(genus){const all=baseRecordsForHost(genus);return countyActive()?all.filter(recordInCounty):all};
const baseRandomSurpriseGenus=randomSurpriseGenus;
randomSurpriseGenus=function(){if(!countyActive())return baseRandomSurpriseGenus();const available=hosts.filter(h=>h.establishedCount>0).map(h=>h.genus),current=exactHostName($('hostSearch').value)||exactHostName($('hostGenusFilter').value),choices=available.filter(g=>g!==current),pool=choices.length?choices:available;return pool[Math.floor(Math.random()*Math.max(1,pool.length))]||baseRandomSurpriseGenus()};

applyFilters=function(){
  baseApplyFilters();
  if(countyActive()&&countyState.mode==='recorded'){
    state.filtered=state.filtered.filter(recordInCounty);
    const max=pageCount();if(state.page>max)state.page=Math.max(1,max);
    renderKpis();renderCharts();renderTable();renderPlantSpotlight('plantSpotlight',exactHostName($('hostGenusFilter').value));
  }
};

renderTable=function(){
  baseRenderTable();
  if(!countyActive())return;
  const start=(state.page-1)*state.pageSize,slice=state.filtered.slice(start,start+state.pageSize);
  [...$('resultsBody').querySelectorAll('tr')].forEach((row,index)=>decorateCountyResult(row,slice[index],true));
  const cards=$('resultsCards');if(cards)[...cards.querySelectorAll('.result-card')].forEach((card,index)=>decorateCountyResult(card,slice[index],false));
};
function decorateCountyResult(container,record,isTable){if(!record)return;const hit=countyMatch(record),badge=makeCountyBadge(record);if(isTable){const cell=container.lastElementChild;if(cell)cell.append(document.createElement('br'),badge)}else{const meta=container.querySelector('.result-card-meta');if(meta)meta.append(badge)}container.dataset.countyRecorded=hit?'true':'false'}
function makeCountyBadge(record){const hit=countyMatch(record);const badge=node('span','county-badge'+(hit?'':' not-recorded'),hit?`${countyState.county}: ${fmt.format(hit.count)} ${hit.count===1?'record':'records'}`:`No ${countyState.county} record found`);badge.title=hit?`Matched ${observationWord(hit.count)} in ${countyLabel()}. This does not prove local host use.`:`No matching research-grade iNaturalist record was found. This is not proof of absence.`;return badge}

renderHosts=function(){
  baseRenderHosts();
  if(countyActive()&&countyState.mode==='recorded'){
    state.filteredHosts=state.filteredHosts.filter(h=>h.establishedCount>0);
    if(state.hostPage>hostPageCount())state.hostPage=Math.max(1,hostPageCount());
    renderHostCards();renderPlantSpotlight('hostPlantSpotlight',exactHostName($('hostSearch').value));
  }
};
renderHostCards=function(){
  baseRenderHostCards();
  if(!countyActive())return;
  const start=(state.hostPage-1)*state.hostPageSize,slice=state.filteredHosts.slice(start,start+state.hostPageSize);
  [...$('hostGrid').querySelectorAll('.host-card')].forEach((card,index)=>{const host=slice[index];if(!host)return;const copy=card.querySelector('.host-card-top>div:last-child'),micro=copy&&copy.querySelector('.microcopy');if(micro)micro.textContent=`dashboard taxa recorded in ${countyLabel()}`;if(copy)copy.append(node('span','county-badge'+(host.establishedCount?'':' not-recorded'),host.establishedCount?`County-filtered host links`:`No county-linked taxa`));});
};
renderHostKpis=function(){
  if(!countyActive()){baseRenderHostKpis();return}
  const active=hosts.filter(h=>h.establishedCount>0).sort((a,b)=>b.establishedCount-a.establishedCount||a.genus.localeCompare(b.genus)),top=active[0];
  const establishedMatches=records.filter(r=>['established','both'].includes(r.statusKey)&&recordInCounty(r)).length;
  const data=[['Plant groups with county records',fmt.format(active.length),`Of ${fmt.format(hosts.length)} searchable host genera`],['Most-linked plant',top?top.genus:'—',top?`${fmt.format(top.establishedCount)} county-recorded dashboard taxa`:'No matched host links'],['Matched dashboard taxa',fmt.format(establishedMatches),`${countyLabel()} research-grade layer`],['iNaturalist taxa returned',fmt.format(countyState.returnedTaxa),'Includes taxa outside this dashboard']];
  $('hostKpis').replaceChildren(...data.map(([a,b,c])=>{const x=node('div','kpi');x.append(node('div','kpi-label',a),node('div','kpi-value',b),node('div','kpi-note',c));return x}));
};
renderFeaturedPlants=function(){baseRenderFeaturedPlants();if(!countyActive())return;$('featuredNativeGrid')?.querySelectorAll('.featured-native-card').forEach(card=>{const label=card.querySelector('.featured-stat span');if(label)label.textContent=`Recorded in ${countyState.county}`})};
renderPlantSpotlight=async function(targetId,genus){const requestedCounty=countyState.county;await baseRenderPlantSpotlight(targetId,genus);if(!countyActive()||requestedCounty!==countyState.county||!genus)return;const target=$(targetId);if(!target||target.hidden)return;const p=target.querySelector('.spotlight-head>div:first-child>p');if(p){const count=recordsForHost(genus).length;p.textContent=`${fmt.format(count)} dashboard butterfly and moth taxa linked to ${genus} also have matched research-grade records in ${countyLabel()}. The plant relationship itself may have been documented elsewhere.`}const copy=target.querySelector('.spotlight-head>div:first-child');if(copy&&!copy.querySelector('.county-badge'))copy.append(node('span','county-badge',`${countyLabel()} filter active`))};

applyResourceFilters=function(){baseApplyResourceFilters();if(countyActive()&&countyState.mode==='recorded'){state.filteredResources=state.filteredResources.filter(recordInCounty);const max=resourcePageCount();if(state.resourcePage>max)state.resourcePage=Math.max(1,max);renderResourceTable()}};
renderResourceTable=function(){baseRenderResourceTable();if(!countyActive())return;const start=(state.resourcePage-1)*state.resourcePageSize,slice=state.filteredResources.slice(start,start+state.resourcePageSize);[...$('resourceResultsBody').querySelectorAll('tr')].forEach((row,index)=>decorateCountyResult(row,slice[index],true));const cards=$('resourceResultsCards');if(cards)[...cards.querySelectorAll('.resource-result-card')].forEach((card,index)=>{const record=slice[index];if(record)card.append(makeCountyBadge(record))})};
renderResourceKpis=function(){if(!countyActive()){baseRenderResourceKpis();return}const all=records.filter(r=>(r.otherResources||[]).length&&recordInCounty(r)),count=type=>all.filter(r=>r.otherResources.includes(type)).length;const data=[['County-recorded resource rows',fmt.format(all.length),countyLabel()],['Detritus',fmt.format(count('Detritus')),'Matched dashboard rows'],['Fungi',fmt.format(count('Fungi')),'Matched dashboard rows'],['Algae',fmt.format(count('Algae')),'Matched dashboard rows'],['Lichens',fmt.format(count('Lichens')),'Matched dashboard rows'],['Family-only plants',fmt.format(count('Family-only plant record')),'Matched dashboard rows']];$('resourceKpis').replaceChildren(...data.map(([a,b,c])=>{const x=node('div','kpi');x.append(node('div','kpi-label',a),node('div','kpi-value',b),node('div','kpi-note',c));return x}))};

openModal=function(record){baseOpenModal(record);if(!countyActive())return;const body=$('modalBody'),chips=body.querySelector('.chips'),hit=countyMatch(record);if(chips)chips.append(makeCountyBadge(record));const summary=body.querySelector('.plain-summary');if(summary){const p=node('p','',hit?`${countyLabel()}: this dashboard record matched ${observationWord(hit.count)}. That supports county occurrence only; it does not show that caterpillars used the listed plant in this county.`:`No matching research-grade iNaturalist record was found for this taxon in ${countyLabel()}. Observation effort and identification limits mean that this is not proof of absence.`);summary.append(p);if(hit){const a=document.createElement('a');a.className='county-source-link';a.href=countySourceURL(hit.taxonId);a.target='_blank';a.rel='noopener';a.textContent='Review these county observations ↗';summary.append(a)}}};
makePlantCollectionCard=function(...args){const card=baseMakePlantCollectionCard(...args);if(countyActive()){const first=card.querySelector('.mini-metric span');if(first)first.textContent=`Recorded in ${countyState.county}`}return card};
renderGarden=function(){baseRenderGarden();if(!countyActive())return;const notes=$('gardenKpis')?.querySelectorAll('.kpi-note');if(notes&&notes[3])notes[3].textContent=notes[3].textContent.replace('Texas-range taxa',`${countyState.county} County taxa`)};
renderComparison=function(){baseRenderComparison();if(!countyActive())return;$('compareGrid')?.querySelectorAll('.compare-card').forEach(card=>{const first=card.querySelector('.mini-metric span');if(first)first.textContent=`Recorded in ${countyState.county}`});renderCompareTable([...new Set(comparePlants.filter(Boolean))])};
renderCompareTable=function(names){baseRenderCompareTable(names);if(countyActive()){const first=$('compareTableWrap')?.querySelector('tbody tr:first-child td:first-child');if(first)first.textContent=`Recorded in ${countyLabel()}`}};

function cleanPlaceName(place){return normalizeCounty(place&&place.name||'')}
async function fetchTexasCountyPlaces(){
  const cached=safeGet('txlep-texas-county-places-v1');if(cached){try{const parsed=JSON.parse(cached);if(parsed&&Date.now()-parsed.fetchedAt<90*24*60*60*1000&&Array.isArray(parsed.places))return parsed.places}catch(_){}}
  const texasId=await getTexasPlaceId(),places=[];for(let page=1;page<=4;page++){const params=new URLSearchParams({ancestor_id:String(texasId),place_type:'County',per_page:'200',page:String(page)});const response=await fetch(`https://api.inaturalist.org/v1/places?${params}`,{headers:{Accept:'application/json'}});if(!response.ok)throw new Error(`County place lookup returned ${response.status}`);const data=await response.json(),batch=data.results||[];places.push(...batch.map(p=>({id:p.id,name:p.name,display_name:p.display_name||p.name})));if(batch.length<200)break}if(places.length<200)throw new Error('The Texas county place list was incomplete');safeSet('txlep-texas-county-places-v1',JSON.stringify({fetchedAt:Date.now(),places}));return places
}
async function findCountyPlace(county){
  try{const places=await fetchTexasCountyPlaces(),target=normalizeCounty(county);const found=places.find(p=>cleanPlaceName(p)===target)||places.find(p=>cleanPlaceName(p).startsWith(target));if(found)return found}catch(_){ }
  const texasId=await getTexasPlaceId(),params=new URLSearchParams({q:`${county} County, Texas`,per_page:'30'}),response=await fetch(`https://api.inaturalist.org/v1/places/autocomplete?${params}`,{headers:{Accept:'application/json'}});if(!response.ok)throw new Error(`County search returned ${response.status}`);const data=await response.json(),target=normalizeCounty(county);const found=(data.results||[]).find(p=>cleanPlaceName(p)===target&&((p.ancestor_place_ids||[]).includes(texasId)||/texas/i.test(p.display_name||'')))||(data.results||[]).find(p=>cleanPlaceName(p)===target);if(!found)throw new Error(`${county} County was not found in iNaturalist`);return {id:found.id,name:found.name,display_name:found.display_name||found.name}
}
function cacheKey(county){return `txlep-county-occurrence-v1-${normalizeCounty(county).replace(/[^a-z0-9]+/g,'-')}`}
function readCountyCache(county,allowStale=false){const raw=safeGet(cacheKey(county));if(!raw)return null;try{const data=JSON.parse(raw);if(!data||!Array.isArray(data.taxa))return null;const stale=Date.now()-data.fetchedAt>COUNTY_CACHE_TTL;if(stale&&!allowStale)return null;return {...data,stale}}catch(_){return null}}
function writeCountyCache(county,data){const key=cacheKey(county);safeSet(key,JSON.stringify(data));let index=[];try{index=JSON.parse(safeGet('txlep-county-cache-index-v1')||'[]')}catch(_){}const ordered=[{key,at:Date.now()},...index.filter(x=>x.key!==key)];ordered.slice(6).forEach(item=>{try{localStorage.removeItem(item.key)}catch(_){}});safeSet('txlep-county-cache-index-v1',JSON.stringify(ordered.slice(0,6)))}
async function fetchCountyTaxa(placeId){
  const taxa=[],perPage=500;for(let page=1;page<=20;page++){const params=new URLSearchParams({place_id:String(placeId),taxon_id:String(LEPIDOPTERA_TAXON_ID),quality_grade:'research',verifiable:'true',rank:'species',include_ancestors:'false',per_page:String(perPage),page:String(page),order_by:'observations_count'});const response=await fetch(`https://api.inaturalist.org/v1/observations/species_counts?${params}`,{headers:{Accept:'application/json'}});if(!response.ok)throw new Error(`iNaturalist species list returned ${response.status}`);const data=await response.json(),batch=data.results||[];taxa.push(...batch.map(item=>({name:item.taxon&&item.taxon.name||'',count:Number(item.count)||0,taxonId:item.taxon&&item.taxon.id||null})).filter(item=>item.name));const total=Number(data.total_results)||taxa.length;if(taxa.length>=total||batch.length<perPage)break}return taxa
}
function installCountyData(county,data){countyState.county=county;countyState.placeId=Number(data.placeId);countyState.fetchedAt=Number(data.fetchedAt)||Date.now();countyState.stale=Boolean(data.stale);countyState.source=data.source||'iNaturalist';countyState.taxa=new Map((data.taxa||[]).map(item=>[normalizeTaxon(item.name),{name:item.name,count:Number(item.count)||0,taxonId:item.taxonId||null}]));countyState.returnedTaxa=countyState.taxa.size;countyState.recordIds=new Set(records.filter(recordInCounty).map(r=>r.id));countyState.matchedTaxa=countyState.recordIds.size;safeSet('txlep-selected-county',county);safeSet('txlep-county-mode',countyState.mode);$('countySearch').value=county;rerenderAll()}
async function loadCounty(county,{refresh=false}={}){
  county=String(county||'').trim().replace(/\s+county$/i,'');const canonical=TEXAS_COUNTIES.find(name=>normalizeCounty(name)===normalizeCounty(county));if(!canonical){setCountyStatus('Choose a county from the Texas list before applying the filter.','error');openCountyMenu();return}
  countyState.loading=true;setCountyStatus(`Loading research-grade butterfly and moth records for ${canonical} County…`,'loading');$('countyApply').disabled=true;$('countyRefresh').disabled=true;
  try{let cached=!refresh&&readCountyCache(canonical);if(cached){installCountyData(canonical,cached);return}if(!navigator.onLine){cached=readCountyCache(canonical,true);if(cached){installCountyData(canonical,cached);setCountyStatus(`Offline: using a saved ${canonical} County snapshot from ${formatDate(cached.fetchedAt)}.`);return}throw new Error('Internet access is needed the first time a county is loaded')}const place=await findCountyPlace(canonical),taxa=await fetchCountyTaxa(place.id),payload={placeId:place.id,fetchedAt:Date.now(),source:'iNaturalist',taxa};writeCountyCache(canonical,payload);installCountyData(canonical,payload)}catch(error){setCountyStatus(`County records could not be loaded: ${error&&error.message?error.message:error}`,'error')}finally{countyState.loading=false;$('countyApply').disabled=false;$('countyRefresh').disabled=false;updateCountyUI()}
}
function clearCounty(){countyState.county='';countyState.placeId=null;countyState.taxa=new Map();countyState.recordIds=new Set();countyState.matchedTaxa=0;countyState.returnedTaxa=0;countyState.fetchedAt=0;countyState.stale=false;safeSet('txlep-selected-county','');$('countySearch').value='';rerenderAll();setCountyStatus('Statewide mode is active. Choose a county when you want a more locally relevant list.')}
function formatDate(timestamp){try{return new Intl.DateTimeFormat('en-US',{dateStyle:'medium'}).format(new Date(timestamp))}catch(_){return 'an earlier date'}}
function setCountyStatus(message,type=''){$('countyStatus').className='county-status'+(type?` ${type}`:'');$('countyStatus').textContent=message}
function updateCountyUI(){
  const active=countyActive(),clear=$('countyClear'),refresh=$('countyRefresh'),source=$('countySourceLink'),scope=document.querySelector('.scope-note');clear.hidden=!active;refresh.hidden=!active;source.hidden=!active;if(active){source.href=countySourceURL();source.textContent=`Review ${countyLabel()} observations ↗`;const cacheNote=countyState.stale?' · saved snapshot may be older than 30 days':` · snapshot ${formatDate(countyState.fetchedAt)}`;setCountyStatus(`${countyLabel()} is active: ${fmt.format(countyState.matchedTaxa)} of ${fmt.format(records.length)} dashboard records matched ${fmt.format(countyState.returnedTaxa)} iNaturalist species${cacheNote}.`);if(scope){scope.classList.add('county-active');scope.innerHTML=`<strong>${countyLabel()} filter:</strong> Counts now mean dashboard taxa with matched research-grade iNaturalist county records. Host relationships may have been documented elsewhere.`}}else{source.hidden=true;if(scope){scope.classList.remove('county-active');scope.innerHTML='<strong>Statewide guide:</strong> Texas in this dashboard means the source range includes Texas. Choose a county above to add a research-grade observation filter.'}}
  let badge=$('countyMetadataBadge');if(active&&!badge){badge=document.createElement('span');badge.id='countyMetadataBadge';badge.className='badge';$('metadata').append(badge)}if(badge){badge.hidden=!active;badge.replaceChildren(node('span','',`${countyState.county} County:`),node('strong','',fmt.format(countyState.matchedTaxa)+' matched taxa'))}
}

function renderCountyMenu(){const query=normalizeCounty($('countySearch').value),matches=TEXAS_COUNTIES.filter(name=>!query||normalizeCounty(name).includes(query)),list=$('countyList');list.replaceChildren();$('countyMeta').textContent=`${fmt.format(matches.length)} of 254 Texas counties`;if(!matches.length){list.append(node('div','combo-empty','No Texas county matches that text.'));return}let letter='';matches.forEach(name=>{const first=name[0];if(first!==letter){letter=first;list.append(node('div','combo-letter',letter))}const option=node('button','combo-option',`${name} County`);option.type='button';option.setAttribute('role','option');option.setAttribute('aria-selected',normalizeCounty($('countySearch').value)===normalizeCounty(name)?'true':'false');option.addEventListener('pointerdown',event=>event.preventDefault());option.addEventListener('click',()=>{chooseCounty(name)});list.append(option)})}
function openCountyMenu(){renderCountyMenu();$('countyMenu').hidden=false;$('countySearch').setAttribute('aria-expanded','true')}
function closeCountyMenu(){$('countyMenu').hidden=true;$('countySearch').setAttribute('aria-expanded','false')}
function chooseCounty(name){$('countySearch').value=name;closeCountyMenu();$('countySearch').focus();loadCounty(name)}
function bindCountyUI(){
  $('countyMode').value=['recorded','context'].includes(countyState.mode)?countyState.mode:'recorded';
  $('countySearch').addEventListener('input',()=>{openCountyMenu()});$('countySearch').addEventListener('focus',openCountyMenu);$('countySearch').addEventListener('keydown',event=>{if(event.key==='Escape'){closeCountyMenu()}else if(event.key==='Enter'){event.preventDefault();loadCounty($('countySearch').value)}});$('countyToggle').addEventListener('click',()=>{$('countyMenu').hidden?openCountyMenu():closeCountyMenu();$('countySearch').focus()});$('countyApply').addEventListener('click',()=>loadCounty($('countySearch').value));$('countyRefresh').addEventListener('click',()=>loadCounty(countyState.county||$('countySearch').value,{refresh:true}));$('countyClear').addEventListener('click',clearCounty);$('countyMode').addEventListener('change',()=>{countyState.mode=$('countyMode').value;safeSet('txlep-county-mode',countyState.mode);if(countyActive())rerenderAll()});document.addEventListener('click',event=>{if(!$('countyCombo').contains(event.target))closeCountyMenu()});
}
function downloadCountyLines(lines,kind){const blob=new Blob(['\ufeff'+lines.join('\n')],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`texas_lepidoptera_${normalizeCounty(countyState.county).replace(/\s+/g,'-')}_${kind}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function exportCountyCSV(kind){
  if(kind==='garden'){
    const rows=filteredGardenInsectEntries();if(!rows.length)return;const columns=['Selected county','County research-grade observation count','Common name','Scientific name','Butterfly or moth type','Lepidoptera family','Saved plants connected to this record','Number of connected saved plants'];const lines=[columns.map(escCSV).join(',')];rows.forEach(({record:r,plants})=>{const hit=countyMatch(r);lines.push([countyLabel(),hit?hit.count:0,friendlyCommonName(r.common),r.species,friendlyCategory(r.category),r.family,plants.map(g=>POPULAR_HOST_NAMES[g]?`${POPULAR_HOST_NAMES[g]} (${g})`:g).join('; '),plants.length].map(escCSV).join(','))});downloadCountyLines(lines,kind);return
  }
  const rows=kind==='resources'?state.filteredResources:state.filtered;if(!rows.length)return;
  const baseColumns=['Selected county','County record status','County research-grade observation count','Common name','Scientific name','Butterfly or moth type','Lepidoptera family','Texas status'];
  const columns=kind==='resources'?[...baseColumns,'Other resource types','Original host/resource text','Host families/categories','Host notes','Host references']:[...baseColumns,'Parsed host genera','Host families','Host notes','Host references','Range justification'];
  const lines=[columns.map(escCSV).join(',')];rows.forEach(r=>{const hit=countyMatch(r),base=[countyLabel(),hit?'Recorded in selected county':'No matching county record found',hit?hit.count:0,friendlyCommonName(r.common),r.species,friendlyCategory(r.category),r.family,r.texasStatus];const extra=kind==='resources'?[(r.otherResources||[]).join('; '),r.hostGeneraRaw,r.hostFamilies,r.hostNotes,r.hostReferences]:[(r.hostGenera||[]).join('; '),r.hostFamilies,r.hostNotes,r.hostReferences,r.rangeJustification];lines.push([...base,...extra].map(escCSV).join(','))});downloadCountyLines(lines,kind)
}
function interceptCountyExports(){[['exportFiltered','species'],['exportTop','species'],['exportResources','resources'],['exportGardenInsects','garden']].forEach(([id,kind])=>$(id)?.addEventListener('click',event=>{if(!countyActive())return;event.preventDefault();event.stopImmediatePropagation();exportCountyCSV(kind)},true))}
function restoreCachedCounty(){const selected=safeGet('txlep-selected-county');if(!selected)return;const cached=readCountyCache(selected,true);if(cached)installCountyData(selected,cached);else $('countySearch').value=selected}

bindCountyUI();interceptCountyExports();updateCountyUI();restoreCachedCounty();
})();
