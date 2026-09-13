import { defineConfig } from 'vite';
import { resolve } from 'path';
import { cpSync, existsSync } from 'fs';

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
  // Copy additional assets that are loaded dynamically at runtime
  plugins: [
    {
      name: 'copy-runtime-assets',
      closeBundle() {
        const dirsToCopy = [
          { src: 'assets/env', dest: 'dist/assets/env' },
          { src: 'assets/screenshots', dest: 'dist/assets/screenshots' }
        ];

        dirsToCopy.forEach(({ src, dest }) => {
          const srcPath = resolve(__dirname, src);
          const destPath = resolve(__dirname, dest);
          if (existsSync(srcPath)) {
            cpSync(srcPath, destPath, { recursive: true });
            console.log(`Copied ${src} to ${dest}`);
          }
        });
      }
    }
  ]
});
