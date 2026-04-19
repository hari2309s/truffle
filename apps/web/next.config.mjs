import withPWAInit from 'next-pwa'

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  fallbacks: {
    document: '/offline',
  },
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'images',
        expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    {
      urlPattern: /^\/api\/transactions/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-transactions',
        expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 2 },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /^\/api\/insights/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'api-insights',
        expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 },
      },
    },
    {
      urlPattern: /^\/api\/goals/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'api-goals',
        expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 2 },
      },
    },
    {
      urlPattern: /^\/api\/habits/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'api-habits',
        expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 2 },
      },
    },
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@truffle/ai', '@truffle/db', '@truffle/types'],
}

export default withPWA(nextConfig)
