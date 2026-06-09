import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useState } from "react";

const readBlobAsDataUrl = blob => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const imageToDataUrl = async src => {
  if (!src || src.startsWith("data:")) return src;

  const response = await fetch(src, {
    mode: "cors",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Unable to load export image: ${response.status}`);
  }

  return readBlobAsDataUrl(await response.blob());
};

const waitForImage = img => {
  if (img.complete && img.naturalWidth > 0) return Promise.resolve();

  return new Promise((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Image failed to load for export"));
  });
};

const inlineImages = async clone => {
  const images = Array.from(clone.querySelectorAll("img"));

  await Promise.all(
    images.map(async img => {
      const src = img.currentSrc || img.src || img.getAttribute("src");
      if (!src) return;

      img.removeAttribute("crossorigin");
      img.src = await imageToDataUrl(src);
      await waitForImage(img);
    })
  );
};

const copyCanvasPixels = (source, clone) => {
  const sourceCanvases = Array.from(source.querySelectorAll("canvas"));
  const cloneCanvases = Array.from(clone.querySelectorAll("canvas"));

  sourceCanvases.forEach((sourceCanvas, index) => {
    const cloneCanvas = cloneCanvases[index];
    if (!cloneCanvas) return;

    cloneCanvas.width = sourceCanvas.width;
    cloneCanvas.height = sourceCanvas.height;
    cloneCanvas
      .getContext("2d")
      .drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height);
  });
};

const renderElementToCanvas = async id => {
  const element = document.getElementById(id);
  if (!element) return null;

  const clone = element.cloneNode(true);
  copyCanvasPixels(element, clone);

  clone.style.position = "absolute";
  clone.style.left = "-10000px";
  clone.style.top = "0";
  clone.style.transform = "none";
  clone.style.pointerEvents = "none";
  clone.style.zIndex = "-1";

  document.body.appendChild(clone);

  try {
    await inlineImages(clone);

    return await html2canvas(clone, {
      scale: 3,
      backgroundColor: null,
      useCORS: true,
      allowTaint: false,
      imageTimeout: 15000
    });
  } finally {
    clone.remove();
  }
};

function ExportButtons() {
  const [isExporting, setIsExporting] = useState(false);

  const downloadPNG = async id => {
    setIsExporting(true);

    try {
      const canvas = await renderElementToCanvas(id);
      if (!canvas) return;

      const link = document.createElement("a");
      link.download = `${id}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      alert(error.message || "Failed to create downloadable image");
    } finally {
      setIsExporting(false);
    }
  };

  const downloadPDF = async () => {
    setIsExporting(true);

    try {
      const frontCanvas = await renderElementToCanvas("front-card-export");
      const backCanvas = await renderElementToCanvas("back-card-export");
      if (!frontCanvas || !backCanvas) return;

      const pdf = new jsPDF("p", "mm", "a4");

      pdf.text("Front Side", 15, 15);
      pdf.addImage(frontCanvas.toDataURL("image/png"), "PNG", 15, 22, 60, 95);

      pdf.text("Back Side", 100, 15);
      pdf.addImage(backCanvas.toDataURL("image/png"), "PNG", 100, 22, 60, 95);

      pdf.save("id-card.pdf");
    } catch (error) {
      alert(error.message || "Failed to create downloadable PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="button-row">
      <button className="btn secondary" onClick={() => downloadPNG("front-card-export")} disabled={isExporting}>Download Front PNG</button>
      <button className="btn secondary" onClick={() => downloadPNG("back-card-export")} disabled={isExporting}>Download Back PNG</button>
      <button className="btn primary" onClick={downloadPDF} disabled={isExporting}>Download PDF</button>
      <button className="btn dark" onClick={() => window.print()} disabled={isExporting}>Print</button>
    </div>
  );
}

export default ExportButtons;
