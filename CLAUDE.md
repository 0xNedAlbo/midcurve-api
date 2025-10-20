# Midcurve API

## Project Overview

**Midcurve API** is the RESTful API layer for **Midcurve Finance**, a comprehensive risk management platform for concentrated liquidity (CL) provisioning across multiple blockchain ecosystems (Ethereum, BSC, Solana).

This API serves as the primary interface between frontend applications and the Midcurve platform, providing endpoints for token/pool discovery, position tracking, PnL analytics, and automated rebalancing.

## Midcurve Finance Ecosystem

```
┌──────────────────────────────────────────────────────┐
│            Midcurve Finance Product Suite            │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────────┐         ┌──────────────┐       │
│  │   UI/Frontend   │────────▶│  API (this)  │       │
│  │   (Next.js)     │   HTTP  │   (Vercel)   │       │
│  └─────────────────┘         └──────┬───────┘       │
│                                     │               │
│                            ┌────────▼─────────┐     │
│                            │ @midcurve/shared │     │
│                            │ Types + Utils    │     │
│                            └────────┬─────────┘     │
│                                     │               │
│                            ┌────────▼──────────┐    │
│                            │@midcurve/services │    │
│                            │  Business Logic   │    │
│                            └────────┬──────────┘    │
│                                     │               │
│                            ┌────────▼─────────┐     │
│                            │    PostgreSQL     │     │
│                            └──────────────────┘     │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Repository Structure

| Repository | Purpose | Consumed By |
|------------|---------|-------------|
| **@midcurve/shared** | Pure types + utilities (no DB/services) | API, UI, Services, Workers |
| **@midcurve/services** | Business logic + DB operations (Prisma) | API, Workers |
| **@midcurve/api** (this) | RESTful API endpoints | UI, External clients |
| **@midcurve/api-types** | API request/response types (future) | UI, External clients |

## Purpose of This API Project

**What it does:**
- Exposes REST endpoints for frontend consumption
- Validates requests with Zod schemas
- Delegates business logic to `@midcurve/services`
- Returns standardized JSON responses
- Handles authentication (NextAuth + API keys)
- Deployed as serverless functions on Vercel

**What it does NOT do:**
- Direct database access (uses services layer)
- Business logic implementation (delegates to services)
- Complex calculations (uses shared utilities)

## Prisma Schema Management & Peer Dependencies

**Important:** This project does NOT maintain its own Prisma schema. Instead:

1. **Schema Source:** The Prisma schema is maintained in `@midcurve/services/prisma/schema.prisma`
2. **Auto-Sync:** During `npm install` (postinstall hook), the schema is automatically:
   - Copied from services repo
   - Modified to output the Prisma client to this project's `node_modules`
   - Generated via `prisma generate`
3. **Manual Sync:** If the services schema changes, run `npm run prisma:generate` to resync
4. **Script:** The sync logic is in `scripts/sync-prisma-schema.sh`

**Peer Dependency Pattern:**
- `@midcurve/services` declares `@prisma/client` as a **peer dependency**
- This API project installs `@prisma/client` directly (satisfying the peer dependency)
- Services uses the API's Prisma client instance (no duplication)
- Single source of truth for database models

This ensures all projects (API, workers, etc.) use the exact same schema definition while generating their own Prisma clients, with services consuming the client from the parent project.

## Project Structure

```
midcurve-api/
├── src/
│   ├── app/
│   │   └── api/              # Next.js API routes (App Router)
│   │       ├── health/       # GET /api/health
│   │       └── v1/           # Versioned endpoints (future)
│   │           ├── tokens/
│   │           ├── pools/
│   │           └── positions/
│   │
│   ├── types/                # API types (future @midcurve/api-types)
│   │   ├── common/           # ApiResponse<T>, ApiError, Pagination
│   │   ├── health/           # Health endpoint types
│   │   ├── tokens/           # Token endpoints types
│   │   ├── pools/            # Pool endpoints types
│   │   └── positions/        # Position endpoints types
│   │
│   ├── middleware/           # API middleware
│   │   ├── with-auth.ts      # Authentication (session + API key)
│   │   ├── with-logging.ts   # Request logging (Pino)
│   │   └── with-validation.ts # Zod validation wrapper
│   │
│   ├── utils/                # Utilities
│   │   ├── errors.ts         # Error handling helpers
│   │   └── response.ts       # Response helpers
│   │
│   └── config/               # Configuration
│       └── constants.ts      # API constants
│
├── .env.example
├── package.json
├── tsconfig.json
├── next.config.ts
└── vercel.json
```

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

**Why?** Makes it easy to:
1. Find all types for a specific endpoint
2. Extract to `@midcurve/api-types` package later
3. Keep related schemas together

## Type Architecture: Shared Types vs Prisma Types

**Important Design Decision:** API types come from `@midcurve/shared`, NOT from `@prisma/client`.

### Type Source Hierarchy

```typescript
// ✅ Correct: Import from @midcurve/shared
import type { AuthWalletAddress, User } from '@midcurve/shared';

// ❌ Wrong: Import from @prisma/client
import type { AuthWalletAddress } from '@prisma/client';

// ❌ Wrong: Define locally
export interface WalletAddress { /* ... */ }
```

**Reasons:**
1. **Shared Contract** - Types shared across API, UI, workers (all consumers)
2. **Portable** - No Prisma dependency, works in browsers
3. **Framework-agnostic** - Pure TypeScript types, no ORM coupling
4. **Single Source of Truth** - Defined once in shared, used everywhere
5. **Future-proof** - Can extract to `@midcurve/api-types` without changes

### Layer Separation

```
┌─────────────────────────────────────┐
│     @midcurve/shared (Types)        │  ← Pure types (no dependencies)
│  - AuthWalletAddress                │
│  - User, Token, Pool, Position      │
└─────────────────────────────────────┘
           ↑ imports          ↑ imports
           │                  │
┌──────────┴────────┐  ┌──────┴─────────────┐
│  @midcurve/api    │  │ @midcurve/services │
│  (REST endpoints) │  │ (Business logic)   │
└───────────────────┘  └────────────────────┘
                              ↓ uses
                    ┌─────────────────────┐
                    │  @prisma/client     │
                    │  (Database layer)   │
                    └─────────────────────┘
```

**Services layer** uses both:
- `@midcurve/shared` types for portable data structures
- `@prisma/client` types internally for database operations
- Converts between them when necessary (usually they match exactly)

## Dependencies

### Local Packages (Yalc)

```json
{
  "@midcurve/services": "file:.yalc/@midcurve/services",
  "@midcurve/shared": "file:../midcurve-shared"
}
```

- **@midcurve/shared** - Core types (Token, Pool, Position) and utilities (file: reference)
- **@midcurve/services** - Business logic (TokenService, PoolService, etc.) (yalc managed)

**Why yalc for services?**
- Services declares `@prisma/client` as a peer dependency
- Yalc's copy mechanism ensures services uses API's Prisma client (no duplication)
- Verifies correct packaging before consumption
- Consistent with how services consumes shared

**Development workflow:**
```bash
# In services repo after making changes:
cd ../midcurve-services
npm run yalc:push  # Builds and updates all consumers

# In API repo:
npm run yalc:update  # Pull latest from yalc store
```

### External Dependencies

- **next@^15.5.0** - Framework (serverless functions)
- **react@^19.0.0** - Required by Next.js
- **zod@^3.22.0** - Runtime validation + type inference
- **typescript@^5.3.3** - Strict type checking

### Future Dependencies

- **next-auth@^5.0.0** - Authentication
- **pino@^10.0.0** - Logging
- **@vercel/kv** - Rate limiting (Vercel KV)

## Standard Response Format

All endpoints return consistent JSON:

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
   export async function POST(request: NextRequest) {
     // 1. Parse/validate request
     const body = CreateTokenRequestSchema.parse(await request.json());

     // 2. Call service
     const token = await tokenService.create(body);

     // 3. Return response
     return NextResponse.json(createSuccessResponse(token));
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

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection (shared with services)
- `NODE_ENV` - Environment (development/production)

Optional:
- `RPC_URL_*` - EVM chain RPC endpoints (inherited from services)
- `COINGECKO_API_KEY` - Token enrichment
- `NEXTAUTH_SECRET` - Authentication secret
- `KV_*` - Vercel KV for rate limiting

## Deployment (Vercel)

**Automatic:**
1. Push to GitHub
2. Vercel deploys automatically
3. Serverless functions created for each route

**Manual:**
```bash
npm run build
vercel --prod
```

**Configuration:**
- Region: `iad1` (US East)
- Max Duration: 10 seconds
- Memory: 1024 MB
- See [vercel.json](vercel.json) for full config

## Code Style

- **TypeScript strict mode** - All code strictly typed
- **ESM modules** - import/export (no require)
- **Async/await** - No callbacks
- **Error handling** - Try/catch with standardized error responses
- **Path aliases** - `@/` for src directory

## Future Roadmap

**Phase 1: Foundation** ✅
- Project structure
- Type system
- Health endpoint

**Phase 2: Core Endpoints** (Next)
- Token endpoints (search, create, enrich)
- Pool endpoints (discover, get pool data)
- Position endpoints (list, discover, import)

**Phase 3: Advanced Features**
- Authentication middleware (NextAuth + API keys)
- Logging middleware (Pino)
- Rate limiting (Vercel KV)

**Phase 4: Type Extraction**
- Extract `src/types/` to `@midcurve/api-types`
- Publish to npm
- Frontend imports types directly

## Related Documentation

- **Business Logic**: See [midcurve-services/CLAUDE.md](../midcurve-services/CLAUDE.md)
- **Shared Types**: See [midcurve-shared/README.md](../midcurve-shared/README.md)
- **API Documentation**: See [README.md](README.md)

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
```

## Key Principles

1. **Thin API layer** - Delegate to services, don't duplicate logic
2. **Type safety** - Zod validation + TypeScript
3. **Endpoint-based types** - Organize by endpoint, not by kind
4. **Consistent responses** - Standard format everywhere
5. **Stateless** - Each request independent (serverless-friendly)
6. **Fail fast** - Validate early, return clear errors
