import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

export default defineConfig({
  base: '/Texture-reCreator/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  optimizeDeps: {
    include: []
  },
  // Copy additional assets that are loaded dynamically at runtime (only env files)
  plugins: [
    {
      name: 'copy-runtime-assets',
      closeBundle() {
        const assetsToCopy = [
          { src: 'assets/env/studio.hdr', dest: 'dist/assets/env/studio.hdr' },
          { src: 'assets/env/studio.jpg', dest: 'dist/assets/env/studio.jpg' }
        ];

        assetsToCopy.forEach(({ src, dest }) => {
          const srcPath = resolve(__dirname, src);
          const destPath = resolve(__dirname, dest);
          const destDir = resolve(__dirname, dest.substring(0, dest.lastIndexOf('/')));
          
          if (existsSync(srcPath)) {
            if (!existsSync(destDir)) {
              mkdirSync(destDir, { recursive: true });
            }
            copyFileSync(srcPath, destPath);
            console.log(`Copied ${src} to ${dest}`);
          }
        });
      }
    }
  ]
});
