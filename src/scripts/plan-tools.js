/* Small local workflows. No uploads and no changes to calendar source data. */
(() => {
  const allowedKey = key => /^(tydenni_plan_|tydenniPlanData$)/.test(key) && !key.startsWith('tydenni_plan_shared_');
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
          const holder=document.createElement('template');holder.innerHTML=String(fields[field]);fields[field]=cleanEditableHtmlV308(holder.content);
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
  function editSignature(field){
    const dialog=openDialog('Jméno a funkce v podpisu');
    const form=document.createElement('form');
    const nameLabel=document.createElement('label');nameLabel.textContent='Jméno včetně titulů';
    const name=document.createElement('input');name.type='text';name.required=true;name.maxLength=160;name.value=document.getElementById('signature').value||DEFAULT_SIGNATURE_V310;nameLabel.append(name);
    const roleLabel=document.createElement('label');roleLabel.textContent='Funkce';
    const role=document.createElement('input');role.type='text';role.required=true;role.maxLength=160;role.value=signatureRoleValueV312();roleLabel.append(role);
    const save=document.createElement('button');save.type='submit';save.textContent='Uložit';save.className='toolsPrimaryV335';
    const reset=document.createElement('button');reset.type='button';reset.textContent='Obnovit výchozí podpis';
    const hint=document.createElement('p');hint.textContent='Podpis se uloží pro tento týden a použije se také v tisku a PDF.';
    form.append(nameLabel,roleLabel,hint,save,reset);dialog.append(form);
    form.onsubmit=event=>{
      event.preventDefault();
      if(!form.reportValidity()||!name.value.trim()||!role.value.trim())return;
      saveSignatureTextV316(name.value);saveSignatureRoleV312(role.value);dialog.close();renderPreview();
    };
    reset.onclick=()=>{saveSignatureTextV316(DEFAULT_SIGNATURE_V310);saveSignatureRoleV312(DEFAULT_SIGNATURE_ROLE_V312);dialog.close();renderPreview();};
    const input=field==='role'?role:name;input.focus();input.select();
  }
  function editCreatedDate(){
    const key=createdDateKeyV336();
    const authorKey=createdAuthorKeyV337();
    const dialog=openDialog('Datum a autor plánu');
    const label=document.createElement('label');label.textContent='Vytvořeno dne';
    const input=document.createElement('input');input.type='date';input.required=true;input.value=createdDateValueV336();label.append(input);
    const authorLabel=document.createElement('label');authorLabel.textContent='Vytvořil (nepovinné)';
    const author=document.createElement('input');author.type='text';author.maxLength=160;author.value=createdAuthorV337();author.placeholder='Jméno autora';authorLabel.append(author);
    const hint=document.createElement('p');hint.textContent='Údaje se uloží pro tento týden a objeví se také v tisku a PDF. Prázdné jméno se nezobrazuje.';
    const form=document.createElement('form');
    const save=document.createElement('button');save.type='submit';save.textContent='Uložit';save.className='toolsPrimaryV335';
    const reset=document.createElement('button');reset.type='button';reset.textContent='Používat aktuální datum';
    form.append(label,authorLabel,hint,save,reset);dialog.append(form);
    form.onsubmit=event=>{
      event.preventDefault();
      if(!input.reportValidity()||!input.value)return;
      localStorage.setItem(key,input.value);
      if(author.value.trim())localStorage.setItem(authorKey,author.value.trim());
      else localStorage.removeItem(authorKey);
      dialog.close();renderPreview();
    };
    reset.onclick=()=>{localStorage.removeItem(key);dialog.close();renderPreview();};
    input.focus();
  }
  document.addEventListener('click',event=>{
    if(event.target.closest('#preview [data-edit-created-v336]'))editCreatedDate();
    const signature=event.target.closest('#preview [data-edit-signature-v339]');if(signature)editSignature(signature.dataset.editSignatureV339);
  });
  document.addEventListener('keydown',event=>{
    const signature=event.target.closest('#preview [data-edit-signature-v339]');
    if(signature&&(event.key==='Enter'||event.key===' ')){event.preventDefault();editSignature(signature.dataset.editSignatureV339);return;}
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
    const dateLabel=document.createElement('label');dateLabel.textContent='Nový den';const date=document.createElement('input');date.type='date';date.required=true;date.value=document.getElementById('weekFrom').value;dateLabel.append(date);
    const save=document.createElement('button');save.type='button';save.textContent='Vytvořit kopii';save.className='toolsPrimaryV335';
    save.onclick=()=>{
      if(!date.reportValidity()||!date.value)return;
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
      const targetWeek=weekArchiveIdV316(date.value);
      const targetKey=store=>`${store}__${targetWeek}`;
      const changes=[];
      for(const store of [PLAN_CELL_STORE_V302,PLAN_STYLE_STORE_V307,PLAN_RICH_STORE_V308]){
        const sourceMap=loadJsonMapV300(store);
        if(sourceMap[oldKey]){
          const targetMap=JSON.parse(localStorage.getItem(targetKey(store))||'{}');
          targetMap[newKey]=JSON.parse(JSON.stringify(sourceMap[oldKey]));
          changes.push([targetKey(store),JSON.stringify(targetMap)]);
        }
      }
      const targetList=JSON.parse(localStorage.getItem(targetKey(MANUAL_EVENTS_STORE_V300))||'[]');
      changes.push([targetKey(MANUAL_EVENTS_STORE_V300),JSON.stringify([...targetList,clone])]);
      const previous=changes.map(([key])=>[key,localStorage.getItem(key)]);
      try{changes.forEach(([key,value])=>localStorage.setItem(key,value));}
      catch(error){previous.forEach(([key,value])=>value===null?localStorage.removeItem(key):localStorage.setItem(key,value));alert('Kopii se nepodařilo uložit.');return;}
      if(targetWeek===weekArchiveIdV316()){
        window.manualEventsV167=loadManualEventsV300();mergeManualEventsV300();renderAll();dialog.close();
      }else{
        dialog.close();
        const done=openDialog('Akce zkopírována');
        const message=document.createElement('p');message.textContent=`Kopie je uložena na ${formatDate(clone.date)}. Původní akce zůstala zachována.`;
        const show=document.createElement('button');show.textContent='Zobrazit cílový týden';show.className='toolsPrimaryV335';
        show.onclick=()=>{done.close();setWeekByDate(parseDate(clone.date));importWeekFromCalendar();};done.append(message,show);
      }
    };
    const hint=document.createElement('p');hint.textContent='Vyber libovolný den, i v jiném týdnu. Kopie zachová text, čas, zodpovědnou osobu i formátování.';dialog.append(label,dateLabel,hint,save);
  }
  let lastDeletion;
  function updateUndo(){
    const button=document.querySelector('[data-undo-delete-v338]');
    if(button){button.disabled=!lastDeletion;button.title=lastDeletion?`Obnovit akci v týdnu od ${formatDate(lastDeletion.week)}`:'Zatím nebyla smazána žádná akce';}
  }
  document.addEventListener('plan-row-deleted-v338',event=>{lastDeletion=event.detail;updateUndo();});
  function undoDeletion(){
    if(!lastDeletion)return;
    const {store,item,key,week}=lastDeletion;
    try{
      const data=JSON.parse(localStorage.getItem(store)||(item?'[]':'{}'));
      if(item){if(!data.some(event=>event.uid===item.uid))data.push(item);}
      else delete data[key];
      localStorage.setItem(store,JSON.stringify(data));
    }catch(error){alert('Smazanou akci se nepodařilo obnovit.');return;}
    lastDeletion=null;updateUndo();
    if(weekArchiveIdV316(week)===weekArchiveIdV316()){
      window.manualEventsV167=loadManualEventsV300();mergeManualEventsV300();renderPreview();
    }else{
      const dialog=openDialog('Akce obnovena');const text=document.createElement('p');text.textContent=`Akce byla obnovena v týdnu od ${formatDate(week)}.`;dialog.append(text);
    }
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
    for(const [text,action] of [['Aktuální týden',()=>setCurrentWeekAndImport()],['Kopírovat vlastní akci',duplicate],['Vrátit smazanou akci',undoDeletion],['Zálohovat úpravy',backup],['Obnovit zálohu',()=>file.click()],['Nerozpoznané zkratky',unresolved]]){
      const button=document.createElement('button');button.type='button';button.textContent=text;button.onclick=action;if(action===undoDeletion){button.dataset.undoDeleteV338='';button.disabled=!lastDeletion;}bar.append(button);
    }
    const file=document.createElement('input');file.type='file';file.accept='.json,application/json';file.hidden=true;file.onchange=()=>{restore(file.files[0]);file.value='';};bar.append(file);shell.prepend(bar);
  });
  window.validatePlanBackupV335=validateBackup;
})();
