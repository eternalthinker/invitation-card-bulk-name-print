import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/webpack';
import * as JSZip from 'jszip';
import { saveAs } from 'file-saver';

export async function addNamesToCard(config, onFinish) {
  try {
    const canvas = document.createElement('canvas');
    const cardImg = config.cardImg;
    canvas.width = cardImg.width;
    canvas.height = cardImg.height;

    const guestList = config.guestList;
    const pdfBase64List = [];
    config.resultContainerEl.innerHTML = '';
    for(const guest of guestList) {
      if (guest.length === 0) {
        return;
      }
      const nameStr = `${config.guest.prefix}${guest}${config.guest.suffix}`.toUpperCase();
      addNameToCard(canvas, cardImg, nameStr, config);
      const pdfBase64 = await imgToPdf(canvas);
      pdfBase64List.push({
        filename: guest.replace(/\W+/g, '_').toLowerCase(),
        pdfBase64,
      });
      showPdf(pdfBase64, config.resultContainerEl);
    };

    config.resultCards = pdfBase64List;
    onFinish();
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

async function addNameToCard(canvas, cardImg, nameStr, config) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(cardImg, 0, 0);
  const font = config.guest.font;
  const fontStr = `${font.weight} ${font.size}px ${font.family}`;
  ctx.font = fontStr;
  ctx.fillStyle = config.guest.color;
  ctx.textBaseline = 'top';
  const textWidth = ctx.measureText(nameStr).width;
  ctx.fillText(nameStr, (canvas.width - textWidth) / 2, config.guest.position.y);
  
  //const resultImg = new Image();
  //resultImg.src = canvas.toDataURL();
  //document.body.appendChild(resultImg);
}

async function showIframe(pdfBase64) {
  const iframe = document.createElement('iframe');
  iframe.src = `data:application/pdf;base64,${pdfBase64}`;
  document.body.appendChild(iframe);
}

async function showPdf(pdfBase64, showEl) {
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

async function imgToPdf(canvas) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([canvas.width, canvas.height]);
  const cardImg = await pdfDoc.embedPng(canvas.toDataURL());
  page.drawImage(cardImg, {
    x: 0,
    y: 0,
    width: cardImg.width,
    height: cardImg.height,
  });
  const pdfBase64 = await pdfDoc.saveAsBase64();
  return pdfBase64;
}




