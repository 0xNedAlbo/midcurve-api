/**
 * Authentication Middleware
 *
 * Provides unified authentication for API routes supporting both:
 * 1. Session-based auth (Auth.js JWT)
 * 2. API key auth (Bearer token)
 *
 * Usage:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   return withAuth(request, async (user) => {
 *     // user is authenticated
 *     return NextResponse.json({ data: user })
 *   })
 * }
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AuthApiKeyService, AuthUserService } from '@midcurve/services';
import { createErrorResponse, ApiErrorCode, ErrorCodeToHttpStatus } from '@/types/common';
import type { AuthenticatedUser } from '@/types/auth';

const apiKeyService = new AuthApiKeyService();
const userService = new AuthUserService();

/**
 * Middleware wrapper for authenticated routes
 *
 * @param request - Next.js request object
 * @param handler - Route handler function receiving authenticated user
 * @returns Response from handler or 401 error
 */
export async function withAuth(
  request: NextRequest,
  handler: (user: AuthenticatedUser) => Promise<Response>
): Promise<Response> {
  // 1. Check for API key in Authorization header
  const authHeader = request.headers.get('authorization');
  const apiKey = authHeader?.replace('Bearer ', '').trim();

  if (apiKey && apiKey.startsWith('mc_')) {
    const user = await validateApiKey(apiKey);
    if (user) {
      return handler(user);
    }
  }

  // 2. Check for session (Auth.js JWT)
  const session = await auth();
  if (session?.user?.id) {
    const user: AuthenticatedUser = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      wallets: session.user.wallets,
    };
    return handler(user);
  }

  // 3. Unauthorized
  const errorResponse = createErrorResponse(
    ApiErrorCode.UNAUTHORIZED,
    'Authentication required. Provide a valid session or API key.'
  );

  return NextResponse.json(errorResponse, {
    status: ErrorCodeToHttpStatus[ApiErrorCode.UNAUTHORIZED],
  });
}

/**
 * Validate API key and return associated user
 *
 * @param key - API key from Authorization header
 * @returns Authenticated user or null if invalid
 */
async function validateApiKey(key: string): Promise<AuthenticatedUser | null> {
  try {
    // Validate API key and get record
    const apiKeyRecord = await apiKeyService.validateApiKey(key);

    if (!apiKeyRecord) {
      return null;
    }

    // Update last used timestamp (fire-and-forget)
    apiKeyService
      .updateLastUsed(apiKeyRecord.id)
      .catch((err) => console.error('Failed to update API key lastUsed:', err));

    // Fetch user
    const user = await userService.findUserById(apiKeyRecord.userId);

    if (!user) {
      return null;
    }

    // Fetch user's wallets
    const wallets = await userService.getUserWallets(user.id);

    // Return user data
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      wallets: wallets || [],
    };
  } catch (error) {
    console.error('API key validation error:', error);
    return null;
  }
}
