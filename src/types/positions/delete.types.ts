/**
 * DELETE /api/v1/positions/uniswapv3/:chainId/:nftId
 *
 * Deletes a specific Uniswap V3 position owned by the authenticated user.
 * Idempotent - returns success even if the position doesn't exist.
 */

/**
 * Path parameters for deleting a specific Uniswap V3 position
 */
export interface DeleteUniswapV3PositionParams {
  /** EVM chain ID (e.g., 1 for Ethereum mainnet) */
  chainId: string;
  /** Uniswap V3 NFT token ID (positive integer) */
  nftId: string;
}

/**
 * Success response for DELETE /api/v1/positions/uniswapv3/:chainId/:nftId
 *
 * Returns an empty data object on successful deletion (or if position didn't exist).
 * The endpoint is idempotent.
 */
export interface DeleteUniswapV3PositionResponse {
  /** Empty object indicating successful deletion */
  [key: string]: never;
}
