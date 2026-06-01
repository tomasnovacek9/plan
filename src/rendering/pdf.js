export async function exportPdf(pageElement, button) {
  if (!window.html2canvas || !window.jspdf) {
    window.print();
    return;
  }

  const originalText = button.textContent;
  button.textContent = "Generuji...";
  button.disabled = true;

  try {
    const canvas = await window.html2canvas(pageElement, {
      scale: 2.5,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false
    });

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const width = 210;
    const height = 297;
    const image = canvas.toDataURL("image/jpeg", 0.98);
    pdf.addImage(image, "JPEG", 0, 0, width, height, undefined, "FAST");
    pdf.save(`tydenni-plan-${new Date().toISOString().slice(0, 10)}.pdf`);
  } finally {
    button.textContent = originalText;
    button.disabled = false;
  }
}
