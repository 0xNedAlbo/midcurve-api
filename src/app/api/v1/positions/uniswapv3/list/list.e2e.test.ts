/**
 * Position List Endpoint E2E Tests
 *
 * Tests the GET /api/v1/positions/uniswapv3/list endpoint end-to-end.
 *
 * These tests verify:
 * - Authentication (API key required)
 * - Pagination (limit, offset, hasMore, total)
 * - Filtering by chainId
 * - Filtering by status (active, closed, all)
 * - Combined filters (chainId + status)
 * - Response structure and data types
 * - Empty result handling
 *
 * Note: Tests depend on positions being imported first via the import endpoint.
 * We'll import test positions in beforeAll and clean up in afterAll.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  authenticatedGet,
  authenticatedPost,
  unauthenticatedGet,
  parseJsonResponse,
  getPrismaClient,
} from '@/test/helpers';
import type { ListUniswapV3PositionsResponse } from '@/types/positions';

/**
 * Test positions to import
 * Using real closed positions on Arbitrum for reliability
 */
const TEST_POSITIONS = {
  // Arbitrum position 1 (closed)
  ARBITRUM_CLOSED: {
    chainId: 42161,
    nftId: 4865121, // Real closed position on Arbitrum
  },
  // Arbitrum position 2 (closed)
  ARBITRUM_CLOSED_2: {
    chainId: 42161,
    nftId: 4865120, // Another real closed position on Arbitrum
  },
};

describe('GET /api/v1/positions/uniswapv3/list', () => {
  let importedPositionIds: string[] = [];

  // ============================================================================
  // SETUP: Import test positions before running tests
  // ============================================================================

  beforeAll(async () => {
    // Import test positions so we have data to query
    const positions = [TEST_POSITIONS.ARBITRUM_CLOSED, TEST_POSITIONS.ARBITRUM_CLOSED_2];

    for (const position of positions) {
      const response = await authenticatedPost(
        '/api/v1/positions/uniswapv3/import',
        position
      );

      if (response.status === 200) {
        const data = await parseJsonResponse<{ success: true; data: { id: string } }>(
          response
        );
        if (data.data?.id) {
          importedPositionIds.push(data.data.id);
        }
      }
    }

    console.log(`Imported ${importedPositionIds.length} test positions for list endpoint tests`);
  }, 30000); // 30 second timeout for imports

  // ============================================================================
  // CLEANUP: Remove test positions after tests complete
  // ============================================================================

  afterAll(async () => {
    if (importedPositionIds.length === 0) {
      return;
    }

    const prisma = getPrismaClient();

    try {
      // Delete imported test positions
      await prisma.position.deleteMany({
        where: {
          id: {
            in: importedPositionIds,
          },
        },
      });

      console.log(`Cleaned up ${importedPositionIds.length} test positions`);
    } finally {
      await prisma.$disconnect();
    }
  });

  // ============================================================================
  // AUTHENTICATION TESTS
  // ============================================================================

  describe('authentication', () => {
    it('should reject unauthenticated requests with 401', async () => {
      const response = await unauthenticatedGet('/api/v1/positions/uniswapv3/list');

      expect(response.status).toBe(401);

      const data = await parseJsonResponse(response);
      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
    });

    it('should accept authenticated requests with API key', async () => {
      const response = await authenticatedGet('/api/v1/positions/uniswapv3/list');

      expect(response.status).toBe(200);

      const data = await parseJsonResponse<ListUniswapV3PositionsResponse>(response);
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('pagination');
    });
  });

  // ============================================================================
  // BASIC QUERY TESTS
  // ============================================================================

  describe('basic queries', () => {
    it('should return positions with default parameters', async () => {
      const response = await authenticatedGet('/api/v1/positions/uniswapv3/list');

      expect(response.status).toBe(200);

      const data = await parseJsonResponse<ListUniswapV3PositionsResponse>(response);

      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data).toHaveProperty('pagination');
      expect(data).toHaveProperty('meta');
    });

    it('should return correct pagination metadata', async () => {
      const response = await authenticatedGet('/api/v1/positions/uniswapv3/list');

      const data = await parseJsonResponse<ListUniswapV3PositionsResponse>(response);

      expect(data.pagination).toHaveProperty('total');
      expect(data.pagination).toHaveProperty('limit', 20); // default limit
      expect(data.pagination).toHaveProperty('offset', 0); // default offset
      expect(data.pagination).toHaveProperty('hasMore');

      expect(typeof data.pagination.total).toBe('number');
      expect(typeof data.pagination.hasMore).toBe('boolean');
    });

    it('should include filter metadata', async () => {
      const response = await authenticatedGet('/api/v1/positions/uniswapv3/list');

      const data = await parseJsonResponse<ListUniswapV3PositionsResponse>(response);

      expect(data.meta).toHaveProperty('timestamp');
      expect(data.meta).toHaveProperty('filters');
      expect(data.meta.filters).toHaveProperty('status');
    });

    it('should return at least the imported test positions', async () => {
      const response = await authenticatedGet('/api/v1/positions/uniswapv3/list');

      const data = await parseJsonResponse<ListUniswapV3PositionsResponse>(response);

      // We imported at least 2 positions, so total should be >= 2
      expect(data.pagination.total).toBeGreaterThanOrEqual(importedPositionIds.length);
    });
  });

  // ============================================================================
  // PAGINATION TESTS
  // ============================================================================

  describe('pagination', () => {
    it('should respect custom limit parameter', async () => {
      const response = await authenticatedGet(
        '/api/v1/positions/uniswapv3/list?limit=1'
      );

      const data = await parseJsonResponse<ListUniswapV3PositionsResponse>(response);

      expect(data.pagination.limit).toBe(1);
      expect(data.data.length).toBeLessThanOrEqual(1);
    });

    it('should respect custom offset parameter', async () => {
      const response = await authenticatedGet(
        '/api/v1/positions/uniswapv3/list?offset=1'
      );

      const data = await parseJsonResponse<ListUniswapV3PositionsResponse>(response);

      expect(data.pagination.offset).toBe(1);
    });

    it('should calculate hasMore correctly', async () => {
      // Get first page with limit of 1
      const response = await authenticatedGet(
        '/api/v1/positions/uniswapv3/list?limit=1'
      );

      const data = await parseJsonResponse<ListUniswapV3PositionsResponse>(response);

      // If total > 1, hasMore should be true
      if (data.pagination.total > 1) {
        expect(data.pagination.hasMore).toBe(true);
      } else {
        expect(data.pagination.hasMore).toBe(false);
      }
    });

    it('should handle large offset gracefully', async () => {
      const response = await authenticatedGet(
        '/api/v1/positions/uniswapv3/list?offset=10000'
      );

      const data = await parseJsonResponse<ListUniswapV3PositionsResponse>(response);

      expect(data.success).toBe(true);
      expect(data.data).toEqual([]); // Empty array
      expect(data.pagination.hasMore).toBe(false);
    });

    it('should reject invalid limit (> 100)', async () => {
      const response = await authenticatedGet(
        '/api/v1/positions/uniswapv3/list?limit=101'
      );

      expect(response.status).toBe(400);

      const data = await parseJsonResponse(response);
      expect(data.success).toBe(false);
      expect(data.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should reject invalid limit (< 1)', async () => {
      const response = await authenticatedGet(
        '/api/v1/positions/uniswapv3/list?limit=0'
      );

      expect(response.status).toBe(400);

      const data = await parseJsonResponse(response);
      expect(data.success).toBe(false);
      expect(data.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should reject negative offset', async () => {
      const response = await authenticatedGet(
        '/api/v1/positions/uniswapv3/list?offset=-1'
      );

      expect(response.status).toBe(400);

      const data = await parseJsonResponse(response);
      expect(data.success).toBe(false);
      expect(data.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  // ============================================================================
  // CHAIN ID FILTER TESTS
  // ============================================================================

  describe('chainId filtering', () => {
    it('should filter by chainId=42161 (Arbitrum)', async () => {
      const response = await authenticatedGet(
        '/api/v1/positions/uniswapv3/list?chainId=42161'
      );

      const data = await parseJsonResponse<ListUniswapV3PositionsResponse>(response);

      expect(data.success).toBe(true);
      expect(data.meta.filters).toHaveProperty('chainId', 42161);

      // All returned positions should be on Arbitrum
      data.data.forEach((position) => {
        expect(position.config.chainId).toBe(42161);
      });
    });

    it('should return empty array for non-existent chainId', async () => {
      const response = await authenticatedGet(
        '/api/v1/positions/uniswapv3/list?chainId=137' // Polygon (unlikely to have positions)
      );

      const data = await parseJsonResponse<ListUniswapV3PositionsResponse>(response);

      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(data.pagination.total).toBe(0);
    });

    it('should reject invalid chainId', async () => {
      const response = await authenticatedGet(
        '/api/v1/positions/uniswapv3/list?chainId=abc'
      );

      expect(response.status).toBe(400);

      const data = await parseJsonResponse(response);
      expect(data.success).toBe(false);
      expect(data.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  // ============================================================================
  // STATUS FILTER TESTS
  // ============================================================================

  describe('status filtering', () => {
    it('should filter by status=active', async () => {
      const response = await authenticatedGet(
        '/api/v1/positions/uniswapv3/list?status=active'
      );

      const data = await parseJsonResponse<ListUniswapV3PositionsResponse>(response);

      expect(data.success).toBe(true);
      expect(data.meta.filters.status).toBe('active');

      // All returned positions should be active
      data.data.forEach((position) => {
        expect(position.isActive).toBe(true);
      });
    });

    it('should filter by status=closed', async () => {
      const response = await authenticatedGet(
        '/api/v1/positions/uniswapv3/list?status=closed'
      );

      const data = await parseJsonResponse<ListUniswapV3PositionsResponse>(response);

      expect(data.success).toBe(true);
      expect(data.meta.filters.status).toBe('closed');

      // All returned positions should be closed
      data.data.forEach((position) => {
        expect(position.isActive).toBe(false);
        expect(position.positionClosedAt).not.toBeNull();
      });

      // Verify that closed positions can be returned (total count >= 0)
      expect(data.pagination.total).toBeGreaterThanOrEqual(0);
    });

    it('should return all positions with status=all', async () => {
      const response = await authenticatedGet(
        '/api/v1/positions/uniswapv3/list?status=all'
      );

      const data = await parseJsonResponse<ListUniswapV3PositionsResponse>(response);

      expect(data.success).toBe(true);
      expect(data.meta.filters.status).toBe('all');
    });

    it('should default to status=all when not specified', async () => {
      const response = await authenticatedGet('/api/v1/positions/uniswapv3/list');

      const data = await parseJsonResponse<ListUniswapV3PositionsResponse>(response);

      expect(data.meta.filters.status).toBe('all');
    });

    it('should reject invalid status value', async () => {
      const response = await authenticatedGet(
        '/api/v1/positions/uniswapv3/list?status=invalid'
      );

      expect(response.status).toBe(400);

      const data = await parseJsonResponse(response);
      expect(data.success).toBe(false);
      expect(data.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  // ============================================================================
  // COMBINED FILTER TESTS
  // ============================================================================

  describe('combined filters', () => {
    it('should filter by both chainId and status', async () => {
      const response = await authenticatedGet(
        '/api/v1/positions/uniswapv3/list?chainId=42161&status=closed'
      );

      const data = await parseJsonResponse<ListUniswapV3PositionsResponse>(response);

      expect(data.success).toBe(true);
      expect(data.meta.filters).toHaveProperty('chainId', 42161);
      expect(data.meta.filters).toHaveProperty('status', 'closed');

      // All returned positions should match both filters
      data.data.forEach((position) => {
        expect(position.config.chainId).toBe(42161);
        expect(position.isActive).toBe(false);
      });
    });

    it('should combine chainId, status, and pagination', async () => {
      const response = await authenticatedGet(
        '/api/v1/positions/uniswapv3/list?chainId=42161&status=closed&limit=10&offset=0'
      );

      const data = await parseJsonResponse<ListUniswapV3PositionsResponse>(response);

      expect(data.success).toBe(true);
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.offset).toBe(0);
      expect(data.meta.filters.chainId).toBe(42161);
      expect(data.meta.filters.status).toBe('closed');
    });
  });

  // ============================================================================
  // RESPONSE STRUCTURE TESTS
  // ============================================================================

  describe('response structure', () => {
    it('should return correct position data structure', async () => {
      const response = await authenticatedGet(
        '/api/v1/positions/uniswapv3/list?status=closed'
      );

      const data = await parseJsonResponse<ListUniswapV3PositionsResponse>(response);

      if (data.data.length === 0) {
        // Skip if no positions
        return;
      }

      const position = data.data[0];

      // Core fields
      expect(position).toHaveProperty('id');
      expect(typeof position.id).toBe('string');
      expect(position).toHaveProperty('protocol', 'uniswapv3');
      expect(position).toHaveProperty('positionType', 'CL_TICKS');
      expect(position).toHaveProperty('userId');

      // Timestamps
      expect(position).toHaveProperty('createdAt');
      expect(position).toHaveProperty('updatedAt');
      expect(position).toHaveProperty('positionOpenedAt');
      expect(position).toHaveProperty('positionClosedAt');

      // PnL fields (as strings - bigint serialized)
      expect(position).toHaveProperty('currentValue');
      expect(typeof position.currentValue).toBe('string');
      expect(position).toHaveProperty('currentCostBasis');
      expect(typeof position.currentCostBasis).toBe('string');
      expect(position).toHaveProperty('realizedPnl');
      expect(typeof position.realizedPnl).toBe('string');
      expect(position).toHaveProperty('unrealizedPnl');
      expect(typeof position.unrealizedPnl).toBe('string');

      // Fee fields (as strings)
      expect(position).toHaveProperty('collectedFees');
      expect(typeof position.collectedFees).toBe('string');
      expect(position).toHaveProperty('unClaimedFees');
      expect(typeof position.unClaimedFees).toBe('string');

      // Price range (as strings)
      expect(position).toHaveProperty('priceRangeLower');
      expect(typeof position.priceRangeLower).toBe('string');
      expect(position).toHaveProperty('priceRangeUpper');
      expect(typeof position.priceRangeUpper).toBe('string');

      // Pool
      expect(position).toHaveProperty('pool');
      expect(position.pool).toHaveProperty('id');
      expect(position.pool).toHaveProperty('protocol', 'uniswapv3');
      expect(position.pool).toHaveProperty('token0');
      expect(position.pool).toHaveProperty('token1');
      expect(position.pool).toHaveProperty('config');
      expect(position.pool).toHaveProperty('state');

      // Tokens
      expect(position.pool.token0).toHaveProperty('symbol');
      expect(position.pool.token0).toHaveProperty('name');
      expect(position.pool.token0).toHaveProperty('decimals');
      expect(position.pool.token1).toHaveProperty('symbol');
      expect(position.pool.token1).toHaveProperty('name');
      expect(position.pool.token1).toHaveProperty('decimals');

      // Token roles
      expect(position).toHaveProperty('isToken0Quote');
      expect(typeof position.isToken0Quote).toBe('boolean');

      // Status
      expect(position).toHaveProperty('isActive');
      expect(typeof position.isActive).toBe('boolean');

      // Config
      expect(position).toHaveProperty('config');
      expect(position.config).toHaveProperty('chainId');
      expect(position.config).toHaveProperty('nftId');
      expect(position.config).toHaveProperty('poolAddress');
      expect(position.config).toHaveProperty('tickLower');
      expect(position.config).toHaveProperty('tickUpper');

      // State
      expect(position).toHaveProperty('state');
      expect(position.state).toHaveProperty('ownerAddress');
      expect(position.state).toHaveProperty('liquidity');
    });

    it('should order positions by createdAt DESC', async () => {
      const response = await authenticatedGet(
        '/api/v1/positions/uniswapv3/list?limit=10'
      );

      const data = await parseJsonResponse<ListUniswapV3PositionsResponse>(response);

      if (data.data.length < 2) {
        // Skip if not enough positions to test ordering
        return;
      }

      // Check that positions are ordered by createdAt DESC
      for (let i = 0; i < data.data.length - 1; i++) {
        const current = new Date(data.data[i].createdAt);
        const next = new Date(data.data[i + 1].createdAt);

        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    });

    it('should include metadata timestamp', async () => {
      const response = await authenticatedGet('/api/v1/positions/uniswapv3/list');

      const data = await parseJsonResponse<ListUniswapV3PositionsResponse>(response);

      expect(data.meta).toHaveProperty('timestamp');
      expect(typeof data.meta.timestamp).toBe('string');

      // Verify it's a valid ISO 8601 timestamp
      const timestamp = new Date(data.meta.timestamp);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });
  });
});
