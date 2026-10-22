import assert from 'node:assert/strict';
import {isSharedKey,toRecords,fromRecords,difference,applyChanges,validRecordId} from '../src/shared/shared-plan.js';
import {onRequest} from '../functions/shared-plan.json.js';
import {createTestDatabase} from './shared-plan-test-db.mjs';
const key='tydenni_plan_cell_overrides_v302__2026-W43',manual='tydenni_plan_manual_events_v167__2026-W43';
const entries={
 [key]:JSON.stringify({'row||1':{title:'Porada',person:'Nováková',order:1,orderTime:480}}),
 [manual]:JSON.stringify([{uid:'manual-123',date:'2026-10-19',title:'Akce'}]),
 tydenni_plan_hide_weekend_v184:'1',tydenni_plan_created_author_v337_2026_ignored:'No',
 tydenni_plan_week_notes_v174:JSON.stringify({'2026-10-19||2026-10-25':'Poznámka'}),
 tydenni_plan_signature_text_v316__2026_W43:'Neplatný klíč',
 tydenni_plan_signature_text_v316__2026_W44:'Také neplatný klíč',
 'tydenni_plan_signature_text_v316__2026-W43':'Mgr. Nováková',
 'tydenni_plan_rich_html_v308__2026-W43':JSON.stringify({'row||1':{title:'<span style="font-weight:850">Porada</span>'}})
};
const expected=Object.fromEntries(Object.entries(entries).filter(([key])=>isSharedKey(key)));
assert.deepEqual(fromRecords(toRecords(entries)),expected);
assert.equal(isSharedKey('tydenni_plan_last_week_v324'),false);
assert.equal(isSharedKey('tydenni_plan_responsible_originals_v213__2026-W43'),false);
assert.equal(validRecordId(JSON.stringify([key,'__proto__','polluted'])),false);
const initial=toRecords(expected),changedA=toRecords({...expected,[key]:JSON.stringify({'row||1':{title:'Změna A',person:'Nováková',order:1,orderTime:480}})}),changedB=toRecords({...expected,[key]:JSON.stringify({'row||1':{title:'Porada',person:'Krejčí',order:1,orderTime:480}})});
const changesA=difference(initial,changedA),changesB=difference(initial,changedB);
assert.equal(applyChanges(applyChanges(initial,changesA).records,changesB).conflicts.length,0);
assert.equal(applyChanges(changedA,difference(initial,toRecords({...expected,[key]:JSON.stringify({'row||1':{title:'Změna B',person:'Nováková',order:1,orderTime:480}})}))).conflicts.length,1);
const {db,sqlite}=createTestDatabase();
const call=async(method,changes,extra={})=>{
 const request=new Request('https://plan.example/shared-plan.json',{method,headers:method==='PATCH'?{'content-type':'application/json',...extra}:extra,body:method==='PATCH'?JSON.stringify({changes}):undefined});
 const response=await onRequest({request,env:{PLAN_DB:db}});return {status:response.status,data:await response.json()};
};
assert.equal((await onRequest({request:new Request('https://plan.example/shared-plan.json'),env:{}})).status,503);
assert.equal((await call('POST')).status,405);
assert.equal((await call('GET')).data.revision,0);
const create=difference({},initial);
assert.equal((await call('PATCH',create,{'origin':'https://evil.example'})).status,403);
assert.equal((await call('PATCH',create,{'sec-fetch-site':'cross-site'})).status,403);
assert.equal((await call('PATCH',[{id:'bad',before:null,after:'"bad"'}])).status,400);
assert.equal((await call('PATCH',[create[0],create[0]])).status,400);
let result=await call('PATCH',create);assert.equal(result.status,200);assert.equal(result.data.revision,1);
assert.equal((await call('PATCH',create)).data.revision,1,'Zopakování po výpadku odpovědi je idempotentní');
const simultaneous=await Promise.all([call('PATCH',changesA),call('PATCH',changesB)]);
assert.ok(simultaneous.every(result=>result.status===200),'Nezávislé souběžné úpravy se sloučí');
const final=(await call('GET')).data;assert.equal(final.revision,3);
const value=JSON.parse(fromRecords(final.records)[key]);assert.deepEqual(value,{'row||1':{title:'Změna A',person:'Krejčí',order:1,orderTime:480}});
result=await call('PATCH',difference(initial,toRecords({...expected,[key]:JSON.stringify({'row||1':{title:'Přepsání',person:'Nováková',order:1,orderTime:480}})})));
assert.equal(result.status,409);assert.equal((await call('GET')).data.revision,3,'Konflikt nic nezmění');
assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM shared_plan_history').get().n,3,'Historie zachovává předchozí verze');
const remove=difference(final.records,Object.fromEntries(Object.entries(final.records).filter(([id])=>!id.includes('manual-123'))));
assert.equal((await call('PATCH',remove)).status,200);
assert.equal(fromRecords((await call('GET')).data.records)[manual],undefined,'Smazání vlastní akce se sdílí');
const invalid=new Request('https://plan.example/shared-plan.json',{method:'PATCH',headers:{'content-type':'application/json'},body:'{'});
assert.equal((await onRequest({request:invalid,env:{PLAN_DB:db}})).status,400);
console.log('Společný plán: ukládání, více klientů, sloučení nezávislých změn, konflikty, historie, mazání, validace a opakování požadavků: OK');
sqlite.close();
