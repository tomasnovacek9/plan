(function(){
  function noteInput(){
    return document.getElementById("weeklyNoteInput");
  }

  function normalizeText(t){
    return String(t || "").replace(/\r\n/g,"\n").replace(/\r/g,"\n").trim();
  }

  function forceMultilineNoteStyle(){
    const input = noteInput();
    const note = normalizeText(input?.value || "");
    if(!note) return;

    const noteFlat = note.replace(/\s+/g," ");

    document.querySelectorAll(".previewPage").forEach(page=>{
      [...page.querySelectorAll("div,p,section")].forEach(el=>{
        if(el.closest("table")) return;

        const elText = normalizeText(el.textContent || "");
        const elFlat = elText.replace(/\s+/g," ");

        const isNote =
          elFlat === noteFlat ||
          el.classList.contains("planMessage") ||
          el.classList.contains("planMessageFixedV180") ||
          el.classList.contains("notePreviewNoBlueV182") ||
          el.classList.contains("planNoteRedV179");

        if(isNote){
          el.classList.remove("notice");
          el.classList.add("multilineNoteFinalV186");
          el.style.background = "#fff7e6";
          el.style.border = "1px solid #f6d58d";
          el.style.borderLeft = "6px solid #9f1239";
          el.style.borderRadius = "16px";
          el.style.color = "#7f1d1d";
          el.style.fontSize = "13px";
          el.style.fontWeight = "850";
          el.style.lineHeight = "1.45";
          el.style.padding = "10px 12px";
          el.style.margin = "8px 0 8px 0";
          el.style.whiteSpace = "pre-line";
          el.style.boxShadow = "0 6px 16px rgba(159,18,57,.06)";
        }
      });
    });
  }

  function patchRender(){
    if(typeof window.renderPreview === "function" && !window.renderPreview.__multiNoteV186){
      const original = window.renderPreview;
      window.renderPreview = function(){
        const result = original.apply(this, arguments);
        forceMultilineNoteStyle();
        setTimeout(forceMultilineNoteStyle, 20);
        setTimeout(forceMultilineNoteStyle, 120);
        return result;
      };
      window.renderPreview.__multiNoteV186 = true;
    }

    if(typeof window.renderAll === "function" && !window.renderAll.__multiNoteV186){
      const original = window.renderAll;
      window.renderAll = function(){
        const result = original.apply(this, arguments);
        forceMultilineNoteStyle();
        setTimeout(forceMultilineNoteStyle, 50);
        setTimeout(forceMultilineNoteStyle, 160);
        return result;
      };
      window.renderAll.__multiNoteV186 = true;
    }
  }

  function run(){
    patchRender();
    forceMultilineNoteStyle();
  }

  window.addEventListener("load",()=>{
    setTimeout(run,250);
    setTimeout(run,900);
    setTimeout(run,1800);
  });

  const obs = new MutationObserver(()=>{
    clearTimeout(window.__multiNoteV186);
    window.__multiNoteV186 = setTimeout(run,90);
  });

  obs.observe(document.body,{childList:true,subtree:true});
})();
