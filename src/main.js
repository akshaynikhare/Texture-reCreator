/**
 * Texture reCreator - Main Application Entry Point
 * A modern tool for testing and creating seamless texture patterns
 */

import { TextureManager } from './core/textureManager.js';
import { DragDropHandler } from './ui/dragDrop.js';
import { UIControls } from './ui/controls.js';
import { ThemeManager } from './ui/themeManager.js';
import { toDataURL } from './utils/imageLoader.js';

class TextureReCreatorApp {
  constructor() {
    this.canvas = document.getElementById('cvs');
    this.previewImage = document.getElementById('cvs1');
    this.container = document.getElementById('container');

    if (!this.canvas || !this.previewImage || !this.container) {
      console.error('Required elements not found in DOM');
      return;
    }

    this.init();
  }

  async init() {
    try {
      // Initialize theme manager
      this.themeManager = new ThemeManager();

      // Initialize texture manager
      this.textureManager = new TextureManager(this.canvas, this.previewImage);

      // Initialize UI controls
      this.controls = new UIControls(this.textureManager);

      // Initialize drag and drop
      this.dragDropHandler = new DragDropHandler(document.body, async (dataURL) => {
        await this.loadTexture(dataURL);
      });

      // Initialize file input button
      this.initFileInput();

      // Load default texture
      await this.loadDefaultTexture();

      console.log('✅ Texture reCreator initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.showError('Failed to initialize application. Please refresh the page.');
    }
  }

  initFileInput() {
    const fileInput = document.getElementById('fileInput');
    const selectBtn = document.getElementById('selectImageBtn');

    if (selectBtn && fileInput) {
      selectBtn.addEventListener('click', () => {
        fileInput.click();
      });

      fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file && file.type.match('image.*')) {
          const reader = new FileReader();
          reader.onload = async (e) => {
            await this.loadTexture(e.target.result);
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }

  async loadTexture(dataURL) {
    try {
      await this.textureManager.loadImage(dataURL);
      this.controls.updatePreviewImage();
      this.controls.updateSliderValues();
      document.body.style.background = '#eee';
    } catch (error) {
      console.error('Failed to load texture:', error);
      this.showError('Failed to load texture. Please try a different image.');
    }
  }

  async loadDefaultTexture() {
    try {
      const dataURL = await toDataURL('img/sam-1.jpg');
      await this.loadTexture(dataURL);

      // Set default tile size
      document.getElementById('setWidthSlider').value = 3;
      document.getElementById('setheightSlider').value = 3;
      this.controls.updateSliderValues();
      this.controls.updateTileSize();
    } catch (error) {
      console.warn('Could not load default texture:', error);
    }
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new TextureReCreatorApp();
  });
} else {
  new TextureReCreatorApp();
}
