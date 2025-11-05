/**
 * UI Controls handler
 */

import { debounce } from '../utils/helpers.js';

export class UIControls {
  constructor(textureManager, app) {
    this.textureManager = textureManager;
    this.app = app;
    this.widthSlider = document.getElementById('setWidthSlider');
    this.heightSlider = document.getElementById('setheightSlider');
    this.linkCheckbox = document.getElementById('cb1');
    this.patternRadios = document.getElementsByName('type_s');
    this.downloadLink = document.getElementById('dlnk');
    this.previewImage = document.getElementById('cvs1');
    this.isLinked = false; // Start unlinked (checkbox unchecked)

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
      this.isLinked = this.linkCheckbox.checked; // Checked = linked
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
        this.updateThreePreview();
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
    // Update preview image and background after tile size change
    this.updatePreviewImage();
    this.updateThreePreview();
    // Update background if in background mode
    if (this.app && this.app.currentPreviewMode === 'background') {
      const previewArea = document.getElementById('previewArea');
      if (previewArea) {
        previewArea.style.backgroundImage = `url('${this.textureManager.export()}')`;
        previewArea.style.backgroundSize = `${width}px ${height}px`;
        previewArea.style.backgroundRepeat = 'repeat';
      }
    }
  }

  updatePreviewImage() {
    const dataURL = this.textureManager.export();
    this.previewImage.src = dataURL;
  }

  updateThreePreview() {
    if (this.app && this.app.threePreview && this.app.currentPreviewMode !== 'background') {
      const dataURL = this.textureManager.export();
      this.app.threePreview.updateTexture(dataURL);
    }
  }
}
