import { z } from 'zod';

/**
 * Zod schema for validating path parameters of GET /api/v1/positions/uniswapv3/:chainId/:nftId
 */
export const GetUniswapV3PositionParamsSchema = z.object({
  /**
   * EVM chain ID as a string (will be coerced to number)
   * Must be a valid positive integer
   */
  chainId: z.string().transform((val, ctx) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'chainId must be a valid positive integer',
      });
      return z.NEVER;
    }
    return parsed;
  }),

  /**
   * Uniswap V3 NFT token ID
   * Must be a non-empty string representing a valid token ID
   */
  nftId: z.string().min(1, 'nftId must not be empty'),
});

export type GetUniswapV3PositionParamsInput = z.input<
  typeof GetUniswapV3PositionParamsSchema
>;
export type GetUniswapV3PositionParamsOutput = z.output<
  typeof GetUniswapV3PositionParamsSchema
>;
