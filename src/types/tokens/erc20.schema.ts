/**
 * ERC-20 Token Endpoint Schemas
 *
 * Zod schemas for ERC-20 token endpoint validation.
 * This file will be part of @midcurve/api-types in the future.
 */

import { z } from 'zod';

/**
 * POST /api/v1/tokens/erc20 - Request validation
 */
export const CreateErc20TokenRequestSchema = z.object({
  address: z
    .string()
    .min(1, 'Address is required')
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format'),
  chainId: z
    .number()
    .int('Chain ID must be an integer')
    .positive('Chain ID must be positive'),
});

/**
 * GET /api/v1/tokens/erc20/search - Query validation
 *
 * chainId is REQUIRED
 * At least one of symbol, name, or address must be provided
 */
export const SearchErc20TokensQuerySchema = z
  .object({
    chainId: z.coerce
      .number()
      .int('Chain ID must be an integer')
      .positive('Chain ID must be positive'),
    symbol: z.string().min(1, 'Symbol must not be empty').optional(),
    name: z.string().min(1, 'Name must not be empty').optional(),
    address: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format')
      .optional(),
  })
  .refine(
    (data) => data.symbol !== undefined || data.name !== undefined || data.address !== undefined,
    {
      message: 'At least one of symbol, name, or address must be provided',
      path: ['symbol', 'name', 'address'],
    }
  );
