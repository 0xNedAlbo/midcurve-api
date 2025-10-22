/**
 * Position APR Period Types
 *
 * Types for the GET /api/v1/positions/uniswapv3/:chainId/:nftId/apr endpoint
 *
 * Returns ordered list of APR periods for a position (descending by startTimestamp)
 */

import type { ApiResponse } from '../common/api-response';

/**
 * Serialized APR period data for API response
 *
 * This is the JSON-serializable version of PositionAprPeriod from @midcurve/shared
 * All bigint fields are converted to strings for JSON compatibility
 */
export interface AprPeriodData {
  // Database fields
  id: string;
  createdAt: string;
  updatedAt: string;

  // Position reference
  positionId: string;

  // Period boundaries (linked to ledger events)
  startEventId: string;
  endEventId: string;

  // Time range
  startTimestamp: string;
  endTimestamp: string;
  durationSeconds: number;

  // Financial metrics (bigint → string)
  costBasis: string;
  collectedFeeValue: string;

  // APR metric
  aprBps: number;

  // Debugging/auditing
  eventCount: number;
}

/**
 * Path parameters for APR endpoint
 */
export interface AprPathParams {
  chainId: string;
  nftId: string;
}

/**
 * Response type for APR endpoint
 */
export interface AprPeriodsResponse extends ApiResponse<AprPeriodData[]> {
  meta?: {
    timestamp: string;
    count: number;
    requestId?: string;
  };
}
