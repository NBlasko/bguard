import type { Config } from '@jest/types';

export default async (): Promise<Config.InitialOptions> => ({
  verbose: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '../',
  clearMocks: true,
  moduleFileExtensions: ['ts', 'js', 'json'],
  testTimeout: 30000,
  collectCoverageFrom: ['./src/**/*.ts'],
  setupFilesAfterEnv: ['./jest/setup.ts'],
  coverageReporters: ['clover', 'json-summary', 'lcov', 'text'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          importHelpers: false,
          // The root tsconfig sets isolatedModules, which ts-jest reads as "transpile only".
          // That silently disables type checking for the whole suite, and the type-level
          // assertions in jest/setup.ts are compile-time only — they assert nothing at runtime.
          // Keep this off so expectEqualTypes and @ts-expect-error are actually enforced.
          isolatedModules: false,
          strict: true,
          strictFunctionTypes: true,
          noUncheckedIndexedAccess: true,
          // Jest loads the suite as CommonJS. The root tsconfig targets node16 module resolution,
          // which ts-jest only supports alongside isolatedModules, so pin the module kind here.
          module: 'commonjs',
          moduleResolution: 'node10',
        },
      },
    ],
  },
  modulePathIgnorePatterns: [],
});
