(function(){
  function moveFooterOutsideV164(){
    document.querySelectorAll(".previewPage").forEach(page=>{
      // odstranit staré footery uvnitř bílé stránky
      page.querySelectorAll(".schoolFooterV161,.schoolFooterV160,.schoolFooterV157,.schoolCopyrightV153,.schoolCopyrightV152").forEach(el=>el.remove());

      let footer = page.nextElementSibling;
      if(!footer || !footer.classList || !footer.classList.contains("schoolFooterOutsideV164")){
        footer = document.createElement("div");
        footer.className = "schoolFooterOutsideV164";
        footer.innerHTML = `
          <div class="schoolFooterOutsideMainV164">© 2026 Základní škola Brno, Jana Babáka 1, příspěvková organizace</div>
          <div class="schoolFooterOutsideAuthorV164">Design &amp; development: Tomáš Nováček</div>
        `;
        page.insertAdjacentElement("afterend", footer);
      }
    });
  }

  function fixEmptyDaysAgainV164(){
    document.querySelectorAll(".previewPage table tbody tr").forEach(row=>{
      const timeCell = row.querySelector(".timeCell");
      const eventCell = row.querySelector(".eventCell");
      if(!timeCell || !eventCell) return;

      if(!(eventCell.textContent || "").trim()){
        timeCell.textContent = "";
      }
    });
  }

  function runV164(){
    moveFooterOutsideV164();
    fixEmptyDaysAgainV164();
  }

  window.addEventListener("load",()=>{
    setTimeout(runV164,300);
    setTimeout(runV164,1000);
    setTimeout(runV164,2200);
  });

  const obs = new MutationObserver(()=>{
    clearTimeout(window.__v164);
    window.__v164 = setTimeout(runV164,120);
  });

  obs.observe(document.body,{childList:true,subtree:true});
})();
