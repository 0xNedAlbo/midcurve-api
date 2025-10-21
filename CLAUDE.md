# Midcurve API

> **REST API layer for Midcurve Finance** - Serverless endpoints for frontend consumption

## Quick Navigation

📚 **Architecture & Concepts:** [Monorepo CLAUDE.md](../CLAUDE.md)
- Ecosystem overview, package roles, core architecture principles, project philosophy

🔧 **Business Logic:** [Services CLAUDE.md](../midcurve-services/CLAUDE.md)
- Service APIs, database operations, on-chain data reading

📦 **Shared Types:** [Shared README.md](../midcurve-shared/README.md)
- Type definitions, utilities, math functions

---

## Project Overview

**Midcurve API** is the RESTful API layer for **Midcurve Finance**, a comprehensive risk management platform for concentrated liquidity (CL) provisioning across multiple blockchain ecosystems (Ethereum, BSC, Solana).

This API serves as the primary interface between frontend applications and the Midcurve platform, providing endpoints for token/pool discovery, position tracking, PnL analytics, and automated rebalancing.

### Role in the Ecosystem

The API acts as a thin layer that:
- Exposes REST endpoints for frontend consumption
- Validates requests with Zod schemas
- Delegates business logic to `@midcurve/services`
- Returns standardized JSON responses
- Handles authentication (SIWE + API keys)

For complete ecosystem architecture and package responsibilities, see:
**[Package Roles & Responsibilities](../CLAUDE.md#package-roles--responsibilities)**

---

## Architecture Overview

For comprehensive architectural documentation, see the [monorepo CLAUDE.md](../CLAUDE.md):

- **[Monorepo Architecture](../CLAUDE.md#monorepo-architecture)** - Ecosystem diagram and repository structure
- **[Type Hierarchy](../CLAUDE.md#1-type-hierarchy--separation-of-concerns)** - Why types come from @midcurve/shared, not Prisma
- **[Prisma Schema Management](../CLAUDE.md#2-prisma-schema-management--peer-dependencies)** - Peer dependency pattern, auto-sync during install
- **[Local Package Management](../CLAUDE.md#3-local-package-management-with-yalc)** - Yalc workflow for services consumption
- **[Authentication Architecture](../CLAUDE.md#6-authentication-architecture)** - SIWE + API keys, dual auth strategy
- **[Project Philosophy](../CLAUDE.md#project-philosophy--risk-management-approach)** - Quote/base tokens, risk definition, cash flow measurement

### API-Specific Architecture Notes

**Prisma Integration:**
This project uses a Prisma client generated from the services repo schema. During `npm install`, the schema is automatically synced from `@midcurve/services` and the client generated locally via the `postinstall` hook.

**Type Imports:**
Always import domain types from `@midcurve/shared`, NOT from `@prisma/client`:

```typescript
// ✅ Correct
import type { AuthWalletAddress, User, Token } from '@midcurve/shared';

// ❌ Wrong
import type { AuthWalletAddress } from '@prisma/client';
```

**Reasons:** Shared types are portable (browser-compatible), framework-agnostic, and form the API contract. See [Type Hierarchy](../CLAUDE.md#1-type-hierarchy--separation-of-concerns) for details.

---

## Project Structure

```
midcurve-api/
├── src/
│   ├── app/
│   │   └── api/              # Next.js API routes (App Router)
│   │       ├── auth/         # Authentication endpoints (SIWE)
│   │       ├── health/       # GET /api/health
│   │       └── v1/           # Versioned API endpoints
│   │           ├── auth/     # Auth management (nonce, link-wallet)
│   │           ├── user/     # User management (me, wallets, api-keys)
│   │           ├── tokens/   # Token endpoints (future)
│   │           ├── pools/    # Pool endpoints (future)
│   │           └── positions/ # Position endpoints (future)
│   │
│   ├── types/                # API types (future @midcurve/api-types)
│   │   ├── common/           # ApiResponse<T>, ApiError, Pagination
│   │   ├── auth/             # Authentication types
│   │   ├── health/           # Health endpoint types
│   │   ├── tokens/           # Token endpoint types (future)
│   │   ├── pools/            # Pool endpoint types (future)
│   │   └── positions/        # Position endpoint types (future)
│   │
│   ├── lib/                  # Libraries
│   │   ├── auth.ts           # Auth.js configuration
│   │   └── logger.ts         # Logging utilities (Pino from services)
│   │
│   ├── middleware/           # API middleware
│   │   └── with-auth.ts      # Authentication (session + API key)
│   │
│   ├── utils/                # Utilities
│   │   ├── errors.ts         # Error handling helpers
│   │   └── response.ts       # Response helpers
│   │
│   └── config/               # Configuration
│       └── constants.ts      # API constants
│
├── scripts/
│   └── sync-prisma-schema.sh # Prisma schema sync script
│
├── .env.example
├── package.json
├── tsconfig.json
├── next.config.ts
└── vercel.json
```

---

## Type Organization Pattern

Types are organized **by endpoint**, not by request/response/error:

```
types/{endpoint}/
  ├── {operation}.schema.ts   # Zod schemas for validation
  ├── {operation}.types.ts    # TypeScript types
  └── index.ts                # Barrel exports

Example:
types/tokens/
  ├── create.schema.ts        # POST /api/v1/tokens
  ├── create.types.ts
  ├── search.schema.ts        # GET /api/v1/tokens/search
  ├── search.types.ts
  └── index.ts
```

**Why?**
1. Find all types for a specific endpoint easily
2. Extract to `@midcurve/api-types` package later (Phase 4)
3. Keep related schemas together

---

## Standard Response Format

All endpoints return consistent JSON following these patterns:

**Success:**
```typescript
{
  success: true,
  data: T,                    // Response data
  meta?: {
    timestamp: string,
    requestId?: string,
    ...
  }
}
```

**Error:**
```typescript
{
  success: false,
  error: {
    code: string,             // e.g., "VALIDATION_ERROR"
    message: string,          // Human-readable
    details?: unknown
  },
  meta?: {
    timestamp: string,
    requestId?: string
  }
}
```

**Paginated:**
```typescript
{
  success: true,
  data: T[],
  pagination: {
    total: number,
    limit: number,
    offset: number,
    hasMore: boolean
  },
  meta?: { ... }
}
```

---

## Logging Infrastructure

The API uses structured JSON logging via **Pino** from `@midcurve/services`. All logging utilities are shared across the entire Midcurve ecosystem for consistency.

### Logger Setup

**Import from lib:**
```typescript
import { apiLogger, apiLog } from '@/lib/logger';
import { nanoid } from 'nanoid';
```

**Request ID Pattern:**
Every request should generate a unique `requestId` for tracing:
```typescript
export async function GET(request: NextRequest) {
  const requestId = nanoid();
  const startTime = Date.now();

  apiLog.requestStart(apiLogger, requestId, request);

  try {
    // ... handler logic

    apiLog.requestEnd(apiLogger, requestId, 200, Date.now() - startTime);
    return response;
  } catch (error) {
    apiLog.methodError(apiLogger, 'GET /api/endpoint', error, { requestId });
    apiLog.requestEnd(apiLogger, requestId, 500, Date.now() - startTime);
    return errorResponse;
  }
}
```

### Available Logging Patterns

The `apiLog` object provides common logging patterns:

**1. Request Logging:**
```typescript
apiLog.requestStart(apiLogger, requestId, request);
apiLog.requestEnd(apiLogger, requestId, statusCode, durationMs);
```

**2. Authentication:**
```typescript
apiLog.authSuccess(apiLogger, requestId, userId, 'session');
apiLog.authSuccess(apiLogger, requestId, userId, 'api_key', apiKeyPrefix);
apiLog.authFailure(apiLogger, requestId, 'Invalid API key', 'api_key');
```

**3. Validation:**
```typescript
apiLog.validationError(apiLogger, requestId, validationErrors);
```

**4. Business Operations:**
```typescript
apiLog.businessOperation(
  apiLogger,
  requestId,
  'discovered',      // operation
  'erc20-token',     // resourceType
  token.id,          // resourceId
  { symbol: 'USDC', chainId: 1 }  // metadata
);
```

**5. Errors:**
```typescript
apiLog.methodError(apiLogger, 'POST /api/v1/tokens', error, {
  requestId,
  userId,
  additionalContext: 'value'
});
```

**6. Service Patterns (re-exported from services):**
```typescript
apiLog.dbOperation(apiLogger, 'create', 'Token', { address, chainId });
apiLog.cacheHit(apiLogger, 'getToken', cacheKey);
apiLog.cacheMiss(apiLogger, 'getToken', cacheKey);
apiLog.externalApiCall(apiLogger, 'CoinGecko', '/coins/list', { chainId });
```

### Authenticated Route Logging

For routes using `withAuth`, the middleware automatically provides the `requestId`:

```typescript
export async function POST(request: NextRequest): Promise<Response> {
  return withAuth(request, async (user, requestId) => {
    const startTime = Date.now();

    // requestId is already available from middleware
    // Auth logging already done by middleware

    try {
      // ... business logic

      apiLog.requestEnd(apiLogger, requestId, 200, Date.now() - startTime);
      return response;
    } catch (error) {
      apiLog.methodError(apiLogger, 'POST /api/endpoint', error, {
        requestId,
        userId: user.id
      });
      apiLog.requestEnd(apiLogger, requestId, 500, Date.now() - startTime);
      return errorResponse;
    }
  });
}
```

### Log Levels

Configure via `LOG_LEVEL` environment variable:

- `debug` - All logs (verbose, for development)
- `info` - Informational + warnings + errors (default production)
- `warn` - Warnings + errors only
- `error` - Errors only
- `silent` - No logs (used in tests)

**Default behavior** (from `@midcurve/services`):
- Development: `debug`
- Production: `info`
- Test: `silent`

### Security: Sensitive Data Sanitization

The logger automatically redacts sensitive information:

**Headers:**
- `Authorization` → `[REDACTED]`
- `Cookie` → `[REDACTED]`
- `Set-Cookie` → `[REDACTED]`
- `X-API-Key` → `[REDACTED]`

**Addresses:**
Always truncate wallet addresses in logs:
```typescript
address: wallet.address.slice(0, 10) + '...',  // 0xA0b86991...
```

**API Keys:**
Only log prefixes:
```typescript
apiKeyPrefix: apiKey.slice(0, 10),  // mc_1234567...
```

---

## Development Workflow

### Adding a New Endpoint

1. **Create types** in `src/types/{endpoint}/`
   ```typescript
   // {operation}.schema.ts - Zod schemas
   export const CreateTokenRequestSchema = z.object({ ... });

   // {operation}.types.ts - TypeScript types
   export type CreateTokenRequest = z.infer<typeof CreateTokenRequestSchema>;
   export type CreateTokenResponse = ApiResponse<Erc20Token>;
   ```

2. **Create route** in `src/app/api/v1/{endpoint}/route.ts`
   ```typescript
   import { apiLogger, apiLog } from '@/lib/logger';
   import { nanoid } from 'nanoid';

   export async function POST(request: NextRequest) {
     const requestId = nanoid();
     const startTime = Date.now();

     apiLog.requestStart(apiLogger, requestId, request);

     try {
       // 1. Parse/validate request
       const body = CreateTokenRequestSchema.parse(await request.json());

       // 2. Call service
       const token = await tokenService.create(body);

       // 3. Log business operation
       apiLog.businessOperation(apiLogger, requestId, 'created', 'token', token.id);

       // 4. Return response
       apiLog.requestEnd(apiLogger, requestId, 200, Date.now() - startTime);
       return NextResponse.json(createSuccessResponse(token));
     } catch (error) {
       apiLog.methodError(apiLogger, 'POST /api/v1/tokens', error, { requestId });
       apiLog.requestEnd(apiLogger, requestId, 500, Date.now() - startTime);
       return NextResponse.json(createErrorResponse(...));
     }
   }
   ```

3. **Test locally**
   ```bash
   npm run dev
   curl http://localhost:3000/api/v1/tokens -X POST -d '...'
   ```

4. **Type check**
   ```bash
   npm run type-check
   ```

### Using Services

```typescript
import { TokenService } from '@midcurve/services';
import { Erc20Token } from '@midcurve/shared';

// Initialize service
const tokenService = new TokenService();

// Use in endpoint
const token = await tokenService.findById(id);
```

### Validation with Zod

```typescript
import { z } from 'zod';

// Define schema
const SearchParamsSchema = z.object({
  query: z.string().min(1),
  chain: z.enum(['ethereum', 'arbitrum', 'base']),
  limit: z.number().int().positive().max(100).default(20),
});

// Parse with automatic validation
const params = SearchParamsSchema.parse(queryParams);
// TypeScript knows: params is { query: string, chain: 'ethereum' | ..., limit: number }
```

---

## Environment Variables (API-Specific)

### Required

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/midcurve"
NODE_ENV="development"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"  # Generate with: openssl rand -base64 32
```

### Optional

```bash
# EVM Chain RPCs (inherited from services)
RPC_URL_ETHEREUM="https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
RPC_URL_ARBITRUM="https://arb-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
RPC_URL_BASE="https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
RPC_URL_BSC="https://bsc-dataseed1.binance.org"
RPC_URL_POLYGON="https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
RPC_URL_OPTIMISM="https://opt-mainnet.g.alchemy.com/v2/YOUR_API_KEY"

# Token enrichment
COINGECKO_API_KEY="your-coingecko-key"

# Rate limiting (future)
KV_REST_API_URL="your-vercel-kv-url"
KV_REST_API_TOKEN="your-vercel-kv-token"
```

For complete environment setup including RPC configuration, see:
**[Development Setup](../CLAUDE.md#development-setup)**

---

## Deployment (Vercel)

### Automatic Deployment

1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Push to `main` branch → automatic deploy

### Manual Deployment

```bash
npm run build
vercel --prod
```

### Serverless Configuration

- **Region:** `iad1` (US East)
- **Max Duration:** 10 seconds
- **Memory:** 1024 MB
- **Config:** See [vercel.json](vercel.json)

For production deployment considerations, see:
**[Deployment Section](../CLAUDE.md#deployment)**

---

## Development Commands

```bash
# Development
npm run dev              # Start dev server (Turbopack)

# Type checking
npm run type-check       # Check types without build

# Building
npm run build            # Production build

# Linting
npm run lint             # ESLint

# Prisma
npm run prisma:generate  # Sync schema from services + generate client
npm run prisma:sync      # Sync schema only (no generate)

# Yalc (local package management)
npm run yalc:link:services  # Link services via yalc
npm run yalc:update         # Update services from yalc store
```

---

## Dependencies

### Local Packages

```json
{
  "@midcurve/services": "file:.yalc/@midcurve/services",
  "@midcurve/shared": "file:../midcurve-shared",
  "@prisma/client": "^6.17.1"
}
```

Services is consumed via **yalc** to ensure peer dependency resolution works correctly with Prisma. For the complete yalc workflow, see:
**[Local Package Management with Yalc](../CLAUDE.md#3-local-package-management-with-yalc)**

**Quick yalc workflow:**
```bash
# In services repo after changes:
cd ../midcurve-services
npm run yalc:push  # Builds and updates all consumers

# In API repo (changes auto-detected or):
npm run yalc:update
```

### External Dependencies

- **next@^15.5.0** - Framework (serverless functions)
- **react@^19.0.0** - Required by Next.js
- **zod@^3.22.0** - Runtime validation + type inference
- **typescript@^5.3.3** - Strict type checking
- **next-auth@^5.0.0** - Authentication framework

---

## Key Principles (API-Specific)

1. **Thin API layer** - Delegate to services, don't duplicate business logic
2. **Type safety** - Zod validation at runtime + TypeScript at compile time
3. **Endpoint-based types** - Organize by endpoint for clarity and future extraction
4. **Consistent responses** - Standard JSON format across all endpoints
5. **Stateless** - Each request independent (serverless-friendly, no session state)
6. **Fail fast** - Validate early, return clear errors with standardized codes

For general code style and principles shared across the monorepo, see:
**[Code Style & Best Practices](../CLAUDE.md#code-style--best-practices)**

---

## Authentication

The API implements dual authentication:
- **Session-based (JWT)** - For UI/frontend users via SIWE
- **API keys** - For programmatic access

Authentication handled by the `withAuth` middleware which checks API keys first, then falls back to session validation.

For complete authentication architecture and SIWE implementation details, see:
**[Authentication Architecture](../CLAUDE.md#6-authentication-architecture)**

---

## Roadmap

For the complete project roadmap across all packages, see:
**[Project Roadmap](../CLAUDE.md#project-roadmap)**

### API-Specific Upcoming Work

**Phase 2: Core Endpoints** (Current)
- Token endpoints (search, create, enrich)
- Pool endpoints (discover, get pool data)
- Position endpoints (list, discover, import)

**Phase 3: Advanced Features**
- Logging middleware (Pino)
- Rate limiting (Vercel KV)
- Error tracking (Sentry)

**Phase 4: Type Extraction**
- Extract `src/types/` to `@midcurve/api-types`
- Publish to npm for frontend consumption

---

## Related Documentation

### Monorepo Documentation
- **[Central CLAUDE.md](../CLAUDE.md)** - Architecture, philosophy, ecosystem overview
- **[Services CLAUDE.md](../midcurve-services/CLAUDE.md)** - Business logic implementation
- **[Shared README.md](../midcurve-shared/README.md)** - Type definitions and utilities

### API Documentation
- **[README.md](README.md)** - User-facing API documentation

---

## Contributing

For contributing guidelines, git workflow, and commit message format, see:
**[Contributing Section](../CLAUDE.md#contributing)**

---

**Midcurve Finance** - Professional risk management for concentrated liquidity providers
