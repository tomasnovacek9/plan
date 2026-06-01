(function(){
  function patchAutosaveToPreviewOnly(){
    // Po psaní jen standardně přerenderovat. Styl už je přímo v renderu.
    const input = document.getElementById("weeklyNoteInput");
    if(input && !input.__v193){
      input.__v193 = true;
      input.addEventListener("input", ()=>{
        clearTimeout(window.__renderNoteV193);
        window.__renderNoteV193 = setTimeout(()=>{
          if(typeof window.renderPreview === "function") window.renderPreview();
        }, 60);
      }, true);
    }
  }

  function run(){
    patchAutosaveToPreviewOnly();
  }

  window.addEventListener("load",()=>{
    setTimeout(run,200);
    setTimeout(run,800);
  });
})();
