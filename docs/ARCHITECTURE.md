# Architecture Guide

## Overview

Texture reCreator follows a modular architecture with clear separation of concerns. The application is built using modern JavaScript (ES6+) with a focus on maintainability, performance, and scalability.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         User Interface                       │
│                          (index.html)                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Application Core                        │
│                         (main.js)                            │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌──────────────┐   ┌──────────────┐
│   UI Layer    │   │  Core Layer  │   │ Utils Layer  │
│               │   │              │   │              │
│ • Controls    │   │ • Canvas     │   │ • Helpers    │
│ • DragDrop    │   │   Renderer   │   │ • ImageLoad  │
│ • Theme       │   │ • Texture    │   │ • Performance│
│               │   │   Manager    │   │              │
└───────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │ Web Workers  │
                    │ (Background) │
                    └──────────────┘
```

## Layer Description

### 1. UI Layer (`src/ui/`)

Handles all user interface interactions and visual updates.

**Components:**

- **controls.js**: Manages slider inputs, radio buttons, and user controls
- **dragDrop.js**: Implements drag-and-drop file upload functionality
- **themeManager.js**: Handles dark/light theme switching and persistence

**Responsibilities:**
- User input handling
- DOM manipulation
- Visual feedback
- Accessibility features

### 2. Core Layer (`src/core/`)

Contains the core business logic for texture processing.

**Components:**

- **canvasRenderer.js**: Low-level canvas drawing operations
  - Image mirroring
  - Texture tiling
  - Export functionality

- **textureManager.js**: High-level texture management
  - Image loading
  - Pattern generation
  - Preview updates
  - Export coordination

**Responsibilities:**
- Canvas manipulation
- Texture algorithms
- Pattern generation
- Image processing

### 3. Utils Layer (`src/utils/`)

Provides utility functions used across the application.

**Components:**

- **helpers.js**: General-purpose utilities
  - Debounce function
  - Throttle function
  - Math helpers

- **imageLoader.js**: Image loading utilities
  - Data URL conversion
  - File validation
  - Async image loading

- **performance.js**: Performance monitoring
  - Performance marks
  - Memory management
  - Canvas optimization

**Responsibilities:**
- Common utilities
- Performance optimization
- Helper functions

### 4. Workers Layer (`src/workers/`)

Background threads for heavy processing.

**Components:**

- **imageProcessor.worker.js**: Web Worker for image processing
  - Heavy canvas operations
  - Tile generation
  - Background processing

**Responsibilities:**
- Offload heavy computations
- Prevent UI blocking
- Parallel processing

## Data Flow

```
User Action (Drag & Drop)
    │
    ▼
DragDropHandler
    │
    ├─> Validate File (imageLoader)
    │
    ▼
TextureManager.loadImage()
    │
    ├─> Load Image (async)
    │
    ▼
CanvasRenderer.generateTexture()
    │
    ├─> Draw on Canvas
    │
    ▼
TextureManager.updatePreview()
    │
    ├─> Update Background
    ├─> Update Preview Image
    │
    ▼
User sees result
```

## Design Patterns

### 1. Module Pattern

Each file exports a class or functions as an ES6 module:

```javascript
// Export
export class TextureManager { ... }

// Import
import { TextureManager } from './core/textureManager.js';
```

### 2. Single Responsibility Principle

Each class has one well-defined responsibility:
- `CanvasRenderer`: Only handles canvas operations
- `TextureManager`: Only manages textures
- `DragDropHandler`: Only handles file drops

### 3. Dependency Injection

Dependencies are passed into constructors:

```javascript
class UIControls {
  constructor(textureManager) {
    this.textureManager = textureManager;
  }
}
```

### 4. Observer Pattern (Event-Driven)

UI events trigger actions through event listeners:

```javascript
slider.addEventListener('input', () => {
  this.updateTileSize();
});
```

## Performance Optimizations

### 1. Debouncing

Slider inputs are debounced to prevent excessive updates:

```javascript
const debouncedUpdate = debounce(() => this.updateTileSize(), 50);
```

### 2. Memory Management

Object URLs are tracked and cleaned up:

```javascript
class MemoryManager {
  revokeAll() {
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
  }
}
```

### 3. Canvas Optimization

Canvas operations are optimized for large images:
- Context options: `{ alpha: true, willReadFrequently: false }`
- Efficient clearing methods
- Minimal redraws

### 4. Lazy Loading

Images and resources are loaded only when needed.

## State Management

State is managed locally within each class:

```javascript
class TextureManager {
  constructor() {
    this.currentImageData = null;  // Current image
    this.useMirroring = false;     // Pattern type
    this.tileWidth = 150;          // Tile dimensions
    this.tileHeight = 150;
  }
}
```

## Error Handling

Errors are caught and handled gracefully:

```javascript
try {
  await this.textureManager.loadImage(dataURL);
} catch (error) {
  console.error('Failed to load texture:', error);
  this.showError('Failed to load texture. Please try again.');
}
```

## Testing Strategy

### Unit Tests
- Test individual functions and classes
- Mock dependencies
- Test edge cases

### Integration Tests
- Test component interactions
- Test data flow
- Test event handling

### Performance Tests
- Measure render times
- Monitor memory usage
- Test with large images

## Build Process

The application uses Vite for building:

1. **Development**: `npm run dev`
   - Hot module replacement
   - Fast refresh
   - Source maps

2. **Production**: `npm run build`
   - Minification
   - Tree shaking
   - Asset optimization
   - Code splitting

## Future Enhancements

### Planned Features
1. **Undo/Redo System**: Command pattern implementation
2. **Preset Patterns**: Template library
3. **Batch Processing**: Multiple images at once
4. **Advanced Filters**: Color adjustments, blur, etc.

### Architecture Improvements
1. State management library (if needed)
2. More comprehensive testing
3. Performance profiling
4. Better error boundaries

## Code Style Guide

### Naming Conventions
- Classes: PascalCase (`TextureManager`)
- Functions: camelCase (`loadImage`)
- Constants: UPPER_SNAKE_CASE (`MAX_SIZE`)
- Files: camelCase (`textureManager.js`)

### Documentation
- JSDoc comments for all public methods
- Inline comments for complex logic
- README for each major module

### Code Organization
- One class per file
- Related functions grouped together
- Dependencies at the top
- Exports at the bottom

## Conclusion

This architecture provides:
- ✅ Clear separation of concerns
- ✅ Easy to test and maintain
- ✅ Performant and scalable
- ✅ Extensible for future features
