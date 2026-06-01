function setEduBadgeLockV89(state){
  const holder = document.getElementById("calendarInfo");
  if(!holder) return;

  let badge = holder.querySelector(".eduBadgeLockV89");

  if(!badge){
    holder.innerHTML = "";
    badge = document.createElement("div");
    badge.className = "eduBadgeLockV89";
    badge.innerHTML = '<span class="dot"></span><span class="txt"></span>';
    holder.appendChild(badge);
  }

  const finalState = state || "connected";
  badge.className = "eduBadgeLockV89 " + finalState;

  const txt = badge.querySelector(".txt");
  if(txt){
    txt.textContent =
      finalState === "loading" ? "EduPage načítání" :
      finalState === "error" ? "EduPage nedostupné" :
      "EduPage připojeno";
  }
}

function protectEduBadgeLockV89(){
  const holder = document.getElementById("calendarInfo");
  if(!holder) return;

  if(!holder.querySelector(".eduBadgeLockV89")){
    const t = (holder.textContent || "").toLowerCase();
    if(t.includes("načít") || t.includes("nacit")){
      setEduBadgeLockV89("loading");
    }else if(t.includes("nepodař") || t.includes("nedostup") || t.includes("chyba")){
      setEduBadgeLockV89("error");
    }else{
      setEduBadgeLockV89("connected");
    }
  }
}

// Přesměrování starší stavové funkce, pokud existuje.
window.setEdupageStatusV55 = function(state){
  setEduBadgeLockV89(
    state === "loading" ? "loading" :
    state === "error" ? "error" :
    "connected"
  );
};

window.addEventListener("load",()=>{
  setEduBadgeLockV89("connected");
  setTimeout(protectEduBadgeLockV89,200);
  setTimeout(protectEduBadgeLockV89,900);
});

const eduBadgeObsV89 = new MutationObserver(()=>{
  clearTimeout(window.__eduBadgeV89);
  window.__eduBadgeV89 = setTimeout(protectEduBadgeLockV89,60);
});
eduBadgeObsV89.observe(document.body,{childList:true,subtree:true});
