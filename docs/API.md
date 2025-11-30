# API Documentation

Complete API reference for Texture reCreator modules.

## Table of Contents

- [Core API](#core-api)
  - [CanvasRenderer](#canvasrenderer)
  - [TextureManager](#texturemanager)
- [UI API](#ui-api)
  - [DragDropHandler](#dragdrophandler)
  - [UIControls](#uicontrols)
  - [ThemeManager](#thememanager)
- [Utils API](#utils-api)
  - [Image Loader](#image-loader)
  - [Helpers](#helpers)
  - [Performance](#performance)

---

## Core API

### CanvasRenderer

Handles low-level canvas drawing operations.

#### Constructor

```javascript
new CanvasRenderer(canvas: HTMLCanvasElement)
```

**Parameters:**
- `canvas` - HTML Canvas element to render on

**Example:**
```javascript
const canvas = document.getElementById('cvs');
const renderer = new CanvasRenderer(canvas);
```

#### Methods

##### `mirrorImage()`

Draws an image with optional mirroring.

```javascript
mirrorImage(
  image: HTMLImageElement,
  x: number = 0,
  y: number = 0,
  width: number = 100,
  height: number = 100,
  horizontal: boolean = false,
  vertical: boolean = false
): void
```

**Parameters:**
- `image` - Image to draw
- `x` - X position
- `y` - Y position
- `width` - Width to draw
- `height` - Height to draw
- `horizontal` - Flip horizontally
- `vertical` - Flip vertically

**Example:**
```javascript
renderer.mirrorImage(img, 0, 0, 256, 256, true, false);
```

##### `generateTexture()`

Generates a tiled texture pattern.

```javascript
generateTexture(
  image: HTMLImageElement,
  useMirroring: boolean = false
): void
```

**Parameters:**
- `image` - Source image
- `useMirroring` - Use mirror tiling pattern

**Example:**
```javascript
renderer.generateTexture(image, true);
```

##### `exportAsDataURL()`

Exports the canvas as a data URL.

```javascript
exportAsDataURL(
  format: string = 'image/jpeg',
  quality: number = 0.92
): string
```

**Parameters:**
- `format` - Image format (default: 'image/jpeg')
- `quality` - Image quality 0-1 (default: 0.92)

**Returns:** Data URL string

**Example:**
```javascript
const dataURL = renderer.exportAsDataURL('image/png', 1.0);
```

##### `clear()`

Clears the canvas.

```javascript
clear(): void
```

---

### TextureManager

High-level texture management and preview system.

#### Constructor

```javascript
new TextureManager(
  canvas: HTMLCanvasElement,
  previewElement: HTMLImageElement
)
```

**Parameters:**
- `canvas` - Canvas element for rendering
- `previewElement` - Image element for preview

#### Methods

##### `loadImage()`

Loads an image and generates texture.

```javascript
async loadImage(imageDataURL: string): Promise<void>
```

**Parameters:**
- `imageDataURL` - Image data URL

**Example:**
```javascript
await textureManager.loadImage(dataURL);
```

##### `updatePreview()`

Updates the background preview with current texture.

```javascript
updatePreview(): void
```

##### `setTilingPattern()`

Sets the tiling pattern type.

```javascript
async setTilingPattern(useMirroring: boolean): Promise<void>
```

**Parameters:**
- `useMirroring` - Whether to use mirror tiling

##### `setTileSize()`

Updates tile size for preview.

```javascript
setTileSize(width: number, height: number): void
```

**Parameters:**
- `width` - Tile width in pixels
- `height` - Tile height in pixels

##### `export()`

Exports the current texture.

```javascript
export(
  format: string = 'image/jpeg',
  quality: number = 0.92
): string
```

**Returns:** Data URL string

---

## UI API

### DragDropHandler

Handles drag-and-drop file uploads.

#### Constructor

```javascript
new DragDropHandler(
  dropZone: HTMLElement,
  onFileLoaded: Function
)
```

**Parameters:**
- `dropZone` - Element to enable drop on
- `onFileLoaded` - Callback when file is loaded

**Example:**
```javascript
const handler = new DragDropHandler(document.body, async (dataURL) => {
  await textureManager.loadImage(dataURL);
});
```

#### Methods

##### `destroy()`

Removes event listeners.

```javascript
destroy(): void
```

---

### UIControls

Manages UI controls (sliders, buttons, etc.).

#### Constructor

```javascript
new UIControls(textureManager: TextureManager)
```

**Parameters:**
- `textureManager` - TextureManager instance

#### Methods

##### `updateTileSize()`

Updates tile size based on slider values.

```javascript
updateTileSize(): void
```

##### `updatePreviewImage()`

Updates the preview image.

```javascript
updatePreviewImage(): void
```

---

### ThemeManager

Manages dark/light theme switching.

#### Constructor

```javascript
new ThemeManager()
```

Automatically detects and applies user's preferred theme.

#### Methods

##### `toggleTheme()`

Toggles between light and dark themes.

```javascript
toggleTheme(): void
```

##### `applyTheme()`

Applies a specific theme.

```javascript
applyTheme(theme: 'light' | 'dark'): void
```

**Parameters:**
- `theme` - Theme to apply ('light' or 'dark')

---

## Utils API

### Image Loader

Image loading utilities.

#### Functions

##### `toDataURL()`

Converts an image URL to data URL.

```javascript
async toDataURL(src: string): Promise<string>
```

**Parameters:**
- `src` - Image source URL

**Returns:** Promise resolving to data URL

**Example:**
```javascript
const dataURL = await toDataURL('assets/texture-original.jpg');
```

##### `isImageFile()`

Validates if a file is an image.

```javascript
isImageFile(file: File): boolean
```

**Parameters:**
- `file` - File to validate

**Returns:** True if file is an image

##### `readFileAsDataURL()`

Reads a file as data URL.

```javascript
async readFileAsDataURL(file: File): Promise<string>
```

**Parameters:**
- `file` - File to read

**Returns:** Promise resolving to data URL

---

### Helpers

General utility functions.

#### Functions

##### `debounce()`

Creates a debounced function.

```javascript
debounce(
  func: Function,
  wait: number = 100
): Function
```

**Parameters:**
- `func` - Function to debounce
- `wait` - Milliseconds to wait (default: 100)

**Returns:** Debounced function

**Example:**
```javascript
const debouncedUpdate = debounce(() => update(), 200);
```

##### `throttle()`

Creates a throttled function.

```javascript
throttle(
  func: Function,
  limit: number = 100
): Function
```

**Parameters:**
- `func` - Function to throttle
- `limit` - Minimum time between executions (default: 100)

**Returns:** Throttled function

##### `clamp()`

Clamps a value between min and max.

```javascript
clamp(
  value: number,
  min: number,
  max: number
): number
```

**Parameters:**
- `value` - Value to clamp
- `min` - Minimum value
- `max` - Maximum value

**Returns:** Clamped value

---

### Performance

Performance monitoring utilities.

#### PerformanceMonitor

##### Constructor

```javascript
new PerformanceMonitor()
```

##### Methods

###### `start()`

Start a performance measurement.

```javascript
start(name: string): void
```

###### `end()`

End a performance measurement.

```javascript
end(name: string): number
```

**Returns:** Duration in milliseconds

**Example:**
```javascript
const monitor = new PerformanceMonitor();
monitor.start('render');
// ... perform operation ...
const duration = monitor.end('render');
console.log(`Render took ${duration}ms`);
```

#### MemoryManager

##### Constructor

```javascript
new MemoryManager()
```

##### Methods

###### `createObjectURL()`

Create and track an object URL.

```javascript
createObjectURL(blob: Blob): string
```

###### `revokeObjectURL()`

Revoke a specific object URL.

```javascript
revokeObjectURL(url: string): void
```

###### `revokeAll()`

Revoke all tracked object URLs.

```javascript
revokeAll(): void
```

###### `getMemoryInfo()`

Get memory info if available.

```javascript
getMemoryInfo(): Object | null
```

**Returns:** Memory info object or null

---

## Events

### Custom Events

The application doesn't currently emit custom events, but uses standard DOM events:

- `input` - Slider changes
- `change` - Checkbox/radio changes
- `click` - Button clicks
- `dragover` - Drag over events
- `drop` - File drop events

## Error Handling

All async functions use try-catch blocks and reject with Error objects:

```javascript
try {
  await textureManager.loadImage(dataURL);
} catch (error) {
  console.error('Load failed:', error.message);
}
```

## Browser Compatibility

All APIs use standard web APIs compatible with:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## TypeScript Definitions

For TypeScript users, you can create declaration files based on this documentation.

---

For more examples, see the [User Guide](USER_GUIDE.md).
