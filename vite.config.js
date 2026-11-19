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
      },
      // The video link helper (video_link_server.py), for the video editor's Paste link.
      '/api/video-link': {
        target: 'http://127.0.0.1:5175',
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
        // Not downloaded up front: the wasm engines, FFmpeg's core script and the emoji list
        // (emojibase's data.json, the data-* chunk). They are big and only some people use them;
        // the rule below keeps each one once it has loaded.
        globIgnores: ["**/*.wasm", "**/ffmpeg/ffmpeg-core.js", "**/assets/data-*.js"],
        runtimeCaching: [
          {
            // Built files have a hash in their name, so a cached copy never goes stale.
            urlPattern: ({ url }) => url.pathname.includes('/assets/') && /\.(js|mjs|css)$/.test(url.pathname),
            handler: 'CacheFirst',
            options: { cacheName: 'lazy-chunks', expiration: { maxEntries: 80 } }
          }
        ]
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
