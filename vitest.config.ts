import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',

    // E2E tests - test API endpoints end-to-end
    // Note: Environment variables loaded from .env (Prisma convention)
    name: 'e2e',
    include: ['src/**/*.e2e.test.{js,ts}'],
    exclude: ['node_modules', 'dist', '.next'],
    testTimeout: 30000,
    hookTimeout: 30000,

    // Run tests sequentially to ensure proper database isolation
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },

    // Global setup: database schema push + seeding
    globalSetup: './src/test/global-setup.ts',

    // Override specific env vars (others loaded from .env)
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
    },
  },

  // Resolve path aliases (matching tsconfig.json)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
