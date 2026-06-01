function fixWeekButtonsV7(){
  const buttons = Array.from(document.querySelectorAll("button"));

  const reloadBtn = buttons.find(b => (b.textContent || "").toLowerCase().includes("znovu"));
  const currentBtn = buttons.find(b => (b.textContent || "").toLowerCase().includes("aktuální"));
  const prevBtn = buttons.find(b => (b.textContent || "").toLowerCase().includes("předchozí"));
  const nextBtn = buttons.find(b => (b.textContent || "").toLowerCase().includes("další"));

  if(!currentBtn || !prevBtn || !nextBtn) return;

  const section = currentBtn.closest(".section");
  if(!section) return;

  let wrapper = document.getElementById("weekButtonsWrapperV7");
  if(wrapper) return;

  wrapper = document.createElement("div");
  wrapper.id = "weekButtonsWrapperV7";
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.gap = "8px";
  wrapper.style.marginTop = "10px";

  // první řádek
  const row1 = document.createElement("div");
  row1.style.display = "grid";
  row1.style.gridTemplateColumns = "1fr 1fr";
  row1.style.gap = "8px";

  if(reloadBtn) row1.appendChild(reloadBtn);
  row1.appendChild(currentBtn);

  // druhý řádek
  const row2 = document.createElement("div");
  row2.style.display = "grid";
  row2.style.gridTemplateColumns = "1fr 1fr";
  row2.style.gap = "8px";

  row2.appendChild(prevBtn);
  row2.appendChild(nextBtn);

  wrapper.appendChild(row1);
  wrapper.appendChild(row2);

  const title = section.querySelector(".sectionTitle");
  if(title && title.nextSibling){
    section.insertBefore(wrapper, title.nextSibling);
  }else{
    section.prepend(wrapper);
  }
}

window.addEventListener("load",()=>{
  setTimeout(fixWeekButtonsV7,500);
});
