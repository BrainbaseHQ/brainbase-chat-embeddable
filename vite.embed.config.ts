import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import { resolve } from 'path';

/**
 * Vite configuration for the standalone embed bundle.
 * 
 * This builds an IIFE bundle that includes React and all dependencies,
 * suitable for loading via a script tag.
 * 
 * Build command: vite build --config vite.embed.config.ts
 */
export default defineConfig({
  plugins: [
    react(),
    // Inject CSS into the JS bundle - styles go into <head> automatically
    cssInjectedByJsPlugin({
      styleId: 'brainbase-chat-styles',
    }),
  ],
  define: {
    // Ensure proper environment for production build
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    outDir: 'dist',
    emptyDir: false, // Don't clear the dist folder (library build runs first)
    lib: {
      entry: resolve(__dirname, 'src/embed/index.ts'),
      name: 'BrainbaseChat',
      formats: ['iife'],
      fileName: () => 'embed.js',
    },
    rollupOptions: {
      // Bundle everything - no external dependencies for standalone embed
      external: [],
      output: {
        // Ensure we use a single bundle with no code-splitting
        inlineDynamicImports: true,
      },
    },
    // Minify for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console.log for debugging
        drop_debugger: true,
      },
    },
    // Reasonable chunk size warning for standalone embed
    chunkSizeWarningLimit: 600,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
