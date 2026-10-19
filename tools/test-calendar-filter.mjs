import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const core=readFileSync('src/scripts/legacy/00-app-core.js','utf8');
const ctx=vm.createContext({});vm.runInContext(core.slice(core.indexOf('function isSubjectEvent('),core.indexOf('function eventTitleFromCalendar(')),ctx);
const excluded=[
 {summary:'Obyvatelstvo a hospodářství Ameriky',subject:'Z',classes:'VII. A',teachers:'Nováková',description:'Předmět: Z\nTřídy: VII. A',location:'7.A'},
 {summary:'Zlomky',subject:'M',description:'Předmět: M'},
 ...['Test z matematiky','TEST – Unit 3','Zkoušení z dějepisu','Ústní přezkoušení','Písemka: rovnice','Písemná práce','Písemné práce','Diktát','Čtvrtletní práce','Pololetní opakování','Prověrka znalostí','Slovíčka','Lesson 4','Unit 3','Ověřování znalostí'].map(summary=>({summary}))
];
const retained=['Výlet do ZOO','Divadelní představení','Škola v přírodě','Pedagogická rada','Porada učitelů','Sportovní den','Dopravní hřiště','Hodina s třídním učitelem','Přijímací zkoušky','Pololetní prázdniny','Protest proti šikaně','English song contest','Kontrola testovacího zařízení'];
for(const item of excluded)assert.equal(ctx.isSubjectEvent(item),true,`Má se skrýt: ${item.summary}`);
for(const summary of retained)assert.equal(ctx.isSubjectEvent({summary,classes:'VI. A',teachers:'Nováková',description:'Školní akce'}),false,`Má zůstat: ${summary}`);
console.log(`Filtr kalendáře: ${excluded.length} výukových položek skryto, ${retained.length} školních akcí zachováno: OK`);
