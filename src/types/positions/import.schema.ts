/**
 * Position Import Endpoint Schemas
 *
 * Zod schemas for position import endpoint validation.
 */

import { z } from 'zod';

/**
 * POST /api/v1/positions/uniswapv3/import - Request validation
 *
 * Validates:
 * - chainId: Positive integer (1 for Ethereum, 42161 for Arbitrum, etc.)
 * - nftId: Positive integer (Uniswap V3 NFT token ID)
 *
 * Quote token is NOT included - it's automatically determined by the service
 * using QuoteTokenService (respects user preferences → chain defaults → token0 fallback)
 */
export const ImportUniswapV3PositionRequestSchema = z.object({
  chainId: z
    .number()
    .int('Chain ID must be an integer')
    .positive('Chain ID must be positive'),
  nftId: z
    .number()
    .int('NFT ID must be an integer')
    .positive('NFT ID must be positive'),
});
