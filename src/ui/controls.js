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
      this.updateSliderValues();
      debouncedUpdate();
    });

    this.heightSlider.addEventListener('input', () => {
      if (this.isLinked) {
        this.widthSlider.value = this.heightSlider.value;
      }
      this.updateSliderValues();
      debouncedUpdate();
    });

    // Link/unlink checkbox
    this.linkCheckbox.addEventListener('change', () => {
      this.isLinked = !this.linkCheckbox.checked;
      this.updateLinkIcon();
      if (this.isLinked) {
        this.widthSlider.value = this.heightSlider.value;
        this.updateSliderValues();
        this.updateTileSize();
      }
    });

    // Initialize link icon
    this.updateLinkIcon();

    // Pattern type radio buttons
    this.patternRadios.forEach((radio) => {
      radio.addEventListener('change', async () => {
        const useMirroring = radio.value === 'true';
        await this.textureManager.setTilingPattern(useMirroring);
        this.updatePreviewImage();
      });
    });

    // Download functionality
    this.previewImage.addEventListener('click', () => {
      const dataURL = this.textureManager.export();
      this.downloadLink.href = dataURL;
    });

    // Initialize slider values
    this.updateSliderValues();
  }

  updateSliderValues() {
    const widthValueEl = document.getElementById('width-value');
    const heightValueEl = document.getElementById('height-value');
    if (widthValueEl) widthValueEl.textContent = this.widthSlider.value;
    if (heightValueEl) heightValueEl.textContent = this.heightSlider.value;
  }

  updateLinkIcon() {
    const linkIcon = document.getElementById('linkIcon');
    if (linkIcon) {
      if (this.isLinked) {
        linkIcon.src = './img/link_a.png';
      } else {
        linkIcon.src = './img/link_b.png';
      }
    }
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
