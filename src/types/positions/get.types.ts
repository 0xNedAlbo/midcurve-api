import type { UniswapV3Position } from '@midcurve/shared';
import type { BigIntToString } from '../common';

/**
 * GET /api/v1/positions/uniswapv3/:chainId/:nftId
 *
 * Fetches a specific Uniswap V3 position owned by the authenticated user
 * and refreshes its state from on-chain data.
 */

/**
 * Path parameters for fetching a specific Uniswap V3 position
 */
export interface GetUniswapV3PositionParams {
  /** EVM chain ID (e.g., 1 for Ethereum mainnet) */
  chainId: string;
  /** Uniswap V3 NFT token ID */
  nftId: string;
}

/**
 * Success response for GET /api/v1/positions/uniswapv3/:chainId/:nftId
 *
 * Returns the complete position data with all bigint fields converted to strings for JSON serialization.
 * The position state is refreshed from on-chain data before being returned.
 */
export type GetUniswapV3PositionResponse = BigIntToString<UniswapV3Position>;
