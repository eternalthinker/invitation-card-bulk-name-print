import { addNameToCard, imgToPdf } from './add_names_to_card';

onmessage = async (e) => {
  console.log('W: Message from main thread:', e.data);

  await addNamesToCard(e.data);

  postMessage({
    pdfBase64: 'base64,hi-im-pdf',
  });
};

async function addNamesToCard(data) {
  const {
    canvas,
    guestList,
    cardImg,
    guestConfig,
  } = data;
  for(const guest of guestList) {
    if (guest.length === 0) {
      return;
    }
    const nameStr = `${guestConfig.prefix}${guest}${guestConfig.suffix}`.toUpperCase();
    addNameToCard(canvas, cardImg, nameStr, guestConfig);
    const pdfBase64 = await imgToPdf(canvas);
    console.log('W: finished - ', nameStr);
    // pdfBase64List.push({
    //   filename: guest.replace(/\W+/g, '_').toLowerCase(),
    //   pdfBase64,
    // });
    // showPdf(pdfBase64, config.resultContainerEl);
  };
}
