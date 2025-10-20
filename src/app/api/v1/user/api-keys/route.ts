/**
 * API Keys Management Endpoints
 *
 * GET  /api/v1/user/api-keys - List user's API keys
 * POST /api/v1/user/api-keys - Create new API key
 *
 * Authentication: Required (session only, not API key)
 *
 * Note: API keys cannot create other API keys (session auth only).
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
import {
  CreateApiKeyRequestSchema,
} from '@/types/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const apiKeyService = new AuthApiKeyService();

/**
 * GET /api/v1/user/api-keys
 *
 * List all API keys for the authenticated user (prefixes only, no full keys).
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  // Session auth only (not API keys)
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
    // Fetch user's API keys (returns display data only - no hashes or full keys)
    const apiKeys = await apiKeyService.getUserApiKeys(session.user.id);

    // Convert Date objects to ISO strings
    const apiKeysFormatted = apiKeys.map((key) => ({
      id: key.id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      lastUsed: key.lastUsed?.toISOString() ?? null,
      createdAt: key.createdAt.toISOString(),
      updatedAt: key.updatedAt.toISOString(),
    }));

    const response = createSuccessResponse(apiKeysFormatted);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (error) {
    console.error('List API keys error:', error);

    const errorResponse = createErrorResponse(
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to retrieve API keys',
      error instanceof Error ? error.message : String(error)
    );

    return NextResponse.json(errorResponse, {
      status: ErrorCodeToHttpStatus[ApiErrorCode.INTERNAL_SERVER_ERROR],
    });
  }
}

/**
 * POST /api/v1/user/api-keys
 *
 * Create a new API key for the authenticated user.
 * Returns the full key ONCE - it cannot be retrieved again.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Session auth only (not API keys)
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
    // Parse and validate request body
    const body = await request.json();
    const validation = CreateApiKeyRequestSchema.safeParse(body);

    if (!validation.success) {
      const errorResponse = createErrorResponse(
        ApiErrorCode.VALIDATION_ERROR,
        'Invalid request data',
        validation.error.errors
      );
      return NextResponse.json(errorResponse, {
        status: ErrorCodeToHttpStatus[ApiErrorCode.VALIDATION_ERROR],
      });
    }

    const { name } = validation.data;

    // Create API key
    const { apiKey, key } = await apiKeyService.createApiKey(session.user.id, name);

    const response = {
      success: true,
      data: {
        id: apiKey.id,
        name: apiKey.name,
        key, // Full key - ONLY shown once
        keyPrefix: apiKey.keyPrefix,
        createdAt: apiKey.createdAt.toISOString(),
      },
      meta: {
        warning: 'Save this key securely. It will not be shown again.',
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(response, {
      status: 201,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Create API key error:', error);

    const errorResponse = createErrorResponse(
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to create API key',
      error instanceof Error ? error.message : String(error)
    );

    return NextResponse.json(errorResponse, {
      status: ErrorCodeToHttpStatus[ApiErrorCode.INTERNAL_SERVER_ERROR],
    });
  }
}
