/**
 * Texture reCreator - Main Application Entry Point
 * Modern Studio Edition with Three.js Soft Shadows, PBR Bump Mapping,
 * Preset Gallery, and Refined Glassmorphism UI.
 */

import { TextureManager } from './core/textureManager.js';
import { DragDropHandler } from './ui/dragDrop.js';
import { UIControls } from './ui/controls.js';
import { ThemeManager } from './ui/themeManager.js';
import { ThreePreview } from './ui/threePreview.js';
import { toDataURL } from './utils/imageLoader.js';
import { getUrlState, setUrlState } from './utils/helpers.js';
import { trackEvent } from './utils/analytics.js';

// Preset textures
import defaultTextureUrl from '../assets/texture-original.jpg?url';
import sample1Url from '../assets/sample-texture-1.jpg?url';
import sample2Url from '../assets/sample-texture-2.jpg?url';
import sample3Url from '../assets/sample-texture-3.png?url';

class TextureReCreatorApp {
  constructor() {
    this.canvas = document.getElementById('cvs');
    this.previewImage = document.getElementById('cvs1');

    if (!this.canvas || !this.previewImage) {
      console.error('Required elements not found in DOM');
      return;
    }

    this.presetMap = {
      default: defaultTextureUrl,
      mosaic: sample1Url,
      marble: sample2Url,
      geometric: sample3Url,
    };

    this.init();
  }

  async init() {
    try {
      const urlState = getUrlState();

      this.themeManager = new ThemeManager();
      this.textureManager = new TextureManager(this.canvas, this.previewImage);

      this.currentPreviewMode = 'sphere'; // Default to 3D Sphere to immediately showcase shadows!
      this.threePreview = null;

      this.applyInitialUrlState(urlState);

      this.controls = new UIControls(this.textureManager, this);

      this.dragDropHandler = new DragDropHandler(document.body, async (dataURL) => {
        await this.loadTexture(dataURL);
        this.showToast('Custom texture loaded');
      });

      this.initFileInput();
      this.initPresetGallery();
      this.initPreviewModes();
      this.initFullscreenToggle();
      this.initGuideModal();

      // Load default initial texture
      await this.loadDefaultTexture();

      // Apply initial preview mode
      this.setPreviewMode(this.currentPreviewMode || 'sphere');

      this.updateUrlFromState();

      console.log('✅ Texture reCreator Studio initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.showToast('Failed to initialize: ' + error.message, 'error');
    }
  }

  applyInitialUrlState(urlState) {
    const widthSlider = document.getElementById('setWidthSlider');
    const heightSlider = document.getElementById('setheightSlider');
    const linkCheckbox = document.getElementById('cb1');
    const patternRadios = document.getElementsByName('type_s');

    if (!widthSlider || !heightSlider || !linkCheckbox || !patternRadios) return;

    const w = parseInt(urlState.w, 10);
    const h = parseInt(urlState.h, 10);
    const link = urlState.link;
    const pattern = urlState.pattern;
    const mode = urlState.mode;

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

    if (pattern === 'mirror' || pattern === 'standard') {
      patternRadios.forEach((radio) => {
        radio.checked = pattern === 'mirror' ? radio.value === 'true' : radio.value === 'false';
      });
    }

    const validModes = ['background', 'sphere', 'cube', 'cylinder', 'cloth', 'wall'];
    if (validModes.includes(mode)) {
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

    const mode = this.currentPreviewMode || 'sphere';
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
            this.showToast(`Loaded ${file.name}`);
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }

  initPresetGallery() {
    const presetBtns = document.querySelectorAll('[data-preset-key]');
    presetBtns.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const key = btn.dataset.presetKey;
        const targetUrl = this.presetMap[key];
        if (targetUrl) {
          presetBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');

          const dataURL = await toDataURL(targetUrl);
          await this.loadTexture(dataURL);
          trackEvent('select_preset', { preset: key });
          this.showToast(`Preset loaded: ${btn.textContent.trim()}`);
        }
      });
    });
  }

  initPreviewModes() {
    const modeButtons = document.querySelectorAll('.mode-option');

    modeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        this.setPreviewMode(mode);
        trackEvent('select_preview_mode', { mode });

        modeButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        this.updateUrlFromState();
      });
    });
  }

  initFullscreenToggle() {
    const fsBtn = document.getElementById('fullscreenBtn');
    const previewArea = document.getElementById('previewArea');

    if (fsBtn && previewArea) {
      fsBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          previewArea.requestFullscreen?.().catch(() => {});
          fsBtn.classList.add('active');
          trackEvent('toggle_fullscreen', { enabled: true });
        } else {
          document.exitFullscreen?.().catch(() => {});
          fsBtn.classList.remove('active');
          trackEvent('toggle_fullscreen', { enabled: false });
        }
      });

      document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
          fsBtn.classList.remove('active');
        }
      });
    }
  }

  initGuideModal() {
    const guideModal = document.getElementById('guideModal');
    const openBtn = document.getElementById('openGuideBtn');
    const closeBtn = document.getElementById('closeGuideBtn');
    const closeBottomBtn = document.getElementById('closeGuideBottomBtn');

    if (!guideModal) return;

    const openModal = () => {
      if (typeof guideModal.showModal === 'function') {
        guideModal.showModal();
      } else {
        guideModal.setAttribute('open', 'true');
      }
      trackEvent('open_guide_modal');
    };

    const closeModal = () => {
      if (typeof guideModal.close === 'function') {
        guideModal.close();
      } else {
        guideModal.removeAttribute('open');
      }
    };

    openBtn?.addEventListener('click', openModal);
    closeBtn?.addEventListener('click', closeModal);
    closeBottomBtn?.addEventListener('click', closeModal);

    // Close when clicking directly on the backdrop
    guideModal.addEventListener('click', (e) => {
      if (e.target === guideModal) {
        closeModal();
      }
    });
  }

  setPreviewMode(mode) {
    this.currentPreviewMode = mode;
    const previewInfo = document.getElementById('previewInfo');
    const previewArea = document.getElementById('previewArea');
    const threeContainer = document.getElementById('threejs-preview');
    const studioControls = document.getElementById('studio3DControls');
    const cameraHint = document.getElementById('cameraHint');

    // Update active state across all mode buttons (both sidebar and viewport top bar)
    document.querySelectorAll('.mode-option').forEach((btn) => {
      if (btn.dataset.mode === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Ensure previewArea and body never have inline background images
    if (previewArea) {
      previewArea.style.backgroundImage = '';
      previewArea.style.backgroundSize = '';
      previewArea.style.backgroundRepeat = '';
    }
    document.body.style.backgroundImage = '';

    if (threeContainer) threeContainer.style.display = 'block';

    if (!this.threePreview) {
      this.threePreview = new ThreePreview('threejs-preview');
    }

    this.threePreview.setMode(mode);

    if (this.textureManager.renderer && this.textureManager.renderer.currentImage) {
      const dataURL = this.textureManager.export();
      this.threePreview.updateTexture(dataURL);
    }

    if (studioControls) studioControls.classList.remove('collapsed');
    if (cameraHint) cameraHint.style.display = 'flex';

    if (previewInfo) {
      const labels = {
        background: '2D Seamless Wall • Flat surface inspection in grayish white studio',
        sphere: '3D Studio Sphere • Soft contact shadows and specular highlights',
        cube: '3D Studio Cube • Multi-face seam alignment with directional shadow',
        cylinder: '3D Studio Column • Seamless cylindrical wrap with ground shadow',
        cloth: '3D Studio Drape • Physical wave folds for textile inspection',
        wall: '3D Studio Interior • Architectural corner with floor & contact shadows',
      };
      previewInfo.textContent = labels[mode] || '3D Studio Mode';
    }
  }

  async loadTexture(dataURL) {
    try {
      await this.textureManager.loadImage(dataURL);
      trackEvent('load_texture');
      this.controls.updatePreviewImage();
      this.controls.updateSliderValues();

      if (this.threePreview) {
        const textureDataURL = this.textureManager.export();
        this.threePreview.updateTexture(textureDataURL);
      }

      this.updateUrlFromState();
    } catch (error) {
      console.error('Failed to load texture:', error);
      this.showToast('Failed to load texture image.', 'error');
    }
  }

  async loadDefaultTexture() {
    try {
      const dataURL = await toDataURL(defaultTextureUrl);
      await this.loadTexture(dataURL);

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
        this.controls.updateTileSize();
      }

      this.updateUrlFromState();
    } catch (error) {
      console.warn('Could not load default texture:', error);
    }
  }

  showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'toast-error' : 'toast-info'}`;
    toast.innerHTML = `
      <span class="toast-dot"></span>
      <span class="toast-msg">${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
}

// Bootstrap on DOM Ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.app = new TextureReCreatorApp();
  });
} else {
  window.app = new TextureReCreatorApp();
}
