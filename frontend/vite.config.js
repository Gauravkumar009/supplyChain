import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Use 0.0.0.0 to listen on all interfaces
    strictPort: true,
    port: 5173,
  }
})
