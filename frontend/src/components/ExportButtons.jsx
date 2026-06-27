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

const waitForFonts = async () => {
  if (!document.fonts?.ready) return;

  await document.fonts.ready;
};

const waitForPaint = () => {
  return new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
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

      if (img.decode) {
        await img.decode().catch(() => {});
      }
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

const createCaptureHost = element => {
  const rect = element.getBoundingClientRect();
  const width = Math.ceil(rect.width || element.scrollWidth);
  const height = Math.ceil(rect.height || element.scrollHeight);
  const host = document.createElement("div");
  const clone = element.cloneNode(true);

  host.style.position = "fixed";
  host.style.left = "0";
  host.style.top = "0";
  host.style.width = `${width}px`;
  host.style.height = `${height}px`;
  host.style.margin = "0";
  host.style.padding = "0";
  host.style.pointerEvents = "none";
  host.style.zIndex = "-1";
  host.style.background = "transparent";
  host.style.overflow = "visible";

  clone.removeAttribute("id");
  clone.style.position = "relative";
  clone.style.left = "0";
  clone.style.top = "0";
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.margin = "0";
  clone.style.transform = "none";
  clone.style.pointerEvents = "none";

  host.appendChild(clone);
  document.body.appendChild(host);

  return { host, clone, width, height };
};

const renderElementToCanvas = async id => {
  const exportElement = document.getElementById(id);
  if (!exportElement) return null;

  const cardElement =
    exportElement.querySelector(".id-card-preview") || exportElement;
  const { host, clone, width, height } = createCaptureHost(cardElement);
  copyCanvasPixels(cardElement, clone);

  try {
    await waitForFonts();
    await inlineImages(clone);
    await waitForPaint();

    return await html2canvas(host, {
      scale: 3,
      width,
      height,
      backgroundColor: null,
      useCORS: true,
      allowTaint: false,
      imageTimeout: 15000,
      scrollX: 0,
      scrollY: 0
    });
  } finally {
    host.remove();
  }
};

const triggerDownload = (href, fileName) => {
  const link = document.createElement("a");
  link.download = fileName;
  link.href = href;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  link.remove();
};

const addCanvasToPdf = (pdf, canvas, label, x, y, maxWidth, maxHeight) => {
  const aspectRatio = canvas.height / canvas.width;
  let width = maxWidth;
  let height = width * aspectRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height / aspectRatio;
  }

  pdf.text(label, x, y);
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", x, y + 7, width, height);
};

function ExportButtons() {
  const [isExporting, setIsExporting] = useState(false);

  const downloadPNG = async id => {
    setIsExporting(true);

    try {
      const canvas = await renderElementToCanvas(id);
      if (!canvas) return;

      triggerDownload(canvas.toDataURL("image/png"), `${id}.png`);
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

      addCanvasToPdf(pdf, frontCanvas, "Front Side", 15, 15, 75, 170);
      addCanvasToPdf(pdf, backCanvas, "Back Side", 110, 15, 75, 170);

      pdf.save("id-card.pdf");
    } catch (error) {
      alert(error.message || "Failed to create downloadable PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="button-row">
      <button
        className="btn secondary"
        onClick={() => downloadPNG("front-card-export")}
        disabled={isExporting}
      >
        Download Front PNG
      </button>
      <button
        className="btn secondary"
        onClick={() => downloadPNG("back-card-export")}
        disabled={isExporting}
      >
        Download Back PNG
      </button>
      <button
        className="btn primary"
        onClick={downloadPDF}
        disabled={isExporting}
      >
        Download PDF
      </button>
      <button
        className="btn dark"
        onClick={() => window.print()}
        disabled={isExporting}
      >
        Print
      </button>
    </div>
  );
}

export default ExportButtons;
