(function(){
  const KEY_WEEKEND = "tydenni_plan_hide_weekend_v184";
  const KEY_CREATED = "tydenni_plan_hide_created_v184";

  function todayText(){
    const d = new Date();
    return `${String(d.getDate()).padStart(2,"0")}. ${String(d.getMonth()+1).padStart(2,"0")}. ${d.getFullYear()}`;
  }

  function ensureOptions(){
    if(document.querySelector(".displayOptionsV184")) return;

    const panel = document.querySelector(".panel");
    if(!panel) return;

    const box = document.createElement("div");
    box.className = "displayOptionsV184";
    box.innerHTML = `
      <div class="displayOptionsTitleV184">Zobrazení</div>
      <label class="displayOptionV184">
        <input type="checkbox" id="hideWeekendV184">
        <span>Skrýt víkend</span>
      </label>
      <label class="displayOptionV184">
        <input type="checkbox" id="hideCreatedDateV184">
        <span>Skrýt datum vytvoření</span>
      </label>
    `;

    const manual = document.querySelector(".manualEventV167") || document.querySelector(".manualEventV166") || document.querySelector(".manualEventV165");
    if(manual){
      manual.insertAdjacentElement("beforebegin", box);
    }else{
      panel.appendChild(box);
    }

    const weekend = document.getElementById("hideWeekendV184");
    const created = document.getElementById("hideCreatedDateV184");

    weekend.checked = localStorage.getItem(KEY_WEEKEND) === "1";
    created.checked = localStorage.getItem(KEY_CREATED) === "1";

    weekend.addEventListener("change",()=>{
      localStorage.setItem(KEY_WEEKEND, weekend.checked ? "1" : "0");
      applyDisplayOptions();
    });

    created.addEventListener("change",()=>{
      localStorage.setItem(KEY_CREATED, created.checked ? "1" : "0");
      applyDisplayOptions();
    });
  }

  function markWeekendRows(){
    document.querySelectorAll(".previewPage table tbody tr").forEach(row=>{
      const dayCell = row.querySelector(".dayCell");
      const text = (dayCell?.textContent || "").toLowerCase();

      if(text.includes("sobota") || text.includes("neděle") || text.includes("nedele") || text.trim().startsWith("so") || text.trim().startsWith("ne")){
        row.classList.add("weekendRowV184");
      }else{
        row.classList.remove("weekendRowV184");
      }
    });
  }

  function ensureCreatedDate(){
    document.querySelectorAll(".previewPage").forEach(page=>{
      let box = page.querySelector(".createdDateV184");
      if(!box){
        box = document.createElement("div");
        box.className = "createdDateV184";
        box.textContent = "Vytvořeno: " + todayText();

        const footer = page.querySelector(".schoolFooterInsideV166,.schoolFooterInsideV165,.schoolFooterV161,.schoolFooterV160,.schoolFooterV157");
        if(footer){
          footer.insertAdjacentElement("beforebegin", box);
        }else{
          page.appendChild(box);
        }
      }
    });
  }

  function applyDisplayOptions(){
    const hideWeekend = localStorage.getItem(KEY_WEEKEND) === "1";
    const hideCreated = localStorage.getItem(KEY_CREATED) === "1";

    document.body.classList.toggle("hideWeekendV184", hideWeekend);
    document.body.classList.toggle("hideCreatedDateV184", hideCreated);

    markWeekendRows();
    ensureCreatedDate();
  }

  function patchRender(){
    if(typeof window.renderAll === "function" && !window.renderAll.__displayV184){
      const original = window.renderAll;
      window.renderAll = function(){
        const result = original.apply(this, arguments);
        setTimeout(applyDisplayOptions, 80);
        setTimeout(applyDisplayOptions, 250);
        return result;
      };
      window.renderAll.__displayV184 = true;
    }

    if(typeof window.renderPreview === "function" && !window.renderPreview.__displayV184){
      const original = window.renderPreview;
      window.renderPreview = function(){
        const result = original.apply(this, arguments);
        setTimeout(applyDisplayOptions, 80);
        return result;
      };
      window.renderPreview.__displayV184 = true;
    }

    if(typeof window.moveWeek === "function" && !window.moveWeek.__displayV184){
      const original = window.moveWeek;
      window.moveWeek = function(){
        const result = original.apply(this, arguments);
        setTimeout(applyDisplayOptions, 150);
        return result;
      };
      window.moveWeek.__displayV184 = true;
    }
  }

  function run(){
    ensureOptions();
    patchRender();
    applyDisplayOptions();
  }

  window.addEventListener("load",()=>{
    setTimeout(run,300);
    setTimeout(run,1000);
    setTimeout(run,2200);
  });

  const obs = new MutationObserver(()=>{
    clearTimeout(window.__displayV184);
    window.__displayV184 = setTimeout(run,160);
  });

  obs.observe(document.body,{childList:true,subtree:true});
})();
