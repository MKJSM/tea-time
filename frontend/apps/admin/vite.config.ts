import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendOrigin = env.VITE_BACKEND_ORIGIN || 'http://127.0.0.1:3001';

  return {
    base: '/admin/',
    plugins: [react()],

    build: {
      outDir: '../../dist/admin',
      emptyOutDir: true,
      // Enable sourcemaps in development builds; disable for production
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
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
