/**
 * Helper utilities
 */

/**
 * Debounce function to limit execution rate
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait = 100) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit execution frequency
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between executions in ms
 * @returns {Function} - Throttled function
 */
export function throttle(func, limit = 100) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Clamps a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Clamped value
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Get the base path for the application
 * This accounts for both local development and GitHub Pages deployment
 * @returns {string} - Base path with trailing slash
 */
export function getBasePath() {
  // In production (GitHub Pages), use the repository name as base
  // In development, use root
  if (import.meta.env.MODE === 'production') {
    return '/Texture-reCreator/';
  }
  return '/';
}

/**
 * Get a full asset path relative to the base path
 * @param {string} assetPath - Relative path to the asset (e.g., 'assets/env/studio.hdr')
 * @returns {string} - Full path with base
 */
export function getAssetPath(assetPath) {
  const base = getBasePath();
  // Remove leading slash from assetPath if present
  const normalizedPath = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
  return `${base}${normalizedPath}`;
}

/**
 * Parse current URL search params into a plain object.
 */
export function getUrlState() {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const state = {};
  for (const [key, value] of params.entries()) {
    state[key] = value;
  }
  return state;
}

/**
 * Update the browser URL with the provided state object (using pushState or replaceState).
 * Only string/number/boolean values are serialized.
 * @param {Object} state
 * @param {Object} [options]
 * @param {boolean} [options.replace] - If true, uses replaceState instead of pushState.
 */
export function setUrlState(state = {}, { replace = true } = {}) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);

  Object.entries(state).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  });

  url.search = params.toString();

  if (replace && window.history && window.history.replaceState) {
    window.history.replaceState(null, '', url.toString());
  } else if (window.history && window.history.pushState) {
    window.history.pushState(null, '', url.toString());
  } else {
    // Fallback for very old browsers
    window.location.search = url.search;
  }
}
