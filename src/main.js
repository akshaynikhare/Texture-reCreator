/**
 * Texture reCreator - Main Application Entry Point
 * A modern tool for testing and creating seamless texture patterns
 */

import { TextureManager } from './core/textureManager.js';
import { DragDropHandler } from './ui/dragDrop.js';
import { UIControls } from './ui/controls.js';
import { ThemeManager } from './ui/themeManager.js';
import { ThreePreview } from './ui/threePreview.js';
import { toDataURL } from './utils/imageLoader.js';

class TextureReCreatorApp {
  constructor() {
    this.canvas = document.getElementById('cvs');
    this.previewImage = document.getElementById('cvs1');

    if (!this.canvas || !this.previewImage) {
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

      // Initialize UI controls (pass app reference for 3D preview updates)
      this.controls = new UIControls(this.textureManager, this);

      // Initialize drag and drop
      this.dragDropHandler = new DragDropHandler(document.body, async (dataURL) => {
        await this.loadTexture(dataURL);
      });

      // Initialize file input button
      this.initFileInput();

      // Initialize 3D preview
      this.currentPreviewMode = 'background';
      this.threePreview = null;
      this.initPreviewModes();

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

  initPreviewModes() {
    const modeButtons = document.querySelectorAll('.mode-option');

    modeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        this.setPreviewMode(mode);

        // Update active button
        modeButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  setPreviewMode(mode) {
    this.currentPreviewMode = mode;
    const previewInfo = document.getElementById('previewInfo');
    const previewArea = document.getElementById('previewArea');

    if (mode === 'background') {
      // Hide 3D preview, show background tiling on preview area
      if (this.threePreview) {
        this.threePreview.dispose();
        this.threePreview = null;
      }
      document.getElementById('threejs-preview').style.display = 'none';

      // Apply background to preview area instead of body
      if (previewArea) {
        previewArea.style.backgroundImage = `url('${this.textureManager.export()}')`;
        previewArea.style.backgroundSize = `${this.textureManager.tileWidth}px ${this.textureManager.tileHeight}px`;
        previewArea.style.backgroundRepeat = 'repeat';
      }

      if (previewInfo) {
        previewInfo.textContent = 'Background tiling mode - See the texture repeat seamlessly';
      }
    } else {
      // Show 3D preview
      document.getElementById('threejs-preview').style.display = 'block';

      // Remove background from preview area
      if (previewArea) {
        previewArea.style.backgroundImage = 'none';
      }

      if (!this.threePreview) {
        this.threePreview = new ThreePreview('threejs-preview');
      }

      this.threePreview.setMode(mode);

      if (this.textureManager.renderer && this.textureManager.renderer.currentImage) {
        const dataURL = this.textureManager.export();
        this.threePreview.updateTexture(dataURL);
      }

      if (previewInfo) {
        if (mode === 'sphere') {
          previewInfo.textContent = '3D Sphere preview - Rotating sphere with your texture applied';
        } else if (mode === 'cloth') {
          previewInfo.textContent = '3D Wall preview - Draped fabric wall with vertical folds';
        } else if (mode === 'cube') {
          previewInfo.textContent = '3D Cube preview - Rotating cube with your texture applied';
        }
      }
    }
  }

  async loadTexture(dataURL) {
    try {
      await this.textureManager.loadImage(dataURL);
      this.controls.updatePreviewImage();
      this.controls.updateSliderValues();

      // Update preview based on current mode
      const previewArea = document.getElementById('previewArea');
      if (this.currentPreviewMode === 'background') {
        if (previewArea) {
          previewArea.style.backgroundImage = `url('${this.textureManager.export()}')`;
          previewArea.style.backgroundSize = `${this.textureManager.tileWidth}px ${this.textureManager.tileHeight}px`;
          previewArea.style.backgroundRepeat = 'repeat';
        }
      } else if (this.threePreview) {
        const textureDataURL = this.textureManager.export();
        this.threePreview.updateTexture(textureDataURL);
      }
    } catch (error) {
      console.error('Failed to load texture:', error);
      this.showError('Failed to load texture. Please try a different image.');
    }
  }

  async loadDefaultTexture() {
    try {
      // Use texture-original.jpg as the default texture
      const dataURL = await toDataURL('assets/texture-original.jpg');
      await this.loadTexture(dataURL);

      // Set default tile size to 16
      document.getElementById('setWidthSlider').value = 16;
      document.getElementById('setheightSlider').value = 16;
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
