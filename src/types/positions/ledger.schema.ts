/**
 * Position Ledger Schemas
 *
 * Zod validation schemas for the GET /api/v1/positions/uniswapv3/:chainId/:nftId/ledger endpoint
 */

import { z } from 'zod';

/**
 * Path parameter validation schema
 *
 * Validates chainId and nftId from URL path
 */
export const LedgerPathParamsSchema = z.object({
  /**
   * Chain ID (e.g., 1 for Ethereum, 42161 for Arbitrum)
   * Must be a valid positive integer
   */
  chainId: z
    .string()
    .regex(/^\d+$/, 'Chain ID must be a valid number')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive()),

  /**
   * NFT Position Manager token ID
   * Can be very large, so we keep as string for validation
   * Service layer will convert to bigint
   */
  nftId: z
    .string()
    .regex(/^\d+$/, 'NFT ID must be a valid number')
    .min(1, 'NFT ID is required'),
});

