import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function ExportButtons() {
  const downloadPNG = async id => {
    const element = document.getElementById(id);
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 3,
      backgroundColor: null,
      useCORS: true
    });

    const link = document.createElement("a");
    link.download = `${id}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const downloadPDF = async () => {
    const front = document.getElementById("front-card-export");
    const back = document.getElementById("back-card-export");
    if (!front || !back) return;

    const pdf = new jsPDF("p", "mm", "a4");
    const frontCanvas = await html2canvas(front, { scale: 3, backgroundColor: null, useCORS: true });
    const backCanvas = await html2canvas(back, { scale: 3, backgroundColor: null, useCORS: true });

    pdf.text("Front Side", 15, 15);
    pdf.addImage(frontCanvas.toDataURL("image/png"), "PNG", 15, 22, 60, 95);

    pdf.text("Back Side", 100, 15);
    pdf.addImage(backCanvas.toDataURL("image/png"), "PNG", 100, 22, 60, 95);

    pdf.save("id-card.pdf");
  };

  return (
    <div className="button-row">
      <button className="btn secondary" onClick={() => downloadPNG("front-card-export")}>Download Front PNG</button>
      <button className="btn secondary" onClick={() => downloadPNG("back-card-export")}>Download Back PNG</button>
      <button className="btn primary" onClick={downloadPDF}>Download PDF</button>
      <button className="btn dark" onClick={() => window.print()}>Print</button>
    </div>
  );
}

export default ExportButtons;
