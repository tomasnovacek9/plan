import {isSharedKey,toRecords,fromRecords,difference,applyChanges} from '../shared/shared-plan.js?v=20261022-shared-v36';
const pendingPrefix='tydenni_plan_shared_pending_v340_';
const clientId=sessionStorage.getItem('shared_plan_client_v340')||crypto.randomUUID();
sessionStorage.setItem('shared_plan_client_v340',clientId);
const pendingKey=pendingPrefix+clientId;
const backupKey='tydenni_plan_before_shared_v340';
const nativeSet=Storage.prototype.setItem, nativeRemove=Storage.prototype.removeItem;
let ready=false, applying=false, busy=false, remote={}, pending=new Map(), sending=new Map(), conflict=null, timer, deferred, refreshNeeded=false;
const bar=document.createElement('div');bar.className='sharedPlanStatusV340';bar.setAttribute('role','status');
const label=document.createElement('span'), actions=document.createElement('div');bar.append(label,actions);
(document.querySelector('.previewShell')||document.body).prepend(bar);
document.body.classList.add('sharedPlanLoadingV340');
function button(text,action){const el=document.createElement('button');el.type='button';el.textContent=text;el.onclick=action;return el;}
function readEntries(){return Object.fromEntries(Object.keys(localStorage).filter(isSharedKey).map(key=>[key,localStorage.getItem(key)]));}
function savePending(){nativeSet.call(localStorage,pendingKey,JSON.stringify([...pending.values()]));}
function otherQueues(){return Object.keys(localStorage).filter(key=>key.startsWith(pendingPrefix)&&key!==pendingKey&&localStorage.getItem(key)!=='[]');}
function editing(){return !!document.querySelector('dialog[open]') || document.activeElement?.matches('input,textarea,select,[contenteditable="true"]') || !!document.activeElement?.closest('.planStylePopoverV307') || [...document.querySelectorAll('.timeChoicePopoverV307')].some(el=>!el.hidden);}
function status(text,state='saved'){
  label.textContent=text;bar.dataset.state=state;actions.replaceChildren();
  if(state==='error')actions.append(button('Zkusit znovu',()=>ready?flush():initialize()));
  if(state==='conflict')actions.append(button('Použít společnou verzi',()=>resolve(false)),button('Zachovat moje změny',()=>resolve(true)));
  if(ready&&otherQueues().length)actions.append(button('Obnovit neodeslané změny',recoverPending));
  if(ready&&localStorage.getItem(backupKey))actions.append(button('Převést místní úpravy',importLocal));
}
function enqueue(changes){
  for(const change of changes){
    const existing=pending.get(change.id);
    const next={...change,before:existing?existing.before:change.before};
    if(next.before===next.after&&!sending.has(change.id))pending.delete(change.id);else pending.set(change.id,next);
  }
  savePending();
  if(!conflict)status('Ukládám společné změny…','saving');
  clearTimeout(timer);timer=setTimeout(flush,500);
}
function changed(key,before,after){
  if(applying||!isSharedKey(key)||before===after)return;
  try{enqueue(difference(toRecords(before===null?{}:{[key]:before}),toRecords(after===null?{}:{[key]:after})));}
  catch(error){status('Změnu nelze sdílet. Stáhni zálohu úprav.','error');console.error(error);}
}
Storage.prototype.setItem=function(key,value){
  const before=this===localStorage?this.getItem(key):null;
  nativeSet.call(this,key,value);
  if(this===localStorage)changed(String(key),before,String(value));
};
Storage.prototype.removeItem=function(key){
  const before=this===localStorage?this.getItem(key):null;
  nativeRemove.call(this,key);
  if(this===localStorage)changed(String(key),before,null);
};
async function request(method='GET',changes){
  const result=await fetch('/shared-plan.json',{method,cache:'no-store',signal:AbortSignal.timeout(12000),headers:changes?{'content-type':'application/json'}:{},body:changes?JSON.stringify({changes}):undefined});
  const data=await result.json();
  if(!result.ok&&result.status!==409)throw new Error(data.error||'Uložení není dostupné.');
  if(!data.records||typeof data.records!=='object'||!Number.isInteger(data.revision))throw new Error('Neplatná odpověď společného úložiště.');
  fromRecords(data.records); // Validate the whole snapshot before touching local data.
  return {data,conflicted:result.status===409};
}
function refreshPreview(){
  if(editing()){refreshNeeded=true;return;}
  refreshNeeded=false;
  document.querySelectorAll('.planStylePopoverV307').forEach(el=>{el.hidden=true;});
  loadWeekNoteIntoInputV300();loadSignatureIntoInputV316();applyDisplayBodyClassesV300();
  window.manualEventsV167=loadManualEventsV300();mergeManualEventsV300();renderAll();
  syncTopViewButtonsV311();
  const weekend=document.getElementById("hideWeekendV184"),created=document.getElementById("hideCreatedDateV184");
  if(weekend)weekend.checked=document.body.classList.contains("hideWeekendV184");
  if(created)created.checked=document.body.classList.contains("hideCreatedDateV184");
}
function applyRemote(records){
  if(editing()){deferred=records;return;}
  const result=applyChanges(records,[...pending.values()]);
  if(result.conflicts.length){conflict=records;status('Stejný údaj mezitím změnil někdo jiný. Vyber, kterou verzi zachovat.','conflict');return;}
  const entries=fromRecords(result.records);
  applying=true;
  try{
    for(const key of Object.keys(localStorage).filter(isSharedKey))if(!(key in entries))nativeRemove.call(localStorage,key);
    for(const [key,value]of Object.entries(entries))nativeSet.call(localStorage,key,value);
    nativeSet.call(localStorage,'tydenni_plan_week_storage_migrated_v316','1');
  }finally{applying=false;}
  deferred=null;refreshPreview();
}
async function flush(){
  if(!ready||busy||conflict)return;
  busy=true;
  const sent=[...pending.values()].map(change=>({...change})).slice(0,1000);
  sending=new Map(sent.map(change=>[change.id,change]));
  try{
    const {data,conflicted}=await request(sent.length?'PATCH':'GET',sent.length?sent:undefined);
    remote=data.records;
    if(conflicted){conflict=remote;status('Stejný údaj mezitím změnil někdo jiný. Vyber, kterou verzi zachovat.','conflict');return;}
    for(const change of sent){
      const current=pending.get(change.id);
      if(!current)continue;
      if(current.after===change.after)pending.delete(change.id);
      else current.before=change.after;
    }
    savePending();
    if(difference(toRecords(readEntries()),remote).length||sent.length)applyRemote(remote);
    if(!conflict)status(pending.size?'Ukládám společné změny…':'Společný plán · změny uloženy pro všechny',pending.size?'saving':'saved');
  }catch(error){status(pending.size?'Změny nejsou odeslané. Připojení ke společnému plánu selhalo.':'Spojení se společným plánem vypadlo. Zkouším ho obnovit.','error');console.error(error);}
  finally{sending.clear();busy=false;if(pending.size&&!conflict)timer=setTimeout(flush,4000);}
}
function resolve(keepLocal){
  if(!conflict)return;
  if(keepLocal){
    for(const [id,change]of pending){change.before=conflict[id]??null;if(change.before===change.after)pending.delete(id);}
  }else{
    // Archive the local proposal before accepting colleagues' data.
    nativeSet.call(localStorage,'tydenni_plan_shared_conflict_backup_v340',JSON.stringify([...pending.values()]));
    for(const [id,change]of pending)if((conflict[id]??null)!==change.before&&(conflict[id]??null)!==change.after)pending.delete(id);
  }
  remote=conflict;conflict=null;savePending();applyRemote(remote);status('Aktualizuji společný plán…','saving');flush();
}
function describeChange(change){
  const [key,...path]=JSON.parse(change.id),value=JSON.parse(change.after);
  const fields={title:'Akce',person:'Zodpovídá',time:'Čas',lesson:'Vyučovací hodiny',note:'Poznámka',day:'Den',date:'Datum',color:'Barva',size:'Velikost písma',bold:'Tučné písmo',boldTouched:'Formátování',italic:'Kurzíva'};
  let name=key.includes('manual_events')?'Vlastní akce':key.includes('signature_text')?'Jméno v podpisu':key.includes('signature_role')?'Funkce v podpisu':key.includes('created_date')?'Datum vytvoření':key.includes('created_author')?'Vytvořil':key.includes('week_notes')?'Týdenní poznámka':key.includes('deleted_rows')?'Skrytá akce':key.includes('hide_weekend')?'Skrýt víkend':key.includes('hide_created')?'Skrýt datum vytvoření':fields[path.at(-1)]||'Úprava plánu';
  const date=path[0]?.split('||')[0];
  const week=key.match(/(\d{4}-W\d{2})$/)?.[1];
  const where=/^\d{4}-\d{2}-\d{2}$/.test(date||'')?formatDate(date):week?`týden ${week.slice(6)}/${week.slice(0,4)}`:'';
  const text=key.includes('manual_events')?value.title||'Bez názvu':key.includes('rich_html')?'Formátovaný text':typeof value==='boolean'?(value?'ano':'ne'):String(value);
  return `${name}${where?' · '+where:''}: ${text.slice(0,180)}`;
}
function importLocal(){
  if(!ready||busy||pending.size||conflict){status('Nejprve dokonči uložení nebo vyřeš rozdílné úpravy.',conflict?'conflict':'saving');return;}
  let desired,changes;
  try{
    desired=toRecords(JSON.parse(localStorage.getItem(backupKey)||'{}'));
    changes=Object.entries(desired).filter(([id,value])=>(remote[id]??null)!==value).map(([id,after])=>({id,before:remote[id]??null,after}));
  }catch{alert('Místní zálohu se nepodařilo načíst. Použij staženou zálohu úprav.');return;}
  const dialog=document.createElement('dialog');dialog.className='planToolsDialogV335';
  const heading=document.createElement('h2');heading.textContent='Převést místní úpravy';
  const text=document.createElement('p');text.textContent=changes.length?`Místní záloha obsahuje ${changes.length} odlišných údajů. Jejich převodem se změní společný plán pro všechny. Ostatní společné údaje zůstanou zachované. Původní místní záloha se ponechá.`:'Všechny údaje z místní zálohy už jsou ve společném plánu.';
  const list=document.createElement('ul');list.className='sharedPlanImportListV340';
  for(const change of changes){
    const row=document.createElement('li');row.textContent=describeChange(change);list.append(row);
  }
  const close=button('Zavřít',()=>dialog.close());close.className='toolsCloseV335';dialog.append(heading,close,text,list);
  if(changes.length){const save=button('Převést do společného plánu',()=>{dialog.close();enqueue(changes);applyRemote(remote);flush();});save.className='toolsPrimaryV335';dialog.append(save);}
  document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
}
function recoverPending(){
  if(conflict||pending.size){status('Nejprve dokonči současné úpravy.',conflict?'conflict':'saving');return;}
  const queues=otherQueues();
  if(!queues.length)return;
  const dialog=document.createElement('dialog');dialog.className='planToolsDialogV335';
  const heading=document.createElement('h2');heading.textContent='Neodeslané změny';
  const text=document.createElement('p');text.textContent='V tomto prohlížeči jsou neodeslané změny z jiného otevření plánu. Převzít je do tohoto okna? Pokud je původní okno ještě otevřené, nejprve ho zavři. Rozdílné souběžné úpravy bude možné vyřešit před uložením.';
  const cancel=button('Zrušit',()=>dialog.close());
  const accept=button('Převzít změny',()=>{
    try{
      // Recover one queue at a time so different proposals never replace each other.
      const saved=JSON.parse(localStorage.getItem(queues[0])||'[]');
      enqueue(saved);nativeRemove.call(localStorage,queues[0]);dialog.close();applyRemote(remote);flush();
    }catch{alert('Neodeslané změny se nepodařilo obnovit.');}
  });accept.className='toolsPrimaryV335';dialog.append(heading,text,cancel,accept);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
}
async function initialize(){
  if(busy)return;busy=true;status('Načítám společný plán…','saving');
  try{
    migrateLegacyWeekStorageV316();
    const initial=readEntries();
    if(!localStorage.getItem('tydenni_plan_shared_initialized_v340')&&!localStorage.getItem(backupKey)&&Object.keys(toRecords(initial)).length)nativeSet.call(localStorage,backupKey,JSON.stringify(initial));
    const saved=JSON.parse(localStorage.getItem(pendingKey)||'[]');
    for(const change of saved)pending.set(change.id,change);
    const {data}=await request();remote=data.records;
    nativeSet.call(localStorage,'tydenni_plan_shared_initialized_v340','1');
    ready=true;document.body.classList.remove('sharedPlanLoadingV340');applyRemote(remote);
    if(!conflict)status(pending.size?'Čekající úpravy se odesílají…':'Společný plán · změny uloženy pro všechny',pending.size?'saving':'saved');
  }catch(error){status('Společný plán se nenačetl. Úpravy jsou zatím pozastavené.','error');console.error(error);}
  finally{busy=false;if(ready&&pending.size&&!conflict)flush();}
}
for(const type of ['click','keydown'])document.addEventListener(type,event=>{
  if(!ready&&event.target.closest('.panel,#preview,.planToolsV335,.actions')){event.preventDefault();event.stopImmediatePropagation();}
},true);
window.addEventListener('beforeunload',event=>{if(pending.size){event.preventDefault();event.returnValue='';}});
window.addEventListener('online',()=>ready?flush():initialize());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)(ready?flush():initialize());});
document.addEventListener('focusout',()=>setTimeout(()=>{
  if(!editing()){if(deferred)applyRemote(deferred);else if(refreshNeeded)refreshPreview();}
},50));
setInterval(()=>{if(!document.hidden&&ready){if(deferred&&!editing())applyRemote(deferred);flush();}},4000);
initialize();
