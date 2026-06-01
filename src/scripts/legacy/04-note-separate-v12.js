function separateWeeklyNoteV12(){
  const note = document.getElementById("weeklyNoteSection");
  if(!note || note.dataset.separatedV12) return;

  const panel = document.querySelector(".panel");
  if(!panel) return;

  const signatureTitle = Array.from(document.querySelectorAll(".sectionTitle"))
    .find(el => (el.textContent || "").toLowerCase().includes("podpis"));

  const signatureSection = signatureTitle ? signatureTitle.closest(".section") : null;

  if(signatureSection && signatureSection.parentNode === panel){
    panel.insertBefore(note, signatureSection);
  }else{
    const sections = panel.querySelectorAll(".section");
    if(sections.length >= 1){
      panel.insertBefore(note, sections[1] || sections[0].nextSibling);
    }
  }

  note.dataset.separatedV12 = "1";
}
window.addEventListener("load",()=>setTimeout(separateWeeklyNoteV12,300));
setTimeout(separateWeeklyNoteV12,900);
