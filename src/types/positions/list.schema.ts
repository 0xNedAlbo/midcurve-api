/**
 * Position List Endpoint Zod Schemas
 *
 * Runtime validation for list endpoint query parameters.
 */

import { z } from 'zod';
import { PaginationParamsSchema } from '../common/pagination';

/**
 * Position status enum for validation
 */
export const PositionStatusSchema = z.enum(['active', 'closed', 'all']);

/**
 * Zod schema for query parameters
 *
 * Validates and transforms query string parameters to typed values.
 */
export const ListUniswapV3PositionsQuerySchema = PaginationParamsSchema.extend({
  chainId: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().int().positive().optional()),

  status: z
    .string()
    .optional()
    .default('all')
    .transform((val) => val as 'active' | 'closed' | 'all')
    .pipe(PositionStatusSchema),
});

/**
 * Inferred type from schema
 */
export type ListUniswapV3PositionsQuery = z.infer<typeof ListUniswapV3PositionsQuerySchema>;
