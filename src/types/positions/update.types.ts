/**
 * Position Update Endpoint Types
 *
 * PATCH /api/v1/positions/uniswapv3/{chainId}/{nftId}
 *
 * Allows authenticated users to append new events to their position's ledger
 * after executing on-chain transactions (INCREASE_LIQUIDITY, DECREASE_LIQUIDITY, COLLECT).
 *
 * Uses shared types from @midcurve/shared with bigint → string conversion for JSON.
 */

import type { ApiResponse, BigIntToString } from '../common';
import type { UniswapV3Position } from '@midcurve/shared';

/**
 * Event type for Uniswap V3 position events
 *
 * Maps to on-chain NonfungiblePositionManager contract events:
 * - INCREASE_LIQUIDITY: IncreaseLiquidity event
 * - DECREASE_LIQUIDITY: DecreaseLiquidity event
 * - COLLECT: Collect event
 */
export type UniswapV3EventType = 'INCREASE_LIQUIDITY' | 'DECREASE_LIQUIDITY' | 'COLLECT';

/**
 * User-provided event data from transaction receipt
 *
 * This represents raw event data from the NonfungiblePositionManager contract.
 * The service layer will calculate all financial fields (poolPrice, costBasis, PnL).
 */
export interface UpdateUniswapV3PositionEvent {
  /**
   * Event type from the transaction receipt
   * @example "INCREASE_LIQUIDITY"
   */
  eventType: UniswapV3EventType;

  /**
   * Block timestamp when the event occurred
   * ISO 8601 date string
   *
   * @example "2024-01-20T15:30:00.000Z"
   */
  timestamp: string;

  /**
   * Block number where the event occurred
   * bigint as string
   *
   * @example "175500000"
   */
  blockNumber: string;

  /**
   * Transaction index within the block
   * Used for event ordering
   *
   * @example 50
   */
  transactionIndex: number;

  /**
   * Log index within the transaction
   * Used for event ordering
   *
   * @example 3
   */
  logIndex: number;

  /**
   * Transaction hash
   * For reference and duplicate detection
   *
   * @example "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
   */
  transactionHash: string;

  /**
   * Liquidity delta (INCREASE_LIQUIDITY, DECREASE_LIQUIDITY only)
   * bigint as string
   * REQUIRED for INCREASE_LIQUIDITY and DECREASE_LIQUIDITY
   * MUST be omitted or "0" for COLLECT
   *
   * @example "500000000000000000"
   */
  liquidity?: string;

  /**
   * Amount of token0 in the event
   * bigint as string (in smallest token units)
   *
   * For INCREASE/DECREASE: amount deposited/withdrawn
   * For COLLECT: amount collected (fees + principal)
   *
   * @example "250000000"
   */
  amount0: string;

  /**
   * Amount of token1 in the event
   * bigint as string (in smallest token units)
   *
   * For INCREASE/DECREASE: amount deposited/withdrawn
   * For COLLECT: amount collected (fees + principal)
   *
   * @example "125000000000000000"
   */
  amount1: string;

  /**
   * Recipient address (COLLECT only)
   * EIP-55 checksummed address
   * REQUIRED for COLLECT events
   * MUST be omitted for INCREASE_LIQUIDITY and DECREASE_LIQUIDITY
   *
   * @example "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
   */
  recipient?: string;
}

/**
 * PATCH /api/v1/positions/uniswapv3/{chainId}/{nftId} - Request body
 *
 * Array of events to append to the position's ledger.
 * Events must be chronologically AFTER existing events (blockNumber → txIndex → logIndex).
 */
export interface UpdateUniswapV3PositionRequest {
  /**
   * Array of events to add to the position
   * Events will be sorted and processed in blockchain order
   * Must all come AFTER existing events in the ledger
   *
   * @minItems 1
   */
  events: UpdateUniswapV3PositionEvent[];
}

/**
 * Position data for API response
 *
 * Based on UniswapV3Position from @midcurve/shared with:
 * - bigint fields converted to strings (for JSON serialization)
 * - Date fields converted to ISO 8601 strings
 * - Fully nested pool and token objects
 */
export type UpdateUniswapV3PositionData = BigIntToString<UniswapV3Position>;

/**
 * PATCH /api/v1/positions/uniswapv3/{chainId}/{nftId} - Response
 *
 * Returns the fully updated position with refreshed on-chain state
 * and recalculated financial fields.
 */
export type UpdateUniswapV3PositionResponse = ApiResponse<UpdateUniswapV3PositionData>;
