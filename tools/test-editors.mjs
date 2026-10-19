import { readFileSync,writeFileSync,mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const chrome=process.env.CHROME_BIN;
if(!chrome) throw new Error('Nastav CHROME_BIN na Chrome nebo Chromium.');
let html=readFileSync('index.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<link\b[^>]*>/g,'');
const css=['src/styles/legacy/bundle.css','src/styles/pro-redesign.css','src/styles/editors.css','src/styles/print-plan.css'].map(f=>readFileSync(f,'utf8')).join('\n');
html=html.replace('</head>',`<base href="${new URL('../',import.meta.url).href}"><style>${css}</style></head>`);
const core=readFileSync('src/scripts/legacy/00-app-core.js','utf8');
const print=readFileSync('src/scripts/print-plan.js','utf8');
const test=`
window.addEventListener('load',()=>setTimeout(()=>{
 const failures=[];let checks=0;
 const check=(ok,msg)=>{checks++;if(!ok)failures.push(msg)};
 const change=el=>el.dispatchEvent(new Event('change',{bubbles:true}));
 const click=selector=>document.querySelector(selector).click();
 const time=()=>document.querySelector('#preview [data-plan-field-v302="time"]');
 const title=()=>document.querySelector('#preview .eventCell');
 const person=()=>document.querySelector('#preview .personCell');
 try{
 localStorage.clear();document.getElementById('weekFrom').value='2026-10-19';document.getElementById('weekTo').value='2026-10-25';
 events=[{id:'test',uid:'test',date:'2026-10-19',from:'08:00',to:'08:45',title:'Porada pedagogů',person:'Nováková',source:'calendar'}];renderAll();
 showTimeChoicePopoverV307(time());const pop=document.querySelector('.timeChoicePopoverV307');
 const from=pop.querySelector('[data-time-direct-v323="from"]'),to=pop.querySelector('[data-time-direct-v323="to"]');
 const before=time().textContent;
 from.value='08:07';to.value='09:13';change(from);change(to);
 check(time().textContent===before,'Změna návrhu neukládá čas');
 to.value='07:00';change(to);check(pop.querySelector('[data-time-save-v327]').disabled,'Neplatný rozsah nelze uložit');
 click('[data-editor-close-v327]');check(time().textContent===before,'Zrušení zachová čas');
 showTimeChoicePopoverV307(time());from.value='08:07';to.value='09:13';change(from);change(to);click('[data-time-save-v327]');
 check(time().textContent==='08:07 - 09:13','Libovolné minuty se uloží přesně');
 showTimeChoicePopoverV307(time());click('[data-time-mode-v307="lesson"]');
 pop.querySelector('[data-lesson-list-v307="from"]').value='2';pop.querySelector('[data-lesson-list-v307="to"]').value='4';change(pop.querySelector('[data-lesson-list-v307="from"]'));
 click('[data-time-save-v327]');check(time().textContent==='08:55 - 11:40','Rozsah hodin dopočítá čas');
 showTimeChoicePopoverV307(time());
 const timeColor=pop.querySelector('[data-time-color-v330="time"]'),lessonColor=pop.querySelector('[data-time-color-v330="lesson"]');
 timeColor.value='#b91c1c';timeColor.dispatchEvent(new Event('input',{bubbles:true}));lessonColor.value='#047857';lessonColor.dispatchEvent(new Event('input',{bubbles:true}));
 check(getComputedStyle(time()).color!=='rgb(185, 28, 28)','Návrh barvy se neukládá před potvrzením');
 click('[data-time-save-v327]');
 check(getComputedStyle(time()).color==='rgb(185, 28, 28)','Barva času překoná původní styly');
 check(getComputedStyle(document.querySelector('#preview [data-plan-field-v302="lesson"]')).color==='rgb(4, 120, 87)','Vyučovací hodiny mají vlastní barvu');
 renderPreview();check(getComputedStyle(time()).color==='rgb(185, 28, 28)','Barva času zůstane po překreslení');
 const printRoot=document.createElement('div');printRoot.id='schoolPrintRoot';const sheets=document.createElement('div');sheets.className='printSheets';printRoot.append(sheets);document.body.append(printRoot);
 buildSchoolPrintPages(document.getElementById('preview'),sheets);
 check(getComputedStyle(sheets.querySelector('[data-plan-field-v302="time"]')).color==='rgb(185, 28, 28)','Barva času přejde do tisku a PDF');
 check(getComputedStyle(sheets.querySelector('[data-plan-field-v302="lesson"]')).color==='rgb(4, 120, 87)','Barva hodin přejde do tisku a PDF');
 printRoot.remove();

 showTimeChoicePopoverV307(time());check(timeColor.value==='#b91c1c'&&lessonColor.value==='#047857','Editor obnoví uložené barvy');
 timeColor.value='#155a94';change(timeColor);pop.querySelector('[data-editor-close-v327]').click();
 check(getComputedStyle(time()).color==='rgb(185, 28, 28)','Zrušení neuloží novou barvu');
 showTimeChoicePopoverV307(time());click('[data-time-color-default-v330="time"]');click('[data-time-color-default-v330="lesson"]');click('[data-time-save-v327]');
 check(!time().style.color,'Výchozí barva času se obnoví');
 check(!document.querySelector('#preview [data-plan-field-v302="lesson"]').style.color,'Výchozí barva hodin se obnoví');

 showTimeChoicePopoverV307(time());click('[data-time-mode-v307="lesson"]');click('[data-lesson-preset-v327="0,0"]');click('[data-time-save-v327]');
 check(time().textContent==='07:10 - 07:55','Nultá hodina funguje');
 showTimeChoicePopoverV307(time());click('[data-time-mode-v307="allDay"]');click('[data-time-save-v327]');check(time().textContent==='celý den','Celodenní akce se uloží');
 showTimeChoicePopoverV307(time());check(pop.querySelector('[data-time-mode-v307="allDay"]').classList.contains('active'),'Celodenní režim se obnoví');
 pop.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));check(pop.hidden,'Escape zavře čas');
 showTimeChoicePopoverV307(time());click('[data-time-mode-v307="time"]');from.value='10:10';change(from);click('[data-time-duration-v327="45"]');check(to.value==='10:55','Rychlá délka akce');
 pop.querySelector('[data-editor-close-v327]').click();
 check(time().textContent==='celý den','Zrušení rychlé volby neukládá návrh');
 const cell=title();window.getSelection().removeAllRanges();showPlanStylePopoverV307(cell);click('[data-style-bold-v307]');
 check(cell.style.fontWeight==='850','Tučné pro celou buňku');check(pop.hidden,'Formátování zavře časový editor');
 click('[data-style-color-preset-v309="#047857"]');check(cell.style.color==='rgb(4, 120, 87)','Barva textu');
 const size=document.querySelector('[data-style-size-v307]');size.value='12pt';change(size);check(cell.style.fontSize==='12pt','Velikost textu');
 renderPreview();check(title().style.fontSize==='12pt'&&title().style.color==='rgb(4, 120, 87)','Formát zůstane po překreslení');
 const text=title().textContent;showPlanStylePopoverV307(title());click('[data-style-reset-v327]');
 check(title().textContent===text,'Výchozí vzhled nemaže text');check(!title().style.fontSize&&!title().style.color,'Výchozí vzhled odstraní formát');
 window.getSelection().removeAllRanges();showPlanStylePopoverV307(person());click('[data-style-italic-v307]');check(person().style.fontStyle==='italic','Kurzíva ve Zodpovídá');
 check(document.querySelector('[data-style-heading-v327]').textContent==='Zodpovídá','Kontext formátování');
 const rect=document.querySelector('.planStylePopoverV307').getBoundingClientRect();check(rect.left>=0&&rect.right<=innerWidth,'Panel se vejde do okna');
 const fresh=title();window.getSelection().removeAllRanges();const range=document.createRange();range.setStart(fresh.firstChild,0);range.setEnd(fresh.firstChild,6);window.getSelection().addRange(range);showPlanStylePopoverV307(fresh);click('[data-style-bold-v307]');
 check(fresh.querySelector('span[style*="font-weight"]')?.textContent==='Porada','Formátování výběru textu');
 }catch(e){failures.push(e.stack)}
 if(!location.hash.includes('preview')){document.head.innerHTML='';document.body.innerHTML='<pre id="test-result">'+JSON.stringify({checks,failures})+'</pre>';}
 else{showTimeChoicePopoverV307(time());}
},100));
`;
html=html.replace('</body>',`<script>window.fetch=async()=>{throw new Error('Offline test')};</script><script>${core}</script><script>${print}</script><script>${test}</script></body>`);
const dir=mkdtempSync(path.join(tmpdir(),'plan-editors-test-'));const fixture=path.join(dir,'test.html');writeFileSync(fixture,html);
const result=spawnSync(chrome,['--headless','--no-sandbox','--disable-gpu','--window-size=1280,1000',`--user-data-dir=${dir}/profile`,'--virtual-time-budget=1500','--dump-dom',`file://${fixture}`],{encoding:'utf8',timeout:60000,maxBuffer:4*1024*1024});
const match=result.stdout?.match(/<pre id="test-result">([^<]+)<\/pre>/);if(!match)throw new Error(`Test nedoběhl: ${result.error||result.stderr?.slice(-1000)}`);
const report=JSON.parse(match[1].replaceAll('&gt;','>').replaceAll('&lt;','<').replaceAll('&amp;','&'));console.log(JSON.stringify(report,null,2));console.log('Náhled testu:',fixture+'#preview');assert.equal(report.failures.length,0);
