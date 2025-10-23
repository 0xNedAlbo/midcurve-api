import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* Enable experimental features for Vercel deployment */
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  /* TypeScript strict mode */
  typescript: {
    ignoreBuildErrors: false,
  },

  /* ESLint during builds */
  eslint: {
    ignoreDuringBuilds: false,
  },

  /* Logging */
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  /* CORS headers for local development and production */
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
    ];
  },

  /* Webpack configuration - exclude test files from build */
  webpack: (config) => {
    // Exclude test files from being bundled
    config.module.rules.push({
      test: /\.(test|e2e\.test)\.(ts|tsx|js|jsx)$/,
      loader: 'ignore-loader',
    });

    return config;
  },
};

export default nextConfig;
