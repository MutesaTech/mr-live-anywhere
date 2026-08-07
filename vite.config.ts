import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'logo.png'],
      manifest: {
        name: 'Beemo - Live TV, Radio & Books',
        short_name: 'Beemo',
        description: 'Watch live TV and listen to radio stations from around the world',
        theme_color: '#7c3aed',
        background_color: '#0a0e17',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Pre-cache the app shell
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2}'],
        // Runtime caching strategies
        runtimeCaching: [
          // Cache channel/radio data JSON
          {
            urlPattern: /\/.*\.json$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'data-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              }
            }
          },
          // Cache images with CacheFirst strategy
          {
            urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Cache external logos (postimg, etc.)
          {
            urlPattern: /^https:\/\/i\.postimg\.cc\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'logo-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Network first for API/streams (fallback to cache)
          {
            urlPattern: /^https:\/\/.*\.(m3u8|ts)$/i,
            handler: 'NetworkOnly'
          }
        ],
        // Skip waiting and claim clients immediately
        skipWaiting: true,
        clientsClaim: true
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
