/**
 * Texture management and preview system
 */

import { CanvasRenderer } from './canvasRenderer.js';

export class TextureManager {
  constructor(canvas, previewElement) {
    this.renderer = new CanvasRenderer(canvas);
    this.previewElement = previewElement;
    this.currentImageData = null;
    this.useMirroring = false;
    this.tileWidth = 150;
    this.tileHeight = 150;
  }

  /**
   * Loads an image and generates texture
   * @param {string} imageDataURL - Image data URL
   * @returns {Promise<void>}
   */
  async loadImage(imageDataURL) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      // Set crossOrigin before src to prevent canvas taint issues on mobile browsers
      image.crossOrigin = 'anonymous';
      this.currentImageData = imageDataURL;
      image.src = imageDataURL;

      image.onload = () => {
        this.renderer.generateTexture(image, this.useMirroring);
        this.updatePreview();
        resolve();
      };

      image.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    });
  }

  /**
   * Updates the background preview with current texture
   */
  updatePreview() {
    const dataURL = this.renderer.exportAsDataURL();
    document.body.style.backgroundImage = `url('${dataURL}')`;
    document.body.style.backgroundSize = `${this.tileWidth}px ${this.tileHeight}px`;
    document.body.style.backgroundRepeat = 'repeat';

    // Update preview thumbnail
    if (this.previewElement) {
      this.previewElement.src = dataURL;
    }
  }

  /**
   * Sets the tiling pattern type
   * @param {boolean} useMirroring - Whether to use mirror tiling
   */
  async setTilingPattern(useMirroring) {
    this.useMirroring = useMirroring;
    if (this.currentImageData) {
      await this.loadImage(this.currentImageData);
    }
  }

  /**
   * Updates tile size for preview
   * @param {number} width - Tile width in pixels
   * @param {number} height - Tile height in pixels
   */
  setTileSize(width, height) {
    this.tileWidth = width;
    this.tileHeight = height;
    this.updatePreview();
  }

  /**
   * Exports the current texture
   * @param {string} format - Export format
   * @param {number} quality - Export quality
   * @returns {string} - Data URL
   */
  export(format = 'image/jpeg', quality = 0.92) {
    return this.renderer.exportAsDataURL(format, quality);
  }
}
