/* =====================================================
   ULOŽIT PDF = otevře systémové PDF uložení
   (stejné jako tisk, ale přímo zaměřené na PDF workflow)
   ===================================================== */

function generatePdf(){
  // stejný profi layout jako tisk
  window.print();
}

/* přepsat PDF tlačítko */
window.addEventListener("load", ()=>{
  document.querySelectorAll("button").forEach(btn=>{
    const t = (btn.textContent || "").trim().toLowerCase();

    if(
      t.includes("uložit do pdf") ||
      t.includes("ulozit do pdf") ||
      t.includes("pdf")
    ){
      btn.onclick = function(e){
        if(e) e.preventDefault();

        // otevře systémový dialog => Uložit jako PDF
        generatePdf();
      };
    }
  });
});
