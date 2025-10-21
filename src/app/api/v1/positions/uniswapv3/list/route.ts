/**
 * Uniswap V3 Position List Endpoint
 *
 * GET /api/v1/positions/uniswapv3/list
 *
 * Authentication: Required (session or API key)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/with-auth';
import { UniswapV3PositionService } from '@midcurve/services';
import {
  createErrorResponse,
  ApiErrorCode,
  ErrorCodeToHttpStatus,
  createPaginatedResponse,
} from '@/types/common';
import { ListUniswapV3PositionsQuerySchema } from '@/types/positions';
import { serializeBigInt } from '@/lib/serializers';
import { apiLogger, apiLog } from '@/lib/logger';
import type {
  ListUniswapV3PositionData,
  ListUniswapV3PositionsResponse,
  PositionStatus,
} from '@/types/positions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const uniswapV3PositionService = new UniswapV3PositionService();

/**
 * GET /api/v1/positions/uniswapv3/list
 *
 * List user's Uniswap V3 positions with pagination and filtering.
 *
 * Features:
 * - Paginated results with offset-based pagination
 * - Filter by chain ID
 * - Filter by position status (active/closed/all)
 * - Sorted by creation date (newest first)
 *
 * Query parameters:
 * - chainId (optional): Filter by specific chain (e.g., 1, 42161, 8453)
 * - status (optional): Filter by status ('active', 'closed', 'all') - default: 'all'
 * - limit (optional): Results per page (1-100, default: 20)
 * - offset (optional): Pagination offset (>=0, default: 0)
 *
 * Returns: Paginated list of positions with full pool and token details
 *
 * Example response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "protocol": "uniswapv3",
 *       "currentValue": "1500000000",
 *       "pool": {
 *         "token0": { "symbol": "USDC", ... },
 *         "token1": { "symbol": "WETH", ... },
 *         ...
 *       },
 *       ...
 *     }
 *   ],
 *   "pagination": {
 *     "total": 150,
 *     "limit": 20,
 *     "offset": 0,
 *     "hasMore": true
 *   },
 *   "meta": {
 *     "timestamp": "2025-01-15T...",
 *     "filters": {
 *       "chainId": 1,
 *       "status": "active"
 *     }
 *   }
 * }
 */
export async function GET(request: NextRequest): Promise<Response> {
  return withAuth(request, async (user, requestId) => {
    const startTime = Date.now();

    try {
      // 1. Parse and validate query parameters
      const { searchParams } = new URL(request.url);
      const queryParams = {
        chainId: searchParams.get('chainId') ?? undefined,
        status: searchParams.get('status') ?? undefined,
        limit: searchParams.get('limit') ?? undefined,
        offset: searchParams.get('offset') ?? undefined,
      };

      const validation = ListUniswapV3PositionsQuerySchema.safeParse(queryParams);

      if (!validation.success) {
        apiLog.validationError(apiLogger, requestId, validation.error.errors);

        const errorResponse = createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          'Invalid query parameters',
          validation.error.errors
        );

        apiLog.requestEnd(apiLogger, requestId, 400, Date.now() - startTime);

        return NextResponse.json(errorResponse, {
          status: ErrorCodeToHttpStatus[ApiErrorCode.VALIDATION_ERROR],
        });
      }

      const { chainId, status, limit, offset } = validation.data;

      apiLog.businessOperation(apiLogger, requestId, 'list', 'positions', user.id, {
        chainId,
        status,
        limit,
        offset,
      });

      // 2. Query positions from service
      const { positions, total } = await uniswapV3PositionService.findMany(user.id, {
        chainId,
        status,
        limit,
        offset,
      });

      // 3. Serialize bigints to strings for JSON
      const serializedPositions = positions.map((position) =>
        serializeBigInt(position)
      ) as ListUniswapV3PositionData[];

      // 4. Create paginated response
      const response: ListUniswapV3PositionsResponse = {
        ...createPaginatedResponse(serializedPositions, total, limit, offset),
        meta: {
          timestamp: new Date().toISOString(),
          filters: {
            ...(chainId !== undefined && { chainId }),
            status: status as PositionStatus,
          },
        },
      };

      apiLogger.info(
        {
          requestId,
          count: positions.length,
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
        'Positions retrieved successfully'
      );

      apiLog.requestEnd(apiLogger, requestId, 200, Date.now() - startTime);

      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      apiLog.methodError(
        apiLogger,
        'GET /api/v1/positions/uniswapv3/list',
        error,
        { requestId }
      );

      // Generic error
      const errorResponse = createErrorResponse(
        ApiErrorCode.INTERNAL_SERVER_ERROR,
        'Failed to retrieve positions',
        error instanceof Error ? error.message : String(error)
      );
      apiLog.requestEnd(apiLogger, requestId, 500, Date.now() - startTime);
      return NextResponse.json(errorResponse, {
        status: ErrorCodeToHttpStatus[ApiErrorCode.INTERNAL_SERVER_ERROR],
      });
    }
  });
}
