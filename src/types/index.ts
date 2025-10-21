/**
 * API Types - Main Barrel Export
 *
 * This directory contains all API-specific types (requests, responses, schemas).
 * These types will be extracted to @midcurve/api-types in the future.
 *
 * Organization:
 * - types/common/    - Shared base types (ApiResponse, pagination, etc.)
 * - types/{endpoint}/ - Endpoint-specific types organized by feature
 *   - {operation}.schema.ts - Zod schemas for validation
 *   - {operation}.types.ts  - TypeScript types
 */

export * from './common';
export * from './health';
export * from './auth';
export * from './tokens';
export * from './pools';
