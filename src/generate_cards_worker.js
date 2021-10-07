import { addNameToCard, imgToPdf } from './add_names_to_card';

onmessage = async (e) => {
  try {
    const fontFace = new FontFace(
      guestConfig.font.family,
      `url(${guestConfig.font.base64})`,
    );
    // add it to the list of fonts our worker supports
    self.fonts.add(fontFace);
    // load the font
    await fontFace.load()

    await addNamesToCard(e.data);

    postMessage({
      type: 'end',
    });
  }
  catch (err) {
    postMessage({
      type: 'error',
      error: err,
    });
  }
};

async function addNamesToCard(data) {
  const {
    canvas,
    guestList,
    cardImg,
    guestConfig,
  } = data;
  for(let i = 0; i < guestList.length; ++i) {
    const guest = guestList[i];
    if (guest.length === 0) {
      return;
    }
    const nameStr = `${guestConfig.prefix}${guest}${guestConfig.suffix}`.toUpperCase();
    addNameToCard(canvas, cardImg, nameStr, guestConfig);
    const pdfBase64 = await imgToPdf(canvas);
    postMessage({
      type: 'progress',
      current: i+1,
      guest,
      finalImg: canvas.transferToImageBitmap(),
      pdfBase64,
      filename: guest.replace(/\W+/g, '_').toLowerCase(),
    })
    
  };
}
