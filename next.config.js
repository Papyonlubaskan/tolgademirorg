/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  eslint: {
    ignoreDuringBuilds: true, // ESLint hatalarını build sırasında ignore et
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Console log'ları tamamen kapat
  webpack: (config, { dev, isServer }) => {
    if (!dev) {
      try {
        const TerserPlugin = require('terser-webpack-plugin');
        config.optimization = {
          ...config.optimization,
          minimizer: [
            ...config.optimization.minimizer,
            new TerserPlugin({
              terserOptions: {
                compress: {
                  drop_console: true,
                  drop_debugger: true,
                  pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn', 'console.error'],
                },
              },
            }),
          ],
        }
      } catch (error) {
        // Terser yoksa devam et
        console.log('Terser plugin not found, skipping console removal');
      }
    }
    return config
  },
  
  // Output configuration for deployment
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  outputFileTracingRoot: __dirname,
  
  // Performance settings
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Production optimizations
  productionBrowserSourceMaps: false,
  
  // Logging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      // Local uploads için remote pattern gerekli değil
    ],
    // Local dosyalar için unoptimized kullan
    unoptimized: false,
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Set-Cookie',
            value: 'SameSite=None; Secure; HttpOnly',
          },
        ],
      },
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

