import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import viteCompression from 'vite-plugin-compression';

const inlineCssPlugin = () => {
  return {
    name: 'inline-css',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html;
        let newHtml = html;
        for (const [fileName, chunk] of Object.entries(ctx.bundle)) {
          if (fileName.endsWith('.css')) {
            newHtml = newHtml.replace(
              new RegExp(`<link rel="stylesheet"[^>]*href="/?${fileName}"[^>]*>`, 'g'),
              `<style>${chunk.source}</style>`
            );
          }
        }
        return newHtml;
      }
    }
  }
}


export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'https://tea-time-production.up.railway.app',
          changeOrigin: true,
        },
      },
    },
    build: {
      target: 'es2020',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react-router')) return 'router';
              if (id.includes('react-dom') || id.includes('scheduler')) return 'react-vendor';
              if (id.includes('framer-motion')) return 'motion';
              if (id.includes('lucide-react') || id.includes('react-hot-toast')) return 'ui';
              if (id.includes('@reduxjs/toolkit') || id.includes('react-redux')) return 'state';
              // Check for other large dependencies if known, e.g. date-fns, lodash
              return 'vendor';
            }
          }
        }
      },
      chunkSizeWarningLimit: 500,
    },
    esbuild: {
      drop: ['console', 'debugger'],
    },
    plugins: [
      inlineCssPlugin(),
      react(),
      ViteImageOptimizer({
        /* https://github.com/FatehAK/vite-plugin-image-optimizer */
        png: {
          quality: 80,
        },
        jpeg: {
          quality: 80,
        },
        display: 'full',
        webp: {
          quality: 80, // Adjustable: 75-90 is usually a good balance
        },
        avif: {
          quality: 70,
        },
      }),
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024,
      }),
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 1024,
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
