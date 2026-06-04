(function(){
  const STORAGE_KEY = "tydenni_plan_manual_events_v167";

  function getEventsArray(){
    try{
      if(Array.isArray(events)) return events;
    }catch(e){}
    return null;
  }

  function loadManualEvents(){
    if(Array.isArray(window.manualEventsV167)) return;
    try{
      window.manualEventsV167 = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if(!Array.isArray(window.manualEventsV167)) window.manualEventsV167 = [];
    }catch(e){
      window.manualEventsV167 = [];
    }
  }

  function saveManualEvents(){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(window.manualEventsV167 || []));
    }catch(e){}
  }

  function isoDate(d){
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }

  function getWeekDates(){
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

  function timeOptions(){
    const out = [];
    for(let h=6; h<=20; h++){
      for(let m=0; m<60; m+=5){
        if(h===20 && m>0) continue;
        out.push(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`);
      }
    }
    return out;
  }

  function refreshDaySelect(){
    const sel = document.getElementById("manualDayV167");
    if(!sel) return;

    const old = sel.value;
    const names = ["Po","Út","St","Čt","Pá","So","Ne"];
    sel.innerHTML = "";

    getWeekDates().forEach((d,i)=>{
      const opt = document.createElement("option");
      opt.value = isoDate(d);
      opt.textContent = `${names[i]} ${d.getDate()}. ${d.getMonth()+1}.`;
      sel.appendChild(opt);
    });

    if(old && [...sel.options].some(o=>o.value===old)) sel.value = old;
  }

  function fillTimeSelects(){
    const from = document.getElementById("manualFromV167");
    const to = document.getElementById("manualToV167");
    if(!from || !to) return;
    if(from.tagName !== "SELECT" || to.tagName !== "SELECT") return;
    if(from.options.length) return;

    const opts = timeOptions();

    [from,to].forEach(sel=>{
      const empty = document.createElement("option");
      empty.value = "";
      empty.textContent = "—";
      sel.appendChild(empty);

      opts.forEach(t=>{
        const opt = document.createElement("option");
        opt.value = t;
        opt.textContent = t;
        sel.appendChild(opt);
      });
    });
  }

  function ensureManualModule(){
    if(document.querySelector(".manualEventV167")){
      setupManualControls();
      return;
    }

    const panel = document.querySelector(".panel");
    if(!panel) return;

    const note =
      document.getElementById("weeklyNoteInput")?.closest(".section") ||
      document.querySelector(".weeklyNotePanel") ||
      panel.querySelector(".section:nth-of-type(2)") ||
      panel.lastElementChild;

    const box = document.createElement("div");
    box.className = "manualEventV167";
    box.innerHTML = `
      <div class="manualEventTitleV167">Přidat vlastní záznam</div>
      <div class="manualEventGridV167">
        <div>
          <label>Den</label>
          <select id="manualDayV167"></select>
        </div>
        <div>
          <label>Typ času</label>
          <select id="manualTypeV167">
            <option value="time">Časový rozsah</option>
            <option value="allDay">Celý den</option>
          </select>
        </div>

        <div class="manualEventTimeRowV167" id="manualTimeRowV167">
          <div>
            <label>Od</label>
            <select id="manualFromV167"></select>
          </div>
          <div>
            <label>Do</label>
            <select id="manualToV167"></select>
          </div>
        </div>

        <div class="manualEventWideV167">
          <label>Akce</label>
          <input id="manualTitleV167" placeholder="Název akce">
        </div>

        <div class="manualEventWideV167">
          <label>Zodpovídá</label>
          <input id="manualPersonV167" placeholder="např. Nováková">
        </div>

        <button type="button" class="manualEventBtnV167" id="manualAddV167">Přidat do plánu</button>
      </div>
    `;

    if(note && note.parentElement) note.insertAdjacentElement("afterend", box);
    else panel.appendChild(box);

    refreshDaySelect();
    fillTimeSelects();

    setupManualControls();
  }

  function setupManualControls(){
    refreshDaySelect();
    fillTimeSelects();

    const type = document.getElementById("manualTypeV167");
    if(type && !type.__manualTypeV167){
      type.__manualTypeV167 = true;
      type.addEventListener("change", ()=>{
        const allDay = document.getElementById("manualTypeV167").value === "allDay";
        const row = document.getElementById("manualTimeRowV167");
        if(row) row.style.display = allDay ? "none" : "grid";
      });
    }

    const add = document.getElementById("manualAddV167");
    if(add && !add.__manualAddV167){
      add.__manualAddV167 = true;
      add.addEventListener("click", addManualEvent);
    }
  }

  function minutes(v){
    if(!v || /celý den|cely den/i.test(v)) return -1;
    const m = String(v).match(/(\d{1,2}):(\d{2})/);
    if(!m) return 9999;
    if(Number(m[1]) === 0 && Number(m[2]) === 0) return 24 * 60;
    return Number(m[1]) * 60 + Number(m[2]);
  }

  function mergeManualEvents(){
    loadManualEvents();

    const arr = getEventsArray();
    if(!arr) return;

    for(let i=arr.length-1; i>=0; i--){
      if(arr[i] && arr[i].manualV167) arr.splice(i,1);
    }

    window.manualEventsV167.forEach(e=>{
      arr.push({
        uid:e.uid,
        date:e.date,
        from:e.from,
        to:e.to,
        title:e.title,
        person:e.person,
        classes:e.classes || "",
        style:e.style || {},
        manualV167:true,
        source:"manual"
      });
    });

    arr.sort((a,b)=>{
      const ad = String(a.date || "");
      const bd = String(b.date || "");
      if(ad !== bd) return ad.localeCompare(bd);
      return minutes(a.from) - minutes(b.from);
    });
  }

  function addManualEvent(){
    const date = document.getElementById("manualDayV167")?.value;
    const type = document.getElementById("manualTypeV167")?.value;
    const title = document.getElementById("manualTitleV167")?.value.trim();
    const person = document.getElementById("manualPersonV167")?.value.trim();
    const style = {
      size: document.getElementById("manualStyleSizeV306")?.value || "10pt",
      color: document.getElementById("manualStyleColorV306")?.value || "",
      bold: !!document.getElementById("manualStyleBoldV306")?.checked
    };

    if(!date || !title){
      alert("Vyplň prosím den a název akce.");
      return;
    }

    let from = "celý den";
    let to = "";

    if(type !== "allDay"){
      from = document.getElementById("manualFromV167")?.value || "";
      to = document.getElementById("manualToV167")?.value || "";

      if(!from || !to){
        alert("Vyber prosím čas od i čas do, nebo zvol Celý den.");
        return;
      }

      if(minutes(to) <= minutes(from)){
        alert("Čas do musí být později než čas od.");
        return;
      }
    }

    loadManualEvents();

    window.manualEventsV167.push({
      uid:"manual-" + Date.now() + "-" + Math.random().toString(36).slice(2),
      date,
      from,
      to,
      title,
      person:person || "",
      classes:"",
      style,
      manual:true
    });

    saveManualEvents();
    mergeManualEvents();

    if(typeof renderAll === "function") renderAll();
    else if(typeof renderPreview === "function") renderPreview();

    document.getElementById("manualTitleV167").value = "";
    document.getElementById("manualPersonV167").value = "";
    document.getElementById("manualFromV167").value = "";
    document.getElementById("manualToV167").value = "";
    if(document.getElementById("manualStyleSizeV306")) document.getElementById("manualStyleSizeV306").value = "10pt";
    if(document.getElementById("manualStyleColorV306")) document.getElementById("manualStyleColorV306").value = "#172033";
    if(document.getElementById("manualStyleBoldV306")) document.getElementById("manualStyleBoldV306").checked = false;

    run();
  }

  function putFooterAtPageEnd(){
    let footer = document.querySelector(".webCopyrightV167");
    if(!footer){
      footer = document.createElement("div");
      footer.className = "webCopyrightV167";
      footer.innerHTML = `
        <div class="webCopyrightMainV167">© 2026 Základní škola Brno, Jana Babáka 1, příspěvková organizace</div>
        <div class="webCopyrightAuthorV167">Design &amp; development: Tomáš Nováček</div>
      `;
    }

    document.querySelectorAll(".schoolFooterOutsideV164,.schoolFooterInsideV165,.schoolFooterInsideV166,.schoolFooterV161,.schoolFooterV160,.schoolFooterV157").forEach(el=>el.remove());

    document.body.appendChild(footer);
  }

  function patchRender(){
    if(typeof moveWeek === "function" && !moveWeek.__manualV167){
      const original = moveWeek;
      moveWeek = function(){
        const r = original.apply(this, arguments);
        refreshDaySelect();
        return r;
      };
      moveWeek.__manualV167 = true;
    }
  }

  function run(){
    loadManualEvents();
    patchRender();
    ensureManualModule();
    fillTimeSelects();
    refreshDaySelect();
    mergeManualEvents();
    putFooterAtPageEnd();
  }

  run();
})();
