/**
 * Position Create Endpoint Types
 *
 * PUT /api/v1/positions/uniswapv3/{chainId}/{nftId}
 *
 * Allows users to manually create a position from their transaction receipt
 * after sending an INCREASE_LIQUIDITY transaction on-chain.
 *
 * Uses shared types from @midcurve/shared with bigint → string conversion for JSON.
 */

import type { ApiResponse, BigIntToString } from '../common';
import type { UniswapV3Position } from '@midcurve/shared';

/**
 * PUT /api/v1/positions/uniswapv3/{chainId}/{nftId} - Request body
 *
 * The user provides data from their transaction receipt after creating a position on-chain.
 * This endpoint creates the position in the database and calculates PnL from the ledger event.
 */
export interface CreateUniswapV3PositionRequest {
  /**
   * Pool address on the blockchain
   * EIP-55 checksummed address
   *
   * @example "0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640" (USDC/WETH on Ethereum)
   */
  poolAddress: string;

  /**
   * Upper tick bound of the position's price range
   * @example 201120
   */
  tickUpper: number;

  /**
   * Lower tick bound of the position's price range
   * @example 199120
   */
  tickLower: number;

  /**
   * Owner address (wallet that owns the NFT)
   * EIP-55 checksummed address
   * This is the address that sent the INCREASE_LIQUIDITY transaction (msg.sender)
   *
   * @example "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
   */
  ownerAddress: string;

  /**
   * OPTIONAL: Address of the quote token (the token used as unit of account)
   *
   * If provided:
   * - Will be validated and normalized to EIP-55 checksum format
   * - Must match either token0 or token1 in the pool
   * - Service will use this address to determine isToken0Quote
   *
   * If omitted:
   * - Quote token will be determined automatically using QuoteTokenService
   * - Respects user preferences → chain defaults → token0 fallback
   *
   * @example "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" (USDC)
   */
  quoteTokenAddress?: string;

  /**
   * INCREASE_LIQUIDITY event data from the transaction receipt
   *
   * This event is emitted by the NonfungiblePositionManager contract when
   * liquidity is added to a position. All data is available in the transaction receipt.
   */
  increaseEvent: {
    /**
     * Block timestamp when the event occurred
     * ISO 8601 date string
     *
     * @example "2025-01-15T10:30:00Z"
     */
    timestamp: string;

    /**
     * Block number where the event occurred
     * bigint as string
     *
     * @example "12345678"
     */
    blockNumber: string;

    /**
     * Transaction index within the block
     * Used for event ordering
     *
     * @example 42
     */
    transactionIndex: number;

    /**
     * Log index within the transaction
     * Used for event ordering
     *
     * @example 5
     */
    logIndex: number;

    /**
     * Transaction hash
     * For reference and verification
     *
     * @example "0x1234567890abcdef..."
     */
    transactionHash: string;

    /**
     * Amount of liquidity added
     * bigint as string
     * This value comes directly from the INCREASE_LIQUIDITY event data
     *
     * @example "1000000000000000000"
     */
    liquidity: string;

    /**
     * Amount of token0 deposited
     * bigint as string (in smallest token units)
     * This value comes directly from the INCREASE_LIQUIDITY event data
     *
     * @example "500000000" (500 USDC with 6 decimals)
     */
    amount0: string;

    /**
     * Amount of token1 deposited
     * bigint as string (in smallest token units)
     * This value comes directly from the INCREASE_LIQUIDITY event data
     *
     * @example "250000000000000000" (0.25 WETH with 18 decimals)
     */
    amount1: string;
  };
}

/**
 * Position data for API response
 *
 * Based on UniswapV3Position from @midcurve/shared with:
 * - bigint fields converted to strings (for JSON serialization)
 * - Date fields converted to ISO 8601 strings
 * - Fully nested pool and token objects (no separate ID fields)
 */
export type CreateUniswapV3PositionData = BigIntToString<UniswapV3Position>;

/**
 * PUT /api/v1/positions/uniswapv3/{chainId}/{nftId} - Response
 */
export type CreateUniswapV3PositionResponse = ApiResponse<CreateUniswapV3PositionData>;
