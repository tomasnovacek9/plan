(function(){
  function noteInput(){
    return document.getElementById("weeklyNoteInput");
  }

  function forceNotePreviewStyleV182(){
    const input = noteInput();
    const note = (input?.value || "").trim();
    if(!note) return;

    document.querySelectorAll(".previewPage").forEach(page=>{
      [...page.querySelectorAll("div,p,section")].forEach(el=>{
        if(el.closest("table")) return;

        const txt = (el.textContent || "").trim();
        const isNote =
          txt === note ||
          el.classList.contains("planMessage") ||
          el.classList.contains("planMessageFixedV180") ||
          el.classList.contains("planNoteRedV179") ||
          el.classList.contains("notePreviewFinalV178");

        if(isNote){
          el.classList.remove("notice");
          el.classList.add("notePreviewNoBlueV182");
          el.style.background = "#fff7e6";
          el.style.border = "1px solid #f6d58d";
          el.style.borderLeft = "6px solid #9f1239";
          el.style.borderRadius = "16px";
          el.style.color = "#7f1d1d";
          el.style.fontSize = "13px";
          el.style.fontWeight = "850";
          el.style.lineHeight = "1.45";
          el.style.padding = "10px 12px";
          el.style.margin = "8px 0 4px 0";
          el.style.boxShadow = "0 6px 16px rgba(159,18,57,.06)";
        }
      });
    });
  }

  function forceLeftModuleV182(){
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

    section.querySelectorAll(".sectionTitle,.weeklyNotePanelTitle,.unifiedWeekNoteInfoV171").forEach(el=>el.remove());

    let title = section.querySelector(".noteModuleTitleFixedV180") || section.querySelector(".unifiedWeekNoteTitleV171");
    if(!title){
      title = document.createElement("div");
      title.className = "noteModuleTitleFixedV180";
      section.insertBefore(title, section.firstChild);
    }

    title.className = "noteModuleTitleFixedV180";
    title.textContent = "Poznámka do plánu";

    [...section.querySelectorAll(".noteModuleTitleFixedV180,.unifiedWeekNoteTitleV171")].forEach((el,i)=>{
      if(i > 0) el.remove();
    });
  }

  function patchRenderV182(){
    if(typeof window.renderPreview === "function" && !window.renderPreview.__noteNoBlueV182){
      const original = window.renderPreview;
      window.renderPreview = function(){
        const result = original.apply(this, arguments);

        // rychle po renderu, aby modrá skoro neproblikla
        forceNotePreviewStyleV182();
        setTimeout(forceNotePreviewStyleV182, 0);
        setTimeout(forceNotePreviewStyleV182, 30);
        setTimeout(forceNotePreviewStyleV182, 120);
        return result;
      };
      window.renderPreview.__noteNoBlueV182 = true;
    }

    if(typeof window.renderAll === "function" && !window.renderAll.__noteNoBlueV182){
      const original = window.renderAll;
      window.renderAll = function(){
        const result = original.apply(this, arguments);
        forceLeftModuleV182();
        forceNotePreviewStyleV182();
        setTimeout(()=>{forceLeftModuleV182(); forceNotePreviewStyleV182();}, 40);
        setTimeout(()=>{forceLeftModuleV182(); forceNotePreviewStyleV182();}, 160);
        return result;
      };
      window.renderAll.__noteNoBlueV182 = true;
    }
  }

  function runV182(){
    patchRenderV182();
    forceLeftModuleV182();
    forceNotePreviewStyleV182();
  }

  window.addEventListener("load",()=>{
    setTimeout(runV182,200);
    setTimeout(runV182,800);
    setTimeout(runV182,1800);
  });

  const obs = new MutationObserver(()=>{
    clearTimeout(window.__noteNoBlueV182);
    window.__noteNoBlueV182 = setTimeout(runV182,80);
  });

  obs.observe(document.body,{childList:true,subtree:true});
})();
