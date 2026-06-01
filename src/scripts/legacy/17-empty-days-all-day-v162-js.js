(function(){
  function fixEmptyDaysV162(){
    document.querySelectorAll(".previewPage table tbody tr").forEach(row=>{
      const timeCell = row.querySelector(".timeCell");
      const eventCell = row.querySelector(".eventCell");
      if(!timeCell || !eventCell) return;

      const eventText = (eventCell.textContent || "").trim();

      if(!eventText){
        row.classList.add("emptyDayV162");
        if((timeCell.textContent || "").trim() !== ""){
          timeCell.textContent = "";
        }
        return;
      }

      row.classList.remove("emptyDayV162");

      const range = timeCell.querySelector(".timeRangeV161");
      if(range && /celý den|cely den/i.test(range.textContent || "")){
        range.textContent = "celý den";
      }
    });
  }

  window.addEventListener("load",()=>{
    setTimeout(fixEmptyDaysV162,400);
    setTimeout(fixEmptyDaysV162,1200);
    setTimeout(fixEmptyDaysV162,2400);
  });

  const obs = new MutationObserver(()=>{
    clearTimeout(window.__v162);
    window.__v162 = setTimeout(fixEmptyDaysV162,100);
  });

  obs.observe(document.body,{childList:true,subtree:true});
})();
