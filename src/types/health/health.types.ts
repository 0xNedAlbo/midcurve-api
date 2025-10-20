/**
 * Health Endpoint Types
 *
 * TypeScript types for health check endpoint.
 * This file will be part of @midcurve/api-types in the future.
 */

import type { ApiResponse } from '../common';
import type { HealthResponseData } from './health.schema';

/**
 * Health status enum
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

/**
 * Health check response type
 */
export type HealthResponse = ApiResponse<HealthResponseData>;

/**
 * Health check data (without ApiResponse wrapper)
 */
export interface HealthCheckData {
  status: HealthStatus;
  timestamp: string;
  environment: string;
  version?: string;
  uptime?: number;
}
