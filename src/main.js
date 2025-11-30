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
import { getUrlState, setUrlState } from './utils/helpers.js';

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
      // Read initial state from URL (if any)
      const urlState = getUrlState();

      // Initialize theme manager
      this.themeManager = new ThemeManager();

      // Initialize texture manager
      this.textureManager = new TextureManager(this.canvas, this.previewImage);

      // Initialize 3D preview mode tracking
      this.currentPreviewMode = 'background';
      this.threePreview = null;

      // Apply URL state to controls and preview mode before loading texture
      this.applyInitialUrlState(urlState);

      // Initialize UI controls (pass app reference for 3D preview updates)
      this.controls = new UIControls(this.textureManager, this);

      // Initialize drag and drop
      this.dragDropHandler = new DragDropHandler(document.body, async (dataURL) => {
        await this.loadTexture(dataURL);
      });

      // Initialize file input button
      this.initFileInput();

      // Initialize 3D/Background preview toggle buttons
      this.initPreviewModes();

      // Load default texture (or URL-specified one in future)
      await this.loadDefaultTexture();

      // Ensure the preview mode is applied once after texture load
      this.setPreviewMode(this.currentPreviewMode || 'background');

      // After initial setup, sync current state back into URL so user can share it
      this.updateUrlFromState();

      console.log('✅ Texture reCreator initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.showError('Failed to initialize application. Please refresh the page.');
    }
  }

  applyInitialUrlState(urlState) {
    // Tile size from URL (?w=16&h=16)
    const widthSlider = document.getElementById('setWidthSlider');
    const heightSlider = document.getElementById('setheightSlider');
    const linkCheckbox = document.getElementById('cb1');
    const patternRadios = document.getElementsByName('type_s');

    if (!widthSlider || !heightSlider || !linkCheckbox || !patternRadios) return;

    const w = parseInt(urlState.w, 10);
    const h = parseInt(urlState.h, 10);
    const link = urlState.link;
    const pattern = urlState.pattern; // 'standard' | 'mirror'
    const mode = urlState.mode; // 'background' | 'sphere' | 'cloth' | 'cube'

    if (!Number.isNaN(w)) {
      widthSlider.value = Math.min(Math.max(w, parseInt(widthSlider.min, 10)), parseInt(widthSlider.max, 10));
    }
    if (!Number.isNaN(h)) {
      heightSlider.value = Math.min(Math.max(h, parseInt(heightSlider.min, 10)), parseInt(heightSlider.max, 10));
    }

    if (link === '0' || link === 'false') {
      linkCheckbox.checked = false;
    } else if (link === '1' || link === 'true') {
      linkCheckbox.checked = true;
    }

    // Pattern (fallback to existing defaults if param missing)
    if (pattern === 'mirror' || pattern === 'standard') {
      patternRadios.forEach((radio) => {
        if (pattern === 'mirror') {
          radio.checked = radio.value === 'true';
        } else {
          radio.checked = radio.value === 'false';
        }
      });
    }

    // Preview mode
    if (mode === 'background' || mode === 'sphere' || mode === 'cloth' || mode === 'cube') {
      this.currentPreviewMode = mode;
      const modeButtons = document.querySelectorAll('.mode-option');
      modeButtons.forEach((btn) => {
        if (btn.dataset.mode === mode) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
  }

  updateUrlFromState() {
    const widthSlider = document.getElementById('setWidthSlider');
    const heightSlider = document.getElementById('setheightSlider');
    const linkCheckbox = document.getElementById('cb1');
    const patternRadios = document.getElementsByName('type_s');

    if (!widthSlider || !heightSlider || !linkCheckbox || !patternRadios) return;

    const w = parseInt(widthSlider.value, 10);
    const h = parseInt(heightSlider.value, 10);
    const link = linkCheckbox.checked ? '1' : '0';

    let pattern = 'standard';
    patternRadios.forEach((radio) => {
      if (radio.checked) {
        pattern = radio.value === 'true' ? 'mirror' : 'standard';
      }
    });

    const mode = this.currentPreviewMode || 'background';

    setUrlState({ w, h, link, pattern, mode }, { replace: true });
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

        // Persist updated mode in URL
        this.updateUrlFromState();
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

      // Persist any texture-driven changes (tile size, pattern, etc.)
      this.updateUrlFromState();
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

      // Set default tile size to 16 only if URL didn't override it
      const urlState = getUrlState();
      const hasWidth = urlState.w !== undefined;
      const hasHeight = urlState.h !== undefined;

      if (!hasWidth || !hasHeight) {
        const widthSlider = document.getElementById('setWidthSlider');
        const heightSlider = document.getElementById('setheightSlider');
        if (widthSlider && heightSlider) {
          widthSlider.value = 16;
          heightSlider.value = 16;
        }
        this.controls.updateSliderValues();
        this.controls.updateTileSize();
      } else {
        // If URL provided dimensions, ensure texture manager uses them
        this.controls.updateTileSize();
      }

      // Sync final defaults/URL-based state back into URL
      this.updateUrlFromState();
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
