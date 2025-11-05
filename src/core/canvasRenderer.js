/**
 * Canvas rendering engine for texture generation
 */

export class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', {
      alpha: true,
      willReadFrequently: false,
    });
    this.currentImage = null;
  }

  /**
   * Mirrors and draws an image on the canvas
   * @param {Image} image - Image to draw
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {boolean} horizontal - Flip horizontally
   * @param {boolean} vertical - Flip vertically
   */
  mirrorImage(image, x = 0, y = 0, width = 100, height = 100, horizontal = false, vertical = false) {
    this.ctx.save();
    this.ctx.setTransform(
      horizontal ? -1 : 1,
      0,
      0,
      vertical ? -1 : 1,
      horizontal ? image.width + x : x,
      vertical ? image.height + y : y
    );
    this.ctx.drawImage(image, 0, 0, width, height);
    this.ctx.restore();
  }

  /**
   * Generates a tiled texture with mirroring option
   * @param {Image} image - Source image
   * @param {boolean} useMirroring - Whether to use mirror tiling
   */
  generateTexture(image, useMirroring = false) {
    this.currentImage = image;
    this.canvas.height = image.height * 2;
    this.canvas.width = image.width * 2;

    if (useMirroring) {
      // Mirror pattern for seamless textures
      this.mirrorImage(image, 0, 0, image.width, image.height, false, false);
      this.mirrorImage(image, image.width, 0, image.width, image.height, true, false);
      this.mirrorImage(image, 0, image.height, image.width, image.height, false, true);
      this.mirrorImage(image, image.width, image.height, image.width, image.height, true, true);
    } else {
      // Simple tiling pattern
      this.ctx.drawImage(image, 0, 0, image.width, image.height);
      this.ctx.drawImage(image, image.width, 0, image.width, image.height);
      this.ctx.drawImage(image, 0, image.height, image.width, image.height);
      this.ctx.drawImage(image, image.width, image.height, image.width, image.height);
    }
  }

  /**
   * Exports the canvas as a data URL
   * @param {string} format - Image format (default: 'image/jpeg')
   * @param {number} quality - Image quality 0-1 (default: 0.92)
   * @returns {string} - Data URL
   */
  exportAsDataURL(format = 'image/jpeg', quality = 0.92) {
    return this.canvas.toDataURL(format, quality);
  }

  /**
   * Clears the canvas
   */
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
