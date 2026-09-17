window.addEventListener("load",()=>{
  const clearCurrentDayHighlight = ()=>{
    document.querySelectorAll(".currentDayRowV323").forEach(row=>row.classList.remove("currentDayRowV323"));
  };
  clearCurrentDayHighlight();
  new MutationObserver(clearCurrentDayHighlight).observe(document.body, {
    childList:true,
    subtree:true,
    attributes:true,
    attributeFilter:["class"]
  });

  const ROLE_KEY = "tydenni_plan_role_v325";
  const titleBlock = document.querySelector(".top .school")?.parentElement;
  if(titleBlock && !document.querySelector(".roleModeV325")){
    const role = document.createElement("label");
    role.className = "roleModeV325";
    role.innerHTML = `
      <span>Režim</span>
      <select aria-label="Režim práce">
        <option value="hospodarka">Hospodářka</option>
        <option value="ucitel">Učitel</option>
        <option value="reditel">Ředitel</option>
      </select>
    `;
    const select = role.querySelector("select");
    select.value = localStorage.getItem(ROLE_KEY) || "reditel";
    document.body.dataset.planRoleV325 = select.value;
    select.addEventListener("change", ()=>{
      localStorage.setItem(ROLE_KEY, select.value);
      document.body.dataset.planRoleV325 = select.value;
    });
    titleBlock.appendChild(role);
  }

  const hidePanelSectionByTitle = (titleText)=>{
    [...document.querySelectorAll(".panel .sectionTitle")].forEach(title=>{
      if((title.textContent || "").trim().toLowerCase() === titleText){
        const section = title.closest(".section");
        if(section) section.style.display = "none";
      }
    });
  };

  hidePanelSectionByTitle("podpis");
  document.querySelectorAll(".esborovnaTopButtonV102").forEach(el=>el.style.display="none");
});
