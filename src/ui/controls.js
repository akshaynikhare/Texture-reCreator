/**
 * UI Controls handler
 */

import { debounce } from '../utils/helpers.js';
import linkIconLinked from '../../assets/link-icon-linked.png';
import linkIconUnlinked from '../../assets/link-icon-unlinked.png';

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
    this.isLinked = true; // Start linked

    this.init();
  }

  init() {
    // Slider controls with debouncing for better performance
    const debouncedUpdate = debounce(() => this.updateTileSizeAndUrl(), 50);

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

    // Ensure checkbox reflects default linked state
    if (this.linkCheckbox) {
      this.linkCheckbox.checked = true;
    }

    // Link/unlink checkbox
    this.linkCheckbox.addEventListener('change', () => {
      this.isLinked = this.linkCheckbox.checked; // Checked = linked
      this.updateLinkIcon();
      if (this.isLinked) {
        this.widthSlider.value = this.heightSlider.value;
        this.updateSliderValues();
        this.updateTileSize();
      }
      // Update URL to reflect new link state
      if (this.app && typeof this.app.updateUrlFromState === 'function') {
        this.app.updateUrlFromState();
      }
    });

    // Initialize link icon
    this.updateLinkIcon();

    // Pattern type radio buttons
    this.patternRadios.forEach((radio) => {
      radio.addEventListener('change', async () => {
        const useMirroring = radio.value === 'true';
        await this.textureManager.setTilingPattern(useMirroring);
        // Update the small preview image
        this.updatePreviewImage();
        // Update 3D preview if active
        this.updateThreePreview();
        // If we're in background preview mode, also refresh the preview area background.
        // Previously only the document.body background was updated, which isn't visible
        // in the new layout that uses #previewArea for tiling.
        if (this.app && this.app.currentPreviewMode === 'background') {
          const previewArea = document.getElementById('previewArea');
          if (previewArea) {
            const dataURL = this.textureManager.export();
            previewArea.style.backgroundImage = `url('${dataURL}')`;
            previewArea.style.backgroundSize = `${this.textureManager.tileWidth}px ${this.textureManager.tileHeight}px`;
            previewArea.style.backgroundRepeat = 'repeat';
          }
        }

        // Update URL to reflect new pattern type
        if (this.app && typeof this.app.updateUrlFromState === 'function') {
          this.app.updateUrlFromState();
        }
      });
    });

    // Download functionality
    this.previewImage.addEventListener('click', () => {
      const dataURL = this.textureManager.export();
      this.downloadLink.href = dataURL;
    });

    // Initialize slider values and enforce link at start
    if (this.isLinked) {
      this.heightSlider.value = this.widthSlider.value;
    }
    this.updateSliderValues();
    this.updateTileSize();
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
        linkIcon.src = linkIconLinked;
      } else {
        linkIcon.src = linkIconUnlinked;
      }
    }
  }

  updateTileSizeAndUrl() {
    this.updateTileSize();
    if (this.app && typeof this.app.updateUrlFromState === 'function') {
      this.app.updateUrlFromState();
    }
  }

  updateTileSize() {
    const widthSteps = parseInt(this.widthSlider.value);
    const heightSteps = parseInt(this.heightSlider.value);
    const width = widthSteps * 50;
    const height = heightSteps * 50;
    this.textureManager.setTileSize(width, height);
    // Update preview image and background after tile size change
    this.updatePreviewImage();
    this.updateThreePreview({ widthSteps, heightSteps });
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

  updateThreePreview(tileSteps) {
    if (this.app && this.app.threePreview && this.app.currentPreviewMode !== 'background') {
      const dataURL = this.textureManager.export();
      this.app.threePreview.updateTexture(dataURL, tileSteps);
    }
  }
}
