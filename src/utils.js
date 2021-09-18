export async function loadImage(imgPath) {  
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
