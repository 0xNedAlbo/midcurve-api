/**
 * Uniswap V3 Pool Discovery Endpoint Schemas
 *
 * Zod schemas for Uniswap V3 pool discovery endpoint validation.
 */

import { z } from 'zod';

/**
 * GET /api/pools/uniswapv3/discover - Query validation
 *
 * All three parameters are required for pool discovery.
 */
export const DiscoverUniswapV3PoolsQuerySchema = z.object({
  chainId: z.coerce
    .number()
    .int('Chain ID must be an integer')
    .positive('Chain ID must be positive'),
  tokenA: z
    .string()
    .min(1, 'tokenA is required')
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format for tokenA'),
  tokenB: z
    .string()
    .min(1, 'tokenB is required')
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format for tokenB'),
});
