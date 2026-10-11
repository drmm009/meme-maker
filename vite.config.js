import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/api/face-swap': {
        target: 'http://127.0.0.1:5174',
        changeOrigin: true
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000,
        globIgnores: ["**/ffmpeg-core.wasm", "**/*.wasm"]
      },
      manifest: {
        name: 'Meme Maker',
        short_name: 'MemeMaker',
        description: 'A premium mobile meme generator',
        theme_color: '#1a1a1a',
        icons: [
          {
            src: '/vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: '/vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
})
