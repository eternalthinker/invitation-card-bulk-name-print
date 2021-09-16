import cardImgPath from "./local-only/invitation.png";
import guestListCsvPath from "./local-only/guestlist.csv";
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/webpack';
import * as JSZip from 'jszip';
import { saveAs } from 'file-saver';

export async function addNamesToCard() {
  try {
    const canvas = document.createElement('canvas');
    const cardImg = await loadImage(cardImgPath);
    canvas.width = cardImg.width;
    canvas.height = cardImg.height;

    const guestList = await loadGuestsCsv(guestListCsvPath);
    const pdfBase64List = [];
    for(const guest of guestList) {
      if (guest.length === 0) {
        return;
      }
      const nameStr = `Dear ${guest}`.toUpperCase();
      addNameToCard(canvas, cardImg, nameStr);
      const pdfBase64 = await imgToPdf(canvas);
      console.log(guest);
      pdfBase64List.push([guest.replace('&', '').replace(' ', '_'), pdfBase64]);
      showPdf(pdfBase64);
    };

    downloadZip(pdfBase64List);
  }
  catch (err) {
    console.log(err);
  }
}

async function downloadZip(pdfBase64List) {
  console.log(pdfBase64List);
  const zip = new JSZip();
  for (const pdfinfo of pdfBase64List) {
    const [ guest, pdfBase64 ] = pdfinfo;
    zip.file(`${guest}.pdf`, pdfBase64, { base64: true });
  };
  zip.generateAsync({ type: 'blob'})
    .then(content => {
      saveAs(content, "results.zip");
    });
}

async function addNameToCard(canvas, cardImg, nameStr) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(cardImg, 0, 0);
  ctx.font = 'bold 32px Now';
  ctx.fillStyle = '#52644e';
  const textWidth = ctx.measureText(nameStr).width;
  ctx.fillText(nameStr, (canvas.width - textWidth) / 2, 530);
  
  //const resultImg = new Image();
  //resultImg.src = canvas.toDataURL();
  //document.body.appendChild(resultImg);
}

async function showIframe(pdfBase64) {
  const iframe = document.createElement('iframe');
  iframe.src = `data:application/pdf;base64,${pdfBase64}`;
  document.body.appendChild(iframe);
}

async function showPdf(pdfBase64) {
  return new Promise((res, rej) => {
    const pdfBinary = atob(pdfBase64);
    let loadingTask = pdfjsLib.getDocument({ data: pdfBinary });
    loadingTask.promise.then(pdf => {
      console.log('pdf loaded');
      const pageNumber = 1;
      pdf.getPage(pageNumber).then(page => {
        const viewport = page.getViewport({ scale: 0.5 });
        const pdfCanvas = document.createElement('canvas');
        document.body.appendChild(pdfCanvas);
        const pdfCtx = pdfCanvas.getContext('2d');
        pdfCanvas.width = viewport.width;
        pdfCanvas.height = viewport.height;
        const renderCtx = {
          canvasContext: pdfCtx,
          viewport,
        };
        var renderTask = page.render(renderCtx);
        renderTask.promise.then(function () {
          console.log('Page rendered');
          res(true);
        });
      });
    }).catch(err => rej(err));
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

async function loadGuestsCsv(csvPath) {
  return new Promise((resolve, reject) => {
    fetch(csvPath)
      .then(res => res.text())
      .then(guestsCsv => {
        const names = guestsCsv.split(/\r\n|\n/);
        resolve(names);
      })
      .catch(err => { reject(err); });
  });
}

async function loadImage(imgPath) {  
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = function () {
      resolve(image);
    }
    image.onerror = function () {
      reject(new Error(`Image ${imgPath} cannot be loaded`));
    }
    image.src = imgPath;
  });
} 
