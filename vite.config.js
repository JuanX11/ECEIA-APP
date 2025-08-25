import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['ECEIA_LOGO.jpg', 'robots.txt'],
      manifest: {
        name: 'ECEIA',
        short_name: 'ECEIA',
        description: 'PWA de asistencia para semillero de investigación',
        theme_color: '#0ea5e9',
        background_color: '#0b1320',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          { src: '/ECEIA_LOGO.jpg', sizes: '192x192', type: 'image/png' },
          { src: '/ECEIA_LOGO.jpg', sizes: '512x512', type: 'image/png' },
          {
            src: '/ECEIA_LOGO.jpg',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === self.location.origin,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'static-cache',
              expiration: { maxEntries: 200 },
            },
          },
        ],
      },
    }),
  ],
  server: { port: 5173 },
});
