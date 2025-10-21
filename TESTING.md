# Testing the Midcurve API

This guide covers both **automated E2E tests** (recommended) and **manual testing** with the API request script.

---

## Automated E2E Testing (Recommended)

The E2E test suite tests API endpoints by making actual HTTP requests to a running Next.js server. Tests use a separate test database to avoid interfering with development data.

### Prerequisites

1. **Docker** - Required for running the test database
2. **Node.js 18+** - Required for running the server and tests

### One-Time Setup

#### 1. Start the Test Database

The test database runs in a Docker container on port **5434** (different from services test DB on 5433):

```bash
npm run db:test:up
```

This creates a PostgreSQL database with:
- Database: `midcurve_api_test`
- User: `testuser`
- Password: `testpass`
- Port: `5434`

#### 2. Verify Environment Configuration

The `.env.test` file should already exist. If not, copy from the example:

```bash
cp .env.test.example .env.test
```

### Running E2E Tests

**Two-Terminal Approach (Recommended):**

E2E tests require a running Next.js server. Use two terminals:

**Terminal 1 - Start the Dev Server:**
```bash
npm run dev
```

**Terminal 2 - Run the Tests:**
```bash
# Run tests in watch mode (re-runs on file changes)
npm test

# Or run tests once (CI-friendly)
npm run test:run
```

### Test Structure

```
src/
├── app/
│   └── api/
│       └── health/
│           ├── route.ts              # Health endpoint implementation
│           └── health.e2e.test.ts    # E2E tests (9 tests)
└── test/
    ├── global-setup.ts               # Test initialization (runs once)
    ├── helpers.ts                    # Test utilities and HTTP helpers
    └── ...
```

### Current Test Coverage

- **Health endpoint** - 9 tests covering:
  - HTTP 200 response
  - JSON response structure
  - Response fields (status, timestamp, environment, uptime)
  - No authentication required
  - Cache-control headers

### Writing New E2E Tests

Create test files with the `.e2e.test.ts` suffix:

```typescript
// src/app/api/your-endpoint/your-endpoint.e2e.test.ts
import { describe, it, expect } from 'vitest';
import { authenticatedGet, parseJsonResponse, TEST_API_KEY } from '@/test/helpers';

describe('GET /api/your-endpoint', () => {
  it('should return 200 OK', async () => {
    const response = await authenticatedGet('/api/your-endpoint');
    expect(response.status).toBe(200);
  });
});
```

**Available Test Helpers:**

```typescript
import {
  // HTTP Helpers
  unauthenticatedGet,      // GET without auth
  authenticatedGet,        // GET with API key
  authenticatedPost,       // POST with API key
  parseJsonResponse,       // Parse JSON response

  // Test Constants
  TEST_API_KEY,           // 'mc_test_1234567890abcdefghijklmnopqrstuvwxyz'
  TEST_USER_ID,           // 'test-user-api-e2e'
  TEST_WALLET_ADDRESS,    // '0x1234567890123456789012345678901234567890'
  API_BASE_URL,           // 'http://localhost:3000'

  // Database Utilities
  getPrismaClient,        // Get Prisma client
  clearDatabase,          // Clear all test data
} from '@/test/helpers';
```

### Test Database Management

**Reset Test Database:**
```bash
npm run db:test:reset  # Stop, remove, and restart fresh
```

**Manually Seed Test Database:**
```bash
npm run prisma:seed    # Creates test user, wallet, API key
```

**View Test Data:**
```bash
export DATABASE_URL="postgresql://testuser:testpass@localhost:5434/midcurve_api_test?schema=public"
npx prisma studio
```

### Troubleshooting E2E Tests

**Tests fail with "ECONNREFUSED":**
- Make sure the Next.js dev server is running: `npm run dev`

**Tests fail with database errors:**
- Reset the test database: `npm run db:test:reset`

**Seed data not found:**
- The global setup should create seed data automatically
- If not, run manually: `npm run prisma:seed`

---

## Manual Testing with API Request Script

For quick manual testing, use the `api:request` script.

### Prerequisites

1. **Database seeded**: Run `npm run prisma:seed` (in API directory, not services!)
2. **API running**: Run `npm run dev`

### Quick Start

**1. Seed the Test Database:**

```bash
npm run db:test:up      # Start test database
npm run prisma:seed     # Create test user and API key
```

This creates:
- **Test User**: E2E Test User (`e2e-test@midcurve.finance`)
- **Test Wallet**: `0x1234567890123456789012345678901234567890`
- **Test API Key**: `mc_test_1234567890abcdefghijklmnopqrstuvwxyz`

**2. Start the API Server:**

```bash
npm run dev
```

**3. Test an Endpoint:**

```bash
npm run api:request GET /api/health
```

### API Request Script Usage

**Syntax:**
```bash
npm run api:request <METHOD> <ENDPOINT> [BODY]
```

**Examples:**

```bash
# Health check (no auth required)
npm run api:request GET /api/health

# Get current user (requires auth)
npm run api:request GET /api/v1/user/me

# Search tokens
npm run api:request GET "/api/v1/tokens/erc20/search?chainId=1&symbol=usd"

# Discover token
npm run api:request POST /api/v1/tokens/erc20 '{"address":"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48","chainId":1}'
```

**Note**: Wrap URLs with query params in quotes to prevent shell interpretation.

### Popular Test Tokens (Ethereum Mainnet)

| Token | Address | Chain ID |
|-------|---------|----------|
| USDC | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | 1 |
| USDT | `0xdAC17F958D2ee523a2206206994597C13D831ec7` | 1 |
| WETH | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` | 1 |
| DAI | `0x6B175474E89094C44Da98b954EedeAC495271d0F` | 1 |
| WBTC | `0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599` | 1 |

### Using curl Directly

```bash
API_KEY="mc_test_1234567890abcdefghijklmnopqrstuvwxyz"

# GET request
curl "http://localhost:3000/api/health"

# GET with authentication
curl "http://localhost:3000/api/v1/user/me" \
  -H "Authorization: Bearer $API_KEY"

# POST request
curl -X POST http://localhost:3000/api/v1/tokens/erc20 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"address":"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48","chainId":1}'
```

---

## Expected Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2025-01-20T12:00:00.000Z"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [...]
  },
  "meta": {
    "timestamp": "2025-01-20T12:00:00.000Z"
  }
}
```

---

## Common Issues

### "Authentication required" (401 UNAUTHORIZED)

**Solution**: Make sure you've run the seed script:
```bash
npm run prisma:seed
```

### "Chain not supported" (400 CHAIN_NOT_SUPPORTED)

**Solution**: Add the RPC URL for that chain in `.env`:
```env
RPC_URL_ETHEREUM=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
```

Get free RPC keys from [Alchemy](https://www.alchemy.com/) or [Infura](https://www.infura.io/).

### "Database connection failed"

**Solution**: Ensure PostgreSQL is running and `DATABASE_URL` in `.env` is correct:
```bash
psql $DATABASE_URL -c "SELECT 1"
```

---

## Next Steps

- **Add more E2E tests** - Test authenticated endpoints, error cases
- **CI/CD integration** - Add GitHub Actions workflow
- **Test coverage reports** - Track test coverage metrics
- **Performance testing** - Load test critical endpoints

For complete API documentation, see the main [README.md](README.md).
