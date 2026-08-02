import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Auth/upload nằm ở api-customer (:9090)
// Users/posts admin nằm ở api-admin (:8081)
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/v1/auth': {
        target: 'http://localhost:9090',
        changeOrigin: true,
      },
      '/api/v1/admin/upload': {
        target: 'http://localhost:9090',
        changeOrigin: true,
      },
      '/api/v1/admin': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:9090',
        changeOrigin: true,
      },
    },
  },
})
