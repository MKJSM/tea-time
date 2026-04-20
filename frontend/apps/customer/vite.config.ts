import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendOrigin = env.VITE_BACKEND_ORIGIN || 'http://127.0.0.1:3001';

  return {
    plugins: [react()],

    build: {
      outDir: '../../dist/customer',
      emptyOutDir: true,
      // Enable sourcemaps in development builds; disable for production
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          // Split vendor chunks to improve long-term caching
          manualChunks: {
            react: ['react', 'react-dom'],
          },
        },
      },
    },

    resolve: {
      preserveSymlinks: true,
    },

    server: {
      proxy: {
        '/api': {
          target: backendOrigin,
          changeOrigin: true,
        },
      },
    },
  };
});
