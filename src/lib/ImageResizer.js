/* Resizes an image
 *
 *  @params
 *    file (blob): image file
 *    options: (object)
 *      width (number): max width of image
 *      height (number): max height of image
 *
 *  @returns
 *    blob (blob): Resized blob object
 *    didItResize (bool): true if resized
 *
 * Credits:
 * https://gist.githubusercontent.com/dcollien/312bce1270a5f511bf4a/raw/9bb680a9d30f0df8046a78f7335abfaf5c026135/ImageTools.es6
 */
const hasBlobConstructor =
  typeof Blob !== 'undefined' &&
  (function createBlob() {
    try {
      return Boolean(new Blob());
    } catch (e) {
      return false;
    }
  })();

const hasArrayBufferViewSupport =
  hasBlobConstructor &&
  typeof Uint8Array !== 'undefined' &&
  (function createArrayBuffer() {
    try {
      return new Blob([new Uint8Array(100)]).size === 100;
    } catch (e) {
      return false;
    }
  })();

const hasToBlobSupport =
  typeof HTMLCanvasElement !== 'undefined' ? HTMLCanvasElement.prototype.toBlob : false;

const hasBlobSupport =
  hasToBlobSupport ||
  (typeof Uint8Array !== 'undefined' &&
    typeof ArrayBuffer !== 'undefined' &&
    typeof atob !== 'undefined');

const hasReaderSupport = typeof FileReader !== 'undefined' || typeof URL !== 'undefined';

export default class ImageTools {
  static resize(file, md, cb) {
    let maxDimensions = md;
    let callback = cb;
    if (typeof maxDimensions === 'function') {
      callback = md;
      maxDimensions = {
        width: 1000,
        height: 1000,
      };
    }

    if (!ImageTools.isSupported() || !ImageTools.isImage(file)) {
      callback(file, false);
      return false;
    }

    if (file.type && file.type.match(/image\/gif/)) {
      // Not attempting, could be an animated gif
      callback(file, false);
      // TODO: use https://github.com/antimatter15/whammy to convert gif to webm
      return false;
    }

    const image = new Image();

    image.onload = () => {
      let { width, height } = image;
      let isTooLarge = false;

      if (width >= height && width > maxDimensions.width) {
        // width is the largest dimension, and it's too big.
        height *= maxDimensions.width / width;
        width = maxDimensions.width; // eslint-disable-line prefer-destructuring
        isTooLarge = true;
      } else if (height > maxDimensions.height) {
        // either width wasn't over-size or height is the largest dimension
        // and the height is over-size
        width *= maxDimensions.height / height;
        height = maxDimensions.height; // eslint-disable-line prefer-destructuring
        isTooLarge = true;
      }

      if (!isTooLarge) {
        // early exit; no need to resize
        callback(file, false);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0, width, height);

      if (hasToBlobSupport) {
        canvas.toBlob(blob => {
          callback(blob, true);
        }, file.type);
      } else {
        const blob = ImageTools.toBlob(canvas, file.type);
        callback(blob, true);
      }
    };
    ImageTools.loadImage(image, file);

    return true;
  }

  static toBlob(data, type) {
    const dataURI = data instanceof HTMLCanvasElement ? data.toDataURL(type) : data;
    const dataURIParts = dataURI.split(',');
    let byteString;
    if (dataURIParts[0].indexOf('base64') >= 0) {
      // Convert base64 to raw binary data held in a string:
      byteString = atob(dataURIParts[1]);
    } else {
      // Convert base64/URLEncoded data component to raw binary data:
      byteString = decodeURIComponent(dataURIParts[1]);
    }
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const intArray = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i += 1) {
      intArray[i] = byteString.charCodeAt(i);
    }

    const mimeString = dataURIParts[0].split(':')[1].split(';')[0];
    let blob = null;

    if (hasBlobConstructor) {
      blob = new Blob([hasArrayBufferViewSupport ? intArray : arrayBuffer], {
        type: mimeString,
      });
    } else {
      const bb = new Blob();
      bb.append(arrayBuffer);
      blob = bb.getBlob(mimeString);
    }

    return blob;
  }

  static loadImage(image, file, callback) {
    if (typeof URL === 'undefined') {
      const reader = new FileReader();
      reader.onload = evt => {
        image.src = evt.target.result;
        if (callback) {
          callback();
        }
      };
      reader.readAsDataURL(file);
    } else {
      image.src = typeof file === 'string' ? file : URL.createObjectURL(file);
      if (callback) {
        callback();
      }
    }
  }

  static isImage(data) {
    if (data instanceof Blob) {
      return data.type && data.type.match(/image.*/);
    }
    if (typeof data === 'string') {
      return data.match(/data:image.*/);
    }
    return false;
  }

  static isSupported() {
    return typeof HTMLCanvasElement !== 'undefined' && hasBlobSupport && hasReaderSupport;
  }
}
