(function(){
  async function reloadCalendarForCurrentWeekV54(){
    if(window.__reloadingCalendarV54) return;
    window.__reloadingCalendarV54 = true;

    try{
      if(typeof loadCalendarFromUrl === "function"){
        await loadCalendarFromUrl();
      }else if(typeof window.loadCalendarFromUrl === "function"){
        await window.loadCalendarFromUrl();
      }else if(typeof renderAll === "function"){
        renderAll();
      }
    }catch(e){
      console.warn("Kalendář se nepodařilo znovu načíst:", e);
      if(typeof renderAll === "function") renderAll();
    }finally{
      window.__reloadingCalendarV54 = false;
    }
  }

  function wrapFunctionV54(name){
    const fn = window[name];
    if(typeof fn !== "function" || fn.__reloadWrappedV54) return;

    const wrapped = function(){
      const result = fn.apply(this, arguments);

      // necháme původní funkci nejdřív změnit datum týdne
      setTimeout(reloadCalendarForCurrentWeekV54, 60);

      return result;
    };

    wrapped.__reloadWrappedV54 = true;
    window[name] = wrapped;
  }

  function installReloadV54(){
    // typické názvy funkcí podle aplikace
    [
      "setCurrentWeek",
      "setThisWeek",
      "goCurrentWeek",
      "previousWeek",
      "prevWeek",
      "nextWeek",
      "setPreviousWeek",
      "setNextWeek"
    ].forEach(wrapFunctionV54);

    // záloha: podle textu tlačítek
    document.querySelectorAll("button").forEach(btn=>{
      const text = (btn.textContent || "").toLowerCase();

      const isWeekButton =
        text.includes("aktuální týden") ||
        text.includes("předchozí týden") ||
        text.includes("další týden");

      if(isWeekButton && !btn.dataset.reloadCalendarV54){
        btn.dataset.reloadCalendarV54 = "1";
        btn.addEventListener("click",()=>{
          setTimeout(reloadCalendarForCurrentWeekV54, 120);
        });
      }
    });
  }

  window.addEventListener("load",()=>{
    setTimeout(installReloadV54, 300);
    setTimeout(installReloadV54, 1000);
  });

  const observer = new MutationObserver(()=>{
    clearTimeout(window.__installReloadV54);
    window.__installReloadV54 = setTimeout(installReloadV54, 100);
  });
  observer.observe(document.body,{childList:true,subtree:true});
})();
