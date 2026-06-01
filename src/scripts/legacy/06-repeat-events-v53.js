(function(){
  const COLOR_PREFIX = "repeatColorV50-";
  const MARK_CLASS = "repeatedEventV50";

  function norm(text){
    return String(text || "")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .replace(/\s+/g," ")
      .trim();
  }

  function cleanText(el){
    if(!el) return "";
    const clone = el.cloneNode(true);
    clone.querySelectorAll(".repeatEventBadgeV9,.repeatBadgeV9,.repeatEventBadgeV50").forEach(x=>x.remove());
    return norm(clone.textContent || "");
  }

  function extractClasses(text){
    const source = String(text || "");
    const found = source.match(/\b[1-9]\.?\s*[a-zá-ž]?\b/gi) || [];
    return found
      .map(x => x.toLowerCase().replace(/\s+/g,"").replace(".", "."))
      .sort()
      .join(",");
  }

  function clearRow(row){
    row.classList.remove(MARK_CLASS, "repeatedEventV9");
    for(let i=1;i<=6;i++){
      row.classList.remove(COLOR_PREFIX + i);
      row.classList.remove("repeatColorV9-" + i);
    }
  }

  function getCells(row){
    let eventCell = row.querySelector(".eventCell");
    let personCell = row.querySelector(".personCell");

    const cells = Array.from(row.querySelectorAll("td"));

    if(!eventCell && cells.length >= 2) eventCell = cells[cells.length - 2];
    if(!personCell && cells.length >= 1) personCell = cells[cells.length - 1];

    return {eventCell, personCell};
  }

  function keyFor(row){
    const {eventCell, personCell} = getCells(row);
    if(!eventCell) return "";

    const titleRaw = cleanText(eventCell);
    const personRaw = cleanText(personCell);

    if(titleRaw.length < 4) return "";

    const classes = extractClasses(titleRaw + " " + personRaw);

    // Pokud jsou v události třídy, rozhoduje název + třídy.
    // Pokud třídy nejsou rozpoznané, použijeme název + celý text zodpovídá jako zálohu.
    return titleRaw + "||" + (classes || personRaw);
  }

  function mark(){
    const rows = Array.from(document.querySelectorAll(".previewPage table tbody tr"))
      .filter(row => row.offsetParent !== null);

    const groups = new Map();

    rows.forEach(row=>{
      clearRow(row);
      const key = keyFor(row);
      if(!key) return;
      if(!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    });

    let color = 1;
    groups.forEach(group=>{
      if(group.length < 2) return;

      const cls = COLOR_PREFIX + color;
      group.forEach(row=>{
        row.classList.add(MARK_CLASS, cls);
      });

      color++;
      if(color > 6) color = 1;
    });
  }

  function schedule(){
    clearTimeout(window.__repeatV53Timer);
    window.__repeatV53Timer = setTimeout(mark, 80);
  }

  const tryWrap = () => {
    if(typeof window.renderAll === "function" && !window.renderAll.__repeatV53Wrapped){
      const original = window.renderAll;
      window.renderAll = function(){
        const result = original.apply(this, arguments);
        setTimeout(mark, 0);
        setTimeout(mark, 120);
        return result;
      };
      window.renderAll.__repeatV53Wrapped = true;
    }
  };

  window.addEventListener("load",()=>{
    tryWrap();
    setTimeout(mark, 300);
    setTimeout(mark, 900);
    setTimeout(mark, 1800);
  });

  setTimeout(tryWrap, 300);
  setTimeout(tryWrap, 1000);

  const observer = new MutationObserver(schedule);
  observer.observe(document.body,{childList:true,subtree:true});

  window.markRepeatedEventsV53 = mark;
})();
