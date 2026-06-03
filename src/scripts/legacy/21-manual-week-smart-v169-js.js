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
  const TIME_VALUES_V301 = timeValuesV301();

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
    if(Number(m[1]) === 0 && Number(m[2]) === 0) return 24 * 60;
    return Number(m[1])*60 + Number(m[2]);
  }

  function ensureSmartControls(){
    const grid = document.querySelector(".manualEventGridV167");
    if(!grid) return;

    enhanceTimeInputs();
    ensureDatePicker();
    ensureTimeWheel();
    document.querySelector(".manualTimeSummaryV301")?.remove();

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
          <button type="button" class="manualModeBtnV300" data-time-mode="time">Čas</button>
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
          ${LESSONS_V300.map(x=>`<option value="${x.id}">${x.label} (${x.from} - ${x.to})</option>`).join("")}
        </select>
        <select id="manualLessonToV300" aria-label="Do hodiny">
          <option value="">Do hodiny</option>
          ${LESSONS_V300.map(x=>`<option value="${x.id}">${x.label} (${x.from} - ${x.to})</option>`).join("")}
        </select>
      `;
      const timeRow = document.getElementById("manualTimeRowV167");
      if(timeRow) timeRow.insertAdjacentElement("beforebegin", picker);
      else grid.insertBefore(picker, grid.children[2] || null);

      picker.querySelectorAll("select").forEach(select=>{
        select.addEventListener("change",applyLessonRange);
      });
    }

    document.querySelector(".manualTimeHintV169")?.remove();

    setTimeMode(currentTimeMode());
    syncDatePicker();
    syncTimeWheel();
    patchAddCommit();
  }

  function timeValuesV301(){
    const out = [];
    for(let h=6; h<=23; h++){
      for(let m=0; m<60; m+=5){
        out.push(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`);
      }
    }
    out.push("00:00");
    return out;
  }

  function ensureDatePicker(){
    const day = document.getElementById("manualDayV167");
    if(!day) return;

    const holder = day.closest("div");
    if(holder) holder.classList.add("manualDateNativeV301");

    let picker = document.querySelector(".manualDatePickerV301");
    if(!picker){
      picker = document.createElement("div");
      picker.className = "manualDatePickerV301";
      if(holder) holder.insertAdjacentElement("afterend", picker);
      else day.insertAdjacentElement("afterend", picker);
    }

    const signature = [...day.options].map(o=>`${o.value}:${o.textContent}`).join("|");
    if(picker.dataset.signatureV301 !== signature){
      picker.innerHTML = `
        <label>Datum</label>
        <button type="button" class="manualDateTriggerV301" aria-expanded="false">
          <span>Datum</span>
          <strong>Vybrat</strong>
        </button>
        <div class="manualDatePopoverV301" hidden>
          <div class="manualDateStripV301">
            ${[...day.options].map(o=>`
              <button type="button" class="manualDateBtnV301" data-date="${o.value}">
                <span>${escapeForHtml(o.textContent.split(" ")[0] || "")}</span>
                <strong>${escapeForHtml(o.textContent.replace(/^[^ ]+\s*/,""))}</strong>
              </button>
            `).join("")}
          </div>
        </div>
      `;
      picker.dataset.signatureV301 = signature;
      const trigger = picker.querySelector(".manualDateTriggerV301");
      const popover = picker.querySelector(".manualDatePopoverV301");
      trigger?.addEventListener("click",()=>{
        const isOpen = !popover?.hidden;
        if(popover) popover.hidden = isOpen;
        trigger.setAttribute("aria-expanded", isOpen ? "false" : "true");
      });
      picker.querySelectorAll("[data-date]").forEach(btn=>{
        btn.addEventListener("click",()=>{
          day.value = btn.dataset.date || "";
          if(popover) popover.hidden = true;
          trigger?.setAttribute("aria-expanded","false");
          syncDatePicker();
        });
      });
    }

    if(!day.dataset.dateSyncV301){
      day.dataset.dateSyncV301 = "1";
      day.addEventListener("change",syncDatePicker);
    }
  }

  function ensureTimeWheel(){
    const row = document.getElementById("manualTimeRowV167");
    if(!row) return;
    row.classList.add("manualTimeFieldsV301");

    let wheel = document.querySelector(".manualTimeWheelV301");
    if(!wheel){
      wheel = document.createElement("div");
      wheel.className = "manualTimeWheelV301";
      row.insertAdjacentElement("afterend", wheel);
    }

    if(wheel.dataset.readyV301 !== "1"){
      wheel.innerHTML = `
        <div class="manualTimeWheelColV301">
          <label>Od</label>
          <div class="manualTimeWheelListV301" data-time-list="manualFromV167">
            ${TIME_VALUES_V301.map(t=>`<button type="button" data-time="${t}">${t}</button>`).join("")}
          </div>
        </div>
        <div class="manualTimeWheelColV301">
          <label>Do</label>
          <div class="manualTimeWheelListV301" data-time-list="manualToV167">
            ${TIME_VALUES_V301.map(t=>`<button type="button" data-time="${t}">${t}</button>`).join("")}
          </div>
        </div>
      `;
      wheel.dataset.readyV301 = "1";
      wheel.querySelectorAll("[data-time-list] button").forEach(btn=>{
        btn.addEventListener("click",()=>{
          const list = btn.closest("[data-time-list]");
          setVal(list?.dataset.timeList, btn.dataset.time || "");
          syncTimeWheel();
        });
      });
      wheel.querySelectorAll(".manualTimeWheelListV301").forEach(list=>{
        list.addEventListener("scroll",()=>{
          clearTimeout(list.__wheelTimerV301);
          list.__wheelTimerV301 = setTimeout(()=>selectCenteredTime(list), 90);
        });
      });
    }

    ["manualFromV167","manualToV167"].forEach(id=>{
      const input = document.getElementById(id);
      if(!input || input.dataset.wheelSyncV301 === "1") return;
      input.dataset.wheelSyncV301 = "1";
      input.addEventListener("input",syncTimeWheel);
      input.addEventListener("change",syncTimeWheel);
    });
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
        field.min = "00:00";
        field.max = "23:55";
        field.dataset.timeInputV300 = "1";
        return;
      }
      const input = document.createElement("input");
      input.type = "time";
      input.id = id;
      input.value = field.value || "";
      input.step = "300";
      input.min = "00:00";
      input.max = "23:55";
      input.dataset.timeInputV300 = "1";
      input.setAttribute("aria-label", id === "manualFromV167" ? "Čas od" : "Čas do");
      field.replaceWith(input);
    });
  }

  function setVal(id,v){
    const el = document.getElementById(id);
    if(el) el.value = v;
  }

  function escapeForHtml(value){
    return String(value || "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#39;");
  }

  function syncDatePicker(){
    const day = document.getElementById("manualDayV167");
    if(!day) return;
    const selected = [...day.options].find(o=>o.value === day.value);
    const trigger = document.querySelector(".manualDateTriggerV301");
    if(trigger){
      const label = selected?.textContent || "Vybrat datum";
      const parts = label.split(" ");
      const strong = label.replace(/^[^ ]+\s*/,"");
      trigger.querySelector("span").textContent = parts[0] || "Datum";
      trigger.querySelector("strong").textContent = strong || "Vybrat";
    }
    document.querySelectorAll(".manualDateBtnV301[data-date]").forEach(btn=>{
      btn.classList.toggle("active", btn.dataset.date === day.value);
    });
  }

  function selectCenteredTime(list){
    if(!list || list.__syncingV301) return;
    const listRect = list.getBoundingClientRect();
    const center = listRect.top + listRect.height / 2;
    let best = null;
    let bestDistance = Infinity;
    list.querySelectorAll("button").forEach(btn=>{
      const rect = btn.getBoundingClientRect();
      const distance = Math.abs((rect.top + rect.height / 2) - center);
      if(distance < bestDistance){
        bestDistance = distance;
        best = btn;
      }
    });
    if(!best) return;
    setVal(list.dataset.timeList, best.dataset.time || "");
    syncTimeWheel();
  }

  function commitVisibleWheel(){
    document.querySelectorAll(".manualTimeWheelListV301").forEach(list=>{
      if(list.offsetParent !== null) selectCenteredTime(list);
    });
  }

  function patchAddCommit(){
    const btn = document.getElementById("manualAddV167");
    if(!btn || btn.dataset.commitUiV302 === "1") return;
    btn.dataset.commitUiV302 = "1";
    btn.addEventListener("click",()=>{
      if(currentTimeMode() === "time") commitVisibleWheel();
    }, true);
  }

  function syncTimeWheel(){
    ["manualFromV167","manualToV167"].forEach(id=>{
      const value = document.getElementById(id)?.value || "";
      const list = document.querySelector(`.manualTimeWheelListV301[data-time-list="${id}"]`);
      if(!list) return;
      let active = null;
      list.querySelectorAll("button").forEach(btn=>{
        const isActive = btn.dataset.time === value;
        btn.classList.toggle("active", isActive);
        if(isActive) active = btn;
      });
      if(active && list.dataset.lastValueV301 !== value){
        list.dataset.lastValueV301 = value;
        list.__syncingV301 = true;
        active.scrollIntoView({block:"center", inline:"nearest"});
        setTimeout(()=>{ list.__syncingV301 = false; }, 140);
      }
    });
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
      document.querySelector(".manualTimeWheelV301")?.style.setProperty("display","none");
    }else{
      if(type) type.value = "time";
      if(row) row.style.display = "grid";
      if(picker) picker.style.display = "none";
      document.querySelector(".manualTimeWheelV301")?.style.setProperty("display","grid");
      if(lessonFrom) lessonFrom.value = "";
      if(lessonTo) lessonTo.value = "";
    }

    if(mode === "allDay"){
      document.querySelector(".manualTimeWheelV301")?.style.setProperty("display","none");
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
    syncTimeWheel();
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
      syncTimeWheel();
    }else{
      if(type) type.value = "time";
      if(row) row.style.display = "grid";
      if(from) from.value = ev.from || "";
      if(to) to.value = ev.to || "";
      setTimeMode("time");
      syncTimeWheel();
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
