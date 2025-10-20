/**
 * Revoke API Key Endpoint
 *
 * DELETE /api/v1/user/api-keys/:id
 *
 * Revokes (deletes) the specified API key.
 * The key will no longer be valid for authentication.
 *
 * Authentication: Required (session only, not API key)
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "message": "API key revoked successfully"
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AuthApiKeyService } from '@midcurve/services';
import {
  createSuccessResponse,
  createErrorResponse,
  ApiErrorCode,
  ErrorCodeToHttpStatus,
} from '@/types/common';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const apiKeyService = new AuthApiKeyService();

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // Session auth only (not API keys - can't revoke using an API key)
  const session = await auth();
  if (!session?.user?.id) {
    const errorResponse = createErrorResponse(
      ApiErrorCode.UNAUTHORIZED,
      'Session authentication required'
    );
    return NextResponse.json(errorResponse, {
      status: ErrorCodeToHttpStatus[ApiErrorCode.UNAUTHORIZED],
    });
  }

  try {
    const { id: keyId } = await params;

    // Validate key ID
    if (!keyId || typeof keyId !== 'string') {
      const errorResponse = createErrorResponse(
        ApiErrorCode.VALIDATION_ERROR,
        'Invalid API key ID'
      );
      return NextResponse.json(errorResponse, {
        status: ErrorCodeToHttpStatus[ApiErrorCode.VALIDATION_ERROR],
      });
    }

    // Revoke API key (service validates ownership)
    try {
      await apiKeyService.revokeApiKey(session.user.id, keyId);

      const response = createSuccessResponse({
        message: 'API key revoked successfully',
      });

      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      // Check if key not found or doesn't belong to user
      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('does not belong')) {
          const errorResponse = createErrorResponse(
            ApiErrorCode.API_KEY_NOT_FOUND,
            'API key not found or does not belong to user',
            { keyId }
          );
          return NextResponse.json(errorResponse, {
            status: ErrorCodeToHttpStatus[ApiErrorCode.API_KEY_NOT_FOUND],
          });
        }
      }
      throw error; // Re-throw unexpected errors
    }
  } catch (error) {
    console.error('Revoke API key error:', error);

    const errorResponse = createErrorResponse(
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to revoke API key',
      error instanceof Error ? error.message : String(error)
    );

    return NextResponse.json(errorResponse, {
      status: ErrorCodeToHttpStatus[ApiErrorCode.INTERNAL_SERVER_ERROR],
    });
  }
}
