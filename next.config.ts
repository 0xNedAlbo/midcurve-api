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
