import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Makes the app installable and usable offline (field reps working in
    // low-connectivity retail zones). Precaches the built app shell
    // (JS/CSS/HTML) automatically; runtime caching below extends that to
    // stores.json (so a cold-loaded offline session still has the network
    // data) and to map tiles already viewed (so previously-seen areas of
    // the map keep working, not the whole world — genuinely offline map
    // tiles for unvisited areas aren't something a static PWA can provide).
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Digital Prospection Tool',
        short_name: 'DPT',
        description: 'Localisateur d\'opticiens partenaires et CRM terrain Thélios.',
        lang: 'fr',
        start_url: '/',
        display: 'standalone',
        background_color: '#faf8f4',
        theme_color: '#0f1015',
        icons: [
          { src: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Vite's own build output only — stores.json and map tiles are
        // handled by the explicit runtime rules below instead, since they
        // change independently of a deploy (stores.json can be updated
        // without a rebuild; tiles are third-party).
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\/stores\.json$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'stores-data',
              expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            urlPattern: /^https:\/\/[a-z]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles-light',
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/[a-z]\.basemaps\.cartocdn\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles-dark',
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
