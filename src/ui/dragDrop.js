/**
 * Drag and drop functionality for file uploads
 * Supports both desktop drag/drop and mobile touch interactions
 */

import { isImageFile, readFileAsDataURL } from '../utils/imageLoader.js';

export class DragDropHandler {
  constructor(dropZone, onFileLoaded) {
    this.dropZone = dropZone;
    this.onFileLoaded = onFileLoaded;
    this.init();
  }

  init() {
    // Desktop drag and drop events
    this.dropZone.addEventListener('dragover', this.handleDragOver.bind(this), false);
    this.dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this), false);
    this.dropZone.addEventListener('drop', this.handleDrop.bind(this), false);

    // Mobile touch support - prevent default behavior that might block file input
    this.dropZone.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    this.dropZone.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
  }

  handleTouchStart() {
    // Visual feedback for touch
    this.dropZone.classList.add('touch-active');
  }

  handleTouchEnd() {
    this.dropZone.classList.remove('touch-active');
  }

  handleDragOver(event) {
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    this.dropZone.classList.add('drag-over');
  }

  handleDragLeave(event) {
    event.stopPropagation();
    event.preventDefault();
    this.dropZone.classList.remove('drag-over');
  }

  async handleDrop(event) {
    event.stopPropagation();
    event.preventDefault();
    this.dropZone.classList.remove('drag-over');

    const files = event.dataTransfer.files;

    if (files.length === 0) {
      console.warn('No files dropped');
      return;
    }

    const file = files[0];

    if (!isImageFile(file)) {
      alert('Please drop an image file (PNG, JPG, GIF, etc.)');
      return;
    }

    try {
      const dataURL = await readFileAsDataURL(file);
      if (this.onFileLoaded) {
        await this.onFileLoaded(dataURL);
      }
    } catch (error) {
      console.error('Error loading file:', error);
      alert('Failed to load image. Please try again.');
    }
  }

  destroy() {
    this.dropZone.removeEventListener('dragover', this.handleDragOver);
    this.dropZone.removeEventListener('dragleave', this.handleDragLeave);
    this.dropZone.removeEventListener('drop', this.handleDrop);
    this.dropZone.removeEventListener('touchstart', this.handleTouchStart);
    this.dropZone.removeEventListener('touchend', this.handleTouchEnd);
  }
}
