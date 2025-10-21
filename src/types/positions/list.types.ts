/**
 * Position List Endpoint Types
 *
 * Types for listing user's Uniswap V3 positions with pagination and filtering.
 */

import type { BigIntToString, PaginatedResponse } from '../common';
import type { UniswapV3Position } from '@midcurve/shared';

/**
 * Position status filter options
 */
export type PositionStatus = 'active' | 'closed' | 'all';

/**
 * GET /api/v1/positions/uniswapv3/list - Query parameters
 */
export interface ListUniswapV3PositionsParams {
  /**
   * Filter by EVM chain ID
   * @example 1 (Ethereum), 42161 (Arbitrum), 8453 (Base)
   */
  chainId?: number;

  /**
   * Filter by position status
   * - 'active': Only active positions (isActive = true)
   * - 'closed': Only closed positions (isActive = false)
   * - 'all': All positions (no filter)
   * @default 'all'
   */
  status?: PositionStatus;

  /**
   * Number of results per page
   * @minimum 1
   * @maximum 100
   * @default 20
   */
  limit?: number;

  /**
   * Pagination offset
   * @minimum 0
   * @default 0
   */
  offset?: number;
}

/**
 * Position data for API response
 *
 * Based on UniswapV3Position from @midcurve/shared with:
 * - bigint fields converted to strings (for JSON serialization)
 * - Date fields converted to ISO 8601 strings
 * - Fully nested pool and token objects
 */
export type ListUniswapV3PositionData = BigIntToString<UniswapV3Position>;

/**
 * GET /api/v1/positions/uniswapv3/list - Response
 */
export type ListUniswapV3PositionsResponse = PaginatedResponse<ListUniswapV3PositionData> & {
  meta: {
    timestamp: string;
    filters: {
      chainId?: number;
      status: PositionStatus;
    };
  };
};
