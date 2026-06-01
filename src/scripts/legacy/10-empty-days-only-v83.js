function cleanEmptyDaysV83(){
  document.querySelectorAll(".previewPage table tbody tr").forEach(row=>{
    const timeCell = row.querySelector(".timeCell");
    const eventCell = row.querySelector(".eventCell");
    if(!timeCell || !eventCell) return;

    const eventText = (eventCell.textContent || "").trim();
    if(!eventText){
      timeCell.textContent = "";
    }
  });
}

window.addEventListener("load",()=>{
  setTimeout(cleanEmptyDaysV83,600);
  setTimeout(cleanEmptyDaysV83,1500);
});

const emptyObsV83 = new MutationObserver(()=>{
  clearTimeout(window.__emptyV83);
  window.__emptyV83 = setTimeout(cleanEmptyDaysV83,120);
});
emptyObsV83.observe(document.body,{childList:true,subtree:true});
