import { loadImage } from './utils';
import { addNamesToCard, downloadZip } from './add_names_to_card';

let _config = undefined;
let previewText = undefined;
let previewTag = undefined;
let uploadCsvButton = undefined;
let processButton = undefined;
let downloadButton = undefined;
let progressText = undefined;
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

  const uploadFontInput = document.querySelector('#fontUploadInput');
  uploadFontInput.addEventListener('change', processFontFile);

  _config.resultContainerEl = document.querySelector('.resultSection');
  progressText = document.querySelector('.progressText');
  _config.progressTextEl = progressText;
  _config.actionButtons = document.querySelectorAll('.actionButton');

  uploadCsvButton = document.querySelector('.csvUploadButton');
  processButton = document.querySelector('.processButton');
  downloadButton = document.querySelector('.downloadButton');

  
  downloadButton.addEventListener('click', () => downloadZip(config.resultCards));
  const postProcessCallback = () => {
    downloadButton.classList.remove('disabled');
  };
  processButton.addEventListener('click', () => addNamesToCard(_config, postProcessCallback));

  initTextControls();
}

function initTextControls() {
  const textColorInput = document.querySelector('#textColorInput');
  const textColorPreview = document.querySelector('.textColorPreview');
  textColorInput.value = _config.guest.color;
  textColorPreview.style.backgroundColor = _config.guest.color;

  const colorRegex = /^#[A-Fa-f0-9]{6}$/;
  textColorInput.addEventListener('input', (e) => {
    const value = textColorInput.value;
    const match = value.match(colorRegex);
    if (match == null) {
      textColorInput.classList.add('error');
      return;
    }
    textColorInput.classList.remove('error');
    textColorPreview.style.backgroundColor = value;
    _config.guest.color = value;
    updatePreviewText();
  });

  const textSizeInput = document.querySelector('#textSizeInput');
  textSizeInput.value = _config.guest.font.size;
  const sizeRegex = /^[0-9]+(\.[0-9]*)?$/;
  textSizeInput.addEventListener('input', (e) => {
    const value = textSizeInput.value;
    const match = value.match(sizeRegex);
    const numValue = parseFloat(value);
    if (match == null || isNaN(numValue)) {
      textSizeInput.classList.add('error');
      return;
    }
    textSizeInput.classList.remove('error');
    _config.guest.font.size = numValue;
    updatePreviewText();
  });


  const textPrefixInput = document.querySelector('#textPrefixInput');
  const textSuffixInput = document.querySelector('#textSuffixInput');
  const textPreviewContentInput = document.querySelector('#textPreviewContentInput');
  textPrefixInput.value = _config.guest.prefix;
  textSuffixInput.value = _config.guest.suffix;
  textPreviewContentInput.value = _config.previewTextContent;

  textPrefixInput.addEventListener('input', (e) => {
    updateConfigText(textPrefixInput.value, ['guest', 'prefix']);
  });
  textSuffixInput.addEventListener('input', (e) => {
    updateConfigText(textSuffixInput.value, ['guest', 'suffix']);
  });
  textPreviewContentInput.addEventListener('input', (e) => {
    updateConfigText(textPreviewContentInput.value, ['previewTextContent']);
  });
}

function showPreviewTextHint() {
  const previewTextHint = document.querySelector('.previewTextHint');
  previewTextHint.style.top = `${previewText.offsetTop - (previewTextHint.offsetHeight/2)}px`;
  previewTextHint.style.left = `${previewText.offsetLeft + previewText.offsetWidth + 20}px`;

  const closeButton = previewTextHint.querySelector('.hintCloseButton');
  const fadeStartTimer = setTimeout(() => {
    fade(previewTextHint, 1000);
  }, 5000);
  closeButton.addEventListener('click', () => {
    clearTimeout(fadeStartTimer);
    fade(previewTextHint, 1000);
  });
  previewTextHint.style.opacity = 1;
  previewTextHint.style.visibility = 'visible';
}

function fade(el, durationMs) {
  const startTime = new Date();

  const fadeStep = () => {
    const curTime = new Date();
    const msPassed = curTime - startTime;
    if (msPassed > durationMs) {
      el.style.visibility = 'hidden';
      return;
    }
    const alpha = 1 - (msPassed / durationMs);
    el.style.opacity = alpha;

    window.requestAnimationFrame(fadeStep);
  }

  window.requestAnimationFrame(fadeStep);
}

function updateConfigText(text, configKeyArr) {
  let configObj = _config;
  for(let i = 0; i < configKeyArr.length - 1; ++i) {
    configObj = configObj[configKeyArr[i]];
  }
  configObj[configKeyArr[configKeyArr.length - 1]] = text;
  updatePreviewText();
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
      downloadButton.classList.add('disabled');
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
    progressText.innerHTML = `CSV file loaded. ${guestList.length} lines found (may include empty lines)`;
  };
  reader.readAsText(file);
}

function processFontFile(e) {
  const file = e.currentTarget.files[0];
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = async function() {
    _config.fontBase64 = reader.result;
    _config.fontName = `Custom-${Math.floor(Math.random() * 100000)}`;
    const fontFace = new FontFace(_config.fontName, `url(${_config.fontBase64})`);
    fontFace.load()
      .then(loadedFont => {
        document.fonts.add(loadedFont);
        updatePreviewText();
      })
      .catch(err => console.error('Font load error:', err));
  };
  reader.readAsDataURL(file);
}

function processImageFile(e) {
  const file = e.currentTarget.files[0];
  if (!file) {
    return;
  }
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
  document.querySelector('.textControls').style.visibility = 'visible';
  previewText.style.visibility = 'visible';
  showPreviewTextHint();
}

function updatePreviewText() {
  previewText.innerHTML = `${_config.guest.prefix}${_config.previewTextContent}${_config.guest.suffix}`;
  previewText.style.fontFamily = _config.fontName || _config.guest.font.family;
  previewText.style.fontSize = `${_config.guest.font.size * scalingFactor}px`;
  previewText.style.fontWeight = _config.guest.font.weight;
  previewText.style.color = _config.guest.color;
  const textWidth = previewText.offsetWidth;
  const previewWidth = _config.previewWidth;
  previewText.style.left = `${(previewWidth - textWidth) / 2}px`;
  previewText.style.top = `${_config.guest.position.y * scalingFactor}px`;

  downloadButton.classList.add('disabled');
}
