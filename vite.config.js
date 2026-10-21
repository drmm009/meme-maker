import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  test: {
    exclude: ['node_modules/**', 'dist/**', 'archive/**', 'android/**', 'meme-maker/**', 'src-best-version/**'],
    testTimeout: 30000,
    isolate: false
  },
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
        start_url: './',
        scope: './',
        display: 'standalone',
        theme_color: '#1a1a1a',
        icons: [
          {
            src: './favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
