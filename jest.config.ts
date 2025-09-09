import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.spec.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
      tsconfig: {
        esModuleInterop: true,
        module: 'commonjs',
        target: 'ES2020',
        moduleResolution: 'node',
        allowJs: true,
        noEmit: true,
      },
    },
  },
  maxWorkers: 1,
};

export default config;

