/**
 * UI Controls handler
 */

import { debounce } from '../utils/helpers.js';

export class UIControls {
  constructor(textureManager) {
    this.textureManager = textureManager;
    this.widthSlider = document.getElementById('setWidthSlider');
    this.heightSlider = document.getElementById('setheightSlider');
    this.linkCheckbox = document.getElementById('cb1');
    this.patternRadios = document.getElementsByName('type_s');
    this.downloadLink = document.getElementById('dlnk');
    this.previewImage = document.getElementById('cvs1');
    this.isLinked = true;

    this.init();
  }

  init() {
    // Slider controls with debouncing for better performance
    const debouncedUpdate = debounce(() => this.updateTileSize(), 50);

    this.widthSlider.addEventListener('input', () => {
      if (this.isLinked) {
        this.heightSlider.value = this.widthSlider.value;
      }
      debouncedUpdate();
    });

    this.heightSlider.addEventListener('input', () => {
      if (this.isLinked) {
        this.widthSlider.value = this.heightSlider.value;
      }
      debouncedUpdate();
    });

    // Link/unlink checkbox
    this.linkCheckbox.addEventListener('change', () => {
      this.isLinked = !this.linkCheckbox.checked;
      if (this.isLinked) {
        this.widthSlider.value = this.heightSlider.value;
        this.updateTileSize();
      }
    });

    // Pattern type radio buttons
    this.patternRadios.forEach((radio) => {
      radio.addEventListener('change', () => {
        const useMirroring = radio.value === 'true';
        this.textureManager.setTilingPattern(useMirroring);
      });
    });

    // Download functionality
    this.previewImage.addEventListener('click', () => {
      this.downloadLink.href = this.previewImage.src;
    });
  }

  updateTileSize() {
    const width = parseInt(this.widthSlider.value) * 50;
    const height = parseInt(this.heightSlider.value) * 50;
    this.textureManager.setTileSize(width, height);
  }

  updatePreviewImage() {
    const dataURL = this.textureManager.export();
    this.previewImage.src = dataURL;
  }
}
