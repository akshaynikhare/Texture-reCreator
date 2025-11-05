/**
 * Performance monitoring and optimization utilities
 */

export class PerformanceMonitor {
  constructor() {
    this.marks = new Map();
    this.measures = [];
  }

  /**
   * Start a performance measurement
   * @param {string} name - Name of the measurement
   */
  start(name) {
    this.marks.set(name, performance.now());
  }

  /**
   * End a performance measurement
   * @param {string} name - Name of the measurement
   * @returns {number} - Duration in milliseconds
   */
  end(name) {
    const startTime = this.marks.get(name);
    if (!startTime) {
      console.warn(`No start mark found for: ${name}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.measures.push({ name, duration, timestamp: Date.now() });
    this.marks.delete(name);

    console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  /**
   * Get all measurements
   * @returns {Array} - Array of measurements
   */
  getAll() {
    return this.measures;
  }

  /**
   * Clear all measurements
   */
  clear() {
    this.marks.clear();
    this.measures = [];
  }
}

/**
 * Memory management utilities
 */
export class MemoryManager {
  constructor() {
    this.objectUrls = new Set();
  }

  /**
   * Create and track an object URL
   * @param {Blob} blob - Blob to create URL for
   * @returns {string} - Object URL
   */
  createObjectURL(blob) {
    const url = URL.createObjectURL(blob);
    this.objectUrls.add(url);
    return url;
  }

  /**
   * Revoke a specific object URL
   * @param {string} url - URL to revoke
   */
  revokeObjectURL(url) {
    if (this.objectUrls.has(url)) {
      URL.revokeObjectURL(url);
      this.objectUrls.delete(url);
    }
  }

  /**
   * Revoke all tracked object URLs
   */
  revokeAll() {
    this.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    this.objectUrls.clear();
  }

  /**
   * Get memory info if available
   * @returns {Object|null} - Memory info or null
   */
  getMemoryInfo() {
    if (performance.memory) {
      return {
        usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
        totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
        jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
      };
    }
    return null;
  }
}

/**
 * Request animation frame with fallback
 */
export const requestAnimFrame = (function () {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback, 1000 / 60);
    }
  );
})();

/**
 * Optimized canvas clearing
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 */
export function clearCanvas(ctx, width, height) {
  // Setting width/height is faster than clearRect for large canvases
  if (width * height > 1000000) {
    ctx.canvas.width = ctx.canvas.width;
  } else {
    ctx.clearRect(0, 0, width, height);
  }
}
