/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/fonts/now.bold.otf":
/*!********************************!*\
  !*** ./src/fonts/now.bold.otf ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (__webpack_require__.p + "fonts/2c606dec87dd9c7fcf5b75f53d46ad83.otf");

/***/ }),

/***/ "./src/add_names_to_card.js":
/*!**********************************!*\
  !*** ./src/add_names_to_card.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "addNamesToCard": () => (/* binding */ addNamesToCard),
/* harmony export */   "downloadZip": () => (/* binding */ downloadZip),
/* harmony export */   "addNameToCard": () => (/* binding */ addNameToCard),
/* harmony export */   "showPdf": () => (/* binding */ showPdf),
/* harmony export */   "imgToPdf": () => (/* binding */ imgToPdf)
/* harmony export */ });
/* harmony import */ var pdf_lib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! pdf-lib */ "./node_modules/pdf-lib/es/index.js");
/* harmony import */ var pdfjs_dist_webpack__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! pdfjs-dist/webpack */ "./node_modules/pdfjs-dist/webpack.js");
/* harmony import */ var pdfjs_dist_webpack__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(pdfjs_dist_webpack__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var jszip__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! jszip */ "./node_modules/jszip/dist/jszip.min.js");
/* harmony import */ var jszip__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(jszip__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var file_saver__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! file-saver */ "./node_modules/file-saver/dist/FileSaver.min.js");
/* harmony import */ var file_saver__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(file_saver__WEBPACK_IMPORTED_MODULE_3__);





async function addNamesToCard(config, onFinish) {
  try {
    const cardImg = await createImageBitmap(config.cardImg);
    const offscreenCanvas = new OffscreenCanvas(cardImg.width, cardImg.height);
    const guestList = config.guestList;
    
    const pdfBase64List = [];
    config.resultContainerEl.innerHTML = '';
    config.actionButtons.forEach((button) => {
      button.classList.add('disabled');
    });

    const worker = new Worker(
      new URL(/* worker import */ __webpack_require__.p + __webpack_require__.u("src_add_names_to_card_js-src_generate_cards_worker_js"), __webpack_require__.b),
    );
    worker.postMessage({
      canvas: offscreenCanvas,
      cardImg,
      guestList,
      guestConfig: config.guest,
    }, [offscreenCanvas]);

    worker.onmessage = (e) => {
      switch (e.data.type) {
        case 'progress':
        {
          pdfBase64List.push({
            filename: e.data.filename,
            pdfBase64: e.data.pdfBase64,
          });

          const progressText = `Processed ${e.data.current} cards. Last processed: ${e.data.guest}`;
          config.progressTextEl.innerHTML = progressText;

          const resultCanvas = document.createElement('canvas');
          const w = 400;
          const h = w * cardImg.height / cardImg.width;
          resultCanvas.width = w;
          resultCanvas.height = h;
          resultCanvas.style.margin = '5px';
          const ctx = resultCanvas.getContext('2d');
          ctx.drawImage(e.data.finalImg, 0, 0, w, h);
          config.resultContainerEl.appendChild(resultCanvas);
          break;
        }
        case 'end':
        {
          config.resultCards = pdfBase64List;
          onFinish();
          config.actionButtons.forEach((button) => {
            button.classList.remove('disabled');
          });
          break;
        }
        default:
          throw ({ error: 'Unknown message from worker', message: e.data});
      }
    };
  }
  catch (err) {
    console.log(err);
  }
}

async function downloadZip(pdfBase64List) {
  const zip = new jszip__WEBPACK_IMPORTED_MODULE_2__();
  for (const pdfInfo of pdfBase64List) {
    const { filename, pdfBase64 } = pdfInfo;
    zip.file(`${filename}.pdf`, pdfBase64, { base64: true });
  };
  zip.generateAsync({ type: 'blob'})
    .then(content => {
      (0,file_saver__WEBPACK_IMPORTED_MODULE_3__.saveAs)(content, "results.zip");
    });
}

function addNameToCard(canvas, cardImg, nameStr, guestConfig) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(cardImg, 0, 0);
  const font = guestConfig.font;
  const fontStr = `${font.weight} ${font.size}px ${font.family}`;
  ctx.font = fontStr;
  ctx.fillStyle = guestConfig.color;
  ctx.textBaseline = 'top';
  const textWidth = ctx.measureText(nameStr).width;
  ctx.fillText(nameStr, (canvas.width - textWidth) / 2, guestConfig.position.y);
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
      const loadingTask = pdfjs_dist_webpack__WEBPACK_IMPORTED_MODULE_1__.getDocument({ data: pdfBinary });
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
  const pdfDoc = await pdf_lib__WEBPACK_IMPORTED_MODULE_0__.PDFDocument.create();
  const page = pdfDoc.addPage([canvas.width, canvas.height]);
  const blob = await canvas.convertToBlob({
    type: "image/png",
  });
  const imgBuffer = await blob.arrayBuffer();
  const cardImg = await pdfDoc.embedPng(imgBuffer);
  page.drawImage(cardImg, {
    x: 0,
    y: 0,
    width: cardImg.width,
    height: cardImg.height,
  });
  const pdfBase64 = await pdfDoc.saveAsBase64();
  return pdfBase64;
}






/***/ }),

/***/ "./src/generate_cards_worker.js":
/*!**************************************!*\
  !*** ./src/generate_cards_worker.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _add_names_to_card__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./add_names_to_card */ "./src/add_names_to_card.js");
/* harmony import */ var _fonts_now_bold_otf__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./fonts/now.bold.otf */ "./src/fonts/now.bold.otf");



onmessage = async (e) => {
  try {
    const fontFace = new FontFace(
      'Now',
      `url(${_fonts_now_bold_otf__WEBPACK_IMPORTED_MODULE_1__["default"]})`,
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
    (0,_add_names_to_card__WEBPACK_IMPORTED_MODULE_0__.addNameToCard)(canvas, cardImg, nameStr, guestConfig);
    const pdfBase64 = await (0,_add_names_to_card__WEBPACK_IMPORTED_MODULE_0__.imgToPdf)(canvas);
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


/***/ }),

/***/ "?4a14":
/*!************************!*\
  !*** canvas (ignored) ***!
  \************************/
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ "?fe90":
/*!********************!*\
  !*** fs (ignored) ***!
  \********************/
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ "?d446":
/*!**********************!*\
  !*** http (ignored) ***!
  \**********************/
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ "?4c38":
/*!***********************!*\
  !*** https (ignored) ***!
  \***********************/
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ "?9f5f":
/*!*********************!*\
  !*** url (ignored) ***!
  \*********************/
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ "?afbb":
/*!**********************!*\
  !*** zlib (ignored) ***!
  \**********************/
/***/ (() => {

/* (ignored) */

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/******/ 	// the startup function
/******/ 	__webpack_require__.x = () => {
/******/ 		// Load entry module and return exports
/******/ 		// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 		var __webpack_exports__ = __webpack_require__.O(undefined, ["vendors-node_modules_file-saver_dist_FileSaver_min_js-node_modules_jszip_dist_jszip_min_js-no-dbb61a"], () => (__webpack_require__("./src/generate_cards_worker.js")))
/******/ 		__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 		return __webpack_exports__;
/******/ 	};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks and sibling chunks for the entrypoint
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".bundle.js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		__webpack_require__.p = "";
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/importScripts chunk loading */
/******/ 	(() => {
/******/ 		__webpack_require__.b = self.location + "";
/******/ 		
/******/ 		// object to store loaded chunks
/******/ 		// "1" means "already loaded"
/******/ 		var installedChunks = {
/******/ 			"src_add_names_to_card_js-src_generate_cards_worker_js": 1
/******/ 		};
/******/ 		
/******/ 		// importScripts chunk loading
/******/ 		var installChunk = (data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			for(var moduleId in moreModules) {
/******/ 				if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 					__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 				}
/******/ 			}
/******/ 			if(runtime) runtime(__webpack_require__);
/******/ 			while(chunkIds.length)
/******/ 				installedChunks[chunkIds.pop()] = 1;
/******/ 			parentChunkLoadingFunction(data);
/******/ 		};
/******/ 		__webpack_require__.f.i = (chunkId, promises) => {
/******/ 			// "1" is the signal for "already loaded"
/******/ 			if(!installedChunks[chunkId]) {
/******/ 				if(true) { // all chunks have JS
/******/ 					importScripts(__webpack_require__.p + __webpack_require__.u(chunkId));
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunkinvitation_card_bulk_name_print"] = self["webpackChunkinvitation_card_bulk_name_print"] || [];
/******/ 		var parentChunkLoadingFunction = chunkLoadingGlobal.push.bind(chunkLoadingGlobal);
/******/ 		chunkLoadingGlobal.push = installChunk;
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/startup chunk dependencies */
/******/ 	(() => {
/******/ 		var next = __webpack_require__.x;
/******/ 		__webpack_require__.x = () => {
/******/ 			return __webpack_require__.e("vendors-node_modules_file-saver_dist_FileSaver_min_js-node_modules_jszip_dist_jszip_min_js-no-dbb61a").then(next);
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// run startup
/******/ 	var __webpack_exports__ = __webpack_require__.x();
/******/ 	
/******/ })()
;
//# sourceMappingURL=src_add_names_to_card_js-src_generate_cards_worker_js.bundle.js.map