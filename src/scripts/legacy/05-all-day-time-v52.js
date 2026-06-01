function fixAllDayEventsV52(){
  if(Array.isArray(window.events)){
    window.events.forEach(e=>{
      const from = (e.from || "").trim();
      const to = (e.to || "").trim();

      // Pokud EduPage akce nemá čas, je to celodenní akce.
      if(!from && !to){
        e.from = "celý den";
        e.to = "";
      }
    });
  }
}

function fixAllDayPreviewV52(){
  document.querySelectorAll(".previewPage table tbody tr").forEach(row=>{
    const timeCell = row.querySelector(".timeCell");
    if(!timeCell) return;

    const txt = (timeCell.textContent || "").trim();

    if(txt === "" || txt === "–" || txt === "-"){
      timeCell.textContent = "celý den";
    }
  });
}

(function(){
  const wrap = () => {
    if(typeof window.importWeekFromCalendar === "function" && !window.importWeekFromCalendar.__allDayV52){
      const originalImport = window.importWeekFromCalendar;
      window.importWeekFromCalendar = function(){
        const result = originalImport.apply(this, arguments);
        fixAllDayEventsV52();
        if(typeof window.renderAll === "function") window.renderAll();
        setTimeout(fixAllDayPreviewV52, 50);
        return result;
      };
      window.importWeekFromCalendar.__allDayV52 = true;
    }

    if(typeof window.renderAll === "function" && !window.renderAll.__allDayV52){
      const originalRender = window.renderAll;
      window.renderAll = function(){
        fixAllDayEventsV52();
        const result = originalRender.apply(this, arguments);
        setTimeout(fixAllDayPreviewV52, 50);
        return result;
      };
      window.renderAll.__allDayV52 = true;
    }
  };

  window.addEventListener("load",()=>{
    wrap();
    fixAllDayEventsV52();
    if(typeof window.renderAll === "function") window.renderAll();
    setTimeout(fixAllDayPreviewV52, 300);
    setTimeout(fixAllDayPreviewV52, 1000);
  });

  setTimeout(wrap, 300);
  setTimeout(wrap, 1000);

  const observer = new MutationObserver(()=>{
    clearTimeout(window.__allDayV52);
    window.__allDayV52 = setTimeout(fixAllDayPreviewV52, 100);
  });
  observer.observe(document.body,{childList:true,subtree:true});
})();
