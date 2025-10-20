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
};

export default nextConfig;
