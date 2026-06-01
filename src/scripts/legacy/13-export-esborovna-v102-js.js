function exportEsborovnaV102(){
  alert("Export do eSborovny bude napojen později.");
}

function updateTopButtonsV102(){
  const buttons = Array.from(document.querySelectorAll("button"));

  // najdeme horní lištu podle původních tlačítek
  const topButtons = buttons.filter(btn => {
    if(btn.closest(".panel")) return false;
    const t = (btn.textContent || "").trim().toLowerCase();
    return (
      t === "uložit" ||
      t === "ulozit" ||
      t === "načíst" ||
      t === "nacist" ||
      t === "vymazat vše" ||
      t === "vymazat vse"
    );
  });

  topButtons.forEach(btn => btn.classList.add("hiddenTopButtonV102"));

  if(document.querySelector(".esborovnaTopButtonV102")) return;

  const anchor = topButtons[0] || buttons.find(btn => !btn.closest(".panel"));
  const parent = anchor ? anchor.parentElement : null;
  if(!parent) return;

  const b = document.createElement("button");
  b.type = "button";
  b.className = "esborovnaTopButtonV102";
  b.textContent = "Export do eSborovny";
  b.addEventListener("click", exportEsborovnaV102);

  parent.appendChild(b);
}

window.addEventListener("load",()=>{
  setTimeout(updateTopButtonsV102,300);
  setTimeout(updateTopButtonsV102,1200);
});

const obsV102 = new MutationObserver(()=>{
  clearTimeout(window.__v102);
  window.__v102 = setTimeout(updateTopButtonsV102,120);
});
obsV102.observe(document.body,{childList:true,subtree:true});
