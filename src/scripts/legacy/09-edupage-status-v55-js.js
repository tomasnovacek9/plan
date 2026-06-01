function ensureEdupageStatusV55(){
  let status = document.getElementById("edupageStatusV55");
  if(status) return status;

  status = document.createElement("div");
  status.id = "edupageStatusV55";
  status.className = "edupageStatusV55 loading";
  status.innerHTML = `<span class="edupageStatusDotV55"></span><span class="edupageStatusTextV55">Načítání…</span>`;

  const calInfo = document.getElementById("calendarInfo");
  if(calInfo){
    calInfo.innerHTML = "";
    calInfo.appendChild(status);
  }else{
    const panel = document.querySelector(".panel");
    if(panel) panel.prepend(status);
  }

  return status;
}

function setEdupageStatusV55(state, text){
  const status = ensureEdupageStatusV55();
  status.className = "edupageStatusV55 " + state;
  const label = status.querySelector(".edupageStatusTextV55");
  if(label) label.textContent = text;
}

function setCurrentWeekOnStartV55(){
  // nastav aktuální týden hned při startu
  if(typeof setDefaultWeek === "function"){
    setDefaultWeek();
  }
}

(function(){
  const install = ()=>{
    if(typeof window.loadCalendarFromUrl === "function" && !window.loadCalendarFromUrl.__statusV55){
      const original = window.loadCalendarFromUrl;

      window.loadCalendarFromUrl = async function(){
        setEdupageStatusV55("loading","Načítání…");
        try{
          const result = await original.apply(this, arguments);
          setEdupageStatusV55("connected","EduPage připojeno");
          return result;
        }catch(e){
          setEdupageStatusV55("error","Nepřipojeno");
          throw e;
        }
      };

      window.loadCalendarFromUrl.__statusV55 = true;
    }
  };

  window.addEventListener("load",()=>{
    ensureEdupageStatusV55();
    setCurrentWeekOnStartV55();
    install();

    // po otevření rovnou načti aktuální týden
    setTimeout(()=>{
      if(typeof loadCalendarFromUrl === "function"){
        loadCalendarFromUrl();
      }
    },200);

    setTimeout(install,800);
  });

  setTimeout(install,300);
  setTimeout(install,1000);
})();
