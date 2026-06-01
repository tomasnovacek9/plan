function arrangeWeekPanelV5(){
  // najdeme sekci s ovládáním týdne podle tlačítek
  const buttons = Array.from(document.querySelectorAll("button"));
  const reloadBtn = buttons.find(b => (b.textContent || "").toLowerCase().includes("znovu načíst"));
  const currentBtn = buttons.find(b => (b.textContent || "").toLowerCase().includes("aktuální týden"));
  const prevBtn = buttons.find(b => (b.textContent || "").toLowerCase().includes("předchozí"));
  const nextBtn = buttons.find(b => (b.textContent || "").toLowerCase().includes("další"));
  const weekFrom = document.getElementById("weekFrom");
  const weekTo = document.getElementById("weekTo");

  if(!reloadBtn || !currentBtn || !prevBtn || !nextBtn || !weekFrom || !weekTo) return;

  const section = reloadBtn.closest(".section") || weekFrom.closest(".section");
  if(!section || section.dataset.v5arranged) return;
  section.dataset.v5arranged = "1";

  const grid = document.createElement("div");
  grid.className = "weekButtonGridV5";

  reloadBtn.classList.add("full");

  grid.appendChild(reloadBtn);
  grid.appendChild(currentBtn);
  grid.appendChild(prevBtn);
  grid.appendChild(nextBtn);

  const dates = document.createElement("div");
  dates.className = "weekDatesV5";

  const fromField = weekFrom.closest(".field");
  const toField = weekTo.closest(".field");

  if(fromField) dates.appendChild(fromField);
  if(toField) dates.appendChild(toField);

  const title = section.querySelector(".sectionTitle");
  const insertAfter = title || section.firstChild;
  if(insertAfter && insertAfter.nextSibling){
    section.insertBefore(grid, insertAfter.nextSibling);
    section.insertBefore(dates, grid.nextSibling);
  }else{
    section.prepend(dates);
    section.prepend(grid);
  }

  // zrušit prázdné původní kontejnery
  section.querySelectorAll(".weekTools,.rowButtons").forEach(el=>{
    if(!el.contains(grid) && (el.textContent || "").trim()===""){
      el.style.display="none";
    }
  });
}

function fixTitlesV5(){
  document.querySelectorAll(".sectionTitle").forEach(t=>{
    t.style.textAlign = "left";
    t.style.justifyContent = "flex-start";
  });
}

window.addEventListener("load",()=>{
  setTimeout(()=>{arrangeWeekPanelV5(); fixTitlesV5();},400);
});
setTimeout(()=>{arrangeWeekPanelV5(); fixTitlesV5();},1000);
