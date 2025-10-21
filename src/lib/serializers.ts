/**
 * Serialization Utilities
 *
 * Helper functions to convert domain types from @midcurve/shared to JSON-serializable formats.
 * Primarily handles bigint conversion to strings for JSON compatibility.
 */

import type {
  UniswapV3Pool,
  UniswapV3PoolState,
  Erc20Token,
  PoolDiscoveryResult,
} from '@midcurve/shared';

/**
 * Serialize UniswapV3Pool for JSON response
 *
 * Converts all bigint fields in pool state to strings for JSON compatibility.
 *
 * @param pool - UniswapV3Pool from service layer
 * @returns JSON-serializable pool object
 */
export function serializeUniswapV3Pool(pool: UniswapV3Pool) {
  return {
    id: pool.id,
    protocol: pool.protocol,
    poolType: pool.poolType,
    token0: serializeErc20Token(pool.token0),
    token1: serializeErc20Token(pool.token1),
    feeBps: pool.feeBps,
    config: pool.config, // No bigints in config
    state: serializeUniswapV3PoolState(pool.state),
    createdAt: pool.createdAt.toISOString(),
    updatedAt: pool.updatedAt.toISOString(),
  };
}

/**
 * Serialize UniswapV3PoolState for JSON response
 *
 * Converts bigint fields (sqrtPriceX96, liquidity, feeGrowth) to strings.
 *
 * @param state - Pool state with bigint fields
 * @returns JSON-serializable state object
 */
export function serializeUniswapV3PoolState(state: UniswapV3PoolState) {
  return {
    sqrtPriceX96: state.sqrtPriceX96.toString(),
    liquidity: state.liquidity.toString(),
    currentTick: state.currentTick,
    feeGrowthGlobal0: state.feeGrowthGlobal0.toString(),
    feeGrowthGlobal1: state.feeGrowthGlobal1.toString(),
  };
}

/**
 * Serialize Erc20Token for JSON response
 *
 * Converts Date fields to ISO strings.
 * No bigint fields in token type.
 *
 * @param token - Erc20Token from service layer
 * @returns JSON-serializable token object
 */
export function serializeErc20Token(token: Erc20Token) {
  return {
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
  };
}

/**
 * Serialize PoolDiscoveryResult for JSON response
 *
 * Converts the full pool discovery result including nested pool data.
 * Handles all bigint conversions in pool state.
 *
 * @param result - PoolDiscoveryResult from service layer
 * @returns JSON-serializable discovery result
 */
export function serializePoolDiscoveryResult(
  result: PoolDiscoveryResult<'uniswapv3'>
) {
  return {
    poolName: result.poolName,
    fee: result.fee,
    protocol: result.protocol,
    tvlUSD: result.tvlUSD,
    volumeUSD: result.volumeUSD,
    feesUSD: result.feesUSD,
    pool: serializeUniswapV3Pool(result.pool),
  };
}
