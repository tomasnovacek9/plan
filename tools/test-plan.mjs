import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const core = readFileSync('src/scripts/legacy/00-app-core.js', 'utf8');
const sorting = core.slice(core.indexOf('function prioritizeRepeatedAllDayV326'), core.indexOf('function renderPreview(){'));
const ctx = vm.createContext({
  planRowKeyV302: (e, date, index) => `${e.id}:${index}`,
  planCellValueV302: (key, field, value) => key === 'edited:3' ? 'celý den' : value,
  timePlainV302: e => e.from || 'celý den'
});
vm.runInContext(sorting, ctx);
const events = [{id:'single'}, {id:'timed',from:'08:00'}, {id:'repeat'}, {id:'edited',from:'10:00'}];
const items = events.map((event, originalIndex) => ({event, originalIndex}));
ctx.prioritizeRepeatedAllDayV326(items, '2026-10-19', new Map(events.slice(2).map(e => [e, true])));
assert.deepEqual(items.map(x=>x.event.id), ['repeat','edited','single','timed']);
assert.deepEqual(items.map(x=>x.originalIndex), [2,3,0,1]);
console.log('Řazení opakovaných celodenních akcí a zachování klíčů: OK');

const chrome = process.env.CHROME_BIN;
if (!chrome) {
  console.log('Pro test stránkování nastav CHROME_BIN na Chrome/Chromium.');
  process.exit(0);
}
const css = ['src/styles/legacy/bundle.css','src/styles/pro-redesign.css','src/styles/print-plan.css'].map(f=>readFileSync(f,'utf8')).join('\n');
const js = readFileSync('src/scripts/print-plan.js','utf8');
const test = `
const failures=[];let checks=0;
function check(ok,msg){checks++;if(!ok)failures.push(msg);}
function scenario(name,counts,long=false){
 const source=document.createElement('div');source.id='preview';
 let n=0;
 source.innerHTML='<div class="docHeader"><div><div class="docSchoolFullV93">Základní škola</div><div class="docTitle">TÝDENNÍ PLÁN</div><div class="docDates">19.–25. 10. 2026</div></div></div><table class="planTable"><colgroup><col class="dateColV308"><col class="timeColV308"><col class="eventColV308"><col class="personColV308"></colgroup><thead><tr><th>Datum</th><th>Hodina</th><th>Akce</th><th>Zodpovídá</th></tr></thead><tbody>'+counts.map((count,day)=>Array.from({length:count},(_,r)=>'<tr class="repeatedEventV50 repeatColorV50-'+(day%6+1)+'">'+(r===0?'<td class="dayCell" rowspan="'+count+'"><div class="dayName">Den '+day+'</div><div class="dayDate">19. 10.</div></td>':'')+'<td class="timeCell">08:00–09:00</td><td class="eventCell" data-test-id="'+(n++)+'">'+(long?'Dlouhý název školní akce a podrobný popis. '.repeat(5):'Školní akce')+'</td><td class="personCell">Nováková</td></tr>').join('')).join('')+'</tbody></table><div class="planNoteWrapV310">Důležitá poznámka k týdnu.</div><div class="podpisFinal41">Ředitel školy</div>';
 const shell=document.createElement('div');shell.className='previewPage';shell.append(source);document.body.append(shell);
 const root=document.createElement('div');root.id='schoolPrintRoot';root.innerHTML='<div class="printSheets"></div>';document.body.append(root);
 const pages=buildSchoolPrintPages(source,root.firstChild);
 check(name==='krátký'?pages.length===1:pages.length>1,name+': stránkování');
 check(root.querySelectorAll('[data-test-id]').length===n,name+': všechny akce zachovány');
 for(const original of source.querySelectorAll('.eventCell')){
   const clone=root.querySelector('[data-test-id="'+original.dataset.testId+'"]');
   for(const property of ['backgroundColor','fontSize','fontWeight','color'])check(getComputedStyle(original)[property]===getComputedStyle(clone)[property],name+': zachovaný vzhled '+property);
   check(clone.nextElementSibling.textContent===original.nextElementSibling.textContent,name+': zachovaná osoba');
 }
 check(root.querySelectorAll('.printPageNumberV328').length===pages.length,name+': číslo na každé straně');
 check(pages.at(-1).querySelector('.printPageNumberV328').textContent==='Strana '+pages.length+' z '+pages.length,name+': správný celkový počet');
 for(const page of pages){
 check(page.querySelectorAll('.eventCell').length>0,name+': stránka obsahuje akce');
 check(page.querySelector('.printFlow').getBoundingClientRect().height<=parseFloat(getComputedStyle(page).height)-29,name+': obsah se vejde na A4');
 }
 check(root.querySelectorAll('.planNoteWrapV310').length===1,name+': poznámka zachována');
 check(root.querySelectorAll('.podpisFinal41').length===1,name+': podpis zachován');
 if(counts[0]>35){check(root.querySelector('.printDayContinuesV335'),name+': první část označuje pokračování');check(!pages.at(-1).querySelector('.printDayContinuesV335'),name+': poslední část bez dalšího pokračování');}

 check(root.querySelectorAll('.docHeader').length===1,name+': hlavička pouze na první stránce');
 check(pages[0].querySelector('.docHeader'),name+': první stránka má hlavičku');
 for(const page of pages.slice(1))check(!page.querySelector('.docHeader'),name+': další stránka bez hlavičky');
 shell.remove();root.remove();
}
try{scenario('krátký',[2,2,2,2,2]);scenario('hustý',[10,12,9,10,8],true);scenario('dlouhý den',[60,2,2]);}catch(e){failures.push(e.stack);}
document.head.innerHTML='';document.body.innerHTML='<pre id="test-result">'+JSON.stringify({checks,failures})+'</pre>';
`;
const dir = mkdtempSync(path.join(tmpdir(),'plan-print-test-'));
const fixture = path.join(dir,'test.html');
writeFileSync(fixture, `<!doctype html><meta charset="utf-8"><style>${css}</style><script>${js}</script><body><script>${test}</script>`);
const result = spawnSync(chrome, ['--headless','--no-sandbox','--disable-gpu',`--user-data-dir=${dir}/profile`,'--dump-dom',`file://${fixture}`],{encoding:'utf8',timeout:60000,maxBuffer:1024*1024*4});
const match = result.stdout?.match(/<pre id="test-result">([^<]+)<\/pre>/);
if (!match) throw new Error(`Test prohlížeče nedoběhl: ${result.error || result.stderr?.slice(-1200)}`);
const report = JSON.parse(match[1].replaceAll('&gt;', '>').replaceAll('&lt;', '<').replaceAll('&amp;', '&'));
console.log(JSON.stringify(report,null,2));
assert.equal(report.failures.length,0,'Selhal test stránkování');
