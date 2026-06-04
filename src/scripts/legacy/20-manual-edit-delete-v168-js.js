(function(){
  const STORAGE_KEY = "tydenni_plan_manual_events_v167";

  function load(){
    try{
      window.manualEventsV167 = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if(!Array.isArray(window.manualEventsV167)) window.manualEventsV167 = [];
    }catch(e){
      window.manualEventsV167 = [];
    }
  }

  function save(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(window.manualEventsV167 || [])); }catch(e){}
  }

  function byId(id){
    load();
    return (window.manualEventsV167 || []).find(e => e.uid === id);
  }

  function getEl(id){ return document.getElementById(id); }

  function formatItem(e){
    const time = e.from === "celý den" ? "celý den" : `${e.from || ""}${e.to ? " - " + e.to : ""}`;
    return `<strong>${e.date || ""}</strong> · ${time}<br>${e.title || ""}${e.person ? " · " + e.person : ""}`;
  }

  function renderManualListV168(){
    load();

    const box = document.querySelector(".manualEventV167");
    if(!box) return;

    let list = box.querySelector(".manualListV168");
    if(!list){
      list = document.createElement("div");
      list.className = "manualListV168";
      box.querySelector(".manualEventGridV167")?.appendChild(list);
    }

    const events = window.manualEventsV167 || [];

    if(!events.length){
      list.innerHTML = "";
      return;
    }

    list.innerHTML = `
      <div class="manualListTitleV168">Ručně přidané záznamy</div>
      ${events.map(e=>`
        <div class="manualItemV168" data-id="${e.uid}">
          <div class="manualItemTextV168">${formatItem(e)}</div>
          <button type="button" class="manualMiniBtnV168" data-edit="${e.uid}">Upravit</button>
          <button type="button" class="manualMiniBtnV168 manualDeleteBtnV168" data-delete="${e.uid}">Smazat</button>
        </div>
      `).join("")}
    `;

    list.querySelectorAll("[data-edit]").forEach(btn=>{
      btn.addEventListener("click",()=>startEditV168(btn.dataset.edit));
    });

    list.querySelectorAll("[data-delete]").forEach(btn=>{
      btn.addEventListener("click",()=>deleteManualV168(btn.dataset.delete));
    });
  }

  function ensureEditControlsV168(){
    const grid = document.querySelector(".manualEventGridV167");
    if(!grid) return;

    if(!getEl("manualEditNoticeV168")){
      const n = document.createElement("div");
      n.id = "manualEditNoticeV168";
      n.className = "manualEditNoticeV168";
      n.textContent = "Upravuješ ručně přidaný záznam. Po změně klikni na Uložit změny.";
      grid.insertBefore(n, grid.firstChild);
    }

    if(!getEl("manualCancelV168")){
      const b = document.createElement("button");
      b.type = "button";
      b.id = "manualCancelV168";
      b.className = "manualCancelBtnV168";
      b.textContent = "Zrušit úpravu";
      b.addEventListener("click",cancelEditV168);
      const addBtn = getEl("manualAddV167");
      if(addBtn) addBtn.insertAdjacentElement("afterend", b);
      else grid.appendChild(b);
    }
  }

  function setSelectValue(sel, val){
    if(!sel) return;
    if(sel.tagName !== "SELECT"){
      sel.value = val || "";
      return;
    }
    if(val && ![...sel.options].some(o=>o.value===val)){
      const o = document.createElement("option");
      o.value = val;
      o.textContent = val;
      sel.appendChild(o);
    }
    sel.value = val || "";
  }

  function startEditV168(id){
    const e = byId(id);
    if(!e) return;

    ensureEditControlsV168();

    getEl("manualDayV167").value = e.date || "";
    getEl("manualTitleV167").value = e.title || "";
    getEl("manualPersonV167").value = e.person || "";
    if(getEl("manualStyleSizeV306")) getEl("manualStyleSizeV306").value = e.style?.size || "10pt";
    if(getEl("manualStyleColorV306")) getEl("manualStyleColorV306").value = e.style?.color || "#172033";
    if(getEl("manualStyleBoldV306")) getEl("manualStyleBoldV306").checked = !!e.style?.bold;

    const type = getEl("manualTypeV167");
    const row = getEl("manualTimeRowV167");

    if(e.from === "celý den"){
      if(type) type.value = "allDay";
      if(row) row.style.display = "none";
      setSelectValue(getEl("manualFromV167"), "");
      setSelectValue(getEl("manualToV167"), "");
    }else{
      if(type) type.value = "time";
      if(row) row.style.display = "grid";
      setSelectValue(getEl("manualFromV167"), e.from || "");
      setSelectValue(getEl("manualToV167"), e.to || "");
    }

    window.editingManualV168 = id;

    const addBtn = getEl("manualAddV167");
    if(addBtn) addBtn.textContent = "Uložit změny";

    getEl("manualEditNoticeV168")?.classList.add("show");
    getEl("manualCancelV168")?.classList.add("show");
  }

  function cancelEditV168(){
    window.editingManualV168 = null;

    const addBtn = getEl("manualAddV167");
    if(addBtn) addBtn.textContent = "Přidat do plánu";

    getEl("manualEditNoticeV168")?.classList.remove("show");
    getEl("manualCancelV168")?.classList.remove("show");

    if(getEl("manualTitleV167")) getEl("manualTitleV167").value = "";
    if(getEl("manualPersonV167")) getEl("manualPersonV167").value = "";
    if(getEl("manualFromV167")) getEl("manualFromV167").value = "";
    if(getEl("manualToV167")) getEl("manualToV167").value = "";
    if(getEl("manualStyleSizeV306")) getEl("manualStyleSizeV306").value = "10pt";
    if(getEl("manualStyleColorV306")) getEl("manualStyleColorV306").value = "#172033";
    if(getEl("manualStyleBoldV306")) getEl("manualStyleBoldV306").checked = false;
  }

  function deleteManualV168(id){
    load();
    const e = byId(id);
    if(!e) return;

    if(!confirm("Smazat tento ručně přidaný záznam?")) return;

    window.manualEventsV167 = (window.manualEventsV167 || []).filter(x=>x.uid !== id);
    save();

    if(window.editingManualV168 === id) cancelEditV168();

    if(typeof window.renderAll === "function") window.renderAll();
    else if(typeof window.renderPreview === "function") window.renderPreview();

    renderManualListV168();
  }

  function patchAddButtonV168(){
    const addBtn = getEl("manualAddV167");
    if(!addBtn || addBtn.__editDeleteV168) return;

    addBtn.__editDeleteV168 = true;

    // náš listener běží v capture a při editaci zastaví původní "přidat"
    addBtn.addEventListener("click", function(ev){
      if(!window.editingManualV168) return;

      ev.preventDefault();
      ev.stopImmediatePropagation();

      load();

      const e = byId(window.editingManualV168);
      if(!e) return cancelEditV168();

      const date = getEl("manualDayV167")?.value;
      const title = getEl("manualTitleV167")?.value.trim();
      const person = getEl("manualPersonV167")?.value.trim();
      const type = getEl("manualTypeV167")?.value;

      if(!date || !title){
        alert("Vyplň prosím den a název akce.");
        return;
      }

      let from = "celý den";
      let to = "";

      if(type !== "allDay"){
        from = getEl("manualFromV167")?.value || "";
        to = getEl("manualToV167")?.value || "";
        if(!from || !to){
          alert("Vyber prosím čas od i čas do, nebo zvol Celý den.");
          return;
        }
      }

      e.date = date;
      e.title = title;
      e.person = person || "";
      e.from = from;
      e.to = to;
      e.style = {
        size: getEl("manualStyleSizeV306")?.value || "10pt",
        color: getEl("manualStyleColorV306")?.value || "",
        bold: !!getEl("manualStyleBoldV306")?.checked
      };

      save();
      cancelEditV168();

      if(typeof window.renderAll === "function") window.renderAll();
      else if(typeof window.renderPreview === "function") window.renderPreview();

      renderManualListV168();
    }, true);
  }

  function runV168(){
    ensureEditControlsV168();
    patchAddButtonV168();
    renderManualListV168();
  }

  runV168();
})();
