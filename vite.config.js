import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  // The speech worker imports transformers.js at runtime, which needs an ES module worker.
  worker: { format: 'es' },
  test: {
    exclude: ['node_modules/**', 'dist/**', 'android/**', '_old/**'],
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
        ],
        // Long-press the home-screen icon: each focused maker, by its link (src/components/editor/makers.ts).
        shortcuts: [
          { name: 'Make a sticker', short_name: 'Sticker', url: './#/stickers' },
          { name: 'AI meme', short_name: 'AI Meme', url: './#/ai-meme' },
          { name: 'Face swap', short_name: 'Face Swap', url: './#/face-swap' },
          { name: 'Social card', short_name: 'Social Card', url: './#/social-card' }
        ].map((s) => ({ ...s, icons: [{ src: './favicon.svg', sizes: 'any', type: 'image/svg+xml' }] }))
      }
    })
  ],
})
