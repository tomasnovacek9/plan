import vm from 'node:vm';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseTeacherPage,resolveTeacherCode,expandTeacherList} from '../src/shared/teachers.js';
import {onRequestGet} from '../functions/teachers.json.js';
const people=[{firstName:'Tomáš',surname:'Nováček'},{firstName:'Lada',surname:'Novotná'},{firstName:'Monika',surname:'Daňková'},{firstName:'Pavla',surname:'Pilátová'},{firstName:'Renáta',surname:'Klusáková'}];
for(const [code,expected] of [['Nov','Nov'],['Nováč','Nováček'],['NovT','Nováček'],['Nov L.','Novotná'],['T. Nov','Nováček'],['TNov','Nováček'],['Daň','Daňková'],['Pil','Pilátová'],['XYZ','XYZ'],['TU','TU'],['Pavla Pilátová','Pavla Pilátová']]) assert.equal(resolveTeacherCode(code,people),expected,code);
assert.equal(expandTeacherList('Daň, Pil; Nov / XYZ',people),'Daňková, Pilátová; Nov / XYZ');
assert.equal(resolveTeacherCode('Pil',[...people,{firstName:'Jana',surname:'Pilátová'}]),'Pil');
const fixture='<section id="text19_SubpageContent_1"><div>Mgr. Monika Daňková</div><div>Šimon Burian</div><div>Vedení školy</div><div>Mgr. Monika Daňková</div></section><script>fake</script>';
assert.equal(parseTeacherPage(fixture).length,2);assert.deepEqual(parseTeacherPage('<div>Mgr. Monika Daňková</div>'),[]);
const realFetch=globalThis.fetch;
try{
 const nav='<ul id="text19_SubpagesList_2"><a href="?eqa=staff">Učitelé</a></ul>';
 const content='<section id="text19_SubpageContent_1">'+Array.from({length:11},(_,i)=>`<div>Jana Učitel${String.fromCharCode(97+i)}ová</div>`).join('')+'</section>';
 globalThis.fetch=async()=>new Response(nav+content);
 let response=await onRequestGet();assert.equal(response.status,200);assert.equal((await response.json()).teachers.length,11);
 globalThis.fetch=async url=>String(url).includes('?')?new Response('',{status:503}):new Response(nav+content);
 response=await onRequestGet();assert.equal(response.status,503);assert.deepEqual((await response.json()).teachers,[]);
}finally{globalThis.fetch=realFetch}
console.log('Učitelé: jednoznačné prefixy, iniciály, nejasné shody, seznamy, parser a neúplný adresář: OK');

const core=readFileSync('src/scripts/legacy/00-app-core.js','utf8');
const renderer=core.slice(core.indexOf('function renderResponsibleCellV300('),core.indexOf('function manualTitleStyleAttrV306('));
let edited=false;
const context=vm.createContext({window:{expandPlanTeacherNamesV333:value=>expandTeacherList(value,people)},loadJsonMapV300:()=>({}),saveJsonMapV300(){},RESPONSIBLE_ORIG_V300:'orig',responsibleKeyV300:()=> 'key',planCellValueV302:(key,field,value)=>edited?'Vlastní záznam':value,planFieldHasVisualEditV320:()=>false,planEditedTitleV303:()=>'',planRichHtmlValueV308:()=>'',escapeHtml:String,planStyleAttrV307:()=>''});
vm.runInContext(renderer,context);
const event={person:'Pil'};
let output=context.renderResponsibleCellV300(event,'2026-10-19',0,'original-key');
assert.match(output,/Pilátová/);assert.match(output,/data-plan-original-v302="Pil"/);assert.match(output,/data-plan-row-key-v302="original-key"/);assert.equal(event.person,'Pil');
edited=true;output=context.renderResponsibleCellV300(event,'2026-10-19',0,'original-key');assert.match(output,/Vlastní záznam/);
console.log('Zobrazení příjmení zachová původní data, klíče i ruční úpravy: OK');
