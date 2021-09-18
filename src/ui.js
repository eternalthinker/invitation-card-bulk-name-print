import { loadImage } from './utils';

let _config = undefined;
let previewText = undefined;
let previewTag = undefined;
let scalingFactor = 1;

export function initUi(config) {
  _config = config;

  previewTag = document.querySelector('.cardPreview');
  const sizer = function() {
    _config.previewWidth = previewTag.clientWidth;
    // const dpi = window.devicePixelRatio; // In case of errors in retina
  };
  sizer();
  window.addEventListener('resize', function() {
    sizer();
  });

  const imageUploadButton = document.querySelector('#imageUploadInput');
  imageUploadButton.addEventListener('change', processImageFile);

  previewText = document.querySelector('.previewText');
  initTextDrag();
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
      _config.guest.position.y = previewText.style.top / scalingFactor;
    }
  })
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
    previewTag.style.backgroundImage = `url(${reader.result})`;
    _config.cardImg = await loadImage(reader.result);
    scalingFactor = _config.previewWidth / _config.cardImg.width;
    showTextControls();
  };
  reader.readAsDataURL(file);
}

function showTextControls() {
  updatePreviewText();
  previewText.style.opacity = 1;
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
