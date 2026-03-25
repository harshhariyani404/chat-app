import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,      // ⭐ VERY IMPORTANT
    port: 5173,
    https: true,
  }
})