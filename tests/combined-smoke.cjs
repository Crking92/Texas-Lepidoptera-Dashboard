const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
(async()=>{const server=http.createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.join(root,pathname==='/'?'index.html':pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return}const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json'};res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(data)})});await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.BEE_CHROMIUM_PATH});try{const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',route=>route.request().resourceType()==='script'?route.fulfill({contentType:'application/javascript',body:''}):route.request().resourceType()==='stylesheet'?route.fulfill({contentType:'text/css',body:''}):route.request().url().includes('api.inaturalist.org/v1/observations/species_counts')?route.fulfill({json:{results:[{taxon:{name:'Strymon melinus'}},{taxon:{name:'Antheraea polyphemus'}}],total_results:2}}):route.fulfill({json:{results:[],total_results:0}}));await page.addInitScript(()=>{if(!localStorage.getItem('txlep-garden'))localStorage.setItem('txlep-garden',JSON.stringify(['Helianthus','Quercus']));if(!localStorage.getItem('beeGarden'))localStorage.setItem('beeGarden',JSON.stringify(['Solidago','Salvia']));});await page.goto(`http://127.0.0.1:${server.address().port}/`);
const openTab=async name=>{
  const original=page.locator('#tab-'+name);
  if(await original.isVisible()){await original.click();return}
  const more=page.locator('#gardenMoreTools');
  if(!await more.evaluate(el=>el.open))await more.locator('summary').click();
  await more.locator('button[data-open-tab="'+name+'"]').click();
};
assert.equal(await page.locator('#gardenMoreTools summary').count(),1,'Advanced tools remain reachable from More tools');
assert.equal(await page.locator('#tab-hosts').isVisible(),true,'Explore remains a primary destination');
assert.equal(await page.locator('#tab-garden').isVisible(),true,'My Garden remains a primary destination');
assert.equal(await page.locator('#tab-local').isVisible(),true,'Check My Area remains a primary destination');
assert.equal(await page.locator('#tab-bees').isVisible(),false,'Bee explorer is preserved in More tools');
assert.equal(await page.locator('#gardenWelcome').count(),0,'No duplicate welcome panel before plant photos');assert.equal(await page.locator('#featuredNativeGrid .featured-native-card').count(),12);assert.equal(await page.locator('.garden-first-featured .garden-surprise-chip').count(),1,'Surprise discovery stays near the plant gallery');
assert.equal(await page.locator('#heroHostSearchForm .plant-id-assist').count(),0,'Identify this plant callout has been removed');
assert.equal(await page.locator('#heroHostSearchForm #hostSearch').count(),1,'Original plant search remains available');
assert.match(await page.locator('header.hero h1').innerText(),/Every plant has a story/);
assert.equal(await page.locator('#gardenAllPlantsDetails').evaluate(el=>el.open),false,'Full data explorer starts folded');
assert(await page.locator('#featuredNativeGrid .featured-native-card').first().isVisible(),'Photo-led featured plants appear without opening data');assert.equal(await page.locator('#featuredNativeGrid .featured-native-card').count(),12,'Twelve photo tiles should be available immediately');
assert.equal(await page.locator('#featuredNativeGrid').evaluate(grid=>getComputedStyle(grid).gridTemplateColumns.split(' ').length),6,'Desktop gallery shows six compact tiles per row');
assert.equal(await page.locator('#featuredNativeGrid .featured-native-card').first().locator('.featured-native-stats').isVisible(),false,'Dense tile hides the data until plant story opens');
const tileCounts=await page.locator('#featuredNativeGrid .featured-native-card').evaluateAll(tiles=>tiles.map(tile=>{
  const genus=tile.dataset.featuredGenus;
  const match=hosts.find(host=>host.genus===genus);
  const beeCount=new Set((BEE_HOST_INDEX[genus]||[]).map(bee=>bee.name)).size;
  const badges=tile.querySelectorAll('.featured-wildlife-counts>span');
  return {
    genus,
    butterfly:tile.querySelector('.featured-lep-count')?.textContent?.trim(),
    expectedButterfly:match?'🦋 '+fmt.format(match.establishedCount):null,
    bee:tile.querySelector('.featured-bee-count')?.textContent?.trim(),
    expectedBee:'🐝 '+(beeCount?fmt.format(beeCount):'—'),
    badgeCount:badges.length,
    badgeOrder:[...badges].map(el=>el.className),
    stackDirection:getComputedStyle(tile.querySelector('.featured-wildlife-counts')).flexDirection
  };
}));
assert.equal(tileCounts.length,12,'All twelve featured tiles show wildlife badges');
assert(tileCounts.every(tile=>tile.butterfly===tile.expectedButterfly&&tile.bee===tile.expectedBee&&tile.badgeCount===2),'Both tile numbers match their respective source indexes, with missing bees shown as a dash');
assert(tileCounts.every(tile=>tile.stackDirection==='column'&&tile.badgeOrder[0]==='featured-lep-count'&&tile.badgeOrder[1].includes('featured-bee-count')),'Tile badges stack butterfly above bee');
assert.equal(tileCounts.find(tile=>tile.genus==='Helianthus')?.bee,'🐝 72','Sunflower uses its confirmed specialist bee count');
assert.equal(tileCounts.find(tile=>tile.genus==='Quercus')?.bee,'🐝 —','Oak is not misrepresented as zero bees');
assert.equal(await page.locator('#featuredNativeGrid .featured-native-card').first().evaluate(tile=>getComputedStyle(tile,'::after').content),'none','No extra Explore text on the small tiles');
// Full master index: union of UDELep host genera and Jarrod Fowler's bee-linked genera.
assert.equal(await page.locator('#plantMasterListPanel').count(),1,'Separate A–Z plant master list exists');
assert.equal(await page.locator('#plantMasterListPanel').evaluate(el=>el.open),false,'A–Z index starts folded to preserve photo-first homepage');
assert.equal(await page.locator('.garden-first-featured .plant-master-shortcut').count(),1,'Photo gallery links directly to master list');
assert.equal(await page.locator('#gardenMoreTools [data-open-master]').count(),1,'More tools offers the same master list');
const combinedCount=await page.evaluate(()=>new Set([...hosts.map(h=>h.genus),...Object.keys(BEE_HOST_INDEX)]).size);
assert.equal(await page.locator('#plantMasterListPanel .garden-summary-count').innerText(),new Intl.NumberFormat('en-US').format(combinedCount)+' plant groups');
await page.locator('.garden-first-featured .plant-master-shortcut').click();
assert.equal(await page.locator('#plantMasterListPanel').evaluate(el=>el.open),true,'Plant A–Z shortcut opens index');
assert.equal(await page.locator('#plantMasterRows .plant-master-row').count(),60,'Render a small page rather than every row on iPhone');
assert(await page.locator('#plantMasterMeta').innerText().then(t=>t.includes(new Intl.NumberFormat('en-US').format(combinedCount))),'Visible master list count includes union of both datasets');
assert(await page.locator('#plantMasterRows .plant-master-common').evaluateAll(nodes=>{
  const names=nodes.map(el=>el.textContent);
  const known=names.filter(t=>t!=='Common name not listed');
  const collator=new Intl.Collator('en',{sensitivity:'base',numeric:true});
  return known.every((name,i)=>i===0||collator.compare(known[i-1],name)<=0);
}),'Default master list orders known common names alphabetically');
await page.locator('#plantMasterSort').selectOption('latin');
assert(await page.locator('#plantMasterRows .plant-master-latin').evaluateAll(nodes=>{
  const names=nodes.map(el=>el.textContent);
  const collator=new Intl.Collator('en',{sensitivity:'base',numeric:true});
  return names.every((name,i)=>i===0||collator.compare(names[i-1],name)<=0);
}),'Scientific-name ordering is alphabetical');
await page.locator('#plantMasterLetter').selectOption('S');
assert((await page.locator('#plantMasterRows .plant-master-latin').allTextContents()).every(name=>name.startsWith('S')),'Alphabet jump filters scientific names');
await page.locator('#plantMasterLetter').selectOption('');
await page.locator('#plantMasterSearch').fill('Helianthus');
assert.equal(await page.locator('#plantMasterRows .plant-master-row').count(),1,'Search finds exact genus');
assert.equal(await page.locator('#plantMasterRows .plant-master-row').first().locator('.plant-master-count').first().innerText(),'🦋 101');
assert.equal(await page.locator('#plantMasterRows .plant-master-row').first().locator('.plant-master-count').last().innerText(),'🐝 72');
await page.locator('#plantMasterSearch').fill('Quercus');
assert.equal(await page.locator('#plantMasterRows .plant-master-row').count(),1,'Oak genus can be found by scientific name');
assert.equal(await page.locator('#plantMasterRows .plant-master-row').first().locator('.plant-master-count').last().innerText(),'🐝 —','Unlisted bee relationships are a dash');
await page.locator('#plantMasterSearch').fill('');
await page.locator('#plantMasterSort').selectOption('common');
await page.locator('#plantMasterLoadMore').click();
assert.equal(await page.locator('#plantMasterRows .plant-master-row').count(),120,'Show-more reveals more alphabetical entries without a massive initial DOM');
await page.locator('#plantMasterSearch').fill('goldenrods');
assert.equal(await page.locator('#plantMasterRows .plant-master-row[data-genus="Solidago"]').count(),1,'Common-name search works');
await page.locator('#plantMasterRows .plant-master-row[data-genus="Solidago"]').click();
await page.waitForFunction(()=>document.querySelector('#hostPlantSpotlight')?.dataset.genus==='Solidago');
assert.equal(await page.locator('#view-hosts').evaluate(el=>el.classList.contains('active')),true,'Master list opens existing plant story');
await page.locator('#plantMasterListPanel').evaluate(el=>el.open=false);
await page.locator('#gardenMoreTools summary').click();
await page.locator('#gardenMoreTools [data-open-master]').click();
assert.equal(await page.locator('#plantMasterListPanel').evaluate(el=>el.open),true,'More tools can reopen master list');
await page.locator('#plantMasterListPanel').evaluate(el=>el.open=false);
await page.locator('#gardenAllPlantsDetails').evaluate(el=>el.open=true);
await page.locator('#hostGrid .host-card').first().waitFor();
assert.equal(await page.locator('#hostGrid .host-card').first().locator('.garden-toggle').getAttribute('data-genus'),'Quercus','Expected top Lepidoptera genus is oak');
assert.equal(await page.locator('#hostGrid .host-card').first().locator('.host-bee-metric strong').innerText(),'—','Missing specialist bee data must not display 0');
assert.match(await page.locator('#hostGrid .host-card').first().locator('.host-bee-metric').innerText(),/Specialist bees: not listed/);
assert.match(await page.locator('#beeSourceMainCredit').innerText(),/not that a plant has no bees/);
assert.match(await page.locator('#featuredNativeGrid .featured-native-card').filter({hasText:'Quercus'}).first().locator('.bee-featured-metric').innerText(),/Specialist bee data not listed/);
assert.equal(await page.locator('#countyQuickSelect option').first().innerText(),'All of Texas');await page.locator('#countyQuickSelect').selectOption('Hays');await page.locator('#hostGrid .host-card .host-county-metric strong').first().waitFor();await page.waitForFunction(()=>document.querySelector('.host-county-metric strong')?.textContent==='2',null,{timeout:6000});assert(await page.locator('#hostGrid .host-card .host-count').first().innerText().then(Boolean));assert.equal(await page.locator('#view-local').evaluate(el=>el.classList.contains('active')),false,'County dropdown must not open map');assert.deepEqual(await page.locator('#hostGrid .host-card').first().locator('.host-count-pair').evaluate(row=>[...row.children].map(x=>x.className)),['host-texas-metric','host-county-metric','host-bee-metric bee-pollen-metric bee-pollen-unlisted'],'County view should show exactly three ordered metrics');await page.locator('#countyQuickSelect').selectOption('');assert.equal(await page.locator('#hostGrid .host-count-pair.has-county').count(),0,'Reset removes county column');assert.equal(await page.locator('#hostGrid .host-card .host-bee-metric').first().count(),1,'Bee metric stays beside Texas hosts when county resets');assert.deepEqual(errors,[]);const sourceCount=await page.evaluate(()=>records.length);assert(sourceCount>1000);
assert.equal(await page.locator('#hostSort option[value="both"]').count(),1,'A combined Lepidoptera / specialist-bee sort option exists');
assert.equal(await page.locator('#beeSourceMainCredit a').getAttribute('href'),'https://jarrodfowler.com/bees_pollen.html','Jarrod Fowler original compilation linked');
assert.equal(await page.locator('#jointSortExplanation').isHidden(),true);
await page.locator('#hostSort').selectOption('both');
assert.equal(await page.locator('#jointSortExplanation').isVisible(),true);
const combinedOrder=await page.locator('#hostGrid .host-card .garden-toggle[data-genus]').evaluateAll(els=>els.slice(0,4).map(el=>el.dataset.genus));
assert.deepEqual(combinedOrder.slice(0,3),['Helianthus','Solidago','Salix'],'Joint sort must rank from source-based Lepidoptera x specialist-bee counts');
assert.equal(await page.locator('#hostGrid .host-card .host-bee-metric strong').first().innerText(),'72','Leading genus has linked specialist bees');
await page.locator('#hostSort').selectOption('alpha');
assert.equal(await page.locator('#jointSortExplanation').isHidden(),true,'Method explanation hides outside joint sort');
await page.locator('#hostSort').selectOption({index:0});await page.locator('#gardenAllPlantsDetails').evaluate(el=>el.open=false);
await page.locator('#featuredNativeGrid .featured-native-card').filter({hasText:'Helianthus'}).first().click();
await page.locator('#hostPlantSpotlight .garden-insect-teaser').waitFor();
assert.equal(await page.locator('#hostPlantSpotlight .garden-story-stats>div').count(),2,'Texas hosts and specialist bees are distinct when no county is selected');
assert.match(await page.locator('#hostPlantSpotlight .garden-story-lep strong').innerText(),/101/,'Sunflower story uses statewide host count');
assert.match(await page.locator('#hostPlantSpotlight .garden-story-bees-count strong').innerText(),/72/,'Sunflower story shows specialist bee count');
assert.equal(await page.locator('#hostPlantSpotlight .garden-story-more').evaluate(x=>x.open),false,'Research details start collapsed');
assert.equal(await page.locator('#hostPlantSpotlight .garden-insect-photo-tile').count(),4,'Four insect photo tiles lead into the insect detail');
assert.equal(await page.locator('#hostPlantSpotlight .garden-insect-photo-tile .taxon-thumb').count(),4);
assert.equal(await page.locator('#hostPlantSpotlight .garden-story-insect-action').count(),1);
assert.equal(await page.locator('#hostPlantSpotlight .garden-story-bees-action').count(),1);
assert.equal(await page.locator('#hostPlantSpotlight .garden-story-primary-actions .garden-toggle').count(),1);
await page.locator('#countyQuickSelect').selectOption('Hays');
await page.locator('#hostPlantSpotlight .garden-story-stats.has-county .garden-story-county strong').waitFor();
assert.equal(await page.locator('#hostPlantSpotlight .garden-story-stats>div').count(),3,'Selected county adds its own distinct observational count');
await page.waitForFunction(()=>/^\d+$/.test(document.querySelector('#hostPlantSpotlight .garden-story-county strong')?.textContent||''),null,{timeout:6000});
assert.match(await page.locator('#hostPlantSpotlight .garden-story-county span').innerText(),/Hays Co. seen/);
await page.locator('#countyQuickSelect').selectOption('');
assert.equal(await page.locator('#hostPlantSpotlight .garden-story-stats>div').count(),2,'County count vanishes when All Texas is restored');assert.equal(await page.locator('#hostPlantSpotlight .garden-try-another').count(),1,'Visitors can jump to another plant from its story');
assert.equal(await page.locator('#view-species').evaluate(el=>el.classList.contains('active')),false,'Opening a plant stays in the friendly story view');
await page.locator('#hostPlantSpotlight .garden-insect-photo-tile .taxon-thumb').first().click();
await page.locator('#modalBackdrop.open').waitFor();
assert.equal(await page.locator('#modalBody .technical-details').evaluate(el=>el.open),false,'Full insect research opens only on request');
await page.locator('#modalClose').click();await page.locator('#featuredNativeGrid .garden-bonus-tile[data-featured-genus="Heterotheca"]').click();
await page.waitForFunction(()=>document.querySelector('#hostPlantSpotlight')?.dataset.genus==='Heterotheca');
assert.equal(await page.locator('#view-species').evaluate(el=>el.classList.contains('active')),false,'Another small tile opens a plant story first');
await page.locator('#gardenAllPlantsDetails').evaluate(el=>el.open=true);await page.locator('#hostSearch').fill('');await page.evaluate(()=>{state.hostPage=1;renderHosts()});
await page.locator('#hostSearch').fill('sunflower');await page.locator('#heroHostSearchForm').evaluate(form=>form.requestSubmit());await page.locator('#hostGrid .host-card .host-bee-metric strong').first().waitFor();assert.equal(await page.locator('#hostGrid .host-card .host-bee-metric strong').first().innerText(),'72','Helianthus should display 72 specialist bees in the number row');assert.equal(await page.locator('#hostGrid .host-card .bee-pollen-strip').count(),0,'No extra bee number strip below the count row');await page.locator('#hostGrid .host-card button').filter({hasText:'Meet the bees'}).first().waitFor();await page.locator('#hostGrid .host-card button').filter({hasText:'Meet the bees'}).first().click();const frame=page.frameLocator('#beeExplorer');await frame.locator('#stats strong').first().waitFor(); await frame.locator('#modalTitle').waitFor();assert.equal(await frame.locator('#modalTitle').innerText(),'Helianthus');await frame.locator('.modal-close').click();assert.deepEqual(await frame.locator('#stats strong').allTextContents(),['329','6','178']);await openTab('garden');assert(await page.locator('#gardenBeeSummary').innerText().then(t=>t.includes('83 different bees')));assert.equal(await page.locator('#gardenBeePlants .shared-bee-plant').count(),4);assert(await page.locator('#gardenGrid .bee-collection-metric').count()>0,'Garden cards show bee metrics');await openTab('bees');await page.frames().find(f=>f.url().includes('/bees/')).evaluate(()=>openPlant('Salvia'));await frame.locator('#modalGarden').click();await page.waitForFunction(()=>!gardenPlants.has('Salvia'));await frame.locator('#modalGarden').click();await page.waitForFunction(()=>gardenPlants.has('Salvia'));await frame.locator('.modal-close').click();await openTab('compare');assert(await page.locator('#compareBeeSummary').innerText().then(t=>t.includes('Bee pollen connections')));assert.equal(await page.locator('.bee-pollen-table-row').count(),1,'Comparison table displays bee metrics');const beeOnly=await page.evaluate(()=>Object.keys(BEE_HOST_INDEX).find(genus=>!hosts.some(host=>host.genus===genus)));if(beeOnly){await openTab('hosts');await page.locator('#hostSearch').fill(beeOnly);await page.locator('#heroHostSearchForm').evaluate(form=>form.requestSubmit());await page.locator('#beeOnlyPlantMatches .bee-only-card').filter({hasText:beeOnly}).first().waitFor();assert(await page.locator('#beeOnlyPlantMatches').isVisible(),'Bee-only host results must remain discoverable from main search');await page.locator('#beeOnlyPlantMatches .bee-only-card button').first().click();await frame.locator('#modalTitle').waitFor();assert.equal(await frame.locator('#modalTitle').innerText(),beeOnly);await frame.locator('.modal-close').click()}await openTab('species');assert(await page.locator('#view-species').evaluate(el=>el.classList.contains('active')));await openTab('local');assert.equal(await page.locator('#localUseLocation').count(),1);assert.equal(await page.locator('#countyQuickSelect').count(),1);assert(await page.locator('#countyQuickSelect option').allTextContents().then(a=>a.includes('Hays County')&&a.includes('Comal County')));await openTab('hosts');await page.locator('#themeToggle').click();await openTab('bees');assert(await frame.locator('body').evaluate(el=>el.classList.contains('dark')));await page.locator('#themeToggle').click();await openTab('hosts');if(process.env.BEE_SCREENSHOTS)await page.screenshot({path:path.join(process.env.BEE_SCREENSHOTS,'combined-desktop.png'),fullPage:true});await page.setViewportSize({width:375,height:812});
assert.equal(await page.locator('#featuredNativeGrid').evaluate(grid=>getComputedStyle(grid).gridTemplateColumns.split(' ').length),3,'Phone gallery uses 3 small tiles across');
assert(await page.locator('#featuredNativeGrid').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'Photo tiles should not scroll sideways');
await page.locator('#plantMasterListPanel').evaluate(el=>el.open=true);
assert(await page.locator('#plantMasterRows').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'Master list rows fit 375px phone');
assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Master list does not create horizontal page overflow');
await page.locator('#plantMasterListPanel').evaluate(el=>el.open=false);

assert(await page.locator('#featuredNativeGrid .featured-native-card').first().evaluate(tile=>{
  const stack=tile.querySelector('.featured-wildlife-counts'),outer=tile.getBoundingClientRect(),inside=stack.getBoundingClientRect();
  return inside.left>=outer.left-1&&inside.right<=outer.right+1&&inside.top>=outer.top-1&&inside.bottom<=outer.bottom+1;
}),'Both stacked badges fit completely on a 375px phone tile');
await page.setViewportSize({width:340,height:740});
assert.equal(await page.locator('#featuredNativeGrid').evaluate(grid=>getComputedStyle(grid).gridTemplateColumns.split(' ').length),2,'Very narrow phone uses two tiles across');
await page.setViewportSize({width:375,height:812});await openTab('hosts');await page.locator('#hostSearch').fill('Solidago');await page.locator('#heroHostSearchForm').evaluate(form=>form.requestSubmit());await page.locator('#hostGrid .host-card').first().waitFor();await page.locator('#countyQuickSelect').selectOption('Hays');await page.locator('#hostGrid .host-count-pair.has-county').first().waitFor();assert.equal(await page.locator('#hostGrid .host-count-pair.has-county').first().evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),3,'Three metric columns remain visible on a phone');assert(await page.locator('#hostGrid .host-count-pair.has-county').first().evaluate(el=>el.scrollWidth<=el.clientWidth+1),'Three metrics should not overflow the row');await page.locator('#countyQuickSelect').selectOption('');for(const tab of ['hosts','garden','compare','bees','guide']){await openTab(tab);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow ${tab}`)}await openTab('hosts');if(process.env.BEE_SCREENSHOTS)await page.screenshot({path:path.join(process.env.BEE_SCREENSHOTS,'combined-mobile.png'),fullPage:true});await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await page.reload();assert.equal(await page.locator('#gardenAllPlantsDetails').evaluate(el=>el.open),false,'Offline version keeps simplified entry');await page.locator('#gardenAllPlantsDetails').evaluate(el=>el.open=true);await page.locator('#hostGrid .host-card').first().waitFor();assert.equal(await page.evaluate(()=>records.length),sourceCount);await openTab('bees');assert.equal(await frame.locator('#stats strong').first().innerText(),'329');assert.deepEqual(errors,[]);console.log('PASS combined: original records, common-name search, plant-to-bee link, shared garden, comparison, original tabs, synchronized theme, mobile layout, offline both modules')}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);process.exit(1)});
