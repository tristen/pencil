'use strict';

var EventEmitter = require('events').EventEmitter;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {object} [options]
 * @param {number} [options.pixelSize] defaults to 1px
 * @param {number} [options.color] defaults to black
 * @class
 */
var Pencil = function(canvasEl, options) {
  options = options || {};

  this._currentPixel = undefined;
  this._pixelSize = options.pixelSize || 1;
  this._color = options.color || 'black';
  this._canvasEl = canvasEl;

  this._pixels = {};
  this._collection = [];
  this._ev = new EventEmitter();
  bindHandlers(this);
};

function bindHandlers(context) {
  for (var i in context) {
    if (typeof context[i] === 'function' && i.indexOf('_on') === 0) {
      context[i] = context[i].bind(context);
    }
  }
}

/**
 * Runs Bresenham's line algorithm on two coordinates to determine pixels that
 * make up a line between them
 * @param {object} c0
 * @param {object} c1
 * @returns {object[]} an array of pixel coordinates
 */
Pencil.prototype._bres = function(c0, c1) {
  var pixels = [];

  var y;
  var lt = c0.x < c1.x;
  var x0 = lt ? c0.x : c1.x;
  var y0 = lt ? c0.y : c1.y;
  var x1 = lt ? c1.x : c0.x;
  var y1 = lt ? c1.y : c0.y;

  var ySign = y0 < y1 ? 1 : -1;
  if (x0 === x1) {
    // draw a vertical line
    for (y = y0; y !== (y1 + ySign); y += ySign) {
      pixels.push({x: x0, y: y});
    }
    return pixels;
  }

  y = y0;
  var err = 0;
  var deltaErr = Math.abs((y1 - y0) / (x1 - x0));
  var xSign = x0 < x1 ? 1 : -1;
  for (var x = x0; x !== (x1 + xSign); x += xSign) {
    pixels.push({x: x, y: y});
    err += deltaErr;
    var prevX = x;
    var prevY = y;
    while (Math.abs(err) > 0.5 && y !== y1) {
      if (prevX !== x || prevY !== y) {
        pixels.push({x: x, y: y});
        prevX = x;
        prevY = y;
      }
      y += ySign;
      err -= 1;
    }
  }
  return pixels;
};

Pencil.prototype._clearCanvas = function() {
  var canvas = this._canvasEl;
  var context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
};

Pencil._copyPixels = function(pixels) {
  var copy = {};
  for (var x in pixels) {
    x = parseInt('' + x);
    copy[x] = {};
    for (var y in pixels[x]) {
      y = parseInt('' + y);
      copy[x][y] = pixels[x][y];
    }
  }
  return copy;
};

/*
 * @param {Event} e
 * @returns {object}
 */
Pencil.prototype._getCoordFromEvent = function(e) {
  var rect = this._canvasEl.getBoundingClientRect();
  e = e.touches ? e.touches[0] : e;
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
};

/*
 * @param {Event} e
 * @returns {object}
 */
Pencil.prototype._getPixelFromEvent = function(e) {
  var coord = this._getCoordFromEvent(e);
  return {
    x: Math.floor(coord.x / this._pixelSize),
    y: Math.floor(coord.y / this._pixelSize)
  };
};

/*
 * @param {object} pxCoord
 */
Pencil.prototype._renderPixel = function(pxCoord) {
  var color = this._pixels[pxCoord.x][pxCoord.y];
  var context = this._canvasEl.getContext('2d');
  context.fillStyle = color;
  context.fillRect(
    this._pixelSize * pxCoord.x,
    this._pixelSize * pxCoord.y,
    this._pixelSize, this._pixelSize);
};

/*
 * Writes and renders a given pixel based on the current color
 * @param {object} pxCoord
 */
Pencil.prototype._drawPixel = function(pxCoord) {
  // if the pixel we're asked to draw is out of range, just ignore it
  if (pxCoord.x * this._pixelSize >= this._canvasEl.width ||
     pxCoord.y * this._pixelSize >= this._canvasEl.height) {
    return;
  }
  if (!this._pixels[pxCoord.x]) this._pixels[pxCoord.x] = {};
  this._pixels[pxCoord.x][pxCoord.y] = this._color;
  this._renderPixel(pxCoord);
};

Pencil.prototype._redraw = function() {
  this._clearCanvas();
  for (var x in this._pixels) {
    for (var y in this._pixels[x]) {
      this._renderPixel({x: x, y: y});
    }
  }
};

Pencil.prototype._onDown = function(e) {
  if (this._active) return;

  if (e.touches) {
    document.addEventListener('touchmove', this._onMove);
    document.addEventListener('touchend', this._onTouchEnd);
  } else {
    document.addEventListener('mousemove', this._onMove);
    document.addEventListener('mouseup', this._onMouseUp);
    document.addEventListener('keydown', this._onKeyDown);
  }

  this._active = false;

  this._currentPixel = this._getPixelFromEvent(e);
  this._drawPixel(this._currentPixel);
};

Pencil.prototype._onKeyDown = function(e) {
  if (e.keyCode === 27) { // ESC
    this._active = false;
    this.clear();
  }
};

Pencil.prototype._onMove = function(e) {
  if (!this._active) this._active = true;

  var pixel = this._getPixelFromEvent(e);

  var prevPixel = this._currentPixel;
  this._collection.push(pixel);
  var path = this._bres(pixel, prevPixel);

  for (var i = 0; i < path.length; i++) this._drawPixel(path[i]);
  this._currentPixel = pixel;

  e.preventDefault();
};

Pencil.prototype._onTouchEnd = function() {
  this._onUp();
  document.removeEventListener('touchmove', this._onMove);
  document.removeEventListener('touchend', this._onTouchEnd);
};

Pencil.prototype._onMouseUp = function() {
  this._onUp();
  document.removeEventListener('mousemove', this._onMove);
  document.removeEventListener('mouseup', this._onMouseUp);
  document.removeEventListener('keydown', this._onKeyDown);
};

Pencil.prototype._onUp = function() {
  if (!this._active) return;
  this._active = false;
  this.fire('result', { result: this.getCollection() });
  this._collection = []; // Clear the collection
};

/**
 * @param {object} pixels A hash of pixel colors formatted as
 * pixels[x][y] = color
 */
Pencil.prototype.loadPixels = function(pixels) {
  this._pixels = Pencil._copyPixels(pixels);
  this._redraw();
};

/**
 * @returns {object} an object representing the canvas's current
 * state. Individual pixel colors can be read via [x][y] accessors
 */
Pencil.prototype.getPixels = function() {
  return Pencil._copyPixels(this._pixels);
};

/**
 * @returns {object} an object representing the canvas's current
 * state. Individual pixel colors can be read via [x][y] accessors
 */
Pencil.prototype.getCollection = function() {
  return this._collection;
};

/**
 * Erases all the pixels on the canvas
 */
Pencil.prototype.clear = function() {
  this._clearCanvas();
  this._pixels = {};
  return this;
};

/**
 * Enable drawing interaction
 */
Pencil.prototype.enable = function() {
  this._canvasEl.addEventListener('mousedown', this._onDown);
  this._canvasEl.addEventListener('touchstart', this._onDown);
  return this;
};

/**
 * Disable drawing interaction
 */
Pencil.prototype.disable = function() {
  this._canvasEl.removeEventListener('mousedown', this._onDown);
  this._canvasEl.removeEventListener('touchstart', this._onDown);
  return this;
};

/**
 * @param {string} color
 */
Pencil.prototype.setColor = function(color) {
  this._color = color;
};

/**
 * @param {number} pixelSize
 */
Pencil.prototype.setPixelSize = function(pixelSize) {
  this._pixelSize = pixelSize;
  this._redraw();
};

/**
 * Subscribe to events
 * @param {String} type name of event. Available events and the data passed into their respective event objects are:
 * @returns {Pencil} this;
 */
Pencil.prototype.on = function(type, fn) {
  this._ev.on(type, fn);
  return this;
};

/**
 * Fire an event
 * @param {String} type event name.
 * @param {Object} data event data to pass to the function subscribed.
 * @returns {Pencil} this
 */
Pencil.prototype.fire = function(type, data) {
  this._ev.emit(type, data);
  return this;
};

/**
 * Remove an event
 * @param {String} type Event name.
 * @param {Function} fn Function that should unsubscribe to the event emitted.
 * @returns {Pencil} this
 */
Pencil.prototype.off = function(type, fn) {
  this._ev.removeListener(type, fn);
  return this;
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Pencil;
} else {
  window.Pencil = Pencil;
}
