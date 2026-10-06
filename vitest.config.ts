import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    isolate: true,
    globalSetup: ['./tests/globalSetup.ts'],
    setupFiles: ['./tests/setup.ts'],
    reporters: ['tree'],
    pool: 'threads',
    fileParallelism: false,
    maxConcurrency: 1,
    hookTimeout: 30000,
    include: ['tests/unit/*.{test,spec}.{ts,js}'],
    environment: 'node',
    maxWorkers: 1,
    sequence: {
      concurrent: false,
      shuffle: false
    },
    alias: {
      '~~/server': './server/'
    }
  }
})
