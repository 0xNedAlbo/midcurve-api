# Midcurve API

RESTful API for **Midcurve Finance** - a comprehensive risk management platform for concentrated liquidity (CL) provisioning across multiple blockchain ecosystems.

## Overview

The Midcurve API is a Next.js-based REST API designed for deployment on Vercel. It serves as the primary interface between frontend applications and the Midcurve Finance platform, providing endpoints for:

- Token discovery and management
- Pool discovery and analytics
- Position tracking and monitoring
- Risk calculations and PnL analytics
- Automated rebalancing strategies

## Architecture

```
┌──────────────────────────────────────────────────────┐
│            Midcurve Finance Ecosystem                │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────────┐         ┌──────────────┐       │
│  │   UI/Frontend   │────────▶│  API (this)  │       │
│  │   (Next.js)     │         │   (Vercel)   │       │
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
│                            │   (Prisma ORM)    │     │
│                            └──────────────────┘     │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## Dependencies

### Local Packages

This project depends on two local Midcurve packages:

- **[@midcurve/shared](../midcurve-shared)** - Shared types and utilities
  - Core type definitions (Token, Pool, Position, etc.)
  - EVM address utilities
  - UniswapV3 math functions
  - Framework-agnostic (works in browser, Node.js, edge runtimes)

- **[@midcurve/services](../midcurve-services)** - Business logic and CRUD operations
  - Token service (discovery, enrichment, CRUD)
  - Pool service (discovery, state management)
  - Position service (tracking, PnL, APR calculations)
  - Database access via Prisma
  - Node.js only (requires Prisma and database connection)

### External Dependencies

- **Next.js 15+** - Modern web framework with App Router
- **Zod** - Runtime validation and type inference
- **TypeScript 5.3+** - Strict type checking
- **React 19** - Required by Next.js

## Project Structure

```
midcurve-api/
├── src/
│   ├── app/
│   │   ├── api/              # API routes (App Router)
│   │   │   └── health/       # Health check endpoint
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   │
│   ├── types/                # API-specific types (future @midcurve/api-types)
│   │   ├── common/           # Shared base types
│   │   │   ├── api-response.ts    # ApiResponse<T>, ApiError
│   │   │   ├── pagination.ts      # PaginatedResponse<T>
│   │   │   └── index.ts
│   │   ├── health/           # Health endpoint types
│   │   │   ├── health.schema.ts   # Zod schemas
│   │   │   ├── health.types.ts    # TypeScript types
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── middleware/           # API middleware (future)
│   ├── utils/                  # Utilities (future)
│   └── config/               # Configuration (future)
│
├── .env.example              # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json             # TypeScript strict mode config
├── next.config.ts            # Next.js configuration
├── vercel.json               # Vercel deployment config
└── README.md
```

## Type System Organization

Types are organized **by endpoint** rather than by request/response/error. This makes it easier to:

1. Find all types related to a specific endpoint
2. Extract types to `@midcurve/api-types` package later
3. Maintain consistency across request/response schemas

**Pattern:**
```
types/
├── common/                   # Shared across all endpoints
│   ├── api-response.ts       # Generic ApiResponse<T>, ApiError
│   └── pagination.ts         # PaginatedResponse<T>
│
└── {endpoint}/               # Endpoint-specific types
    ├── {operation}.schema.ts # Zod schemas for validation
    ├── {operation}.types.ts  # TypeScript types
    └── index.ts              # Barrel exports
```

**Example:**
```
types/tokens/
├── create.schema.ts          # POST /api/tokens validation
├── create.types.ts           # POST /api/tokens types
├── search.schema.ts          # GET /api/tokens/search validation
├── search.types.ts           # GET /api/tokens/search types
└── index.ts
```

## Getting Started

### Prerequisites

1. **Node.js 18+** installed
2. **PostgreSQL database** running (shared with @midcurve/services)
3. **@midcurve/shared** package built (`cd ../midcurve-shared && npm run build`)
4. **@midcurve/services** package built (`cd ../midcurve-services && npm run build`)

### Installation

```bash
# Install dependencies (automatically syncs and generates Prisma client)
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
# (DATABASE_URL, RPC URLs, etc.)
```

**Note on Prisma Schema:**
This project references the Prisma schema from `@midcurve/services`. During `npm install`, the schema is automatically:
1. Copied from `../midcurve-services/prisma/schema.prisma`
2. Modified to generate the client to this project's `node_modules`
3. Generated via `prisma generate`

If the services schema changes, run `npm run prisma:generate` to resync.

**Note on Yalc (Local Package Management):**
This project uses **yalc** to consume `@midcurve/services`:
- Services declares `@prisma/client` as a peer dependency
- This ensures single Prisma client instance (no duplication)
- After changes to services, run `npm run yalc:push` in services repo to update API

### Development

```bash
# Run development server with Turbopack
npm run dev

# Open http://localhost:3000
# API available at http://localhost:3000/api/health
```

**Working with local services changes:**

```bash
# In services repo, after making changes:
cd ../midcurve-services
npm run yalc:push

# API automatically picks up changes
# (or run npm run yalc:update in API repo)
```

### Building

```bash
# Type check
npm run type-check

# Build for production
npm run build

# Start production server
npm start
```

## Available Endpoints

### Health Check

**GET /api/health**

Returns the health status of the API service.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-10-20T12:00:00.000Z",
    "environment": "production",
    "version": "0.1.0",
    "uptime": 12345.67
  },
  "meta": {
    "timestamp": "2025-10-20T12:00:00.000Z"
  }
}
```

**Status Codes:**
- `200 OK` - Service is healthy

**Authentication:** None required

---

### Token Management

#### POST /api/v1/tokens/erc20

Discover and create an ERC-20 token. Reads metadata from on-chain contract and enriches with CoinGecko data.

**Authentication:** Required (session or API key)

**Request Body:**
```json
{
  "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  "chainId": 1
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "clxyz123",
    "tokenType": "erc20",
    "name": "USD Coin",
    "symbol": "USDC",
    "decimals": 6,
    "logoUrl": "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png",
    "coingeckoId": "usd-coin",
    "marketCap": 32456789000,
    "config": {
      "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "chainId": 1
    },
    "createdAt": "2025-01-20T12:00:00.000Z",
    "updatedAt": "2025-01-20T12:00:00.000Z"
  },
  "meta": {
    "timestamp": "2025-01-20T12:00:00.000Z"
  }
}
```

**Status Codes:**
- `200 OK` - Token discovered successfully (or already exists)
- `400 BAD_REQUEST` - Invalid address, chain not supported, or not ERC-20
- `401 UNAUTHORIZED` - Authentication required
- `404 TOKEN_NOT_FOUND` - Token not listed on CoinGecko
- `500 INTERNAL_SERVER_ERROR` - Server error

**Notes:**
- Token must be listed on CoinGecko for discovery
- Idempotent - returns existing token if already discovered
- Address is normalized to EIP-55 checksum format
- All tokens are public (visible to all authenticated users)

---

#### GET /api/v1/tokens/erc20/search

Search for ERC-20 tokens within a specific chain by symbol and/or name.

**Authentication:** Required (session or API key)

**Query Parameters:**
- `chainId` (required) - EVM chain ID to search within
- `symbol` (optional) - Partial symbol match (case-insensitive)
- `name` (optional) - Partial name match (case-insensitive)
- At least one of `symbol` or `name` must be provided

**Example:**
```
GET /api/v1/tokens/erc20/search?chainId=1&symbol=usd
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clxyz123",
      "tokenType": "erc20",
      "name": "USD Coin",
      "symbol": "USDC",
      "decimals": 6,
      "logoUrl": "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png",
      "coingeckoId": "usd-coin",
      "marketCap": 32456789000,
      "config": {
        "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        "chainId": 1
      },
      "createdAt": "2025-01-20T12:00:00.000Z",
      "updatedAt": "2025-01-20T12:00:00.000Z"
    },
    {
      "id": "clxyz456",
      "tokenType": "erc20",
      "name": "Tether USD",
      "symbol": "USDT",
      "decimals": 6,
      "logoUrl": "https://assets.coingecko.com/coins/images/325/large/Tether.png",
      "coingeckoId": "tether",
      "marketCap": 95123456000,
      "config": {
        "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        "chainId": 1
      },
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z"
    }
  ],
  "meta": {
    "count": 2,
    "limit": 10,
    "timestamp": "2025-01-20T12:00:00.000Z"
  }
}
```

**Status Codes:**
- `200 OK` - Search successful (may return empty array)
- `400 VALIDATION_ERROR` - Missing required params or invalid format
- `401 UNAUTHORIZED` - Authentication required
- `500 INTERNAL_SERVER_ERROR` - Server error

**Notes:**
- Returns maximum 10 results, ordered alphabetically by symbol
- No pagination - users should provide more specific search terms
- Search is case-insensitive and matches partial strings
- Only searches within the specified chain

---

*More endpoints will be added incrementally.*

## API Response Format

All API endpoints follow a consistent response format:

### Success Response

```typescript
{
  success: true,
  data: T,              // Response data (type varies by endpoint)
  meta?: {
    requestId?: string,
    timestamp: string,
    [key: string]: unknown
  }
}
```

### Error Response

```typescript
{
  success: false,
  error: {
    code: string,       // Error code (e.g., "BAD_REQUEST")
    message: string,    // Human-readable message
    details?: unknown   // Optional additional details
  },
  meta?: {
    requestId?: string,
    timestamp: string
  }
}
```

### Paginated Response

```typescript
{
  success: true,
  data: T[],            // Array of items
  pagination: {
    total: number,      // Total count
    limit: number,      // Items per page
    offset: number,     // Current offset
    hasMore: boolean    // More items available
  },
  meta?: {
    requestId?: string,
    timestamp: string
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `BAD_REQUEST` | 400 | Invalid request parameters |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `UNPROCESSABLE_ENTITY` | 422 | Validation failed |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |
| `VALIDATION_ERROR` | 400 | Zod schema validation failed |
| `TOKEN_NOT_FOUND` | 404 | Token not found |
| `POOL_NOT_FOUND` | 404 | Pool not found |
| `POSITION_NOT_FOUND` | 404 | Position not found |
| `CHAIN_NOT_SUPPORTED` | 400 | Blockchain not supported |
| `INVALID_ADDRESS` | 400 | Invalid EVM address format |

## Deployment

### Vercel

This project is designed for deployment on Vercel:

1. **Connect Repository** to Vercel
2. **Configure Environment Variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - `production`
- RPC URLs for supported chains (optional)
- CoinGecko API key (optional)

**Serverless Function Settings:**
- Region: `iad1` (US East)
- Max Duration: 10 seconds
- Memory: 1024 MB

### Manual Deployment

```bash
# Build the project
npm run build

# Deploy to Vercel
vercel --prod
```

## Future Roadmap

### Phase 1: Foundation (Current)
- ✅ Project structure
- ✅ Type system with endpoint-based organization
- ✅ Health check endpoint
- ✅ Vercel deployment configuration

### Phase 2: Core API Endpoints
- Token management endpoints
- Pool discovery endpoints
- Position tracking endpoints
- Authentication middleware
- Logging middleware

### Phase 3: Advanced Features
- Rate limiting (Vercel KV)
- API key management
- Webhook support
- Real-time updates (WebSockets/SSE)

### Phase 4: Type Package Extraction
- Extract `src/types/` to `@midcurve/api-types` package
- Publish to npm for frontend consumption
- Version and maintain independently

## Development Philosophy

1. **Type Safety First** - Leverage TypeScript and Zod for runtime validation
2. **Endpoint-Based Types** - Organize types by endpoint for clarity
3. **Consistent Responses** - Standard format across all endpoints
4. **Incremental Development** - Add endpoints step by step
5. **Future-Proof** - Design for type extraction to separate package

## Related Projects

- **[midcurve-services](../midcurve-services)** - Business logic and database operations
- **[midcurve-shared](../midcurve-shared)** - Shared types and utilities
- **midcurve-ui** - Frontend application (coming soon)
- **@midcurve/api-types** - API types package (will be extracted from this repo)

## License

MIT License - Midcurve Finance
