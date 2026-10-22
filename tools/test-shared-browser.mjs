import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {onRequest} from '../functions/shared-plan.json.js';
import {createTestDatabase} from './shared-plan-test-db.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const {db,sqlite}=createTestDatabase();
const root=fileURLToPath(new URL('..',import.meta.url));
let unavailable=false,delayPatch=false,patchArrived;
const calendar='BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:calendar-shared-test\r\nDTSTART;VALUE=DATE:20261019\r\nDTEND;VALUE=DATE:20261020\r\nSUMMARY:Kalendářová porada\r\nEND:VEVENT\r\nEND:VCALENDAR';
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/shared-plan.json'){
   if(unavailable){res.writeHead(503,{'content-type':'application/json'});res.end('{"error":"Test výpadku"}');return;}
   const chunks=[];for await(const chunk of req)chunks.push(chunk);
   const request=new Request('http://'+req.headers.host+req.url,{method:req.method,headers:req.headers,body:req.method==='PATCH'?Buffer.concat(chunks):undefined});
   const response=await onRequest({request,env:{PLAN_DB:db}});if(req.method==='PATCH'&&delayPatch){patchArrived?.();await new Promise(resolve=>setTimeout(resolve,1000));}res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());return;
  }
  if(url.pathname==='/calendar.ics'){res.writeHead(200,{'content-type':'text/calendar'});res.end(calendar);return;}
  if(url.pathname==='/teachers.json'){res.writeHead(200,{'content-type':'application/json'});res.end('{"teachers":[],"source":"test"}');return;}
  const file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));
  if(!file.startsWith(root)){res.writeHead(403);res.end();return;}
  const contents=await readFile(file);const ext=path.extname(file);res.writeHead(200,{'content-type':({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.png':'image/png'})[ext]||'application/octet-stream'});res.end(contents);
 }catch(error){res.writeHead(500);res.end(String(error));}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const address=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,args:['--no-sandbox']});
const errors=[];
try{
 const a=await browser.newContext(),b=await browser.newContext();
 for(const context of [a,b])await context.route(/https:\/\/(fonts\.googleapis|fonts\.gstatic)/,route=>route.abort());
 const pageA=await a.newPage(),pageB=await b.newPage();
 for(const page of [pageA,pageB])page.on('pageerror',error=>errors.push(error.message));
 const manualKey='tydenni_plan_manual_events_v167__2026-W43';
 await pageA.addInitScript(({manualKey})=>{
  if(!localStorage.getItem('test-seeded')){
   localStorage.setItem(manualKey,JSON.stringify([{uid:'manual-shared-test',date:'2026-10-19',from:'08:00',to:'08:45',title:'Místní akce kolegyně',person:'Nováková'}]));
   localStorage.setItem('tydenni_plan_week_storage_migrated_v316','1');localStorage.setItem('test-seeded','1');
  }
 },{manualKey});
 const saved=page=>page.locator('.sharedPlanStatusV340[data-state=saved]').waitFor({state:'attached',timeout:15000});
 await Promise.all([pageA.goto(address),pageB.goto(address)]);await Promise.all([saved(pageA),saved(pageB)]);
 assert.equal(await pageA.locator('.sharedPlanStatusV340').isVisible(),false,'Po úspěšném načtení se nezobrazuje hláška o společném uložení');
 assert.equal(JSON.parse(sqlite.prepare('SELECT payload FROM shared_plan_state').get().payload)[JSON.stringify([manualKey,'manual-shared-test'])],undefined,'Staré místní údaje nepřepíšou společný plán');
 assert.ok(await pageA.evaluate(()=>!!localStorage.getItem('tydenni_plan_before_shared_v340')),'Původní místní data mají zálohu');
 assert.equal(await pageA.getByRole('button',{name:'Převést místní úpravy',exact:true}).count(),0,'Převodní tlačítko není dostupné ani při zachované místní záloze');
 await pageA.evaluate(({manualKey})=>{
  const backup=JSON.parse(localStorage.getItem('tydenni_plan_before_shared_v340'));
  saveManualEventsV308([...JSON.parse(backup[manualKey]),
   {uid:'manual-same-time-test',date:'2026-10-19',from:'08:00',to:'09:00',title:'Akce se stejným začátkem',person:'Krejčí'},
   {uid:'manual-all-day-sort-test',date:'2026-10-19',from:'',to:'',title:'Nová celodenní akce',person:'Nováková'}]);mergeManualEventsV300();renderAll();
 },{manualKey});await saved(pageA);
 await pageB.locator('#preview .eventCell').filter({hasText:'Místní akce kolegyně'}).waitFor({timeout:12000});
 const sharedOrder=page=>page.evaluate(()=>[...document.querySelectorAll('#preview .eventCell')].map(cell=>cell.textContent.trim()));
 let order=await sharedOrder(pageB);
 assert.ok(order.indexOf('Nová celodenní akce')<order.indexOf('Místní akce kolegyně'),'Dodatečně přidaná celodenní akce je před časovanými');
 const secondKey='2026-10-19||manual-same-time-test||manual';
 await pageA.locator('#preview .personCell[data-plan-row-key-v302="'+secondKey+'"]').focus();
 await pageA.locator('[data-row-order-key-v341="'+secondKey+'"][data-row-order-v341=up]').click();await saved(pageA);
 await pageB.waitForFunction(()=>{
  const titles=[...document.querySelectorAll('#preview .eventCell')].map(cell=>cell.textContent.trim());
  return titles.indexOf('Akce se stejným začátkem')<titles.indexOf('Místní akce kolegyně');
 },{},{timeout:12000});
 await pageB.locator('[data-row-order-key-v341="'+secondKey+'"][data-row-order-v341=reset]').click();await saved(pageB);
 await pageA.waitForFunction(()=>{
  const titles=[...document.querySelectorAll('#preview .eventCell')].map(cell=>cell.textContent.trim());
  return titles.indexOf('Místní akce kolegyně')<titles.indexOf('Akce se stejným začátkem');
 },{},{timeout:12000});
 const manualRow=page=>page.locator('#preview tr').filter({has:page.locator('[data-plan-row-key-v302="2026-10-19||manual-shared-test||manual"]')}).last();
 const title=page=>page.locator('#preview .eventCell[data-plan-row-key-v302="2026-10-19||manual-shared-test||manual"]');
 const person=page=>page.locator('#preview .personCell[data-plan-row-key-v302="2026-10-19||manual-shared-test||manual"]');
 async function edit(locator,text){await locator.fill(text);await locator.blur();}
 await edit(title(pageA),'Společně upravená akce');await saved(pageA);
 await pageB.waitForFunction(()=>document.querySelector('#preview .eventCell[data-plan-row-key-v302="2026-10-19||manual-shared-test||manual"]')?.textContent.includes('Společně upravená akce'),{},{timeout:12000});
 // Independent fields of the same row must both survive simultaneous updates.
 await Promise.all([edit(title(pageA),'Název od A'),edit(person(pageB),'Zodpovídá B')]);await Promise.all([saved(pageA),saved(pageB)]);
 await pageA.waitForFunction(()=>document.querySelector('#preview .personCell[data-plan-row-key-v302="2026-10-19||manual-shared-test||manual"]')?.textContent.includes('Zodpovídá B'),{},{timeout:12000});
 await pageB.waitForFunction(()=>document.querySelector('#preview .eventCell[data-plan-row-key-v302="2026-10-19||manual-shared-test||manual"]')?.textContent.includes('Název od A'),{},{timeout:12000});
 // Different proposals for the same field cannot overwrite each other silently.
 await Promise.all([edit(title(pageA),'Konflikt A'),edit(title(pageB),'Konflikt B')]);
 await Promise.race([pageA.locator('.sharedPlanStatusV340[data-state=conflict]').waitFor({timeout:12000}),pageB.locator('.sharedPlanStatusV340[data-state=conflict]').waitFor({timeout:12000})]);
 const loser=(await pageA.locator('.sharedPlanStatusV340').getAttribute('data-state'))==='conflict'?pageA:pageB;
 await loser.getByRole('button',{name:'Použít společnou verzi'}).click();await saved(loser);
 // Formatting, display options, notes and signature metadata also belong to the shared plan.
 await pageA.evaluate(()=>{
   localStorage.setItem('tydenni_plan_hide_weekend_v184','1');
   localStorage.setItem('tydenni_plan_hide_created_v184','0');
   localStorage.setItem('tydenni_plan_created_date_v336_2026-10-19','2026-10-18');
   localStorage.setItem('tydenni_plan_created_author_v337_2026-10-19','Společný autor');
   saveSignatureTextV316('Mgr. Sdílená Nováková');saveSignatureRoleV312('ředitelka školy');
   saveInlineWeekNoteV310('Společná poznámka pro všechny');
   saveJsonMapV300(PLAN_STYLE_STORE_V307,{'2026-10-19||manual-shared-test||manual':{person:{color:'#155a94'}}});
 });await saved(pageA);
 await pageB.waitForFunction(()=>document.querySelector('#preview .podpisFinal41Name')?.textContent==='Mgr. Sdílená Nováková',{},{timeout:12000});
 assert.ok(await pageB.locator('#preview .createdDateV184').textContent().then(text=>text.includes('18. 10. 2026')&&text.includes('Společný autor')));
 assert.ok(await pageB.locator('body').evaluate(el=>el.classList.contains('hideWeekendV184')&&!el.classList.contains('hideCreatedDateV184')));
 assert.equal(await person(pageB).evaluate(el=>getComputedStyle(el).color),'rgb(21, 90, 148)');
 assert.ok((await pageB.locator('#preview').textContent()).includes('Společná poznámka pro všechny'));
 // Reverting a field while its previous value is still in flight must also be saved.
 delayPatch=true;const arrived=new Promise(resolve=>{patchArrived=resolve;});
 await pageA.evaluate(()=>localStorage.setItem('tydenni_plan_created_author_v337_2026-10-19','Dočasný autor'));await arrived;
 await pageA.evaluate(()=>localStorage.setItem('tydenni_plan_created_author_v337_2026-10-19','Společný autor'));
 await saved(pageA);delayPatch=false;patchArrived=null;
 const authorId=JSON.stringify(['tydenni_plan_created_author_v337_2026-10-19']);
 assert.equal(JSON.parse(sqlite.prepare('SELECT payload FROM shared_plan_state').get().payload)[authorId],JSON.stringify('Společný autor'),'Vrácení změny během odesílání se zachová');
 // Offline changes are explicit and survive a page reload.
 await a.setOffline(true);await edit(title(pageA),'Změna po obnovení připojení');
 await pageA.locator('.sharedPlanStatusV340[data-state=error]').waitFor({timeout:15000});
 assert.ok(await pageA.evaluate(()=>Object.keys(localStorage).filter(key=>key.startsWith('tydenni_plan_shared_pending_v340_')).reduce((sum,key)=>sum+JSON.parse(localStorage.getItem(key)).length,0))>0);
 await a.setOffline(false);await pageA.reload();await saved(pageA);
 await pageB.waitForFunction(()=>document.querySelector('#preview .eventCell[data-plan-row-key-v302="2026-10-19||manual-shared-test||manual"]')?.textContent.includes('Změna po obnovení připojení'),{},{timeout:12000});
 // Shared rich text is treated as untrusted markup when rendered.
 const richId=JSON.stringify(['tydenni_plan_rich_html_v308__2026-W43','2026-10-19||manual-shared-test||manual','title']);
 const result=await fetch(address+'/shared-plan.json',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({changes:[{id:richId,before:null,after:JSON.stringify('<img src=x onerror="window.sharedXss=true"><span style="font-weight:850">Bezpečný text</span>')}]})});assert.equal(result.status,200);
 await pageB.waitForFunction(()=>document.querySelector('#preview .eventCell[data-plan-row-key-v302="2026-10-19||manual-shared-test||manual"]')?.textContent.includes('Bezpečný text'),{},{timeout:12000});
 assert.equal(await pageB.evaluate(()=>window.sharedXss),undefined);assert.equal(await title(pageB).locator('img').count(),0);
 // A completely new reader sees the same plan without importing anything.
 const c=await browser.newContext();await c.route(/https:\/\/(fonts\.googleapis|fonts\.gstatic)/,route=>route.abort());const pageC=await c.newPage();pageC.on('pageerror',error=>errors.push(error.message));await pageC.goto(address);await saved(pageC);await title(pageC).filter({hasText:'Bezpečný text'}).waitFor();
 assert.equal(await pageC.getByRole('button',{name:'Převést místní úpravy',exact:true}).count(),0,'Nový čtenář nemá falešnou místní zálohu');
 await pageC.reload();await saved(pageC);assert.equal(await pageC.getByRole('button',{name:'Převést místní úpravy',exact:true}).count(),0,'Po reloadu se společná data nepovažují za stará místní data');
 // An unavailable shared store never masquerades as a successfully saved local plan.
 unavailable=true;await pageC.reload();await pageC.locator('.sharedPlanStatusV340[data-state=error]').waitFor();assert.ok(await pageC.locator('body').evaluate(el=>el.classList.contains('sharedPlanLoadingV340')));unavailable=false;
 await pageC.getByRole('button',{name:'Zkusit znovu'}).click();await saved(pageC);
 // Queues belonging to other tabs remain available for explicit recovery.
 await pageC.evaluate(()=>{
  const key='tydenni_plan_created_author_v337_2026-10-19',id=JSON.stringify([key]);
  localStorage.setItem('tydenni_plan_shared_pending_v340_closed-window',JSON.stringify([{id,before:JSON.stringify('Společný autor'),after:JSON.stringify('Obnovený autor')} ]));
 });
 await pageC.getByRole('button',{name:'Obnovit neodeslané změny'}).waitFor({timeout:10000});await pageC.getByRole('button',{name:'Obnovit neodeslané změny'}).click();
 await pageC.getByRole('button',{name:'Převzít změny'}).click();await saved(pageC);
 await pageB.waitForFunction(()=>document.querySelector('#preview .createdDateV184')?.textContent.includes('Obnovený autor'),{},{timeout:12000});
 for(const width of [1440,1024,390]){
  await pageC.setViewportSize({width,height:900});
  const fit=await pageC.evaluate(()=>{
   const paper=document.getElementById('pdfArea').getBoundingClientRect();
   const buttons=[...document.querySelectorAll('#preview .planRowChangeToolsV304>button')];
   return {count:buttons.length,inside:buttons.every(button=>{const rect=button.getBoundingClientRect();return rect.left>=paper.left+4&&rect.right<=paper.right-8;}),overflow:getComputedStyle(document.querySelector('.previewShell')).overflowX};
  });
  assert.ok(fit.count>0&&fit.inside,'Ikony jsou uvnitř bílé plochy při šířce '+width);
  assert.equal(fit.overflow,'auto');
 }
 assert.deepEqual(errors,[]);
 console.log('Dva nezávislé prohlížeče + nový čtenář: zachování místní zálohy bez převodního tlačítka, sdílení, souběžné úpravy, konflikt, výpadek, opakované otevření a bezpečné HTML: OK');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));sqlite.close();}
