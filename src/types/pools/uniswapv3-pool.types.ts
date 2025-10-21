/**
 * Type definitions for Uniswap V3 Pool Lookup Endpoint
 *
 * GET /api/pools/uniswapv3/:address
 */

import type { UniswapV3Pool } from '@midcurve/shared';

/**
 * Path parameters for pool lookup
 */
export interface GetUniswapV3PoolParams {
  /**
   * Pool contract address (EIP-55 checksummed or lowercase)
   * @example "0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443"
   */
  address: string;
}

/**
 * Query parameters for pool lookup
 */
export interface GetUniswapV3PoolQuery {
  /**
   * EVM chain ID where the pool is deployed
   * @example 1 (Ethereum), 42161 (Arbitrum), 8453 (Base)
   */
  chainId: number;

  /**
   * Whether to enrich response with subgraph metrics (TVL, volume, fees)
   * Defaults to false if not provided
   * @example true
   */
  enrichMetrics?: boolean;
}

/**
 * Response data for pool lookup
 *
 * Includes pool with fresh on-chain state and optional subgraph metrics
 */
export interface GetUniswapV3PoolData {
  /**
   * Pool data with fresh on-chain state
   * State (price, liquidity, tick) is always current
   */
  pool: UniswapV3Pool;

  /**
   * Optional subgraph metrics (only included if enrichMetrics=true)
   * Includes 24-hour TVL, volume, and fees data
   */
  metrics?: {
    /**
     * Total Value Locked in USD
     * @example "1234567.89"
     */
    tvlUSD: string;

    /**
     * 24-hour trading volume in USD
     * @example "567890.12"
     */
    volumeUSD: string;

    /**
     * 24-hour fees collected in USD
     * @example "1234.56"
     */
    feesUSD: string;
  };
}
