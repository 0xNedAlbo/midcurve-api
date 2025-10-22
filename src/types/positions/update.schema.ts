/**
 * Position Update Endpoint Schemas
 *
 * Zod schemas for position update endpoint validation.
 */

import { z } from 'zod';

/**
 * Ethereum address validation regex
 * Matches hex addresses with or without 0x prefix
 */
const ethereumAddressRegex = /^(0x)?[0-9a-fA-F]{40}$/;

/**
 * Transaction hash validation regex
 * Matches hex hashes with or without 0x prefix (64 hex chars)
 */
const txHashRegex = /^(0x)?[0-9a-fA-F]{64}$/;

/**
 * BigInt string validation regex
 * Matches numeric strings (no scientific notation, no decimals)
 */
const bigIntStringRegex = /^[0-9]+$/;

/**
 * Event type validation
 */
const eventTypeSchema = z.enum(['INCREASE_LIQUIDITY', 'DECREASE_LIQUIDITY', 'COLLECT'], {
  errorMap: () => ({
    message: 'Event type must be INCREASE_LIQUIDITY, DECREASE_LIQUIDITY, or COLLECT',
  }),
});

/**
 * Single event validation
 *
 * Validates individual event data with conditional field requirements:
 * - INCREASE_LIQUIDITY: requires liquidity, forbids recipient
 * - DECREASE_LIQUIDITY: requires liquidity, forbids recipient
 * - COLLECT: requires recipient, forbids/ignores liquidity
 */
const eventSchema = z
  .object({
    eventType: eventTypeSchema,

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
      .regex(txHashRegex, 'Transaction hash must be a valid 64-character hex string'),

    liquidity: z
      .string()
      .regex(bigIntStringRegex, 'Liquidity must be a numeric string')
      .optional(),

    amount0: z
      .string()
      .regex(bigIntStringRegex, 'Amount0 must be a numeric string'),

    amount1: z
      .string()
      .regex(bigIntStringRegex, 'Amount1 must be a numeric string'),

    recipient: z
      .string()
      .regex(ethereumAddressRegex, 'Recipient must be a valid Ethereum address')
      .optional(),
  })
  .superRefine((data, ctx) => {
    // Validate INCREASE_LIQUIDITY and DECREASE_LIQUIDITY events
    if (data.eventType === 'INCREASE_LIQUIDITY' || data.eventType === 'DECREASE_LIQUIDITY') {
      // Must have liquidity
      if (!data.liquidity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['liquidity'],
          message: `Liquidity is required for ${data.eventType} events`,
        });
      }

      // Must not have recipient
      if (data.recipient) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['recipient'],
          message: `Recipient is not allowed for ${data.eventType} events (only for COLLECT)`,
        });
      }
    }

    // Validate COLLECT events
    if (data.eventType === 'COLLECT') {
      // Must have recipient
      if (!data.recipient) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['recipient'],
          message: 'Recipient is required for COLLECT events',
        });
      }
    }
  });

/**
 * PATCH /api/v1/positions/uniswapv3/{chainId}/{nftId} - Request validation
 *
 * Validates the request body for updating a position with new events.
 */
export const UpdateUniswapV3PositionRequestSchema = z.object({
  events: z
    .array(eventSchema)
    .min(1, 'At least one event is required')
    .max(100, 'Maximum 100 events allowed per request'),
});

/**
 * Path parameters validation
 *
 * Validates chainId and nftId from URL path.
 * Reuses same validation logic as GET/PUT/DELETE endpoints.
 */
export const UpdateUniswapV3PositionParamsSchema = z.object({
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
