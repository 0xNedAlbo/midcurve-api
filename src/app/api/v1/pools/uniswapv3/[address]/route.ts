/**
 * Uniswap V3 Pool Lookup Endpoint
 *
 * GET /api/v1/pools/uniswapv3/:address - Get pool by address with fresh state
 *
 * Authentication: Required (session or API key)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/with-auth';
import { UniswapV3PoolService, UniswapV3SubgraphClient } from '@midcurve/services';
import type { UniswapV3Pool } from '@midcurve/shared';
import {
  createSuccessResponse,
  createErrorResponse,
  ApiErrorCode,
  ErrorCodeToHttpStatus,
} from '@/types/common';
import {
  GetUniswapV3PoolParamsSchema,
  GetUniswapV3PoolQuerySchema,
  type GetUniswapV3PoolData,
} from '@/types/pools';
import { serializeUniswapV3Pool } from '@/lib/serializers';
import { apiLogger, apiLog } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const poolService = new UniswapV3PoolService();
const subgraphClient = UniswapV3SubgraphClient.getInstance();

/**
 * GET /api/v1/pools/uniswapv3/:address
 *
 * Retrieves a Uniswap V3 pool by its contract address with fresh on-chain state.
 * Always returns current price, liquidity, and tick data.
 *
 * Path params:
 * - address (required): Pool contract address (0x...)
 *
 * Query params:
 * - chainId (required): EVM chain ID (e.g., 1, 42161, 8453)
 * - enrichMetrics (optional): Include subgraph metrics (TVL, volume, fees). Defaults to false.
 *
 * Example:
 * GET /api/v1/pools/uniswapv3/0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443?chainId=42161&enrichMetrics=true
 *
 * Returns:
 * - Pool data with fresh on-chain state (price, liquidity, tick)
 * - Optional subgraph metrics if enrichMetrics=true
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
): Promise<Response> {
  return withAuth(request, async (_user, requestId) => {
    const startTime = Date.now();

    try {
      // 1. Await and parse path params (Next.js 15 requires Promise)
      const { address } = await params;
      const paramsResult = GetUniswapV3PoolParamsSchema.safeParse({
        address,
      });

      if (!paramsResult.success) {
        apiLog.validationError(apiLogger, requestId, paramsResult.error.errors);

        const errorResponse = createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          'Invalid pool address format',
          paramsResult.error.errors
        );

        apiLog.requestEnd(apiLogger, requestId, 400, Date.now() - startTime);

        return NextResponse.json(errorResponse, {
          status: ErrorCodeToHttpStatus[ApiErrorCode.VALIDATION_ERROR],
        });
      }

      // Address is already available from line 62
      // const { address } = paramsResult.data; // Not needed - already destructured above

      // 2. Parse and validate query params
      const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
      const queryResult = GetUniswapV3PoolQuerySchema.safeParse(searchParams);

      if (!queryResult.success) {
        apiLog.validationError(apiLogger, requestId, queryResult.error.errors);

        const errorResponse = createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          'Invalid query parameters',
          queryResult.error.errors
        );

        apiLog.requestEnd(apiLogger, requestId, 400, Date.now() - startTime);

        return NextResponse.json(errorResponse, {
          status: ErrorCodeToHttpStatus[ApiErrorCode.VALIDATION_ERROR],
        });
      }

      const { chainId, enrichMetrics } = queryResult.data;

      // Log request (no dedicated request log method, done inline)

      // 3. Discover pool (creates if new, refreshes if existing)
      // This ensures we always return fresh on-chain state
      let pool;
      try {
        pool = await poolService.discover({
          poolAddress: address,
          chainId,
        });
      } catch (error) {
        // Handle specific error cases
        if (error instanceof Error) {
          // Pool not found or not a valid Uniswap V3 pool
          if (
            error.message.includes('Invalid pool address') ||
            error.message.includes('does not implement')
          ) {
            const errorResponse = createErrorResponse(
              ApiErrorCode.NOT_FOUND,
              `Pool not found at address ${address} on chain ${chainId}`
            );

            apiLog.requestEnd(apiLogger, requestId, 404, Date.now() - startTime);

            return NextResponse.json(errorResponse, {
              status: ErrorCodeToHttpStatus[ApiErrorCode.NOT_FOUND],
            });
          }

          // Chain not supported
          if (error.message.includes('not configured') || error.message.includes('not supported')) {
            const errorResponse = createErrorResponse(
              ApiErrorCode.BAD_REQUEST,
              error.message
            );

            apiLog.requestEnd(apiLogger, requestId, 400, Date.now() - startTime);

            return NextResponse.json(errorResponse, {
              status: ErrorCodeToHttpStatus[ApiErrorCode.BAD_REQUEST],
            });
          }

          // RPC or on-chain read failure
          if (error.message.includes('Failed to read')) {
            const errorResponse = createErrorResponse(
              ApiErrorCode.BAD_GATEWAY,
              'Failed to read pool data from blockchain',
              error.message
            );

            apiLog.requestEnd(apiLogger, requestId, 502, Date.now() - startTime);

            return NextResponse.json(errorResponse, {
              status: ErrorCodeToHttpStatus[ApiErrorCode.BAD_GATEWAY],
            });
          }
        }

        // Unknown error
        throw error;
      }

      // 4. Optionally enrich with subgraph metrics
      let metrics;
      if (enrichMetrics) {
        try {
          const poolMetrics = await subgraphClient.getPoolMetrics(chainId, address);
          metrics = {
            tvlUSD: poolMetrics.tvlUSD,
            volumeUSD: poolMetrics.volumeUSD,
            feesUSD: poolMetrics.feesUSD,
          };
        } catch (error) {
          // Graceful degradation: log warning but don't fail request
          apiLogger.warn(
            { requestId, chainId, address, error },
            'Failed to fetch subgraph metrics, proceeding without metrics'
          );
          // metrics remains undefined
        }
      }

      // 5. Serialize pool (convert BigInt to strings)
      const serializedPool = serializeUniswapV3Pool(pool);

      // 6. Build response
      // Note: serializedPool has bigints/dates as strings for JSON compatibility
      // The type cast is safe because the serialized structure matches UniswapV3Pool
      const responseData: GetUniswapV3PoolData = {
        pool: serializedPool as unknown as UniswapV3Pool,
        ...(metrics && { metrics }),
      };

      const response = createSuccessResponse(responseData, {
        poolId: pool.id,
        address: pool.config.address,
        chainId,
        hasMetrics: !!metrics,
      });

      apiLog.requestEnd(apiLogger, requestId, 200, Date.now() - startTime);

      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      // Unhandled error
      apiLog.methodError(
        apiLogger,
        'GET /api/v1/pools/uniswapv3/:address',
        error,
        { requestId }
      );

      const errorResponse = createErrorResponse(
        ApiErrorCode.INTERNAL_SERVER_ERROR,
        'An unexpected error occurred'
      );

      apiLog.requestEnd(apiLogger, requestId, 500, Date.now() - startTime);

      return NextResponse.json(errorResponse, {
        status: ErrorCodeToHttpStatus[ApiErrorCode.INTERNAL_SERVER_ERROR],
      });
    }
  });
}
