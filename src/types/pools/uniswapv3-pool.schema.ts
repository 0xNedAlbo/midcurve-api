/**
 * Zod validation schemas for Uniswap V3 Pool Lookup Endpoint
 *
 * GET /api/pools/uniswapv3/:address
 */

import { z } from 'zod';

/**
 * Schema for path parameters
 *
 * Validates pool contract address format (0x followed by 40 hex characters)
 */
export const GetUniswapV3PoolParamsSchema = z.object({
  address: z
    .string()
    .min(1, 'Pool address is required')
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid pool address format'),
});

/**
 * Schema for query parameters
 *
 * Validates chainId (positive integer), optional metrics flag, and optional fees flag
 */
export const GetUniswapV3PoolQuerySchema = z.object({
  chainId: z.coerce
    .number({
      required_error: 'chainId is required',
      invalid_type_error: 'chainId must be a number',
    })
    .int('chainId must be an integer')
    .positive('chainId must be positive'),

  metrics: z
    .string()
    .optional()
    .default('false')
    .transform((val) => val === 'true')
    .pipe(z.boolean()),

  fees: z
    .string()
    .optional()
    .default('false')
    .transform((val) => val === 'true')
    .pipe(z.boolean()),
});
