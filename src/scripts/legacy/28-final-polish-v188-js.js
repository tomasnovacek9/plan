(function(){
  function noteInput(){
    return document.getElementById("weeklyNoteInput");
  }

  function normalize(t){
    return String(t || "").replace(/\r\n/g,"\n").replace(/\r/g,"\n").trim();
  }

  function fixMultilineNoteFinalV188(){
    const input = noteInput();
    const note = normalize(input?.value || "");
    if(!note) return;

    const noteFlat = note.replace(/\s+/g," ");

    document.querySelectorAll(".previewPage").forEach(page=>{
      [...page.querySelectorAll("div,p,section")].forEach(el=>{
        if(el.closest("table")) return;

        const elText = normalize(el.textContent || "");
        const elFlat = elText.replace(/\s+/g," ");

        const isNote =
          elFlat === noteFlat ||
          el.classList.contains("notePreviewNoBlueV182") ||
          el.classList.contains("multilineNoteFinalV186") ||
          el.classList.contains("planMessageFixedV180") ||
          el.classList.contains("planMessage") ||
          el.classList.contains("planNoteRedV179");

        if(isNote){
          el.classList.remove("notice");
          el.classList.add("notePreviewNoBlueV182");
          el.style.background = "#fff7e6";
          el.style.border = "1px solid #f6d58d";
          el.style.borderLeft = "6px solid #9f1239";
          el.style.borderRadius = "16px";
          el.style.color = "#7f1d1d";
          el.style.fontFamily = "'Open Sans', sans-serif";
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

  function patchRenderV188(){
    if(typeof window.renderPreview === "function" && !window.renderPreview.__finalPolishV188){
      const original = window.renderPreview;
      window.renderPreview = function(){
        const result = original.apply(this, arguments);
        requestAnimationFrame(fixMultilineNoteFinalV188);
        setTimeout(fixMultilineNoteFinalV188, 80);
        return result;
      };
      window.renderPreview.__finalPolishV188 = true;
    }

    if(typeof window.renderAll === "function" && !window.renderAll.__finalPolishV188){
      const original = window.renderAll;
      window.renderAll = function(){
        const result = original.apply(this, arguments);
        requestAnimationFrame(fixMultilineNoteFinalV188);
        setTimeout(fixMultilineNoteFinalV188, 100);
        return result;
      };
      window.renderAll.__finalPolishV188 = true;
    }
  }

  function runV188(){
    patchRenderV188();
    fixMultilineNoteFinalV188();
  }

  window.addEventListener("load",()=>{
    setTimeout(runV188,250);
    setTimeout(runV188,900);
    setTimeout(runV188,1800);
  });

  const obs = new MutationObserver(()=>{
    clearTimeout(window.__finalPolishV188);
    window.__finalPolishV188 = setTimeout(runV188,100);
  });

  obs.observe(document.body,{childList:true,subtree:true});
})();
