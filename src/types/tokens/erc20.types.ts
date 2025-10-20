/**
 * ERC-20 Token Endpoint Types
 *
 * Types for ERC-20 token management endpoints.
 * This file will be part of @midcurve/api-types in the future.
 */

import type { ApiResponse } from '../common';

/**
 * POST /api/v1/tokens/erc20 - Request body
 */
export interface CreateErc20TokenRequest {
  /**
   * Token contract address (any format, normalized by service)
   */
  address: string;

  /**
   * EVM chain ID
   */
  chainId: number;
}

/**
 * Token data structure (for create/discover response - full Token object)
 */
export interface CreateErc20TokenData {
  id: string;
  tokenType: 'erc20';
  name: string;
  symbol: string;
  decimals: number;
  logoUrl?: string;
  coingeckoId?: string;
  marketCap?: number;
  config: {
    address: string;
    chainId: number;
  };
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * Token search candidate from CoinGecko (lightweight, not in database yet)
 *
 * This represents a token found in CoinGecko's catalog that matches
 * the search criteria. To add it to the database, use POST /api/v1/tokens/erc20
 * with the address and chainId from this candidate.
 */
export interface TokenSearchCandidate {
  /** CoinGecko coin ID */
  coingeckoId: string;
  /** Token symbol (uppercase) */
  symbol: string;
  /** Token name */
  name: string;
  /** Contract address on the specified chain */
  address: string;
  /** EVM chain ID where this token exists */
  chainId: number;
}

/**
 * POST /api/v1/tokens/erc20 - Response
 */
export type CreateErc20TokenResponse = ApiResponse<CreateErc20TokenData>;

/**
 * GET /api/v1/tokens/erc20/search - Query params
 */
export interface SearchErc20TokensQuery {
  /**
   * REQUIRED - Chain to search within
   */
  chainId: number;

  /**
   * Optional - partial symbol match (case-insensitive)
   */
  symbol?: string;

  /**
   * Optional - partial name match (case-insensitive)
   */
  name?: string;

  /**
   * Optional - contract address to search for (exact match, case-insensitive)
   */
  address?: string;
}

/**
 * GET /api/v1/tokens/erc20/search - Response data (array of search candidates)
 */
export type SearchErc20TokensData = TokenSearchCandidate[];

/**
 * GET /api/v1/tokens/erc20/search - Response
 */
export interface SearchErc20TokensResponse extends ApiResponse<SearchErc20TokensData> {
  meta?: {
    count: number; // Number of results returned
    limit: number; // Max results (always 10)
    timestamp: string;
  };
}
