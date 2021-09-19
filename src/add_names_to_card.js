import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/webpack';
import * as JSZip from 'jszip';
import { saveAs } from 'file-saver';

export async function addNamesToCard(config, onFinish) {
  try {
    const cardImg = await createImageBitmap(config.cardImg);
    const offscreenCanvas = new OffscreenCanvas(cardImg.width, cardImg.height);
    const guestList = config.guestList;
    
    const pdfBase64List = [];
    config.resultContainerEl.innerHTML = '';

    const worker = new Worker(
      new URL('./generate_cards_worker.js', import.meta.url),
    );
    worker.postMessage({
      canvas: offscreenCanvas,
      cardImg,
      guestList,
      guestConfig: config.guest,
    }, [offscreenCanvas]);
    console.log('M: posted message')

    worker.onmessage = (e) => {
      switch (e.data.type) {
        case 'progress':
        {
          pdfBase64List.push({
            filename: e.data.filename,
            pdfBase64: e.data.pdfBase64,
          });

          const progressText = `Processed ${e.data.current}/${e.data.total} files. Last processed: ${e.data.guest}`;
          config.progressTextEl.innerHTML = progressText;

          const resultCanvas = document.createElement('canvas');
          const w = 400;
          const h = w * cardImg.height / cardImg.width;
          resultCanvas.width = w;
          resultCanvas.height = h;
          resultCanvas.style.margin = '5px';
          const ctx = resultCanvas.getContext('2d');
          ctx.drawImage(e.data.finalImg, 0, 0, w, h);
          config.resultContainerEl.appendChild(resultCanvas);
          break;
        }
        case 'end':
        {
          config.resultCards = pdfBase64List;
          onFinish();
          break;
        }
        default:
          throw ({ error: 'Unknown message from worker', message: e.data});
      }
    };
  }
  catch (err) {
    console.log(err);
  }
}

export async function downloadZip(pdfBase64List) {
  const zip = new JSZip();
  for (const pdfInfo of pdfBase64List) {
    const { filename, pdfBase64 } = pdfInfo;
    zip.file(`${filename}.pdf`, pdfBase64, { base64: true });
  };
  zip.generateAsync({ type: 'blob'})
    .then(content => {
      saveAs(content, "results.zip");
    });
}

export function addNameToCard(canvas, cardImg, nameStr, guestConfig) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(cardImg, 0, 0);
  const font = guestConfig.font;
  const fontStr = `${font.weight} ${font.size}px ${font.family}`;
  ctx.font = fontStr;
  ctx.fillStyle = guestConfig.color;
  ctx.textBaseline = 'top';
  const textWidth = ctx.measureText(nameStr).width;
  ctx.fillText(nameStr, (canvas.width - textWidth) / 2, guestConfig.position.y);
}

async function showIframe(pdfBase64) {
  const iframe = document.createElement('iframe');
  iframe.src = `data:application/pdf;base64,${pdfBase64}`;
  document.body.appendChild(iframe);
}

export async function showPdf(pdfBase64, showEl) {
  return new Promise(async (res, rej) => {
    try {
      const pdfBinary = atob(pdfBase64);
      const loadingTask = pdfjsLib.getDocument({ data: pdfBinary });
      const pdf = await loadingTask.promise;
      const pageNumber = 1;
      const page = await pdf.getPage(pageNumber);

      const viewport = page.getViewport({ scale: 0.3 });
      const pdfCanvas = document.createElement('canvas');
      showEl.appendChild(pdfCanvas);
      const pdfCtx = pdfCanvas.getContext('2d');
      pdfCanvas.width = viewport.width;
      pdfCanvas.height = viewport.height;
      const renderCtx = {
        canvasContext: pdfCtx,
        viewport,
      };

      const renderTask = page.render(renderCtx);
      await renderTask.promise;
      return res(true);
    }
    catch(err) {
      rej(err);
    }
  });
}

export async function imgToPdf(canvas) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([canvas.width, canvas.height]);
  const blob = await canvas.convertToBlob({
    type: "image/png",
  });
  const imgBuffer = await blob.arrayBuffer();
  const cardImg = await pdfDoc.embedPng(imgBuffer);
  page.drawImage(cardImg, {
    x: 0,
    y: 0,
    width: cardImg.width,
    height: cardImg.height,
  });
  const pdfBase64 = await pdfDoc.saveAsBase64();
  return pdfBase64;
}




