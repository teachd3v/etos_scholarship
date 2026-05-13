import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    // optional: specify a port if needed, e.g., port: 5173,
    // strictPort: false // allow Vite to use another port if the default is taken
  }
})
