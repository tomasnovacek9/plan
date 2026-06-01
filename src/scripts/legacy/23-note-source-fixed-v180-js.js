(function(){
  function noteInput(){
    return document.getElementById("weeklyNoteInput");
  }

  function fixLeftModule(){
    const input = noteInput();
    if(!input) return;

    const section = input.closest(".unifiedWeekNoteV171") || input.closest(".section") || input.parentElement;
    if(!section) return;

    section.classList.add("noteModuleFixedV180");

    // Odstranit všechny staré / duplicitní nadpisy.
    section.querySelectorAll(".sectionTitle,.weeklyNotePanelTitle,.unifiedWeekNoteTitleV171,.unifiedWeekNoteInfoV171").forEach(el=>el.remove());

    let title = section.querySelector(".noteModuleTitleFixedV180");
    if(!title){
      title = document.createElement("div");
      title.className = "noteModuleTitleFixedV180";
      title.textContent = "Poznámka do plánu";
      section.insertBefore(title, section.firstChild);
    }

    // Ponechat jen jeden finální nadpis.
    [...section.querySelectorAll(".noteModuleTitleFixedV180")].forEach((el,i)=>{
      if(i > 0) el.remove();
    });
  }

  function fixPreviewNote(){
    const input = noteInput();
    const note = (input?.value || "").trim();
    if(!note) return;

    document.querySelectorAll(".previewPage").forEach(page=>{
      [...page.querySelectorAll("div,p")].forEach(el=>{
        const text = (el.textContent || "").trim();

        // Přesná shoda textu poznámky, mimo tabulku.
        if(text === note && !el.closest("table")){
          el.classList.remove("notice");
          el.classList.add("planMessageFixedV180");
        }
      });
    });
  }

  function patchRenders(){
    if(typeof window.renderPreview === "function" && !window.renderPreview.__noteFixedV180){
      const original = window.renderPreview;
      window.renderPreview = function(){
        const result = original.apply(this, arguments);
        setTimeout(()=>{fixLeftModule(); fixPreviewNote();}, 10);
        setTimeout(()=>{fixLeftModule(); fixPreviewNote();}, 120);
        return result;
      };
      window.renderPreview.__noteFixedV180 = true;
    }

    if(typeof window.renderAll === "function" && !window.renderAll.__noteFixedV180){
      const original = window.renderAll;
      window.renderAll = function(){
        const result = original.apply(this, arguments);
        setTimeout(()=>{fixLeftModule(); fixPreviewNote();}, 20);
        setTimeout(()=>{fixLeftModule(); fixPreviewNote();}, 160);
        return result;
      };
      window.renderAll.__noteFixedV180 = true;
    }
  }

  function run(){
    patchRenders();
    fixLeftModule();
    fixPreviewNote();
  }

  window.addEventListener("load",()=>{
    setTimeout(run,250);
    setTimeout(run,900);
    setTimeout(run,1800);
  });

  const obs = new MutationObserver(()=>{
    clearTimeout(window.__noteFixedV180);
    window.__noteFixedV180 = setTimeout(run,80);
  });

  obs.observe(document.body,{childList:true,subtree:true});
})();
