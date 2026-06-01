(function(){
  function noteInput(){
    return document.getElementById("weeklyNoteInput");
  }

  function setStatus(text, cls){
    const input = noteInput();
    if(!input) return;

    let status = document.getElementById("noteAutoStatusV174");
    if(!status){
      status = document.createElement("div");
      status.id = "noteAutoStatusV174";
      status.className = "noteAutoStatusV174";
      input.insertAdjacentElement("afterend", status);
    }

    status.className = "noteAutoStatusV174";
    if(cls) status.classList.add(cls);
    status.textContent = text;
  }

  function saveCurrent(){
    const input = noteInput();
    const key = weekNoteKeyV174();
    if(!input || !key) return;

    const notes = loadWeekNotesV174();
    const value = String(input.value || "").trim();

    if(value) notes[key] = value;
    else delete notes[key];

    saveWeekNotesV174(notes);

    setStatus(value ? "Uloženo automaticky pro aktuální týden." : "Poznámka je prázdná – pro tento týden se nezobrazí.", "saved");

    // Důležité: render už teď bere poznámku přímo z currentWeekNoteV174(), takže nezmizí.
    if(typeof window.renderPreview === "function"){
      window.renderPreview();
    }
  }

  function loadForCurrentWeek(){
    const input = noteInput();
    const key = weekNoteKeyV174();
    if(!input || !key) return;

    const notes = loadWeekNotesV174();
    const value = notes[key] || "";

    if(document.activeElement !== input && input.value !== value){
      input.value = value;
    }

    setStatus("Poznámka se ukládá automaticky k aktuálnímu týdnu.", "");
  }

  function cleanDuplicateTitles(){
    const section = document.getElementById("weeklyNoteSection");
    if(!section) return;

    // V modulu má zůstat jen původní .weeklyNotePanelTitle
    section.querySelectorAll(".unifiedWeekNoteTitleV171,.unifiedWeekNoteInfoV171,.sectionTitle").forEach(el=>el.remove());

    const titles = [...section.querySelectorAll(".weeklyNotePanelTitle")];
    titles.forEach((t,i)=>{
      if(i === 0){
        t.textContent = "Poznámka do plánu";
      }else{
        t.remove();
      }
    });
  }

  function attach(){
    const input = noteInput();
    if(!input || input.__noteDirectV174) return;

    input.__noteDirectV174 = true;
    input.removeAttribute("oninput");

    input.addEventListener("input", ()=>{
      setStatus("Ukládám poznámku…", "saving");
      clearTimeout(window.__noteSaveV174);
      window.__noteSaveV174 = setTimeout(saveCurrent, 350);
    });

    input.addEventListener("blur", saveCurrent);
  }

  function patchWeekChange(){
    if(typeof window.moveWeek === "function" && !window.moveWeek.__noteDirectV174){
      const original = window.moveWeek;
      window.moveWeek = function(){
        const result = original.apply(this, arguments);
        setTimeout(()=>{
          loadForCurrentWeek();
          if(typeof window.renderPreview === "function") window.renderPreview();
        }, 160);
        return result;
      };
      window.moveWeek.__noteDirectV174 = true;
    }

    if(typeof window.renderAll === "function" && !window.renderAll.__noteDirectV174){
      const original = window.renderAll;
      window.renderAll = function(){
        const result = original.apply(this, arguments);
        setTimeout(cleanDuplicateTitles, 80);
        return result;
      };
      window.renderAll.__noteDirectV174 = true;
    }
  }

  function run(){
    cleanDuplicateTitles();
    attach();
    patchWeekChange();
    loadForCurrentWeek();
  }

  window.addEventListener("load",()=>{
    setTimeout(run,400);
    setTimeout(run,1200);
    setTimeout(run,2400);
  });

  const obs = new MutationObserver(()=>{
    clearTimeout(window.__noteRunV174);
    window.__noteRunV174 = setTimeout(run,220);
  });

  obs.observe(document.body,{childList:true,subtree:true});
})();
