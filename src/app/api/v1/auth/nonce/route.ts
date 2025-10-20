/**
 * Nonce Generation Endpoint
 *
 * GET /api/v1/auth/nonce
 *
 * Generates a cryptographically secure nonce for SIWE authentication.
 * The nonce is stored in PostgreSQL Cache with a 10-minute TTL.
 *
 * No authentication required (public endpoint).
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "nonce": "siwe_abc123def456..."
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthNonceService } from '@midcurve/services';
import { createSuccessResponse, createErrorResponse, ApiErrorCode, ErrorCodeToHttpStatus } from '@/types/common';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const nonceService = new AuthNonceService();

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    // Generate nonce and store in cache (10-minute TTL)
    const nonce = await nonceService.generateNonce();

    const response = createSuccessResponse({
      nonce,
    });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Nonce generation error:', error);

    const errorResponse = createErrorResponse(
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to generate nonce',
      error instanceof Error ? error.message : String(error)
    );

    return NextResponse.json(errorResponse, {
      status: ErrorCodeToHttpStatus[ApiErrorCode.INTERNAL_SERVER_ERROR],
    });
  }
}
