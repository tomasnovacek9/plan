(function(){

function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }

function findExportButton(){
  const buttons=[...document.querySelectorAll("button,a")];
  return buttons.find(el=>{
    const t=(el.textContent||"").toLowerCase();
    return t.includes("pdf") || t.includes("export");
  });
}

async function exportPDF(){
  const preview=document.querySelector(".previewPage");
  if(!preview) return;

  const btn=findExportButton();
  const old=btn?btn.textContent:"";

  if(btn){
    btn.textContent="Generuji PDF…";
    btn.disabled=true;
  }

  document.body.classList.add("pdfExportingV205");

  try{
    await wait(300);

    const canvas=await html2canvas(preview,{
      scale:3,
      useCORS:true,
      backgroundColor:"#ffffff",
      logging:false,
      scrollX:0,
      scrollY:0
    });

    const { jsPDF } = window.jspdf;
    const pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});

    const pageW=210;
    const pageH=297;
    const margin=6;

    const usableW=pageW-margin*2;
    const usableH=pageH-margin*2;

    const imgW=usableW;
    const imgH=canvas.height*imgW/canvas.width;

    const imgData=canvas.toDataURL("image/jpeg",0.98);

    let remaining=imgH;
    let pos=margin;

    pdf.addImage(imgData,"JPEG",margin,pos,imgW,imgH,undefined,"FAST");
    remaining-=usableH;

    while(remaining>0){
      pdf.addPage();
      pos=margin-(imgH-remaining);

      pdf.addImage(imgData,"JPEG",margin,pos,imgW,imgH,undefined,"FAST");
      remaining-=usableH;
    }

    const d=new Date();

    pdf.save(
      "tydenni-plan-"+d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")+".pdf"
    );

  }catch(e){
    console.error(e);
    alert("PDF export se nepodařil.");
  }finally{
    document.body.classList.remove("pdfExportingV205");

    if(btn){
      btn.textContent=old||"Export";
      btn.disabled=false;
    }
  }
}

function hookButton(){
  const btn=findExportButton();
  if(!btn || btn.__pdf205) return;

  btn.__pdf205=true;

  btn.addEventListener("click",(e)=>{
    e.preventDefault();
    exportPDF();
  });
}

window.addEventListener("load",()=>{
  setTimeout(hookButton,300);
  setTimeout(hookButton,1200);
});

})();
