/**
 * Authentication Types - Barrel Export
 *
 * This file will be part of @midcurve/api-types in the future.
 */

// Session types
export type { AuthenticatedUser } from './session.types';

// Nonce types
export type { NonceData, NonceResponse } from './nonce.types';
export { NonceSchema } from './nonce.types';

// API Key types
export type {
  CreateApiKeyRequest,
  CreateApiKeyData,
  CreateApiKeyResponse,
  ApiKeyDisplay,
  ListApiKeysResponse,
  RevokeApiKeyData,
  RevokeApiKeyResponse,
} from './api-key.types';
export { CreateApiKeyRequestSchema } from './api-key.types';

// Link Wallet types
export type {
  LinkWalletRequest,
  LinkWalletData,
  LinkWalletResponse,
  ListWalletsResponse,
  SetPrimaryWalletResponse,
} from './link-wallet.types';
export { LinkWalletRequestSchema } from './link-wallet.types';

// User types
export type { UserData, GetCurrentUserResponse } from './user.types';
