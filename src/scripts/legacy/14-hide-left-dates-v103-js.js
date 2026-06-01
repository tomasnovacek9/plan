function hideLeftDateFieldsV103(){
  ["weekFrom","weekTo"].forEach(id=>{
    const input = document.getElementById(id);
    if(!input) return;

    const field = input.closest(".field");
    if(field) field.classList.add("hideWeekDateFieldV103");

    // kdyby label nebyl uvnitř .field
    const label = document.querySelector(`label[for="${id}"]`);
    if(label) label.classList.add("hideWeekDateFieldV103");
  });
}

window.addEventListener("load",()=>{
  setTimeout(hideLeftDateFieldsV103,300);
  setTimeout(hideLeftDateFieldsV103,1200);
});

const obsV103 = new MutationObserver(()=>{
  clearTimeout(window.__v103);
  window.__v103 = setTimeout(hideLeftDateFieldsV103,120);
});
obsV103.observe(document.body,{childList:true,subtree:true});
