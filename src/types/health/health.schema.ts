/**
 * Health Endpoint Schemas
 *
 * Zod schemas for health check endpoint validation.
 * This file will be part of @midcurve/api-types in the future.
 */

import { z } from 'zod';

/**
 * Health check response schema
 */
export const HealthResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: z.string().datetime(),
  environment: z.string(),
  version: z.string().optional(),
  uptime: z.number().optional(),
});

/**
 * Infer TypeScript type from schema
 */
export type HealthResponseData = z.infer<typeof HealthResponseSchema>;
