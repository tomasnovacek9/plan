import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const core=readFileSync('src/scripts/legacy/00-app-core.js','utf8');
const status=core.slice(core.indexOf('function setPreviewStatusV300('),core.indexOf('function calendarSignature('));
const load=core.slice(core.indexOf('async function loadCalendarFromUrl('),core.lastIndexOf('\ninitDisplayOptionsV300();'));
let retry;
const preview={innerHTML:'',querySelector:()=>({addEventListener:(event,fn)=>retry=fn})};
const ctx=vm.createContext({document:{getElementById:()=>preview},escapeHtml:String,AbortSignal,Date,console:{error(){}},setCalendarBadgeV300(){},setCalendarInfo(){},importWeekFromCalendar(){},parseIcs:()=>[{uid:'test'}],calendarSignature:()=> 'test',calendarEvents:[],calendarSignatureV300:'',events:[],longEvents:[]});
vm.runInContext(status+'\n'+load,ctx);
ctx.setPreviewStatusV300('Načítám EduPage kalendář','Čekej prosím.');
assert.match(preview.innerHTML,/Načítám EduPage/);
assert.doesNotMatch(preview.innerHTML,/class="calendarRetryV329"/);
ctx.setPreviewStatusV300('EduPage kalendář není připojený','Chyba spojení.');
assert.match(preview.innerHTML,/Zkusit načíst znovu/);assert.equal(typeof retry,'function');
let imports=0;ctx.importWeekFromCalendar=()=>imports++;
ctx.fetch=async(url,options)=>{assert.ok(options.signal);return {ok:true,text:async()=> 'BEGIN:VCALENDAR\nEND:VCALENDAR'}};
await ctx.loadCalendarFromUrl({initial:true});assert.equal(ctx.calendarEvents.length,1);assert.equal(imports,1);
ctx.fetch=async()=>({ok:false,status:503,text:async()=> 'Unavailable'});
await ctx.loadCalendarFromUrl({initial:true});assert.match(preview.innerHTML,/Zkusit načíst znovu/);assert.equal(ctx.calendarEvents.length,0);
ctx.fetch=async()=>({ok:true,text:async()=> '<html>not a calendar</html>'});
await ctx.loadCalendarFromUrl({initial:true});assert.match(preview.innerHTML,/není připojený/);
ctx.fetch=async()=>{throw new Error('Network failure')};await ctx.loadCalendarFromUrl({initial:true});assert.match(preview.innerHTML,/Zkusit načíst znovu/);
const html=readFileSync('index.html','utf8');assert.doesNotMatch(html,/<script[^>]+cdnjs/);
console.log('Načítání: viditelný stav, časový limit, úspěch, HTTP chyba, neplatný obsah, síťová chyba a opakování: OK');

const weekFunctions=core.slice(core.indexOf('function setWeekByDate('),core.indexOf('function moveWeek('));
const fields={weekFrom:{value:''},weekTo:{value:''},eventDate:{value:''}};
for(const [today,from,to] of [['2026-10-19T12:00:00','2026-10-19','2026-10-25'],['2026-10-25T12:00:00','2026-10-19','2026-10-25'],['2027-01-01T12:00:00','2026-12-28','2027-01-03']]){
 class FakeDate extends Date{constructor(...args){super(...(args.length?args:[today]));}}
 const weekCtx=vm.createContext({Date:FakeDate,document:{getElementById:id=>fields[id]},localStorage:{getItem:()=>JSON.stringify({from:'2026-06-01',to:'2026-06-07'})},dateToInput:d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'),rememberCurrentWeekV324(){},loadWeekNoteIntoInputV300(){},loadSignatureIntoInputV316(){}});
 vm.runInContext(weekFunctions,weekCtx);weekCtx.setDefaultWeek();assert.equal(fields.weekFrom.value,from);assert.equal(fields.weekTo.value,to);
}
console.log('Při otevření se vybere aktuální týden i přes dříve uložené datum: OK');
