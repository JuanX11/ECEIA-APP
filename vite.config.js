import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        name: 'Asistencia Semillero',
        short_name: 'Asistencia',
        description: 'PWA de asistencia para semillero de investigación',
        theme_color: '#0ea5e9',
        background_color: '#0b1320',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: ({url}) => url.origin === self.location.origin,
            handler: 'NetworkFirst',
            options: { cacheName: 'static-cache', expiration: { maxEntries: 200 } }
          }
        ]
      }
    })
  ],
  server: { port: 5173 }
})
