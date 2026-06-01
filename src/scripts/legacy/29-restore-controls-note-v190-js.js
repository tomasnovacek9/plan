(function(){
  function noteInput(){
    return document.getElementById("weeklyNoteInput");
  }

  function normalize(t){
    return String(t || "").replace(/\r\n/g,"\n").replace(/\r/g,"\n").trim();
  }

  function forceNoteStyleV190(){
    const input = noteInput();
    const note = normalize(input?.value || "");
    if(!note) return;

    const noteFlat = note.replace(/\s+/g," ");

    document.querySelectorAll(".previewPage").forEach(page=>{
      [...page.querySelectorAll("div,p,section")].forEach(el=>{
        if(el.closest("table")) return;

        const txt = normalize(el.textContent || "");
        const flat = txt.replace(/\s+/g," ");

        const isNote =
          flat === noteFlat ||
          el.classList.contains("notice") && flat && noteFlat && (flat.includes(noteFlat) || noteFlat.includes(flat)) ||
          el.classList.contains("planMessage") ||
          el.classList.contains("planMessageFixedV180") ||
          el.classList.contains("planMessageStableV189") ||
          el.classList.contains("notePreviewNoBlueV182") ||
          el.classList.contains("multilineNoteFinalV186");

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

  function patchRenderV190(){
    if(typeof window.renderPreview === "function" && !window.renderPreview.__noteV190){
      const original = window.renderPreview;
      window.renderPreview = function(){
        const result = original.apply(this, arguments);
        forceNoteStyleV190();
        requestAnimationFrame(forceNoteStyleV190);
        setTimeout(forceNoteStyleV190, 40);
        return result;
      };
      window.renderPreview.__noteV190 = true;
    }

    if(typeof window.renderAll === "function" && !window.renderAll.__noteV190){
      const original = window.renderAll;
      window.renderAll = function(){
        const result = original.apply(this, arguments);
        forceNoteStyleV190();
        requestAnimationFrame(forceNoteStyleV190);
        setTimeout(forceNoteStyleV190, 60);
        return result;
      };
      window.renderAll.__noteV190 = true;
    }
  }

  function attachInputV190(){
    const input = noteInput();
    if(!input || input.__noteInputV190) return;
    input.__noteInputV190 = true;

    input.addEventListener("keydown", function(ev){
      if(ev.key === "Enter"){
        setTimeout(forceNoteStyleV190, 0);
        setTimeout(forceNoteStyleV190, 30);
        setTimeout(forceNoteStyleV190, 120);
      }
    }, true);

    input.addEventListener("input", function(){
      setTimeout(forceNoteStyleV190, 0);
      setTimeout(forceNoteStyleV190, 30);
    }, true);
  }

  function runV190(){
    patchRenderV190();
    attachInputV190();
    forceNoteStyleV190();
  }

  window.addEventListener("load",()=>{
    setTimeout(runV190,200);
    setTimeout(runV190,800);
    setTimeout(runV190,1600);
  });

  const obs = new MutationObserver(()=>{
    clearTimeout(window.__noteV190);
    window.__noteV190 = setTimeout(runV190,80);
  });

  obs.observe(document.body,{childList:true,subtree:true});
})();
