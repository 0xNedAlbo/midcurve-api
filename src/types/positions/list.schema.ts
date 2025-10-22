/**
 * Position List Endpoint Zod Schemas
 *
 * Runtime validation for generic position list endpoint query parameters.
 */

import { z } from 'zod';
import { PaginationParamsSchema } from '../common/pagination';

/**
 * Position status enum for validation
 */
export const PositionStatusSchema = z.enum(['active', 'closed', 'all']);

/**
 * Sort field enum for validation
 */
export const PositionSortBySchema = z.enum([
  'createdAt',
  'positionOpenedAt',
  'currentValue',
  'unrealizedPnl',
]);

/**
 * Sort direction enum for validation
 */
export const SortDirectionSchema = z.enum(['asc', 'desc']);

/**
 * Zod schema for query parameters
 *
 * Validates and transforms query string parameters to typed values.
 */
export const ListPositionsQuerySchema = PaginationParamsSchema.extend({
  protocols: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',').map((p) => p.trim()) : undefined))
    .pipe(z.array(z.string()).optional()),

  status: z
    .string()
    .optional()
    .default('all')
    .transform((val) => val as 'active' | 'closed' | 'all')
    .pipe(PositionStatusSchema),

  sortBy: z
    .string()
    .optional()
    .default('createdAt')
    .transform(
      (val) =>
        val as 'createdAt' | 'positionOpenedAt' | 'currentValue' | 'unrealizedPnl'
    )
    .pipe(PositionSortBySchema),

  sortDirection: z
    .string()
    .optional()
    .default('desc')
    .transform((val) => val as 'asc' | 'desc')
    .pipe(SortDirectionSchema),
});

/**
 * Inferred type from schema
 */
export type ListPositionsQuery = z.infer<typeof ListPositionsQuerySchema>;
