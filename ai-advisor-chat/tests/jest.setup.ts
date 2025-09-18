// General Jest setup for tests
jest.setTimeout(30000);

// Prefer TEST_DATABASE_URL for safety; fall back to DATABASE_URL only if TEST_DATABASE_URL is not set
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

// Mock Clerk server SDK by default; individual tests can override
jest.mock('@clerk/nextjs/server', () => require('./mocks/clerk'));

