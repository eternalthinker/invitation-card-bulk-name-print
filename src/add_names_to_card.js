import cardImgPath from "./local-only/invitation.png";
import guestListCsvPath from "./local-only/guestlist.csv";

export async function addNamesToCard() {
  try {
    const canvas = document.createElement('canvas');
    const cardImg = await loadImage(cardImgPath);
    canvas.width = cardImg.width;
    canvas.height = cardImg.height;

    const guestList = await loadGuestsCsv(guestListCsvPath);
    guestList.forEach(guest => {
      if (guest.length === 0) {
        return;
      }
      const nameStr = `Dear ${guest}`.toUpperCase();
      addNameToCard(canvas, cardImg, nameStr)
    });
  }
  catch (err) {
    console.log(err);
  }
}

async function addNameToCard(canvas, cardImg, nameStr) {
  const ctx = canvas.getContext('2d');
  ctx.drawImage(cardImg, 0, 0);
  ctx.font = 'bold 32px Now';
  ctx.fillStyle = '#52644e';
  const textWidth = ctx.measureText(nameStr).width;
  ctx.fillText(nameStr, (canvas.width - textWidth) / 2, 530);

  const resultImg = new Image();
  resultImg.src = canvas.toDataURL();
  document.body.appendChild(resultImg);
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
