import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 100000,
    setupFiles: ['src/test.setup.ts'],
    include: ['src/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
})
