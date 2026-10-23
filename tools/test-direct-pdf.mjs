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
try {
 const context=await browser.newContext();await context.route(/https:\/\/(fonts\.googleapis|fonts\.gstatic)/,route=>route.abort());
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
 await page.goto(address);await page.locator('.sharedPlanStatusV340[data-state=saved]').waitFor({state:'attached'});
 await page.locator('#preview .eventCell').first().waitFor();
 await page.evaluate(()=>{
  const events=Array.from({length:48},(_,i)=>({uid:'pdf-test-'+i,date:'2026-10-'+(19+Math.floor(i/8)),from:'08:00',to:'09:00',title:'KontrolaPDF'+String(i).padStart(3,'0')+' Školní akce s podrobným popisem a víceřádkovým textem. '.repeat(2),person:'Nováková, Schollerová, Ondráčková, Křenková a Zemanová'}));
  saveManualEventsV308(events);mergeManualEventsV300();renderAll();
  saveSignatureTextV316('Mgr. Řehoř Šťastný');saveSignatureRoleV312('ředitel školy');saveInlineWeekNoteV310('Důležitá poznámka pro celý týden.');renderAll();
 });
 await page.evaluate(()=>{
  const cell=document.querySelector('#preview .eventCell[data-plan-row-key-v302*="pdf-test-0"]');
  cell.insertAdjacentHTML('beforeend','<br><span style="font-style:italic;color:#b02030">Kurzíva</span> <span style="font-style:italic;font-weight:700;text-decoration:underline">Tučná kurzíva</span>');
 });
 const before=await page.locator('#preview').textContent();
 const result=await page.evaluate(async()=>{
  const snapshot=createSchoolPrintSnapshot();const expected=snapshot.pages.length;snapshot.remove();
  const result=await generateSchoolPdf();const parsed=await PDFLib.PDFDocument.load(result.bytes);
  return {bytes:Array.from(result.bytes),pages:result.pages,actual:parsed.getPageCount(),expected,filename:result.filename,
   fontCount:parsed.getPages().reduce((n,page)=>n+(page.node.Resources()?.lookup(PDFLib.PDFName.of('Font'),PDFLib.PDFDict)?.keys().length||0),0)};
 });
 assert.equal(result.filename,'Týdenní plán 19.10.2026–25.10.2026.pdf','Název používá zvolený týden');
 assert.ok(result.pages>1);assert.equal(result.pages,result.expected);assert.equal(result.actual,result.expected);assert.ok(result.fontCount>0);
 assert.equal(Buffer.from(result.bytes).subarray(0,5).toString(),'%PDF-');
 const {writeFile}=await import('node:fs/promises');await writeFile('/tmp/plan-direct-test.pdf',Buffer.from(result.bytes));
 assert.equal(await page.locator('#preview').textContent(),before,'Export nemění obsah plánu');
 assert.equal(await page.locator('#schoolPrintRoot').count(),0,'Dočasné stránky se uklidí');
 for(const width of [1440,768,390]){
  await page.setViewportSize({width,height:900});
  assert.equal(await page.locator('#preview .eventCell').first().evaluate(el=>getComputedStyle(el.closest('tr')).display),'table-row');
  await page.locator('.directPdfV344').waitFor();
 }
 await page.setViewportSize({width:1440,height:900});
 const popupEvent=context.waitForEvent('page'),downloadEvent=page.waitForEvent('download');
 await page.locator('.directPdfV344').click();const popup=await popupEvent,download=await downloadEvent;
 assert.equal(download.suggestedFilename(),result.filename,'Skutečně stažený soubor má automatický název');
 await popup.waitForURL('blob:**',{timeout:30000});assert.equal(await page.locator('.outputPrintPdfV313').isVisible(),true);
 await popup.close();
 await page.locator('.outputPrintPdfV313').click();await page.locator('#schoolPrintRoot .printSheet').first().waitFor();
 assert.equal(await page.locator('#schoolPrintRoot .printSheet').count(),result.expected);
 await page.getByRole('button',{name:'Zavřít',exact:true}).click();
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await mobile.route(/https:\/\/(fonts\.googleapis|fonts\.gstatic)/,route=>route.abort());
 const phone=await mobile.newPage();await phone.goto(address);await phone.locator('#preview .eventCell').first().waitFor();
 assert.equal(await phone.locator('meta[name=viewport]').getAttribute('content'),'width=1040','Celá tabulka se vejde na telefon a dovolí přiblížení');
 assert.equal(await phone.locator('#preview .eventCell').first().evaluate(el=>getComputedStyle(el.closest('tr')).display),'table-row');
 await mobile.close();
 const crossYear=await page.evaluate(async()=>{
  document.getElementById('weekFrom').value='2026-12-28';document.getElementById('weekTo').value='2027-01-03';
  return (await generateSchoolPdf()).filename;
 });
 assert.equal(crossYear,'Týdenní plán 28.12.2026–03.01.2027.pdf','Název správně zachytí přelom roku');
 assert.deepEqual(errors,[]);
 console.log('Přímé vektorové PDF: '+result.pages+' stran, vložené fonty, A4, původní tabulka, otevření PDF i původní tisk fungují. Soubor /tmp/plan-direct-test.pdf');
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));sqlite.close();}
