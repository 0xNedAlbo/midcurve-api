/**
 * Position List Endpoint Types
 *
 * Types for listing user's positions across all protocols with pagination,
 * filtering, and sorting.
 */

import type { BigIntToString, PaginatedResponse } from '../common';
import type { AnyPosition } from '@midcurve/shared';

/**
 * Position status filter options
 */
export type PositionStatus = 'active' | 'closed' | 'all';

/**
 * Sort field options
 */
export type PositionSortBy =
  | 'createdAt'
  | 'positionOpenedAt'
  | 'currentValue'
  | 'unrealizedPnl';

/**
 * Sort direction options
 */
export type SortDirection = 'asc' | 'desc';

/**
 * GET /api/v1/positions/list - Query parameters
 */
export interface ListPositionsParams {
  /**
   * Filter by protocol(s)
   * Can be a single protocol or multiple protocols
   * @example ['uniswapv3', 'orca']
   */
  protocols?: string[];

  /**
   * Filter by position status
   * - 'active': Only active positions (isActive = true)
   * - 'closed': Only closed positions (isActive = false)
   * - 'all': All positions (no filter)
   * @default 'all'
   */
  status?: PositionStatus;

  /**
   * Sort field
   * @default 'createdAt'
   */
  sortBy?: PositionSortBy;

  /**
   * Sort direction
   * @default 'desc'
   */
  sortDirection?: SortDirection;

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
 * Based on AnyPosition from @midcurve/shared with:
 * - bigint fields converted to strings (for JSON serialization)
 * - Date fields converted to ISO 8601 strings
 * - Fully nested pool and token objects
 * - Config and state as unknown (not protocol-specific)
 */
export type ListPositionData = BigIntToString<AnyPosition>;

/**
 * GET /api/v1/positions/list - Response
 */
export type ListPositionsResponse = PaginatedResponse<ListPositionData> & {
  meta: {
    timestamp: string;
    filters: {
      protocols?: string[];
      status: PositionStatus;
      sortBy: PositionSortBy;
      sortDirection: SortDirection;
    };
  };
};
