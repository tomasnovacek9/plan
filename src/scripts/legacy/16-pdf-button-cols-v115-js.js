/* =====================================================
   PDF náhled = čistý dokument otevřený v prohlížeči
   ===================================================== */

function pdfDateLabelV319(date){
  if(!date) return "";
  return `${date.getDate()}. ${date.getMonth()+1}. ${date.getFullYear()}`;
}

function pdfWeekRangeLabelV319(){
  const from = parseDate(document.getElementById("weekFrom")?.value || "");
  const to = parseDate(document.getElementById("weekTo")?.value || "");
  if(!from && !to) return "";
  if(from && !to) return pdfDateLabelV319(from);
  if(!from && to) return pdfDateLabelV319(to);
  const sameYear = from.getFullYear() === to.getFullYear();
  const sameMonth = sameYear && from.getMonth() === to.getMonth();
  if(sameMonth) return `${from.getDate()}.–${to.getDate()}. ${to.getMonth()+1}. ${to.getFullYear()}`;
  if(sameYear) return `${from.getDate()}. ${from.getMonth()+1}.–${to.getDate()}. ${to.getMonth()+1}. ${to.getFullYear()}`;
  return `${pdfDateLabelV319(from)} – ${pdfDateLabelV319(to)}`;
}

function pdfDocumentTitleV319(){
  const range = pdfWeekRangeLabelV319();
  return range ? `Týdenní plán – ${range}` : "Týdenní plán";
}

function pdfFilenameV319(title){
  return `${String(title || "Týdenní plán").replace(/[\\/:*?"<>|]+/g,"-")}.pdf`;
}

function cleanPdfCloneV319(){
  const source = document.getElementById("pdfArea") || document.getElementById("preview");
  if(!source) return null;
  const title = pdfDocumentTitleV319();
  const clone = source.cloneNode(true);
  clone.querySelectorAll("button,.planRowDeleteV302,.planRowChangeToolsV304,.planFieldResetV304,.manualRowControlsV316,.signatureChangeToolsV310,.noteResetV310,.planStylePopoverV307,.timeChoicePopoverV307,.dayAddRowV308").forEach(el=>el.remove());
  clone.querySelectorAll(".planNoteSlotV318").forEach(slot=>{
    if(!slot.querySelector(".planNoteWrapV310")) slot.remove();
    else slot.classList.remove("planNoteSlotEmptyV318","noteHoverZoneV320");
  });
  if(!clone.querySelector(".docTitle")){
    const heading = document.createElement("h1");
    heading.className = "docTitle";
    heading.textContent = title;
    clone.prepend(heading);
  }
  clone.querySelectorAll("[contenteditable]").forEach(el=>el.removeAttribute("contenteditable"));
  const wrapper = document.createElement("div");
  wrapper.className = "pdfExportV319";
  wrapper.dataset.pdfTitleV319 = title;
  wrapper.appendChild(clone);
  return wrapper;
}

function openPdfPreviewFallbackV319(node, existingWin){
  const win = existingWin || window.open("", "_blank");
  if(!win) return;
  const title = node?.dataset?.pdfTitleV319 || pdfDocumentTitleV319();
  win.document.write(`<!doctype html><html><head><title>${escapeHtml(title)}</title><base href="${location.href}"><link rel="stylesheet" href="src/styles/legacy/bundle.css"><link rel="stylesheet" href="src/styles/pro-redesign.css"></head><body class="pdfPreviewBodyV319"></body></html>`);
  win.document.body.appendChild(node);
  win.document.close();
}

function generatePdf(){
  const node = cleanPdfCloneV319();
  if(!node) return;
  const title = node.dataset.pdfTitleV319 || pdfDocumentTitleV319();
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
    margin: [0, 0, 0, 0],
    filename: pdfFilenameV319(title),
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, backgroundColor: "#ffffff", useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["css", "legacy"], avoid: ["tr", ".dayBreak", ".planNoteWrapV310"] }
  };
  html2pdf().set(opt).from(node).toPdf().get("pdf").then(pdf=>{
    if(pdf?.setProperties) pdf.setProperties({ title, subject: "Týdenní plán", creator: "Generátor plánu" });
  }).outputPdf("blob").then(blob=>{
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

        generatePdf();
      };
    }
  });
}

hookPrintPdfButtonV115();
