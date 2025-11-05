# Deployment Guide

This guide explains how to deploy Texture reCreator to GitHub Pages using GitHub Actions.

## Overview

The project uses:
- **Vite** - Build tool that bundles all JavaScript, CSS, and assets
- **GitHub Actions** - Automated build and deployment
- **GitHub Pages** - Static site hosting

## How It Works

1. **Push to main/master branch** triggers the GitHub Actions workflow
2. **GitHub Actions** runs the build process:
   - Installs Node.js and dependencies
   - Runs `npm run build` to create production files
   - Uploads the `dist/` folder as a deployment artifact
3. **GitHub Pages** serves the built files from the `dist/` folder

## Setup Instructions

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under "Build and deployment":
   - **Source**: Select "GitHub Actions"
4. Save the settings

### 2. Verify Workflow File

The workflow file is located at `.github/workflows/deploy.yml` and should look like this:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
      - master
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write
# ... (rest of the workflow)
```

### 3. Push to Main Branch

```bash
# Ensure you're on the main branch
git checkout main

# Merge your changes (or push directly)
git push origin main
```

### 4. Monitor the Deployment

1. Go to the **Actions** tab in your GitHub repository
2. You should see a workflow run called "Deploy to GitHub Pages"
3. Wait for it to complete (usually 1-2 minutes)
4. Once complete, your site will be live at:
   `https://[username].github.io/Texture-reCreator/`

## Local Build Testing

Before pushing, you can test the build locally:

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview the production build
npm run preview
```

This will:
1. Create a `dist/` folder with all production files
2. Start a local server to preview the build
3. Open `http://localhost:4173` in your browser

## Build Configuration

### Vite Configuration

The `vite.config.js` file is configured for GitHub Pages:

```javascript
export default defineConfig({
  base: '/Texture-reCreator/',  // Repository name
  build: {
    outDir: 'dist',               // Output directory
    assetsDir: 'assets',          // Assets subdirectory
    sourcemap: true,              // Generate source maps
  }
});
```

**Important**: The `base` must match your repository name!

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",                // Development server
    "build": "vite build",        // Production build
    "preview": "vite preview"     // Preview production build
  }
}
```

## Troubleshooting

### Build Fails

**Problem**: GitHub Actions workflow fails

**Solutions**:
1. Check the Actions tab for error messages
2. Verify `package.json` has all dependencies
3. Test the build locally first
4. Check Node.js version (should be 18+)

### 404 Errors on Deployed Site

**Problem**: Site loads but assets return 404

**Solutions**:
1. Verify `base` in `vite.config.js` matches repository name
2. Check that paths in `index.html` are relative (`./src/...` not `/src/...`)
3. Ensure images are in the `img/` folder (not inside `src/`)

### Site Not Updating

**Problem**: Changes not reflected on live site

**Solutions**:
1. Clear browser cache (Ctrl+F5 or Cmd+Shift+R)
2. Wait a few minutes for GitHub Pages to update
3. Check if workflow completed successfully
4. Verify you pushed to the correct branch

### Workflow Doesn't Run

**Problem**: Push to main doesn't trigger workflow

**Solutions**:
1. Verify `.github/workflows/deploy.yml` exists
2. Check workflow file syntax is valid
3. Ensure GitHub Pages is enabled in settings
4. Check repository permissions

## Manual Deployment

If GitHub Actions isn't working, you can deploy manually:

```bash
# 1. Build locally
npm run build

# 2. Install gh-pages package
npm install -g gh-pages

# 3. Deploy to gh-pages branch
gh-pages -d dist

# 4. Configure GitHub Pages to use gh-pages branch
# Go to Settings → Pages → Source → Branch: gh-pages
```

## Custom Domain

To use a custom domain:

1. Add a `CNAME` file to the `public/` folder:
   ```
   yourdomain.com
   ```

2. Configure DNS with your domain provider:
   - Type: `CNAME`
   - Name: `www` (or `@` for apex domain)
   - Value: `[username].github.io`

3. Update `vite.config.js`:
   ```javascript
   base: '/',  // Change from '/Texture-reCreator/'
   ```

## Environment Variables

For production builds, you can use environment variables:

1. Create `.env.production`:
   ```
   VITE_APP_TITLE=Texture reCreator
   VITE_API_URL=https://api.example.com
   ```

2. Access in code:
   ```javascript
   const title = import.meta.env.VITE_APP_TITLE;
   ```

## Performance Optimization

The build process automatically:
- ✅ Minifies JavaScript and CSS
- ✅ Optimizes images
- ✅ Generates source maps
- ✅ Bundles modules
- ✅ Tree-shakes unused code

## Monitoring

After deployment:

1. **Check Performance**:
   - Use Lighthouse in Chrome DevTools
   - Aim for 90+ scores

2. **Monitor Errors**:
   - Check browser console
   - Test on different browsers

3. **Analytics** (optional):
   - Add Google Analytics
   - Monitor page views and usage

## Rollback

To rollback to a previous version:

```bash
# 1. Find the commit hash of the good version
git log

# 2. Revert to that commit
git revert [commit-hash]

# 3. Push to trigger re-deployment
git push origin main
```

## CI/CD Best Practices

1. **Always test builds locally** before pushing
2. **Use semantic versioning** for releases
3. **Write descriptive commit messages**
4. **Keep dependencies updated**
5. **Monitor workflow execution**

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [GitHub Pages Docs](https://docs.github.com/en/pages)

## Getting Help

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review GitHub Actions logs
3. Open an issue on GitHub
4. Check Vite's documentation

---

**Last Updated**: 2025
**Vite Version**: 5.0
**Node Version**: 18+
