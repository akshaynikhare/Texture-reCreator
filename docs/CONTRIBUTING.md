# Contributing to Texture reCreator

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of experience level, background, or identity.

### Our Standards

**Positive behaviors:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what's best for the community
- Showing empathy towards other community members

**Unacceptable behaviors:**
- Harassment, trolling, or insulting comments
- Personal or political attacks
- Publishing others' private information without permission
- Any conduct that could be considered inappropriate in a professional setting

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Git
- A code editor (VS Code recommended)

### First Time Setup

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Texture-reCreator.git
   cd Texture-reCreator
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/akshaynikhare/Texture-reCreator.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## Development Setup

### Recommended VS Code Extensions

- ESLint
- Prettier
- GitLens
- Live Server

### Project Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Format code
npm run format
```

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write code
   - Add tests if applicable
   - Update documentation

3. **Test your changes**
   ```bash
   npm run dev
   # Test manually in browser
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Go to GitHub
   - Click "New Pull Request"
   - Fill in the PR template

## How to Contribute

### Types of Contributions

**Code Contributions:**
- Bug fixes
- New features
- Performance improvements
- Refactoring

**Documentation:**
- README improvements
- API documentation
- Code comments
- Tutorials or guides

**Design:**
- UI/UX improvements
- Icons or graphics
- CSS enhancements

**Testing:**
- Writing tests
- Testing on different browsers
- Performance testing

### Finding Issues to Work On

Look for issues labeled:
- `good first issue` - Good for newcomers
- `help wanted` - Need community help
- `bug` - Bug reports
- `enhancement` - Feature requests

## Coding Standards

### JavaScript Style Guide

**ES6+ Features:**
```javascript
// Use const/let, not var
const canvas = document.getElementById('cvs');
let currentImage = null;

// Use arrow functions
const processImage = (image) => {
  // ...
};

// Use async/await
async function loadImage(url) {
  const response = await fetch(url);
  return response.blob();
}

// Use template literals
const message = `Image loaded: ${filename}`;

// Use destructuring
const { width, height } = image;
```

**Naming Conventions:**
```javascript
// Classes: PascalCase
class TextureManager { }

// Functions: camelCase
function loadTexture() { }

// Constants: UPPER_SNAKE_CASE
const MAX_IMAGE_SIZE = 4096;

// Private properties: _prefix
class Renderer {
  _context = null;
}
```

**Function Documentation:**
```javascript
/**
 * Loads an image and generates texture
 * @param {string} imageDataURL - Image data URL
 * @returns {Promise<void>}
 * @throws {Error} If image fails to load
 */
async function loadImage(imageDataURL) {
  // ...
}
```

### CSS Style Guide

**Modern CSS:**
```css
/* Use CSS variables */
:root {
  --primary-color: #4299e1;
  --spacing-md: 1rem;
}

/* Use modern layout */
.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

/* Use logical properties */
.element {
  margin-inline: auto;
  padding-block: 1rem;
}

/* Avoid vendor prefixes (PostCSS handles this) */
.box {
  backdrop-filter: blur(10px);
}
```

**BEM-like Naming:**
```css
/* Block */
.texture-preview { }

/* Element */
.texture-preview__image { }

/* Modifier */
.texture-preview--loading { }
```

### File Organization

```
src/
├── core/           # Business logic
├── ui/             # UI components
├── utils/          # Utilities
├── workers/        # Web Workers
└── styles/         # Stylesheets
```

**One class per file:**
```javascript
// textureManager.js
export class TextureManager {
  // ...
}
```

**Related functions grouped:**
```javascript
// imageLoader.js
export function loadImage() { }
export function validateImage() { }
export function convertImage() { }
```

### Error Handling

**Always handle errors:**
```javascript
// Good
try {
  await loadImage(url);
} catch (error) {
  console.error('Failed to load image:', error);
  showErrorMessage('Could not load image');
}

// Bad
await loadImage(url); // Uncaught errors
```

**Provide helpful error messages:**
```javascript
// Good
throw new Error('Image size exceeds maximum allowed (4096x4096)');

// Bad
throw new Error('Invalid');
```

### Comments

**Use JSDoc for public APIs:**
```javascript
/**
 * Exports the canvas as a data URL
 * @param {string} format - Image format (default: 'image/jpeg')
 * @param {number} quality - Image quality 0-1 (default: 0.92)
 * @returns {string} Data URL of the image
 */
export function exportImage(format = 'image/jpeg', quality = 0.92) {
  // ...
}
```

**Explain why, not what:**
```javascript
// Good
// Debounce to prevent excessive canvas redraws
const debouncedUpdate = debounce(update, 50);

// Bad
// Call debounce function
const debouncedUpdate = debounce(update, 50);
```

## Pull Request Process

### PR Title Format

Use conventional commits format:

```
feat: add dark mode toggle
fix: resolve canvas memory leak
docs: update API documentation
style: improve button styling
refactor: reorganize texture manager
test: add unit tests for image loader
perf: optimize canvas rendering
```

### PR Description Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How you tested your changes

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated (if applicable)
```

### Review Process

1. **Automated Checks**
   - Linting must pass
   - Build must succeed
   - No merge conflicts

2. **Manual Review**
   - Code quality
   - Adherence to standards
   - Test coverage
   - Documentation

3. **Approval**
   - At least one maintainer approval required
   - All conversations resolved

4. **Merge**
   - Maintainer will merge after approval
   - Branch will be deleted

## Reporting Bugs

### Before Reporting

1. Check existing issues
2. Update to latest version
3. Try to reproduce in different browser

### Bug Report Template

```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen

**Screenshots**
Add screenshots if applicable

**Environment:**
 - OS: [e.g., Windows 10]
 - Browser: [e.g., Chrome 120]
 - Version: [e.g., 2.0.0]

**Additional context**
Any other relevant information
```

## Suggesting Features

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Clear description of the problem

**Describe the solution you'd like**
Clear description of what you want

**Describe alternatives you've considered**
Other solutions you've thought about

**Additional context**
Mockups, examples, or other context
```

### Feature Discussion

Before implementing large features:

1. Open an issue to discuss
2. Get feedback from maintainers
3. Agree on approach
4. Then start implementation

## Questions?

- Open an issue with your question
- Tag it with `question` label
- Maintainers will respond

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in commit history

Thank you for contributing! 🎉
