(function(){
  const STORAGE_KEY = "tydenni_plan_manual_events_v167";

  function load(){
    try{
      window.manualEventsV167 = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if(!Array.isArray(window.manualEventsV167)) window.manualEventsV167 = [];
    }catch(e){ window.manualEventsV167 = []; }
  }

  function save(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(window.manualEventsV167 || [])); }catch(e){}
  }

  function weekDates(){
    const from = document.getElementById("weekFrom")?.value;
    if(!from) return [];
    const start = new Date(from + "T00:00:00");
    if(isNaN(start.getTime())) return [];
    return Array.from({length:7},(_,i)=>{
      const d = new Date(start);
      d.setDate(start.getDate()+i);
      return d;
    });
  }

  function iso(d){
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }

  function currentWeekSet(){
    return new Set(weekDates().map(iso));
  }

  function isThisWeek(e){
    return currentWeekSet().has(e.date);
  }

  function formatTime(e){
    if(e.from === "celý den") return "celý den";
    return `${e.from || ""}${e.to ? " - " + e.to : ""}`;
  }

  function minutes(v){
    if(!v || /celý den|cely den/i.test(v)) return -1;
    const m = String(v).match(/(\d{1,2}):(\d{2})/);
    if(!m) return 9999;
    return Number(m[1])*60 + Number(m[2]);
  }

  function ensureSmartControls(){
    const grid = document.querySelector(".manualEventGridV167");
    if(!grid) return;

    if(!document.querySelector(".manualQuickV169")){
      const quick = document.createElement("div");
      quick.className = "manualQuickV169";
      quick.innerHTML = `
        <label>Rychlý rozsah</label>
        <div class="manualQuickGridV169">
          <button type="button" class="manualQuickBtnV169" data-quick="allDay">Celý den</button>
          <button type="button" class="manualQuickBtnV169" data-quick="morning">1.–4. hod.</button>
          <button type="button" class="manualQuickBtnV169" data-quick="zero">0. hod.</button>
          <button type="button" class="manualQuickBtnV169" data-quick="clear">Vymazat čas</button>
        </div>
      `;
      const timeRow = document.getElementById("manualTimeRowV167");
      if(timeRow) timeRow.insertAdjacentElement("beforebegin", quick);
      else grid.insertBefore(quick, grid.children[2] || null);

      quick.querySelectorAll("[data-quick]").forEach(btn=>{
        btn.addEventListener("click",()=>applyQuick(btn.dataset.quick));
      });
    }

    if(!document.querySelector(".manualTimeHintV169")){
      const hint = document.createElement("div");
      hint.className = "manualTimeHintV169";
      hint.textContent = "Tip: čas vybírej po 5 minutách, nebo použij rychlý rozsah.";
      const timeRow = document.getElementById("manualTimeRowV167");
      if(timeRow) timeRow.insertAdjacentElement("afterend", hint);
    }
  }

  function setVal(id,v){
    const el = document.getElementById(id);
    if(el) el.value = v;
  }

  function applyQuick(kind){
    const type = document.getElementById("manualTypeV167");
    const row = document.getElementById("manualTimeRowV167");

    if(kind === "allDay"){
      if(type) type.value = "allDay";
      if(row) row.style.display = "none";
      setVal("manualFromV167","");
      setVal("manualToV167","");
      return;
    }

    if(type) type.value = "time";
    if(row) row.style.display = "grid";

    const ranges = {
      morning:["08:00","11:40"],
      zero:["07:10","07:55"],
      clear:["",""]
    };

    const r = ranges[kind] || ["",""];
    setVal("manualFromV167",r[0]);
    setVal("manualToV167",r[1]);
  }

  function deleteManual(id){
    load();
    const ev = (window.manualEventsV167 || []).find(x=>x.uid===id);
    if(!ev) return;
    if(!confirm("Smazat tento ručně přidaný záznam?")) return;
    window.manualEventsV167 = (window.manualEventsV167 || []).filter(x=>x.uid!==id);
    save();
    if(typeof window.renderAll === "function") window.renderAll();
    else if(typeof window.renderPreview === "function") window.renderPreview();
    renderFilteredManualList();
  }

  function startEditFallback(id){
    const ev = (window.manualEventsV167 || []).find(x=>x.uid===id);
    if(!ev) return;
    const day = document.getElementById("manualDayV167");
    const title = document.getElementById("manualTitleV167");
    const person = document.getElementById("manualPersonV167");
    const type = document.getElementById("manualTypeV167");
    const row = document.getElementById("manualTimeRowV167");
    const from = document.getElementById("manualFromV167");
    const to = document.getElementById("manualToV167");
    if(day) day.value = ev.date || "";
    if(title) title.value = ev.title || "";
    if(person) person.value = ev.person || "";
    if(ev.from === "celý den"){
      if(type) type.value = "allDay";
      if(row) row.style.display = "none";
      if(from) from.value = "";
      if(to) to.value = "";
    }else{
      if(type) type.value = "time";
      if(row) row.style.display = "grid";
      if(from) from.value = ev.from || "";
      if(to) to.value = ev.to || "";
    }
    const nativeBtn = document.querySelector(`[data-edit="${id}"]`);
    if(nativeBtn && nativeBtn.__nativeClicked !== true){
      nativeBtn.__nativeClicked = true;
      nativeBtn.click();
      nativeBtn.__nativeClicked = false;
    }
  }

  function renderFilteredManualList(){
    load();

    const box = document.querySelector(".manualEventV167");
    if(!box) return;

    let list = box.querySelector(".manualListV168");
    if(!list) return;

    const all = window.manualEventsV167 || [];
    const week = all.filter(isThisWeek).sort((a,b)=>{
      if(a.date !== b.date) return String(a.date).localeCompare(String(b.date));
      return minutes(a.from) - minutes(b.from);
    });
    const hidden = all.length - week.length;

    if(!all.length){
      list.innerHTML = "";
      return;
    }

    if(!week.length){
      list.innerHTML = `
        <div class="manualListTitleV168">Ručně přidané záznamy</div>
        <div class="manualListWeekInfoV169">V tomto týdnu nejsou ručně přidané záznamy.</div>
        ${hidden ? `<div class="manualHiddenCountV169">Další ruční záznamy v jiných týdnech: ${hidden}</div>` : ""}
      `;
      return;
    }

    list.innerHTML = `
      <div class="manualListTitleV168">Ručně přidané záznamy v tomto týdnu</div>
      <div class="manualListWeekInfoV169">Zobrazuje se jen aktuálně vybraný týden.</div>
      ${week.map(e=>`
        <div class="manualItemV168" data-id="${e.uid}">
          <div class="manualItemTextV168"><strong>${e.date || ""}</strong> · ${formatTime(e)}<br>${e.title || ""}${e.person ? " · " + e.person : ""}</div>
          <button type="button" class="manualMiniBtnV168" data-edit="${e.uid}">Upravit</button>
          <button type="button" class="manualMiniBtnV168 manualDeleteBtnV168" data-delete="${e.uid}">Smazat</button>
        </div>
      `).join("")}
      ${hidden ? `<div class="manualHiddenCountV169">Další ruční záznamy v jiných týdnech: ${hidden}</div>` : ""}
    `;

    list.querySelectorAll("[data-edit]").forEach(btn=>{
      btn.addEventListener("click",()=>startEditFallback(btn.dataset.edit));
    });

    list.querySelectorAll("[data-delete]").forEach(btn=>{
      btn.addEventListener("click",()=>deleteManual(btn.dataset.delete));
    });
  }

  function patchWeekRefresh(){
    if(typeof window.renderAll === "function" && !window.renderAll.__weekFilterV169){
      const original = window.renderAll;
      window.renderAll = function(){
        const r = original.apply(this,arguments);
        run();
        return r;
      };
      window.renderAll.__weekFilterV169 = true;
    }

    if(typeof window.moveWeek === "function" && !window.moveWeek.__weekFilterV169){
      const original = window.moveWeek;
      window.moveWeek = function(){
        const r = original.apply(this,arguments);
        run();
        return r;
      };
      window.moveWeek.__weekFilterV169 = true;
    }
  }

  function run(){
    ensureSmartControls();
    renderFilteredManualList();
    patchWeekRefresh();
  }

  run();
})();
