const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:950},acceptDownloads:true});
 page.on('console',m=>{if(m.type()==='error')console.log('BROWSER ERROR:',m.text().slice(0,120))});
 page.on('download',d=>console.log('DOWNLOAD EVENT:',d.suggestedFilename()));
 const url='https://app.powerbigov.us/view?r=eyJrIjoiOGFlNWE3NmQtOTYwZi00MTQwLWI1MDMtYTllM2NlODAzNzMwIiwidCI6IjA2OTNiNWJhLTRiMTgtNGQ3Yi05MzQxLWYzMmY0MDBhNTQ5NCJ9';
 try{
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  console.log('HTTP STATUS:',response?.status(),'URL:',page.url());
  await page.waitForTimeout(16000);
  console.log('PAGE TITLE:',await page.title());
  console.log('FRAMES:',JSON.stringify(page.frames().map(f=>({url:f.url().slice(0,200),name:f.name()}))));
  console.log('BODY START:',(await page.locator('body').innerText({timeout:10000})).slice(0,7500));
  console.log('BUTTONS:',JSON.stringify((await page.locator('button').allTextContents()).slice(0,55)));
  console.log('DATA DOM:',(await page.locator('main').count()));
  await page.screenshot({path:'fws-beetool-probe.png',fullPage:false,timeout:20000});
 }catch(e){console.error('PROBE ERROR',String(e.stack||e))}
 finally{await browser.close()}
})().catch(err=>{console.error(err.stack);process.exit(1)});
