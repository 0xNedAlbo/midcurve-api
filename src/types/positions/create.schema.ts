/**
 * Position Create Endpoint Schemas
 *
 * Zod schemas for position create endpoint validation.
 */

import { z } from 'zod';

/**
 * Ethereum address validation regex
 * Matches hex addresses with or without 0x prefix
 */
const ethereumAddressRegex = /^(0x)?[0-9a-fA-F]{40}$/;

/**
 * Transaction hash validation regex
 * Matches hex hashes with or without 0x prefix
 */
const txHashRegex = /^(0x)?[0-9a-fA-F]{64}$/;

/**
 * BigInt string validation regex
 * Matches numeric strings (no scientific notation)
 */
const bigIntStringRegex = /^[0-9]+$/;

/**
 * PUT /api/v1/positions/uniswapv3/{chainId}/{nftId} - Request validation
 *
 * Validates the request body for creating a position from user-provided event data.
 *
 * Position state fields are derived from the event data:
 * - liquidity = increaseEvent.liquidity
 * - ownerAddress = user-provided
 * - feeGrowthInside0LastX128 = 0 (new position)
 * - feeGrowthInside1LastX128 = 0 (new position)
 * - tokensOwed0 = 0 (new position)
 * - tokensOwed1 = 0 (new position)
 */
export const CreateUniswapV3PositionRequestSchema = z.object({
  // Position Config
  poolAddress: z
    .string()
    .regex(ethereumAddressRegex, 'Pool address must be a valid Ethereum address'),

  tickUpper: z
    .number()
    .int('Tick upper must be an integer'),

  tickLower: z
    .number()
    .int('Tick lower must be an integer'),

  // Owner
  ownerAddress: z
    .string()
    .regex(ethereumAddressRegex, 'Owner address must be a valid Ethereum address'),

  // Optional: Quote Token Selection
  quoteTokenAddress: z
    .string()
    .regex(ethereumAddressRegex, 'Quote token address must be a valid Ethereum address')
    .optional(),

  // INCREASE_LIQUIDITY Event Data
  increaseEvent: z.object({
    timestamp: z
      .string()
      .datetime({ message: 'Timestamp must be a valid ISO 8601 date string' }),

    blockNumber: z
      .string()
      .regex(bigIntStringRegex, 'Block number must be a numeric string'),

    transactionIndex: z
      .number()
      .int('Transaction index must be an integer')
      .nonnegative('Transaction index must be non-negative'),

    logIndex: z
      .number()
      .int('Log index must be an integer')
      .nonnegative('Log index must be non-negative'),

    transactionHash: z
      .string()
      .regex(txHashRegex, 'Transaction hash must be a valid hex string'),

    liquidity: z
      .string()
      .regex(bigIntStringRegex, 'Liquidity must be a numeric string'),

    amount0: z
      .string()
      .regex(bigIntStringRegex, 'Amount0 must be a numeric string'),

    amount1: z
      .string()
      .regex(bigIntStringRegex, 'Amount1 must be a numeric string'),
  }),
});

/**
 * Path parameters validation
 *
 * Validates chainId and nftId from URL path.
 * Reuses schema from get.schema.ts for consistency.
 */
export const CreateUniswapV3PositionParamsSchema = z.object({
  chainId: z
    .string()
    .regex(/^[0-9]+$/, 'Chain ID must be a numeric string')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, { message: 'Chain ID must be positive' }),

  nftId: z
    .string()
    .regex(/^[0-9]+$/, 'NFT ID must be a numeric string')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, { message: 'NFT ID must be positive' }),
});
