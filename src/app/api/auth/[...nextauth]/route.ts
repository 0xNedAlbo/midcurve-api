/**
 * Auth.js Route Handlers
 *
 * Handles Sign-In with Ethereum (SIWE) authentication using Auth.js v5.
 *
 * Flow:
 * 1. User generates nonce (GET /api/v1/auth/nonce)
 * 2. User signs SIWE message with MetaMask
 * 3. Frontend submits to this endpoint (POST /api/auth/callback/siwe)
 * 4. We verify signature and create/retrieve user
 * 5. Auth.js creates session (JWT)
 *
 * POST /api/auth/callback/siwe
 * GET  /api/auth/session
 * POST /api/auth/signout
 *
 * Note: The actual NextAuth configuration is in src/lib/auth.ts
 * This file only exports the route handlers (GET, POST) as required by Next.js.
 */

import { handlers } from '@/lib/auth';

// Export GET and POST handlers for Next.js App Router
export const GET = handlers.GET;
export const POST = handlers.POST;
