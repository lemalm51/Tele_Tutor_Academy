import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'; // <-- New import

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),

    // <-- New plugin added to mock Node.js modules for the browser
    nodePolyfills({
      // The 'os' module is the one causing the warning
      include: ['os'],
      // The core modules used by Node.js, often needed for full compatibility
      globals: true,
      // Provide compatibility in the dev server (recommended)
      protocolImports: true,


    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
