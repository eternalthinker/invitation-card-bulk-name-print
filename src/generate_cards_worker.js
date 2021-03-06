import { addNameToCard, imgToPdf } from './add_names_to_card';
import defaultFont from './fonts/NowAlt-Medium.otf';

onmessage = async (e) => {
  try {
    const { guestConfig } = e.data;
    const fontPath = guestConfig.font.base64 || defaultFont;
    const fontFace = new FontFace(
      guestConfig.font.family,
      `url(${fontPath})`,
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
    const nameStrs = nameStr.split(guestConfig.lineBreakCharacter);
    addNameToCard(canvas, cardImg, nameStrs, guestConfig);
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
