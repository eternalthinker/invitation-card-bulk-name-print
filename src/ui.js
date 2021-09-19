import { loadImage } from './utils';
import { addNamesToCard, downloadZip } from './add_names_to_card';

let _config = undefined;
let previewText = undefined;
let previewTag = undefined;
let uploadCsvButton = undefined;
let processButton = undefined;
let downloadButton = undefined;
let scalingFactor = 1;

export function initUi(config) {
  _config = config;

  // Preview area
  previewTag = document.querySelector('.cardPreview');
  const sizer = function() {
    const previewWidth = Math.min(window.innerWidth * 0.7, 900);
    previewTag.style.width = `${previewWidth}px`
    _config.previewWidth = previewWidth;
    // const dpi = window.devicePixelRatio; // In case of errors in retina
    if (_config.cardImg) {
      const cardImg = _config.cardImg;
      scalingFactor = previewWidth / cardImg.width;
      previewTag.style.height = `${scalingFactor * cardImg.height}px`;
      updatePreviewText();
    }
  };
  sizer();
  window.addEventListener('resize', function() {
    sizer();
  });

  const imageUploadInput = document.querySelector('#imageUploadInput');
  imageUploadInput.addEventListener('change', processImageFile);

  previewText = document.querySelector('.previewText');
  initTextDrag();

  const uploadCsvInput = document.querySelector('#csvUploadInput');
  uploadCsvInput.addEventListener('change', processCsvFile);

  _config.resultContainerEl = document.querySelector('.resultSection');
  _config.progressTextEl = document.querySelector('.progressText');

  uploadCsvButton = document.querySelector('.csvUploadButton');
  processButton = document.querySelector('.processButton');
  downloadButton = document.querySelector('.downloadButton');

  
  downloadButton.addEventListener('click', () => downloadZip(config.resultCards));
  const postProcessCallback = () => {
    downloadButton.classList.remove('disabled');
  };
  processButton.addEventListener('click', () => addNamesToCard(_config, postProcessCallback));
}

function initTextDrag() {
  let isTextDragged = false;
  let offsetY = 0;
  let limitTop = 0;
  let limitBottom = 0;

  previewText.addEventListener('mousedown', function(e) {
    e.preventDefault();
    offsetY = previewText.offsetTop - e.clientY;
    limitBottom = previewText.offsetParent.offsetHeight;
    isTextDragged = true;
  });

  document.addEventListener('mouseup', function() {
    isTextDragged = false;
  });

  document.addEventListener('mousemove', function(e) {
    e.preventDefault();
    if (isTextDragged) {
      const prevTop = previewText.style.top;
      previewText.style.top = e.clientY + offsetY + 'px';
      if (previewText.offsetTop < limitTop
          || previewText.offsetTop + previewText.offsetHeight > limitBottom  
      ) {
        previewText.style.top = prevTop;
        isTextDragged = false;
      }
      _config.guest.position.y = previewText.offsetTop / scalingFactor;
    }
  })
}

function processCsvFile(e) {
  const file = e.currentTarget.files[0];
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = async function() {
    const csvFile = reader.result;
    const guestList = csvFile.split(/\r\n|\n/);
    _config.guestList = guestList;
    processButton.classList.remove('disabled');
  };
  reader.readAsText(file);
}

function processImageFile(e) {
  const file = e.currentTarget.files[0];
  if (!file) {
    return;
  }
  addImagePreview(file);
}

function addImagePreview(file) {
  const reader = new FileReader();
  reader.onload = async function() {
    const cardImg = await loadImage(reader.result);
    _config.cardImgBase64 = reader.result;
    _config.cardImg = cardImg;
    previewTag.style.height = `${previewTag.clientWidth * cardImg.height / cardImg.width}px`;
    previewTag.style.backgroundImage = `url(${reader.result})`;
    scalingFactor = _config.previewWidth / _config.cardImg.width;
    showTextControls();
    uploadCsvButton.classList.remove('disabled');
  };
  reader.readAsDataURL(file);
}

function showTextControls() {
  updatePreviewText();
  previewText.style.visibility = 'visible';
}

function updatePreviewText() {
  previewText.style.fontFamily = _config.guest.font.family;
  previewText.style.fontSize = `${_config.guest.font.size * scalingFactor}px`;
  previewText.style.fontWeight = _config.guest.font.weight;
  previewText.style.color = _config.guest.color;
  const textWidth = previewText.offsetWidth;
  const previewWidth = _config.previewWidth;
  previewText.style.left = `${(previewWidth - textWidth) / 2}px`;
  previewText.style.top = `${_config.guest.position.y * scalingFactor}px`;
}
