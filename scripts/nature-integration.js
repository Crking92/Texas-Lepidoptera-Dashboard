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
const beeFrame=document.getElementById('beeExplorer');beeFrame.addEventListener('load',syncBeeTheme);
document.getElementById('themeToggle').addEventListener('click',syncBeeTheme);
window.addEventListener('storage',event=>{if(event.key==='txlep-garden'){gardenPlants.clear();readStoredArray('txlep-garden').forEach(g=>gardenPlants.add(g));renderGarden();renderComparison()}});
renderGardenBeeConnections();renderCompareBeeConnections(comparePlants.filter(Boolean));

}
