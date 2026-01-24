import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Output to dist as usual
    outDir: 'dist',
    emptyOutDir: true,
  }
})
