
module.exports = {
  globDirectory: 'dist',
  globPatterns: [
    '**/*.{js,css,html,png,svg,ico,json,txt,woff,woff2,ttf,webp}'
  ],
  swDest: 'dist/sw.js',
  navigateFallback: '/index.html',
  clientsClaim: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      // Cache images
      urlPattern: ({ request }) => request.destination === 'image',
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
    {
      // Static resources
      urlPattern: ({ url }) => url.origin === self.location.origin,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
      },
    },
  ],
};
