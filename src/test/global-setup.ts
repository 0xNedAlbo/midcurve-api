/**
 * Global setup for E2E tests
 * Runs once before all test files
 *
 * Responsibilities:
 * - Ensure test database is available
 * - Run Prisma schema push (sync schema)
 * - Seed test database with user and API key
 */

import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

export default async function globalSetup() {
  console.log('\n🔧 Setting up E2E test environment...\n');

  // DATABASE_URL should be loaded from .env (Prisma convention)
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is not set. Make sure .env exists with DATABASE_URL defined.\n' +
      'Point DATABASE_URL to the test database for running tests.'
    );
  }

  console.log(`📊 Using database: ${databaseUrl.split('@')[1]?.split('?')[0] || 'unknown'}`);

  // Set DATABASE_URL for Prisma CLI commands
  process.env.DATABASE_URL = databaseUrl;

  try {
    // Test database connection
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    await prisma.$connect();
    console.log('✅ Database connection successful');
    await prisma.$disconnect();

    // Push schema to test database (creates/updates tables without migrations)
    console.log('📦 Pushing database schema...');
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: databaseUrl },
    });
    console.log('✅ Database schema ready');

    // Seed test database
    console.log('🌱 Seeding test database...');
    execSync('npx tsx prisma/seed.ts', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: databaseUrl },
    });

    console.log('\n✅ E2E test environment ready!\n');

  } catch (error) {
    console.error('❌ Failed to setup test database:', error);
    throw error;
  }
}
