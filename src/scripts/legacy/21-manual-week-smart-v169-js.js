(function(){
  const STORAGE_KEY = "tydenni_plan_manual_events_v167";
  const LESSONS_V300 = [
    { id:"0", label:"0. hodina", from:"07:10", to:"07:55" },
    { id:"1", label:"1. hodina", from:"08:00", to:"08:45" },
    { id:"2", label:"2. hodina", from:"08:55", to:"09:40" },
    { id:"3", label:"3. hodina", from:"10:00", to:"10:45" },
    { id:"4", label:"4. hodina", from:"10:55", to:"11:40" },
    { id:"5", label:"5. hodina", from:"11:50", to:"12:35" },
    { id:"6", label:"6. hodina", from:"12:45", to:"13:30" },
    { id:"7", label:"7. hodina", from:"13:15", to:"14:00" },
    { id:"8", label:"8. hodina", from:"14:00", to:"14:45" },
    { id:"9", label:"9. hodina", from:"14:50", to:"15:35" },
    { id:"10", label:"10. hodina", from:"15:35", to:"16:20" }
  ];
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

    enhanceTimeInputs();

    let mode = document.querySelector(".manualQuickV169");
    if(!mode){
      mode = document.createElement("div");
      mode.className = "manualQuickV169";
      const timeRow = document.getElementById("manualTimeRowV167");
      if(timeRow) timeRow.insertAdjacentElement("beforebegin", mode);
      else grid.insertBefore(mode, grid.children[2] || null);
    }
    mode.classList.add("manualTimeModeV300");
    if(mode.dataset.modeReadyV300 !== "1"){
      mode.innerHTML = `
        <label>Čas záznamu</label>
        <div class="manualTimeModeGridV300">
          <button type="button" class="manualModeBtnV300" data-time-mode="time">Čas po 5 min</button>
          <button type="button" class="manualModeBtnV300" data-time-mode="lesson">Vyučovací hodiny</button>
          <button type="button" class="manualModeBtnV300" data-time-mode="allDay">Celý den</button>
        </div>
      `;
      mode.dataset.modeReadyV300 = "1";
    }
    attachModeButtons();

    if(!document.querySelector(".manualLessonPickerV300")){
      const picker = document.createElement("div");
      picker.className = "manualLessonPickerV300";
      picker.innerHTML = `
        <label>Vyučovací hodina</label>
        <select id="manualLessonFromV300" aria-label="Od hodiny">
          <option value="">Od hodiny</option>
          ${LESSONS_V300.map(x=>`<option value="${x.id}">${x.label}</option>`).join("")}
        </select>
        <select id="manualLessonToV300" aria-label="Do hodiny">
          <option value="">Do hodiny</option>
          ${LESSONS_V300.map(x=>`<option value="${x.id}">${x.label}</option>`).join("")}
        </select>
      `;
      const timeRow = document.getElementById("manualTimeRowV167");
      if(timeRow) timeRow.insertAdjacentElement("beforebegin", picker);
      else grid.insertBefore(picker, grid.children[2] || null);

      picker.querySelectorAll("select").forEach(select=>{
        select.addEventListener("change",applyLessonRange);
      });
    }

    if(!document.querySelector(".manualTimeHintV169")){
      const hint = document.createElement("div");
      hint.className = "manualTimeHintV169";
      hint.textContent = "Čas lze zadat ručně po 5 minutách, vyučovací hodinou, nebo jako celý den.";
      const timeRow = document.getElementById("manualTimeRowV167");
      if(timeRow) timeRow.insertAdjacentElement("afterend", hint);
    }

    setTimeMode(currentTimeMode());
  }

  function attachModeButtons(){
    document.querySelectorAll(".manualModeBtnV300[data-time-mode]").forEach(btn=>{
      if(btn.dataset.modeBoundV300 === "1") return;
      btn.dataset.modeBoundV300 = "1";
      btn.addEventListener("click",()=>setTimeMode(btn.dataset.timeMode));
    });
  }

  function enhanceTimeInputs(){
    ["manualFromV167","manualToV167"].forEach(id=>{
      const field = document.getElementById(id);
      if(!field || field.dataset.timeInputV300 === "1") return;
      if(field.tagName === "INPUT"){
        field.type = "time";
        field.step = "300";
        field.dataset.timeInputV300 = "1";
        return;
      }
      const input = document.createElement("input");
      input.type = "time";
      input.id = id;
      input.value = field.value || "";
      input.step = "300";
      input.min = "06:00";
      input.max = "20:00";
      input.dataset.timeInputV300 = "1";
      input.setAttribute("aria-label", id === "manualFromV167" ? "Čas od" : "Čas do");
      field.replaceWith(input);
    });
  }

  function setVal(id,v){
    const el = document.getElementById(id);
    if(el) el.value = v;
  }

  function currentTimeMode(){
    const type = document.getElementById("manualTypeV167");
    if(type?.value === "allDay") return "allDay";
    if(document.getElementById("manualLessonFromV300")?.value) return "lesson";
    return "time";
  }

  function setTimeMode(mode){
    const type = document.getElementById("manualTypeV167");
    const row = document.getElementById("manualTimeRowV167");
    const picker = document.querySelector(".manualLessonPickerV300");
    const lessonFrom = document.getElementById("manualLessonFromV300");
    const lessonTo = document.getElementById("manualLessonToV300");

    if(mode === "allDay"){
      if(type) type.value = "allDay";
      if(row) row.style.display = "none";
      if(picker) picker.style.display = "none";
      setVal("manualFromV167","");
      setVal("manualToV167","");
      if(lessonFrom) lessonFrom.value = "";
      if(lessonTo) lessonTo.value = "";
    }else if(mode === "lesson"){
      if(type) type.value = "time";
      if(row) row.style.display = "grid";
      if(picker) picker.style.display = "grid";
    }else{
      if(type) type.value = "time";
      if(row) row.style.display = "grid";
      if(picker) picker.style.display = "none";
      if(lessonFrom) lessonFrom.value = "";
      if(lessonTo) lessonTo.value = "";
    }

    document.querySelectorAll(".manualModeBtnV300[data-time-mode]").forEach(btn=>{
      btn.classList.toggle("active", btn.dataset.timeMode === mode);
    });
  }

  function applyLessonRange(){
    const fromSelect = document.getElementById("manualLessonFromV300");
    const toSelect = document.getElementById("manualLessonToV300");
    const fromIndex = LESSONS_V300.findIndex(x=>x.id === fromSelect?.value);
    let toIndex = LESSONS_V300.findIndex(x=>x.id === toSelect?.value);
    if(fromIndex < 0){
      setVal("manualFromV167","");
      setVal("manualToV167","");
      return;
    }
    if(toIndex < 0 || toIndex < fromIndex){
      toIndex = fromIndex;
      if(toSelect) toSelect.value = LESSONS_V300[toIndex].id;
    }
    const type = document.getElementById("manualTypeV167");
    const row = document.getElementById("manualTimeRowV167");
    if(type) type.value = "time";
    if(row) row.style.display = "grid";
    setVal("manualFromV167",LESSONS_V300[fromIndex].from);
    setVal("manualToV167",LESSONS_V300[toIndex].to);
    setTimeMode("lesson");
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
      setTimeMode("allDay");
    }else{
      if(type) type.value = "time";
      if(row) row.style.display = "grid";
      if(from) from.value = ev.from || "";
      if(to) to.value = ev.to || "";
      setTimeMode("time");
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
