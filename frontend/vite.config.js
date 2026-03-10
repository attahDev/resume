import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth':    { target: 'http://localhost:8000', changeOrigin: true },
      '/upload':  { target: 'http://localhost:8000', changeOrigin: true },
      '/analyze': { target: 'http://localhost:8000', changeOrigin: true },
      '/results': { target: 'http://localhost:8000', changeOrigin: true },
      '/history': { target: 'http://localhost:8000', changeOrigin: true },
    }
  }
})