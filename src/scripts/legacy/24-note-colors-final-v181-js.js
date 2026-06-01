(function(){
  function noteInput(){
    return document.getElementById("weeklyNoteInput");
  }

  function fixLeftModuleV181(){
    const input = noteInput();
    if(!input) return;

    const section =
      document.getElementById("weeklyNoteSection") ||
      input.closest(".unifiedWeekNoteV171") ||
      input.closest(".section") ||
      input.parentElement;

    if(!section) return;

    section.id = section.id || "weeklyNoteSection";
    section.classList.add("unifiedWeekNoteV171");

    // odstranit duplicitní / barevně špatné nadpisy
    section.querySelectorAll(".sectionTitle,.weeklyNotePanelTitle,.unifiedWeekNoteInfoV171").forEach(el=>el.remove());

    let title = section.querySelector(".noteModuleTitleFixedV180") || section.querySelector(".unifiedWeekNoteTitleV171");
    if(!title){
      title = document.createElement("div");
      title.className = "noteModuleTitleFixedV180";
      section.insertBefore(title, section.firstChild);
    }

    title.textContent = "Poznámka do plánu";
    title.className = "noteModuleTitleFixedV180";

    [...section.querySelectorAll(".noteModuleTitleFixedV180,.unifiedWeekNoteTitleV171")].forEach((el,i)=>{
      if(i > 0) el.remove();
    });
  }

  function fixPreviewNoteV181(){
    const input = noteInput();
    const note = (input?.value || "").trim();
    if(!note) return;

    document.querySelectorAll(".previewPage").forEach(page=>{
      [...page.querySelectorAll("div,p,section")].forEach(el=>{
        if(el.closest("table")) return;

        const txt = (el.textContent || "").trim();

        // Přesná shoda poznámky nebo již známé třídy poznámky
        if(
          txt === note ||
          el.classList.contains("planMessage") ||
          el.classList.contains("planMessageFixedV180") ||
          el.classList.contains("planNoteRedV179")
        ){
          el.classList.remove("notice");
          el.classList.add("planMessageFixedV180");
          el.style.background = "#fff7e6";
          el.style.border = "1px solid #f6d58d";
          el.style.borderLeft = "6px solid #9f1239";
          el.style.borderRadius = "16px";
          el.style.color = "#7f1d1d";
          el.style.fontSize = "13px";
          el.style.fontWeight = "850";
          el.style.lineHeight = "1.45";
          el.style.padding = "10px 12px";
          el.style.margin = "10px 0 12px 0";
        }
      });
    });
  }

  function patchRendersV181(){
    if(typeof window.renderPreview === "function" && !window.renderPreview.__noteColorsV181){
      const original = window.renderPreview;
      window.renderPreview = function(){
        const result = original.apply(this, arguments);
        setTimeout(()=>{fixLeftModuleV181(); fixPreviewNoteV181();}, 20);
        setTimeout(()=>{fixLeftModuleV181(); fixPreviewNoteV181();}, 150);
        setTimeout(()=>{fixLeftModuleV181(); fixPreviewNoteV181();}, 500);
        return result;
      };
      window.renderPreview.__noteColorsV181 = true;
    }

    if(typeof window.renderAll === "function" && !window.renderAll.__noteColorsV181){
      const original = window.renderAll;
      window.renderAll = function(){
        const result = original.apply(this, arguments);
        setTimeout(()=>{fixLeftModuleV181(); fixPreviewNoteV181();}, 40);
        setTimeout(()=>{fixLeftModuleV181(); fixPreviewNoteV181();}, 200);
        setTimeout(()=>{fixLeftModuleV181(); fixPreviewNoteV181();}, 600);
        return result;
      };
      window.renderAll.__noteColorsV181 = true;
    }
  }

  function runV181(){
    patchRendersV181();
    fixLeftModuleV181();
    fixPreviewNoteV181();
  }

  window.addEventListener("load",()=>{
    setTimeout(runV181,250);
    setTimeout(runV181,900);
    setTimeout(runV181,1800);
    setTimeout(runV181,3200);
  });

  const obs = new MutationObserver(()=>{
    clearTimeout(window.__noteColorsV181);
    window.__noteColorsV181 = setTimeout(runV181,100);
  });

  obs.observe(document.body,{childList:true,subtree:true});
})();
