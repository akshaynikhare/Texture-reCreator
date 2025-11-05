/**
 * Image loading utilities
 */

/**
 * Converts an image URL to a data URL
 * @param {string} src - Image source URL
 * @returns {Promise<string>} - Data URL of the image
 */
export async function toDataURL(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'Anonymous';

    image.onload = function () {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = this.naturalHeight;
      canvas.width = this.naturalWidth;
      context.drawImage(this, 0, 0);
      const dataURL = canvas.toDataURL('image/jpeg');
      resolve(dataURL);
    };

    image.onerror = function () {
      reject(new Error(`Failed to load image: ${src}`));
    };

    image.src = src;
  });
}

/**
 * Validates if a file is an image
 * @param {File} file - File to validate
 * @returns {boolean} - True if file is an image
 */
export function isImageFile(file) {
  return file && file.type.match('image.*');
}

/**
 * Reads a file as a data URL
 * @param {File} file - File to read
 * @returns {Promise<string>} - Data URL of the file
 */
export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
