#!/usr/bin/env tsx

/**
 * API Request Script
 *
 * A simple command-line tool to test API endpoints with authentication.
 *
 * Usage:
 *   npm run api:request <method> <endpoint> [body]
 *
 * Examples:
 *   npm run api:request GET /api/health
 *   npm run api:request GET /api/v1/tokens/erc20/search?chainId=1&symbol=usd
 *   npm run api:request POST /api/v1/tokens/erc20 '{"address":"0xA0b8...","chainId":1}'
 *   npm run api:request GET http://localhost:3000/api/health
 *   npm run api:request POST https://api.midcurve.finance/api/v1/tokens/erc20 '{"address":"..."}'
 */

import { config } from 'dotenv';

// Load .env file from project root (tsx runs from project root)
config();

// Default test API key from seed script (can be overridden with TEST_API_KEY env var)
const DEFAULT_API_KEY =
  process.env.TEST_API_KEY || 'mc_test_1234567890abcdefghijklmnopqrstuvwxyz';

// Default base URL (can be overridden with API_BASE_URL env var)
const DEFAULT_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

/**
 * Parse command-line arguments
 */
function parseArgs(): {
  method: string;
  url: string;
  body?: string;
} {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: npm run api:request <method> <endpoint> [body]');
    console.error('');
    console.error('Examples:');
    console.error('  npm run api:request GET /api/health');
    console.error('  npm run api:request GET /api/v1/tokens/erc20/search?chainId=1&symbol=usd');
    console.error(
      '  npm run api:request POST /api/v1/tokens/erc20 \'{"address":"0xA0b8...","chainId":1}\''
    );
    console.error('  npm run api:request GET http://localhost:3000/api/health');
    process.exit(1);
  }

  const method = args[0].toUpperCase();
  let endpoint = args[1];
  const body = args[2];

  // Validate method
  const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  if (!validMethods.includes(method)) {
    console.error(`Invalid method: ${method}`);
    console.error(`Valid methods: ${validMethods.join(', ')}`);
    process.exit(1);
  }

  // Parse endpoint to full URL
  let url: string;
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    // Full URL provided
    url = endpoint;
  } else {
    // Relative path - prepend default base URL
    if (!endpoint.startsWith('/')) {
      endpoint = '/' + endpoint;
    }
    url = DEFAULT_BASE_URL + endpoint;
  }

  return { method, url, body };
}

/**
 * Make API request
 */
async function makeRequest(
  method: string,
  url: string,
  body?: string
): Promise<void> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📤 ${method} ${url}`);
  console.log(`${'='.repeat(60)}\n`);

  // Prepare headers
  const headers: Record<string, string> = {
    Authorization: `Bearer ${DEFAULT_API_KEY}`,
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  // Prepare request options
  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = body;
    console.log('📝 Request Body:');
    try {
      console.log(JSON.stringify(JSON.parse(body), null, 2));
    } catch {
      console.log(body);
    }
    console.log('');
  }

  try {
    // Make request
    const startTime = Date.now();
    const response = await fetch(url, options);
    const duration = Date.now() - startTime;

    // Parse response
    const responseText = await response.text();
    let responseData: any;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    // Display response
    console.log(`📥 Response: ${response.status} ${response.statusText}`);
    console.log(`⏱️  Duration: ${duration}ms\n`);

    // Color-code status
    const statusColor =
      response.status >= 200 && response.status < 300
        ? '\x1b[32m' // Green
        : response.status >= 400 && response.status < 500
          ? '\x1b[33m' // Yellow
          : '\x1b[31m'; // Red
    const resetColor = '\x1b[0m';

    console.log(`${statusColor}Status: ${response.status} ${response.statusText}${resetColor}\n`);

    // Pretty-print JSON response
    if (typeof responseData === 'object') {
      console.log('Response Body:');
      console.log(JSON.stringify(responseData, null, 2));
    } else {
      console.log('Response Body:');
      console.log(responseData);
    }

    console.log(`\n${'='.repeat(60)}\n`);

    // Exit with error code if request failed
    if (!response.ok) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Request failed:');
    console.error(error instanceof Error ? error.message : String(error));
    console.log(`\n${'='.repeat(60)}\n`);
    process.exit(1);
  }
}

/**
 * Main function
 */
async function main() {
  const { method, url, body } = parseArgs();

  // Validate body if provided
  if (body) {
    try {
      JSON.parse(body);
    } catch (error) {
      console.error('❌ Invalid JSON body:');
      console.error(body);
      console.error('');
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  await makeRequest(method, url, body);
}

// Run
main();
