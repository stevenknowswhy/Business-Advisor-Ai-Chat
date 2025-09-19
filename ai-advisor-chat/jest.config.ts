import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: [
    '<rootDir>',
    '<rootDir>/../convex',
    '<rootDir>/../shared',
    '<rootDir>/../src'
  ],
  testMatch: [
    '**/tests/**/*.spec.ts',
    '**/tests/**/*.spec.tsx',
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
    '**/__tests__/**/*.spec.ts',
    '**/__tests__/**/*.spec.tsx',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^~/(.*)$': '<rootDir>/src/$1',
    // Mock Convex generated modules and values
    '^(.*)/convex/_generated/api(\\.js)?$': '<rootDir>/tests/mocks/convexApiMock.ts',
    '^(.*)/convex/_generated/dataModel$': '<rootDir>/tests/mocks/convexDataModelMock.ts',
    '^convex/values$': '<rootDir>/tests/mocks/convexValuesMock.ts',
    '^convex/react$': '<rootDir>/tests/mocks/convexReactMock.ts',
    // Convex server shim for actions/queries in unit tests
    '^\./_generated/server$': '<rootDir>/tests/mocks/convexServerMock.ts',
    '^(.*)/_generated/server$': '<rootDir>/tests/mocks/convexServerMock.ts',
    // Map missing app alias to a mock when referenced in some tests
    '^~\/lib\/convex-api$': '<rootDir>/tests/mocks/convexApiMock.ts',
    // Next server polyfills when needed
    '^next/server$': '<rootDir>/tests/mocks/nextServerMock.ts',
    '^~/components/advisors$': '<rootDir>/tests/mocks/advisorsBarrelMock.ts',
    '^@/server/convex/client$': '<rootDir>/tests/mocks/convexServerClientMock.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      isolatedModules: true,
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        module: 'commonjs',
        target: 'ES2020',
        moduleResolution: 'node',
        allowJs: true,
        noEmit: true,
      },
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
  ],
  maxWorkers: 1,
};

export default config;

