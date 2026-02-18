import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    maxConcurrency: 1,
    maxWorkers: 1,
    sequence: {
      concurrent: false
    },
    projects: [
      {
        test: {
          name: 'unit',
          include: ['tests/unit/*.{test,spec}.{ts,js}'],
          environment: 'node'
        }
      },
      await defineVitestProject({
        resolve: {
          alias: {
            'bun:test': resolve('./vitest.config.ts'),
            '~~/': resolve('./')
          }
        },
        test: {
          maxConcurrency: 1,
          name: 'nuxt',
          include: ['tests/nuxt/*.{test,spec}.{ts,js}'],
          environment: 'nuxt',
          sequence: {
            concurrent: false,
          }
        }
      })
    ]
  }
})
