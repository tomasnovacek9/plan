/* =====================================================
   ULOŽIT PDF = otevře systémové PDF uložení
   (stejné jako tisk, ale přímo zaměřené na PDF workflow)
   ===================================================== */

function cleanPdfCloneV319(){
  const source = document.getElementById("preview");
  if(!source) return null;
  const clone = source.cloneNode(true);
  clone.querySelectorAll("button,.planRowDeleteV302,.planRowChangeToolsV304,.planFieldResetV304,.manualRowControlsV316,.signatureChangeToolsV310,.noteResetV310,.planNoteSlotV318,.planStylePopoverV307,.timeChoicePopoverV307").forEach(el=>el.remove());
  clone.querySelectorAll("[contenteditable]").forEach(el=>el.removeAttribute("contenteditable"));
  const wrapper = document.createElement("div");
  wrapper.className = "pdfExportV319";
  wrapper.appendChild(clone);
  return wrapper;
}

function openPdfPreviewFallbackV319(node, existingWin){
  const win = existingWin || window.open("", "_blank");
  if(!win) return;
  win.document.write(`<!doctype html><html><head><title>Týdenní plán</title><base href="${location.href}"><link rel="stylesheet" href="src/styles/legacy/bundle.css"><link rel="stylesheet" href="src/styles/pro-redesign.css"></head><body class="pdfPreviewBodyV319"></body></html>`);
  win.document.body.appendChild(node);
  win.document.close();
}

function generatePdf(){
  const node = cleanPdfCloneV319();
  if(!node) return;
  const previewWin = window.open("", "_blank");
  if(typeof html2pdf !== "function"){
    openPdfPreviewFallbackV319(node, previewWin);
    return;
  }
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "0";
  host.style.background = "#fff";
  host.appendChild(node);
  document.body.appendChild(host);
  const opt = {
    margin: [8, 8, 10, 8],
    filename: "tydenni-plan.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, backgroundColor: "#ffffff", useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["css", "legacy"], avoid: ["tr", ".dayBreak", ".podpisFinal41"] }
  };
  html2pdf().set(opt).from(node).outputPdf("blob").then(blob=>{
    const url = URL.createObjectURL(blob);
    if(previewWin) previewWin.location.href = url;
    else window.open(url, "_blank");
    setTimeout(()=>URL.revokeObjectURL(url), 60000);
  }).catch(()=>{
    if(previewWin) previewWin.close();
    openPdfPreviewFallbackV319(node);
  }).finally(()=>{
    host.remove();
  });
}

/* přepsat PDF tlačítko */
function hookPrintPdfButtonV115(){
  document.querySelectorAll("button").forEach(btn=>{
    const t = (btn.textContent || "").trim().toLowerCase();

    if(
      btn.classList.contains("outputPrintPdfV313") ||
      t.includes("uložit do pdf") ||
      t.includes("ulozit do pdf") ||
      t.includes("pdf") ||
      t.includes("export")
    ){
      btn.onclick = function(e){
        if(e) e.preventDefault();

        // otevře systémový dialog => Uložit jako PDF
        generatePdf();
      };
    }
  });
}

hookPrintPdfButtonV115();
