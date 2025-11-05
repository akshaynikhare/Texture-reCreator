/**
 * Web Worker for heavy image processing tasks
 * Offloads canvas operations to prevent UI blocking
 */

self.addEventListener('message', function (e) {
  const { type, data } = e.data;

  switch (type) {
    case 'process-image':
      processImage(data);
      break;
    case 'generate-tiles':
      generateTiles(data);
      break;
    default:
      console.warn('Unknown worker task:', type);
  }
});

/**
 * Process image data
 */
function processImage(data) {
  try {
    const { imageData, width, height } = data;

    // Perform any heavy image processing here
    // For now, just echo back the data
    self.postMessage({
      type: 'process-complete',
      data: {
        imageData,
        width,
        height,
      },
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error.message,
    });
  }
}

/**
 * Generate texture tiles
 */
function generateTiles(data) {
  try {
    const { width, height, tileCount } = data;

    // Calculate tile dimensions
    const tiles = [];
    for (let i = 0; i < tileCount; i++) {
      tiles.push({
        x: (i % Math.sqrt(tileCount)) * width,
        y: Math.floor(i / Math.sqrt(tileCount)) * height,
        width,
        height,
      });
    }

    self.postMessage({
      type: 'tiles-generated',
      data: { tiles },
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error.message,
    });
  }
}
