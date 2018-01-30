/*!
 * Angular-PDF: An Angularjs directive <ng-pdf> to display PDF in the browser with PDFJS.
 * @version 1.6.3
 * @link https://github.com/sayanee/angular-pdf#readme
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("angular"));
	else if(typeof define === 'function' && define.amd)
		define("pdf", ["angular"], factory);
	else if(typeof exports === 'object')
		exports["pdf"] = factory(require("angular"));
	else
		root["pdf"] = factory(root["angular"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_0__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/angular-pdf.module.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/angular-pdf.directive.js":
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
var NgPdf = exports.NgPdf = ["$window", "$document", "$log", function NgPdf($window, $document, $log) {
  'ngInject';

  var backingScale = function backingScale(canvas) {
    var ctx = canvas.getContext('2d');
    var dpr = $window.devicePixelRatio || 1;
    var bsr = ctx.webkitBackingStorePixelRatio || ctx.mozBackingStorePixelRatio || ctx.msBackingStorePixelRatio || ctx.oBackingStorePixelRatio || ctx.backingStorePixelRatio || 1;

    return dpr / bsr;
  };

  var setCanvasDimensions = function setCanvasDimensions(canvas, w, h) {
    var ratio = backingScale(canvas);
    canvas.width = Math.floor(w * ratio);
    canvas.height = Math.floor(h * ratio);
    canvas.style.width = Math.floor(w) + 'px';
    canvas.style.height = Math.floor(h) + 'px';
    canvas.getContext('2d').setTransform(ratio, 0, 0, ratio, 0, 0);
    return canvas;
  };

  return {
    restrict: 'E',
    templateUrl: function templateUrl(element, attr) {
      return attr.templateUrl ? attr.templateUrl : 'partials/viewer.html';
    },
    link: function link(scope, element, attrs) {
      var renderTask = null;
      var pdfLoaderTask = null;
      var debug = attrs.hasOwnProperty('debug') ? attrs.debug : false;
      var url = attrs.pdfUrl ? attrs.pdfUrl : scope.pdfUrl;
      var topOffset = attrs.topOffset ? attrs.topOffset : scope.topOffset;
      var bottomOffset = attrs.bottomOffset ? attrs.bottomOffset : scope.bottomOffset;
      var offsetTop = isFinite(topOffset) ? parseInt(topOffset) : 0;
      var offsetBottom = isFinite(bottomOffset) ? parseInt(bottomOffset) : 0;
      var httpHeaders = scope.httpHeaders;
      var pdfDoc = null;
      var pageToDisplay = isFinite(attrs.page) ? parseInt(attrs.page) : 1;
      var pageFit = attrs.scale === 'page-fit';
      var pageFitF = attrs.scale === 'page-fit-full';
      var pageFitW = attrs.scale === 'page-fit-width';
      var pageFitH = attrs.scale === 'page-fit-height';
      var scale = attrs.scale > 0 ? attrs.scale : 1;
      var canvasid = attrs.canvasid || 'pdf-canvas';
      var canvas = $document[0].getElementById(canvasid);
      var creds = attrs.usecredentials;

      var ctx = canvas.getContext('2d');
      var windowEl = angular.element($window);

      element.css('display', 'block');

      windowEl.on('scroll', function () {
        scope.$apply(function () {
          scope.scroll = windowEl[0].scrollY;
        });
      });

      PDFJS.disableWorker = true;
      scope.pageNum = pageToDisplay;

      scope.renderPage = function (num) {
        if (renderTask) {
          renderTask._internalRenderTask.cancel();
        }

        pdfDoc.getPage(num).then(function (page) {
          var viewport = void 0;
          var pageWidthScale = void 0;
          var renderContext = void 0;

          var viewport = page.getViewport(1);
          var clientRect = element[0].getBoundingClientRect();
	  if (debug) console.log("Offset Top: "+offsetTop);
	  if (debug) console.log("Offset Bottom: "+offsetBottom);
	  var windowHeight = $window.innerHeight;
	  if (debug) console.log("Window Height: "+windowHeight);
	  var clientRectHeight = windowHeight - offsetTop - offsetBottom;
	  if (debug) console.log("Computed Height: "+clientRectHeight);
          var pageWidthScale = clientRect.width / viewport.width;
	  if (debug) console.log("Page Width Scale: "+pageWidthScale);
          var pageHeightScale = clientRectHeight / viewport.height;
	  if (debug) console.log("Page Height Scale: "+pageHeightScale);
/*
          if (pageFit) {
            viewport = page.getViewport(1);
            var clientRect = element[0].getBoundingClientRect();
            pageWidthScale = clientRect.width / viewport.width;
            scale = pageWidthScale;
          }
          viewport = page.getViewport(scale);
*/
          if (pageFit || pageFitF) {
              scale = Math.min(pageWidthScale,pageHeightScale);
          };
          if (pageFitW) {
              scale = pageWidthScale;
          };
          if (pageFitH) {
              scale = pageHeightScale;
          };
          viewport = page.getViewport(scale);
	  if (debug) console.log("Page Scale: "+scale);

          setCanvasDimensions(canvas, viewport.width, viewport.height);

          renderContext = {
            canvasContext: ctx,
            viewport: viewport
          };

          renderTask = page.render(renderContext);
          renderTask.promise.then(function () {
            if (angular.isFunction(scope.onPageRender)) {
              scope.onPageRender();
            }
          }).catch(function (reason) {
            $log.log(reason);
          });
        });
      };

      scope.goPrevious = function () {
        if (scope.pageToDisplay <= 1) {
          return;
        }
        scope.pageToDisplay = parseInt(scope.pageToDisplay) - 1;
        scope.pageNum = scope.pageToDisplay;
      };

      scope.goNext = function () {
        if (scope.pageToDisplay >= pdfDoc.numPages) {
          return;
        }
        scope.pageToDisplay = parseInt(scope.pageToDisplay) + 1;
        scope.pageNum = scope.pageToDisplay;
      };

      scope.zoomIn = function () {
        pageFit = false;
        scale = parseFloat(scale) + 0.2;
        scope.renderPage(scope.pageToDisplay);
        return scale;
      };

      scope.zoomOut = function () {
        pageFit = false;
        scale = parseFloat(scale) - 0.2;
        scope.renderPage(scope.pageToDisplay);
        return scale;
      };

      scope.fit = function () {
        pageFit = true;
        scope.renderPage(scope.pageToDisplay);
      };

      scope.changePage = function () {
        scope.renderPage(scope.pageToDisplay);
      };

      scope.rotate = function () {
        if (canvas.getAttribute('class') === 'rotate0') {
          canvas.setAttribute('class', 'rotate90');
        } else if (canvas.getAttribute('class') === 'rotate90') {
          canvas.setAttribute('class', 'rotate180');
        } else if (canvas.getAttribute('class') === 'rotate180') {
          canvas.setAttribute('class', 'rotate270');
        } else {
          canvas.setAttribute('class', 'rotate0');
        }
      };

      function clearCanvas() {
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }

      function renderPDF() {
        clearCanvas();

        var params = {
          'url': url,
          'withCredentials': creds
        };

        if (httpHeaders) {
          params.httpHeaders = httpHeaders;
        }

        if (url && url.length) {
          pdfLoaderTask = PDFJS.getDocument(params);
          pdfLoaderTask.onProgress = scope.onProgress;
          pdfLoaderTask.onPassword = scope.onPassword;
          pdfLoaderTask.then(function (_pdfDoc) {
            if (angular.isFunction(scope.onLoad)) {
              scope.onLoad();
            }

            pdfDoc = _pdfDoc;
            scope.renderPage(scope.pageToDisplay);

            scope.$apply(function () {
              scope.pageCount = _pdfDoc.numPages;
            });
          }, function (error) {
            if (error) {
              if (angular.isFunction(scope.onError)) {
                scope.onError(error);
              }
            }
          });
        }
      }

      scope.$watch('pageNum', function (newVal) {
        scope.pageToDisplay = parseInt(newVal);
        if (pdfDoc !== null) {
          scope.renderPage(scope.pageToDisplay);
        }
      });

      scope.$watch('pdfUrl', function (newVal) {
        if (newVal !== '') {
          if (debug) {
            $log.log('pdfUrl value change detected: ', scope.pdfUrl);
          }
          url = newVal;
          scope.pageNum = scope.pageToDisplay = pageToDisplay;
          if (pdfLoaderTask) {
            pdfLoaderTask.destroy().then(function () {
              renderPDF();
            });
          } else {
            renderPDF();
          }
        }
      });
    }
  };
}];

/***/ }),

/***/ "./src/angular-pdf.module.js":
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Pdf = undefined;

var _angular = __webpack_require__(0);

var _angular2 = _interopRequireDefault(_angular);

var _angularPdf = __webpack_require__("./src/angular-pdf.directive.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Pdf = exports.Pdf = _angular2.default.module('pdf', []).directive('ngPdf', _angularPdf.NgPdf).name;

/***/ }),

/***/ 0:
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_0__;

/***/ })

/******/ });
});
//# sourceMappingURL=angular-pdf.js.map
