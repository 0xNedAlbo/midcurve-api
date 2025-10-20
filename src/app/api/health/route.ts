/**
 * Health Check API Endpoint
 *
 * GET /api/health
 * Returns the health status of the API service.
 * No authentication required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '@/types/common';
import { HealthStatus, type HealthResponse } from '@/types/health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest): Promise<NextResponse<HealthResponse>> {
  const healthData = {
    status: HealthStatus.HEALTHY,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version,
    uptime: process.uptime(),
  };

  const response = createSuccessResponse(healthData);

  return NextResponse.json(response, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, must-revalidate',
    },
  });
}
