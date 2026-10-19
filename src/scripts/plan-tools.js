/* Small local workflows. No uploads and no changes to calendar source data. */
(() => {
  const allowedKey = key => /^(tydenni_plan_|tydenniPlanData$)/.test(key);
  const snapshot = () => Object.keys(localStorage).filter(allowedKey).map(key=>[key,localStorage.getItem(key)]);
  function backup(){
    const data={format:'school-plan-backup',version:1,createdAt:new Date().toISOString(),entries:snapshot()};
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download=`Zaloha_planu_${dateToInput(new Date())}.json`;link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function validateBackup(text){
    if(text.length>5_000_000)throw new Error('Soubor zálohy je příliš velký.');
    const data=JSON.parse(text);
    if(data.format!=='school-plan-backup'||data.version!==1||!Array.isArray(data.entries))throw new Error('Neplatný soubor zálohy.');
    const seen=new Set();
    return data.entries.map(entry=>{
      if(!Array.isArray(entry)||entry.length!==2||typeof entry[0]!=='string'||!allowedKey(entry[0])||typeof entry[1]!=='string'||seen.has(entry[0]))throw new Error('Záloha obsahuje neplatné položky.');
      seen.add(entry[0]);
      let [key,value]=entry;
      // Imported rich text has the same sanitization as text edited in the plan.
      if(key.startsWith('tydenni_plan_rich_html')){
        const rich=JSON.parse(value);
        if(!rich||typeof rich!=='object'||Array.isArray(rich))throw new Error('Neplatné formátování v záloze.');
        Object.values(rich).forEach(fields=>Object.keys(fields).forEach(field=>{
          const holder=document.createElement('div');holder.innerHTML=String(fields[field]);fields[field]=cleanEditableHtmlV308(holder);
        }));
        value=JSON.stringify(rich);
      }
      return [key,value];
    });
  }
  async function restore(file){
    if(!file)return;
    try{
      const entries=validateBackup(await file.text());
      if(!entries.length)throw new Error('Záloha je prázdná.');
      if(!confirm(`Obnovit ${entries.length} uložených položek ze zálohy? Shodné položky budou nahrazeny. Doporučujeme nejprve stáhnout současnou zálohu.`))return;
      const old=entries.map(([key])=>[key,localStorage.getItem(key)]);
      try{entries.forEach(([key,value])=>localStorage.setItem(key,value));}
      catch(error){old.forEach(([key,value])=>value===null?localStorage.removeItem(key):localStorage.setItem(key,value));throw error;}
      location.reload();
    }catch(error){alert(`Obnovení se nezdařilo: ${error.message}`);}
  }
  function openDialog(title){
    document.querySelector('.planToolsDialogV335')?.remove();
    const dialog=document.createElement('dialog');dialog.className='planToolsDialogV335';
    const heading=document.createElement('h2');heading.textContent=title;
    const close=document.createElement('button');close.type='button';close.textContent='Zavřít';close.className='toolsCloseV335';close.onclick=()=>dialog.close();
    dialog.append(heading,close);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
    return dialog;
  }
  function editCreatedDate(){
    const key=createdDateKeyV336();
    const dialog=openDialog('Datum vytvoření');
    const label=document.createElement('label');label.textContent='Vytvořeno dne';
    const input=document.createElement('input');input.type='date';input.required=true;input.value=createdDateValueV336();label.append(input);
    const hint=document.createElement('p');hint.textContent='Datum se uloží pro tento týden a objeví se také v tisku a PDF.';
    const form=document.createElement('form');
    const save=document.createElement('button');save.type='submit';save.textContent='Uložit';save.className='toolsPrimaryV335';
    const reset=document.createElement('button');reset.type='button';reset.textContent='Používat aktuální datum';
    form.append(label,hint,save,reset);dialog.append(form);
    form.onsubmit=event=>{
      event.preventDefault();
      if(!input.reportValidity()||!input.value)return;
      localStorage.setItem(key,input.value);dialog.close();renderPreview();
    };
    reset.onclick=()=>{localStorage.removeItem(key);dialog.close();renderPreview();};
    input.focus();
  }
  document.addEventListener('click',event=>{
    if(event.target.closest('#preview [data-edit-created-v336]'))editCreatedDate();
  });
  document.addEventListener('keydown',event=>{
    if(event.target.closest('#preview [data-edit-created-v336]')&&(event.key==='Enter'||event.key===' ')){
      event.preventDefault();editCreatedDate();
    }
  });
  function duplicate(){
    const list=loadManualEventsV300();
    if(!list.length){alert('V tomto týdnu zatím nejsou žádné vlastní akce ke kopírování.');return;}
    const dialog=openDialog('Kopírovat vlastní akci');
    const label=document.createElement('label');label.textContent='Akce';
    const select=document.createElement('select');select.setAttribute('aria-label','Kopírovaná akce');
    list.forEach((item,index)=>{const option=document.createElement('option');option.value=index;option.textContent=`${formatDate(item.date)} · ${item.title||'Bez názvu'}`;select.append(option);});label.append(select);
    const dateLabel=document.createElement('label');dateLabel.textContent='Nový den';const date=document.createElement('input');date.type='date';date.required=true;date.min=document.getElementById('weekFrom').value;date.max=document.getElementById('weekTo').value;date.value=date.min;dateLabel.append(date);
    const save=document.createElement('button');save.type='button';save.textContent='Vytvořit kopii';save.className='toolsPrimaryV335';
    save.onclick=()=>{
      if(!date.value||date.value<date.min||date.value>date.max){date.reportValidity();return;}
      const original=list[Number(select.value)];
      if(!original)return;
      const oldKey=[original.date,original.uid,'manual'].join('||');
      const clone=JSON.parse(JSON.stringify(original));clone.uid=`manual-${uid()}`;clone.id=clone.uid;clone.date=date.value;
      clone.title=planCellValueV302(oldKey,'title',original.title||'');clone.person=planCellValueV302(oldKey,'person',original.person||'');
      const value=planCellValueV302(oldKey,'time',original.from?`${original.from} - ${original.to}`:'celý den');
      if(/celý den/i.test(value)){clone.from='';clone.to='';}
      else{const match=value.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);if(match){clone.from=match[1];clone.to=match[2];}}
      clone.originalFrom=clone.from;clone.originalTo=clone.to;
      const newKey=[clone.date,clone.uid,'manual'].join('||');
      for(const store of [PLAN_STYLE_STORE_V307,PLAN_RICH_STORE_V308]){const map=loadJsonMapV300(store);if(map[oldKey]){map[newKey]=JSON.parse(JSON.stringify(map[oldKey]));saveJsonMapV300(store,map);}}
      saveManualEventsV308([...list,clone]);window.manualEventsV167=[...list,clone];mergeManualEventsV300();renderAll();dialog.close();
    };
    dialog.append(label,dateLabel,save);
  }
  function unresolved(){
    const report=window.getUnresolvedTeacherCodesV335?.([...document.querySelectorAll('#preview .personCell')].map(cell=>cell.dataset.planOriginalV302||''));
    const dialog=openDialog('Nerozpoznané zkratky učitelů');
    const text=document.createElement('p');
    if(!report?.available)text.textContent='Adresář učitelů se zatím nenačetl. Zkus přehled znovu za chvíli.';
    else if(!report.codes.length)text.textContent='V tomto týdnu jsou všechny učitelské zkratky rozpoznané.';
    else{text.textContent='Tyto zkratky nemají jednoznačné přiřazení. V plánu zůstávají původní.';const list=document.createElement('ul');report.codes.forEach(code=>{const item=document.createElement('li');item.textContent=code;list.append(item);});dialog.append(list);}
    dialog.append(text);
  }
  window.addEventListener('load',()=>{
    const shell=document.querySelector('.previewShell');if(!shell)return;
    const bar=document.createElement('div');bar.className='planToolsV335';bar.setAttribute('aria-label','Nástroje plánu');
    for(const [text,action] of [['Aktuální týden',()=>setCurrentWeekAndImport()],['Kopírovat vlastní akci',duplicate],['Zálohovat úpravy',backup],['Obnovit zálohu',()=>file.click()],['Nerozpoznané zkratky',unresolved]]){
      const button=document.createElement('button');button.type='button';button.textContent=text;button.onclick=action;bar.append(button);
    }
    const file=document.createElement('input');file.type='file';file.accept='.json,application/json';file.hidden=true;file.onchange=()=>{restore(file.files[0]);file.value='';};bar.append(file);shell.prepend(bar);
  });
  window.validatePlanBackupV335=validateBackup;
})();
