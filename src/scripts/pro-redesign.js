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
