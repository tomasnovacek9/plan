window.addEventListener("load",()=>{
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
