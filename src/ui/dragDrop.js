/**
 * Drag and drop functionality for file uploads
 */

import { isImageFile, readFileAsDataURL } from '../utils/imageLoader.js';

export class DragDropHandler {
  constructor(dropZone, onFileLoaded) {
    this.dropZone = dropZone;
    this.onFileLoaded = onFileLoaded;
    this.init();
  }

  init() {
    this.dropZone.addEventListener('dragover', this.handleDragOver.bind(this), false);
    this.dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this), false);
    this.dropZone.addEventListener('drop', this.handleDrop.bind(this), false);
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
  }
}
