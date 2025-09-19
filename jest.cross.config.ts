import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/convex', '<rootDir>/shared', '<rootDir>/src'],
  testMatch: [
    '<rootDir>/convex/**/__tests__/**/*.(test|spec).ts',
    '<rootDir>/shared/**/__tests__/**/*.(test|spec).ts',
    '<rootDir>/src/features/**/__tests__/**/*.(test|spec).(ts|tsx)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': [
      '<rootDir>/ai-advisor-chat/node_modules/ts-jest',
      {
        tsconfig: '<rootDir>/ai-advisor-chat/tsconfig.json',
        isolatedModules: true,
      },
    ],
  },
  moduleNameMapper: {
    // Map Convex generated modules (absolute imports)
    '^convex/_generated/api(\\.js)?$': '<rootDir>/ai-advisor-chat/tests/mocks/convexApiMock.ts',
    '^convex/_generated/server(\\.js)?$': '<rootDir>/ai-advisor-chat/tests/mocks/convexServerMock.ts',
    '^convex/_generated/dataModel(\\.js)?$': '<rootDir>/ai-advisor-chat/tests/mocks/convexDataModelMock.ts',
    '^convex/values(\\.js)?$': '<rootDir>/ai-advisor-chat/tests/mocks/convexValuesMock.ts',
    '^convex/react(\\.js)?$': '<rootDir>/ai-advisor-chat/tests/mocks/convexReactMock.ts',
    // Map Convex generated modules (relative imports inside convex/* files)
    '^\./_generated/server(\\.js)?$': '<rootDir>/ai-advisor-chat/tests/mocks/convexServerMock.ts',
    '^\./_generated/dataModel(\\.js)?$': '<rootDir>/ai-advisor-chat/tests/mocks/convexDataModelMock.ts',
    // Next.js server helpers if referenced
    '^next/server(\\.js)?$': '<rootDir>/ai-advisor-chat/tests/mocks/nextServerMock.ts',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  // Run serially to avoid flakiness across directories
  maxWorkers: 1,
  // Keep console outputs for diagnostics in CI
  verbose: true,
};

export default config;

