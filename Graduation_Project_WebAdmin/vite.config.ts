import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Auth + API Web Admin → api-web-admin (:8082).
// Upload ảnh /uploads → api-app-customer (:9090).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/v1/admin/upload': {
        target: 'http://localhost:9090',
        changeOrigin: true,
      },
      '/api/v1/admin': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:9090',
        changeOrigin: true,
      },
    },
  },
})
