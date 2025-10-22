import { z } from 'zod';

/**
 * Zod schema for validating path parameters of DELETE /api/v1/positions/uniswapv3/:chainId/:nftId
 */
export const DeleteUniswapV3PositionParamsSchema = z.object({
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
   * Uniswap V3 NFT token ID as a string (will be coerced to number)
   * Must be a valid positive integer
   */
  nftId: z.string().transform((val, ctx) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'nftId must be a valid positive integer',
      });
      return z.NEVER;
    }
    return parsed;
  }),
});

export type DeleteUniswapV3PositionParamsInput = z.input<
  typeof DeleteUniswapV3PositionParamsSchema
>;
export type DeleteUniswapV3PositionParamsOutput = z.output<
  typeof DeleteUniswapV3PositionParamsSchema
>;
