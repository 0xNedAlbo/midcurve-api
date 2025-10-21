/**
 * E2E Test Helpers
 *
 * Utilities for testing API endpoints end-to-end.
 */

import { PrismaClient } from '@prisma/client';

// ============================================================================
// Test Constants
// ============================================================================

/**
 * Test API key (seeded in global setup)
 * Use this for authenticated requests
 */
export const TEST_API_KEY = 'mc_test_1234567890abcdefghijklmnopqrstuvwxyz';

/**
 * Test user ID (seeded in global setup)
 */
export const TEST_USER_ID = 'test-user-api-e2e';

/**
 * Test wallet address (seeded in global setup)
 */
export const TEST_WALLET_ADDRESS = '0x1234567890123456789012345678901234567890';

/**
 * Base URL for API requests
 * Uses localhost:3000 for testing Next.js API routes
 */
export const API_BASE_URL = process.env.AUTH_URL || 'http://localhost:3000';

// ============================================================================
// Database Utilities
// ============================================================================

/**
 * Get a Prisma client instance for test database
 * Uses DATABASE_URL from .env.test
 */
export function getPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

/**
 * Clear all data from the test database
 * Useful for resetting state between tests
 *
 * Note: This preserves the seed data (user, wallet, API key)
 * by using upsert in the seed script
 */
export async function clearDatabase(): Promise<void> {
  const prisma = getPrismaClient();

  try {
    // Delete in reverse order of foreign key dependencies
    await prisma.apiKey.deleteMany();
    await prisma.authWalletAddress.deleteMany();
    await prisma.authSession.deleteMany();
    await prisma.authAccount.deleteMany();
    await prisma.user.deleteMany();
    await prisma.cache.deleteMany();
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================================
// HTTP Request Helpers
// ============================================================================

/**
 * Make an authenticated GET request to an API endpoint
 *
 * @param endpoint - API endpoint path (e.g., '/api/health')
 * @param apiKey - Optional API key (defaults to TEST_API_KEY)
 * @returns Response object
 */
export async function authenticatedGet(
  endpoint: string,
  apiKey: string = TEST_API_KEY
): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;

  return fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Make an unauthenticated GET request to an API endpoint
 *
 * @param endpoint - API endpoint path (e.g., '/api/health')
 * @returns Response object
 */
export async function unauthenticatedGet(endpoint: string): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;

  return fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Make an authenticated POST request to an API endpoint
 *
 * @param endpoint - API endpoint path
 * @param body - Request body (will be JSON stringified)
 * @param apiKey - Optional API key (defaults to TEST_API_KEY)
 * @returns Response object
 */
export async function authenticatedPost(
  endpoint: string,
  body: unknown,
  apiKey: string = TEST_API_KEY
): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;

  return fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

// ============================================================================
// Response Parsing Helpers
// ============================================================================

/**
 * Parse JSON response and return typed data
 *
 * @param response - Fetch Response object
 * @returns Parsed JSON data
 */
export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text) {
    throw new Error('Response body is empty');
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${text}`);
  }
}
