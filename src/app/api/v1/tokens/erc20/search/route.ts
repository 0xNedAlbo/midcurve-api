/**
 * ERC-20 Token Search Endpoint
 *
 * GET /api/v1/tokens/erc20/search - Search tokens
 *
 * Authentication: Required (session or API key)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/with-auth';
import { Erc20TokenService } from '@midcurve/services';
import {
  createSuccessResponse,
  createErrorResponse,
  ApiErrorCode,
  ErrorCodeToHttpStatus,
} from '@/types/common';
import { SearchErc20TokensQuerySchema } from '@/types/tokens';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const erc20TokenService = new Erc20TokenService();

/**
 * GET /api/v1/tokens/erc20/search
 *
 * Search for ERC-20 tokens within a specific chain by symbol and/or name.
 * Returns up to 10 results, ordered alphabetically by symbol.
 *
 * Query params:
 * - chainId (required): EVM chain ID
 * - symbol (optional): Partial symbol match (case-insensitive)
 * - name (optional): Partial name match (case-insensitive)
 * - At least one of symbol or name must be provided
 *
 * Example:
 * GET /api/v1/tokens/erc20/search?chainId=1&symbol=usd
 *
 * Returns: Array of matching tokens (max 10 results, no pagination)
 */
export async function GET(request: NextRequest): Promise<Response> {
  return withAuth(request, async (_user) => {
    try {
      // Parse query params
      const { searchParams } = new URL(request.url);
      const queryParams = {
        chainId: searchParams.get('chainId'),
        symbol: searchParams.get('symbol') || undefined,
        name: searchParams.get('name') || undefined,
      };

      // Validate query params
      const validation = SearchErc20TokensQuerySchema.safeParse(queryParams);

      if (!validation.success) {
        const errorResponse = createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          'Invalid query parameters',
          validation.error.errors
        );
        return NextResponse.json(errorResponse, {
          status: ErrorCodeToHttpStatus[ApiErrorCode.VALIDATION_ERROR],
        });
      }

      const { chainId, symbol, name } = validation.data;

      // Search tokens via service
      const tokens = await erc20TokenService.searchTokens({
        chainId,
        symbol,
        name,
      });

      // Convert to API response format
      const tokensData = tokens.map((token) => ({
        id: token.id,
        tokenType: token.tokenType,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        logoUrl: token.logoUrl,
        coingeckoId: token.coingeckoId,
        marketCap: token.marketCap,
        config: token.config,
        createdAt: token.createdAt.toISOString(),
        updatedAt: token.updatedAt.toISOString(),
      }));

      const response = createSuccessResponse(tokensData, {
        count: tokensData.length,
        limit: 10,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      console.error('Search ERC-20 tokens error:', error);

      // Map service errors to API error codes
      if (error instanceof Error) {
        if (error.message.includes('at least one')) {
          const errorResponse = createErrorResponse(
            ApiErrorCode.VALIDATION_ERROR,
            'At least one search parameter (symbol or name) required',
            error.message
          );
          return NextResponse.json(errorResponse, {
            status: ErrorCodeToHttpStatus[ApiErrorCode.VALIDATION_ERROR],
          });
        }
      }

      // Generic error
      const errorResponse = createErrorResponse(
        ApiErrorCode.INTERNAL_SERVER_ERROR,
        'Failed to search tokens',
        error instanceof Error ? error.message : String(error)
      );
      return NextResponse.json(errorResponse, {
        status: ErrorCodeToHttpStatus[ApiErrorCode.INTERNAL_SERVER_ERROR],
      });
    }
  });
}
