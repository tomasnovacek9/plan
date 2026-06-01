function cleanCalendarButtonsV55(){
  document.querySelectorAll("button").forEach(btn=>{
    const t = (btn.textContent || "").toLowerCase();
    if(
      t.includes("znovu načíst kalendář") ||
      t.includes("znovu nacist kalendar") ||
      t.includes("aktuální týden") ||
      t.includes("aktualni tyden")
    ){
      btn.style.display = "none";
    }
  });
}
window.addEventListener("load",()=>{
  setTimeout(cleanCalendarButtonsV55,300);
  setTimeout(cleanCalendarButtonsV55,1000);
});
const cleanBtnObsV55 = new MutationObserver(()=>{
  clearTimeout(window.__cleanBtnV55);
  window.__cleanBtnV55 = setTimeout(cleanCalendarButtonsV55,100);
});
cleanBtnObsV55.observe(document.body,{childList:true,subtree:true});
