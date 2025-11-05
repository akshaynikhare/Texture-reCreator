# User Guide

Complete guide to using Texture reCreator for seamless texture creation.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Basic Usage](#basic-usage)
3. [Advanced Features](#advanced-features)
4. [Tips & Tricks](#tips--tricks)
5. [Troubleshooting](#troubleshooting)
6. [FAQ](#faq)

---

## Getting Started

### What is Texture reCreator?

Texture reCreator is a web-based tool that helps you test and create seamless textures for 3D rendering. It allows you to quickly check if your texture images will tile properly without visible seams.

### Why Use It?

- **Save Time**: Instantly preview how textures will look when tiled
- **No Software Required**: Works entirely in your browser
- **Test Multiple Patterns**: Try both standard and mirror tiling
- **Free & Open Source**: No cost, no registration required

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, or Edge)
- JavaScript enabled
- Internet connection (for initial load)

---

## Basic Usage

### Step 1: Open the Application

Visit [https://akshaynikhare.github.io/Texture-reCreator/](https://akshaynikhare.github.io/Texture-reCreator/)

### Step 2: Upload Your Texture

There are two ways to load a texture:

**Option A: Drag and Drop**
1. Locate your texture image file on your computer
2. Drag the file onto the application window
3. Drop it anywhere on the page

**Option B: Click to Upload** (if available)
1. Click the upload area
2. Browse to your image file
3. Select and open

**Supported Formats:**
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)
- BMP (.bmp)

### Step 3: Choose Tiling Pattern

Two pattern types are available:

#### Standard Tiling
- Simple 2x2 grid repetition
- Best for: Testing if your texture is already seamless
- Creates: Four copies of your image in a grid

#### Mirror Tiling
- Flips edges to eliminate seams
- Best for: Creating seamless patterns from non-seamless textures
- Creates: A mirrored 2x2 grid pattern

**How to Select:**
- Click on one of the two pattern preview thumbnails
- The selected pattern will be highlighted with a blue border

### Step 4: Adjust Tile Size

Use the sliders to control how the texture tiles:

**Width Slider**
- Controls horizontal tile size
- Range: 1-20 (50px - 1000px)
- Higher = larger tiles

**Height Slider**
- Controls vertical tile size
- Range: 1-20 (50px - 1000px)
- Higher = larger tiles

**Link Icon** (chain symbol)
- Click to link/unlink width and height
- When linked: Both sliders move together
- When unlinked: Control each dimension independently

### Step 5: Preview & Download

**Preview:**
- The background shows your tiled texture
- The preview box shows the 2x2 pattern
- Adjust settings to see real-time updates

**Download:**
1. Hover over the preview image
2. Click when the "Download" button appears
3. Your browser will save the texture file
4. Default filename: `texture.jpg`

---

## Advanced Features

### Dark Mode

Toggle between light and dark themes:

1. Look for the theme button (sun/moon icon) in the top-right
2. Click to toggle between themes
3. Your preference is saved automatically
4. Syncs with system preferences by default

### Keyboard Navigation

Navigate the interface using your keyboard:

- **Tab**: Move between controls
- **Arrow Keys**: Adjust sliders
- **Enter/Space**: Activate buttons
- **Esc**: Close any modals (if present)

### Responsive Design

The application adapts to your screen:

- **Desktop**: Full features, side-by-side layout
- **Tablet**: Optimized touch controls
- **Mobile**: Stacked layout, large touch targets

### Performance Optimizations

The app automatically optimizes for:

- **Large Images**: Efficient canvas rendering
- **Frequent Updates**: Debounced slider inputs
- **Memory Management**: Automatic cleanup of resources

---

## Tips & Tricks

### Creating Seamless Textures

1. **Start with High-Quality Images**
   - Use at least 1024x1024 resolution
   - Square images work best
   - Avoid obvious patterns or features

2. **Use Mirror Tiling for Non-Seamless Textures**
   - Mirror mode can make any texture seamless
   - Works great for natural patterns (grass, stone, fabric)

3. **Test Different Tile Sizes**
   - Small tiles: Good for fine details
   - Large tiles: Better for larger patterns
   - Try multiple sizes to find what looks best

4. **Check for Seam Lines**
   - Look at the preview background carefully
   - Seams appear as visible lines or edges
   - Try different pattern types if you see seams

### Best Practices

1. **Name Your Files Descriptively**
   - Example: `wood_oak_seamless_1024.jpg`
   - Helps organize your texture library

2. **Keep Original Files**
   - Save both original and processed versions
   - You might want to re-process with different settings

3. **Test in Your 3D Application**
   - After downloading, test in your actual 3D software
   - Lighting and shaders can affect appearance

4. **Optimize File Size**
   - Use JPEG for photos (smaller files)
   - Use PNG for graphics with transparency
   - Balance quality vs. file size

### Workflow Tips

**For Game Development:**
1. Create seamless texture
2. Test at actual game resolution
3. Create normal maps and other maps from same source
4. Keep consistent tile sizes across assets

**For 3D Rendering:**
1. Use high-resolution source images
2. Export at maximum quality
3. Create multiple variants (weathered, clean, etc.)
4. Organize in a texture library

---

## Troubleshooting

### Image Won't Load

**Problem:** Dragging image doesn't work

**Solutions:**
- Make sure it's an image file (not a link or shortcut)
- Try a different image format
- Check file isn't corrupted
- Try refreshing the page

### Pattern Looks Wrong

**Problem:** Texture has visible seams

**Solutions:**
- Try switching to Mirror tiling mode
- Adjust tile size to hide seams
- Use a higher quality source image
- Source image might need editing in image editor first

### Performance Issues

**Problem:** App is slow or laggy

**Solutions:**
- Close other browser tabs
- Try a smaller image (under 2048x2048)
- Update your web browser
- Disable browser extensions temporarily

### Download Not Working

**Problem:** Can't download the texture

**Solutions:**
- Check browser's download settings
- Disable pop-up blockers
- Try right-click > "Save As" on preview image
- Check if downloads are blocked for the site

### Theme Not Saving

**Problem:** Theme resets when you reload

**Solutions:**
- Check browser allows localStorage
- Not in incognito/private mode
- Clear browser cache and try again
- Check browser privacy settings

---

## FAQ

### Q: Is this tool free?

**A:** Yes! Texture reCreator is completely free and open source.

### Q: Do I need to create an account?

**A:** No account needed. Just visit the website and start using it.

### Q: Are my images uploaded to a server?

**A:** No. All processing happens locally in your browser. Your images never leave your computer.

### Q: What's the maximum image size?

**A:** The tool can handle images up to around 4096x4096, but performance is best with images under 2048x2048.

### Q: Can I use this for commercial projects?

**A:** Yes! Both the tool and textures you create are free to use commercially.

### Q: Does it work offline?

**A:** After the initial load, some features may work offline depending on your browser's caching.

### Q: Can I process multiple images at once?

**A:** Currently, you can process one image at a time. Batch processing is planned for a future update.

### Q: What's the difference between Standard and Mirror tiling?

**A:**
- **Standard**: Creates a 2x2 grid by repeating your image exactly as-is
- **Mirror**: Flips alternate copies horizontally and vertically to eliminate seams

### Q: Why use mirror tiling?

**A:** Mirror tiling automatically creates seamless patterns from non-seamless textures by flipping edges to match up perfectly.

### Q: Can I undo changes?

**A:** Currently, there's no undo feature. Just reload your image to start over. Undo/redo is planned for a future update.

### Q: How do I report bugs or suggest features?

**A:** Visit the [GitHub repository](https://github.com/akshaynikhare/Texture-reCreator) and create an issue.

---

## Need More Help?

- **Documentation**: See other docs in the `/docs` folder
- **API Reference**: Check [API.md](API.md) for developers
- **Architecture**: See [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
- **GitHub Issues**: Report bugs or request features
- **Email**: Contact the author via the website

---

## Quick Reference

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Tab | Next control |
| Shift+Tab | Previous control |
| Arrow Keys | Adjust sliders |
| Enter/Space | Activate button |

### File Formats

| Format | Extension | Best For |
|--------|-----------|----------|
| JPEG | .jpg | Photos, realistic textures |
| PNG | .png | Graphics, transparency |
| WebP | .webp | Modern format, good compression |
| GIF | .gif | Simple graphics |

### Recommended Resolutions

| Use Case | Resolution | Tile Size |
|----------|-----------|-----------|
| Web/Mobile | 512x512 | Small-Medium |
| Desktop Games | 1024x1024 | Medium-Large |
| High-End 3D | 2048x2048 | Large |
| Cinematic | 4096x4096 | Extra Large |

---

Happy texturing! 🎨
