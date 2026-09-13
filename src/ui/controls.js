/**
 * UI Controls handler
 * Handles sliders, presets, 3D material properties, lighting, and export actions.
 * Upgraded with Photoshop-style single/dual slider aspect ratio locking and precision numeric inputs.
 */

import { debounce } from '../utils/helpers.js';
import { trackEvent } from '../utils/analytics.js';
import linkIconLinked from '../../assets/link-icon-linked.png?url';
import linkIconUnlinked from '../../assets/link-icon-unlinked.png?url';

export class UIControls {
  constructor(textureManager, app) {
    this.textureManager = textureManager;
    this.app = app;
    this.widthSlider = document.getElementById('setWidthSlider');
    this.heightSlider = document.getElementById('setheightSlider');
    this.linkCheckbox = document.getElementById('cb1');
    this.psLinkToggle = document.getElementById('psLinkToggle');
    this.widthNumberInput = document.getElementById('widthNumberInput');
    this.heightNumberInput = document.getElementById('heightNumberInput');
    this.widthSliderRow = document.getElementById('widthSliderRow');
    this.heightSliderRow = document.getElementById('heightSliderRow');
    this.widthSliderTitle = document.getElementById('widthSliderTitle');
    this.heightSliderTitle = document.getElementById('heightSliderTitle');
    this.dimSectionLabel = document.getElementById('dimSectionLabel');
    this.tabStandard = document.getElementById('tabStandard');
    this.tabMirror = document.getElementById('tabMirror');

    this.patternRadios = document.getElementsByName('type_s');
    this.downloadLink = document.getElementById('dlnk');
    this.previewImage = document.getElementById('cvs1');
    this.isLinked = true; // Default: Proportional scaling locked (1 slider)

    // 3D Material & Lighting controls
    this.roughnessSlider = document.getElementById('roughnessSlider');
    this.bumpSlider = document.getElementById('bumpSlider');
    this.metalnessSlider = document.getElementById('metalnessSlider');
    this.autoRotateToggle = document.getElementById('autoRotateToggle');
    this.resetCameraBtn = document.getElementById('resetCameraBtn');
    this.screenshotBtn = document.getElementById('screenshotBtn');
    this.copyTextureBtn = document.getElementById('copyTextureBtn');

    this.init();
  }

  init() {
    // Slider controls with debouncing for smooth performance
    const debouncedUpdate = debounce(() => this.updateTileSizeAndUrl(), 30);

    // Width / Master Slider
    if (this.widthSlider) {
      this.widthSlider.addEventListener('input', () => {
        if (this.isLinked && this.heightSlider) {
          this.heightSlider.value = this.widthSlider.value;
        }
        this.updateSliderValues();
        debouncedUpdate();
      });
    }

    // Height Slider (Visible when unlinked)
    if (this.heightSlider) {
      this.heightSlider.addEventListener('input', () => {
        if (this.isLinked && this.widthSlider) {
          this.widthSlider.value = this.heightSlider.value;
        }
        this.updateSliderValues();
        debouncedUpdate();
      });
    }

    // Photoshop Precision Numeric Inputs (Two-way bound with sliders)
    if (this.widthNumberInput) {
      const handleWidthInput = () => {
        let val = parseInt(this.widthNumberInput.value, 10);
        if (Number.isNaN(val)) return;
        val = Math.max(1, Math.min(24, val));
        if (this.widthSlider) this.widthSlider.value = val;
        if (this.isLinked && this.heightSlider) {
          this.heightSlider.value = val;
        }
        this.updateSliderValues();
        debouncedUpdate();
      };
      this.widthNumberInput.addEventListener('input', handleWidthInput);
      this.widthNumberInput.addEventListener('change', handleWidthInput);
    }

    if (this.heightNumberInput) {
      const handleHeightInput = () => {
        let val = parseInt(this.heightNumberInput.value, 10);
        if (Number.isNaN(val)) return;
        val = Math.max(1, Math.min(24, val));
        if (this.heightSlider) this.heightSlider.value = val;
        if (this.isLinked && this.widthSlider) {
          this.widthSlider.value = val;
        }
        this.updateSliderValues();
        debouncedUpdate();
      };
      this.heightNumberInput.addEventListener('input', handleHeightInput);
      this.heightNumberInput.addEventListener('change', handleHeightInput);
    }

    // Photoshop Chain Link Button (Toggle 1 slider vs 2 sliders)
    if (this.psLinkToggle) {
      this.psLinkToggle.addEventListener('click', () => {
        this.setLinked(!this.isLinked);
      });
    }

    // Legacy checkbox listener (e.g. from URL state sync)
    if (this.linkCheckbox) {
      this.linkCheckbox.addEventListener('change', () => {
        if (this.isLinked !== this.linkCheckbox.checked) {
          this.setLinked(this.linkCheckbox.checked);
        }
      });
    }

    // Quick multiplier buttons (e.g. 2x, 4x, 8x, 16x, 24x)
    const quickMultiplierBtns = document.querySelectorAll('.tile-quick-btn');
    quickMultiplierBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.size;
        if (val && this.widthSlider && this.heightSlider) {
          this.widthSlider.value = val;
          this.heightSlider.value = val;
          this.updateSliderValues();
          this.updateTileSizeAndUrl();
        }
      });
    });

    // Pattern type radio buttons (Photoshop Segmented Tabs: Standard vs Mirror)
    this.patternRadios.forEach((radio) => {
      radio.addEventListener('change', async () => {
        const useMirroring = radio.value === 'true';
        if (this.tabStandard && this.tabMirror) {
          this.tabStandard.classList.toggle('active', !useMirroring);
          this.tabMirror.classList.toggle('active', useMirroring);
        }
        await this.textureManager.setTilingPattern(useMirroring);
        this.updatePreviewImage();
        this.updateThreePreview();

        if (this.app && typeof this.app.updateUrlFromState === 'function') {
          this.app.updateUrlFromState();
        }
      });
    });

    // 3D Material Sliders (Roughness, Bump, Metalness with progress fill)
    if (this.roughnessSlider) {
      const roughnessVal = document.getElementById('roughness-value');
      this.roughnessSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (roughnessVal) roughnessVal.textContent = Math.round(val * 100) + '%';
        this.updateSliderFill(this.roughnessSlider);
        if (this.app && this.app.threePreview) {
          this.app.threePreview.setMaterialProperty('roughness', val);
        }
      });
      this.updateSliderFill(this.roughnessSlider);
    }

    if (this.bumpSlider) {
      const bumpVal = document.getElementById('bump-value');
      this.bumpSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (bumpVal) bumpVal.textContent = Math.round(val * 1000);
        this.updateSliderFill(this.bumpSlider);
        if (this.app && this.app.threePreview) {
          this.app.threePreview.setMaterialProperty('bumpScale', val);
        }
      });
      this.updateSliderFill(this.bumpSlider);
    }

    if (this.metalnessSlider) {
      const metalVal = document.getElementById('metalness-value');
      this.metalnessSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (metalVal) metalVal.textContent = Math.round(val * 100) + '%';
        this.updateSliderFill(this.metalnessSlider);
        if (this.app && this.app.threePreview) {
          this.app.threePreview.setMaterialProperty('metalness', val);
        }
      });
      this.updateSliderFill(this.metalnessSlider);
    }

    // Auto-Rotate Turntable Toggle
    if (this.autoRotateToggle) {
      this.autoRotateToggle.addEventListener('change', (e) => {
        if (this.app && this.app.threePreview) {
          this.app.threePreview.toggleAutoRotate(e.target.checked);
          trackEvent('toggle_autorotate', { enabled: e.target.checked });
        }
      });
    }

    // Lighting Preset Buttons in Preview Viewport
    const lightingBtns = document.querySelectorAll('.lighting-preset-btn');
    lightingBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = btn.dataset.lighting;
        if (preset && this.app && this.app.threePreview) {
          this.app.threePreview.setLightingPreset(preset);
          lightingBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          trackEvent('select_lighting', { preset });
        }
      });
    });

    // Reset Camera Button
    if (this.resetCameraBtn) {
      this.resetCameraBtn.addEventListener('click', () => {
        if (this.app && this.app.threePreview) {
          this.app.threePreview.resetCamera();
          trackEvent('reset_camera');
          if (this.app.showToast) this.app.showToast('Camera reset to center');
        }
      });
    }

    // 3D Screenshot Button
    if (this.screenshotBtn) {
      this.screenshotBtn.addEventListener('click', () => {
        if (this.app && this.app.threePreview) {
          const dataUrl = this.app.threePreview.captureScreenshot();
          const a = document.createElement('a');
          a.download = `3d-render-${this.app.threePreview.currentMode}-${Date.now()}.png`;
          a.href = dataUrl;
          a.click();
          trackEvent('capture_3d_screenshot', { mode: this.app.threePreview.currentMode });
          if (this.app.showToast) this.app.showToast('3D Render screenshot captured!');
        }
      });
    }

    // Copy Texture to Clipboard
    if (this.copyTextureBtn) {
      this.copyTextureBtn.addEventListener('click', async () => {
        try {
          const dataURL = this.textureManager.export();
          const res = await fetch(dataURL);
          const blob = await res.blob();
          if (navigator.clipboard && navigator.clipboard.write) {
            await navigator.clipboard.write([
              new ClipboardItem({ [blob.type]: blob }),
            ]);
            trackEvent('copy_texture');
            if (this.app.showToast) this.app.showToast('Tiled texture copied to clipboard!');
          } else {
            if (this.app.showToast) this.app.showToast('Clipboard copy not supported in this browser.');
          }
        } catch (e) {
          console.warn('Copy failed:', e);
          if (this.app.showToast) this.app.showToast('Could not copy texture.');
        }
      });
    }

    // Download functionality
    if (this.downloadLink) {
      this.downloadLink.addEventListener('click', () => {
        const dataURL = this.textureManager.export();
        this.downloadLink.href = dataURL;
        this.downloadLink.download = `seamless-texture-${Date.now()}.jpg`;
        trackEvent('download_texture');
        if (this.app && this.app.showToast) {
          this.app.showToast('Downloading seamless texture...');
        }
      });
    }

    // Sync initial state
    if (this.linkCheckbox) {
      this.isLinked = this.linkCheckbox.checked;
    }
    if (this.isLinked && this.widthSlider && this.heightSlider) {
      this.heightSlider.value = this.widthSlider.value;
    }
    this.updateLinkUI();
    this.updateSliderValues();
    this.updateTileSize();
  }

  /**
   * Toggles between Linked (1 single master slider) and Unlinked (2 independent sliders)
   */
  setLinked(isLinked) {
    this.isLinked = isLinked;
    if (this.linkCheckbox) {
      this.linkCheckbox.checked = isLinked;
    }
    this.updateLinkUI();

    if (this.isLinked && this.heightSlider && this.widthSlider) {
      // Sync height to width on relink
      this.heightSlider.value = this.widthSlider.value;
      this.updateSliderValues();
      this.updateTileSizeAndUrl();
    } else {
      if (this.app && typeof this.app.updateUrlFromState === 'function') {
        this.app.updateUrlFromState();
      }
    }
  }

  updateLinkUI() {
    // Update Photoshop chain link button
    if (this.psLinkToggle) {
      this.psLinkToggle.classList.toggle('active', this.isLinked);
      this.psLinkToggle.title = this.isLinked
        ? 'Maintain Aspect Ratio (Linked - 1 Slider)'
        : 'Aspect Ratio Unlocked (Unlinked - 2 Sliders)';

      const linkedIcon = this.psLinkToggle.querySelector('.chain-linked');
      const unlinkedIcon = this.psLinkToggle.querySelector('.chain-unlinked');
      if (linkedIcon && unlinkedIcon) {
        linkedIcon.style.display = this.isLinked ? 'inline-block' : 'none';
        unlinkedIcon.style.display = this.isLinked ? 'none' : 'inline-block';
      }
    }

    const linkLabel = document.getElementById('linkLabel');
    if (linkLabel) {
      linkLabel.textContent = this.isLinked ? 'Linked' : 'Unlinked';
    }

    // Toggle 1 slider vs 2 sliders
    if (this.heightSliderRow) {
      this.heightSliderRow.style.display = this.isLinked ? 'none' : 'flex';
    }

    if (this.widthSliderTitle) {
      this.widthSliderTitle.textContent = this.isLinked ? 'Repetition (W & H)' : 'Width Repetition (W)';
    }

    if (this.dimSectionLabel) {
      this.dimSectionLabel.textContent = this.isLinked ? 'Tiling Scale (1:1)' : 'Tiling Dimensions (W × H)';
    }

    // Legacy image icon fallback
    const linkIcon = document.getElementById('linkIcon');
    if (linkIcon) {
      linkIcon.src = this.isLinked ? linkIconLinked : linkIconUnlinked;
    }
  }

  updateSliderValues() {
    const wVal = this.widthSlider ? this.widthSlider.value : '16';
    const hVal = this.heightSlider ? this.heightSlider.value : '16';

    const widthValueEl = document.getElementById('width-value');
    const heightValueEl = document.getElementById('height-value');
    if (widthValueEl) widthValueEl.textContent = wVal;
    if (heightValueEl) heightValueEl.textContent = hVal;

    if (this.widthNumberInput && document.activeElement !== this.widthNumberInput) {
      this.widthNumberInput.value = wVal;
    }
    if (this.heightNumberInput && document.activeElement !== this.heightNumberInput) {
      this.heightNumberInput.value = hVal;
    }

    if (this.widthSlider) this.updateSliderFill(this.widthSlider);
    if (this.heightSlider) this.updateSliderFill(this.heightSlider);

    this.updateQuickMultiplierActiveState();
  }

  updateSliderFill(slider) {
    if (!slider) return;
    const min = parseFloat(slider.min) || 0;
    const max = parseFloat(slider.max) || 100;
    const val = parseFloat(slider.value) || 0;
    const percent = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
    slider.style.setProperty('--fill-percent', `${percent}%`);
  }

  updateQuickMultiplierActiveState() {
    const quickMultiplierBtns = document.querySelectorAll('.tile-quick-btn');
    const curW = this.widthSlider ? this.widthSlider.value : '16';
    const curH = this.heightSlider ? this.heightSlider.value : '16';

    quickMultiplierBtns.forEach((btn) => {
      const size = btn.dataset.size;
      if (this.isLinked) {
        btn.classList.toggle('active', size === curW);
      } else {
        btn.classList.toggle('active', size === curW && size === curH);
      }
    });
  }

  updateTileSizeAndUrl() {
    this.updateTileSize();
    if (this.app && typeof this.app.updateUrlFromState === 'function') {
      this.app.updateUrlFromState();
    }
  }

  updateTileSize() {
    if (!this.widthSlider || !this.heightSlider) return;
    const widthSteps = parseInt(this.widthSlider.value, 10);
    const heightSteps = parseInt(this.heightSlider.value, 10);
    const width = widthSteps * 50;
    const height = heightSteps * 50;
    this.textureManager.setTileSize(width, height);

    this.updatePreviewImage();
    this.updateThreePreview({ widthSteps, heightSteps });
  }

  updatePreviewImage() {
    if (!this.previewImage) return;
    const dataURL = this.textureManager.export();
    this.previewImage.src = dataURL;

    // Update download resolution badge
    const resBadge = document.getElementById('exportResolutionBadge');
    if (resBadge && this.textureManager.renderer && this.textureManager.renderer.currentImage) {
      const img = this.textureManager.renderer.currentImage;
      const factor = this.textureManager.renderer.useMirroring ? 2 : 1;
      const outW = img.width * factor;
      const outH = img.height * factor;
      resBadge.textContent = `${outW} × ${outH} px`;
    }
  }

  updateThreePreview(tileSteps) {
    if (this.app && this.app.threePreview && this.app.currentPreviewMode !== 'background') {
      const dataURL = this.textureManager.export();
      this.app.threePreview.updateTexture(dataURL, tileSteps);
    }
  }
}
