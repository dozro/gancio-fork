import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    reporters: ['tree'],
    pool: 'threads',
    fileParallelism: false,
    maxConcurrency: 1,
    hookTimeout: 30000,
    maxWorkers: 1,
    sequence: {
      concurrent: false,
      shuffle: false
    },
    projects: [
      {
        resolve: {
          alias: {
            '~~/server': './server/'
          }
        },
        test: {
          name: 'unit',
          include: ['tests/unit/*.{test,spec}.{ts,js}'],
          environment: 'node'
        }
      }
    ]
  }
})
