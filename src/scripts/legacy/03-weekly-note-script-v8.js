function updateWeeklyNoteV8(){
  const text = (document.getElementById("weeklyNoteInput")?.value || "").trim();

  document.querySelectorAll(".previewPage").forEach(page=>{
    let box = page.querySelector(".weeklyNotePreviewV8");

    if(!box){
      box = document.createElement("div");
      box.className = "weeklyNotePreviewV8";

      const header = page.querySelector(".docHeader, .planHeader") || page.firstElementChild;

      if(header && header.parentNode){
        header.parentNode.insertBefore(box, header.nextSibling);
      }else{
        page.prepend(box);
      }
    }

    if(text){
      box.innerHTML = text.replace(/\n/g,"<br>");
      box.style.display = "";
    }else{
      box.style.display = "none";
    }
  });
}

window.addEventListener("load",()=>{
  setTimeout(updateWeeklyNoteV8,500);
});
