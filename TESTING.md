# Testing the Midcurve API

This guide explains how to test the API endpoints using the provided testing script.

## Prerequisites

1. **Services seeded**: Run `npm run prisma:seed` in the services directory
2. **API running**: Run `npm run dev` in the API directory
3. **Database**: PostgreSQL running with the correct schema

## Quick Start

### 1. Seed the Database

First, create the test user and API key:

```bash
cd ../midcurve-services
npm run prisma:seed
```

This creates:
- **Test User**: Test Testmann (`test@midcurve.finance`)
- **Test API Key**: `mc_test_1234567890abcdefghijklmnopqrstuvwxyz`

### 2. Start the API Server

```bash
cd /path/to/midcurve-api
npm run dev
```

The API will be available at `http://localhost:3000`

### 3. Test an Endpoint

```bash
npm run api:request GET /api/health
```

## Using the API Request Script

The `api:request` script makes it easy to test endpoints with automatic authentication.

### Syntax

```bash
npm run api:request <METHOD> <ENDPOINT> [BODY]
```

- **METHOD**: HTTP method (GET, POST, PUT, PATCH, DELETE)
- **ENDPOINT**: API endpoint path or full URL
- **BODY**: Optional JSON body (as a single-line string)

### Examples

#### GET Requests

```bash
# Health check (no auth required)
npm run api:request GET /api/health

# Search for USD tokens on Ethereum
npm run api:request GET "/api/v1/tokens/erc20/search?chainId=1&symbol=usd"

# Search by name
npm run api:request GET "/api/v1/tokens/erc20/search?chainId=1&name=coin"

# Search by both symbol and name
npm run api:request GET "/api/v1/tokens/erc20/search?chainId=1&symbol=eth&name=wrapped"
```

**Note**: Wrap URLs with query params in quotes to prevent shell interpretation.

#### POST Requests

```bash
# Discover USDC token
npm run api:request POST /api/v1/tokens/erc20 '{"address":"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48","chainId":1}'

# Discover WETH token
npm run api:request POST /api/v1/tokens/erc20 '{"address":"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2","chainId":1}'

# Discover DAI token
npm run api:request POST /api/v1/tokens/erc20 '{"address":"0x6B175474E89094C44Da98b954EedeAC495271d0F","chainId":1}'

# Discover USDT token
npm run api:request POST /api/v1/tokens/erc20 '{"address":"0xdAC17F958D2ee523a2206206994597C13D831ec7","chainId":1}'
```

#### Full URLs

You can also provide full URLs:

```bash
# Test against local server
npm run api:request GET http://localhost:3000/api/health

# Test against production (if deployed)
npm run api:request GET https://api.midcurve.finance/api/health
```

## Common Test Scenarios

### Scenario 1: Discover and Search Tokens

```bash
# 1. Discover USDC
npm run api:request POST /api/v1/tokens/erc20 '{"address":"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48","chainId":1}'

# 2. Discover USDT
npm run api:request POST /api/v1/tokens/erc20 '{"address":"0xdAC17F958D2ee523a2206206994597C13D831ec7","chainId":1}'

# 3. Search for USD tokens
npm run api:request GET "/api/v1/tokens/erc20/search?chainId=1&symbol=usd"
```

### Scenario 2: Error Handling

```bash
# Invalid address format (should return 400 VALIDATION_ERROR)
npm run api:request POST /api/v1/tokens/erc20 '{"address":"invalid","chainId":1}'

# Missing search parameters (should return 400 VALIDATION_ERROR)
npm run api:request GET "/api/v1/tokens/erc20/search?chainId=1"

# Missing chainId (should return 400 VALIDATION_ERROR)
npm run api:request GET "/api/v1/tokens/erc20/search?symbol=usd"
```

### Scenario 3: Idempotent Discover

```bash
# Discover USDC first time
npm run api:request POST /api/v1/tokens/erc20 '{"address":"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48","chainId":1}'

# Discover USDC again (should return existing token, same ID)
npm run api:request POST /api/v1/tokens/erc20 '{"address":"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48","chainId":1}'
```

## Environment Variables

The script reads from `.env` file in the API directory. You can override defaults:

```env
# .env
TEST_API_KEY=mc_test_1234567890abcdefghijklmnopqrstuvwxyz
API_BASE_URL=http://localhost:3000
```

Or set them temporarily:

```bash
TEST_API_KEY=your-key API_BASE_URL=http://localhost:4000 npm run api:request GET /api/health
```

## Popular Test Tokens (Ethereum Mainnet)

Use these well-known token addresses for testing:

| Token | Address | Chain ID |
|-------|---------|----------|
| USDC | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | 1 |
| USDT | `0xdAC17F958D2ee523a2206206994597C13D831ec7` | 1 |
| WETH | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` | 1 |
| DAI | `0x6B175474E89094C44Da98b954EedeAC495271d0F` | 1 |
| WBTC | `0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599` | 1 |

## Troubleshooting

### "Authentication required"

**Problem**: API returns 401 UNAUTHORIZED

**Solution**: Make sure you've run the seed script:
```bash
cd ../midcurve-services
npm run prisma:seed
```

### "Chain not supported"

**Problem**: API returns 400 CHAIN_NOT_SUPPORTED

**Solution**: Add the RPC URL for that chain in `.env`:
```env
RPC_URL_ETHEREUM=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
```

Get free RPC keys from [Alchemy](https://www.alchemy.com/) or [Infura](https://www.infura.io/).

### "Token not found on CoinGecko"

**Problem**: API returns 404 TOKEN_NOT_FOUND

**Solution**: The token must be listed on CoinGecko. Use one of the popular tokens listed above for testing.

### "Database connection failed"

**Problem**: Can't connect to database

**Solution**: Ensure PostgreSQL is running and `DATABASE_URL` in `.env` is correct:
```bash
psql $DATABASE_URL -c "SELECT 1"
```

## Advanced Testing

### Using curl Directly

If you prefer curl:

```bash
API_KEY="mc_test_1234567890abcdefghijklmnopqrstuvwxyz"

# GET request
curl "http://localhost:3000/api/v1/tokens/erc20/search?chainId=1&symbol=usd" \
  -H "Authorization: Bearer $API_KEY"

# POST request
curl -X POST http://localhost:3000/api/v1/tokens/erc20 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"address":"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48","chainId":1}'
```

### Using Thunder Client (VS Code)

1. Install Thunder Client extension
2. Create new request
3. Set headers:
   - `Authorization`: `Bearer mc_test_1234567890abcdefghijklmnopqrstuvwxyz`
   - `Content-Type`: `application/json` (for POST)
4. Send request

### Using Postman

Same as Thunder Client, just in Postman instead.

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

## API Documentation

For complete API documentation, see [README.md](README.md#available-endpoints).
