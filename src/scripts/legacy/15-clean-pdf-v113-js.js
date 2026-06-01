/* =====================================================
   PDF = přímo systémový tisk prohlížeče
   => stejné jako tisk
   => žádná prázdná stránka
   => žádné deformované logo
   ===================================================== */



window.addEventListener("beforeprint", ()=>{
  document.body.classList.add("printingV113");
});

window.addEventListener("afterprint", ()=>{
  document.body.classList.remove("printingV113");
});
